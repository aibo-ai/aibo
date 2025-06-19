import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { AzureAIService } from './azure-ai-service';
import { BlufContentStructurerService } from '../../middle-layer/services/bluf-content-structurer.service';
import { ContentChunkerService } from '../../bottom-layer/services/content-chunker.service';
import { ClaudeAIService } from '../../../shared/services/claude-ai.service';
export interface LLMContentInput {
    topic: string;
    contentType: 'blog_post' | 'technical_guide' | 'case_study' | 'product_review' | 'industry_analysis' | 'social_media' | string;
    audience: 'b2b' | 'b2c';
    keyPoints?: string[];
    toneOfVoice?: 'formal' | 'conversational' | 'technical' | 'friendly' | string;
    targetLength?: 'short' | 'medium' | 'long';
    purpose?: string;
    searchKeywords?: string[];
    llmTarget?: 'general' | 'gpt4' | 'claude' | 'palm' | string;
}
export interface LLMContentSection {
    title: string;
    content: string;
}
export interface LLMContentOutput {
    id: string;
    topic: string;
    contentType: string;
    audience: string;
    toneOfVoice: string;
    title: string;
    summary: string;
    sections: LLMContentSection[];
    metadata: {
        optimizedFor: string;
        readabilityScore: number;
        semanticDensity: number;
        contextualRelevance: number;
        estimatedTokenCount: number;
        llmQualityScore: number;
    };
    generatedAt: string;
}
export declare class LLMContentOptimizerService {
    private readonly azureAIService;
    private readonly blufContentStructurer;
    private readonly contentChunker;
    private readonly appInsights;
    private readonly claudeAIService;
    private readonly logger;
    constructor(azureAIService: AzureAIService, blufContentStructurer: BlufContentStructurerService, contentChunker: ContentChunkerService, appInsights: ApplicationInsightsService, claudeAIService: ClaudeAIService);
    generateLLMOptimizedContent(input: LLMContentInput): Promise<LLMContentOutput>;
    private generateOptimizedTitle;
    private generateContentSections;
    private generateContentSummary;
    private calculateContentMetrics;
    private parseMetricsFromText;
    private getTargetTokens;
    private buildTitlePrompt;
    private buildSectionPrompt;
    enhanceLLMOptimization(content: string, targetLLM?: string): Promise<string>;
}
