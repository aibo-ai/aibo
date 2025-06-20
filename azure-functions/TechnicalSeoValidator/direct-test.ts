import { SeoValidationParams, SeoValidationResult } from '../../src/common/interfaces/seo-validator.interfaces';
import * as puppeteer from 'puppeteer';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import { visit } from 'unist-util-visit';
import { v4 as uuidv4 } from 'uuid';

// We'll need to implement a simplified version of validateHtml since we can't import it directly

// Sample HTML content for testing
const sampleHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Page</title>
  <meta name="description" content="Test page for SEO validation">
</head>
<body>
  <!-- Missing H1 tag -->
  <h2>This is a secondary heading</h2>
  
  <!-- Missing alt text -->
  <img src="test.jpg">
  
  <!-- Empty link -->
  <a href="#">Click here</a>
  
  <!-- Form without labels -->
  <form>
    <input type="text" placeholder="Name">
    <input type="email" placeholder="Email">
    <button type="submit">Submit</button>
  </form>
  
  <p>This is a test paragraph.</p>
</body>
</html>
`;

// Simplified implementation of the validator functions for testing purposes

// SeoValidationCategory enum (simplified version)
enum SeoValidationCategory {
  ACCESSIBILITY = 'accessibility',
  SEMANTIC_HTML = 'semantic_html',
  HEADING_STRUCTURE = 'heading_structure',
  META_TAGS = 'meta_tags',
  MOBILE_FRIENDLY = 'mobile_friendly',
  PERFORMANCE = 'performance',
  BEST_PRACTICES = 'best_practices'
}

// SeoValidationSeverity enum (simplified version)
enum SeoValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info'
}

// Analyze semantic HTML structure
async function analyzeSemanticHtml(html: string): Promise<any[]> {
  const issues: any[] = [];
  
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
        visit(node, 'text', (textNode: any) => {
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
    
    return issues;
  } catch (error) {
    console.error('Error analyzing semantic HTML:', error);
    return [];
  }
}

// Analyze accessibility using Puppeteer
async function analyzeAccessibility(html: string, browser: puppeteer.Browser): Promise<any[]> {
  const issues: any[] = [];
  
  // Create a new page
  const page = await browser.newPage();
  
  try {
    // Set HTML content
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Check for form inputs without labels
    const inputsWithoutLabels = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input:not([type="hidden"])')); 
      return inputs
        .filter(input => {
          // Check if input has an id and there's a label with a matching 'for' attribute
          const id = input.getAttribute('id');
          if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return false;
          }
          
          // Check if input is wrapped in a label
          let parent = input.parentElement;
          while (parent) {
            if (parent.tagName === 'LABEL') return false;
            parent = parent.parentElement;
          }
          
          return true;
        })
        .map(input => ({
          type: input.getAttribute('type') || 'text',
          name: input.getAttribute('name') || '',
          id: input.getAttribute('id') || ''
        }));
    });
    
    // Add issues for inputs without labels
    inputsWithoutLabels.forEach(input => {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.ACCESSIBILITY,
        severity: SeoValidationSeverity.ERROR,
        title: 'Form input missing label',
        description: `Input field (${input.type}) missing an associated label.`,
        impact: 'Users with screen readers will have difficulty understanding the purpose of the input field.',
        recommendation: `Add a label element with a 'for' attribute matching the input's id, or wrap the input in a label element.`,
        element: `<input type="${input.type}" ${input.name ? `name="${input.name}"` : ''} ${input.id ? `id="${input.id}"` : ''}>`
      });
    });
    
    return issues;
  } finally {
    await page.close();
  }
}

// Define metric types
interface ValidationMetrics {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  issuesByCategory: Record<string, number>;
}

// Calculate validation metrics
function calculateValidationMetrics(issues: any[]): ValidationMetrics {
  const metrics: ValidationMetrics = {
    totalIssues: issues.length,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    issuesByCategory: {}
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
    }
    
    // Count by category
    if (!metrics.issuesByCategory[issue.category]) {
      metrics.issuesByCategory[issue.category] = 0;
    }
    metrics.issuesByCategory[issue.category]++;
  });
  
  return metrics;
}

// Define score type
interface ValidationScore {
  overall: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  mobileFriendly: number;
  semanticStructure: number;
  [key: string]: number; // Index signature for dynamic access
}

// Calculate score from issues
function calculateScoreFromIssues(issues: any[], metrics: ValidationMetrics): ValidationScore {
  // Create a simplified score
  const score: ValidationScore = {
    overall: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
    performance: 70, // Default value for HTML content
    accessibility: 100 - (metrics.issuesByCategory[SeoValidationCategory.ACCESSIBILITY] * 10 || 0),
    bestPractices: 100 - (metrics.errorCount * 10) - (metrics.warningCount * 5),
    seo: 100 - (metrics.issuesByCategory[SeoValidationCategory.META_TAGS] * 10 || 0),
    mobileFriendly: 80, // Default value for HTML content
    semanticStructure: 100 - 
      ((metrics.issuesByCategory[SeoValidationCategory.SEMANTIC_HTML] || 0) * 10) - 
      ((metrics.issuesByCategory[SeoValidationCategory.HEADING_STRUCTURE] || 0) * 10)
  };
  
  // Normalize scores to be between 0 and 100
  Object.keys(score).forEach(key => {
    score[key] = Math.max(0, Math.min(100, score[key]));
  });
  
  return score;
}

// Generate recommendations
function generateRecommendations(issues: any[]): string[] {
  const recommendations = new Set<string>();
  
  issues.forEach(issue => {
    if (issue.recommendation) {
      recommendations.add(issue.recommendation);
    }
  });
  
  return Array.from(recommendations);
}

async function runTest() {
  try {
    console.log('Testing HTML validation...');
    
    // Initialize browser for accessibility testing
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      // Collect issues from different validators
      const issues = [];
      
      // Analyze semantic HTML structure
      console.log('Analyzing semantic HTML structure...');
      const semanticIssues = await analyzeSemanticHtml(sampleHtml);
      issues.push(...semanticIssues);
      
      // Analyze accessibility
      console.log('Analyzing accessibility...');
      const accessibilityIssues = await analyzeAccessibility(sampleHtml, browser);
      issues.push(...accessibilityIssues);
      
      // Calculate validation metrics
      console.log('Calculating metrics...');
      const metrics = calculateValidationMetrics(issues);
      
      // Calculate validation score
      console.log('Calculating scores...');
      const score = calculateScoreFromIssues(issues, metrics);
      
      // Generate recommendations
      console.log('Generating recommendations...');
      const recommendations = generateRecommendations(issues);
      
      // Create validation result
      const result = {
        id: uuidv4(),
        url: 'html-content',
        contentType: 'webpage',
        validatedAt: new Date().toISOString(),
        score,
        metrics,
        issues,
        recommendations,
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
      
      const categories: Record<string, number> = {};
      result.issues.forEach(issue => {
        categories[issue.category] = (categories[issue.category] || 0) + 1;
      });
      
      console.log(categories);
      console.log('\nFirst 3 issues:');
      console.log(result.issues.slice(0, 3).map(i => `${i.title}: ${i.description}`));
      
      console.log('\nRecommendations:');
      console.log(result.recommendations.slice(0, 3));
      
    } finally {
      // Always close browser
      await browser.close();
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest();
