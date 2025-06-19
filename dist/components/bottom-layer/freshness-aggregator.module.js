"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreshnessAggregatorModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const freshness_aggregator_service_1 = require("./services/freshness-aggregator.service");
const qdf_algorithm_service_1 = require("./services/qdf-algorithm.service");
const freshness_thresholds_service_1 = require("./services/freshness-thresholds.service");
const content_freshness_scorer_service_1 = require("./services/content-freshness-scorer.service");
const mediastack_api_service_1 = require("./services/api-clients/mediastack-api.service");
const serper_api_service_1 = require("./services/api-clients/serper-api.service");
const exa_api_service_1 = require("./services/api-clients/exa-api.service");
let FreshnessAggregatorModule = class FreshnessAggregatorModule {
};
exports.FreshnessAggregatorModule = FreshnessAggregatorModule;
exports.FreshnessAggregatorModule = FreshnessAggregatorModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            freshness_aggregator_service_1.FreshnessAggregatorService,
            qdf_algorithm_service_1.QDFAlgorithmService,
            freshness_thresholds_service_1.FreshnessThresholdsService,
            content_freshness_scorer_service_1.ContentFreshnessScorer,
            mediastack_api_service_1.MediastackApiService,
            serper_api_service_1.SerperApiService,
            exa_api_service_1.ExaApiService
        ],
        exports: [freshness_aggregator_service_1.FreshnessAggregatorService]
    })
], FreshnessAggregatorModule);
//# sourceMappingURL=freshness-aggregator.module.js.map