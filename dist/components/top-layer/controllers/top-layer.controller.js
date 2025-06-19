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
exports.TopLayerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const eeat_signal_generator_service_1 = require("../services/eeat-signal-generator.service");
const original_research_engine_service_1 = require("../services/original-research-engine.service");
const citation_authority_verifier_service_1 = require("../services/citation-authority-verifier.service");
const schema_markup_generator_service_1 = require("../services/schema-markup-generator.service");
let TopLayerController = class TopLayerController {
    constructor(eeatSignalGeneratorService, originalResearchEngineService, citationAuthorityVerifierService, schemaMarkupGeneratorService) {
        this.eeatSignalGeneratorService = eeatSignalGeneratorService;
        this.originalResearchEngineService = originalResearchEngineService;
        this.citationAuthorityVerifierService = citationAuthorityVerifierService;
        this.schemaMarkupGeneratorService = schemaMarkupGeneratorService;
    }
    async analyzeEeatSignals(data) {
        return this.eeatSignalGeneratorService.analyzeEeatSignals(data.content, data.segment);
    }
    async enhanceEeatSignals(data) {
        return this.eeatSignalGeneratorService.enhanceEeatSignals(data.content, data.segment);
    }
    async generateOriginalResearch(data) {
        return this.originalResearchEngineService.generateOriginalResearch(data.topic, data.contentType || 'blog_post', data.segment);
    }
    async integrateResearch(data) {
        return this.originalResearchEngineService.integrateResearchIntoContent(data.content, data.researchData);
    }
    async identifyResearchGaps(data) {
        return this.originalResearchEngineService.identifyResearchGaps(data.content, data.segment);
    }
    async verifyCitations(data) {
        return this.citationAuthorityVerifierService.verifyCitations(data.content, data.segment);
    }
    async enhanceCitations(data) {
        return this.citationAuthorityVerifierService.enhanceCitationAuthority(data.content, data.segment);
    }
    async generateCitationStrategy(data) {
        return this.citationAuthorityVerifierService.generateCitationStrategy(data.topic, data.segment);
    }
    async generateSchema(data) {
        return this.schemaMarkupGeneratorService.generateSchemaMarkup(data.content, data.contentType, data.segment);
    }
    async analyzeForSchema(data) {
        return this.schemaMarkupGeneratorService.analyzeContentForSchemaRecommendations(data.content, data.segment);
    }
    async enhanceSchema(data) {
        return this.schemaMarkupGeneratorService.enhanceSchemaMarkup(data.existingSchema, data.content, data.segment);
    }
};
exports.TopLayerController = TopLayerController;
__decorate([
    (0, common_1.Post)('analyze-eeat-signals'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze E-E-A-T signals in content' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to analyze' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'E-E-A-T signals analyzed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "analyzeEeatSignals", null);
__decorate([
    (0, common_1.Post)('enhance-eeat-signals'),
    (0, swagger_1.ApiOperation)({ summary: 'Enhance content with E-E-A-T signals' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to enhance' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'E-E-A-T signals enhanced successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "enhanceEeatSignals", null);
__decorate([
    (0, common_1.Post)('generate-original-research'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate original research for a topic' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                topic: { type: 'string', description: 'Topic to research' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['topic', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Original research generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "generateOriginalResearch", null);
__decorate([
    (0, common_1.Post)('integrate-research'),
    (0, swagger_1.ApiOperation)({ summary: 'Integrate research into content' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to enhance' },
                researchData: { type: 'object', description: 'Research data to integrate' },
            },
            required: ['content', 'researchData'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Research integrated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "integrateResearch", null);
__decorate([
    (0, common_1.Post)('identify-research-gaps'),
    (0, swagger_1.ApiOperation)({ summary: 'Identify research gap opportunities' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to analyze' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Research gaps identified' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "identifyResearchGaps", null);
__decorate([
    (0, common_1.Post)('verify-citations'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify citations in content' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content with citations' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Citations verified successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "verifyCitations", null);
__decorate([
    (0, common_1.Post)('enhance-citation-authority'),
    (0, swagger_1.ApiOperation)({ summary: 'Enhance citations with more authoritative sources' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to enhance' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Citation authority enhanced successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "enhanceCitations", null);
__decorate([
    (0, common_1.Post)('citation-strategy'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate citation strategy' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                topic: { type: 'string', description: 'Content topic' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['topic', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Citation strategy generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "generateCitationStrategy", null);
__decorate([
    (0, common_1.Post)('generate-schema'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate schema markup for content' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to generate schema for' },
                contentType: { type: 'string', description: 'Type of content (article, faq, etc.)' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'contentType', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schema markup generated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "generateSchema", null);
__decorate([
    (0, common_1.Post)('analyze-for-schema'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze content for schema recommendations' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                content: { type: 'object', description: 'Content to analyze' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schema recommendations provided' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "analyzeForSchema", null);
__decorate([
    (0, common_1.Post)('enhance-schema'),
    (0, swagger_1.ApiOperation)({ summary: 'Enhance existing schema markup' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                existingSchema: { type: 'object', description: 'Existing schema markup' },
                content: { type: 'object', description: 'Content to derive properties from' },
                segment: { type: 'string', enum: ['b2b', 'b2c'], description: 'Target segment' },
            },
            required: ['existingSchema', 'content', 'segment'],
        },
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schema enhanced successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TopLayerController.prototype, "enhanceSchema", null);
exports.TopLayerController = TopLayerController = __decorate([
    (0, swagger_1.ApiTags)('top-layer'),
    (0, common_1.Controller)('top-layer'),
    __metadata("design:paramtypes", [eeat_signal_generator_service_1.EeatSignalGeneratorService,
        original_research_engine_service_1.OriginalResearchEngineService,
        citation_authority_verifier_service_1.CitationAuthorityVerifierService,
        schema_markup_generator_service_1.SchemaMarkupGeneratorService])
], TopLayerController);
//# sourceMappingURL=top-layer.controller.js.map