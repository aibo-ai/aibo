"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMContentModule = void 0;
const common_1 = require("@nestjs/common");
const common_module_1 = require("../../common/common.module");
const llm_content_controller_1 = require("./controllers/llm-content-controller");
const llm_content_optimizer_service_1 = require("./services/llm-content-optimizer.service");
const llm_content_analyzer_service_1 = require("./services/llm-content-analyzer.service");
const azure_ai_service_1 = require("./services/azure-ai-service");
const bluf_content_structurer_service_1 = require("../middle-layer/services/bluf-content-structurer.service");
const content_chunker_service_1 = require("../bottom-layer/services/content-chunker.service");
let LLMContentModule = class LLMContentModule {
};
exports.LLMContentModule = LLMContentModule;
exports.LLMContentModule = LLMContentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            common_module_1.CommonModule
        ],
        controllers: [
            llm_content_controller_1.LLMContentController
        ],
        providers: [
            llm_content_optimizer_service_1.LLMContentOptimizerService,
            llm_content_analyzer_service_1.LLMContentAnalyzerService,
            azure_ai_service_1.AzureAIService,
            bluf_content_structurer_service_1.BlufContentStructurerService,
            content_chunker_service_1.ContentChunkerService
        ],
        exports: [
            llm_content_optimizer_service_1.LLMContentOptimizerService,
            llm_content_analyzer_service_1.LLMContentAnalyzerService
        ]
    })
], LLMContentModule);
//# sourceMappingURL=llm-content.module.js.map