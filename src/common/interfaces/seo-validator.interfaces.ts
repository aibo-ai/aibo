/**
 * Technical SEO validation interfaces
 */

import { ContentType } from './content.interfaces';

/**
 * SEO validation severity levels
 */
export enum SeoValidationSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
  PASSED = 'passed'
}

/**
 * SEO validation categories
 */
export enum SeoValidationCategory {
  MOBILE_FRIENDLY = 'mobile_friendly',
  ACCESSIBILITY = 'accessibility',
  PERFORMANCE = 'performance',
  HEADING_STRUCTURE = 'heading_structure',
  SEMANTIC_HTML = 'semantic_html',
  CRAWLER_ACCESSIBILITY = 'crawler_accessibility',
  META_TAGS = 'meta_tags',
  STRUCTURED_DATA = 'structured_data',
  CONTENT_QUALITY = 'content_quality',
  LINKS = 'links',
  IMAGES = 'images'
}

/**
 * SEO validation issue interface
 */
export interface SeoValidationIssue {
  id: string;
  category: SeoValidationCategory;
  severity: SeoValidationSeverity;
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  element?: string;
  location?: {
    line?: number;
    column?: number;
    selector?: string;
  };
}

/**
 * SEO validation score interface
 */
export interface SeoValidationScore {
  overall: number;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  mobileFriendly: number;
  semanticStructure: number;
}

/**
 * SEO validation metrics interface
 */
export interface SeoValidationMetrics {
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passedCount: number;
  issuesByCategory: Record<SeoValidationCategory, number>;
}

/**
 * SEO validation parameters interface
 */
export interface SeoValidationParams {
  url?: string;
  html?: string;
  contentType?: ContentType;
  validateMobileFriendliness?: boolean;
  validateAccessibility?: boolean;
  validateHeadingStructure?: boolean;
  validateSemanticHtml?: boolean;
  validateCrawlerAccessibility?: boolean;
  validateStructuredData?: boolean;
  validateMetaTags?: boolean;
  validatePerformance?: boolean;
  validateContentQuality?: boolean;
}

/**
 * SEO validation result interface
 */
export interface SeoValidationResult {
  id: string;
  url?: string;
  contentType?: ContentType;
  validatedAt: string;
  score: SeoValidationScore;
  metrics: SeoValidationMetrics;
  issues: SeoValidationIssue[];
  recommendations: string[];
  validationParams: SeoValidationParams;
}

/**
 * Lighthouse audit result interface (simplified)
 */
export interface LighthouseAuditResult {
  score: number;
  displayValue?: string;
  description?: string;
  details?: any;
  warnings?: string[];
  numericValue?: number;
}

/**
 * Lighthouse category result interface (simplified)
 */
export interface LighthouseCategoryResult {
  id: string;
  title: string;
  score: number;
  auditRefs: Array<{
    id: string;
    weight: number;
    group?: string;
  }>;
}

/**
 * Lighthouse result interface (simplified)
 */
export interface LighthouseResult {
  requestedUrl: string;
  finalUrl: string;
  audits: Record<string, LighthouseAuditResult>;
  categories: Record<string, LighthouseCategoryResult>;
  categoryGroups?: Record<string, { title: string; description?: string }>;
  timing: { total: number };
}

/**
 * Axe accessibility result interface (simplified)
 */
export interface AxeResult {
  passes: Array<{
    id: string;
    impact: string;
    tags: string[];
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary?: string;
    }>;
  }>;
  violations: Array<{
    id: string;
    impact: string;
    tags: string[];
    description: string;
    help: string;
    helpUrl: string;
    nodes: Array<{
      html: string;
      target: string[];
      failureSummary?: string;
    }>;
  }>;
  incomplete: Array<any>;
  inapplicable: Array<any>;
}
