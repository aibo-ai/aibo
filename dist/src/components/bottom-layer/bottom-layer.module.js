"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BottomLayerModule = void 0;
const common_1 = require("@nestjs/common");
const query_intent_analyzer_service_1 = require("./services/query-intent-analyzer.service");
const freshness_aggregator_service_1 = require("./freshness-aggregator/services/freshness-aggregator.service");
const content_chunker_service_1 = require("./services/content-chunker.service");
const keyword_topic_analyzer_service_1 = require("./services/keyword-topic-analyzer.service");
const azure_data_persistence_service_1 = require("./services/azure-data-persistence.service");
const intentClassifier_1 = require("./services/intentClassifier");
const queryGenerator_1 = require("./services/queryGenerator");
const searchParameterGenerator_1 = require("./services/searchParameterGenerator");
const bottom_layer_controller_1 = require("./controllers/bottom-layer.controller");
const technical_seo_validator_module_1 = require("./technical-seo-validator.module");
const technical_seo_validator_controller_1 = require("./controllers/technical-seo-validator.controller");
let BottomLayerModule = class BottomLayerModule {
};
exports.BottomLayerModule = BottomLayerModule;
exports.BottomLayerModule = BottomLayerModule = __decorate([
    (0, common_1.Module)({
        imports: [technical_seo_validator_module_1.TechnicalSeoValidatorModule],
        controllers: [bottom_layer_controller_1.BottomLayerController, technical_seo_validator_controller_1.TechnicalSeoValidatorController],
        providers: [
            query_intent_analyzer_service_1.QueryIntentAnalyzerService,
            freshness_aggregator_service_1.FreshnessAggregatorService,
            content_chunker_service_1.ContentChunkerService,
            keyword_topic_analyzer_service_1.KeywordTopicAnalyzerService,
            azure_data_persistence_service_1.AzureDataPersistenceService,
            intentClassifier_1.IntentClassifier,
            queryGenerator_1.QueryGenerator,
            searchParameterGenerator_1.SearchParameterGenerator,
        ],
        exports: [
            query_intent_analyzer_service_1.QueryIntentAnalyzerService,
            freshness_aggregator_service_1.FreshnessAggregatorService,
            content_chunker_service_1.ContentChunkerService,
            keyword_topic_analyzer_service_1.KeywordTopicAnalyzerService,
            azure_data_persistence_service_1.AzureDataPersistenceService,
            intentClassifier_1.IntentClassifier,
            queryGenerator_1.QueryGenerator,
            searchParameterGenerator_1.SearchParameterGenerator,
        ],
    })
], BottomLayerModule);
//# sourceMappingURL=bottom-layer.module.js.map