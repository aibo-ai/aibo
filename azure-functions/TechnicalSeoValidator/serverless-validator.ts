import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import { v4 as uuidv4 } from 'uuid';

// Import interfaces
import {
  SeoValidationParams,
  SeoValidationResult,
  SeoValidationIssue,
  SeoValidationScore,
  SeoValidationMetrics,
  IssueSeverity,
  ContentType
} from './interfaces';

/**
 * Azure Function for Technical SEO Validation (Serverless Version)
 * This version doesn't use Puppeteer/Chrome and works in Azure Functions
 */
async function httpTrigger(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log('Technical SEO Validator (Serverless) function processing request');
  
  try {
    const requestBody = await request.json() as {
      url?: string;
      html?: string;
      contentType?: string;
      validateSemanticHtml?: boolean;
      validateAccessibility?: boolean;
      validateHeadingStructure?: boolean;
      validateMetaTags?: boolean;
      validateImages?: boolean;
      validateLinks?: boolean;
      validateMobileFriendly?: boolean;
      validatePageSpeed?: boolean;
      validateStructuredData?: boolean;
      validateSocialTags?: boolean;
    };
    
    const params: SeoValidationParams = {
      url: requestBody?.url,
      html: requestBody?.html,
      contentType: requestBody?.contentType as ContentType,
      validateSemanticHtml: requestBody?.validateSemanticHtml !== false,
      validateAccessibility: requestBody?.validateAccessibility !== false,
      validateHeadingStructure: requestBody?.validateHeadingStructure !== false,
      validateMetaTags: requestBody?.validateMetaTags !== false,
      validateImages: requestBody?.validateImages !== false,
      validateLinks: requestBody?.validateLinks !== false,
      validateMobileFriendly: requestBody?.validateMobileFriendly !== false,
      validatePageSpeed: requestBody?.validatePageSpeed !== false,
      validateStructuredData: requestBody?.validateStructuredData !== false,
      validateSocialTags: requestBody?.validateSocialTags !== false
    };
    
    if (!params.url && !params.html) {
      return { status: 400, jsonBody: { error: 'Either URL or HTML content is required' } };
    }
    
    let result: SeoValidationResult;
    
    if (params.html) {
      result = await validateHtmlServerless(params);
    } else {
      // For URL validation, we'll return a message that this requires the containerized version
      return { 
        status: 400, 
        jsonBody: { 
          error: 'URL validation requires the containerized version of the Technical SEO Validator. Please use the HTML validation endpoint instead.',
          message: 'The serverless version only supports direct HTML validation due to Azure Functions limitations.'
        } 
      };
    }
    
    return { status: 200, jsonBody: result };
  } catch (error) {
    context.error('Error in Technical SEO Validator (Serverless):', error);
    return { 
      status: 500, 
      jsonBody: { 
        error: `Technical SEO validation failed: ${error.message}`,
        note: 'This is the serverless version of the Technical SEO Validator which has limited functionality.'
      } 
    };
  }
}

/**
 * Validates HTML content using serverless analysis (no Puppeteer/Chrome)
 */
async function validateHtmlServerless(params: SeoValidationParams): Promise<SeoValidationResult> {
  const html = params.html;
  if (!html) throw new Error('HTML content is required');
  
  try {
    const issues: SeoValidationIssue[] = [];
    
    // Analyze semantic HTML structure
    const semanticIssues = await analyzeSemanticHtmlServerless(html);
    issues.push(...semanticIssues);
    
    // Calculate metrics and score
    const metrics = calculateValidationMetrics(issues);
    const score = calculateScoreFromIssues(issues, metrics);
    const recommendations = generateRecommendations(issues);
    
    return {
      id: uuidv4(),
      url: 'html-content',
      contentType: params.contentType,
      validatedAt: new Date().toISOString(),
      score,
      metrics,
      issues,
      recommendations,
      validationParams: params,
      note: 'Validation performed using serverless version (limited functionality)'
    };
  } catch (error) {
    console.error('Error validating HTML:', error);
    throw error;
  }
}

/**
 * Analyzes semantic HTML structure without using Puppeteer
 */
async function analyzeSemanticHtmlServerless(html: string): Promise<SeoValidationIssue[]> {
  const issues: SeoValidationIssue[] = [];
  
  try {
    // Parse HTML using unified/rehype
    const file = await unified()
      .use(rehypeParse, { fragment: false })
      .parse(html);
    
    // Extract all elements from the HTML AST
    const elements: any[] = [];
    const headings: any[] = [];
    let hasH1 = false;
    let hasTitle = false;
    let hasMetaDescription = false;
    let hasImgWithoutAlt = false;
    let hasInputWithoutLabel = false;
    
    // Simple traversal function to extract elements
    function traverse(node: any) {
      if (node.type === 'element') {
        elements.push(node);
        
        // Check for headings
        if (node.tagName?.match(/^h[1-6]$/i)) {
          headings.push(node);
          if (node.tagName.toLowerCase() === 'h1') {
            hasH1 = true;
          }
        }
        
        // Check for title
        if (node.tagName?.toLowerCase() === 'title') {
          hasTitle = true;
        }
        
        // Check for meta description
        if (node.tagName?.toLowerCase() === 'meta' && 
            node.properties?.name?.toLowerCase() === 'description') {
          hasMetaDescription = true;
        }
        
        // Check for images without alt text
        if (node.tagName?.toLowerCase() === 'img' && !node.properties?.alt) {
          hasImgWithoutAlt = true;
        }
        
        // Check for inputs without associated labels
        if (node.tagName?.toLowerCase() === 'input' && !node.properties?.id) {
          hasInputWithoutLabel = true;
        }
      }
      
      // Recursively traverse children
      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    }
    
    // Start traversal from the root
    traverse(file);
    
    // Check for missing H1
    if (!hasH1) {
      issues.push({
        id: uuidv4(),
        type: 'semantic-structure',
        message: 'Missing H1 heading',
        description: 'The page should have exactly one H1 heading as the main title',
        severity: 'high',
        element: '<h1>',
        recommendation: 'Add an H1 heading that clearly describes the page content'
      });
    }
    
    // Check for missing title
    if (!hasTitle) {
      issues.push({
        id: uuidv4(),
        type: 'meta-tags',
        message: 'Missing page title',
        description: 'Every page should have a descriptive title tag',
        severity: 'critical',
        element: '<title>',
        recommendation: 'Add a descriptive title tag to the page'
      });
    }
    
    // Check for missing meta description
    if (!hasMetaDescription) {
      issues.push({
        id: uuidv4(),
        type: 'meta-tags',
        message: 'Missing meta description',
        description: 'Every page should have a meta description that summarizes the content',
        severity: 'high',
        element: '<meta name="description">',
        recommendation: 'Add a meta description tag with a concise summary of the page content'
      });
    }
    
    // Check for images without alt text
    if (hasImgWithoutAlt) {
      issues.push({
        id: uuidv4(),
        type: 'accessibility',
        message: 'Images missing alt text',
        description: 'All images should have descriptive alt text for screen readers',
        severity: 'high',
        element: '<img>',
        recommendation: 'Add descriptive alt attributes to all images'
      });
    }
    
    // Check for inputs without labels
    if (hasInputWithoutLabel) {
      issues.push({
        id: uuidv4(),
        type: 'accessibility',
        message: 'Form inputs missing labels',
        description: 'All form inputs should have associated labels for accessibility',
        severity: 'high',
        element: '<input>',
        recommendation: 'Add labels with for attributes that match input IDs'
      });
    }
    
    // Check heading structure
    let previousHeadingLevel = 0;
    for (const heading of headings) {
      const level = parseInt(heading.tagName.substring(1), 10);
      
      // Check for skipped heading levels
      if (level > previousHeadingLevel + 1 && previousHeadingLevel > 0) {
        issues.push({
          id: uuidv4(),
          type: 'heading-structure',
          message: `Skipped heading level: H${previousHeadingLevel} to H${level}`,
          description: 'Heading levels should not be skipped for proper document structure',
          severity: 'medium',
          element: `<${heading.tagName}>`,
          recommendation: `Use H${previousHeadingLevel + 1} before using H${level}`
        });
      }
      
      previousHeadingLevel = level;
    }
    
    return issues;
  } catch (error) {
    console.error('Error analyzing semantic HTML:', error);
    return [];
  }
}

/**
 * Calculate validation metrics from issues
 */
function calculateValidationMetrics(issues: SeoValidationIssue[]): SeoValidationMetrics {
  const criticalIssues = issues.filter(issue => issue.severity === 'critical').length;
  const highIssues = issues.filter(issue => issue.severity === 'high').length;
  const mediumIssues = issues.filter(issue => issue.severity === 'medium').length;
  const lowIssues = issues.filter(issue => issue.severity === 'low').length;
  
  return {
    totalIssues: issues.length,
    criticalIssues,
    highIssues,
    mediumIssues,
    lowIssues,
    semanticStructureIssues: issues.filter(issue => issue.type === 'semantic-structure').length,
    accessibilityIssues: issues.filter(issue => issue.type === 'accessibility').length,
    metaTagIssues: issues.filter(issue => issue.type === 'meta-tags').length,
    headingStructureIssues: issues.filter(issue => issue.type === 'heading-structure').length,
    imageIssues: issues.filter(issue => issue.type === 'image').length,
    linkIssues: issues.filter(issue => issue.type === 'link').length,
    mobileFriendlyIssues: issues.filter(issue => issue.type === 'mobile-friendly').length,
    pageSpeedIssues: issues.filter(issue => issue.type === 'page-speed').length,
    structuredDataIssues: issues.filter(issue => issue.type === 'structured-data').length,
    socialTagIssues: issues.filter(issue => issue.type === 'social-tag').length
  };
}

/**
 * Calculate score from issues
 */
function calculateScoreFromIssues(issues: SeoValidationIssue[], metrics: SeoValidationMetrics): SeoValidationScore {
  // Base score starts at 100
  let overallScore = 100;
  let accessibilityScore = 100;
  let semanticStructureScore = 100;
  let mobileFriendlyScore = 100;
  
  // Deduct points based on issue severity
  for (const issue of issues) {
    let points = 0;
    
    switch (issue.severity) {
      case 'critical':
        points = 15;
        break;
      case 'high':
        points = 10;
        break;
      case 'medium':
        points = 5;
        break;
      case 'low':
        points = 2;
        break;
    }
    
    // Deduct from overall score
    overallScore = Math.max(0, overallScore - points);
    
    // Deduct from specific category scores
    if (issue.type === 'accessibility') {
      accessibilityScore = Math.max(0, accessibilityScore - points * 1.5);
    } else if (issue.type === 'semantic-structure' || issue.type === 'heading-structure') {
      semanticStructureScore = Math.max(0, semanticStructureScore - points * 1.5);
    } else if (issue.type === 'mobile-friendly') {
      mobileFriendlyScore = Math.max(0, mobileFriendlyScore - points * 1.5);
    }
  }
  
  return {
    overall: Math.round(overallScore),
    accessibility: Math.round(accessibilityScore),
    semanticStructure: Math.round(semanticStructureScore),
    mobileFriendly: Math.round(mobileFriendlyScore)
  };
}

/**
 * Generate recommendations from issues
 */
function generateRecommendations(issues: SeoValidationIssue[]): string[] {
  const recommendations: string[] = [];
  const recommendationMap = new Map<string, number>();
  
  // Group similar issues and count them
  for (const issue of issues) {
    if (issue.recommendation) {
      const count = recommendationMap.get(issue.recommendation) || 0;
      recommendationMap.set(issue.recommendation, count + 1);
    }
  }
  
  // Sort recommendations by severity and count
  const criticalIssues = issues.filter(issue => issue.severity === 'critical');
  const highIssues = issues.filter(issue => issue.severity === 'high');
  const mediumIssues = issues.filter(issue => issue.severity === 'medium');
  
  // Add recommendations for critical issues first
  for (const issue of criticalIssues) {
    if (issue.recommendation && !recommendations.includes(issue.recommendation)) {
      recommendations.push(issue.recommendation);
    }
  }
  
  // Add recommendations for high-severity issues
  for (const issue of highIssues) {
    if (issue.recommendation && !recommendations.includes(issue.recommendation)) {
      recommendations.push(issue.recommendation);
    }
  }
  
  // Add recommendations for medium-severity issues
  for (const issue of mediumIssues) {
    if (issue.recommendation && !recommendations.includes(issue.recommendation)) {
      recommendations.push(issue.recommendation);
    }
  }
  
  // Add general recommendations based on issue types
  if (issues.some(issue => issue.type === 'meta-tags')) {
    recommendations.push('Improve meta tags for better search engine visibility');
  }
  
  if (issues.some(issue => issue.type === 'accessibility')) {
    recommendations.push('Enhance accessibility to ensure content is available to all users');
  }
  
  if (issues.some(issue => issue.type === 'semantic-structure')) {
    recommendations.push('Improve semantic HTML structure for better SEO and accessibility');
  }
  
  // Limit to top 10 recommendations
  return recommendations.slice(0, 10);
}

// Register the Azure Function with the app
app.http('serverlessSeoValidator', {
  methods: ['POST'],
  authLevel: 'function',
  route: 'validate-serverless',
  handler: httpTrigger
});

export default httpTrigger;
