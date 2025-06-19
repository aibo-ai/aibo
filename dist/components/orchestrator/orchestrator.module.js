"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorModule = void 0;
const common_1 = require("@nestjs/common");
const cross_layer_data_flow_service_1 = require("./services/cross-layer-data-flow.service");
const feedback_loop_service_1 = require("./services/feedback-loop.service");
const performance_monitoring_service_1 = require("./services/performance-monitoring.service");
const orchestrator_controller_1 = require("./controllers/orchestrator.controller");
let OrchestratorModule = class OrchestratorModule {
};
exports.OrchestratorModule = OrchestratorModule;
exports.OrchestratorModule = OrchestratorModule = __decorate([
    (0, common_1.Module)({
        imports: [],
        controllers: [orchestrator_controller_1.OrchestratorController],
        providers: [
            cross_layer_data_flow_service_1.CrossLayerDataFlowService,
            feedback_loop_service_1.FeedbackLoopService,
            performance_monitoring_service_1.PerformanceMonitoringService,
        ],
        exports: [
            cross_layer_data_flow_service_1.CrossLayerDataFlowService,
            feedback_loop_service_1.FeedbackLoopService,
            performance_monitoring_service_1.PerformanceMonitoringService,
        ],
    })
], OrchestratorModule);
//# sourceMappingURL=orchestrator.module.js.map