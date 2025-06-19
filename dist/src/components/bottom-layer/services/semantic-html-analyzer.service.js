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
var SemanticHtmlAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SemanticHtmlAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const unified_1 = require("unified");
const rehype_parse_1 = require("rehype-parse");
const unist_util_visit_1 = require("unist-util-visit");
const uuid_1 = require("uuid");
const seo_validator_interfaces_1 = require("../../../common/interfaces/seo-validator.interfaces");
let SemanticHtmlAnalyzerService = SemanticHtmlAnalyzerService_1 = class SemanticHtmlAnalyzerService {
    constructor() {
        this.logger = new common_1.Logger(SemanticHtmlAnalyzerService_1.name);
        this.logger.log('Semantic HTML Analyzer Service initialized');
    }
    async analyzeHtml(html) {
        this.logger.log('Analyzing HTML for semantic structure');
        try {
            const issues = [];
            const ast = await (0, unified_1.unified)()
                .use(rehype_parse_1.parse, { fragment: false })
                .parse(html);
            const headingIssues = this.checkHeadingStructure(ast);
            issues.push(...headingIssues);
            const semanticIssues = this.checkSemanticElements(ast);
            issues.push(...semanticIssues);
            const accessibilityIssues = this.checkAccessibility(ast);
            issues.push(...accessibilityIssues);
            return issues;
        }
        catch (error) {
            this.logger.error(`Error analyzing HTML: ${error.message}`, error.stack);
            return [];
        }
    }
    checkHeadingStructure(ast) {
        const issues = [];
        const headings = [];
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            if (node.tagName.match(/^h[1-6]$/)) {
                const level = parseInt(node.tagName.substring(1), 10);
                let text = '';
                (0, unist_util_visit_1.visit)(node, 'text', (textNode) => {
                    text += textNode.value;
                });
                headings.push({ tag: node.tagName, level, text });
            }
        });
        if (!headings.some(h => h.level === 1)) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.ERROR,
                title: 'Missing H1 heading',
                description: 'The page does not have an H1 heading, which is essential for SEO.',
                impact: 'Search engines use H1 headings to understand the main topic of the page.',
                recommendation: 'Add an H1 heading that clearly describes the main topic of the page.'
            });
        }
        const h1Count = headings.filter(h => h.level === 1).length;
        if (h1Count > 1) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.WARNING,
                title: 'Multiple H1 headings',
                description: `The page has ${h1Count} H1 headings. It's recommended to have only one H1 per page.`,
                impact: 'Multiple H1s can confuse search engines about the main topic of the page.',
                recommendation: 'Keep only one H1 heading that represents the main topic of the page.'
            });
        }
        let previousLevel = 0;
        for (let i = 0; i < headings.length; i++) {
            const heading = headings[i];
            if (heading.level > previousLevel + 1 && previousLevel !== 0) {
                issues.push({
                    id: (0, uuid_1.v4)(),
                    category: seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE,
                    severity: seo_validator_interfaces_1.SeoValidationSeverity.WARNING,
                    title: 'Skipped heading level',
                    description: `Heading level skipped from H${previousLevel} to H${heading.level}`,
                    impact: 'Skipping heading levels can make the page structure confusing for screen readers and search engines.',
                    recommendation: `Use H${previousLevel + 1} before using H${heading.level} to maintain proper hierarchy.`,
                    element: `<${heading.tag}>${heading.text}</${heading.tag}>`
                });
            }
            previousLevel = heading.level;
        }
        return issues;
    }
    checkSemanticElements(ast) {
        const issues = [];
        const semanticElements = ['header', 'footer', 'main', 'article', 'section', 'nav', 'aside'];
        const foundElements = {};
        semanticElements.forEach(element => {
            foundElements[element] = false;
        });
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            if (semanticElements.includes(node.tagName)) {
                foundElements[node.tagName] = true;
            }
        });
        const missingElements = semanticElements.filter(element => !foundElements[element]);
        if (missingElements.length > 0) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.INFO,
                title: 'Missing semantic HTML elements',
                description: `The page is missing the following semantic elements: ${missingElements.join(', ')}`,
                impact: 'Semantic HTML elements help search engines understand the structure and content of your page.',
                recommendation: `Consider using semantic HTML elements like ${missingElements.join(', ')} to improve SEO and accessibility.`
            });
        }
        let divCount = 0;
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            if (node.tagName === 'div') {
                divCount++;
            }
        });
        if (divCount > 50) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.INFO,
                title: 'Excessive use of div elements',
                description: `The page uses ${divCount} div elements, which may indicate a lack of semantic structure.`,
                impact: 'Overusing div elements instead of semantic HTML can make it harder for search engines to understand your content.',
                recommendation: 'Replace generic div elements with semantic HTML elements where appropriate.'
            });
        }
        return issues;
    }
    checkAccessibility(ast) {
        const issues = [];
        const imagesWithoutAlt = [];
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            var _a, _b;
            if (node.tagName === 'img') {
                const altAttr = (_a = node.properties) === null || _a === void 0 ? void 0 : _a.alt;
                if (!altAttr && altAttr !== '') {
                    let src = ((_b = node.properties) === null || _b === void 0 ? void 0 : _b.src) || 'unknown';
                    if (typeof src === 'object') {
                        src = JSON.stringify(src);
                    }
                    imagesWithoutAlt.push(src);
                }
            }
        });
        if (imagesWithoutAlt.length > 0) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.ERROR,
                title: 'Images without alt text',
                description: `Found ${imagesWithoutAlt.length} images without alt text`,
                impact: 'Images without alt text are not accessible to screen readers and don\'t contribute to SEO.',
                recommendation: 'Add descriptive alt text to all images.'
            });
        }
        const inputsWithoutLabels = [];
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            var _a;
            if (['input', 'textarea', 'select'].includes(node.tagName)) {
                const id = (_a = node.properties) === null || _a === void 0 ? void 0 : _a.id;
                if (id) {
                    let hasLabel = false;
                    (0, unist_util_visit_1.visit)(ast, 'element', (labelNode) => {
                        var _a;
                        if (labelNode.tagName === 'label' && ((_a = labelNode.properties) === null || _a === void 0 ? void 0 : _a.for) === id) {
                            hasLabel = true;
                        }
                    });
                    if (!hasLabel) {
                        inputsWithoutLabels.push(node.tagName);
                    }
                }
                else {
                    inputsWithoutLabels.push(node.tagName);
                }
            }
        });
        if (inputsWithoutLabels.length > 0) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.WARNING,
                title: 'Form inputs without labels',
                description: `Found ${inputsWithoutLabels.length} form inputs without associated labels`,
                impact: 'Form inputs without labels are not accessible to screen readers.',
                recommendation: 'Add labels with matching "for" attributes to all form inputs.'
            });
        }
        return issues;
    }
};
exports.SemanticHtmlAnalyzerService = SemanticHtmlAnalyzerService;
exports.SemanticHtmlAnalyzerService = SemanticHtmlAnalyzerService = SemanticHtmlAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SemanticHtmlAnalyzerService);
//# sourceMappingURL=semantic-html-analyzer.service.js.map