"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AzureIntegrationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureIntegrationService = void 0;
const common_1 = require("@nestjs/common");
const azure_ai_service_1 = require("../../top-layer/services/azure-ai-service");
let AzureIntegrationService = AzureIntegrationService_1 = class AzureIntegrationService {
    constructor(azureAIService) {
        this.azureAIService = azureAIService;
        this.logger = new common_1.Logger(AzureIntegrationService_1.name);
    }
    async generateContent(prompt, options) {
        try {
            let enhancedPrompt = prompt;
            if (options.keywords && options.keywords.length > 0) {
                enhancedPrompt += `\n\nIncorporate these keywords: ${options.keywords.join(', ')}`;
            }
            if (options.contentType) {
                enhancedPrompt += `\n\nThis content should be formatted as a ${options.contentType}.`;
            }
            if (options.industry) {
                enhancedPrompt += `\n\nThis is for the ${options.industry} industry.`;
            }
            const generationResult = await this.azureAIService.generateCompletion({
                prompt: enhancedPrompt,
                maxTokens: options.maxTokens || 2000,
                temperature: options.temperature || 0.7,
            });
            const generatedText = generationResult.text.trim();
            const contentId = `content-${Date.now()}`;
            const sections = this.splitIntoSections(generatedText);
            return {
                data: {
                    id: contentId,
                    content: generatedText,
                    sections: sections,
                }
            };
        }
        catch (error) {
            this.logger.error(`Error generating content: ${error.message}`);
            return {
                error: `Failed to generate content: ${error.message}`
            };
        }
    }
    async optimizeContent(content, options) {
        try {
            let optimizationPrompt = `Optimize the following content`;
            if (options.keywords && options.keywords.length > 0) {
                optimizationPrompt += ` for these keywords: ${options.keywords.join(', ')}`;
            }
            if (options.goals && options.goals.length > 0) {
                optimizationPrompt += `\nOptimize specifically for: ${options.goals.join(', ')}`;
            }
            optimizationPrompt += `\n\nOriginal content:\n${content}\n\nProvide the optimized content without any additional comments.`;
            const optimizationResult = await this.azureAIService.generateCompletion({
                prompt: optimizationPrompt,
                maxTokens: content.length * 1.2,
                temperature: 0.3,
            });
            const suggestionsPrompt = `Analyze the following content and provide 3-5 specific improvement suggestions:

${content}

Format each suggestion as a brief, actionable item.`;
            const suggestionsResult = await this.azureAIService.generateCompletion({
                prompt: suggestionsPrompt,
                maxTokens: 500,
                temperature: 0.7,
            });
            const suggestions = suggestionsResult.text
                .split('\n')
                .filter(line => line.trim().length > 0)
                .slice(0, 5);
            const scores = {
                overall: this.calculateScore(0.7, 0.9),
                readability: this.calculateScore(0.6, 0.85),
                seo: this.calculateScore(0.7, 0.95),
                engagement: this.calculateScore(0.65, 0.9),
            };
            return {
                data: {
                    optimizedContent: optimizationResult.text.trim(),
                    improvementSuggestions: suggestions,
                    scores,
                }
            };
        }
        catch (error) {
            this.logger.error(`Error optimizing content: ${error.message}`);
            return {
                error: `Failed to optimize content: ${error.message}`
            };
        }
    }
    async searchContent(query, options) {
        try {
            const searchResults = await this.azureAIService.search({
                query,
                filters: options.filters,
                top: options.limit || 10,
                skip: options.offset || 0,
            });
            return {
                data: {
                    results: searchResults.results.map(result => {
                        var _a;
                        return ({
                            id: result.id,
                            title: result.title || 'Untitled',
                            snippet: ((_a = result.content) === null || _a === void 0 ? void 0 : _a.substring(0, 200)) || '',
                            score: result.score,
                        });
                    }),
                    totalCount: searchResults.count,
                }
            };
        }
        catch (error) {
            this.logger.error(`Error searching content: ${error.message}`);
            return {
                error: `Failed to search content: ${error.message}`
            };
        }
    }
    async generateEmbeddings(texts) {
        try {
            const embeddingsResult = await this.azureAIService.generateEmbeddings({
                text: texts,
            });
            return {
                data: {
                    embeddings: embeddingsResult.embeddings,
                    dimensions: embeddingsResult.dimensions,
                }
            };
        }
        catch (error) {
            this.logger.error(`Error generating embeddings: ${error.message}`);
            return {
                error: `Failed to generate embeddings: ${error.message}`
            };
        }
    }
    async analyzeContent(text) {
        var _a, _b, _c;
        try {
            const entityResult = await this.azureAIService.analyzeText({
                text,
                kind: 'EntityRecognition',
            });
            const keyPhraseResult = await this.azureAIService.analyzeText({
                text,
                kind: 'KeyPhraseExtraction',
            });
            const sentimentResult = await this.azureAIService.analyzeText({
                text,
                kind: 'SentimentAnalysis',
            });
            return {
                data: {
                    entities: entityResult.entities || [],
                    keyPhrases: keyPhraseResult.keyPhrases || [],
                    sentiment: {
                        overall: sentimentResult.sentiment || 'neutral',
                        positive: ((_a = sentimentResult.confidenceScores) === null || _a === void 0 ? void 0 : _a.positive) || 0,
                        negative: ((_b = sentimentResult.confidenceScores) === null || _b === void 0 ? void 0 : _b.negative) || 0,
                        neutral: ((_c = sentimentResult.confidenceScores) === null || _c === void 0 ? void 0 : _c.neutral) || 0,
                    }
                }
            };
        }
        catch (error) {
            this.logger.error(`Error analyzing content: ${error.message}`);
            return {
                error: `Failed to analyze content: ${error.message}`
            };
        }
    }
    async getContentStatus(contentId) {
        const timestamp = parseInt(contentId.split('-')[1] || '0', 10);
        const currentTime = Date.now();
        const elapsedTime = currentTime - timestamp;
        if (elapsedTime < 5000) {
            return {
                data: {
                    id: contentId,
                    status: 'pending',
                    progress: 10,
                    estimatedCompletionTime: new Date(currentTime + 20000).toISOString(),
                }
            };
        }
        else if (elapsedTime < 15000) {
            const progress = Math.min(95, Math.floor(elapsedTime / 300));
            return {
                data: {
                    id: contentId,
                    status: 'processing',
                    progress,
                    estimatedCompletionTime: new Date(currentTime + 10000).toISOString(),
                }
            };
        }
        else {
            return {
                data: {
                    id: contentId,
                    status: 'completed',
                    progress: 100,
                }
            };
        }
    }
    splitIntoSections(text) {
        const headingPattern = /^#{1,6}\s+(.+)$/gm;
        const sections = [];
        if (!text.match(headingPattern)) {
            return [
                {
                    id: '1',
                    title: 'Main Content',
                    content: text.trim(),
                }
            ];
        }
        const headings = [];
        let match;
        while ((match = headingPattern.exec(text)) !== null) {
            headings.push({
                index: match.index,
                title: match[1].trim(),
            });
        }
        for (let i = 0; i < headings.length; i++) {
            const currentHeading = headings[i];
            const nextHeading = headings[i + 1];
            const startIndex = currentHeading.index;
            const endIndex = nextHeading ? nextHeading.index : text.length;
            let sectionContent = text.substring(startIndex, endIndex).trim();
            sectionContent = sectionContent.replace(/^#{1,6}\s+.+$/m, '').trim();
            sections.push({
                id: (i + 1).toString(),
                title: currentHeading.title,
                content: sectionContent,
            });
        }
        return sections;
    }
    calculateScore(min, max) {
        return Number((Math.random() * (max - min) + min).toFixed(2));
    }
};
exports.AzureIntegrationService = AzureIntegrationService;
exports.AzureIntegrationService = AzureIntegrationService = AzureIntegrationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [azure_ai_service_1.AzureAIService])
], AzureIntegrationService);
//# sourceMappingURL=azure-integration.service.js.map