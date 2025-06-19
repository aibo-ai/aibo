import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { IntentClassificationResult } from './intentClassifier';
import { Segment } from './query-intent-analyzer.service';
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
}
export declare class SearchParameterGenerator {
    private configService;
    private azureAIService;
    private readonly logger;
    constructor(configService: ConfigService, azureAIService: AzureAIService);
    generateSearchParameters(topic: string, intentResult: IntentClassificationResult): Promise<SearchParameters>;
    generateSearchParametersForSegment(topic: string, intentResult: IntentClassificationResult, segment: Segment): Promise<SearchParameters>;
    private mapIntentToContentType;
    private mapIntentToContentTypeForSegment;
    private getDefaultSearchParameters;
    private getDefaultSearchParametersForSegment;
}
