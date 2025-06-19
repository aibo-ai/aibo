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
var AccessibilityValidatorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessibilityValidatorService = void 0;
const common_1 = require("@nestjs/common");
const uuid_1 = require("uuid");
const seo_validator_interfaces_1 = require("../../../common/interfaces/seo-validator.interfaces");
let AccessibilityValidatorService = AccessibilityValidatorService_1 = class AccessibilityValidatorService {
    constructor() {
        this.logger = new common_1.Logger(AccessibilityValidatorService_1.name);
        this.logger.log('Accessibility Validator Service initialized');
    }
    mapAxeResultsToIssues(axeResults) {
        this.logger.log(`Processing ${axeResults.violations.length} accessibility violations`);
        const issues = [];
        axeResults.violations.forEach(violation => {
            let severity;
            switch (violation.impact) {
                case 'critical':
                    severity = seo_validator_interfaces_1.SeoValidationSeverity.ERROR;
                    break;
                case 'serious':
                    severity = seo_validator_interfaces_1.SeoValidationSeverity.ERROR;
                    break;
                case 'moderate':
                    severity = seo_validator_interfaces_1.SeoValidationSeverity.WARNING;
                    break;
                case 'minor':
                    severity = seo_validator_interfaces_1.SeoValidationSeverity.INFO;
                    break;
                default:
                    severity = seo_validator_interfaces_1.SeoValidationSeverity.INFO;
            }
            violation.nodes.forEach(node => {
                issues.push({
                    id: (0, uuid_1.v4)(),
                    category: seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY,
                    severity,
                    title: violation.help,
                    description: violation.description,
                    impact: `Impact: ${violation.impact}, WCAG: ${violation.tags.filter(tag => tag.startsWith('wcag')).join(', ')}`,
                    recommendation: node.failureSummary || 'Fix this accessibility issue to improve user experience and SEO',
                    element: node.html,
                    location: {
                        selector: node.target.join(', ')
                    }
                });
            });
        });
        return issues;
    }
    calculateAccessibilityScore(axeResults) {
        const totalChecks = axeResults.passes.length + axeResults.violations.length;
        if (totalChecks === 0) {
            return 0;
        }
        const score = (axeResults.passes.length / totalChecks) * 100;
        const criticalViolations = axeResults.violations.filter(v => v.impact === 'critical').length;
        const seriousViolations = axeResults.violations.filter(v => v.impact === 'serious').length;
        let weightedScore = score;
        weightedScore -= criticalViolations * 10;
        weightedScore -= seriousViolations * 5;
        return Math.max(0, Math.min(100, weightedScore));
    }
    generateAccessibilityRecommendations(issues) {
        const recommendations = [];
        const issueTypes = new Map();
        issues.forEach(issue => {
            const count = issueTypes.get(issue.title) || 0;
            issueTypes.set(issue.title, count + 1);
        });
        if (issueTypes.has('Images must have alternate text')) {
            recommendations.push('Add descriptive alt text to all images to improve accessibility and SEO');
        }
        if (issueTypes.has('Form elements must have labels')) {
            recommendations.push('Ensure all form inputs have associated labels for better accessibility');
        }
        if (issueTypes.has('Elements must have sufficient color contrast')) {
            recommendations.push('Improve color contrast between text and background to meet WCAG standards');
        }
        if (issueTypes.has('Links must have discernible text')) {
            recommendations.push('Ensure all links have meaningful text that describes their purpose');
        }
        if (issueTypes.has('Document must have one main landmark')) {
            recommendations.push('Add a main landmark (e.g., <main> element) to improve page structure');
        }
        if (recommendations.length === 0 && issues.length > 0) {
            recommendations.push('Address accessibility issues to improve user experience and SEO performance');
        }
        return recommendations;
    }
};
exports.AccessibilityValidatorService = AccessibilityValidatorService;
exports.AccessibilityValidatorService = AccessibilityValidatorService = AccessibilityValidatorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], AccessibilityValidatorService);
//# sourceMappingURL=accessibility-validator.service.js.map