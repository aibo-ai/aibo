export interface CitationVerificationConfig {
  // External API configurations
  crossrefApiUrl: string;
  crossrefApiKey?: string;
  
  // Domain authority services
  mozApiUrl: string;
  mozApiKey?: string;
  mozApiSecret?: string;
  
  ahrefsApiUrl: string;
  ahrefsApiKey?: string;
  
  // URL validation services
  urlValidationApiUrl: string;
  urlValidationApiKey?: string;
  
  // Rate limiting
  maxRequestsPerMinute: number;
  maxConcurrentRequests: number;
  
  // Caching
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
  
  // Timeouts
  apiTimeoutMs: number;
  retryAttempts: number;
  retryDelayMs: number;
}

export interface ExtractedCitation {
  id: string;
  text: string;
  url?: string;
  doi?: string;
  title?: string;
  authors?: string[];
  year?: number;
  source?: string;
  section: string;
  position: {
    start: number;
    end: number;
  };
  type: 'url' | 'doi' | 'academic' | 'book' | 'report' | 'other';
}

export interface CitationVerificationResult {
  citation: ExtractedCitation;
  verification: {
    urlValid?: boolean;
    doiValid?: boolean;
    sourceReputation: number; // 0-10
    recency: number; // 0-10
    authorityScore: number; // 0-10
    relevanceScore: number; // 0-10
    methodologyRigor?: number; // 0-10 (for academic sources)
    industryRelevance?: number; // 0-10 (for B2B)
    audienceRelevance?: number; // 0-10 (for B2C)
    claimVerification?: number; // 0-10
  };
  overallScore: number; // 0-10
  verificationStatus: 'high_authority' | 'moderate_authority' | 'low_authority' | 'unverified';
  issues: string[];
  suggestions: string[];
  metadata: {
    verifiedAt: string;
    verificationMethod: string;
    apiResponses?: any;
    error?: string;
  };
}

export interface DomainAuthorityResult {
  domain: string;
  authorityScore: number; // 0-100
  trustScore: number; // 0-100
  spamScore?: number; // 0-100
  backlinks?: number;
  referringDomains?: number;
  domainAge?: number; // years
  isGovernment: boolean;
  isEducational: boolean;
  isNonProfit: boolean;
  isNews: boolean;
  metadata: {
    source: string; // 'moz' | 'ahrefs' | 'internal'
    checkedAt: string;
  };
}

export interface UrlValidationResult {
  url: string;
  isValid: boolean;
  isAccessible: boolean;
  statusCode?: number;
  contentType?: string;
  title?: string;
  lastModified?: string;
  isSecure: boolean;
  redirectChain?: string[];
  errors: string[];
  metadata: {
    checkedAt: string;
    responseTime: number;
  };
}

export interface CitationExtractionResult {
  citations: ExtractedCitation[];
  totalFound: number;
  byType: Record<string, number>;
  bySection: Record<string, number>;
  extractionMethod: string;
  confidence: number; // 0-1
  processingTime: number;
}

export interface EnhancedCitation extends ExtractedCitation {
  enhanced: boolean;
  originalCitation?: ExtractedCitation;
  enhancementReason: string;
  suggestedReplacements?: {
    source: string;
    url: string;
    title: string;
    authorityScore: number;
    reason: string;
  }[];
}

export interface CitationStrategy {
  topic: string;
  segment: 'b2b' | 'b2c';
  recommendedSources: string[];
  preferredFormats: string[];
  authorityHierarchy: {
    tier1: string[];
    tier2: string[];
    tier3: string[];
    tier4: string[];
  };
  densityRecommendation: {
    minimumCitations: number;
    recommendedCitationsPerSection: number;
    keyClaimRequirement: string;
  };
  visualPresentation: {
    inlineStyle: string;
    referenceSection: string;
    citationHighlighting: string;
  };
  qualityThresholds: {
    minimumAuthorityScore: number;
    maximumAge: number; // years
    requiredSourceTypes: string[];
  };
}

export interface CitationCacheEntry {
  key: string;
  result: CitationVerificationResult | DomainAuthorityResult | UrlValidationResult;
  createdAt: string;
  expiresAt: string;
  hitCount: number;
}

export interface CitationAnalysisMetrics {
  totalCitations: number;
  verifiedCitations: number;
  highAuthorityCitations: number;
  moderateAuthorityCitations: number;
  lowAuthorityCitations: number;
  unverifiedCitations: number;
  averageAuthorityScore: number;
  averageRecencyScore: number;
  citationDensity: number; // citations per 1000 words
  sourceTypeDistribution: Record<string, number>;
  issuesFound: string[];
  improvementSuggestions: string[];
}
