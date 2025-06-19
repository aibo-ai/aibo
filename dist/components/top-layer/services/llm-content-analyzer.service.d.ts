import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { AzureAIService } from './azure-ai-service';
import { ContentChunkerService } from '../../bottom-layer/services/content-chunker.service';
export interface LLMContentAnalysisResult {
    analysisId: string;
    contentLength: number;
    targetLLM: string;
    metrics: {
        readabilityScore: number;
        semanticDensity: number;
        contextualRelevance: number;
        cohesionScore: number;
        llmQualityScore: number;
    };
    issues: Array<{
        type: string;
        severity: 'high' | 'medium' | 'low';
        description: string;
        examples?: string[];
        remediation?: string;
    }>;
    recommendations: string[];
    timestamp: string;
}
export interface ChunkingResult {
    chunkingId: string;
    originalLength: number;
    contentSnapshot: string;
    chunkType: 'semantic' | 'fixed' | 'hybrid';
    targetTokenSize: number;
    chunks: Array<{
        id: string;
        content: string;
        estimatedTokenCount: number;
        startPosition: number;
        endPosition: number;
    }>;
    metrics: {
        chunkCount: number;
        averageChunkSize: number;
        tokenReductionPercentage: number;
        contextPreservationScore: number;
    };
    timestamp: string;
}
export declare class LLMContentAnalyzerService {
    private readonly azureAIService;
    private readonly contentChunker;
    private readonly appInsights;
    private readonly logger;
    constructor(azureAIService: AzureAIService, contentChunker: ContentChunkerService, appInsights: ApplicationInsightsService);
    analyzeContent(content: string, targetLLM?: string): Promise<LLMContentAnalysisResult>;
    private generateFallbackAnalysis;
    chunkContent(content: string, chunkType?: 'semantic' | 'fixed' | 'hybrid', targetTokenSize?: number): Promise<ChunkingResult>;
}
