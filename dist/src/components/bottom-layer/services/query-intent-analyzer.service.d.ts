import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { IntentClassifier } from './intentClassifier';
import { QueryGenerator } from './queryGenerator';
import { SearchParameterGenerator } from './searchParameterGenerator';
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
export declare class QueryIntentAnalyzerService implements OnModuleInit {
    private configService;
    private azureAIService;
    private intentClassifier;
    private queryGenerator;
    private searchParameterGenerator;
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
    constructor(configService: ConfigService, azureAIService: AzureAIService, intentClassifier: IntentClassifier, queryGenerator: QueryGenerator, searchParameterGenerator: SearchParameterGenerator);
    onModuleInit(): Promise<void>;
    private initializeCosmosResources;
    analyzeIntent(userInput: UserInput): Promise<QueryIntent>;
    analyzeIntent(topic: string): Promise<QueryIntent>;
    analyzeIntent(userInput: UserInput, segment: Segment): Promise<QueryIntent>;
    private mapIntentToContentType;
    private storeIntentAnalysis;
    analyzeTopicIntent(topic: string): Promise<QueryIntent>;
    private analyzeUserInputIntent;
    private analyzeSegmentIntent;
    private getDefaultContentStrategy;
    private createDefaultResponse;
    private getDefaultQueryTypes;
    private generateKeywordClusters;
    private getSuggestedApproach;
    private getDefaultApproachBySegment;
    private expandQuery;
    private generateSearchParameters;
    private generateSearchParametersForSegment;
    private performSemanticSearch;
}
