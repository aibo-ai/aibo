export interface TextGenerationOutput {
    text: string;
    finishReason: string;
    modelUsed: string;
    tokensUsed: {
        prompt: number;
        completion: number;
        total: number;
    };
}
export interface TextSearchOutput {
    results: Array<{
        id: string;
        score: number;
        document: any;
    }>;
    count: number;
}
export interface TextEmbeddingOutput {
    embeddings: number[][];
    dimensions: number;
    modelUsed: string;
    tokensUsed: number;
}
export interface TextAnalysisOutput {
    kind: string;
    language: string;
    entities?: Array<{
        text: string;
        category: string;
        confidenceScore: number;
    }>;
    keyPhrases?: string[];
    sentiment?: 'positive' | 'negative' | 'neutral' | 'mixed';
    confidenceScores?: {
        positive: number;
        negative: number;
        neutral: number;
    };
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
