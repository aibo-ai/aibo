import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

import {
  SeoValidationParams,
  SeoValidationResult,
  SeoValidationIssue,
  SeoValidationScore,
  SeoValidationMetrics,
  SeoValidationSeverity,
  SeoValidationCategory,
  AxeResult
} from '../../../common/interfaces/seo-validator.interfaces';
import { SemanticHtmlAnalyzerService } from './semantic-html-analyzer.service';
import { AccessibilityValidatorService } from './accessibility-validator.service';

/**
 * Technical SEO Validator Service
 * Validates content against technical SEO requirements including:
 * - Mobile-friendliness
 * - Accessibility
 * - Heading structure
 * - HTML semantics
 * - Crawler accessibility
 */
@Injectable()
export class TechnicalSeoValidatorService {
  private readonly logger = new Logger(TechnicalSeoValidatorService.name);
  private readonly lighthouseApiUrl: string;
  private readonly azureFunctionUrl: string;

  constructor(
    private configService: ConfigService,
    private semanticHtmlAnalyzer: SemanticHtmlAnalyzerService,
    private accessibilityValidator: AccessibilityValidatorService
  ) {
    this.lighthouseApiUrl = this.configService.get<string>('LIGHTHOUSE_API_URL') || '';
    this.azureFunctionUrl = this.configService.get<string>('SEO_VALIDATOR_FUNCTION_URL') || '';
    this.logger.log('Technical SEO Validator Service initialized');
  }

  /**
   * Validates content against technical SEO requirements
   * @param params Validation parameters
   * @returns Validation result
   */
  async validateContent(params: SeoValidationParams): Promise<SeoValidationResult> {
    this.logger.log(`Validating content for URL: ${params.url || 'HTML content'}`);
    
    try {
      // If URL is provided, use Lighthouse API via Azure Function
      if (params.url) {
        return await this.validateUrl(params);
      }
      
      // If HTML content is provided, use local validation
      if (params.html) {
        return await this.validateHtml(params);
      }
      
      throw new Error('Either URL or HTML content must be provided for validation');
    } catch (error) {
      this.logger.error(`Error validating content: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Validates a URL using Lighthouse API via Azure Function
   * @param params Validation parameters
   * @returns Validation result
   */
  private async validateUrl(params: SeoValidationParams): Promise<SeoValidationResult> {
    try {
      const response = await axios.post(this.azureFunctionUrl, {
        url: params.url,
        validateMobileFriendliness: params.validateMobileFriendliness !== false,
        validateAccessibility: params.validateAccessibility !== false,
        validateHeadingStructure: params.validateHeadingStructure !== false,
        validateSemanticHtml: params.validateSemanticHtml !== false,
        validateCrawlerAccessibility: params.validateCrawlerAccessibility !== false,
        validateStructuredData: params.validateStructuredData !== false,
        validateMetaTags: params.validateMetaTags !== false,
        validatePerformance: params.validatePerformance !== false,
        validateContentQuality: params.validateContentQuality !== false
      });
      
      return response.data;
    } catch (error) {
      this.logger.error(`Error validating URL: ${error.message}`, error.stack);
      throw new Error(`Failed to validate URL: ${error.message}`);
    }
  }

  /**
   * Validates HTML content using local validation
   * @param params Validation parameters
   * @returns Validation result
   */
  private async validateHtml(params: SeoValidationParams): Promise<SeoValidationResult> {
    try {
      this.logger.log('Validating HTML content using local validation');
      const validationId = uuidv4();
      const html = params.html;
      
      if (!html) {
        throw new Error('HTML content is required for validation');
      }
      
      // Collect issues from different validators
      const issues: SeoValidationIssue[] = [];
      
      // Analyze semantic HTML structure
      if (params.validateSemanticHtml !== false || params.validateHeadingStructure !== false) {
        const semanticIssues = await this.semanticHtmlAnalyzer.analyzeHtml(html);
        issues.push(...semanticIssues);
      }
      
      // For accessibility validation, we would normally use axe-core
      // Since we can't run browser-based validation here, we'll use our semantic analyzer
      // In a real implementation, we would use Puppeteer to run axe-core in a headless browser
      
      // Calculate metrics based on issues
      const metrics = this.calculateMetrics(issues);
      
      // Calculate scores based on issues and metrics
      const score = this.calculateScores(issues, metrics);
      
      // Generate recommendations based on issues
      const recommendations = this.generateRecommendations(issues);
      
      return {
        id: validationId,
        contentType: params.contentType,
        validatedAt: new Date().toISOString(),
        score,
        metrics,
        issues,
        recommendations,
        validationParams: params
      };
    } catch (error) {
      this.logger.error(`Error validating HTML content: ${error.message}`, error.stack);
      throw new Error(`Failed to validate HTML content: ${error.message}`);
    }
  }

  /**
   * Calculates metrics based on validation issues
   * @param issues Validation issues
   * @returns Validation metrics
   */
  private calculateMetrics(issues: SeoValidationIssue[]): SeoValidationMetrics {
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
      switch (issue.severity) {
        case SeoValidationSeverity.ERROR:
          metrics.errorCount++;
          break;
        case SeoValidationSeverity.WARNING:
          metrics.warningCount++;
          break;
        case SeoValidationSeverity.INFO:
          metrics.infoCount++;
          break;
      }

      // Increment category count
      if (metrics.issuesByCategory[issue.category] !== undefined) {
        metrics.issuesByCategory[issue.category]++;
      }
    });

    // Assume 20 checks were performed (this would be more accurate in a real implementation)
    metrics.passedCount = 20 - metrics.totalIssues;
    if (metrics.passedCount < 0) metrics.passedCount = 0;

    return metrics;
  }

  /**
   * Calculates scores based on validation issues and metrics
   * @param issues Validation issues
   * @param metrics Validation metrics
   * @returns Validation scores
   */
  private calculateScores(issues: SeoValidationIssue[], metrics: SeoValidationMetrics): SeoValidationScore {
    // Base score calculation
    const totalChecks = metrics.totalIssues + metrics.passedCount;
    const baseScore = totalChecks > 0 ? (metrics.passedCount / totalChecks) * 100 : 0;

    // Calculate individual scores
    const accessibilityScore = this.calculateCategoryScore(issues, metrics, SeoValidationCategory.ACCESSIBILITY);
    const mobileFriendlyScore = this.calculateCategoryScore(issues, metrics, SeoValidationCategory.MOBILE_FRIENDLY);
    const semanticStructureScore = this.calculateCategoryScore(
      issues, 
      metrics, 
      [SeoValidationCategory.HEADING_STRUCTURE, SeoValidationCategory.SEMANTIC_HTML]
    );
    const seoScore = this.calculateCategoryScore(
      issues, 
      metrics, 
      [SeoValidationCategory.META_TAGS, SeoValidationCategory.STRUCTURED_DATA]
    );
    const performanceScore = this.calculateCategoryScore(issues, metrics, SeoValidationCategory.PERFORMANCE);

    // Calculate overall score with weighted components
    const overallScore = (
      accessibilityScore * 0.2 +
      mobileFriendlyScore * 0.2 +
      semanticStructureScore * 0.2 +
      seoScore * 0.3 +
      performanceScore * 0.1
    );

    return {
      overall: Math.round(overallScore),
      performance: Math.round(performanceScore),
      accessibility: Math.round(accessibilityScore),
      bestPractices: Math.round(baseScore),
      seo: Math.round(seoScore),
      mobileFriendly: Math.round(mobileFriendlyScore),
      semanticStructure: Math.round(semanticStructureScore)
    };
  }

  /**
   * Calculates score for a specific category or categories
   * @param issues Validation issues
   * @param metrics Validation metrics
   * @param categories Category or categories to calculate score for
   * @returns Category score (0-100)
   */
  private calculateCategoryScore(
    issues: SeoValidationIssue[], 
    metrics: SeoValidationMetrics, 
    categories: SeoValidationCategory | SeoValidationCategory[]
  ): number {
    const categoryArray = Array.isArray(categories) ? categories : [categories];
    
    // Count issues in the specified categories
    const categoryIssues = issues.filter(issue => categoryArray.includes(issue.category));
    
    // Count issues by severity
    const errorCount = categoryIssues.filter(issue => issue.severity === SeoValidationSeverity.ERROR).length;
    const warningCount = categoryIssues.filter(issue => issue.severity === SeoValidationSeverity.WARNING).length;
    const infoCount = categoryIssues.filter(issue => issue.severity === SeoValidationSeverity.INFO).length;
    
    // Base score starts at 100 and is reduced by issues
    let score = 100;
    
    // Reduce score based on severity
    score -= errorCount * 20;    // -20 points per error
    score -= warningCount * 10;  // -10 points per warning
    score -= infoCount * 5;      // -5 points per info
    
    // Ensure score is between 0 and 100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generates recommendations based on validation issues
   * @param issues Validation issues
   * @returns Array of recommendations
   */
  private generateRecommendations(issues: SeoValidationIssue[]): string[] {
    const recommendations: Set<string> = new Set<string>();
    
    // Generate recommendations based on issue severity and category
    issues.forEach(issue => {
      if (issue.severity === SeoValidationSeverity.ERROR || issue.severity === SeoValidationSeverity.WARNING) {
        if (issue.recommendation) {
          recommendations.add(issue.recommendation);
        }
      }
    });
    
    // Add general recommendations if specific ones aren't available
    if (recommendations.size === 0) {
      recommendations.add('Implement proper heading structure (H1, H2, H3)');
      recommendations.add('Ensure all images have alt text');
      recommendations.add('Use semantic HTML elements for better accessibility');
      recommendations.add('Optimize for mobile devices');
    }
    
    // Limit to top 5 recommendations
    return Array.from(recommendations).slice(0, 5);
  }

  /**
   * Creates a placeholder validation score
   * @returns Placeholder validation score
   */
  private createPlaceholderScore(): SeoValidationScore {
    return {
      overall: 0,
      performance: 0,
      accessibility: 0,
      bestPractices: 0,
      seo: 0,
      mobileFriendly: 0,
      semanticStructure: 0
    };
  }

  /**
   * Creates placeholder validation metrics
   * @returns Placeholder validation metrics
   */
  private createPlaceholderMetrics(): SeoValidationMetrics {
    return {
      totalIssues: 0,
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
  }
}
