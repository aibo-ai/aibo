import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import * as puppeteer from 'puppeteer';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import { visit } from 'unist-util-visit';
import { v4 as uuidv4 } from 'uuid';
import * as axeCore from 'axe-core';

// Define Lighthouse types
interface Flags {
  logLevel?: 'info' | 'silent' | 'error' | 'warn' | 'verbose';
  output?: 'json' | 'html' | 'csv' | ('json' | 'html' | 'csv')[];
  port?: number;
  onlyCategories?: string[];
  [key: string]: any;
}

// Import interfaces
import {
  SeoValidationParams,
  SeoValidationResult,
  SeoValidationIssue,
  SeoValidationScore,
  SeoValidationMetrics,
  SeoValidationSeverity,
  SeoValidationCategory,
  LighthouseResult,
  LighthouseAuditResult
} from '../../src/common/interfaces/seo-validator.interfaces';

/**
 * Azure Function for Technical SEO Validation
 */
async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Technical SEO Validator function processing request');

  try {
    // Parse request body
    const requestBody = await request.json() as {
      url?: string;
      html?: string;
      contentType?: string;
      validateMobileFriendliness?: boolean;
      validateAccessibility?: boolean;
      validateHeadingStructure?: boolean;
      validateSemanticHtml?: boolean;
      validateCrawlerAccessibility?: boolean;
      validateStructuredData?: boolean;
      validateMetaTags?: boolean;
      validatePerformance?: boolean;
      validateContentQuality?: boolean;
    };
    
    // Get parameters from request
    const params: SeoValidationParams = {
      url: requestBody?.url,
      html: requestBody?.html,
      contentType: requestBody?.contentType as any, // Type assertion to handle ContentType enum
      validateMobileFriendliness: requestBody?.validateMobileFriendliness !== false,
      validateAccessibility: requestBody?.validateAccessibility !== false,
      validateHeadingStructure: requestBody?.validateHeadingStructure !== false,
      validateSemanticHtml: requestBody?.validateSemanticHtml !== false,
      validateCrawlerAccessibility: requestBody?.validateCrawlerAccessibility !== false,
      validateStructuredData: requestBody?.validateStructuredData !== false,
      validateMetaTags: requestBody?.validateMetaTags !== false,
      validatePerformance: requestBody?.validatePerformance !== false,
      validateContentQuality: requestBody?.validateContentQuality !== false
    };

    // Validate parameters
    if (!params.url && !params.html) {
      return {
        status: 400,
        jsonBody: { error: 'Either URL or HTML content is required' }
      };
    }

    // Perform validation
    let result: SeoValidationResult;
    if (params.url) {
      result = await validateUrl(params);
    } else {
      result = await validateHtml(params);
    }

    // Return result
    return {
      status: 200,
      jsonBody: result
    };
  } catch (error) {
    context.error('Error in Technical SEO Validator:', error);
    return {
      status: 500,
      jsonBody: { error: `Technical SEO validation failed: ${error.message}` }
    };
  }
};

/**
 * Validates a URL using Lighthouse and other tools
 * @param params Validation parameters
 * @returns Validation result
 */
async function validateUrl(params: SeoValidationParams): Promise<SeoValidationResult> {
  // Launch Chrome
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox'] });
  
  try {
    // Run Lighthouse
    const options: Flags = {
      logLevel: 'info',
      output: 'json' as 'json',
      port: chrome.port,
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo']
    };
    
    const runnerResult = await lighthouse(params.url as string, options);
    if (!runnerResult || !runnerResult.lhr) {
      throw new Error('Lighthouse failed to generate results');
    }
    
    const lighthouseResult = runnerResult.lhr as unknown as LighthouseResult;
    
    // Extract validation issues
    const issues = extractValidationIssues(lighthouseResult, params);
    
    // Calculate validation score
    const score = calculateValidationScore(lighthouseResult);
    
    // Calculate validation metrics
    const metrics = calculateValidationMetrics(issues);
    
    // Generate recommendations
    const recommendations = generateRecommendations(issues);
    
    // Return validation result
    return {
      id: uuidv4(),
      url: params.url,
      validatedAt: new Date().toISOString(),
      contentType: params.contentType,
      score,
      metrics,
      issues,
      recommendations,
      validationParams: params
    };
  } finally {
    // Close Chrome
    await chrome.kill();
  }
}

/**
 * Extracts validation issues from Lighthouse result
 */
function extractValidationIssues(lighthouseResult: LighthouseResult, params: SeoValidationParams): SeoValidationIssue[] {
  const issues: SeoValidationIssue[] = [];

  // Process audits
  Object.entries(lighthouseResult.audits).forEach(([id, audit]) => {
    // Skip passed audits
    if (audit.score === 1) return;

    // Determine category and severity
    let category: SeoValidationCategory;
    let severity: SeoValidationSeverity;

    // Map audit to category
    if (id.includes('accessibility')) {
      category = SeoValidationCategory.ACCESSIBILITY;
    } else if (id.includes('seo')) {
      category = SeoValidationCategory.META_TAGS;
    } else if (id.includes('best-practices')) {
      category = SeoValidationCategory.SEMANTIC_HTML;
    } else if (id.includes('performance')) {
      category = SeoValidationCategory.PERFORMANCE;
    } else if (id.includes('viewport') || id.includes('content-width')) {
      category = SeoValidationCategory.MOBILE_FRIENDLY;
    } else {
      category = SeoValidationCategory.CONTENT_QUALITY;
    }

    // Map score to severity
    if (audit.score === null || audit.score < 0.5) {
      severity = SeoValidationSeverity.ERROR;
    } else if (audit.score < 0.9) {
      severity = SeoValidationSeverity.WARNING;
    } else {
      severity = SeoValidationSeverity.INFO;
    }

    // Create issue
    const issue: SeoValidationIssue = {
      id: uuidv4(),
      category,
      severity,
      title: (audit as any).title || id,
      description: audit.description || '',
      impact: `Score: ${audit.score !== null ? Math.round(audit.score * 100) : 'N/A'}%`,
      recommendation: audit.description || 'Fix this issue to improve SEO'
    };

    issues.push(issue);
  });

  return issues;
}

/**
 * Calculates validation score from Lighthouse result
 */
function calculateValidationScore(lighthouseResult: LighthouseResult): SeoValidationScore {
  return {
    overall: calculateOverallScore(lighthouseResult),
    performance: lighthouseResult.categories.performance?.score * 100 || 0,
    accessibility: lighthouseResult.categories.accessibility?.score * 100 || 0,
    bestPractices: lighthouseResult.categories['best-practices']?.score * 100 || 0,
    seo: lighthouseResult.categories.seo?.score * 100 || 0,
    mobileFriendly: estimateMobileFriendlyScore(lighthouseResult),
    semanticStructure: estimateSemanticStructureScore(lighthouseResult)
  };
}

/**
 * Calculates overall score from Lighthouse result
 */
function calculateOverallScore(lighthouseResult: LighthouseResult): number {
  const scores = [
    lighthouseResult.categories.performance?.score || 0,
    lighthouseResult.categories.accessibility?.score || 0,
    lighthouseResult.categories['best-practices']?.score || 0,
    lighthouseResult.categories.seo?.score || 0
  ];

  const sum = scores.reduce((total, score) => total + score, 0);
  return (sum / scores.length) * 100;
}

/**
 * Estimates mobile-friendly score from Lighthouse result
 */
function estimateMobileFriendlyScore(lighthouseResult: LighthouseResult): number {
  // Use relevant audits to estimate mobile-friendliness
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

/**
 * Estimates semantic structure score from Lighthouse result
 */
function estimateSemanticStructureScore(lighthouseResult: LighthouseResult): number {
  // Use relevant audits to estimate semantic structure quality
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

/**
 * Calculates validation metrics from issues
 */
function calculateValidationMetrics(issues: SeoValidationIssue[]): SeoValidationMetrics {
  // Initialize metrics
  const metrics: SeoValidationMetrics = {
    totalIssues: issues.length,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    passedCount: 0,
    issuesByCategory: {
      [SeoValidationCategory.MOBILE_FRIENDLY]: 0,
      [SeoValidationCategory.ACCESSIBILITY]: 0,
      [SeoValidationCategory.PERFORMANCE]: 0,
      [SeoValidationCategory.HEADING_STRUCTURE]: 0,
      [SeoValidationCategory.SEMANTIC_HTML]: 0,
      [SeoValidationCategory.CRAWLER_ACCESSIBILITY]: 0,
      [SeoValidationCategory.META_TAGS]: 0,
      [SeoValidationCategory.STRUCTURED_DATA]: 0,
      [SeoValidationCategory.CONTENT_QUALITY]: 0,
      [SeoValidationCategory.LINKS]: 0,
      [SeoValidationCategory.IMAGES]: 0
    }
  };

  // Count issues by severity and category
  issues.forEach(issue => {
    // Count by severity
    if (issue.severity === SeoValidationSeverity.ERROR) {
      metrics.errorCount++;
    } else if (issue.severity === SeoValidationSeverity.WARNING) {
      metrics.warningCount++;
    } else if (issue.severity === SeoValidationSeverity.INFO) {
      metrics.infoCount++;
    } else if (issue.severity === SeoValidationSeverity.PASSED) {
      metrics.passedCount++;
    }

    // Count by category
    metrics.issuesByCategory[issue.category]++;
  });

  return metrics;
}

/**
 * Generates recommendations from issues
 */
function generateRecommendations(issues: SeoValidationIssue[]): string[] {
  // Group issues by category
  const issuesByCategory = issues.reduce((acc, issue) => {
    if (!acc[issue.category]) {
      acc[issue.category] = [];
    }
    acc[issue.category].push(issue);
    return acc;
  }, {} as Record<SeoValidationCategory, SeoValidationIssue[]>);

  // Generate recommendations for each category
  const recommendations: string[] = [];

  // Mobile-friendliness recommendations
  if (issuesByCategory[SeoValidationCategory.MOBILE_FRIENDLY]?.length > 0) {
    recommendations.push('Improve mobile-friendliness by implementing responsive design and proper viewport configuration');
  }

  // Accessibility recommendations
  if (issuesByCategory[SeoValidationCategory.ACCESSIBILITY]?.length > 0) {
    recommendations.push('Enhance accessibility by adding proper ARIA attributes and ensuring keyboard navigation');
  }

  // Heading structure recommendations
  if (issuesByCategory[SeoValidationCategory.HEADING_STRUCTURE]?.length > 0) {
    recommendations.push('Implement proper heading structure with a single H1 and logical hierarchy of H2-H6 elements');
  }

  // Semantic HTML recommendations
  if (issuesByCategory[SeoValidationCategory.SEMANTIC_HTML]?.length > 0) {
    recommendations.push('Use semantic HTML elements like article, section, nav, and header for better SEO and accessibility');
  }

  // Meta tags recommendations
  if (issuesByCategory[SeoValidationCategory.META_TAGS]?.length > 0) {
    recommendations.push('Add proper meta tags including title, description, and Open Graph properties');
  }

  // Performance recommendations
  if (issuesByCategory[SeoValidationCategory.PERFORMANCE]?.length > 0) {
    recommendations.push('Optimize performance by minimizing render-blocking resources and optimizing images');
  }

  // Add general recommendations if needed
  if (recommendations.length === 0) {
    recommendations.push('Continue following SEO best practices to maintain good search visibility');
  }

  return recommendations;
}

/**
 * Validates HTML content using local analysis
 * @param params Validation parameters
 * @returns Validation result
 */
async function validateHtml(params: SeoValidationParams): Promise<SeoValidationResult> {
  const html = params.html;
  
  if (!html) {
    throw new Error('HTML content is required');
  }
  
  // Initialize browser for accessibility testing
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    // Collect issues from different validators
    const issues: SeoValidationIssue[] = [];
    
    // Analyze semantic HTML structure
    if (params.validateSemanticHtml !== false || params.validateHeadingStructure !== false) {
      const semanticIssues = await analyzeSemanticHtml(html);
      issues.push(...semanticIssues);
    }
    
    // Analyze accessibility
    if (params.validateAccessibility !== false) {
      const accessibilityIssues = await analyzeAccessibility(html, browser);
      issues.push(...accessibilityIssues);
    }
    
    // Calculate metrics
    const metrics = calculateValidationMetrics(issues);
    
    // Create a simplified score since we don't have Lighthouse data
    const score = calculateScoreFromIssues(issues, metrics);
    
    // Generate recommendations
    const recommendations = generateRecommendations(issues);
    
    // Create validation result
    return {
      id: uuidv4(),
      url: 'html-content',
      contentType: params.contentType,
      validatedAt: new Date().toISOString(),
      score,
      metrics,
      issues,
      recommendations,
      validationParams: params
    };
  } finally {
    // Close browser
    await browser.close();
  }
}

/**
 * Calculates validation score from issues
 * @param issues List of validation issues
 * @param metrics Validation metrics
 * @returns Validation score
 */
function calculateScoreFromIssues(issues: SeoValidationIssue[], metrics: SeoValidationMetrics): SeoValidationScore {
  // Create a simplified score since we don't have Lighthouse data for HTML content
  const score: SeoValidationScore = {
    overall: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
    performance: 0, // Can't measure without rendering
    accessibility: 100 - (metrics.issuesByCategory[SeoValidationCategory.ACCESSIBILITY] * 10),
    bestPractices: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
    seo: 100 - (metrics.issuesByCategory[SeoValidationCategory.META_TAGS] * 10),
    mobileFriendly: 0, // Can't measure without rendering
    semanticStructure: 100 - (metrics.issuesByCategory[SeoValidationCategory.SEMANTIC_HTML] * 10) - 
                      (metrics.issuesByCategory[SeoValidationCategory.HEADING_STRUCTURE] * 10)
  };
  
  // Normalize scores to be between 0 and 100
  Object.keys(score).forEach(key => {
    score[key as keyof SeoValidationScore] = Math.max(0, Math.min(100, score[key as keyof SeoValidationScore]));
  });
  
  return score;
}

/**
 * Analyzes semantic HTML structure
 */
async function analyzeSemanticHtml(html: string): Promise<SeoValidationIssue[]> {
  const issues: SeoValidationIssue[] = [];
  
  try {
    // Parse HTML
    const ast = await unified()
      .use(rehypeParse, { fragment: false })
      .parse(html);
    
    // Check heading structure
    const headings: { tag: string; level: number; text: string }[] = [];
    
    // Find all heading elements
    visit(ast, 'element', (node) => {
      if (node.tagName?.match(/^h[1-6]$/)) {
        const level = parseInt(node.tagName.substring(1), 10);
        let text = '';
        
        // Extract text content
        visit(node, 'text', (textNode) => {
          text += textNode.value;
        });
        
        headings.push({ tag: node.tagName, level, text });
      }
    });
    
    // Check if there's an H1
    if (!headings.some(h => h.level === 1)) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.HEADING_STRUCTURE,
        severity: SeoValidationSeverity.ERROR,
        title: 'Missing H1 heading',
        description: 'The page does not have an H1 heading, which is essential for SEO.',
        impact: 'Search engines use H1 headings to understand the main topic of the page.',
        recommendation: 'Add an H1 heading that clearly describes the main topic of the page.'
      });
    }
    
    // Check if there are multiple H1s
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count > 1) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.HEADING_STRUCTURE,
        severity: SeoValidationSeverity.WARNING,
        title: 'Multiple H1 headings',
        description: `The page has ${h1Count} H1 headings. It's recommended to have only one H1 per page.`,
        impact: 'Multiple H1s can confuse search engines about the main topic of the page.',
        recommendation: 'Keep only one H1 heading that represents the main topic of the page.'
      });
    }
    
    // Check for images without alt text
    visit(ast, 'element', (node) => {
      if (node.tagName === 'img') {
        const altAttr = node.properties?.alt;
        if (!altAttr && altAttr !== '') {
          let src = node.properties?.src || 'unknown';
          if (typeof src === 'object') {
            src = JSON.stringify(src);
          }
          
          issues.push({
            id: uuidv4(),
            category: SeoValidationCategory.ACCESSIBILITY,
            severity: SeoValidationSeverity.ERROR,
            title: 'Image missing alt text',
            description: `Image without alt text: ${src}`,
            impact: 'Images without alt text are not accessible to screen readers and don\'t contribute to SEO.',
            recommendation: 'Add descriptive alt text to all images.',
            element: `<img src="${src}">`
          });
        }
      }
    });
    
    // Check for semantic elements
    const semanticElements = ['header', 'footer', 'main', 'article', 'section', 'nav', 'aside'];
    const foundElements: Record<string, boolean> = {};
    
    semanticElements.forEach(element => {
      foundElements[element] = false;
    });
    
    visit(ast, 'element', (node) => {
      if (semanticElements.includes(node.tagName)) {
        foundElements[node.tagName] = true;
      }
    });
    
    // Check for missing semantic elements
    const missingElements = semanticElements.filter(element => !foundElements[element]);
    if (missingElements.length > 0) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.SEMANTIC_HTML,
        severity: SeoValidationSeverity.INFO,
        title: 'Missing semantic HTML elements',
        description: `The page is missing the following semantic elements: ${missingElements.join(', ')}`,
        impact: 'Semantic HTML elements help search engines understand the structure and content of your page.',
        recommendation: `Consider using semantic HTML elements like ${missingElements.join(', ')} to improve SEO and accessibility.`
      });
    }
    
    return issues;
  } catch (error) {
    console.error('Error analyzing semantic HTML:', error);
    return [];
  }
}

/**
 * Analyzes accessibility using Puppeteer and axe-core
 * @param html HTML content
 * @param browser Puppeteer browser instance
 * @returns Accessibility issues
 */
async function analyzeAccessibility(html: string, browser: puppeteer.Browser): Promise<SeoValidationIssue[]> {
  const issues: SeoValidationIssue[] = [];
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Set HTML content
    await page.setContent(html);
    
    // Check for form inputs without labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select'));
      return inputs.filter(input => {
        const inputId = input.getAttribute('id');
        if (!inputId) return true; // No ID means no label can be associated
        
        // Check if there's a label with a matching 'for' attribute
        const label = document.querySelector(`label[for="${inputId}"]`);
        return !label;
      }).length;
    });
    
    if (inputsWithoutLabels > 0) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.ACCESSIBILITY,
        severity: SeoValidationSeverity.WARNING,
        title: 'Form inputs without labels',
        description: `Found ${inputsWithoutLabels} form inputs without associated labels`,
        impact: 'Form inputs without labels are not accessible to screen readers.',
        recommendation: 'Add labels with matching "for" attributes to all form inputs.'
      });
    }
    
    // Check for links without text
    const emptyLinks = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      return links.filter(link => {
        const text = link.textContent?.trim();
        const ariaLabel = link.getAttribute('aria-label');
        const hasImage = link.querySelector('img') !== null;
        
        return (!text || text === '') && !ariaLabel && !hasImage;
      }).length;
    });
    
    if (emptyLinks > 0) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.ACCESSIBILITY,
        severity: SeoValidationSeverity.ERROR,
        title: 'Empty links',
        description: `Found ${emptyLinks} links without text content`,
        impact: 'Links without text are not accessible to screen readers and provide no context for users.',
        recommendation: 'Add descriptive text to all links or use aria-label attributes.'
      });
    }
    
    // In a production environment, we would use axe-core for more comprehensive checks
    // This would require injecting the axe-core script and running it
    // Example implementation:
    /*
    await page.addScriptTag({
      path: require.resolve('axe-core')
    });
    
    const axeResults = await page.evaluate(() => {
      return (window as any).axe.run();
    });
    
    if (axeResults && axeResults.violations) {
      for (const violation of axeResults.violations) {
        issues.push({
          id: uuidv4(),
          category: SeoValidationCategory.ACCESSIBILITY,
          severity: violation.impact === 'critical' || violation.impact === 'serious' 
            ? SeoValidationSeverity.ERROR 
            : SeoValidationSeverity.WARNING,
          title: violation.help,
          description: violation.description,
          impact: `Impact: ${violation.impact}`,
          recommendation: violation.helpUrl
        });
      }
    }
    */
    
    return issues;
  } catch (error) {
    console.error('Error analyzing accessibility:', error);
    return [];
  } finally {
    // Ensure page is closed
    await page.close();
  }
}

// Register the Azure Function with the app
app.http('technicalSeoValidator', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'validate', // Add a simpler route
  handler: httpTrigger
});

// Export functions for containerized deployment
export { validateUrl, validateHtml };

export default httpTrigger;
