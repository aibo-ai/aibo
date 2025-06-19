/**
 * API Response wrapper interface for consistent frontend API responses
 */
export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

/**
 * LLM Content Generation Input Interface
 */
export interface LLMContentInput {
  topic: string;
  contentType: 'blog_post' | 'technical_guide' | 'case_study' | 'product_review' | 'industry_analysis' | 'social_media';
  audience: 'b2b' | 'b2c';
  keyPoints?: string[];
  toneOfVoice?: 'formal' | 'conversational' | 'technical' | 'friendly';
  targetLength?: 'short' | 'medium' | 'long';
  purpose?: string;
  searchKeywords?: string[];
  llmTarget?: 'general' | 'gpt4' | 'claude' | 'palm';
}

/**
 * LLM Content Section
 */
export interface ContentSection {
  title: string;
  content: string;
}

/**
 * LLM Content Generation Output Interface
 */
export interface LLMContentOutput {
  contentId: string;
  title: string;
  summary: string;
  sections: ContentSection[];
  contentType: string;
  audience: string;
  toneOfVoice: string;
  metadata: {
    optimizedFor: string;
    estimatedTokenCount: number;
    llmQualityScore: number;
    semanticScore: number;
  };
  generatedAt: string;
}

/**
 * LLM Content Analysis Result Interface
 */
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

/**
 * Content Chunking Result Interface
 */
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
