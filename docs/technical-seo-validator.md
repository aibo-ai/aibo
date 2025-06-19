# Technical SEO Validator

## Overview

The Technical SEO Validator is a component of the Content Architect system that ensures content meets technical SEO requirements. It validates various aspects of content including mobile-friendliness, accessibility, heading structure, HTML semantics, and crawler accessibility.

## Features

- **Mobile-Friendliness Validation**: Ensures content is optimized for mobile devices
- **Accessibility Validation**: Checks for WCAG compliance using axe-core
- **Heading Structure Analysis**: Validates proper H1-H6 hierarchy
- **Semantic HTML Validation**: Ensures proper use of semantic HTML elements
- **Crawler Accessibility**: Verifies content is accessible to search engine bots
- **Performance Analysis**: Measures page load performance metrics
- **Structured Data Validation**: Checks for proper implementation of schema.org markup
- **Meta Tags Validation**: Ensures proper meta tags are in place

## Architecture

The Technical SEO Validator consists of the following components:

1. **Core Service**: `TechnicalSeoValidatorService` - Orchestrates the validation process
2. **Semantic HTML Analyzer**: `SemanticHtmlAnalyzerService` - Analyzes HTML for semantic structure
3. **Accessibility Validator**: `AccessibilityValidatorService` - Validates accessibility using axe-core
4. **Azure Function**: `TechnicalSeoValidator` - Runs Lighthouse analysis in a serverless environment

## Tech Stack

- **Validation Engine**: Lighthouse API with Azure Functions
- **Semantic Analysis**: Unified.js + Azure App Services
- **Accessibility**: Axe-core library
- **HTML Parsing**: rehype-parse
- **Browser Automation**: Puppeteer

## API Usage

### Validate Content

```typescript
// Inject the service
constructor(private seoValidator: TechnicalSeoValidatorService) {}

// Validate a URL
const result = await this.seoValidator.validateContent({
  url: 'https://example.com',
  validateMobileFriendliness: true,
  validateAccessibility: true,
  validateHeadingStructure: true,
  validateSemanticHtml: true,
  validateCrawlerAccessibility: true
});

// Validate HTML content
const result = await this.seoValidator.validateContent({
  html: '<html>...</html>',
  contentType: 'article',
  validateAccessibility: true,
  validateHeadingStructure: true,
  validateSemanticHtml: true
});
```

### REST API

```
POST /api/seo-validator/validate
```

Request body:
```json
{
  "url": "https://example.com",
  "validateMobileFriendliness": true,
  "validateAccessibility": true,
  "validateHeadingStructure": true,
  "validateSemanticHtml": true,
  "validateCrawlerAccessibility": true
}
```

Response:
```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "url": "https://example.com",
    "validatedAt": "2025-06-18T03:41:27.142Z",
    "score": {
      "overall": 85,
      "performance": 90,
      "accessibility": 80,
      "bestPractices": 85,
      "seo": 95,
      "mobileFriendly": 90,
      "semanticStructure": 75
    },
    "metrics": {
      "totalIssues": 5,
      "errorCount": 1,
      "warningCount": 3,
      "infoCount": 1,
      "passedCount": 20,
      "issuesByCategory": {
        "mobile_friendly": 0,
        "accessibility": 2,
        "performance": 0,
        "heading_structure": 1,
        "semantic_html": 2,
        "crawler_accessibility": 0,
        "meta_tags": 0,
        "structured_data": 0,
        "content_quality": 0,
        "links": 0,
        "images": 0
      }
    },
    "issues": [
      {
        "id": "123e4567-e89b-12d3-a456-426614174001",
        "category": "accessibility",
        "severity": "error",
        "title": "Images must have alternate text",
        "description": "Images must have an alt attribute",
        "impact": "Screen readers cannot interpret images without alt text",
        "recommendation": "Add alt text to all images",
        "element": "<img src=\"example.jpg\">"
      }
    ],
    "recommendations": [
      "Add alt text to all images",
      "Implement proper heading structure with a single H1",
      "Use semantic HTML elements for better accessibility"
    ],
    "validationParams": {
      "url": "https://example.com",
      "validateMobileFriendliness": true,
      "validateAccessibility": true,
      "validateHeadingStructure": true,
      "validateSemanticHtml": true,
      "validateCrawlerAccessibility": true
    }
  }
}
```

## Installation

### Dependencies

Add the following dependencies to your project:

```bash
npm install lighthouse chrome-launcher puppeteer axe-core unified rehype-parse unist-util-visit
```

### Azure Function Setup

1. Deploy the TechnicalSeoValidator Azure Function
2. Configure the environment variables:
   - `SEO_VALIDATOR_FUNCTION_URL`: URL of the deployed Azure Function
   - `LIGHTHOUSE_API_URL`: URL of the Lighthouse API (optional)

## Integration with Content Architect

The Technical SEO Validator integrates with the Content Architect system to provide SEO validation as part of the content creation and optimization pipeline. It can be used to:

1. Validate content before publishing
2. Provide SEO recommendations to content creators
3. Monitor SEO health of published content
4. Generate SEO reports for content audits

## Future Enhancements

- Integration with Twitter/X API for social media preview validation
- AI-powered recommendations for SEO improvements
- Competitive analysis of similar content
- Historical tracking of SEO metrics
- Custom validation rules for specific content types
