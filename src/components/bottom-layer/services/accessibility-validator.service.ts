import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import {
  SeoValidationIssue,
  SeoValidationSeverity,
  SeoValidationCategory,
  AxeResult
} from '../../../common/interfaces/seo-validator.interfaces';

/**
 * Accessibility Validator Service
 * Validates content for accessibility issues using axe-core
 */
@Injectable()
export class AccessibilityValidatorService {
  private readonly logger = new Logger(AccessibilityValidatorService.name);

  constructor() {
    this.logger.log('Accessibility Validator Service initialized');
  }

  /**
   * Maps axe-core results to SEO validation issues
   * @param axeResults Results from axe-core analysis
   * @returns Array of validation issues
   */
  mapAxeResultsToIssues(axeResults: AxeResult): SeoValidationIssue[] {
    this.logger.log(`Processing ${axeResults.violations.length} accessibility violations`);
    
    const issues: SeoValidationIssue[] = [];
    
    // Map violations to issues
    axeResults.violations.forEach(violation => {
      // Determine severity based on impact
      let severity: SeoValidationSeverity;
      switch (violation.impact) {
        case 'critical':
          severity = SeoValidationSeverity.ERROR;
          break;
        case 'serious':
          severity = SeoValidationSeverity.ERROR;
          break;
        case 'moderate':
          severity = SeoValidationSeverity.WARNING;
          break;
        case 'minor':
          severity = SeoValidationSeverity.INFO;
          break;
        default:
          severity = SeoValidationSeverity.INFO;
      }
      
      // Create an issue for each node with this violation
      violation.nodes.forEach(node => {
        issues.push({
          id: uuidv4(),
          category: SeoValidationCategory.ACCESSIBILITY,
          severity,
          title: violation.help,
          description: violation.description,
          impact: `Impact: ${violation.impact}, WCAG: ${violation.tags.filter(tag => tag.startsWith('wcag')).join(', ')}`,
          recommendation: node.failureSummary || 'Fix this accessibility issue to improve user experience and SEO',
          element: node.html,
          location: {
            selector: node.target.join(', ')
          }
        });
      });
    });
    
    return issues;
  }
  
  /**
   * Calculates accessibility score based on axe results
   * @param axeResults Results from axe-core analysis
   * @returns Accessibility score (0-100)
   */
  calculateAccessibilityScore(axeResults: AxeResult): number {
    // Count total checks (passes + violations)
    const totalChecks = axeResults.passes.length + axeResults.violations.length;
    
    // If no checks were performed, return 0
    if (totalChecks === 0) {
      return 0;
    }
    
    // Calculate score based on percentage of passed checks
    const score = (axeResults.passes.length / totalChecks) * 100;
    
    // Apply impact-based weighting
    const criticalViolations = axeResults.violations.filter(v => v.impact === 'critical').length;
    const seriousViolations = axeResults.violations.filter(v => v.impact === 'serious').length;
    
    // Reduce score based on critical and serious violations
    let weightedScore = score;
    weightedScore -= criticalViolations * 10; // -10 points per critical violation
    weightedScore -= seriousViolations * 5;   // -5 points per serious violation
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, weightedScore));
  }
  
  /**
   * Generates accessibility recommendations based on issues
   * @param issues Array of validation issues
   * @returns Array of recommendations
   */
  generateAccessibilityRecommendations(issues: SeoValidationIssue[]): string[] {
    const recommendations: string[] = [];
    
    // Count issues by type
    const issueTypes = new Map<string, number>();
    issues.forEach(issue => {
      const count = issueTypes.get(issue.title) || 0;
      issueTypes.set(issue.title, count + 1);
    });
    
    // Generate recommendations for common issues
    if (issueTypes.has('Images must have alternate text')) {
      recommendations.push('Add descriptive alt text to all images to improve accessibility and SEO');
    }
    
    if (issueTypes.has('Form elements must have labels')) {
      recommendations.push('Ensure all form inputs have associated labels for better accessibility');
    }
    
    if (issueTypes.has('Elements must have sufficient color contrast')) {
      recommendations.push('Improve color contrast between text and background to meet WCAG standards');
    }
    
    if (issueTypes.has('Links must have discernible text')) {
      recommendations.push('Ensure all links have meaningful text that describes their purpose');
    }
    
    if (issueTypes.has('Document must have one main landmark')) {
      recommendations.push('Add a main landmark (e.g., <main> element) to improve page structure');
    }
    
    // Add general recommendation if specific ones weren't generated
    if (recommendations.length === 0 && issues.length > 0) {
      recommendations.push('Address accessibility issues to improve user experience and SEO performance');
    }
    
    return recommendations;
  }
}
