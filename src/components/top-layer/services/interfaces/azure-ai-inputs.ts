/**
 * Input interface for text generation operations using Azure OpenAI
 */
export interface TextGenerationInput {
  /** The prompt to generate text from */
  prompt: string;
  /** Maximum number of tokens to generate */
  maxTokens?: number;
  /** Temperature controls randomness (0-1), higher values mean more random completions */
  temperature?: number;
  /** The name of the Azure OpenAI deployment to use */
  deploymentName?: string;
  /** Additional system instructions for chat-based models */
  systemMessage?: string;
  /** Whether to stream the response */
  stream?: boolean;
}

/**
 * Input interface for text search operations using Azure Cognitive Search
 */
export interface TextSearchInput {
  /** The search query text */
  query: string;
  /** OData filter expression */
  filters?: string;
  /** Number of results to return */
  top?: number;
  /** Number of results to skip */
  skip?: number;
  /** Search mode: 'all' or 'any' */
  searchMode?: string;
  /** Whether to use semantic search */
  semantic?: boolean;
  /** Whether to include vector search */
  vectorSearch?: boolean;
}

/**
 * Input interface for text embedding operations using Azure OpenAI
 */
export interface TextEmbeddingInput {
  /** Text to generate embeddings for, can be a single string or array of strings */
  text: string | string[];
  /** The name of the Azure OpenAI embedding deployment to use */
  deploymentName?: string;
}

/**
 * Input interface for text analysis operations using Azure AI Language
 */
export interface TextAnalysisInput {
  /** Text to analyze */
  text: string;
  /** Kind of analysis to perform */
  kind: 'EntityRecognition' | 'KeyPhraseExtraction' | 'SentimentAnalysis';
  /** Language of the text */
  language?: string;
}

/**
 * Input interface for vector indexing operations
 */
export interface VectorIndexInput {
  /** ID of the document */
  id: string;
  /** Text content to index */
  content: string;
  /** Document metadata */
  metadata?: Record<string, any>;
  /** Vector representation if pre-computed */
  vector?: number[];
}
