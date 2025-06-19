"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalSeoValidatorModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const technical_seo_validator_service_1 = require("./services/technical-seo-validator.service");
const semantic_html_analyzer_service_1 = require("./services/semantic-html-analyzer.service");
const accessibility_validator_service_1 = require("./services/accessibility-validator.service");
let TechnicalSeoValidatorModule = class TechnicalSeoValidatorModule {
};
exports.TechnicalSeoValidatorModule = TechnicalSeoValidatorModule;
exports.TechnicalSeoValidatorModule = TechnicalSeoValidatorModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule],
        providers: [
            technical_seo_validator_service_1.TechnicalSeoValidatorService,
            semantic_html_analyzer_service_1.SemanticHtmlAnalyzerService,
            accessibility_validator_service_1.AccessibilityValidatorService
        ],
        exports: [
            technical_seo_validator_service_1.TechnicalSeoValidatorService,
            semantic_html_analyzer_service_1.SemanticHtmlAnalyzerService,
            accessibility_validator_service_1.AccessibilityValidatorService
        ]
    })
], TechnicalSeoValidatorModule);
//# sourceMappingURL=technical-seo-validator.module.js.map