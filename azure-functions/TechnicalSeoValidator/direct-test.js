"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var puppeteer = require("puppeteer");
var unified_1 = require("unified");
var rehype_parse_1 = require("rehype-parse");
var unist_util_visit_1 = require("unist-util-visit");
var uuid_1 = require("uuid");
// We'll need to implement a simplified version of validateHtml since we can't import it directly
// Sample HTML content for testing
var sampleHtml = "\n<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n  <meta charset=\"UTF-8\">\n  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n  <title>Test Page</title>\n  <meta name=\"description\" content=\"Test page for SEO validation\">\n</head>\n<body>\n  <!-- Missing H1 tag -->\n  <h2>This is a secondary heading</h2>\n  \n  <!-- Missing alt text -->\n  <img src=\"test.jpg\">\n  \n  <!-- Empty link -->\n  <a href=\"#\">Click here</a>\n  \n  <!-- Form without labels -->\n  <form>\n    <input type=\"text\" placeholder=\"Name\">\n    <input type=\"email\" placeholder=\"Email\">\n    <button type=\"submit\">Submit</button>\n  </form>\n  \n  <p>This is a test paragraph.</p>\n</body>\n</html>\n";
// Simplified implementation of the validator functions for testing purposes
// SeoValidationCategory enum (simplified version)
var SeoValidationCategory;
(function (SeoValidationCategory) {
    SeoValidationCategory["ACCESSIBILITY"] = "accessibility";
    SeoValidationCategory["SEMANTIC_HTML"] = "semantic_html";
    SeoValidationCategory["HEADING_STRUCTURE"] = "heading_structure";
    SeoValidationCategory["META_TAGS"] = "meta_tags";
    SeoValidationCategory["MOBILE_FRIENDLY"] = "mobile_friendly";
    SeoValidationCategory["PERFORMANCE"] = "performance";
    SeoValidationCategory["BEST_PRACTICES"] = "best_practices";
})(SeoValidationCategory || (SeoValidationCategory = {}));
// SeoValidationSeverity enum (simplified version)
var SeoValidationSeverity;
(function (SeoValidationSeverity) {
    SeoValidationSeverity["ERROR"] = "error";
    SeoValidationSeverity["WARNING"] = "warning";
    SeoValidationSeverity["INFO"] = "info";
})(SeoValidationSeverity || (SeoValidationSeverity = {}));
// Analyze semantic HTML structure
function analyzeSemanticHtml(html) {
    return __awaiter(this, void 0, void 0, function () {
        var issues, ast, headings_1, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    issues = [];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, (0, unified_1.unified)()
                            .use(rehype_parse_1["default"], { fragment: false })
                            .parse(html)];
                case 2:
                    ast = _a.sent();
                    headings_1 = [];
                    // Find all heading elements
                    (0, unist_util_visit_1.visit)(ast, 'element', function (node) {
                        var _a;
                        if ((_a = node.tagName) === null || _a === void 0 ? void 0 : _a.match(/^h[1-6]$/)) {
                            var level = parseInt(node.tagName.substring(1), 10);
                            var text_1 = '';
                            // Extract text content
                            (0, unist_util_visit_1.visit)(node, 'text', function (textNode) {
                                text_1 += textNode.value;
                            });
                            headings_1.push({ tag: node.tagName, level: level, text: text_1 });
                        }
                    });
                    // Check if there's an H1
                    if (!headings_1.some(function (h) { return h.level === 1; })) {
                        issues.push({
                            id: (0, uuid_1.v4)(),
                            category: SeoValidationCategory.HEADING_STRUCTURE,
                            severity: SeoValidationSeverity.ERROR,
                            title: 'Missing H1 heading',
                            description: 'The page does not have an H1 heading, which is essential for SEO.',
                            impact: 'Search engines use H1 headings to understand the main topic of the page.',
                            recommendation: 'Add an H1 heading that clearly describes the main topic of the page.'
                        });
                    }
                    // Check for images without alt text
                    (0, unist_util_visit_1.visit)(ast, 'element', function (node) {
                        var _a, _b;
                        if (node.tagName === 'img') {
                            var altAttr = (_a = node.properties) === null || _a === void 0 ? void 0 : _a.alt;
                            if (!altAttr && altAttr !== '') {
                                var src = ((_b = node.properties) === null || _b === void 0 ? void 0 : _b.src) || 'unknown';
                                if (typeof src === 'object') {
                                    src = JSON.stringify(src);
                                }
                                issues.push({
                                    id: (0, uuid_1.v4)(),
                                    category: SeoValidationCategory.ACCESSIBILITY,
                                    severity: SeoValidationSeverity.ERROR,
                                    title: 'Image missing alt text',
                                    description: "Image without alt text: ".concat(src),
                                    impact: 'Images without alt text are not accessible to screen readers and don\'t contribute to SEO.',
                                    recommendation: 'Add descriptive alt text to all images.',
                                    element: "<img src=\"".concat(src, "\">")
                                });
                            }
                        }
                    });
                    return [2 /*return*/, issues];
                case 3:
                    error_1 = _a.sent();
                    console.error('Error analyzing semantic HTML:', error_1);
                    return [2 /*return*/, []];
                case 4: return [2 /*return*/];
            }
        });
    });
}
// Analyze accessibility using Puppeteer
function analyzeAccessibility(html, browser) {
    return __awaiter(this, void 0, void 0, function () {
        var issues, page, inputsWithoutLabels;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    issues = [];
                    return [4 /*yield*/, browser.newPage()];
                case 1:
                    page = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 5, 7]);
                    // Set HTML content
                    return [4 /*yield*/, page.setContent(html, { waitUntil: 'networkidle0' })];
                case 3:
                    // Set HTML content
                    _a.sent();
                    return [4 /*yield*/, page.evaluate(function () {
                            var inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])'));
                            return inputs
                                .filter(function (input) {
                                // Check if input has an id and there's a label with a matching 'for' attribute
                                var id = input.getAttribute('id');
                                if (id) {
                                    var label = document.querySelector("label[for=\"".concat(id, "\"]"));
                                    if (label)
                                        return false;
                                }
                                // Check if input is wrapped in a label
                                var parent = input.parentElement;
                                while (parent) {
                                    if (parent.tagName === 'LABEL')
                                        return false;
                                    parent = parent.parentElement;
                                }
                                return true;
                            })
                                .map(function (input) { return ({
                                type: input.getAttribute('type') || 'text',
                                name: input.getAttribute('name') || '',
                                id: input.getAttribute('id') || ''
                            }); });
                        })];
                case 4:
                    inputsWithoutLabels = _a.sent();
                    // Add issues for inputs without labels
                    inputsWithoutLabels.forEach(function (input) {
                        issues.push({
                            id: (0, uuid_1.v4)(),
                            category: SeoValidationCategory.ACCESSIBILITY,
                            severity: SeoValidationSeverity.ERROR,
                            title: 'Form input missing label',
                            description: "Input field (".concat(input.type, ") missing an associated label."),
                            impact: 'Users with screen readers will have difficulty understanding the purpose of the input field.',
                            recommendation: "Add a label element with a 'for' attribute matching the input's id, or wrap the input in a label element.",
                            element: "<input type=\"".concat(input.type, "\" ").concat(input.name ? "name=\"".concat(input.name, "\"") : '', " ").concat(input.id ? "id=\"".concat(input.id, "\"") : '', ">")
                        });
                    });
                    return [2 /*return*/, issues];
                case 5: return [4 /*yield*/, page.close()];
                case 6:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [2 /*return*/];
            }
        });
    });
}
// Calculate validation metrics
function calculateValidationMetrics(issues) {
    var metrics = {
        totalIssues: issues.length,
        errorCount: 0,
        warningCount: 0,
        infoCount: 0,
        issuesByCategory: {}
    };
    // Count issues by severity and category
    issues.forEach(function (issue) {
        // Count by severity
        if (issue.severity === SeoValidationSeverity.ERROR) {
            metrics.errorCount++;
        }
        else if (issue.severity === SeoValidationSeverity.WARNING) {
            metrics.warningCount++;
        }
        else if (issue.severity === SeoValidationSeverity.INFO) {
            metrics.infoCount++;
        }
        // Count by category
        if (!metrics.issuesByCategory[issue.category]) {
            metrics.issuesByCategory[issue.category] = 0;
        }
        metrics.issuesByCategory[issue.category]++;
    });
    return metrics;
}
// Calculate score from issues
function calculateScoreFromIssues(issues, metrics) {
    // Create a simplified score
    var score = {
        overall: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
        performance: 70,
        accessibility: 100 - (metrics.issuesByCategory[SeoValidationCategory.ACCESSIBILITY] * 10 || 0),
        bestPractices: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
        seo: 100 - (metrics.issuesByCategory[SeoValidationCategory.META_TAGS] * 10 || 0),
        mobileFriendly: 80,
        semanticStructure: 100 -
            ((metrics.issuesByCategory[SeoValidationCategory.SEMANTIC_HTML] || 0) * 10) -
            ((metrics.issuesByCategory[SeoValidationCategory.HEADING_STRUCTURE] || 0) * 10)
    };
    // Normalize scores to be between 0 and 100
    Object.keys(score).forEach(function (key) {
        score[key] = Math.max(0, Math.min(100, score[key]));
    });
    return score;
}
// Generate recommendations
function generateRecommendations(issues) {
    var recommendations = new Set();
    issues.forEach(function (issue) {
        if (issue.recommendation) {
            recommendations.add(issue.recommendation);
        }
    });
    return Array.from(recommendations);
}
function runTest() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, issues, semanticIssues, accessibilityIssues, metrics, score, recommendations, result, categories_1, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 8, , 9]);
                    console.log('Testing HTML validation...');
                    return [4 /*yield*/, puppeteer.launch({
                            headless: true,
                            args: ['--no-sandbox', '--disable-setuid-sandbox']
                        })];
                case 1:
                    browser = _a.sent();
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, , 5, 7]);
                    issues = [];
                    // Analyze semantic HTML structure
                    console.log('Analyzing semantic HTML structure...');
                    return [4 /*yield*/, analyzeSemanticHtml(sampleHtml)];
                case 3:
                    semanticIssues = _a.sent();
                    issues.push.apply(issues, semanticIssues);
                    // Analyze accessibility
                    console.log('Analyzing accessibility...');
                    return [4 /*yield*/, analyzeAccessibility(sampleHtml, browser)];
                case 4:
                    accessibilityIssues = _a.sent();
                    issues.push.apply(issues, accessibilityIssues);
                    // Calculate validation metrics
                    console.log('Calculating metrics...');
                    metrics = calculateValidationMetrics(issues);
                    // Calculate validation score
                    console.log('Calculating scores...');
                    score = calculateScoreFromIssues(issues, metrics);
                    // Generate recommendations
                    console.log('Generating recommendations...');
                    recommendations = generateRecommendations(issues);
                    result = {
                        id: (0, uuid_1.v4)(),
                        url: 'html-content',
                        contentType: 'webpage',
                        validatedAt: new Date().toISOString(),
                        score: score,
                        metrics: metrics,
                        issues: issues,
                        recommendations: recommendations,
                        validationParams: {
                            html: sampleHtml,
                            contentType: 'webpage',
                            validateAccessibility: true,
                            validateSemanticHtml: true,
                            validateHeadingStructure: true
                        }
                    };
                    // Output results
                    console.log('\nHTML Validation Result:');
                    console.log('Score:', result.score);
                    console.log('Issues found:', result.issues.length);
                    console.log('Issues by category:');
                    categories_1 = {};
                    result.issues.forEach(function (issue) {
                        categories_1[issue.category] = (categories_1[issue.category] || 0) + 1;
                    });
                    console.log(categories_1);
                    console.log('\nFirst 3 issues:');
                    console.log(result.issues.slice(0, 3).map(function (i) { return "".concat(i.title, ": ").concat(i.description); }));
                    console.log('\nRecommendations:');
                    console.log(result.recommendations.slice(0, 3));
                    return [3 /*break*/, 7];
                case 5: 
                // Always close browser
                return [4 /*yield*/, browser.close()];
                case 6:
                    // Always close browser
                    _a.sent();
                    return [7 /*endfinally*/];
                case 7: return [3 /*break*/, 9];
                case 8:
                    error_2 = _a.sent();
                    console.error('Test failed:', error_2);
                    return [3 /*break*/, 9];
                case 9: return [2 /*return*/];
            }
        });
    });
}
runTest();
