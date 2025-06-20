/**
 * Technical SEO Validator Interfaces
 */

export enum ContentType {
  ARTICLE = 'ARTICLE',
  BLOG_POST = 'BLOG_POST',
  LANDING_PAGE = 'LANDING_PAGE',
  PRODUCT_PAGE = 'PRODUCT_PAGE',
  CATEGORY_PAGE = 'CATEGORY_PAGE',
  HOME_PAGE = 'HOME_PAGE',
  ABOUT_PAGE = 'ABOUT_PAGE',
  CONTACT_PAGE = 'CONTACT_PAGE',
  OTHER = 'OTHER'
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface SeoValidationParams {
  url?: string;
  html?: string;
  contentType?: ContentType;
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
}

export interface SeoValidationIssue {
  id: string;
  type: string;
  message: string;
  description: string;
  severity: string;
  element?: string;
  recommendation?: string;
  details?: any;
}

export interface SeoValidationMetrics {
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  semanticStructureIssues: number;
  accessibilityIssues: number;
  metaTagIssues: number;
  headingStructureIssues: number;
  imageIssues: number;
  linkIssues: number;
  mobileFriendlyIssues: number;
  pageSpeedIssues: number;
  structuredDataIssues: number;
  socialTagIssues: number;
}

export interface SeoValidationScore {
  overall: number;
  accessibility: number;
  semanticStructure: number;
  mobileFriendly: number;
}

export interface SeoValidationResult {
  id: string;
  url: string;
  contentType?: ContentType;
  validatedAt: string;
  score: SeoValidationScore;
  metrics: SeoValidationMetrics;
  issues: SeoValidationIssue[];
  recommendations: string[];
  validationParams: SeoValidationParams;
  note?: string;
}
