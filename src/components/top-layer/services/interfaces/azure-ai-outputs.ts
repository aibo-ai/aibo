/**
 * Output interface for text generation operations
 */
export interface TextGenerationOutput {
  /** The generated text content */
  text: string;
  /** The reason why the generation finished */
  finishReason: string;
  /** The model used for generation */
  modelUsed: string;
  /** Token usage statistics */
  tokensUsed: {
    /** Number of tokens in the prompt */
    prompt: number;
    /** Number of tokens in the completion */
    completion: number;
    /** Total number of tokens used */
    total: number;
  };
}

/**
 * Output interface for text search operations
 */
export interface TextSearchOutput {
  /** List of search results */
  results: Array<{
    /** Document ID */
    id: string;
    /** Search relevance score */
    score: number;
    /** Complete document with all fields */
    document: any;
  }>;
  /** Total number of matching results */
  count: number;
}

/**
 * Output interface for text embedding operations
 */
export interface TextEmbeddingOutput {
  /** List of embedding vectors */
  embeddings: number[][];
  /** Number of dimensions in each embedding */
  dimensions: number;
  /** The model used to generate embeddings */
  modelUsed: string;
  /** Total number of tokens used */
  tokensUsed: number;
}

/**
 * Output interface for text analysis operations
 */
export interface TextAnalysisOutput {
  /** Type of analysis performed */
  kind: string;
  /** Language of the analyzed text */
  language: string;
  /** Extracted entities (for entity recognition) */
  entities?: Array<{
    text: string;
    category: string;
    confidenceScore: number;
  }>;
  /** Extracted key phrases (for key phrase extraction) */
  keyPhrases?: string[];
  /** Overall sentiment (for sentiment analysis) */
  sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
  /** Confidence scores for sentiment */
  confidenceScores?: {
    positive: number;
    negative: number;
    neutral: number;
  };
  /** Sentence-level sentiment analysis */
  sentences?: Array<{
    text: string;
    sentiment: string;
    confidenceScores: {
      positive: number;
      negative: number;
      neutral: number;
    };
  }>;
}
