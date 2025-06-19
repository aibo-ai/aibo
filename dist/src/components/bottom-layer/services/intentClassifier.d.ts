import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { Segment } from './query-intent-analyzer.service';
export interface IntentClassificationResult {
    primaryIntent: string;
    secondaryIntents: string[];
    intentScores: {
        informational: number;
        navigational: number;
        transactional: number;
        commercial: number;
    };
    keyThemes: string[];
    confidence: number;
}
export declare class IntentClassifier {
    private configService;
    private azureAIService;
    private readonly logger;
    constructor(configService: ConfigService, azureAIService: AzureAIService);
    classifyIntent(topic: string): Promise<IntentClassificationResult>;
    classifyIntentWithSegment(topic: string, segment: Segment): Promise<IntentClassificationResult>;
    private getDefaultIntentClassification;
}
