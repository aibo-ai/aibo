import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CosmosClient, Container } from '@azure/cosmos';
import { 
  FreshContentItem, 
  FreshContentResult, 
  FreshnessSearchParams, 
  QDFScore,
  Segment,
  FreshnessLevel,
  ContentSource,
  FreshnessThreshold
} from '../interfaces/freshness.interfaces';
import { ContentType } from '../../../common/interfaces/content.interfaces';

import { MediastackApiService } from './api-clients/mediastack-api.service';
import { SerperApiService } from './api-clients/serper-api.service';
import { FreshnessThresholdsService } from './freshness-thresholds.service';
import { ContentFreshnessScorer } from './content-freshness-scorer.service';

import { v4 as uuidv4 } from 'uuid';
import { performance } from 'perf_hooks';

// Enhanced interfaces for advanced functionality
interface APICallResult {
  source: ContentSource;
  data: FreshContentItem[];
  success: boolean;
  error?: string;
  duration: number;
  timestamp: Date;
}

interface ParallelAPIConfig {
  maxConcurrency: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

interface ContentDeduplicationConfig {
  similarityThreshold: number;
  titleWeight: number;
  contentWeight: number;
  urlWeight: number;
}

interface RealTimeProcessingConfig {
  enableStreaming: boolean;
  webhookEndpoints: string[];
  batchSize: number;
  processingInterval: number;
}

interface AdvancedQDFConfig {
  freshnessWeight: number;
  popularityWeight: number;
  relevanceWeight: number;
  diversityWeight: number;
  authorityWeight: number;
  customWeights?: Record<ContentType, Partial<AdvancedQDFConfig>>;
}

interface AggregationMetrics {
  totalAPICalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  cacheHitRate: number;
  deduplicationRate: number;
}

interface ContentMetrics {
  totalItems: number;
  averageFreshnessScore: number;
  freshnessDistribution: Record<FreshnessLevel, number>;
  sourcesBreakdown: Record<string, number>;
  qualityMetrics: {
    duplicatesRemoved: number;
    averageRelevanceScore: number;
    processingTime: number;
  };
}

@Injectable()
export class FreshnessAggregatorService {
  private readonly logger = new Logger(FreshnessAggregatorService.name);
  private freshContentContainer: Container;
  private metricsContainer: Container;
  
  // Configuration objects
  private readonly apiConfig: ParallelAPIConfig;
  private readonly deduplicationConfig: ContentDeduplicationConfig;
  private readonly realtimeConfig: RealTimeProcessingConfig;
  private readonly advancedQDFConfig: AdvancedQDFConfig;
  
  // Processing queues and caches
  private readonly processingQueue: Map<string, Promise<FreshContentResult>> = new Map();
  private readonly contentCache: Map<string, { data: FreshContentItem[]; timestamp: Date }> = new Map();
  private readonly failureTracker: Map<ContentSource, number> = new Map();
  
  constructor(
    private configService: ConfigService,
    private mediaStackApi: MediastackApiService,
    private serperApi: SerperApiService,
    private freshnessThresholds: FreshnessThresholdsService,
    private freshnessScorer: ContentFreshnessScorer,
    private eventEmitter: EventEmitter2
  ) {
    // Initialize Cosmos DB
    const cosmosKey = this.configService.get<string>('AZURE_COSMOS_KEY');
    const cosmosEndpoint = this.configService.get<string>('AZURE_COSMOS_ENDPOINT');
    const cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
    
    this.freshContentContainer = cosmosClient.database('content-architect').container('fresh-content');
    this.metricsContainer = cosmosClient.database('content-architect').container('aggregation-metrics');
    
    // Initialize configuration
    this.apiConfig = {
      maxConcurrency: this.configService.get<number>('API_MAX_CONCURRENCY', 5),
      timeout: this.configService.get<number>('API_TIMEOUT', 30000),
      retryAttempts: this.configService.get<number>('API_RETRY_ATTEMPTS', 3),
      retryDelay: this.configService.get<number>('API_RETRY_DELAY', 1000)
    };
    
    this.deduplicationConfig = {
      similarityThreshold: this.configService.get<number>('DEDUP_SIMILARITY_THRESHOLD', 0.85),
      titleWeight: this.configService.get<number>('DEDUP_TITLE_WEIGHT', 0.4),
      contentWeight: this.configService.get<number>('DEDUP_CONTENT_WEIGHT', 0.4),
      urlWeight: this.configService.get<number>('DEDUP_URL_WEIGHT', 0.2)
    };
    
    this.realtimeConfig = {
      enableStreaming: this.configService.get<boolean>('REALTIME_STREAMING_ENABLED', false),
      webhookEndpoints: this.configService.get<string>('WEBHOOK_ENDPOINTS', '').split(',').filter(Boolean),
      batchSize: this.configService.get<number>('REALTIME_BATCH_SIZE', 50),
      processingInterval: this.configService.get<number>('REALTIME_PROCESSING_INTERVAL', 5000)
    };
    
    this.advancedQDFConfig = {
      freshnessWeight: this.configService.get<number>('QDF_FRESHNESS_WEIGHT', 0.35),
      popularityWeight: this.configService.get<number>('QDF_POPULARITY_WEIGHT', 0.25),
      relevanceWeight: this.configService.get<number>('QDF_RELEVANCE_WEIGHT', 0.25),
      diversityWeight: this.configService.get<number>('QDF_DIVERSITY_WEIGHT', 0.10),
      authorityWeight: this.configService.get<number>('QDF_AUTHORITY_WEIGHT', 0.05)
    };
    
    this.logger.log('FreshnessAggregatorService initialized with advanced configuration');
    
    // Start real-time processing if enabled
    if (this.realtimeConfig.enableStreaming) {
      this.initializeRealTimeProcessing();
    }
  }
  
  /**
   * Main aggregation method with complete API integration workflow
   */
  async aggregateFreshContent(
    topic: string, 
    segment: Segment,
    searchParams?: FreshnessSearchParams
  ): Promise<FreshContentResult> {
    const startTime = performance.now();
    const aggregationId = uuidv4();
    
    this.logger.log(`Starting content aggregation for topic: ${topic}, segment: ${segment}, id: ${aggregationId}`);
    
    try {
      // Check if already processing this request
      const cacheKey = this.generateCacheKey(topic, segment, searchParams);
      if (this.processingQueue.has(cacheKey)) {
        this.logger.log(`Request already in progress, returning existing promise: ${cacheKey}`);
        return await this.processingQueue.get(cacheKey);
      }
      
      // Create processing promise
      const processingPromise = this.executeAggregation(topic, segment, searchParams, aggregationId);
      this.processingQueue.set(cacheKey, processingPromise);
      
      try {
        const result = await processingPromise;
        return result;
      } finally {
        this.processingQueue.delete(cacheKey);
      }
      
    } catch (error) {
      this.logger.error(`Content aggregation failed for ${topic}:`, error);
      throw error;
    }
  }
  
  /**
   * Execute the complete aggregation workflow
   */
  private async executeAggregation(
    topic: string,
    segment: Segment,
    searchParams: FreshnessSearchParams,
    aggregationId: string
  ): Promise<FreshContentResult> {
    const startTime = performance.now();
    
    // Step 1: Check cache
    const cachedResult = await this.checkCache(topic, segment, searchParams);
    if (cachedResult) {
      this.logger.log(`Cache hit for topic: ${topic}`);
      return cachedResult;
    }
    
    // Step 2: Parallel API calls with error handling
    const apiResults = await this.executeParallelAPICalls(topic, segment, searchParams);
    
    // Step 3: Aggregate and deduplicate content
    const aggregatedContent = await this.aggregateAndDeduplicateContent(apiResults);
    
    // Step 4: Apply advanced QDF scoring
    const scoredContent = await this.applyAdvancedQDFScoring(aggregatedContent, topic, segment);
    
    // Step 5: Apply freshness filtering with customizable thresholds
    const filteredContent = await this.applyFreshnessFiltering(scoredContent, segment);
    
    // Step 6: Generate metrics and metadata
    const metrics = this.generateAggregationMetrics(apiResults, aggregatedContent, filteredContent);
    
    // Step 7: Store results and metrics
    await this.storeAggregationResults(topic, segment, filteredContent, metrics, aggregationId);
    
    // Step 8: Emit real-time events
    this.emitAggregationEvents(topic, segment, filteredContent, metrics);
    
    const processingTime = performance.now() - startTime;
    
    const result: FreshContentResult = {
      id: aggregationId,
      topic,
      segment,
      items: filteredContent,
      metadata: {
        totalItems: filteredContent.length,
        averageFreshnessScore: this.calculateAverageFreshnessScore(filteredContent),
        freshnessDistribution: this.calculateFreshnessDistribution(filteredContent),
        sourcesBreakdown: this.calculateSourcesBreakdown(filteredContent),
        qualityMetrics: {
          duplicatesRemoved: aggregatedContent.length - filteredContent.length,
          averageRelevanceScore: this.calculateAverageRelevanceScore(filteredContent),
          processingTime
        }
      },
      aggregationMetrics: metrics,
      timestamp: new Date(),
      processingTimeMs: processingTime
    };
    
    this.logger.log(`Content aggregation completed for ${topic} in ${processingTime.toFixed(2)}ms`);
    return result;
  }
  
  /**
   * Execute parallel API calls with comprehensive error handling
   */
  private async executeParallelAPICalls(
    topic: string,
    segment: Segment,
    searchParams: FreshnessSearchParams
  ): Promise<APICallResult[]> {
    const apiCalls: Promise<APICallResult>[] = [];
    
    // Define API call configurations
    const apiConfigs = [
      { source: ContentSource.NEWS_API, service: this.mediaStackApi, method: 'searchNews' },
      { source: ContentSource.SERP_API, service: this.serperApi, method: 'searchWeb' },
      // Add more API configurations as needed
    ];
    
    // Create API call promises with error handling
    for (const config of apiConfigs) {
      if (this.shouldSkipAPI(config.source)) {
        continue;
      }
      
      const apiCall = this.executeAPICallWithRetry(config, topic, segment, searchParams);
      apiCalls.push(apiCall);
    }
    
    // Execute with concurrency control
    const results = await this.executeConcurrentAPICalls(apiCalls);
    
    this.logger.log(`Completed ${results.length} API calls, ${results.filter(r => r.success).length} successful`);
    return results;
  }
  
  /**
   * Execute API call with retry logic and error handling
   */
  private async executeAPICallWithRetry(
    config: any,
    topic: string,
    segment: Segment,
    searchParams: FreshnessSearchParams
  ): Promise<APICallResult> {
    const startTime = performance.now();
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.apiConfig.retryAttempts; attempt++) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('API call timeout')), this.apiConfig.timeout);
        });
        
        const apiCallPromise = this.executeAPICall(config, topic, segment, searchParams);
        const data = await Promise.race([apiCallPromise, timeoutPromise]);
        
        // Reset failure tracker on success
        this.failureTracker.delete(config.source);
        
        return {
          source: config.source,
          data,
          success: true,
          duration: performance.now() - startTime,
          timestamp: new Date()
        };
        
      } catch (error) {
        lastError = error;
        this.logger.warn(`API call failed for ${config.source}, attempt ${attempt}/${this.apiConfig.retryAttempts}:`, error.message);
        
        if (attempt < this.apiConfig.retryAttempts) {
          await this.delay(this.apiConfig.retryDelay * attempt);
        }
      }
    }
    
    // Track failure
    const currentFailures = this.failureTracker.get(config.source) || 0;
    this.failureTracker.set(config.source, currentFailures + 1);
    
    return {
      source: config.source,
      data: [],
      success: false,
      error: lastError?.message || 'Unknown error',
      duration: performance.now() - startTime,
      timestamp: new Date()
    };
  }
  
  /**
   * Execute individual API call
   */
  private async executeAPICall(
    config: any,
    topic: string,
    segment: Segment,
    searchParams: FreshnessSearchParams
  ): Promise<FreshContentItem[]> {
    const service = config.service;
    const method = config.method;
    
    // Prepare API-specific parameters
    const apiParams = this.prepareAPIParameters(config.source, topic, segment, searchParams);
    
    // Execute the API call
    const rawResults = await service[method](apiParams);
    
    // Transform results to common format
    return this.transformAPIResults(config.source, rawResults);
  }
  
  /**
   * Execute concurrent API calls with concurrency control
   */
  private async executeConcurrentAPICalls(apiCalls: Promise<APICallResult>[]): Promise<APICallResult[]> {
    const results: APICallResult[] = [];
    const executing: Promise<void>[] = [];
    
    for (const apiCall of apiCalls) {
      const promise = apiCall.then(result => {
        results.push(result);
      }).catch(error => {
        this.logger.error('Unexpected error in API call:', error);
      });
      
      executing.push(promise);
      
      if (executing.length >= this.apiConfig.maxConcurrency) {
        await Promise.race(executing);
        executing.splice(executing.findIndex(p => p === promise), 1);
      }
    }
    
    await Promise.all(executing);
    return results;
  }
  
  /**
   * Aggregate and deduplicate content from multiple sources
   */
  private async aggregateAndDeduplicateContent(apiResults: APICallResult[]): Promise<FreshContentItem[]> {
    // Combine all successful results
    const allContent: FreshContentItem[] = [];
    for (const result of apiResults) {
      if (result.success) {
        allContent.push(...result.data);
      }
    }
    
    this.logger.log(`Aggregated ${allContent.length} items before deduplication`);
    
    // Deduplicate content
    const deduplicatedContent = await this.deduplicateContent(allContent);
    
    this.logger.log(`${deduplicatedContent.length} items after deduplication (removed ${allContent.length - deduplicatedContent.length} duplicates)`);
    
    return deduplicatedContent;
  }
  
  /**
   * Advanced content deduplication using multiple similarity metrics
   */
  private async deduplicateContent(content: FreshContentItem[]): Promise<FreshContentItem[]> {
    const uniqueContent: FreshContentItem[] = [];
    const seenHashes = new Set<string>();
    
    for (const item of content) {
      // Generate content hash for exact duplicates
      const exactHash = this.generateContentHash(item);
      if (seenHashes.has(exactHash)) {
        continue;
      }
      
      // Check for similar content
      const similarItem = uniqueContent.find(existing => 
        this.calculateContentSimilarity(item, existing) > this.deduplicationConfig.similarityThreshold
      );
      
      if (!similarItem) {
        uniqueContent.push(item);
        seenHashes.add(exactHash);
      } else {
        // Merge content if similar but not identical
        this.mergeContentItems(similarItem, item);
      }
    }
    
    return uniqueContent;
  }
  
  /**
   * Apply advanced QDF scoring with customizable weights
   */
  private async applyAdvancedQDFScoring(
    content: FreshContentItem[],
    topic: string,
    segment: Segment
  ): Promise<FreshContentItem[]> {
    const scoredContent: FreshContentItem[] = [];
    
    for (const item of content) {
      // Get content-type specific weights
      const weights = this.getQDFWeights(item.contentType);
      
      // Calculate individual scores
      const freshnessScore = await this.calculateFreshnessScore(item, segment);
      const popularityScore = await this.calculatePopularityScore(item);
      const relevanceScore = await this.calculateRelevanceScore(item, topic);
      const diversityScore = await this.calculateDiversityScore(item, scoredContent);
      const authorityScore = await this.calculateAuthorityScore(item);
      
      // Calculate weighted final score
      const finalScore = (
        freshnessScore * weights.freshnessWeight +
        popularityScore * weights.popularityWeight +
        relevanceScore * weights.relevanceWeight +
        diversityScore * weights.diversityWeight +
        authorityScore * weights.authorityWeight
      );
      
      // Update item with scores
      const scoredItem: FreshContentItem = {
        ...item,
        score: finalScore,
        scoreBreakdown: {
          freshness: freshnessScore,
          popularity: popularityScore,
          relevance: relevanceScore,
          diversity: diversityScore,
          authority: authorityScore,
          final: finalScore
        }
      };
      
      scoredContent.push(scoredItem);
    }
    
    // Sort by final score
    return scoredContent.sort((a, b) => (b.score || 0) - (a.score || 0));
  }
  
  /**
   * Apply freshness filtering with customizable thresholds
   */
  private async applyFreshnessFiltering(
    content: FreshContentItem[],
    segment: Segment
  ): Promise<FreshContentItem[]> {
    const filteredContent: FreshContentItem[] = [];
    
    for (const item of content) {
      const threshold = await this.freshnessThresholds.getFreshnessThreshold(item.contentType, segment);
      const freshnessScore = this.freshnessScorer.calculateFreshnessScore(item, segment);
      const freshnessLevel = this.determineFreshnessLevel(freshnessScore, threshold);
      
      // Apply minimum freshness requirements
      if (this.meetsFreshnessRequirements(freshnessLevel, segment)) {
        filteredContent.push({
          ...item,
          freshnessLevel,
          freshnessThreshold: threshold,
          freshnessScore
        });
      }
    }
    
    return filteredContent;
  }
  
  /**
   * Initialize real-time processing capabilities
   */
  private initializeRealTimeProcessing(): void {
    this.logger.log('Initializing real-time processing');
    
    // Set up periodic processing
    setInterval(() => {
      this.processRealTimeUpdates();
    }, this.realtimeConfig.processingInterval);
    
    // Set up webhook listeners
    this.setupWebhookListeners();
  }
  
  /**
   * Process real-time content updates
   */
  private async processRealTimeUpdates(): Promise<void> {
    try {
      // Process any queued real-time updates
      const updates = await this.getRealTimeUpdates();
      
      if (updates.length > 0) {
        this.logger.log(`Processing ${updates.length} real-time updates`);
        
        // Process in batches
        const batches = this.chunkArray(updates, this.realtimeConfig.batchSize);
        
        for (const batch of batches) {
          await this.processBatch(batch);
        }
        
        // Emit real-time events
        this.eventEmitter.emit('realtime.updates.processed', {
          count: updates.length,
          timestamp: new Date()
        });
      }
    } catch (error) {
      this.logger.error('Error processing real-time updates:', error);
    }
  }
  
  // Helper methods
  
  private generateCacheKey(topic: string, segment: Segment, searchParams?: FreshnessSearchParams): string {
    return `${topic}:${segment}:${JSON.stringify(searchParams || {})}`;
  }
  
  private shouldSkipAPI(source: ContentSource): boolean {
    const failures = this.failureTracker.get(source) || 0;
    return failures > 5; // Skip if too many recent failures
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private generateContentHash(item: FreshContentItem): string {
    const hashInput = `${item.title}:${item.url}:${item.publishedAt}`;
    return Buffer.from(hashInput).toString('base64');
  }
  
  private calculateContentSimilarity(item1: FreshContentItem, item2: FreshContentItem): number {
    const titleSim = this.calculateStringSimilarity(item1.title, item2.title);
    const contentSim = this.calculateStringSimilarity(item1.content || '', item2.content || '');
    const urlSim = item1.url === item2.url ? 1 : 0;
    
    return (
      titleSim * this.deduplicationConfig.titleWeight +
      contentSim * this.deduplicationConfig.contentWeight +
      urlSim * this.deduplicationConfig.urlWeight
    );
  }
  
  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Jaccard similarity implementation
    const set1 = new Set(str1.toLowerCase().split(/\s+/));
    const set2 = new Set(str2.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(set1).filter(x => set2.has(x)));
    const union = new Set([...Array.from(set1), ...Array.from(set2)]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }
  
  private getQDFWeights(contentType: ContentType): AdvancedQDFConfig {
    const customWeights = this.advancedQDFConfig.customWeights?.[contentType];
    if (customWeights) {
      return {
        ...this.advancedQDFConfig,
        ...customWeights
      };
    }
    return this.advancedQDFConfig;
  }
  
  private async calculateFreshnessScore(item: FreshContentItem, segment: Segment): Promise<number> {
    return this.freshnessScorer.calculateFreshnessScore(item, segment);
  }
  
  private async calculatePopularityScore(item: FreshContentItem): Promise<number> {
    // Implement popularity scoring based on social signals, views, etc.
    return Math.random(); // Placeholder
  }
  
  private async calculateRelevanceScore(item: FreshContentItem, topic: string): Promise<number> {
    // Implement relevance scoring using NLP/semantic similarity
    return Math.random(); // Placeholder
  }
  
  private async calculateDiversityScore(item: FreshContentItem, existingContent: FreshContentItem[]): Promise<number> {
    // Implement diversity scoring to promote content variety
    return Math.random(); // Placeholder
  }
  
  private async calculateAuthorityScore(item: FreshContentItem): Promise<number> {
    // Implement authority scoring based on source reputation
    return Math.random(); // Placeholder
  }
  
  private meetsFreshnessRequirements(freshnessLevel: FreshnessLevel, segment: Segment): boolean {
    // Define minimum freshness requirements based on segment
    const minLevels = {
      [Segment.B2B]: [FreshnessLevel.VERY_FRESH, FreshnessLevel.FRESH, FreshnessLevel.RECENT],
      [Segment.B2C]: [FreshnessLevel.VERY_FRESH, FreshnessLevel.FRESH]
    };
    
    return minLevels[segment].includes(freshnessLevel);
  }
  
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
  
  // Placeholder methods for real-time processing
  private async getRealTimeUpdates(): Promise<any[]> {
    return []; // Implement real-time update retrieval
  }
  
  private async processBatch(batch: any[]): Promise<void> {
    // Implement batch processing logic
  }
  
  private setupWebhookListeners(): void {
    // Implement webhook listener setup
  }
  
  private async checkCache(topic: string, segment: Segment, searchParams: FreshnessSearchParams): Promise<FreshContentResult | null> {
    // Implement cache checking logic
    return null;
  }
  
  private prepareAPIParameters(source: ContentSource, topic: string, segment: Segment, searchParams: FreshnessSearchParams): any {
    // Implement API parameter preparation
    return {};
  }
  
  private transformAPIResults(source: ContentSource, rawResults: any): FreshContentItem[] {
    // Implement result transformation logic
    return [];
  }
  
  private mergeContentItems(existing: FreshContentItem, newItem: FreshContentItem): void {
    // Implement content merging logic
  }
  
  private generateAggregationMetrics(apiResults: APICallResult[], aggregatedContent: FreshContentItem[], filteredContent: FreshContentItem[]): AggregationMetrics {
    return {
      totalAPICalls: apiResults.length,
      successfulCalls: apiResults.filter(r => r.success).length,
      failedCalls: apiResults.filter(r => !r.success).length,
      averageResponseTime: apiResults.reduce((sum, r) => sum + r.duration, 0) / apiResults.length,
      cacheHitRate: 0, // Implement cache hit rate calculation
      deduplicationRate: (aggregatedContent.length - filteredContent.length) / aggregatedContent.length
    };
  }
  
  private async storeAggregationResults(topic: string, segment: Segment, content: FreshContentItem[], metrics: AggregationMetrics, aggregationId: string): Promise<void> {
    // Implement result storage logic
  }
  
  private emitAggregationEvents(topic: string, segment: Segment, content: FreshContentItem[], metrics: AggregationMetrics): void {
    this.eventEmitter.emit('aggregation.completed', {
      topic,
      segment,
      contentCount: content.length,
      metrics,
      timestamp: new Date()
    });
  }
  
  private calculateAverageFreshnessScore(content: FreshContentItem[]): number {
    return content.reduce((sum, item) => sum + (item.scoreBreakdown?.freshness || 0), 0) / content.length;
  }
  
  private calculateFreshnessDistribution(content: FreshContentItem[]): Record<FreshnessLevel, number> {
    const distribution = {} as Record<FreshnessLevel, number>;
    for (const item of content) {
      distribution[item.freshnessLevel] = (distribution[item.freshnessLevel] || 0) + 1;
    }
    return distribution;
  }
  
  private calculateSourcesBreakdown(content: FreshContentItem[]): Record<string, number> {
    const breakdown = {} as Record<string, number>;
    for (const item of content) {
      breakdown[item.source] = (breakdown[item.source] || 0) + 1;
    }
    return breakdown;
  }
  
  private calculateAverageRelevanceScore(content: FreshContentItem[]): number {
    return content.reduce((sum, item) => sum + (item.scoreBreakdown?.relevance || 0), 0) / content.length;
  }
  
  /**
   * Determine freshness level based on score and threshold
   */
  private determineFreshnessLevel(score: number, threshold: FreshnessThreshold): FreshnessLevel {
    if (score >= 90) return FreshnessLevel.VERY_FRESH;
    if (score >= 75) return FreshnessLevel.FRESH;
    if (score >= 60) return FreshnessLevel.RECENT;
    if (score >= threshold.minFreshnessScore) return FreshnessLevel.MODERATE;
    return FreshnessLevel.NEEDS_UPDATING;
  }
}
