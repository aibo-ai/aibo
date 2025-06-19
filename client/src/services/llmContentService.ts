import axios from 'axios';
import { API_BASE_URL } from '../config';
import { 
  LLMContentInput, 
  LLMContentOutput, 
  LLMContentAnalysisResult, 
  ChunkingResult,
  ApiResponse
} from '../types/llmContent';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const llmContentService = {
  /**
   * Generate LLM-optimized content based on input specifications
   */
  generateContent: async (data: LLMContentInput): Promise<ApiResponse<LLMContentOutput>> => {
    try {
      const response = await api.post<ApiResponse<LLMContentOutput>>('/llm-content/generate', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to generate content');
      }
      throw new Error('Failed to generate content');
    }
  },

  /**
   * Enhance existing content to be more LLM-friendly
   */
  enhanceContent: async (data: { content: string; targetLLM?: string }): Promise<ApiResponse<{ enhancedContent: string }>> => {
    try {
      const response = await api.post<ApiResponse<{ enhancedContent: string }>>('/llm-content/enhance', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to enhance content');
      }
      throw new Error('Failed to enhance content');
    }
  },

  /**
   * Analyze content for LLM optimization opportunities
   */
  analyzeContent: async (data: { content: string; targetLLM?: string }): Promise<ApiResponse<LLMContentAnalysisResult>> => {
    try {
      const response = await api.post<ApiResponse<LLMContentAnalysisResult>>('/llm-content/analyze', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to analyze content');
      }
      throw new Error('Failed to analyze content');
    }
  },

  /**
   * Chunk content for optimal LLM processing
   */
  chunkContent: async (data: { 
    content: string; 
    chunkType?: 'semantic' | 'fixed' | 'hybrid'; 
    targetTokenSize?: number 
  }): Promise<ApiResponse<ChunkingResult>> => {
    try {
      const response = await api.post<ApiResponse<ChunkingResult>>('/llm-content/chunk', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Failed to chunk content');
      }
      throw new Error('Failed to chunk content');
    }
  },
};

export default llmContentService;
