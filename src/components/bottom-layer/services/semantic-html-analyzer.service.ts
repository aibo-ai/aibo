import { Injectable, Logger } from '@nestjs/common';
import { unified } from 'unified';
import parse from 'rehype-parse';
import { visit } from 'unist-util-visit';
import { v4 as uuidv4 } from 'uuid';

import {
  SeoValidationIssue,
  SeoValidationSeverity,
  SeoValidationCategory
} from '../../../common/interfaces/seo-validator.interfaces';

/**
 * Semantic HTML Analyzer Service
 * Analyzes HTML content for semantic structure and accessibility issues
 */
@Injectable()
export class SemanticHtmlAnalyzerService {
  private readonly logger = new Logger(SemanticHtmlAnalyzerService.name);

  constructor() {
    this.logger.log('Semantic HTML Analyzer Service initialized');
  }

  /**
   * Analyzes HTML content for semantic structure and accessibility issues
   * @param html HTML content to analyze
   * @returns Array of validation issues
   */
  async analyzeHtml(html: string): Promise<SeoValidationIssue[]> {
    this.logger.log('Analyzing HTML for semantic structure');
    
    try {
      const issues: SeoValidationIssue[] = [];
      
      // Parse HTML
      const ast = await unified()
        .use(parse, { fragment: false })
        .parse(html);
      
      // Check heading structure
      const headingIssues = this.checkHeadingStructure(ast);
      issues.push(...headingIssues);
      
      // Check semantic elements
      const semanticIssues = this.checkSemanticElements(ast);
      issues.push(...semanticIssues);
      
      // Check accessibility
      const accessibilityIssues = this.checkAccessibility(ast);
      issues.push(...accessibilityIssues);
      
      return issues;
    } catch (error) {
      this.logger.error(`Error analyzing HTML: ${error.message}`, error.stack);
      return [];
    }
  }

  /**
   * Checks heading structure in HTML content
   * @param ast HTML AST
   * @returns Array of validation issues
   */
  private checkHeadingStructure(ast: any): SeoValidationIssue[] {
    const issues: SeoValidationIssue[] = [];
    const headings: { tag: string; level: number; text: string }[] = [];
    
    // Find all heading elements
    visit(ast, 'element', (node) => {
      if (node.tagName.match(/^h[1-6]$/)) {
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
    
    // Check heading hierarchy
    let previousLevel = 0;
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      
      // Check for skipped heading levels (e.g., H1 -> H3, skipping H2)
      if (heading.level > previousLevel + 1 && previousLevel !== 0) {
        issues.push({
          id: uuidv4(),
          category: SeoValidationCategory.HEADING_STRUCTURE,
          severity: SeoValidationSeverity.WARNING,
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

  /**
   * Checks semantic elements in HTML content
   * @param ast HTML AST
   * @returns Array of validation issues
   */
  private checkSemanticElements(ast: any): SeoValidationIssue[] {
    const issues: SeoValidationIssue[] = [];
    const semanticElements = ['header', 'footer', 'main', 'article', 'section', 'nav', 'aside'];
    const foundElements: Record<string, boolean> = {};
    
    // Find semantic elements
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
    
    // Check for div overuse
    let divCount = 0;
    visit(ast, 'element', (node) => {
      if (node.tagName === 'div') {
        divCount++;
      }
    });
    
    if (divCount > 50) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.SEMANTIC_HTML,
        severity: SeoValidationSeverity.INFO,
        title: 'Excessive use of div elements',
        description: `The page uses ${divCount} div elements, which may indicate a lack of semantic structure.`,
        impact: 'Overusing div elements instead of semantic HTML can make it harder for search engines to understand your content.',
        recommendation: 'Replace generic div elements with semantic HTML elements where appropriate.'
      });
    }
    
    return issues;
  }

  /**
   * Checks accessibility issues in HTML content
   * @param ast HTML AST
   * @returns Array of validation issues
   */
  private checkAccessibility(ast: any): SeoValidationIssue[] {
    const issues: SeoValidationIssue[] = [];
    
    // Check for images without alt text
    const imagesWithoutAlt: string[] = [];
    visit(ast, 'element', (node) => {
      if (node.tagName === 'img') {
        const altAttr = node.properties?.alt;
        if (!altAttr && altAttr !== '') {
          let src = node.properties?.src || 'unknown';
          if (typeof src === 'object') {
            src = JSON.stringify(src);
          }
          imagesWithoutAlt.push(src);
        }
      }
    });
    
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.ACCESSIBILITY,
        severity: SeoValidationSeverity.ERROR,
        title: 'Images without alt text',
        description: `Found ${imagesWithoutAlt.length} images without alt text`,
        impact: 'Images without alt text are not accessible to screen readers and don\'t contribute to SEO.',
        recommendation: 'Add descriptive alt text to all images.'
      });
    }
    
    // Check for form inputs without labels
    const inputsWithoutLabels: string[] = [];
    visit(ast, 'element', (node) => {
      if (['input', 'textarea', 'select'].includes(node.tagName)) {
        const id = node.properties?.id;
        if (id) {
          let hasLabel = false;
          
          // Check if there's a label with a matching 'for' attribute
          visit(ast, 'element', (labelNode) => {
            if (labelNode.tagName === 'label' && labelNode.properties?.for === id) {
              hasLabel = true;
            }
          });
          
          if (!hasLabel) {
            inputsWithoutLabels.push(node.tagName);
          }
        } else {
          // Input has no ID, so it can't be associated with a label
          inputsWithoutLabels.push(node.tagName);
        }
      }
    });
    
    if (inputsWithoutLabels.length > 0) {
      issues.push({
        id: uuidv4(),
        category: SeoValidationCategory.ACCESSIBILITY,
        severity: SeoValidationSeverity.WARNING,
        title: 'Form inputs without labels',
        description: `Found ${inputsWithoutLabels.length} form inputs without associated labels`,
        impact: 'Form inputs without labels are not accessible to screen readers.',
        recommendation: 'Add labels with matching "for" attributes to all form inputs.'
      });
    }
    
    return issues;
  }
}
