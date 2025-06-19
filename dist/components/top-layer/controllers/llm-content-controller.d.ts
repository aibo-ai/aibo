import { LLMContentOptimizerService, LLMContentInput, LLMContentOutput } from '../services/llm-content-optimizer.service';
import { LLMContentAnalyzerService, LLMContentAnalysisResult, ChunkingResult } from '../services/llm-content-analyzer.service';
import { ApiResponse as ApiResponseType } from '../../../common/interfaces/api-response.interface';
export declare class LLMContentController {
    private readonly llmContentOptimizerService;
    private readonly llmContentAnalyzerService;
    constructor(llmContentOptimizerService: LLMContentOptimizerService, llmContentAnalyzerService: LLMContentAnalyzerService);
    generateContent(contentInput: LLMContentInput): Promise<ApiResponseType<LLMContentOutput>>;
    enhanceContent(data: {
        content: string;
        targetLLM?: string;
    }): Promise<ApiResponseType<{
        enhancedContent: string;
    }>>;
    analyzeContent(data: {
        content: string;
        targetLLM?: string;
    }): Promise<ApiResponseType<LLMContentAnalysisResult>>;
    chunkContent(data: {
        content: string;
        chunkType?: 'semantic' | 'fixed' | 'hybrid';
        targetTokenSize?: number;
    }): Promise<ApiResponseType<ChunkingResult>>;
}
