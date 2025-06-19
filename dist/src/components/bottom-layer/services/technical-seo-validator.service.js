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
const axios_1 = require("axios");
const uuid_1 = require("uuid");
const seo_validator_interfaces_1 = require("../../../common/interfaces/seo-validator.interfaces");
const semantic_html_analyzer_service_1 = require("./semantic-html-analyzer.service");
const accessibility_validator_service_1 = require("./accessibility-validator.service");
let TechnicalSeoValidatorService = TechnicalSeoValidatorService_1 = class TechnicalSeoValidatorService {
    constructor(configService, semanticHtmlAnalyzer, accessibilityValidator) {
        this.configService = configService;
        this.semanticHtmlAnalyzer = semanticHtmlAnalyzer;
        this.accessibilityValidator = accessibilityValidator;
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
        try {
            this.logger.log('Validating HTML content using local validation');
            const validationId = (0, uuid_1.v4)();
            const html = params.html;
            if (!html) {
                throw new Error('HTML content is required for validation');
            }
            const issues = [];
            if (params.validateSemanticHtml !== false || params.validateHeadingStructure !== false) {
                const semanticIssues = await this.semanticHtmlAnalyzer.analyzeHtml(html);
                issues.push(...semanticIssues);
            }
            const metrics = this.calculateMetrics(issues);
            const score = this.calculateScores(issues, metrics);
            const recommendations = this.generateRecommendations(issues);
            return {
                id: validationId,
                contentType: params.contentType,
                validatedAt: new Date().toISOString(),
                score,
                metrics,
                issues,
                recommendations,
                validationParams: params
            };
        }
        catch (error) {
            this.logger.error(`Error validating HTML content: ${error.message}`, error.stack);
            throw new Error(`Failed to validate HTML content: ${error.message}`);
        }
    }
    calculateMetrics(issues) {
        const metrics = {
            totalIssues: issues.length,
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
        issues.forEach(issue => {
            switch (issue.severity) {
                case seo_validator_interfaces_1.SeoValidationSeverity.ERROR:
                    metrics.errorCount++;
                    break;
                case seo_validator_interfaces_1.SeoValidationSeverity.WARNING:
                    metrics.warningCount++;
                    break;
                case seo_validator_interfaces_1.SeoValidationSeverity.INFO:
                    metrics.infoCount++;
                    break;
            }
            if (metrics.issuesByCategory[issue.category] !== undefined) {
                metrics.issuesByCategory[issue.category]++;
            }
        });
        metrics.passedCount = 20 - metrics.totalIssues;
        if (metrics.passedCount < 0)
            metrics.passedCount = 0;
        return metrics;
    }
    calculateScores(issues, metrics) {
        const totalChecks = metrics.totalIssues + metrics.passedCount;
        const baseScore = totalChecks > 0 ? (metrics.passedCount / totalChecks) * 100 : 0;
        const accessibilityScore = this.calculateCategoryScore(issues, metrics, seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY);
        const mobileFriendlyScore = this.calculateCategoryScore(issues, metrics, seo_validator_interfaces_1.SeoValidationCategory.MOBILE_FRIENDLY);
        const semanticStructureScore = this.calculateCategoryScore(issues, metrics, [seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE, seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML]);
        const seoScore = this.calculateCategoryScore(issues, metrics, [seo_validator_interfaces_1.SeoValidationCategory.META_TAGS, seo_validator_interfaces_1.SeoValidationCategory.STRUCTURED_DATA]);
        const performanceScore = this.calculateCategoryScore(issues, metrics, seo_validator_interfaces_1.SeoValidationCategory.PERFORMANCE);
        const overallScore = (accessibilityScore * 0.2 +
            mobileFriendlyScore * 0.2 +
            semanticStructureScore * 0.2 +
            seoScore * 0.3 +
            performanceScore * 0.1);
        return {
            overall: Math.round(overallScore),
            performance: Math.round(performanceScore),
            accessibility: Math.round(accessibilityScore),
            bestPractices: Math.round(baseScore),
            seo: Math.round(seoScore),
            mobileFriendly: Math.round(mobileFriendlyScore),
            semanticStructure: Math.round(semanticStructureScore)
        };
    }
    calculateCategoryScore(issues, metrics, categories) {
        const categoryArray = Array.isArray(categories) ? categories : [categories];
        const categoryIssues = issues.filter(issue => categoryArray.includes(issue.category));
        const errorCount = categoryIssues.filter(issue => issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.ERROR).length;
        const warningCount = categoryIssues.filter(issue => issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.WARNING).length;
        const infoCount = categoryIssues.filter(issue => issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.INFO).length;
        let score = 100;
        score -= errorCount * 20;
        score -= warningCount * 10;
        score -= infoCount * 5;
        return Math.max(0, Math.min(100, score));
    }
    generateRecommendations(issues) {
        const recommendations = new Set();
        issues.forEach(issue => {
            if (issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.ERROR || issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.WARNING) {
                if (issue.recommendation) {
                    recommendations.add(issue.recommendation);
                }
            }
        });
        if (recommendations.size === 0) {
            recommendations.add('Implement proper heading structure (H1, H2, H3)');
            recommendations.add('Ensure all images have alt text');
            recommendations.add('Use semantic HTML elements for better accessibility');
            recommendations.add('Optimize for mobile devices');
        }
        return Array.from(recommendations).slice(0, 5);
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
    __metadata("design:paramtypes", [config_1.ConfigService,
        semantic_html_analyzer_service_1.SemanticHtmlAnalyzerService,
        accessibility_validator_service_1.AccessibilityValidatorService])
], TechnicalSeoValidatorService);
//# sourceMappingURL=technical-seo-validator.service.js.map