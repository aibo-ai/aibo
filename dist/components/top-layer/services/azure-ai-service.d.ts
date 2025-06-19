import { KeyVaultService } from '../../../common/services/key-vault.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { TextEmbeddingInput, TextGenerationInput, TextSearchInput, TextAnalysisInput } from './interfaces/azure-ai-inputs';
export interface TextGenerationOutput {
    text: string;
    finishReason?: string;
    usage?: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
}
export interface TextSearchOutput {
    results: Array<{
        id: string;
        title?: string;
        content?: string;
        score: number;
        metadata?: Record<string, any>;
    }>;
    count: number;
    facets?: Record<string, Array<{
        value: string;
        count: number;
    }>>;
}
export interface TextEmbeddingOutput {
    embeddings: number[][];
    dimensions: number;
    usage: {
        promptTokens: number;
        totalTokens: number;
    };
}
export interface TextAnalysisOutput {
    kind: string;
    language: string;
    results: any;
    warnings?: string[];
    entities?: Array<{
        text: string;
        category: string;
        offset: number;
        length: number;
        confidenceScore: number;
    }>;
    keyPhrases?: string[];
    sentiment?: string;
    confidenceScores?: {
        positive: number;
        negative: number;
        neutral: number;
    };
}
export declare class AzureAIService {
    private readonly keyVaultService;
    private readonly appInsights;
    private readonly logger;
    private azureOpenAiEndpoint;
    private azureOpenAiKey;
    private azureSearchEndpoint;
    private azureSearchKey;
    private azureSearchIndex;
    constructor(keyVaultService: KeyVaultService, appInsights: ApplicationInsightsService);
    initializeCredentials(): Promise<void>;
    generateCompletion(input: TextGenerationInput): Promise<TextGenerationOutput>;
    search(input: TextSearchInput): Promise<TextSearchOutput>;
    generateEmbeddings(input: TextEmbeddingInput): Promise<TextEmbeddingOutput>;
    analyzeText(input: TextAnalysisInput): Promise<TextAnalysisOutput>;
}
