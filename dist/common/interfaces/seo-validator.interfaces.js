"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeoValidationCategory = exports.SeoValidationSeverity = void 0;
var SeoValidationSeverity;
(function (SeoValidationSeverity) {
    SeoValidationSeverity["ERROR"] = "error";
    SeoValidationSeverity["WARNING"] = "warning";
    SeoValidationSeverity["INFO"] = "info";
    SeoValidationSeverity["PASSED"] = "passed";
})(SeoValidationSeverity || (exports.SeoValidationSeverity = SeoValidationSeverity = {}));
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
})(SeoValidationCategory || (exports.SeoValidationCategory = SeoValidationCategory = {}));
//# sourceMappingURL=seo-validator.interfaces.js.map