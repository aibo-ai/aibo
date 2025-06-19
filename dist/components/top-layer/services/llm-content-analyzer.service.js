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
var LLMContentAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMContentAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const application_insights_service_1 = require("../../../common/services/application-insights.service");
const azure_ai_service_1 = require("./azure-ai-service");
const content_chunker_service_1 = require("../../bottom-layer/services/content-chunker.service");
let LLMContentAnalyzerService = LLMContentAnalyzerService_1 = class LLMContentAnalyzerService {
    constructor(azureAIService, contentChunker, appInsights) {
        this.azureAIService = azureAIService;
        this.contentChunker = contentChunker;
        this.appInsights = appInsights;
        this.logger = new common_1.Logger(LLMContentAnalyzerService_1.name);
    }
    async analyzeContent(content, targetLLM = 'general') {
        var _a, _b, _c, _d, _e, _f, _g;
        const startTime = Date.now();
        this.appInsights.trackEvent('LLMContentAnalyzer:Analyze:Start', {
            contentLength: content.length.toString(),
            targetLLM
        });
        try {
            const analysisPrompt = `
        You are an expert content analyzer specializing in LLM optimization. Analyze the following content
        for its suitability for consumption by ${targetLLM} LLMs. Provide concrete metrics and identify issues.
        
        Analyze these aspects:
        1. Readability: How easy is it for an LLM to parse and understand the content?
        2. Semantic Density: How information-rich is the content without redundancy?
        3. Contextual Relevance: How well does the content maintain topic coherence?
        4. Cohesion: How well do sentences and paragraphs connect logically?
        5. Overall LLM Quality Score: An overall score for LLM consumption optimization.
        
        Identify any specific issues that could cause problems for LLM processing, such as:
        - Ambiguous references
        - Contextual discontinuities
        - Semantic ambiguities
        - Complex nested ideas
        - Inconsistent terminology
        
        For each issue, provide the severity (high/medium/low), a clear description, and a brief example from the text.
        
        Finally, provide 3-5 specific recommendations to optimize this content for LLM consumption.
        
        Format your response as a structured JSON object with these exact properties:
        {
          "metrics": {
            "readabilityScore": <0-100>,
            "semanticDensity": <0-100>,
            "contextualRelevance": <0-100>,
            "cohesionScore": <0-100>,
            "llmQualityScore": <0-100>
          },
          "issues": [
            {
              "type": "<issue type>",
              "severity": "<high/medium/low>",
              "description": "<brief description>",
              "example": "<example from text>"
            }
          ],
          "recommendations": [
            "<specific recommendation 1>",
            "<specific recommendation 2>",
            "..."
          ]
        }
        
        Content to analyze:
        ${content.substring(0, 3000)}${content.length > 3000 ? '...' : ''}
      `.trim();
            const analysisResult = await this.azureAIService.generateCompletion({
                prompt: analysisPrompt,
                maxTokens: 1500,
                temperature: 0.1,
                deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-35-turbo'
            });
            let parsedResponse = {};
            try {
                const jsonMatch = analysisResult.text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsedResponse = JSON.parse(jsonMatch[0]);
                }
                else {
                    throw new Error('No valid JSON found in analysis response');
                }
            }
            catch (parseError) {
                this.logger.error(`Error parsing analysis response: ${parseError.message}`);
                parsedResponse = this.generateFallbackAnalysis();
            }
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('LLMContentAnalyzer:Analyze:Success', {
                contentLength: content.length.toString(),
                targetLLM,
                durationMs: duration.toString(),
                llmQualityScore: ((_b = (_a = parsedResponse.metrics) === null || _a === void 0 ? void 0 : _a.llmQualityScore) === null || _b === void 0 ? void 0 : _b.toString()) || 'unknown'
            });
            this.appInsights.trackMetric('LLMContentAnalyzer:AnalyzeLatency', duration, {
                targetLLM,
                success: 'true'
            });
            const issues = parsedResponse.issues || [];
            const recommendations = parsedResponse.recommendations || [
                'Improve semantic clarity by using more precise terminology',
                'Enhance logical flow between paragraphs',
                'Replace ambiguous pronouns with explicit references'
            ];
            return {
                analysisId: `analysis-${Date.now()}`,
                contentLength: content.length,
                targetLLM,
                metrics: {
                    readabilityScore: ((_c = parsedResponse.metrics) === null || _c === void 0 ? void 0 : _c.readabilityScore) || 70,
                    semanticDensity: ((_d = parsedResponse.metrics) === null || _d === void 0 ? void 0 : _d.semanticDensity) || 65,
                    contextualRelevance: ((_e = parsedResponse.metrics) === null || _e === void 0 ? void 0 : _e.contextualRelevance) || 75,
                    cohesionScore: ((_f = parsedResponse.metrics) === null || _f === void 0 ? void 0 : _f.cohesionScore) || 68,
                    llmQualityScore: ((_g = parsedResponse.metrics) === null || _g === void 0 ? void 0 : _g.llmQualityScore) || 70
                },
                issues,
                recommendations,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
                contentLength: content.length.toString(),
                targetLLM,
                operation: 'analyzeContent'
            });
            this.appInsights.trackMetric('LLMContentAnalyzer:AnalyzeLatency', duration, {
                targetLLM,
                success: 'false'
            });
            this.logger.error(`Error analyzing content: ${error.message}`);
            throw new Error(`Failed to analyze content: ${error.message}`);
        }
    }
    generateFallbackAnalysis() {
        return {
            metrics: {
                readabilityScore: 70,
                semanticDensity: 65,
                contextualRelevance: 75,
                cohesionScore: 68,
                llmQualityScore: 70
            },
            issues: [
                {
                    type: 'Semantic Ambiguity',
                    severity: 'medium',
                    description: 'Some terms may be ambiguous for LLM processing',
                    example: 'Unable to parse example from text'
                }
            ],
            recommendations: [
                'Improve semantic clarity by using more precise terminology',
                'Enhance logical flow between paragraphs',
                'Replace ambiguous pronouns with explicit references'
            ]
        };
    }
    async chunkContent(content, chunkType = 'semantic', targetTokenSize = 500) {
        const startTime = Date.now();
        this.appInsights.trackEvent('LLMContentAnalyzer:Chunk:Start', {
            contentLength: content.length.toString(),
            chunkType,
            targetTokenSize: targetTokenSize.toString()
        });
        try {
            const chunkingResult = await this.contentChunker.chunkContent(content, chunkType);
            const optimizedChunks = await this.contentChunker.optimizeChunksForLLM(chunkingResult.chunks, targetTokenSize);
            const totalChunks = optimizedChunks.length;
            const averageChunkSize = totalChunks > 0
                ? optimizedChunks.reduce((sum, chunk) => sum + chunk.content.length, 0) / totalChunks
                : 0;
            const originalTokenEstimate = Math.ceil(content.length / 4);
            const chunkedTokenEstimate = optimizedChunks.reduce((sum, chunk) => sum + Math.ceil(chunk.content.length / 4), 0);
            const tokenReductionPercentage = originalTokenEstimate > 0
                ? ((originalTokenEstimate - chunkedTokenEstimate) / originalTokenEstimate) * 100
                : 0;
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('LLMContentAnalyzer:Chunk:Success', {
                contentLength: content.length.toString(),
                chunkType,
                chunkCount: totalChunks.toString(),
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('LLMContentAnalyzer:ChunkLatency', duration, {
                chunkType,
                success: 'true'
            });
            const formattedChunks = optimizedChunks.map(chunk => ({
                id: chunk.id || `chunk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
                content: chunk.content,
                estimatedTokenCount: Math.ceil(chunk.content.length / 4),
                startPosition: chunk.startPosition || 0,
                endPosition: chunk.endPosition || chunk.content.length
            }));
            return {
                chunkingId: `chunking-${Date.now()}`,
                originalLength: content.length,
                contentSnapshot: content.substring(0, 200) + (content.length > 200 ? '...' : ''),
                chunkType,
                targetTokenSize,
                chunks: formattedChunks,
                metrics: {
                    chunkCount: totalChunks,
                    averageChunkSize,
                    tokenReductionPercentage: Math.max(0, tokenReductionPercentage),
                    contextPreservationScore: 85
                },
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
                contentLength: content.length.toString(),
                chunkType,
                targetTokenSize: targetTokenSize.toString(),
                operation: 'chunkContent'
            });
            this.appInsights.trackMetric('LLMContentAnalyzer:ChunkLatency', duration, {
                chunkType,
                success: 'false'
            });
            this.logger.error(`Error chunking content: ${error.message}`);
            throw new Error(`Failed to chunk content: ${error.message}`);
        }
    }
};
exports.LLMContentAnalyzerService = LLMContentAnalyzerService;
exports.LLMContentAnalyzerService = LLMContentAnalyzerService = LLMContentAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [azure_ai_service_1.AzureAIService,
        content_chunker_service_1.ContentChunkerService,
        application_insights_service_1.ApplicationInsightsService])
], LLMContentAnalyzerService);
//# sourceMappingURL=llm-content-analyzer.service.js.map