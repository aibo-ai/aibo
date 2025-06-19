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
var LLMContentOptimizerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMContentOptimizerService = void 0;
const common_1 = require("@nestjs/common");
const application_insights_service_1 = require("../../../common/services/application-insights.service");
const azure_ai_service_1 = require("./azure-ai-service");
const bluf_content_structurer_service_1 = require("../../middle-layer/services/bluf-content-structurer.service");
const content_chunker_service_1 = require("../../bottom-layer/services/content-chunker.service");
const claude_ai_service_1 = require("../../../shared/services/claude-ai.service");
let LLMContentOptimizerService = LLMContentOptimizerService_1 = class LLMContentOptimizerService {
    constructor(azureAIService, blufContentStructurer, contentChunker, appInsights, claudeAIService) {
        this.azureAIService = azureAIService;
        this.blufContentStructurer = blufContentStructurer;
        this.contentChunker = contentChunker;
        this.appInsights = appInsights;
        this.claudeAIService = claudeAIService;
        this.logger = new common_1.Logger(LLMContentOptimizerService_1.name);
    }
    async generateLLMOptimizedContent(input) {
        const startTime = Date.now();
        this.appInsights.trackEvent('LLMContentOptimizer:Generate:Start', {
            contentType: input.contentType,
            audience: input.audience,
            targetLLM: input.llmTarget || 'general'
        });
        try {
            const structureTemplate = await this.blufContentStructurer.getStructureTemplate(input.contentType, input.audience);
            const titleResult = await this.generateOptimizedTitle(input);
            const sections = await this.generateContentSections(input, structureTemplate, titleResult);
            const summaryResult = await this.generateContentSummary(input, titleResult, sections);
            const metadata = await this.calculateContentMetrics(input, titleResult, sections, summaryResult);
            const duration = Date.now() - startTime;
            const result = {
                id: `content-${Date.now()}`,
                topic: input.topic,
                contentType: input.contentType,
                audience: input.audience,
                toneOfVoice: input.toneOfVoice || 'conversational',
                title: titleResult,
                summary: summaryResult,
                sections,
                metadata,
                generatedAt: new Date().toISOString()
            };
            this.appInsights.trackEvent('LLMContentOptimizer:Generate:Success', {
                contentType: input.contentType,
                audience: input.audience,
                durationMs: duration.toString(),
                sectionCount: sections.length.toString(),
                llmQualityScore: metadata.llmQualityScore.toString()
            });
            this.appInsights.trackMetric('LLMContentOptimizer:GenerateLatency', duration, {
                contentType: input.contentType,
                audience: input.audience,
                success: 'true'
            });
            return result;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
                contentType: input.contentType,
                audience: input.audience,
                durationMs: duration.toString(),
                operation: 'generateLLMOptimizedContent'
            });
            this.appInsights.trackMetric('LLMContentOptimizer:GenerateLatency', duration, {
                contentType: input.contentType,
                audience: input.audience,
                success: 'false'
            });
            this.logger.error(`Error generating LLM-optimized content: ${error.message}`);
            throw new Error(`Failed to generate LLM-optimized content: ${error.message}`);
        }
    }
    async generateOptimizedTitle(input) {
        const prompt = this.buildTitlePrompt(input);
        let title = '';
        let claudeError = null;
        let azureError = null;
        try {
            this.logger.log('Attempting to generate title with Claude AI');
            const result = await this.claudeAIService.generateCompletion(prompt, {
                model: 'claude-3-haiku-20240307',
                maxTokens: 50,
                temperature: 0.7
            });
            if (result && result.completion) {
                title = result.completion.trim();
                this.logger.log('Successfully generated title with Claude AI');
                return title;
            }
            this.logger.warn('Claude AI returned unexpected response format');
        }
        catch (error) {
            claudeError = error;
            this.logger.warn(`Claude AI title generation failed: ${error.message}`);
        }
        try {
            this.logger.log('Falling back to Azure OpenAI for title generation');
            const azureResult = await this.azureAIService.generateCompletion({
                prompt,
                maxTokens: 50,
                temperature: 0.7,
                deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
            });
            title = azureResult.text.trim();
            this.logger.log('Successfully generated title with Azure OpenAI');
            return title;
        }
        catch (error) {
            azureError = error;
            this.logger.error(`Azure OpenAI title generation failed: ${error.message}`);
        }
        this.logger.warn('All LLM services failed for title generation, using fallback title');
        const fallbackTitle = `${input.contentType.charAt(0).toUpperCase() + input.contentType.slice(1).replace('_', ' ')}: ${input.topic}`;
        this.logger.error(`Claude error: ${(claudeError === null || claudeError === void 0 ? void 0 : claudeError.message) || 'Unknown'}, Azure error: ${(azureError === null || azureError === void 0 ? void 0 : azureError.message) || 'Unknown'}`);
        return fallbackTitle;
    }
    async generateContentSections(input, structureTemplate, title) {
        const sections = [];
        let claudeFailureCount = 0;
        let totalSections = structureTemplate.sections.length;
        try {
            for (const sectionTitle of structureTemplate.sections) {
                const sectionPrompt = this.buildSectionPrompt(input, title, sectionTitle, sections);
                const sectionIndex = sections.length + 1;
                const useClaudeForThisSection = claudeFailureCount < Math.ceil(totalSections / 2);
                if (useClaudeForThisSection) {
                    try {
                        this.logger.log(`Generating section ${sectionIndex}/${totalSections} "${sectionTitle}" with Claude AI`);
                        const result = await this.claudeAIService.generateCompletion(sectionPrompt, {
                            model: 'claude-3-haiku-20240307',
                            maxTokens: this.getTargetTokens(input.targetLength || 'medium'),
                            temperature: 0.7
                        });
                        if (result && result.completion) {
                            sections.push({
                                title: sectionTitle,
                                content: result.completion.trim()
                            });
                            this.logger.log(`Successfully generated section "${sectionTitle}" with Claude AI`);
                            continue;
                        }
                        this.logger.warn(`Claude AI returned unexpected response format for section "${sectionTitle}"`);
                        claudeFailureCount++;
                    }
                    catch (sectionError) {
                        this.logger.warn(`Claude API error for section "${sectionTitle}": ${sectionError.message}`);
                        claudeFailureCount++;
                    }
                }
                try {
                    this.logger.log(`Generating section ${sectionIndex}/${totalSections} "${sectionTitle}" with Azure OpenAI`);
                    const azureResult = await this.azureAIService.generateCompletion({
                        prompt: sectionPrompt,
                        maxTokens: this.getTargetTokens(input.targetLength || 'medium'),
                        temperature: 0.7,
                        deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
                    });
                    sections.push({
                        title: sectionTitle,
                        content: azureResult.text.trim()
                    });
                    this.logger.log(`Successfully generated section "${sectionTitle}" with Azure OpenAI`);
                }
                catch (azureError) {
                    this.logger.error(`Azure OpenAI error for section "${sectionTitle}": ${azureError.message}`);
                    this.logger.warn(`All LLM services failed for section "${sectionTitle}", using fallback content`);
                    const fallbackContent = `This section covers ${sectionTitle.toLowerCase()} for ${input.topic}. ` +
                        `Content will be added here with specific information about ${input.topic} ` +
                        `tailored for ${input.audience} audience.`;
                    sections.push({
                        title: sectionTitle,
                        content: fallbackContent
                    });
                    this.logger.log(`Added fallback content for section "${sectionTitle}"`);
                }
            }
            const claudeSections = totalSections - claudeFailureCount;
            const azureSections = claudeFailureCount;
            this.logger.log(`Content generation complete: ${claudeSections} sections by Claude AI, ${azureSections} sections by Azure OpenAI`);
            return sections;
        }
        catch (error) {
            this.logger.error(`Error generating content sections: ${error.message}`);
            throw new Error(`Failed to generate content sections: ${error.message}`);
        }
    }
    async generateContentSummary(input, title, sections) {
        try {
            const contentOverview = sections
                .map(section => `${section.title}: ${section.content.substring(0, 100)}...`)
                .join('\n\n');
            const summaryPrompt = `
        You are an expert content summarizer. Create a concise, information-dense summary of the following content.
        The summary must be optimized for LLM consumption with clear context and semantic richness.
        Make it 2-3 sentences maximum, focusing on the essential information.
        
        Title: ${title}
        Topic: ${input.topic}
        Content Type: ${input.contentType}
        Target audience: ${input.audience}
        Content overview:
        ${contentOverview}
        
        Summary:
      `.trim();
            try {
                this.logger.log('Attempting to generate content summary with Claude AI');
                const result = await this.claudeAIService.generateCompletion(summaryPrompt, {
                    model: 'claude-3-haiku-20240307',
                    maxTokens: 100,
                    temperature: 0.3
                });
                if (result && result.completion) {
                    this.logger.log('Successfully generated content summary with Claude AI');
                    return result.completion.trim();
                }
                this.logger.warn('Claude AI returned unexpected response format for content summary');
            }
            catch (summaryError) {
                this.logger.warn(`Claude API error for summary generation: ${summaryError.message}`);
            }
            try {
                this.logger.log('Falling back to Azure OpenAI for content summary generation');
                const azureResult = await this.azureAIService.generateCompletion({
                    prompt: summaryPrompt,
                    maxTokens: 100,
                    temperature: 0.3,
                    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
                });
                this.logger.log('Successfully generated content summary with Azure OpenAI');
                return azureResult.text.trim();
            }
            catch (azureError) {
                this.logger.error(`Azure OpenAI error for summary generation: ${azureError.message}`);
                this.logger.warn('All LLM services failed for summary generation, using fallback summary');
                const fallbackSummary = `This ${input.contentType.replace('_', ' ')} explores ${input.topic} ` +
                    `with a focus on providing valuable insights for ${input.audience} audiences. ` +
                    `The content covers key aspects including ${sections.slice(0, 3).map(s => s.title.toLowerCase()).join(', ')}.`;
                return fallbackSummary;
            }
        }
        catch (error) {
            this.logger.error(`Error generating content summary: ${error.message}`);
            const fallbackSummary = `This ${input.contentType.replace('_', ' ')} about ${input.topic} ` +
                `is designed for ${input.audience} audiences.`;
            return fallbackSummary;
        }
    }
    async calculateContentMetrics(input, title, sections, summary) {
        const fullContent = [
            title,
            summary,
            ...sections.map(s => `${s.title} ${s.content}`)
        ].join('\n\n');
        const estimatedTokenCount = Math.ceil(fullContent.length / 4);
        const analysisPrompt = `
      You are an expert LLM content evaluator. Analyze the following content and provide scores 
      from 0-100 for these metrics:
      
      1. Readability: How easy is it for an LLM to parse and understand the content?
      2. Semantic Density: How information-rich is the content without redundancy?
      3. Contextual Relevance: How well does the content maintain topic coherence?
      4. LLM Quality Score: An overall score for LLM consumption optimization.
      
      Provide ONLY the four numeric scores in this exact format:
      Readability: [score]
      Semantic Density: [score]
      Contextual Relevance: [score]
      LLM Quality: [score]
      
      Content to analyze:
      ${fullContent.substring(0, 2000)}...
    `;
        const analysisResult = await this.azureAIService.generateCompletion({
            prompt: analysisPrompt.trim(),
            maxTokens: 100,
            temperature: 0.1,
            deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
        });
        const metrics = this.parseMetricsFromText(analysisResult.text);
        return {
            optimizedFor: input.llmTarget || 'general',
            readabilityScore: metrics.readability || 70,
            semanticDensity: metrics.semanticDensity || 65,
            contextualRelevance: metrics.contextualRelevance || 75,
            estimatedTokenCount,
            llmQualityScore: metrics.llmQuality || 70
        };
    }
    parseMetricsFromText(text) {
        const metrics = {
            readability: 0,
            semanticDensity: 0,
            contextualRelevance: 0,
            llmQuality: 0
        };
        try {
            const readabilityMatch = text.match(/Readability:\s*(\d+)/i);
            if (readabilityMatch && readabilityMatch[1]) {
                metrics.readability = parseInt(readabilityMatch[1], 10);
            }
            const semanticDensityMatch = text.match(/Semantic Density:\s*(\d+)/i);
            if (semanticDensityMatch && semanticDensityMatch[1]) {
                metrics.semanticDensity = parseInt(semanticDensityMatch[1], 10);
            }
            const contextualRelevanceMatch = text.match(/Contextual Relevance:\s*(\d+)/i);
            if (contextualRelevanceMatch && contextualRelevanceMatch[1]) {
                metrics.contextualRelevance = parseInt(contextualRelevanceMatch[1], 10);
            }
            const llmQualityMatch = text.match(/LLM Quality:\s*(\d+)/i);
            if (llmQualityMatch && llmQualityMatch[1]) {
                metrics.llmQuality = parseInt(llmQualityMatch[1], 10);
            }
        }
        catch (error) {
            this.logger.error(`Error parsing metrics: ${error.message}`);
        }
        return metrics;
    }
    getTargetTokens(targetLength) {
        switch (targetLength) {
            case 'short': return 200;
            case 'medium': return 500;
            case 'long': return 1000;
            default: return 500;
        }
    }
    buildTitlePrompt(input) {
        return `
      You are an expert content creator. Generate a compelling title for a ${input.contentType} 
      on the topic of "${input.topic}" for a ${input.audience === 'b2b' ? 'business' : 'consumer'} audience.
      
      The title should:
      - Be concise and information-dense for LLM consumption
      - Contain the main topic keywords for semantic clarity
      - Follow a ${input.toneOfVoice || 'conversational'} tone
      ${input.searchKeywords ? `- Include at least one of these keywords: ${input.searchKeywords.join(', ')}` : ''}
      ${input.llmTarget ? `- Be optimized for ${input.llmTarget} consumption` : ''}
      
      Write ONLY the title, nothing else.
    `.trim();
    }
    buildSectionPrompt(input, title, sectionTitle, previousSections) {
        const previousSectionsContext = previousSections.length > 0
            ? `\nPreviously generated sections:\n${previousSections.map(s => `${s.title}: ${s.content.substring(0, 100)}...`).join('\n')}`
            : '';
        const keyPointsContext = input.keyPoints && input.keyPoints.length > 0
            ? `\nKey points to include:\n${input.keyPoints.map(point => `- ${point}`).join('\n')}`
            : '';
        return `
      You are an expert content creator specializing in LLM-optimized content.
      
      Create the "${sectionTitle}" section for a ${input.contentType} titled "${title}" about "${input.topic}".
      
      Content specifications:
      - Audience: ${input.audience === 'b2b' ? 'Business professionals' : 'General consumers'}
      - Tone of voice: ${input.toneOfVoice || 'Conversational'}
      - Purpose: ${input.purpose || 'To inform and engage the reader'}
      ${input.llmTarget ? `- Optimize for ${input.llmTarget} LLM consumption` : '- Optimize for general LLM consumption'}
      ${keyPointsContext}
      ${previousSectionsContext}
      
      Make your content:
      1. Information-dense with high semantic clarity
      2. Well-structured with logical paragraph progression
      3. Free from unnecessary repetition or filler
      4. Rich in relevant terminology and clear context
      5. Self-contained yet connected to the overall topic
      
      Write ONLY the section content, not the section title.
    `.trim();
    }
    async enhanceLLMOptimization(content, targetLLM = 'general') {
        const startTime = Date.now();
        this.appInsights.trackEvent('LLMContentOptimizer:Enhance:Start', {
            contentLength: content.length.toString(),
            targetLLM
        });
        try {
            const enhancementPrompt = `
        You are an expert content optimizer for LLM consumption. 
        Enhance the following content to make it more optimized for ${targetLLM} LLM processing.
        
        Make these specific improvements:
        1. Increase semantic clarity by using more precise terminology
        2. Improve logical structure with clear transitions
        3. Remove any content that might confuse an LLM or cause context loss
        4. Ensure self-contained paragraphs with complete context
        5. Replace ambiguous pronouns with explicit references
        6. Maintain the original meaning and information
        
        Content to enhance:
        ${content}
        
        Enhanced content:
      `.trim();
            const result = await this.azureAIService.generateCompletion({
                prompt: enhancementPrompt,
                maxTokens: Math.min(4000, content.length / 2),
                temperature: 0.3,
                deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
            });
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('LLMContentOptimizer:Enhance:Success', {
                contentLength: content.length.toString(),
                targetLLM,
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('LLMContentOptimizer:EnhanceLatency', duration, {
                targetLLM,
                success: 'true'
            });
            return result.text.trim();
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
                contentLength: content.length.toString(),
                targetLLM,
                operation: 'enhanceLLMOptimization'
            });
            this.appInsights.trackMetric('LLMContentOptimizer:EnhanceLatency', duration, {
                targetLLM,
                success: 'false'
            });
            this.logger.error(`Error enhancing content: ${error.message}`);
            throw new Error(`Failed to enhance content: ${error.message}`);
        }
    }
};
exports.LLMContentOptimizerService = LLMContentOptimizerService;
exports.LLMContentOptimizerService = LLMContentOptimizerService = LLMContentOptimizerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [azure_ai_service_1.AzureAIService,
        bluf_content_structurer_service_1.BlufContentStructurerService,
        content_chunker_service_1.ContentChunkerService,
        application_insights_service_1.ApplicationInsightsService,
        claude_ai_service_1.ClaudeAIService])
], LLMContentOptimizerService);
//# sourceMappingURL=llm-content-optimizer.service.js.map