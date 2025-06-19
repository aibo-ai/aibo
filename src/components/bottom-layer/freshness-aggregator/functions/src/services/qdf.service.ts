import { CacheService } from "./cache.service";

export interface Document {
  id: string;
  title: string;
  content: string;
  publishedAt: Date;
  lastModified: Date;
  contentType: string;
  popularity: number;
  tags: string[];
  url?: string;
}

export interface QdfOptions {
  maxResults?: number;
  freshnessWeight?: number;
  popularityWeight?: number;
  contentTypes?: string[];
  minFreshnessScore?: number;
}

export interface QdfResult {
  document: Document;
  score: number;
  freshnessScore: number;
  popularityScore: number;
  relevanceScore: number;
}

export class QdfService {
  private readonly defaultOptions: Required<QdfOptions> = {
    maxResults: 10,
    freshnessWeight: 0.4,
    popularityWeight: 0.3,
    contentTypes: ["article", "blog", "news", "documentation"],
    minFreshnessScore: 0.1
  };

  constructor(private cacheService: CacheService) {}

  /**
   * Process a query using the QDF algorithm
   */
  async processQuery(query: string, options: QdfOptions = {}): Promise<QdfResult[]> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateCacheKey(query, opts);

    // Try to get from cache first
    const cached = await this.cacheService.getOrSet(
      cacheKey,
      async () => {
        // Retrieve documents (this would be replaced with actual document retrieval)
        const documents = await this.retrieveDocuments(query);
        
        // Filter documents by content type
        const filteredDocs = this.filterByContentType(documents, opts.contentTypes);
        
        // Calculate QDF scores
        const scoredResults = this.calculateQdfScores(filteredDocs, query, opts);
        
        // Filter by minimum freshness score
        const qualifiedResults = scoredResults.filter(
          result => result.freshnessScore >= opts.minFreshnessScore
        );
        
        // Sort by combined score and limit results
        return qualifiedResults
          .sort((a, b) => b.score - a.score)
          .slice(0, opts.maxResults);
      },
      parseInt(process.env.CACHE_TTL_SECONDS || "3600")
    );

    return cached;
  }

  /**
   * Retrieve documents based on query (mock implementation)
   */
  private async retrieveDocuments(query: string): Promise<Document[]> {
    // This is a mock implementation - replace with actual document retrieval
    const mockDocuments: Document[] = [
      {
        id: "doc1",
        title: "Latest Azure Functions Updates",
        content: "Azure Functions now supports TypeScript 4.0 and improved monitoring...",
        publishedAt: new Date("2024-01-15"),
        lastModified: new Date("2024-01-16"),
        contentType: "article",
        popularity: 85,
        tags: ["azure", "functions", "typescript"],
        url: "https://example.com/azure-functions-updates"
      },
      {
        id: "doc2",
        title: "Cosmos DB Performance Optimization",
        content: "Learn how to optimize your Cosmos DB queries for better performance...",
        publishedAt: new Date("2024-01-10"),
        lastModified: new Date("2024-01-12"),
        contentType: "documentation",
        popularity: 92,
        tags: ["cosmos", "database", "performance"],
        url: "https://example.com/cosmos-optimization"
      },
      {
        id: "doc3",
        title: "Building Serverless Applications",
        content: "A comprehensive guide to building serverless applications with Azure...",
        publishedAt: new Date("2023-12-20"),
        lastModified: new Date("2023-12-22"),
        contentType: "blog",
        popularity: 78,
        tags: ["serverless", "azure", "architecture"],
        url: "https://example.com/serverless-guide"
      }
    ];

    // Simple keyword matching for demo
    const queryLower = query.toLowerCase();
    return mockDocuments.filter(doc => 
      doc.title.toLowerCase().includes(queryLower) ||
      doc.content.toLowerCase().includes(queryLower) ||
      doc.tags.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  /**
   * Filter documents by content type
   */
  private filterByContentType(documents: Document[], allowedTypes: string[]): Document[] {
    return documents.filter(doc => allowedTypes.includes(doc.contentType));
  }

  /**
   * Calculate QDF scores for documents
   */
  private calculateQdfScores(
    documents: Document[],
    query: string,
    options: Required<QdfOptions>
  ): QdfResult[] {
    const now = new Date();

    return documents.map(doc => {
      // Calculate freshness score (0-1, higher for more recent)
      const daysSincePublished = (now.getTime() - doc.publishedAt.getTime()) / (1000 * 60 * 60 * 24);
      const daysSinceModified = (now.getTime() - doc.lastModified.getTime()) / (1000 * 60 * 60 * 24);
      
      // Use the more recent of published or modified date
      const daysSinceFresh = Math.min(daysSincePublished, daysSinceModified);
      
      // Exponential decay for freshness (fresh content gets higher scores)
      const freshnessScore = Math.exp(-daysSinceFresh / 30); // 30-day half-life
      
      // Normalize popularity score (0-1)
      const popularityScore = Math.min(doc.popularity / 100, 1);
      
      // Calculate relevance score (simple keyword matching for demo)
      const relevanceScore = this.calculateRelevanceScore(doc, query);
      
      // Combined QDF score
      const score = 
        (options.freshnessWeight * freshnessScore) +
        (options.popularityWeight * popularityScore) +
        ((1 - options.freshnessWeight - options.popularityWeight) * relevanceScore);

      return {
        document: doc,
        score,
        freshnessScore,
        popularityScore,
        relevanceScore
      };
    });
  }

  /**
   * Calculate relevance score based on query matching
   */
  private calculateRelevanceScore(document: Document, query: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = document.title.toLowerCase();
    const contentLower = document.content.toLowerCase();
    
    let score = 0;
    
    // Title matches are weighted higher
    if (titleLower.includes(queryLower)) {
      score += 0.5;
    }
    
    // Content matches
    const contentMatches = (contentLower.match(new RegExp(queryLower, 'g')) || []).length;
    score += Math.min(contentMatches * 0.1, 0.3);
    
    // Tag matches
    const tagMatches = document.tags.filter(tag => 
      tag.toLowerCase().includes(queryLower)
    ).length;
    score += Math.min(tagMatches * 0.2, 0.2);
    
    return Math.min(score, 1);
  }

  /**
   * Generate cache key for query and options
   */
  private generateCacheKey(query: string, options: Required<QdfOptions>): string {
    const optionsHash = Buffer.from(JSON.stringify(options)).toString('base64');
    return `qdf:${query}:${optionsHash}`;
  }

  /**
   * Invalidate cache for a specific query
   */
  async invalidateQueryCache(query: string, options: QdfOptions = {}): Promise<void> {
    const opts = { ...this.defaultOptions, ...options };
    const cacheKey = this.generateCacheKey(query, opts);
    await this.cacheService.invalidate(cacheKey);
  }

  /**
   * Get service statistics
   */
  async getStats(): Promise<{
    cacheStats: any;
    totalQueries: number;
  }> {
    const cacheStats = await this.cacheService.getStats();
    
    return {
      cacheStats,
      totalQueries: 0 // Would be tracked in a real implementation
    };
  }
}
