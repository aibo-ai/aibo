import { AzureAIService } from '../../top-layer/services/azure-ai-service';
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}
export declare class AzureIntegrationService {
    private readonly azureAIService;
    private readonly logger;
    constructor(azureAIService: AzureAIService);
    generateContent(prompt: string, options: {
        maxTokens?: number;
        temperature?: number;
        keywords?: string[];
        contentType?: string;
        industry?: string;
    }): Promise<ApiResponse<{
        id: string;
        content: string;
        sections?: Array<{
            id: string;
            title: string;
            content: string;
        }>;
    }>>;
    optimizeContent(content: string, options: {
        keywords?: string[];
        goals?: Array<'readability' | 'seo' | 'engagement'>;
        contentId?: string;
    }): Promise<ApiResponse<{
        optimizedContent: string;
        improvementSuggestions: string[];
        scores: {
            overall: number;
            readability: number;
            seo: number;
            engagement: number;
        };
    }>>;
    searchContent(query: string, options: {
        filters?: string;
        limit?: number;
        offset?: number;
    }): Promise<ApiResponse<{
        results: Array<{
            id: string;
            title: string;
            snippet: string;
            score: number;
        }>;
        totalCount: number;
    }>>;
    generateEmbeddings(texts: string[]): Promise<ApiResponse<{
        embeddings: number[][];
        dimensions: number;
    }>>;
    analyzeContent(text: string): Promise<ApiResponse<{
        entities: Array<{
            text: string;
            category: string;
            confidenceScore: number;
        }>;
        keyPhrases: string[];
        sentiment: {
            overall: string;
            positive: number;
            negative: number;
            neutral: number;
        };
    }>>;
    getContentStatus(contentId: string): Promise<ApiResponse<{
        id: string;
        status: 'pending' | 'processing' | 'completed' | 'failed';
        progress: number;
        estimatedCompletionTime?: string;
    }>>;
    private splitIntoSections;
    private calculateScore;
}
