"use strict";
/**
 * Technical SEO validation interfaces
 */
exports.__esModule = true;
exports.SeoValidationCategory = exports.SeoValidationSeverity = void 0;
/**
 * SEO validation severity levels
 */
var SeoValidationSeverity;
(function (SeoValidationSeverity) {
    SeoValidationSeverity["ERROR"] = "error";
    SeoValidationSeverity["WARNING"] = "warning";
    SeoValidationSeverity["INFO"] = "info";
    SeoValidationSeverity["PASSED"] = "passed";
})(SeoValidationSeverity = exports.SeoValidationSeverity || (exports.SeoValidationSeverity = {}));
/**
 * SEO validation categories
 */
var SeoValidationCategory;
(function (SeoValidationCategory) {
    SeoValidationCategory["MOBILE_FRIENDLY"] = "mobile_friendly";
    SeoValidationCategory["ACCESSIBILITY"] = "accessibility";
    SeoValidationCategory["PERFORMANCE"] = "performance";
    SeoValidationCategory["HEADING_STRUCTURE"] = "heading_structure";
    SeoValidationCategory["SEMANTIC_HTML"] = "semantic_html";
    SeoValidationCategory["CRAWLER_ACCESSIBILITY"] = "crawler_accessibility";
    SeoValidationCategory["META_TAGS"] = "meta_tags";
    SeoValidationCategory["STRUCTURED_DATA"] = "structured_data";
    SeoValidationCategory["CONTENT_QUALITY"] = "content_quality";
    SeoValidationCategory["LINKS"] = "links";
    SeoValidationCategory["IMAGES"] = "images";
})(SeoValidationCategory = exports.SeoValidationCategory || (exports.SeoValidationCategory = {}));
