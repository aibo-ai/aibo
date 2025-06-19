"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chromeLauncher = require("chrome-launcher");
const lighthouse = require("lighthouse");
const puppeteer = require("puppeteer");
const unified_1 = require("unified");
const rehype_parse_1 = require("rehype-parse");
const unist_util_visit_1 = require("unist-util-visit");
const uuid_1 = require("uuid");
const seo_validator_interfaces_1 = require("../../src/common/interfaces/seo-validator.interfaces");
const httpTrigger = async function (context, req) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    context.log('Technical SEO Validator function processing request');
    try {
        const params = {
            url: (_a = req.body) === null || _a === void 0 ? void 0 : _a.url,
            html: (_b = req.body) === null || _b === void 0 ? void 0 : _b.html,
            contentType: (_c = req.body) === null || _c === void 0 ? void 0 : _c.contentType,
            validateMobileFriendliness: ((_d = req.body) === null || _d === void 0 ? void 0 : _d.validateMobileFriendliness) !== false,
            validateAccessibility: ((_e = req.body) === null || _e === void 0 ? void 0 : _e.validateAccessibility) !== false,
            validateHeadingStructure: ((_f = req.body) === null || _f === void 0 ? void 0 : _f.validateHeadingStructure) !== false,
            validateSemanticHtml: ((_g = req.body) === null || _g === void 0 ? void 0 : _g.validateSemanticHtml) !== false,
            validateCrawlerAccessibility: ((_h = req.body) === null || _h === void 0 ? void 0 : _h.validateCrawlerAccessibility) !== false,
            validateStructuredData: ((_j = req.body) === null || _j === void 0 ? void 0 : _j.validateStructuredData) !== false,
            validateMetaTags: ((_k = req.body) === null || _k === void 0 ? void 0 : _k.validateMetaTags) !== false,
            validatePerformance: ((_l = req.body) === null || _l === void 0 ? void 0 : _l.validatePerformance) !== false,
            validateContentQuality: ((_m = req.body) === null || _m === void 0 ? void 0 : _m.validateContentQuality) !== false
        };
        if (!params.url && !params.html) {
            context.res = {
                status: 400,
                body: { error: 'Either URL or HTML content is required' }
            };
            return;
        }
        let result;
        if (params.url) {
            result = await validateUrl(params);
        }
        else {
            result = await validateHtml(params);
        }
        context.res = {
            status: 200,
            body: result
        };
    }
    catch (error) {
        context.log.error(`Error in Technical SEO Validator: ${error.message}`, error);
        context.res = {
            status: 500,
            body: { error: `Failed to validate: ${error.message}` }
        };
    }
};
async function validateUrl(params) {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'] });
    try {
        const options = {
            logLevel: 'info',
            output: 'json',
            port: chrome.port,
            onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
        };
        const runnerResult = await lighthouse(params.url, options);
        const lighthouseResult = runnerResult.lhr;
        const issues = extractValidationIssues(lighthouseResult, params);
        const score = calculateValidationScore(lighthouseResult);
        const metrics = calculateValidationMetrics(issues);
        const recommendations = generateRecommendations(issues);
        const result = {
            id: (0, uuid_1.v4)(),
            url: params.url,
            contentType: params.contentType,
            validatedAt: new Date().toISOString(),
            score,
            metrics,
            issues,
            recommendations,
            validationParams: params
        };
        return result;
    }
    finally {
        await chrome.kill();
    }
}
function extractValidationIssues(lighthouseResult, params) {
    const issues = [];
    Object.entries(lighthouseResult.audits).forEach(([id, audit]) => {
        if (audit.score === 1)
            return;
        let category;
        let severity;
        if (id.includes('accessibility')) {
            category = seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY;
        }
        else if (id.includes('seo')) {
            category = seo_validator_interfaces_1.SeoValidationCategory.META_TAGS;
        }
        else if (id.includes('best-practices')) {
            category = seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML;
        }
        else if (id.includes('performance')) {
            category = seo_validator_interfaces_1.SeoValidationCategory.PERFORMANCE;
        }
        else if (id.includes('viewport') || id.includes('content-width')) {
            category = seo_validator_interfaces_1.SeoValidationCategory.MOBILE_FRIENDLY;
        }
        else {
            category = seo_validator_interfaces_1.SeoValidationCategory.CONTENT_QUALITY;
        }
        if (audit.score === null || audit.score < 0.5) {
            severity = seo_validator_interfaces_1.SeoValidationSeverity.ERROR;
        }
        else if (audit.score < 0.9) {
            severity = seo_validator_interfaces_1.SeoValidationSeverity.WARNING;
        }
        else {
            severity = seo_validator_interfaces_1.SeoValidationSeverity.INFO;
        }
        const issue = {
            id: (0, uuid_1.v4)(),
            category,
            severity,
            title: audit.title || id,
            description: audit.description || '',
            impact: `Score: ${audit.score !== null ? Math.round(audit.score * 100) : 'N/A'}%`,
            recommendation: audit.description || 'Fix this issue to improve SEO'
        };
        issues.push(issue);
    });
    return issues;
}
function calculateValidationScore(lighthouseResult) {
    var _a, _b, _c, _d;
    return {
        overall: calculateOverallScore(lighthouseResult),
        performance: ((_a = lighthouseResult.categories.performance) === null || _a === void 0 ? void 0 : _a.score) * 100 || 0,
        accessibility: ((_b = lighthouseResult.categories.accessibility) === null || _b === void 0 ? void 0 : _b.score) * 100 || 0,
        bestPractices: ((_c = lighthouseResult.categories['best-practices']) === null || _c === void 0 ? void 0 : _c.score) * 100 || 0,
        seo: ((_d = lighthouseResult.categories.seo) === null || _d === void 0 ? void 0 : _d.score) * 100 || 0,
        mobileFriendly: estimateMobileFriendlyScore(lighthouseResult),
        semanticStructure: estimateSemanticStructureScore(lighthouseResult)
    };
}
function calculateOverallScore(lighthouseResult) {
    var _a, _b, _c, _d;
    const scores = [
        ((_a = lighthouseResult.categories.performance) === null || _a === void 0 ? void 0 : _a.score) || 0,
        ((_b = lighthouseResult.categories.accessibility) === null || _b === void 0 ? void 0 : _b.score) || 0,
        ((_c = lighthouseResult.categories['best-practices']) === null || _c === void 0 ? void 0 : _c.score) || 0,
        ((_d = lighthouseResult.categories.seo) === null || _d === void 0 ? void 0 : _d.score) || 0
    ];
    const sum = scores.reduce((total, score) => total + score, 0);
    return (sum / scores.length) * 100;
}
function estimateMobileFriendlyScore(lighthouseResult) {
    const relevantAudits = [
        'viewport',
        'content-width',
        'tap-targets',
        'font-size',
        'plugins'
    ];
    let totalScore = 0;
    let count = 0;
    relevantAudits.forEach(auditId => {
        const audit = lighthouseResult.audits[auditId];
        if (audit && audit.score !== null) {
            totalScore += audit.score;
            count++;
        }
    });
    return count > 0 ? (totalScore / count) * 100 : 0;
}
function estimateSemanticStructureScore(lighthouseResult) {
    const relevantAudits = [
        'heading-order',
        'document-title',
        'html-has-lang',
        'meta-description',
        'link-name',
        'image-alt'
    ];
    let totalScore = 0;
    let count = 0;
    relevantAudits.forEach(auditId => {
        const audit = lighthouseResult.audits[auditId];
        if (audit && audit.score !== null) {
            totalScore += audit.score;
            count++;
        }
    });
    return count > 0 ? (totalScore / count) * 100 : 0;
}
function calculateValidationMetrics(issues) {
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
        if (issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.ERROR) {
            metrics.errorCount++;
        }
        else if (issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.WARNING) {
            metrics.warningCount++;
        }
        else if (issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.INFO) {
            metrics.infoCount++;
        }
        else if (issue.severity === seo_validator_interfaces_1.SeoValidationSeverity.PASSED) {
            metrics.passedCount++;
        }
        metrics.issuesByCategory[issue.category]++;
    });
    return metrics;
}
function generateRecommendations(issues) {
    var _a, _b, _c, _d, _e, _f;
    const issuesByCategory = issues.reduce((acc, issue) => {
        if (!acc[issue.category]) {
            acc[issue.category] = [];
        }
        acc[issue.category].push(issue);
        return acc;
    }, {});
    const recommendations = [];
    if (((_a = issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.MOBILE_FRIENDLY]) === null || _a === void 0 ? void 0 : _a.length) > 0) {
        recommendations.push('Improve mobile-friendliness by implementing responsive design and proper viewport configuration');
    }
    if (((_b = issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY]) === null || _b === void 0 ? void 0 : _b.length) > 0) {
        recommendations.push('Enhance accessibility by adding proper ARIA attributes and ensuring keyboard navigation');
    }
    if (((_c = issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE]) === null || _c === void 0 ? void 0 : _c.length) > 0) {
        recommendations.push('Implement proper heading structure with a single H1 and logical hierarchy of H2-H6 elements');
    }
    if (((_d = issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML]) === null || _d === void 0 ? void 0 : _d.length) > 0) {
        recommendations.push('Use semantic HTML elements like article, section, nav, and header for better SEO and accessibility');
    }
    if (((_e = issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.META_TAGS]) === null || _e === void 0 ? void 0 : _e.length) > 0) {
        recommendations.push('Add proper meta tags including title, description, and Open Graph properties');
    }
    if (((_f = issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.PERFORMANCE]) === null || _f === void 0 ? void 0 : _f.length) > 0) {
        recommendations.push('Optimize performance by minimizing render-blocking resources and optimizing images');
    }
    if (recommendations.length === 0) {
        recommendations.push('Continue following SEO best practices to maintain good search visibility');
    }
    return recommendations;
}
async function validateHtml(params) {
    const html = params.html;
    if (!html) {
        throw new Error('HTML content is required');
    }
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    try {
        const issues = [];
        if (params.validateSemanticHtml !== false || params.validateHeadingStructure !== false) {
            const semanticIssues = await analyzeSemanticHtml(html);
            issues.push(...semanticIssues);
        }
        if (params.validateAccessibility !== false) {
            const accessibilityIssues = await analyzeAccessibility(html, browser);
            issues.push(...accessibilityIssues);
        }
        const metrics = calculateValidationMetrics(issues);
        const score = {
            overall: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
            performance: 0,
            accessibility: 100 - (metrics.issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY] * 10),
            bestPractices: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
            seo: 100 - (metrics.issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.META_TAGS] * 10),
            mobileFriendly: 0,
            semanticStructure: 100 - (metrics.issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.SEMANTIC_HTML] * 10) -
                (metrics.issuesByCategory[seo_validator_interfaces_1.SeoValidationCategory.HEADING_STRUCTURE] * 10)
        };
        Object.keys(score).forEach(key => {
            score[key] = Math.max(0, Math.min(100, score[key]));
        });
        const recommendations = generateRecommendations(issues);
        const result = {
            id: (0, uuid_1.v4)(),
            url: params.url || 'html-content',
            contentType: params.contentType,
            validatedAt: new Date().toISOString(),
            score,
            metrics,
            issues,
            recommendations,
            validationParams: params
        };
        return result;
    }
    finally {
        await browser.close();
    }
}
async function analyzeSemanticHtml(html) {
    const issues = [];
    try {
        const ast = await (0, unified_1.default)()
            .use(rehype_parse_1.default, { fragment: false })
            .parse(html);
        const headings = [];
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            var _a;
            if ((_a = node.tagName) === null || _a === void 0 ? void 0 : _a.match(/^h[1-6]$/)) {
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
        (0, unist_util_visit_1.visit)(ast, 'element', (node) => {
            var _a, _b;
            if (node.tagName === 'img') {
                const altAttr = (_a = node.properties) === null || _a === void 0 ? void 0 : _a.alt;
                if (!altAttr && altAttr !== '') {
                    let src = ((_b = node.properties) === null || _b === void 0 ? void 0 : _b.src) || 'unknown';
                    if (typeof src === 'object') {
                        src = JSON.stringify(src);
                    }
                    issues.push({
                        id: (0, uuid_1.v4)(),
                        category: seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY,
                        severity: seo_validator_interfaces_1.SeoValidationSeverity.ERROR,
                        title: 'Image missing alt text',
                        description: `Image without alt text: ${src}`,
                        impact: 'Images without alt text are not accessible to screen readers and don\'t contribute to SEO.',
                        recommendation: 'Add descriptive alt text to all images.',
                        element: `<img src="${src}">`
                    });
                }
            }
        });
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
        return issues;
    }
    catch (error) {
        console.error('Error analyzing semantic HTML:', error);
        return [];
    }
}
async function analyzeAccessibility(html, browser) {
    const issues = [];
    try {
        const page = await browser.newPage();
        await page.setContent(html);
        const inputsWithoutLabels = await page.evaluate(() => {
            const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
            return inputs.filter(input => {
                const id = input.id;
                if (!id)
                    return true;
                const label = document.querySelector(`label[for="${id}"]`);
                return !label;
            }).map(input => input.outerHTML);
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
        const emptyLinks = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            return links.filter(link => {
                var _a;
                const text = (_a = link.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                const ariaLabel = link.getAttribute('aria-label');
                const hasImage = link.querySelector('img') !== null;
                return (!text || text === '') && !ariaLabel && !hasImage;
            }).map(link => link.outerHTML);
        });
        if (emptyLinks.length > 0) {
            issues.push({
                id: (0, uuid_1.v4)(),
                category: seo_validator_interfaces_1.SeoValidationCategory.ACCESSIBILITY,
                severity: seo_validator_interfaces_1.SeoValidationSeverity.ERROR,
                title: 'Empty links',
                description: `Found ${emptyLinks.length} links without text content`,
                impact: 'Links without text are not accessible to screen readers and provide no context for users.',
                recommendation: 'Add descriptive text to all links or use aria-label attributes.'
            });
        }
        await page.close();
        return issues;
    }
    catch (error) {
        console.error('Error analyzing accessibility:', error);
        return [];
    }
}
exports.default = httpTrigger;
//# sourceMappingURL=index.js.map