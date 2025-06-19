"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MiddleLayerModule = void 0;
const common_1 = require("@nestjs/common");
const bluf_content_structurer_service_1 = require("./services/bluf-content-structurer.service");
const conversational_query_optimizer_service_1 = require("./services/conversational-query-optimizer.service");
const semantic_relationship_mapper_service_1 = require("./services/semantic-relationship-mapper.service");
const platform_specific_tuner_service_1 = require("./services/platform-specific-tuner.service");
const azure_integration_service_1 = require("./services/azure-integration.service");
const middle_layer_controller_1 = require("./controllers/middle-layer.controller");
const top_layer_module_1 = require("../top-layer/top-layer.module");
let MiddleLayerModule = class MiddleLayerModule {
};
exports.MiddleLayerModule = MiddleLayerModule;
exports.MiddleLayerModule = MiddleLayerModule = __decorate([
    (0, common_1.Module)({
        imports: [(0, common_1.forwardRef)(() => top_layer_module_1.TopLayerModule)],
        controllers: [middle_layer_controller_1.MiddleLayerController],
        providers: [
            bluf_content_structurer_service_1.BlufContentStructurerService,
            conversational_query_optimizer_service_1.ConversationalQueryOptimizerService,
            semantic_relationship_mapper_service_1.SemanticRelationshipMapperService,
            platform_specific_tuner_service_1.PlatformSpecificTunerService,
            azure_integration_service_1.AzureIntegrationService,
        ],
        exports: [
            bluf_content_structurer_service_1.BlufContentStructurerService,
            conversational_query_optimizer_service_1.ConversationalQueryOptimizerService,
            semantic_relationship_mapper_service_1.SemanticRelationshipMapperService,
            platform_specific_tuner_service_1.PlatformSpecificTunerService,
            azure_integration_service_1.AzureIntegrationService,
        ],
    })
], MiddleLayerModule);
//# sourceMappingURL=middle-layer.module.js.map