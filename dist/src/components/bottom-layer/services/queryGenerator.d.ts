import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { IntentClassificationResult } from './intentClassifier';
import { Segment } from './query-intent-analyzer.service';
export interface QueryExpansionResult {
    originalQuery: string;
    expandedQueries: string[];
    semanticQueries: string[];
    relatedConcepts: string[];
    conversationalQueries: string[];
    confidence: number;
}
export declare class QueryGenerator {
    private configService;
    private azureAIService;
    private readonly logger;
    constructor(configService: ConfigService, azureAIService: AzureAIService);
    generateConversationalQueries(topic: string, intentResult: IntentClassificationResult): Promise<QueryExpansionResult>;
    generateConversationalQueriesWithSegment(topic: string, intentResult: IntentClassificationResult, segment: Segment): Promise<QueryExpansionResult>;
    private createDefaultQueryExpansion;
}
