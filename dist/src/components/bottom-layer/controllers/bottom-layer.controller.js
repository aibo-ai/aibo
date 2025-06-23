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
exports.BottomLayerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const query_intent_analyzer_service_1 = require("../services/query-intent-analyzer.service");
const freshness_aggregator_service_1 = require("../freshness-aggregator/services/freshness-aggregator.service");
const content_chunker_service_1 = require("../services/content-chunker.service");
const keyword_topic_analyzer_service_1 = require("../services/keyword-topic-analyzer.service");
let BottomLayerController = class BottomLayerController {
    constructor(queryIntentAnalyzerService, freshnessAggregatorService, contentChunkerService, keywordTopicAnalyzerService) {
        this.queryIntentAnalyzerService = queryIntentAnalyzerService;
        this.freshnessAggregatorService = freshnessAggregatorService;
        this.contentChunkerService = contentChunkerService;
        this.keywordTopicAnalyzerService = keywordTopicAnalyzerService;
    }
    async analyzeIntent(userInput, segment) {
        return this.queryIntentAnalyzerService.analyzeIntent(userInput, segment);
    }
    async generateContentStrategy(intentAnalysis, segment) {
        return this.queryIntentAnalyzerService.analyzeIntent({ topic: intentAnalysis.topic, context: intentAnalysis.context }, segment);
    }
    async getFreshContent(topic, segment) {
        const params = {
            query: topic,
            limit: 10,
            contentTypes: undefined,
            timeframe: undefined,
            language: 'en',
            region: 'us',
            skipCache: false
        };
        return this.freshnessAggregatorService.aggregateFreshContent(params);
    }
    async aggregateFreshness(params) {
        const aggregationParams = {
            query: params.topic,
            limit: 15,
            contentTypes: undefined,
            timeframe: undefined,
            language: 'en',
            region: 'us',
            skipCache: false
        };
        return this.freshnessAggregatorService.aggregateFreshContent(aggregationParams);
    }
    async analyzeKeywords(params) {
        return this.keywordTopicAnalyzerService.analyzeContent(params.topic, params.segment);
    }
    async calculateFreshness(content, segment) {
        const publishedDate = new Date(content.publishedAt || content.publishedDate || new Date());
        const now = new Date();
        const ageInHours = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);
        const freshnessScore = Math.max(0, Math.min(1, 1 - (ageInHours / 168)));
        return {
            score: freshnessScore,
            age: ageInHours,
            recency: freshnessScore > 0.7 ? 'VERY_RECENT' :
                freshnessScore > 0.4 ? 'RECENT' : 'NOT_RECENT'
        };
    }
    async enrichWithFreshness(params) {
        return Object.assign(Object.assign({}, params.content), { freshnessScore: params.freshnessScore, freshnessIndicator: params.freshnessScore > 0.7 ? 'Fresh' :
                params.freshnessScore > 0.4 ? 'Moderately Fresh' : 'Stale' });
    }
    async chunkContent(params) {
        return this.contentChunkerService.chunkContent(params.content, params.chunkType);
    }
    async mergeChunks(params) {
        return this.contentChunkerService.mergeChunksWithOverlap(params.chunks, params.overlapPercentage);
    }
    async optimizeChunks(params) {
        return this.contentChunkerService.optimizeChunksForLLM(params.chunks, params.targetTokenCount);
    }
    async analyzeContent(params) {
        return this.keywordTopicAnalyzerService.analyzeContent(params.content, params.segment);
    }
    async generateTopicCluster(params) {
        return this.keywordTopicAnalyzerService.generateTopicCluster(params.seedTopic, params.segment, params.depth);
    }
    async optimizeKeywords(params) {
        return this.keywordTopicAnalyzerService.optimizeKeywordPlacement(params.content, params.keywords);
    }
};
exports.BottomLayerController = BottomLayerController;
__decorate([
    (0, common_1.Post)('analyze-intent'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze user input intent' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "analyzeIntent", null);
__decorate([
    (0, common_1.Post)('generate-content-strategy'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate content strategy based on intent analysis' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "generateContentStrategy", null);
__decorate([
    (0, common_1.Get)('fresh-content'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregate fresh content for a topic' }),
    __param(0, (0, common_1.Query)('topic')),
    __param(1, (0, common_1.Query)('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "getFreshContent", null);
__decorate([
    (0, common_1.Post)('aggregate-freshness'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregate fresh content with POST method for orchestration' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "aggregateFreshness", null);
__decorate([
    (0, common_1.Post)('analyze-keywords'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze keywords for a topic (orchestration endpoint)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "analyzeKeywords", null);
__decorate([
    (0, common_1.Post)('calculate-freshness'),
    (0, swagger_1.ApiOperation)({ summary: 'Calculate freshness score for content' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('segment')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "calculateFreshness", null);
__decorate([
    (0, common_1.Post)('enrich-freshness'),
    (0, swagger_1.ApiOperation)({ summary: 'Enrich content with freshness indicators' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "enrichWithFreshness", null);
__decorate([
    (0, common_1.Post)('chunk-content'),
    (0, swagger_1.ApiOperation)({ summary: 'Chunk content for processing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "chunkContent", null);
__decorate([
    (0, common_1.Post)('merge-chunks'),
    (0, swagger_1.ApiOperation)({ summary: 'Merge chunks with overlap' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "mergeChunks", null);
__decorate([
    (0, common_1.Post)('optimize-chunks'),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize chunks for LLM processing' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "optimizeChunks", null);
__decorate([
    (0, common_1.Post)('analyze-content'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze content for keywords and topics' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "analyzeContent", null);
__decorate([
    (0, common_1.Post)('generate-topic-cluster'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate topic cluster from seed topic' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "generateTopicCluster", null);
__decorate([
    (0, common_1.Post)('optimize-keywords'),
    (0, swagger_1.ApiOperation)({ summary: 'Optimize content with strategic keyword placement' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BottomLayerController.prototype, "optimizeKeywords", null);
exports.BottomLayerController = BottomLayerController = __decorate([
    (0, swagger_1.ApiTags)('bottom-layer'),
    (0, common_1.Controller)('bottom-layer'),
    __metadata("design:paramtypes", [query_intent_analyzer_service_1.QueryIntentAnalyzerService,
        freshness_aggregator_service_1.FreshnessAggregatorService,
        content_chunker_service_1.ContentChunkerService,
        keyword_topic_analyzer_service_1.KeywordTopicAnalyzerService])
], BottomLayerController);
//# sourceMappingURL=bottom-layer.controller.js.map