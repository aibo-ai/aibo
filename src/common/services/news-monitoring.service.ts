import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  content?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id?: string;
    name: string;
    domain?: string;
  };
  author?: string;
  category?: string;
  language: string;
  country?: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  relevanceScore: number;
  keywords: string[];
  entities: Array<{
    name: string;
    type: 'person' | 'organization' | 'location' | 'product';
    confidence: number;
  }>;
}

export interface NewsSearchRequest {
  query: string;
  sources?: string[];
  domains?: string[];
  excludeDomains?: string[];
  from?: string;
  to?: string;
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
  category?: string;
  country?: string;
}

export interface NewsAnalytics {
  totalArticles: number;
  timeRange: {
    start: string;
    end: string;
  };
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  topSources: Array<{
    source: string;
    count: number;
    avgSentiment: number;
  }>;
  topKeywords: Array<{
    keyword: string;
    count: number;
    sentiment: number;
  }>;
  topEntities: Array<{
    entity: string;
    type: string;
    count: number;
  }>;
  trendingTopics: Array<{
    topic: string;
    articles: number;
    growth: number;
  }>;
}

@Injectable()
export class NewsMonitoringService {
  private readonly logger = new Logger(NewsMonitoringService.name);
  private readonly newsApiClient: AxiosInstance;
  private readonly mediastackClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    // Initialize NewsAPI client
    this.newsApiClient = axios.create({
      baseURL: 'https://newsapi.org/v2',
      timeout: 30000,
      headers: {
        'X-API-Key': this.configService.get<string>('NEWS_API_KEY')
      }
    });

    // Initialize Mediastack client
    this.mediastackClient = axios.create({
      baseURL: 'http://api.mediastack.com/v1',
      timeout: 30000,
      params: {
        access_key: this.configService.get<string>('MEDIASTACK_API_KEY')
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // NewsAPI interceptors
    this.newsApiClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`NewsAPI Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.newsApiClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`NewsAPI Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('NewsAPI Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    // Mediastack interceptors
    this.mediastackClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Mediastack Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.mediastackClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Mediastack Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('Mediastack Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for news articles
   */
  async searchNews(request: NewsSearchRequest): Promise<NewsArticle[]> {
    try {
      const articles: NewsArticle[] = [];

      // Search using NewsAPI
      if (this.configService.get<string>('NEWS_API_KEY')) {
        const newsApiArticles = await this.searchWithNewsAPI(request);
        articles.push(...newsApiArticles);
      }

      // Search using Mediastack
      if (this.configService.get<string>('MEDIASTACK_API_KEY')) {
        const mediastackArticles = await this.searchWithMediastack(request);
        articles.push(...mediastackArticles);
      }

      // Remove duplicates and enhance articles
      const uniqueArticles = this.removeDuplicates(articles);
      const enhancedArticles = await this.enhanceArticles(uniqueArticles);

      // Sort by relevance and published date
      return enhancedArticles.sort((a, b) => {
        const relevanceDiff = b.relevanceScore - a.relevanceScore;
        if (Math.abs(relevanceDiff) > 0.1) return relevanceDiff;
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });

    } catch (error) {
      this.logger.error('News search failed:', error);
      throw new Error(`News search failed: ${error.message}`);
    }
  }

  /**
   * Search using NewsAPI
   */
  private async searchWithNewsAPI(request: NewsSearchRequest): Promise<NewsArticle[]> {
    try {
      const params = {
        q: request.query,
        sources: request.sources?.join(','),
        domains: request.domains?.join(','),
        excludeDomains: request.excludeDomains?.join(','),
        from: request.from,
        to: request.to,
        language: request.language || 'en',
        sortBy: request.sortBy || 'relevancy',
        pageSize: Math.min(request.pageSize || 100, 100)
      };

      const response = await this.newsApiClient.get('/everything', { params });
      
      return response.data.articles?.map((article: any) => this.mapNewsAPIArticle(article)) || [];
    } catch (error) {
      this.logger.error('NewsAPI search failed:', error);
      return [];
    }
  }

  /**
   * Search using Mediastack
   */
  private async searchWithMediastack(request: NewsSearchRequest): Promise<NewsArticle[]> {
    try {
      const params = {
        keywords: request.query,
        sources: request.sources?.join(','),
        categories: request.category,
        countries: request.country,
        languages: request.language || 'en',
        date: request.from,
        sort: request.sortBy === 'publishedAt' ? 'published_desc' : 'popularity',
        limit: Math.min(request.pageSize || 100, 100)
      };

      const response = await this.mediastackClient.get('/news', { params });
      
      return response.data.data?.map((article: any) => this.mapMediastackArticle(article)) || [];
    } catch (error) {
      this.logger.error('Mediastack search failed:', error);
      return [];
    }
  }

  /**
   * Map NewsAPI article to NewsArticle
   */
  private mapNewsAPIArticle(article: any): NewsArticle {
    return {
      id: `newsapi-${this.generateId(article.url)}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content,
      url: article.url,
      urlToImage: article.urlToImage,
      publishedAt: article.publishedAt,
      source: {
        id: article.source?.id,
        name: article.source?.name || 'Unknown',
        domain: this.extractDomain(article.url)
      },
      author: article.author,
      language: 'en', // NewsAPI doesn't always provide language
      sentiment: 'neutral', // Will be analyzed later
      sentimentScore: 0.5,
      relevanceScore: 0.5,
      keywords: [],
      entities: []
    };
  }

  /**
   * Map Mediastack article to NewsArticle
   */
  private mapMediastackArticle(article: any): NewsArticle {
    return {
      id: `mediastack-${this.generateId(article.url)}`,
      title: article.title || '',
      description: article.description || '',
      content: article.content,
      url: article.url,
      urlToImage: article.image,
      publishedAt: article.published_at,
      source: {
        name: article.source || 'Unknown',
        domain: this.extractDomain(article.url)
      },
      author: article.author,
      category: article.category,
      language: article.language || 'en',
      country: article.country,
      sentiment: 'neutral',
      sentimentScore: 0.5,
      relevanceScore: 0.5,
      keywords: [],
      entities: []
    };
  }

  /**
   * Enhance articles with sentiment analysis and entity extraction
   */
  private async enhanceArticles(articles: NewsArticle[]): Promise<NewsArticle[]> {
    return Promise.all(articles.map(async (article) => {
      try {
        // Analyze sentiment
        const sentiment = this.analyzeSentiment(article.title + ' ' + article.description);
        article.sentiment = sentiment.sentiment;
        article.sentimentScore = sentiment.score;

        // Calculate relevance score
        article.relevanceScore = this.calculateRelevanceScore(article);

        // Extract keywords
        article.keywords = this.extractKeywords(article.title + ' ' + article.description);

        // Extract entities
        article.entities = this.extractEntities(article.title + ' ' + article.description);

        return article;
      } catch (error) {
        this.logger.error('Article enhancement failed:', error);
        return article;
      }
    }));
  }

  /**
   * Monitor competitor news
   */
  async monitorCompetitorNews(competitorName: string, timeframe = '7d'): Promise<{
    articles: NewsArticle[];
    analytics: NewsAnalytics;
    alerts: Array<{ type: string; message: string; severity: string }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeframe === '24h') {
        startDate.setHours(startDate.getHours() - 24);
      } else if (timeframe === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }

      const articles = await this.searchNews({
        query: competitorName,
        from: startDate.toISOString().split('T')[0],
        to: endDate.toISOString().split('T')[0],
        sortBy: 'publishedAt',
        pageSize: 100
      });

      const analytics = this.calculateNewsAnalytics(articles, {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      const alerts = this.generateNewsAlerts(articles, analytics);

      return { articles, analytics, alerts };
    } catch (error) {
      this.logger.error(`Competitor news monitoring failed for ${competitorName}:`, error);
      throw error;
    }
  }

  /**
   * Calculate news analytics
   */
  private calculateNewsAnalytics(articles: NewsArticle[], timeRange: any): NewsAnalytics {
    const sentimentBreakdown = {
      positive: articles.filter(a => a.sentiment === 'positive').length,
      negative: articles.filter(a => a.sentiment === 'negative').length,
      neutral: articles.filter(a => a.sentiment === 'neutral').length
    };

    const sourceMap = new Map();
    articles.forEach(article => {
      const source = article.source.name;
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { count: 0, totalSentiment: 0 });
      }
      const sourceData = sourceMap.get(source);
      sourceData.count++;
      sourceData.totalSentiment += article.sentimentScore;
    });

    const topSources = Array.from(sourceMap.entries())
      .map(([source, data]) => ({
        source,
        count: data.count,
        avgSentiment: data.totalSentiment / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const keywordMap = new Map();
    articles.forEach(article => {
      article.keywords.forEach(keyword => {
        if (!keywordMap.has(keyword)) {
          keywordMap.set(keyword, { count: 0, totalSentiment: 0 });
        }
        const keywordData = keywordMap.get(keyword);
        keywordData.count++;
        keywordData.totalSentiment += article.sentimentScore;
      });
    });

    const topKeywords = Array.from(keywordMap.entries())
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        sentiment: data.totalSentiment / data.count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const entityMap = new Map();
    articles.forEach(article => {
      article.entities.forEach(entity => {
        const key = `${entity.name}-${entity.type}`;
        entityMap.set(key, (entityMap.get(key) || 0) + 1);
      });
    });

    const topEntities = Array.from(entityMap.entries())
      .map(([key, count]) => {
        const [name, type] = key.split('-');
        return { entity: name, type, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    return {
      totalArticles: articles.length,
      timeRange,
      sentimentBreakdown,
      topSources,
      topKeywords,
      topEntities,
      trendingTopics: this.identifyTrendingTopics(articles)
    };
  }

  /**
   * Generate news alerts
   */
  private generateNewsAlerts(articles: NewsArticle[], analytics: NewsAnalytics): Array<{ type: string; message: string; severity: string }> {
    const alerts = [];

    // Check for negative sentiment spike
    const negativePercentage = (analytics.sentimentBreakdown.negative / analytics.totalArticles) * 100;
    if (negativePercentage > 40) {
      alerts.push({
        type: 'negative_sentiment',
        message: `High negative sentiment in news coverage: ${negativePercentage.toFixed(1)}% of articles are negative`,
        severity: 'high'
      });
    }

    // Check for news volume spike
    const recentArticles = articles.filter(a => 
      new Date(a.publishedAt).getTime() > Date.now() - 86400000 // Last 24 hours
    ).length;

    if (recentArticles > 10) {
      alerts.push({
        type: 'volume_spike',
        message: `Unusual news volume: ${recentArticles} articles in the last 24 hours`,
        severity: 'medium'
      });
    }

    // Check for major publication coverage
    const majorPublications = ['Reuters', 'Bloomberg', 'Wall Street Journal', 'Financial Times', 'CNN', 'BBC'];
    const majorCoverage = articles.filter(a => 
      majorPublications.some(pub => a.source.name.toLowerCase().includes(pub.toLowerCase()))
    ).length;

    if (majorCoverage > 3) {
      alerts.push({
        type: 'major_coverage',
        message: `Coverage by major publications: ${majorCoverage} articles from top-tier sources`,
        severity: 'medium'
      });
    }

    return alerts;
  }

  // Helper methods
  private generateId(url: string): string {
    return Buffer.from(url).toString('base64').substring(0, 16);
  }

  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }

  private removeDuplicates(articles: NewsArticle[]): NewsArticle[] {
    const seen = new Set();
    return articles.filter(article => {
      const key = article.url || article.title;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private analyzeSentiment(text: string): { sentiment: 'positive' | 'negative' | 'neutral'; score: number } {
    // Simple sentiment analysis - in production, use a proper sentiment analysis service
    const positiveWords = ['good', 'great', 'excellent', 'success', 'growth', 'profit', 'win', 'achievement', 'breakthrough'];
    const negativeWords = ['bad', 'terrible', 'loss', 'decline', 'problem', 'issue', 'crisis', 'failure', 'lawsuit', 'scandal'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) {
      return { sentiment: 'positive', score: Math.min(0.5 + (positiveCount * 0.1), 1.0) };
    }
    if (negativeCount > positiveCount) {
      return { sentiment: 'negative', score: Math.max(0.5 - (negativeCount * 0.1), 0.0) };
    }
    return { sentiment: 'neutral', score: 0.5 };
  }

  private calculateRelevanceScore(article: NewsArticle): number {
    let score = 0.5;
    
    // Boost score for recent articles
    const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
    if (hoursOld < 24) score += 0.2;
    else if (hoursOld < 168) score += 0.1; // 1 week
    
    // Boost score for reputable sources
    const reputableSources = ['reuters', 'bloomberg', 'wsj', 'ft', 'bbc', 'cnn'];
    if (reputableSources.some(source => article.source.name.toLowerCase().includes(source))) {
      score += 0.2;
    }
    
    // Boost score for articles with images
    if (article.urlToImage) score += 0.1;
    
    return Math.min(score, 1.0);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - in production, use NLP libraries
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'said', 'each', 'which', 'their', 'time', 'more', 'very', 'what', 'know', 'just', 'first', 'into', 'over', 'think', 'also', 'your', 'work', 'life', 'only', 'can', 'still', 'should', 'after', 'being', 'now', 'made', 'before', 'here', 'through', 'when', 'where', 'much', 'some', 'these', 'many', 'then', 'them', 'would', 'like', 'well', 'were'].includes(word));
    
    const wordCount = new Map();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .filter(([word, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  private extractEntities(text: string): Array<{ name: string; type: 'person' | 'organization' | 'location' | 'product'; confidence: number }> {
    // Simple entity extraction - in production, use NLP services
    const entities = [];
    
    // Look for company names (capitalized words)
    const companyPattern = /\b[A-Z][a-z]+ (?:Inc|Corp|LLC|Ltd|Company|Corporation|Technologies|Systems|Solutions|Group|Holdings)\b/g;
    const companies = text.match(companyPattern) || [];
    companies.forEach(company => {
      entities.push({
        name: company,
        type: 'organization' as const,
        confidence: 0.8
      });
    });
    
    // Look for product names (capitalized phrases)
    const productPattern = /\b[A-Z][a-zA-Z]+ [A-Z][a-zA-Z]+\b/g;
    const products = text.match(productPattern) || [];
    products.slice(0, 5).forEach(product => {
      if (!companies.includes(product)) {
        entities.push({
          name: product,
          type: 'product' as const,
          confidence: 0.6
        });
      }
    });
    
    return entities.slice(0, 10);
  }

  private identifyTrendingTopics(articles: NewsArticle[]): Array<{ topic: string; articles: number; growth: number }> {
    // Simple trending topic identification
    const topicMap = new Map();
    
    articles.forEach(article => {
      article.keywords.forEach(keyword => {
        topicMap.set(keyword, (topicMap.get(keyword) || 0) + 1);
      });
    });
    
    return Array.from(topicMap.entries())
      .map(([topic, count]) => ({
        topic,
        articles: count,
        growth: Math.random() * 100 - 50 // Mock growth percentage
      }))
      .sort((a, b) => b.articles - a.articles)
      .slice(0, 10);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple search
      const articles = await this.searchNews({
        query: 'test',
        pageSize: 1
      });
      
      return true; // If no error thrown, service is healthy
    } catch (error) {
      this.logger.error('News monitoring health check failed:', error);
      return false;
    }
  }
}
