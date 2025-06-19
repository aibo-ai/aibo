export interface TextGenerationInput {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
    deploymentName?: string;
    systemMessage?: string;
    stream?: boolean;
}
export interface TextSearchInput {
    query: string;
    filters?: string;
    top?: number;
    skip?: number;
    searchMode?: string;
    semantic?: boolean;
    vectorSearch?: boolean;
}
export interface TextEmbeddingInput {
    text: string | string[];
    deploymentName?: string;
}
export interface TextAnalysisInput {
    text: string;
    kind: 'EntityRecognition' | 'KeyPhraseExtraction' | 'SentimentAnalysis';
    language?: string;
}
export interface VectorIndexInput {
    id: string;
    content: string;
    metadata?: Record<string, any>;
    vector?: number[];
}
