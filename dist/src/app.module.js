"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const orchestrator_module_1 = require("./components/orchestrator/orchestrator.module");
const bottom_layer_module_1 = require("./components/bottom-layer/bottom-layer.module");
const middle_layer_module_1 = require("./components/middle-layer/middle-layer.module");
const top_layer_module_1 = require("./components/top-layer/top-layer.module");
const technical_seo_validator_module_1 = require("./modules/technical-seo-validator/technical-seo-validator.module");
const image_generation_module_1 = require("./components/image-generation/image-generation.module");
const audio_generation_module_1 = require("./components/audio-generation/audio-generation.module");
const mentionlytics_module_1 = require("./components/mentionlytics/mentionlytics.module");
const moz_seo_module_1 = require("./components/moz-seo/moz-seo.module");
const rapid_api_module_1 = require("./components/rapid-api/rapid-api.module");
const shared_module_1 = require("./shared/shared.module");
const common_module_1 = require("./common/common.module");
const integrations_module_1 = require("./integrations/integrations.module");
const internal_module_1 = require("./internal/internal.module");
const production_module_1 = require("./common/modules/production.module");
const seo_data_integration_module_1 = require("./components/seo-data-integration/seo-data-integration.module");
const gemini_integration_module_1 = require("./components/gemini-integration/gemini-integration.module");
const root_controller_1 = require("./controllers/root.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
            }),
            shared_module_1.SharedModule,
            common_module_1.CommonModule,
            integrations_module_1.IntegrationsModule,
            internal_module_1.InternalModule,
            production_module_1.ProductionModule,
            seo_data_integration_module_1.SeoDataIntegrationModule,
            gemini_integration_module_1.GeminiIntegrationModule,
            orchestrator_module_1.OrchestratorModule,
            bottom_layer_module_1.BottomLayerModule,
            middle_layer_module_1.MiddleLayerModule,
            top_layer_module_1.TopLayerModule,
            technical_seo_validator_module_1.TechnicalSeoValidatorModule,
            image_generation_module_1.ImageGenerationModule,
            audio_generation_module_1.AudioGenerationModule,
            mentionlytics_module_1.MentionlyticsModule,
            moz_seo_module_1.MozSeoModule,
            rapid_api_module_1.RapidApiModule,
        ],
        controllers: [root_controller_1.RootController],
        providers: [],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map