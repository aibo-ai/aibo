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
var TechnicalSeoValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TechnicalSeoValidatorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
const seo_validator_interfaces_1 = require("../../../common/interfaces/seo-validator.interfaces");
let TechnicalSeoValidatorService = TechnicalSeoValidatorService_1 = class TechnicalSeoValidatorService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(TechnicalSeoValidatorService_1.name);
        this.lighthouseApiUrl = this.configService.get('LIGHTHOUSE_API_URL') || '';
        this.azureFunctionUrl = this.configService.get('SEO_VALIDATOR_FUNCTION_URL') || '';
        this.logger.log('Technical SEO Validator Service initialized');
    }
    async validateContent(params) {
        this.logger.log(`Validating content for URL: ${params.url || 'HTML content'}`);
        try {
            if (params.url) {
                return await this.validateUrl(params);
            }
            if (params.html) {
                return await this.validateHtml(params);
            }
            throw new Error('Either URL or HTML content must be provided for validation');
        }
        catch (error) {
            this.logger.error(`Error validating content: ${error.message}`, error.stack);
            throw error;
        }
    }
    async validateUrl(params) {
        try {
            const response = await axios_1.default.post(this.azureFunctionUrl, {
                url: params.url,
                validateMobileFriendliness: params.validateMobileFriendliness !== false,
                validateAccessibility: params.validateAccessibility !== false,
                validateHeadingStructure: params.validateHeadingStructure !== false,
                validateSemanticHtml: params.validateSemanticHtml !== false,
                validateCrawlerAccessibility: params.validateCrawlerAccessibility !== false,
                validateStructuredData: params.validateStructuredData !== false,
                validateMetaTags: params.validateMetaTags !== false,
                validatePerformance: params.validatePerformance !== false,
                validateContentQuality: params.validateContentQuality !== false
            });
            return response.data;
        }
        catch (error) {
            this.logger.error(`Error validating URL: ${error.message}`, error.stack);
            throw new Error(`Failed to validate URL: ${error.message}`);
        }
    }
    async validateHtml(params) {
        const validationId = (0, uuid_1.v4)();
        return {
            id: validationId,
            contentType: params.contentType,
            validatedAt: new Date().toISOString(),
            score: this.createPlaceholderScore(),
            metrics: this.createPlaceholderMetrics(),
            issues: [],
            recommendations: [
                'Implement proper heading structure (H1, H2, H3)',
                'Ensure all images have alt text',
                'Use semantic HTML elements for better accessibility',
                'Optimize for mobile devices'
            ],
            validationParams: params
        };
    }
    createPlaceholderScore() {
        return {
            overall: 0,
            performance: 0,
            accessibility: 0,
            bestPractices: 0,
            seo: 0,
            mobileFriendly: 0,
            semanticStructure: 0
        };
    }
    createPlaceholderMetrics() {
        return {
            totalIssues: 0,
            errorCount: 0,
            warningCount: 0,
            infoCount: 0,
            passedCount: 0,
            issuesByCategory: {
                [seo_validator_interfaces_1.SeoValidationCategory.MOBILE_FRIENDLY]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.PERFORMANCE]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.CRAWLER_ACCESSIBILITY]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.META_TAGS]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.STRUCTURED_DATA]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.CONTENT_QUALITY]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.LINKS]: 0,
                [seo_validator_interfaces_1.SeoValidationCategory.IMAGES]: 0
            }
        };
    }
};
exports.TechnicalSeoValidatorService = TechnicalSeoValidatorService;
exports.TechnicalSeoValidatorService = TechnicalSeoValidatorService = TechnicalSeoValidatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TechnicalSeoValidatorService);
//# sourceMappingURL=technical-seo-validator.service.js.map