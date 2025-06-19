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
exports.MiddleLayerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bluf_content_structurer_service_1 = require("../services/bluf-content-structurer.service");
const conversational_query_optimizer_service_1 = require("../services/conversational-query-optimizer.service");
const semantic_relationship_mapper_service_1 = require("../services/semantic-relationship-mapper.service");
const platform_specific_tuner_service_1 = require("../services/platform-specific-tuner.service");
let MiddleLayerController = class MiddleLayerController {
    constructor(blufContentStructurerService, conversationalQueryOptimizerService, semanticRelationshipMapperService, platformSpecificTunerService) {
        this.blufContentStructurerService = blufContentStructurerService;
        this.conversationalQueryOptimizerService = conversationalQueryOptimizerService;
        this.semanticRelationshipMapperService = semanticRelationshipMapperService;
        this.platformSpecificTunerService = platformSpecificTunerService;
    }
    async structureContentBluf(data) {
        return this.blufContentStructurerService.structureWithBluf(data.content, data.segment, data.contentType);
    }
    async createLayeredStructure(data) {
        return this.blufContentStructurerService.createLayeredStructure(data.content, data.maxDepth || 3, data.segment);
    }
    async optimizeForConversation(data) {
        return this.conversationalQueryOptimizerService.optimizeForConversationalQueries(data.content, data.targetQueries);
    }
    async findQueryGaps(data) {
        return this.conversationalQueryOptimizerService.identifyQueryGaps(data.queries, data.content);
    }
    async generateFollowupQuestions(data) {
        return this.conversationalQueryOptimizerService.generateAnticipatoryQuestions(data.content, data.count || 5);
    }
    async mapRelationships(data) {
        return this.semanticRelationshipMapperService.mapSemanticRelationships(data.content, data.segment);
    }
    async enhanceWithInferences(data) {
        return this.semanticRelationshipMapperService.enhanceWithSemanticInferences(data.content, data.knowledgeGraph);
    }
    async generateCrossReferences(data) {
        return this.semanticRelationshipMapperService.generateCrossReferenceMap(data.concepts);
    }
    async optimizeForPlatform(data) {
        return this.platformSpecificTunerService.optimizeForPlatform(data.content, data.platform);
    }
    async optimizeForMultiplePlatforms(data) {
        return this.platformSpecificTunerService.optimizeForMultiplePlatforms(data.content, data.platforms);
    }
    async testCrossPlatformPerformance(data) {
        return this.platformSpecificTunerService.testCrossplatformPerformance(data.content, data.platforms);
    }
};
exports.MiddleLayerController = MiddleLayerController;
__decorate([
    (0, common_1.Post)('structure-bluf'),
    (0, swagger_1.ApiOperation)({ summary: 'Structure content using BLUF methodology' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to structure' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
                contentType: { type: 'string', description: 'Type of content' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Content structured successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "structureContentBluf", null);
__decorate([
    (0, common_1.Post)('structure-layered'),
    (0, swagger_1.ApiOperation)({ summary: 'Structure content in layered format' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to structure' },
                maxDepth: { type: 'number', description: 'Maximum depth of layers' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Content structured successfully in layers' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "createLayeredStructure", null);
__decorate([
    (0, common_1.Post)('optimize-conversation'),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize content for conversational queries' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to optimize' },
                targetQueries: { type: 'array', items: { type: 'string' }, description: 'Target queries to optimize for' },
            },
            required: ['content', 'targetQueries'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Content optimized for conversational use' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "optimizeForConversation", null);
__decorate([
    (0, common_1.Post)('identify-query-gaps'),
    (0, swagger_1.ApiOperation)({ summary: 'Identify content gaps for given queries' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                queries: { type: 'array', items: { type: 'string' }, description: 'Queries to analyze' },
                content: { type: 'object', description: 'Content to check against queries' },
            },
            required: ['queries', 'content'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Query gaps identified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "findQueryGaps", null);
__decorate([
    (0, common_1.Post)('generate-anticipatory-questions'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate anticipatory follow-up questions' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to generate questions for' },
                count: { type: 'number', description: 'Number of questions to generate' },
            },
            required: ['content'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Anticipatory questions generated' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "generateFollowupQuestions", null);
__decorate([
    (0, common_1.Post)('map-semantic-relationships'),
    (0, swagger_1.ApiOperation)({ summary: 'Map semantic relationships between content entities' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to analyze for relationships' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Semantic relationships mapped' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "mapRelationships", null);
__decorate([
    (0, common_1.Post)('enhance-semantic-inferences'),
    (0, swagger_1.ApiOperation)({ summary: 'Enhance content with semantic inferences' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to enhance' },
                knowledgeGraph: { type: 'object', description: 'Knowledge graph to use for inference' },
            },
            required: ['content', 'knowledgeGraph'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Content enhanced with semantic inferences' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "enhanceWithInferences", null);
__decorate([
    (0, common_1.Post)('generate-cross-reference'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate cross-reference map between concepts' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                concepts: { type: 'array', items: { type: 'string' }, description: 'Concepts to cross-reference' },
            },
            required: ['concepts'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cross-reference map generated' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "generateCrossReferences", null);
__decorate([
    (0, common_1.Post)('optimize-for-platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize content for specific LLM platform' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to optimize' },
                platform: { type: 'string', enum: ['chatgpt', 'perplexity', 'gemini', 'grok'], description: 'Target platform' },
            },
            required: ['content', 'platform'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Content optimized for platform' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "optimizeForPlatform", null);
__decorate([
    (0, common_1.Post)('optimize-multi-platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize content for multiple LLM platforms' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to optimize' },
                platforms: { type: 'array', items: { type: 'string', enum: ['chatgpt', 'perplexity', 'gemini', 'grok'] }, description: 'Target platforms' },
            },
            required: ['content', 'platforms'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Content optimized for multiple platforms' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "optimizeForMultiplePlatforms", null);
__decorate([
    (0, common_1.Post)('test-cross-platform'),
    (0, swagger_1.ApiOperation)({ summary: 'Test content performance across platforms' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to test' },
                platforms: { type: 'array', items: { type: 'string' }, description: 'Platforms to test on' },
            },
            required: ['content', 'platforms'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cross-platform performance results' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MiddleLayerController.prototype, "testCrossPlatformPerformance", null);
exports.MiddleLayerController = MiddleLayerController = __decorate([
    (0, swagger_1.ApiTags)('middle-layer'),
    (0, common_1.Controller)('middle-layer'),
    __metadata("design:paramtypes", [bluf_content_structurer_service_1.BlufContentStructurerService,
        conversational_query_optimizer_service_1.ConversationalQueryOptimizerService,
        semantic_relationship_mapper_service_1.SemanticRelationshipMapperService,
        platform_specific_tuner_service_1.PlatformSpecificTunerService])
], MiddleLayerController);
//# sourceMappingURL=middle-layer.controller.js.map