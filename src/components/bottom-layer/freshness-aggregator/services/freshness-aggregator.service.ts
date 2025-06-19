import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient, Container, Database, SqlQuerySpec } from '@azure/cosmos';
import { v4 as uuidv4 } from 'uuid';

import { 
  NewsApiClient, 
  SerpApiClient, 
  TwitterApiClient, 
  MediastackApiClient, 
  SocialSearcherClient, 
  ExaApiClient 
} from '../clients';

import {
  ContentItem,
  ContentType,
  AggregatedContentItem,
  FreshnessScore,
  RecencyCategory,
  FreshnessSearchParameters,
  FreshnessAggregatorResponse,
  ContentItemDocument,
  NewsArticle,
  WebSearchResult,
  SocialPost
} from '../models/content-models';

import { FreshnessUtils } from './freshness-utils';

/**
 * Freshness Aggregator Service
 * Integrates with multiple data sources to collect and prioritize recent content
 * based on topic and search parameters from Query Intent Analyzer.
 */
@Injectable()
export class FreshnessAggregatorService {
  private readonly logger = new Logger(FreshnessAggregatorService.name);
  private cosmosClient: CosmosClient;
  private database: Database;
  private contentContainer: Container;
  
  // API clients
  private newsApiClient: NewsApiClient;
  private serpApiClient: SerpApiClient;
  private twitterApiClient: TwitterApiClient;
  private mediastackApiClient: MediastackApiClient;
  private socialSearcherClient: SocialSearcherClient;
  private exaApiClient: ExaApiClient;
  
  // Freshness thresholds in hours
  private readonly freshnessThresholds = {
    [ContentType.NEWS]: 24,        // News content is fresh for 24 hours
    [ContentType.SOCIAL]: 6,       // Social content is fresh for 6 hours
    [ContentType.BLOG]: 72,        // Blog content is fresh for 3 days
    [ContentType.FORUM]: 48,       // Forum content is fresh for 2 days
    [ContentType.ACADEMIC]: 720,   // Academic content is fresh for 30 days
    [ContentType.SERP]: 168,       // SERP content is fresh for 7 days
    [ContentType.OTHER]: 168       // Other content is fresh for 7 days
  };

  constructor(private configService: ConfigService) {
    this.initializeClients();
    this.initializeCosmosDB();
  }

  /**
   * Initialize all API clients
   */
  private initializeClients(): void {
    try {
      // Initialize NewsAPI client
      const newsApiKey = this.configService.get<string>('NEWSAPI_KEY');
      if (newsApiKey) {
        this.newsApiClient = new NewsApiClient(newsApiKey);
        this.logger.log('NewsAPI client initialized');
      }
      
      // Initialize SERP API client
      const serpApiKey = this.configService.get<string>('SERPER_API_KEY');
      if (serpApiKey) {
        this.serpApiClient = new SerpApiClient(serpApiKey);
        this.logger.log('SERP API client initialized');
      }
      
      // Initialize Twitter API client
      const twitterApiKey = this.configService.get<string>('TWITTER_API_KEY');
      const twitterApiSecret = this.configService.get<string>('TWITTER_API_SECRET');
      const twitterBearerToken = this.configService.get<string>('TWITTER_BEARER_TOKEN');
      if (twitterApiKey && twitterApiSecret && twitterBearerToken) {
        this.twitterApiClient = new TwitterApiClient(twitterApiKey, twitterApiSecret, twitterBearerToken);
        this.logger.log('Twitter API client initialized');
      }
      
      // Initialize Mediastack API client
      const mediastackApiKey = this.configService.get<string>('MEDIASTACK_API_KEY');
      if (mediastackApiKey) {
        this.mediastackApiClient = new MediastackApiClient(mediastackApiKey);
        this.logger.log('Mediastack API client initialized');
      }
      
      // Initialize Social Searcher API client
      const socialSearcherApiKey = this.configService.get<string>('SOCIAL_SEARCHER_API_KEY');
      if (socialSearcherApiKey) {
        this.socialSearcherClient = new SocialSearcherClient(socialSearcherApiKey);
        this.logger.log('Social Searcher API client initialized');
      }
      
      // Initialize Exa API client
      const exaApiKey = this.configService.get<string>('EXA_API_KEY');
      if (exaApiKey) {
        this.exaApiClient = new ExaApiClient(exaApiKey);
        this.logger.log('Exa API client initialized');
      }
    } catch (error) {
      this.logger.error(`Error initializing API clients: ${error.message}`);
    }
  }

  /**
   * Initialize Cosmos DB connection
   */
  private async initializeCosmosDB(): Promise<void> {
    try {
      const cosmosKey = this.configService.get<string>('AZURE_COSMOS_KEY');
      const cosmosEndpoint = this.configService.get<string>('AZURE_COSMOS_ENDPOINT');
      
      if (!cosmosKey || !cosmosEndpoint) {
        this.logger.warn('Cosmos DB configuration missing. Content caching will be disabled.');
        return;
      }
      
      this.cosmosClient = new CosmosClient({ 
        endpoint: cosmosEndpoint, 
        key: cosmosKey 
      });
      
      const databaseId = this.configService.get<string>('COSMOS_DB_DATABASE') || 'content-architect';
      const containerId = this.configService.get<string>('COSMOS_DB_CONTENT_CONTAINER') || 'fresh-content';
      
      // Create database if it doesn't exist
      const { database } = await this.cosmosClient.databases.createIfNotExists({ id: databaseId });
      this.database = database;
      
      // Create container if it doesn't exist
      const { container } = await this.database.containers.createIfNotExists({
        id: containerId,
        partitionKey: { paths: ['/partitionKey'] },
        defaultTtl: 604800 // 7 days TTL by default
      });
      
      this.contentContainer = container;
      this.logger.log('Cosmos DB initialized for content caching');
    } catch (error) {
      this.logger.error(`Error initializing Cosmos DB: ${error.message}`);
    }
  }
  
  /**
   * Main method to aggregate fresh content from multiple sources
   * @param params Search parameters
   * @returns Aggregated content with freshness scores
   */
  async aggregateFreshContent(params: FreshnessSearchParameters): Promise<FreshnessAggregatorResponse> {
    try {
      const startTime = Date.now();
      this.logger.log(`Aggregating fresh content for query: ${params.query}`);
      
      // Check if we have cached results
      const cachedResults = await this.getCachedResults(params);
      if (cachedResults && !params.skipCache) {
        this.logger.log('Returning cached results');
        return cachedResults;
      }
      
      // Collect content from all available sources
      const allContent: ContentItem[] = [];
      
      // Run content collection in parallel
      const [newsContent, webContent, socialContent] = await Promise.all([
        this.collectNewsContent(params),
        this.collectWebContent(params),
        this.collectSocialContent(params)
      ]);
      
      // Combine all content
      allContent.push(...(newsContent || []));
      allContent.push(...(webContent || []));
      allContent.push(...(socialContent || []));
      
      // Deduplicate content
      const uniqueContent = FreshnessUtils.deduplicateItems(allContent);
      
      // Calculate QDF score
      const qdfScore = FreshnessUtils.calculateQDFScore(params.query, uniqueContent);
      
      // Create aggregated items with freshness scores
      const aggregatedItems = uniqueContent.map(item => 
        FreshnessUtils.createAggregatedItem(item, this.freshnessThresholds)
      );
      
      // Sort items based on sort preference
      const sortedItems = FreshnessUtils.sortAggregatedItems(
        aggregatedItems, 
        params.sortBy || 'mixed'
      );
      
      // Limit results if specified
      const limitedItems = params.limit ? sortedItems.slice(0, params.limit) : sortedItems;
      
      const executionTime = Date.now() - startTime;
      
      // Create response
      const response: FreshnessAggregatorResponse = {
        query: params.query,
        qdfScore,
        totalItems: limitedItems.length,
        items: limitedItems,
        sources: this.getActiveSources(),
        executionTime
      };
      
      // Cache results if caching is enabled
      if (this.contentContainer && !params.skipCache) {
        await this.cacheResults(params, response);
      }
      
      return response;
    } catch (error) {
      this.logger.error(`Error aggregating fresh content: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get cached results for a query
   * @param params Search parameters
   * @returns Cached results or null if not found
   */
  private async getCachedResults(params: FreshnessSearchParameters): Promise<FreshnessAggregatorResponse | null> {
    if (!this.contentContainer) {
      return null;
    }
    
    try {
      // Create a cache key based on query parameters
      const cacheKey = this.createCacheKey(params);
      
      // Query for cached results
      const querySpec: SqlQuerySpec = {
        query: 'SELECT * FROM c WHERE c.id = @id AND c.type = @type',
        parameters: [
          { name: '@id', value: cacheKey },
          { name: '@type', value: 'freshness-results' }
        ]
      };
      
      const { resources } = await this.contentContainer.items
        .query<ContentItemDocument>(querySpec)
        .fetchAll();
      
      if (resources.length > 0) {
        const cachedItem = resources[0];
        return cachedItem.data as FreshnessAggregatorResponse;
      }
      
      return null;
    } catch (error) {
      this.logger.warn(`Error retrieving cached results: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Cache aggregated results
   * @param params Search parameters
   * @param response Aggregated response
   */
  private async cacheResults(params: FreshnessSearchParameters, response: FreshnessAggregatorResponse): Promise<void> {
    if (!this.contentContainer) {
      return;
    }
    
    try {
      // Create a cache key based on query parameters
      const cacheKey = this.createCacheKey(params);
      
      // Create document to store in Cosmos DB
      const document: ContentItemDocument = {
        id: cacheKey,
        partitionKey: params.query,
        type: 'freshness-results',
        query: params.query,
        timestamp: new Date().toISOString(),
        data: response,
        ttl: 3600 // Cache for 1 hour
      };
      
      // Upsert the document
      await this.contentContainer.items.upsert(document);
      this.logger.log(`Cached results for query: ${params.query}`);
    } catch (error) {
      this.logger.warn(`Error caching results: ${error.message}`);
    }
  }
  
  /**
   * Create a cache key from search parameters
   * @param params Search parameters
   * @returns Cache key
   */
  private createCacheKey(params: FreshnessSearchParameters): string {
    const keyParts = [
      `q:${params.query}`,
      `limit:${params.limit || 'default'}`,
      `sort:${params.sortBy || 'default'}`,
      `types:${params.contentTypes?.join(',') || 'all'}`,
      `lang:${params.language || 'en'}`,
      `region:${params.region || 'global'}`
    ];
    
    return keyParts.join('|');
  }
  
  /**
   * Get list of active data sources
   * @returns Array of active source names
   */
  private getActiveSources(): string[] {
    const sources: string[] = [];
    
    if (this.newsApiClient?.isConfigured()) sources.push('NewsAPI');
    if (this.serpApiClient?.isConfigured()) sources.push('SERP API');
    if (this.twitterApiClient?.isConfigured()) sources.push('Twitter API');
    if (this.mediastackApiClient?.isConfigured()) sources.push('Mediastack API');
    if (this.socialSearcherClient?.isConfigured()) sources.push('Social Searcher API');
    if (this.exaApiClient?.isConfigured()) sources.push('Exa API');
    
    return sources;
  }
  
  /**
   * Collect news content from available news sources
   * @param params Search parameters
   * @returns Array of news articles
   */
  private async collectNewsContent(params: FreshnessSearchParameters): Promise<NewsArticle[]> {
    const newsArticles: NewsArticle[] = [];
    const query = params.query;
    
    try {
      // Collect from NewsAPI if available
      if (this.newsApiClient?.isConfigured()) {
        const newsApiResults = await this.newsApiClient.searchNews(query, {
          sortBy: 'publishedAt',
          language: params.language || 'en',
          pageSize: params.limit || 20
        });
        
        if (newsApiResults?.length) {
          newsArticles.push(...newsApiResults);
        }
      }
      
      // Collect from Mediastack if available
      if (this.mediastackApiClient?.isConfigured()) {
        const mediastackResults = await this.mediastackApiClient.searchNews(query, {
          languages: [params.language || 'en'],
          limit: params.limit || 20,
          sort: 'published_desc'
        });
        
        if (mediastackResults?.length) {
          newsArticles.push(...mediastackResults);
        }
      }
      
      return newsArticles;
    } catch (error) {
      this.logger.error(`Error collecting news content: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Collect web search results from available sources
   * @param params Search parameters
   * @returns Array of web search results
   */
  private async collectWebContent(params: FreshnessSearchParameters): Promise<WebSearchResult[]> {
    const webResults: WebSearchResult[] = [];
    const query = params.query;
    
    try {
      // Collect from SERP API if available
      if (this.serpApiClient?.isConfigured()) {
        const serpResults = await this.serpApiClient.search(query, {
          hl: params.language || 'en',
          gl: params.region || 'us',
          num: params.limit || 20
        });
        
        if (serpResults?.length) {
          webResults.push(...serpResults);
        }
      }
      
      // Collect from Exa API if available
      if (this.exaApiClient?.isConfigured()) {
        const exaResults = await this.exaApiClient.searchRecent(query, {
          numResults: params.limit || 20,
          language: params.language || 'en',
          daysAgo: 7 // Last week
        });
        
        if (exaResults?.length) {
          webResults.push(...exaResults);
        }
      }
      
      return webResults;
    } catch (error) {
      this.logger.error(`Error collecting web content: ${error.message}`);
      return [];
    }
  }
  
  /**
   * Collect social media content from available sources
   * @param params Search parameters
   * @returns Array of social posts
   */
  private async collectSocialContent(params: FreshnessSearchParameters): Promise<SocialPost[]> {
    const socialPosts: SocialPost[] = [];
    const query = params.query;
    
    try {
      // Collect from Twitter API if available
      if (this.twitterApiClient?.isConfigured()) {
        const twitterResults = await this.twitterApiClient.searchTweets(query, {
          maxResults: params.limit || 20,
          sortOrder: 'recency'
        });
        
        if (twitterResults?.length) {
          socialPosts.push(...twitterResults);
        }
      }
      
      // Collect from Social Searcher API if available
      if (this.socialSearcherClient?.isConfigured()) {
        const socialSearcherResults = await this.socialSearcherClient.searchSocial(query, {
          lang: params.language || 'en',
          limit: params.limit || 20,
          sort: 'date'
        });
        
        if (socialSearcherResults?.length) {
          socialPosts.push(...socialSearcherResults);
        }
      }
      
      return socialPosts;
    } catch (error) {
      this.logger.error(`Error collecting social content: ${error.message}`);
      return [];
    }
  }
}
