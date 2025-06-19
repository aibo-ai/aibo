import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
export interface UserInput {
    topic: string;
    context?: string;
    keywords?: string[];
    industry?: string;
    audience?: string;
    goals?: string;
}
export type Segment = 'b2b' | 'b2c';
export interface QueryExpansionResult {
    originalQuery: string;
    expandedQueries: string[];
    semanticQueries: string[];
    relatedConcepts: string[];
    confidence: number;
}
export interface SearchResultItem {
    title: string;
    url: string;
    snippet: string;
    score: number;
}
export interface SemanticSearchResult {
    query: string;
    results: SearchResultItem[];
    totalResults: number;
    executionTime: number;
}
export interface QueryIntent {
    id: string;
    topic: string;
    segment?: Segment;
    primaryIntent: string;
    secondaryIntents?: string[];
    keyThemes: string[];
    keywordClusters?: string[];
    conversationalQueries?: string[];
    queryTypeDistribution?: {
        [key: string]: number;
    };
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
    queryExpansion?: {
        expandedQueries: string[];
        semanticQueries: string[];
        relatedConcepts: string[];
    };
    semanticSearchResults?: SearchResultItem[];
}
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
export interface QueryExpansionResult {
    originalQuery: string;
    expandedQueries: string[];
    semanticQueries: string[];
    relatedConcepts: string[];
    confidence: number;
}
export interface SemanticSearchResult {
    query: string;
    results: {
        title: string;
        url: string;
        snippet: string;
        score: number;
    }[];
    totalResults: number;
    executionTime: number;
}
export declare class QueryIntentAnalyzerService implements OnModuleInit {
    private configService;
    private azureAIService;
    private readonly logger;
    private cosmosClient;
    private database;
    private container;
    private strategyContainer;
    private queryIntentsContainer;
    private contentStrategiesContainer;
    private readonly databaseId;
    private readonly containerId;
    private readonly strategyContainerId;
    private readonly searchEndpoint;
    private readonly searchKey;
    private readonly searchIndexName;
    private readonly aiFoundryEndpoint;
    private readonly aiFoundryKey;
    private readonly aiFoundryDeploymentName;
    constructor(configService: ConfigService, azureAIService: AzureAIService);
    onModuleInit(): Promise<void>;
    private initializeCosmosResources;
    analyzeIntent(userInput: UserInput): Promise<QueryIntent>;
    analyzeIntent(topic: string): Promise<QueryIntent>;
    analyzeIntent(userInput: UserInput, segment: Segment): Promise<QueryIntent>;
    private mapIntentToContentType;
    private storeIntentAnalysis;
    private analyzeTopicIntent;
    private analyzeUserInputIntent;
    private analyzeSegmentIntent;
    createContentStrategy(intentAnalysis: any, segment: Segment): Promise<any>;
    private generateContentStrategy;
    private getDefaultContentStrategy;
    private generateSearchParametersForSegment;
    private createDefaultResponse;
    private getDefaultQueryTypes;
    private generateKeywordClusters;
    private getSuggestedApproach;
    private generateSearchParameters;
    expandQuery(query: string): Promise<QueryExpansionResult>;
    private createDefaultQueryExpansion;
    performSemanticSearch(query: string, options?: any): Promise<SemanticSearchResult>;
    private simulateSearchResults;
    private getStrategyTemplate;
    private getDefaultApproachBySegment;
}
