"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TopLayerModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const eeat_signal_generator_service_1 = require("./services/eeat-signal-generator.service");
const original_research_engine_service_1 = require("./services/original-research-engine.service");
const citation_authority_verifier_service_1 = require("./services/citation-authority-verifier.service");
const citation_extraction_service_1 = require("./services/citation-extraction.service");
const external_api_service_1 = require("./services/external-api.service");
const citation_cache_service_1 = require("./services/citation-cache.service");
const citation_monitoring_service_1 = require("./services/citation-monitoring.service");
const schema_markup_generator_service_1 = require("./services/schema-markup-generator.service");
const azure_ai_service_1 = require("./services/azure-ai-service");
const top_layer_controller_1 = require("./controllers/top-layer.controller");
const llm_content_controller_1 = require("./controllers/llm-content-controller");
const citation_health_controller_1 = require("./controllers/citation-health.controller");
const llm_content_optimizer_service_1 = require("./services/llm-content-optimizer.service");
const llm_content_analyzer_service_1 = require("./services/llm-content-analyzer.service");
const common_module_1 = require("../../common/common.module");
const middle_layer_module_1 = require("../middle-layer/middle-layer.module");
const bottom_layer_module_1 = require("../bottom-layer/bottom-layer.module");
const shared_module_1 = require("../../shared/shared.module");
let TopLayerModule = class TopLayerModule {
};
exports.TopLayerModule = TopLayerModule;
exports.TopLayerModule = TopLayerModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            common_module_1.CommonModule,
            shared_module_1.SharedModule,
            (0, common_1.forwardRef)(() => middle_layer_module_1.MiddleLayerModule),
            bottom_layer_module_1.BottomLayerModule
        ],
        controllers: [
            top_layer_controller_1.TopLayerController,
            llm_content_controller_1.LLMContentController,
            citation_health_controller_1.CitationHealthController
        ],
        providers: [
            eeat_signal_generator_service_1.EeatSignalGeneratorService,
            original_research_engine_service_1.OriginalResearchEngineService,
            citation_authority_verifier_service_1.CitationAuthorityVerifierService,
            citation_extraction_service_1.CitationExtractionService,
            external_api_service_1.ExternalApiService,
            citation_cache_service_1.CitationCacheService,
            citation_monitoring_service_1.CitationMonitoringService,
            schema_markup_generator_service_1.SchemaMarkupGeneratorService,
            azure_ai_service_1.AzureAIService,
            llm_content_optimizer_service_1.LLMContentOptimizerService,
            llm_content_analyzer_service_1.LLMContentAnalyzerService
        ],
        exports: [
            eeat_signal_generator_service_1.EeatSignalGeneratorService,
            original_research_engine_service_1.OriginalResearchEngineService,
            citation_authority_verifier_service_1.CitationAuthorityVerifierService,
            citation_extraction_service_1.CitationExtractionService,
            external_api_service_1.ExternalApiService,
            citation_cache_service_1.CitationCacheService,
            citation_monitoring_service_1.CitationMonitoringService,
            schema_markup_generator_service_1.SchemaMarkupGeneratorService,
            azure_ai_service_1.AzureAIService,
            llm_content_optimizer_service_1.LLMContentOptimizerService,
            llm_content_analyzer_service_1.LLMContentAnalyzerService
        ],
    })
], TopLayerModule);
//# sourceMappingURL=top-layer.module.js.map