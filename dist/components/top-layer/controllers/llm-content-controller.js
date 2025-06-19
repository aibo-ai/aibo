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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMContentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const llm_content_optimizer_service_1 = require("../services/llm-content-optimizer.service");
const llm_content_analyzer_service_1 = require("../services/llm-content-analyzer.service");
let LLMContentController = class LLMContentController {
    constructor(llmContentOptimizerService, llmContentAnalyzerService) {
        this.llmContentOptimizerService = llmContentOptimizerService;
        this.llmContentAnalyzerService = llmContentAnalyzerService;
    }
    async generateContent(contentInput) {
        try {
            const result = await this.llmContentOptimizerService.generateLLMOptimizedContent(contentInput);
            return {
                data: result
            };
        }
        catch (error) {
            return {
                error: error.message || 'Failed to generate LLM-optimized content'
            };
        }
    }
    async enhanceContent(data) {
        try {
            const enhancedContent = await this.llmContentOptimizerService.enhanceLLMOptimization(data.content, data.targetLLM || 'general');
            return {
                data: { enhancedContent }
            };
        }
        catch (error) {
            return {
                error: error.message || 'Failed to enhance content'
            };
        }
    }
    async analyzeContent(data) {
        try {
            const result = await this.llmContentAnalyzerService.analyzeContent(data.content, data.targetLLM || 'general');
            return {
                data: result
            };
        }
        catch (error) {
            return {
                error: error.message || 'Failed to analyze content'
            };
        }
    }
    async chunkContent(data) {
        try {
            const result = await this.llmContentAnalyzerService.chunkContent(data.content, data.chunkType || 'semantic', data.targetTokenSize || 500);
            return {
                data: result
            };
        }
        catch (error) {
            return {
                error: error.message || 'Failed to chunk content'
            };
        }
    }
};
exports.LLMContentController = LLMContentController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate content optimized for LLM consumption' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                topic: { type: 'string', description: 'Main topic for content' },
                contentType: {
                    type: 'string',
                    enum: ['blog_post', 'technical_guide', 'case_study', 'product_review', 'industry_analysis', 'social_media'],
                    description: 'Type of content to generate'
                },
                audience: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target audience' },
                keyPoints: { type: 'array', items: { type: 'string' }, description: 'Key points to include' },
                toneOfVoice: {
                    type: 'string',
                    enum: ['formal', 'conversational', 'technical', 'friendly'],
                    description: 'Tone of voice for content'
                },
                targetLength: { type: 'string', enum: ['short', 'medium', 'long'], description: 'Target content length' },
                purpose: { type: 'string', description: 'Content purpose' },
                searchKeywords: { type: 'array', items: { type: 'string' }, description: 'SEO keywords to include' },
                llmTarget: {
                    type: 'string',
                    enum: ['general', 'gpt4', 'claude', 'palm'],
                    description: 'Target LLM to optimize for'
                },
            },
            required: ['topic', 'contentType', 'audience'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'LLM-optimized content generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LLMContentController.prototype, "generateContent", null);
__decorate([
    (0, common_1.Post)('enhance'),
    (0, swagger_1.ApiOperation)({ summary: 'Enhance existing content to be more LLM-friendly' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Content to enhance for LLM consumption' },
                targetLLM: {
                    type: 'string',
                    enum: ['general', 'gpt4', 'claude', 'palm'],
                    description: 'Target LLM to optimize for'
                },
            },
            required: ['content'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content enhanced successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LLMContentController.prototype, "enhanceContent", null);
__decorate([
    (0, common_1.Post)('analyze'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze content for LLM optimization opportunities' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Content to analyze' },
                targetLLM: {
                    type: 'string',
                    enum: ['general', 'gpt4', 'claude', 'palm'],
                    description: 'Target LLM to analyze against'
                },
            },
            required: ['content'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content analyzed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LLMContentController.prototype, "analyzeContent", null);
__decorate([
    (0, common_1.Post)('chunk'),
    (0, swagger_1.ApiOperation)({ summary: 'Chunk content for optimal LLM processing' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'string', description: 'Content to chunk' },
                chunkType: {
                    type: 'string',
                    enum: ['semantic', 'fixed', 'hybrid'],
                    description: 'Chunking strategy'
                },
                targetTokenSize: {
                    type: 'number',
                    description: 'Target token size for each chunk'
                },
            },
            required: ['content'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content chunked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LLMContentController.prototype, "chunkContent", null);
exports.LLMContentController = LLMContentController = __decorate([
    (0, swagger_1.ApiTags)('llm-content'),
    (0, common_1.Controller)('llm-content'),
    __metadata("design:paramtypes", [llm_content_optimizer_service_1.LLMContentOptimizerService,
        llm_content_analyzer_service_1.LLMContentAnalyzerService])
], LLMContentController);
//# sourceMappingURL=llm-content-controller.js.map