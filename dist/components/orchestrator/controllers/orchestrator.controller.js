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
exports.OrchestratorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const cross_layer_data_flow_service_1 = require("../services/cross-layer-data-flow.service");
const feedback_loop_service_1 = require("../services/feedback-loop.service");
const performance_monitoring_service_1 = require("../services/performance-monitoring.service");
let OrchestratorController = class OrchestratorController {
    constructor(crossLayerDataFlowService, feedbackLoopService, performanceMonitoringService) {
        this.crossLayerDataFlowService = crossLayerDataFlowService;
        this.feedbackLoopService = feedbackLoopService;
        this.performanceMonitoringService = performanceMonitoringService;
    }
    async startWorkflow(workflowConfig) {
        return this.crossLayerDataFlowService.orchestrateWorkflow(workflowConfig, workflowConfig.initialData || {});
    }
    async getContentMetrics(contentId, clientType) {
        return this.feedbackLoopService.collectPerformanceMetrics(contentId, clientType);
    }
    async generateImprovements(contentId, metrics) {
        return this.feedbackLoopService.generateImprovementSuggestions(contentId, metrics);
    }
    async applyImprovements(contentId, improvements) {
        return this.feedbackLoopService.applyAutomatedImprovements(contentId, improvements);
    }
    async initializeMonitoring(params) {
        return this.performanceMonitoringService.initializeMonitoring(params.contentId, params.contentType);
    }
    async getPerformanceStatus(contentId) {
        return this.performanceMonitoringService.getPerformanceStatus(contentId);
    }
    async aggregatePerformance(params) {
        return this.performanceMonitoringService.aggregatePerformanceMetrics(params.contentIds, params.segmentBy);
    }
    async generateReport(contentId, timeframe = 'week') {
        return this.performanceMonitoringService.generatePerformanceReport(contentId, timeframe);
    }
};
exports.OrchestratorController = OrchestratorController;
__decorate([
    (0, common_1.Post)('workflow'),
    (0, swagger_1.ApiOperation)({ summary: 'Start a content generation workflow' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "startWorkflow", null);
__decorate([
    (0, common_1.Get)('content/:id/metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance metrics for content' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('clientType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getContentMetrics", null);
__decorate([
    (0, common_1.Post)('content/:id/improvements'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate improvement suggestions for content' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "generateImprovements", null);
__decorate([
    (0, common_1.Post)('content/:id/apply-improvements'),
    (0, swagger_1.ApiOperation)({ summary: 'Apply automated improvements to content' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Array]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "applyImprovements", null);
__decorate([
    (0, common_1.Post)('monitoring/initialize'),
    (0, swagger_1.ApiOperation)({ summary: 'Initialize monitoring for content' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "initializeMonitoring", null);
__decorate([
    (0, common_1.Get)('content/:id/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance status for content' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "getPerformanceStatus", null);
__decorate([
    (0, common_1.Post)('performance/aggregate'),
    (0, swagger_1.ApiOperation)({ summary: 'Aggregate performance metrics for multiple content pieces' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "aggregatePerformance", null);
__decorate([
    (0, common_1.Get)('content/:id/report'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a performance report for content' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('timeframe')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], OrchestratorController.prototype, "generateReport", null);
exports.OrchestratorController = OrchestratorController = __decorate([
    (0, swagger_1.ApiTags)('orchestrator'),
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [cross_layer_data_flow_service_1.CrossLayerDataFlowService,
        feedback_loop_service_1.FeedbackLoopService,
        performance_monitoring_service_1.PerformanceMonitoringService])
], OrchestratorController);
//# sourceMappingURL=orchestrator.controller.js.map