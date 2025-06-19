import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CosmosClient, Database, Container, SqlQuerySpec, FeedOptions } from '@azure/cosmos';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { RedisCacheService } from '../../../shared/services/redis-cache.service';
import { IntentClassifier, IntentClassificationResult } from './intentClassifier';
import { QueryGenerator, QueryExpansionResult as ModuleQueryExpansionResult } from './queryGenerator';
import { SearchParameterGenerator, SearchParameters as ModuleSearchParameters } from './searchParameterGenerator';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

/**
 * User input for query intent analysis
 */
export interface UserInput {
  topic: string;
  context?: string;
  keywords?: string[];
  industry?: string;
  audience?: string;
  goals?: string;
}

/**
 * Business segment type
 */
export type Segment = 'b2b' | 'b2c';

/**
 * Represents a query expansion result
 */
export interface QueryExpansionResult {
  originalQuery: string;
  expandedQueries: string[];
  semanticQueries: string[];
  relatedConcepts: string[];
  confidence: number;
}

/**
 * Semantic search result item
 */
export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  score: number;
}

/**
 * Semantic search result
 */
export interface SemanticSearchResult {
  query: string;
  results: SearchResultItem[];
  totalResults: number;
  executionTime: number;
}

/**
 * Query intent analysis result
 */
export interface QueryIntent {
  id: string;
  topic: string;
  segment?: Segment;
  primaryIntent: string;
  secondaryIntents?: string[];
  keyThemes: string[];
  keywordClusters?: string[];
  conversationalQueries?: string[];
  queryTypeDistribution?: { [key: string]: number };
  searchParameters: SearchParameters;
  timestamp: string;
  confidence?: number;
  suggestedApproach?: string;
  intentScores?: {
    informational: number;
    navigational: number;
    transactional: number;
    commercial: number;
  };
  expandedQueries: string[];
  semanticQueries: string[];
  relatedConcepts: string[];
  queryExpansion?: {
    expandedQueries: string[];
    semanticQueries: string[];
    relatedConcepts: string[];
  };
  semanticSearchResults?: SearchResultItem[];
}

/**
 * Represents a content strategy recommendation
 */
export interface ContentStrategy {
  id?: string;
  contentType: string;
  segment?: Segment;
  structure: string[];
  tonalityGuide: string;
  contentElements: string[];
  citationStrategy?: string;
  suggestedLLMOptimizations?: string[];
  timestamp: string;
}

/**
 * Keyword cluster for content optimization
 */
export interface KeywordCluster {
  name: string;
  keywords: string[];
  relevanceScore: number;
}

/**
 * Parameters for search optimization and content discovery
 */
export interface SearchParameters {
  includeDomains?: string[];
  excludeDomains?: string[];
  contentTypes?: string[];
  timeframe?: string;
  filters?: {
    recency?: string;
    contentTypes?: string[];
    minLength?: string;
    [key: string]: any;
  };
  semanticBoost?: boolean;
  expandedQueries?: string[];
  semanticQueries?: string[];
  [key: string]: any;
}

@Injectable()
export class QueryIntentAnalyzerService implements OnModuleInit {
  private readonly logger = new Logger(QueryIntentAnalyzerService.name);
  private cosmosClient: CosmosClient;
  private database: Database;
  private container: Container;
  private strategyContainer: Container;
  private queryIntentsContainer: Container;
  private contentStrategiesContainer: Container;

  private readonly databaseId = 'content-architect';
  private readonly containerId = 'query-intents';
  private readonly strategyContainerId = 'content-strategies';

  // Azure AI Search configuration
  private readonly searchEndpoint: string;
  private readonly searchKey: string;
  private readonly searchIndexName: string;

  // Azure AI Foundry configuration
  private readonly aiFoundryEndpoint: string;
  private readonly aiFoundryKey: string;
  private readonly aiFoundryDeploymentName: string;

  constructor(
    private configService: ConfigService,
    private azureAIService: AzureAIService,
    private redisCacheService: RedisCacheService,
    private intentClassifier: IntentClassifier,
    private queryGenerator: QueryGenerator,
    private searchParameterGenerator: SearchParameterGenerator
  ) {
    // Initialize Cosmos DB client
    const cosmosKey = this.configService.get<string>('AZURE_COSMOS_KEY');
    const cosmosEndpoint = this.configService.get<string>('AZURE_COSMOS_ENDPOINT');

    if (!cosmosKey || !cosmosEndpoint) {
      this.logger.error('Missing Cosmos DB configuration. AZURE_COSMOS_KEY and AZURE_COSMOS_ENDPOINT must be provided.');
      throw new Error('Missing required Cosmos DB configuration');
    }

    this.cosmosClient = new CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
    this.logger.log('Cosmos DB client initialized');

    // Initialize Azure AI Search configuration
    this.searchEndpoint = this.configService.get<string>('AZURE_SEARCH_ENDPOINT');
    this.searchKey = this.configService.get<string>('AZURE_SEARCH_KEY');
    this.searchIndexName = this.configService.get<string>('AZURE_SEARCH_INDEX_NAME') || 'content-index';

    if (!this.searchEndpoint || !this.searchKey) {
      this.logger.warn('Azure AI Search configuration incomplete. Some search features may be limited.');
    } else {
      this.logger.log('Azure AI Search configuration initialized');
    }

    // Initialize Azure AI Foundry configuration
    this.aiFoundryEndpoint = this.configService.get<string>('AZURE_AI_FOUNDRY_ENDPOINT');
    this.aiFoundryKey = this.configService.get<string>('AZURE_AI_FOUNDRY_KEY');
    this.aiFoundryDeploymentName = this.configService.get<string>('AZURE_AI_FOUNDRY_DEPLOYMENT_NAME');

    if (!this.aiFoundryEndpoint || !this.aiFoundryKey) {
      this.logger.warn('Azure AI Foundry configuration incomplete. Using Azure OpenAI as fallback.');
    } else {
      this.logger.log('Azure AI Foundry configuration initialized');
    }
  }

  /**
   * Lifecycle hook that runs after the module has been initialized
   * Used to initialize the Cosmos DB resources
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.initializeCosmosResources();
      this.logger.log('QueryIntentAnalyzerService initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize QueryIntentAnalyzerService: ${error.message}`);
      throw error;
    }
  }

  /**
   * Initialize Cosmos DB resources (database and containers)
   * @returns Promise that resolves when initialization is complete
   */
  private async initializeCosmosResources(): Promise<void> {
    try {
      this.logger.log('Initializing Cosmos DB resources...');

      // Create database if it doesn't exist
      const { database } = await this.cosmosClient.databases.createIfNotExists({
        id: this.databaseId
      });
      this.database = database;
      this.logger.log(`Database '${this.databaseId}' initialized`);

      // Create query intents container if it doesn't exist
      const { container } = await this.database.containers.createIfNotExists({
        id: this.containerId,
        partitionKey: { paths: ['/topic'] }
      });
      this.container = container;
      this.queryIntentsContainer = container; // Assign to both properties for compatibility
      this.logger.log(`Container '${this.containerId}' initialized`);

      // Create content strategy container if it doesn't exist
      const { container: strategyContainer } = await this.database.containers.createIfNotExists({
        id: this.strategyContainerId,
        partitionKey: { paths: ['/contentType'] }
      });
      this.strategyContainer = strategyContainer;
      this.contentStrategiesContainer = strategyContainer; // Assign to both properties for compatibility

      this.logger.log('Cosmos DB resources initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Cosmos DB resources: ${error.message}`);
      throw error;
    }
  }

  /**
   * Analyze intent from user input with detailed information
   * @param userInput User input with topic and optional context
   * @param segment Optional segment for targeting specific audience
   */
  async analyzeIntent(userInput: UserInput | string, segment?: Segment): Promise<QueryIntent> {
    try {
      // Convert string input to UserInput object if needed
      const input: UserInput = typeof userInput === 'string' ? { topic: userInput } : userInput;
      const targetSegment: Segment = segment || 'b2b'; // Default to B2B if not specified

      // Generate a cache key based on topic and segment
      const cacheKey = `intent_analysis:${input.topic.toLowerCase().replace(/\s+/g, '_')}:${targetSegment}`;
      
      // Try to get from cache first
      return await this.redisCacheService.getOrSet<QueryIntent>(
        cacheKey,
        async () => {
          // Check if we have a database analysis for this topic and segment
          const existingAnalysis = await this.retrieveIntentAnalysis(input.topic, targetSegment);
          if (existingAnalysis) {
            this.logger.log(`Using database intent analysis for topic: ${input.topic}`);
            return existingAnalysis;
          }

          // If no analysis found, perform a new analysis
          const analysis = await this.analyzeSegmentIntent(input, targetSegment);
          return analysis;
        },
        // Cache for 24 hours (86400 seconds)
        86400
      );
    } catch (error) {
      this.logger.error(`Error analyzing intent: ${error.message}`);
      return this.createDefaultResponse(typeof userInput === 'string' ? userInput : userInput.topic);
    }
  }

  /**
   * Analyze segment-specific intent
   * @param userInput User input information
   * @param segment B2B or B2C segment
   */
  private async analyzeSegmentIntent(userInput: UserInput, segment: Segment): Promise<QueryIntent> {
    try {
      // Perform intent classification using Azure AI
      const prompt = `Analyze the intent behind the topic "${userInput.topic}" for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} audience.`;
      const completion = await this.azureAIService.generateCompletion(prompt, {
        deploymentName: this.aiFoundryDeploymentName,
        temperature: 0.3,
        maxTokens: 800
      });
      const responseText = await this.azureAIService.getCompletion(completion);

      // Extract and parse JSON from the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const result = jsonMatch ? JSON.parse(jsonMatch[0]) : this.createDefaultResponse(userInput.topic, segment);

      // Perform query expansion to get related queries
      const queryExpansion = await this.queryGenerator.generateConversationalQueries(userInput.topic, result);

      // Perform semantic search to get relevant content
      const searchResults = await this.performSemanticSearch(userInput.topic, {
        top: 5,
        queryLanguage: 'en-us',
        filter: segment === 'b2b' ? 'audience eq \'business\'' : 'audience eq \'consumer\''
      });

      // Generate segment-specific search parameters
      const searchParams = await this.searchParameterGenerator.generateSearchParameters(
        userInput.topic,
        result.primaryIntent
      );

      // Create the intent analysis object
      const intentAnalysis: QueryIntent = {
        id: uuidv4(),
        topic: userInput.topic,
        segment,
        primaryIntent: result.primaryIntent,
        secondaryIntents: result.secondaryIntents || [],
        confidence: result.confidence || 0.7,
        suggestedApproach: result.suggestedApproach || await this.getSuggestedApproach(userInput.topic, result.primaryIntent, segment),
        keyThemes: result.keyThemes || [],
        keywordClusters: this.generateKeywordClusters(userInput.topic, result.keyThemes || [], segment),
        conversationalQueries: result.conversationalQueries || [],
        queryTypeDistribution: result.queryTypeDistribution || this.getDefaultQueryTypes(segment),
        searchParameters: searchParams,
        timestamp: new Date().toISOString(),
        expandedQueries: queryExpansion.expandedQueries,
        semanticQueries: queryExpansion.semanticQueries,
        relatedConcepts: queryExpansion.relatedConcepts,
        queryExpansion: {
          expandedQueries: queryExpansion.expandedQueries,
          semanticQueries: queryExpansion.semanticQueries,
          relatedConcepts: queryExpansion.relatedConcepts
        },
        semanticSearchResults: searchResults.results.slice(0, 3) // Include top 3 search results
      };

      // Store the intent analysis
      await this.storeIntentAnalysis(intentAnalysis);

      this.logger.log(`Intent analysis complete for topic: ${userInput.topic}`);
      return intentAnalysis;
    } catch (error) {
      this.logger.error(`Error analyzing segment intent: ${error.message}`);
      // Create a default response with segment-specific defaults
      const defaultResponse = this.createDefaultResponse(userInput.topic, segment);
      return defaultResponse;
    }
  }

  /**
   * Retrieve existing intent analysis from Cosmos DB
   * @param topic The topic to retrieve intent analysis for
   * @param segment The business segment (B2B or B2C)
   * @returns Existing intent analysis or null if not found
   */
  private async retrieveIntentAnalysis(topic: string, segment: Segment): Promise<QueryIntent | null> {
    try {
      // Create a cache key for this specific query
      const cacheKey = `cosmos_intent:${topic.toLowerCase().replace(/\s+/g, '_')}:${segment}`;
      
      // Try to get from cache first
      return await this.redisCacheService.getOrSet<QueryIntent | null>(
        cacheKey,
        async () => {
          // Optimize query with partition key to avoid cross-partition queries
          const querySpec: SqlQuerySpec = {
            query: 'SELECT * FROM c WHERE c.segment = @segment AND c.topic = @topic ORDER BY c._ts DESC OFFSET 0 LIMIT 1',
            parameters: [
              { name: '@topic', value: topic },
              { name: '@segment', value: segment }
            ]
          };

          // Set feed options to optimize query performance
          const feedOptions: FeedOptions = {
            maxItemCount: 1  // We only need the most recent item
          };
          
          // Note: enableCrossPartitionQuery is deprecated in newer SDK versions
          // Using partitionKey in the query is the recommended approach

          const { resources } = await this.queryIntentsContainer.items
            .query(querySpec, feedOptions)
            .fetchAll();

          if (resources.length > 0) {
            return resources[0] as QueryIntent;
          }

          return null;
        },
        // Cache for 1 hour (3600 seconds)
        3600
      );
    } catch (error) {
      this.logger.error(`Error retrieving intent analysis: ${error.message}`);
      return null;
    }
  }

  /**
   * Store intent analysis in Cosmos DB
   * @param intentAnalysis Intent analysis to store
   */
  private async storeIntentAnalysis(intentAnalysis: QueryIntent): Promise<void> {
    try {
      // Store in Cosmos DB
      await this.queryIntentsContainer.items.upsert(intentAnalysis);
      this.logger.log(`Intent analysis stored for topic: ${intentAnalysis.topic}`);
      
      // Update cache with the new analysis
      const cacheKey = `intent_analysis:${intentAnalysis.topic.toLowerCase().replace(/\s+/g, '_')}:${intentAnalysis.segment}`;
      await this.redisCacheService.set(cacheKey, intentAnalysis, 86400); // Cache for 24 hours
      
      // Also update the Cosmos DB cache
      const cosmosKey = `cosmos_intent:${intentAnalysis.topic.toLowerCase().replace(/\s+/g, '_')}:${intentAnalysis.segment}`;
      await this.redisCacheService.set(cosmosKey, intentAnalysis, 3600); // Cache for 1 hour
    } catch (error) {
      this.logger.error(`Failed to store intent analysis: ${error.message}`);
      // Continue execution even if storage fails
    }
  }

  /**
   * Generate keyword clusters based on topic and themes
   * @param topic Main topic for keyword generation
   * @param themes Array of related themes
   * @param segment Optional target audience segment
   * @returns Array of keyword clusters
   */
  private generateKeywordClusters(topic: string, themes: string[], segment?: Segment): string[] {
    const baseKeywords = [
      `${topic} guide`,
      `${topic} tutorial`,
      `${topic} best practices`,
      `${topic} examples`
    ];

    // Create keywords based on themes
    const themeKeywords = themes.map(theme => [
      `${topic} ${theme}`,
      `${theme} in ${topic}`,
      `how to use ${theme} with ${topic}`,
      `${topic} ${theme} examples`
    ]).flat();

    // Create segment-specific keywords if segment is provided
    const segmentKeywords = segment ? (
      segment === 'b2b' ? [
        `${topic} for business`,
        `enterprise ${topic} solutions`,
        `${topic} ROI`,
        `${topic} implementation`,
        `${topic} integration`
      ] : [
        `${topic} for consumers`,
        `personal ${topic}`,
        `${topic} benefits`,
        `easy ${topic}`,
        `${topic} for beginners`
      ]
    ) : [];

    // Combine all keywords and remove duplicates
    return Array.from(new Set([...baseKeywords, ...themeKeywords, ...segmentKeywords]));
  }

  /**
   * Get suggested content approach based on intent and segment
   * @param topic The main topic
   * @param intent Primary intent for content approach
   * @param segment Target audience segment
   * @returns Suggested content approach as a string
   */
  private async getSuggestedApproach(topic: string, intent: string, segment: Segment): Promise<string> {
    try {
      // Try to generate a personalized approach using Azure AI
      const prompt = 'Generate a content strategy approach for ' + topic + ' with ' + intent + 
        ' intent for ' + (segment === 'b2b' ? 'business-to-business' : 'business-to-consumer') + ' audience.';

      const completion = await this.azureAIService.generateCompletion(prompt, {
        deploymentName: this.aiFoundryDeploymentName,
        temperature: 0.7,
        maxTokens: 200
      });

      const response = await this.azureAIService.getCompletion(completion);
      return response.trim();
    } catch (error) {
      this.logger.warn('Failed to generate suggested approach: ' + error.message);
      return this.getDefaultContentStrategy(intent, segment);
    }
  }

  /**
   * Get default content approach based on intent and segment
   * @param intent Primary intent for content approach
   * @param segment Target audience segment
   * @returns Default content approach as a string
   */
  private getDefaultContentStrategy(intent: string, segment: Segment): string {
    const approaches = {
      b2b: {
        'informational': 'Create in-depth, data-driven content that establishes thought leadership and addresses industry pain points',
        'commercial': 'Develop ROI-focused content that emphasizes business value, scalability, and integration capabilities',
        'navigational': 'Create structured, solution-oriented content with clear pathways to technical documentation and support',
        'transactional': 'Develop streamlined content that facilitates purchasing decisions with clear pricing models and case studies',
        'comparison': 'Create detailed comparison frameworks that evaluate solutions based on business-critical features and scalability'
      },
      b2c: {
        'informational': 'Create accessible, engaging content that answers common questions and provides value without technical jargon',
        'commercial': 'Develop persuasive content that emphasizes benefits, lifestyle improvements, and addresses personal pain points',
        'navigational': 'Create intuitive, user-friendly content that guides consumers through options with clear next steps',
        'transactional': 'Develop concise content that simplifies decision-making with compelling calls-to-action',
        'comparison': 'Create easy-to-understand comparison content that highlights key differences in features, pricing, and user benefits'
      }
    };

    // Return the appropriate approach or a generic one if not found
    return approaches[segment][intent.toLowerCase()] || 
      'Create valuable content that addresses user needs with clear structure and actionable insights';
  }

  /**
   * Get default distribution of query types
   * @param segment Optional business segment to customize distribution
   * @returns Default query type distribution
   */
  private getDefaultQueryTypes(segment?: Segment): { [key: string]: number } {
    if (segment === 'b2b') {
      return {
        informational: 0.5,
        navigational: 0.2,
        commercial: 0.2,
        transactional: 0.05,
        comparison: 0.05
      };
    } else if (segment === 'b2c') {
      return {
        informational: 0.4,
        navigational: 0.15,
        commercial: 0.15,
        transactional: 0.2,
        comparison: 0.1
      };
    } else {
      return {
        informational: 0.6,
        navigational: 0.2,
        commercial: 0.1,
        transactional: 0.05,
        comparison: 0.05
      };
    }
  }

  /**
   * Convert external search parameters to local format
   * @param externalParams External search parameters format
   * @returns Local search parameters format
   */
  private convertToLocalSearchParameters(externalParams: any): SearchParameters {
    return {
      includeDomains: Array.isArray(externalParams.includeDomains) ? externalParams.includeDomains : [],
      excludeDomains: Array.isArray(externalParams.excludeDomains) ? externalParams.excludeDomains : [],
      contentTypes: Array.isArray(externalParams.contentTypes) ? externalParams.contentTypes : ['article', 'blog'],
      timeframe: externalParams.timeframe || 'recent',
      filters: {
        recency: externalParams.filters?.recency || 'last_year',
        contentTypes: Array.isArray(externalParams.filters?.contentTypes) ? 
          externalParams.filters.contentTypes : ['article', 'blog'],
        minLength: externalParams.filters?.minLength || '500'
      },
      semanticBoost: externalParams.semanticBoost !== undefined ? externalParams.semanticBoost : true,
      expandedQueries: Array.isArray(externalParams.expandedQueries) ? externalParams.expandedQueries : [],
      semanticQueries: Array.isArray(externalParams.semanticQueries) ? externalParams.semanticQueries : []
    };
  }

  /**
   * Create default response when AI analysis fails
   * @param topic Topic that was analyzed
   * @param segment Optional business segment
   * @returns Default query intent analysis
   */
  private createDefaultResponse(topic: string, segment?: Segment): QueryIntent {
    const timestamp = new Date().toISOString();
    const defaultIntent = 'informational';
    const defaultSearchParams: SearchParameters = {
      includeDomains: [],
      excludeDomains: [],
      contentTypes: ['article', 'blog', 'guide'],
      timeframe: 'last_year',
      filters: {
        recency: segment === 'b2b' ? 'last_year' : 'last_month',
        contentTypes: this.mapIntentToContentType(defaultIntent),
        minLength: segment === 'b2b' ? '2000' : '1000'
      },
      semanticBoost: true,
      expandedQueries: [topic + ' guide', topic + ' tutorial'],
      semanticQueries: ['how to use ' + topic, 'learn about ' + topic]
    };

    return {
      id: uuidv4(),
      topic,
      segment,
      primaryIntent: defaultIntent,
      secondaryIntents: ['navigational'],
      keyThemes: [topic + ' basics', topic + ' examples', topic + ' best practices'],
      searchParameters: defaultSearchParams,
      timestamp,
      confidence: 0.5,
      suggestedApproach: segment ? 
        this.getDefaultContentStrategy(defaultIntent, segment) : 
        'Create informational content focusing on basic concepts and practical examples',
      intentScores: {
        informational: 0.7,
        navigational: 0.2,
        transactional: 0.05,
        commercial: 0.05
      },
      expandedQueries: [topic + ' guide', topic + ' tutorial', topic + ' examples'],
      semanticQueries: ['how to use ' + topic, 'learn about ' + topic],
      relatedConcepts: [topic + ' basics', topic + ' fundamentals'],
      queryExpansion: {
        expandedQueries: [topic + ' guide', topic + ' tutorial', topic + ' examples'],
        semanticQueries: ['how to use ' + topic, 'learn about ' + topic],
        relatedConcepts: [topic + ' basics', topic + ' fundamentals']
      },
      semanticSearchResults: []
    };
  }

  /**
   * Map content intent to preferred content types
   * @param intent The primary content intent
   * @returns Array of content types suited for the intent
   */
  private mapIntentToContentType(intent: string): string[] {
    switch (intent.toLowerCase()) {
      case 'informational':
        return ['article', 'blog', 'guide', 'tutorial', 'whitepaper'];
      case 'transactional':
        return ['product', 'service', 'landing-page', 'review'];
      case 'navigational':
        return ['homepage', 'category-page', 'directory', 'index'];
      case 'commercial':
        return ['review', 'comparison', 'case-study', 'testimonial'];
      default:
        return ['article', 'blog', 'guide'];
    }
  }

  /**
   * Perform semantic search using Azure AI Search
   * @param query Search query
   * @param options Search options
   */
  private async performSemanticSearch(query: string, options?: any): Promise<SemanticSearchResult> {
    try {
      // Generate a cache key based on query and options
      const optionsHash = JSON.stringify(options || {});
      const cacheKey = `semantic_search:${query.toLowerCase().replace(/\s+/g, '_')}:${Buffer.from(optionsHash).toString('base64').substring(0, 10)}`;
      
      // Try to get from cache first with a shorter TTL for search results
      return await this.redisCacheService.getOrSet<SemanticSearchResult>(
        cacheKey,
        async () => {
          if (!this.searchEndpoint || !this.searchKey) {
            throw new Error('Azure AI Search configuration is incomplete');
          }

          const searchUrl = `${this.searchEndpoint}/indexes/${this.searchIndexName}/docs/search?api-version=2023-07-01-Preview`;
          const headers = {
            'Content-Type': 'application/json',
            'api-key': this.searchKey
          };

          const searchBody = {
            search: query,
            queryType: 'semantic',
            semanticConfiguration: 'default',
            top: options?.top || 10,
            queryLanguage: options?.queryLanguage || 'en-us',
            filter: options?.filter || '',
            select: 'title,url,content,description,name' // Optimize by selecting only needed fields
          };

          const response = await axios.post(searchUrl, searchBody, { headers });
          const results = response.data.value.map(item => ({
            title: item.title || item.name || '',
            url: item.url || '',
            snippet: item.content || item.description || '',
            score: item['@search.score'] || 0
          }));

          return {
            query,
            results,
            totalResults: response.data['@odata.count'] || results.length,
            executionTime: response.data['@search.latency'] || 0
          };
        },
        // Cache for 30 minutes (1800 seconds) as search results may change more frequently
        1800
      );
    } catch (error) {
      this.logger.warn(`Semantic search failed: ${error.message}`);
      return {
        query,
        results: [],
        totalResults: 0,
        executionTime: 0
      };
    }
  }
}
