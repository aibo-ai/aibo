import { ContentType } from '../../../common/interfaces/content.interfaces';

/**
 * Segment type for content targeting
 */
export enum Segment {
  B2B = 'b2b',
  B2C = 'b2c'
}

/**
 * Freshness level categorization
 */
export enum FreshnessLevel {
  VERY_FRESH = 'very_fresh',
  FRESH = 'fresh',
  RECENT = 'recent',
  MODERATE = 'moderate',
  NEEDS_UPDATING = 'needs_updating'
}

/**
 * Content source type
 */
export enum ContentSource {
  NEWS_API = 'news_api',
  SERP_API = 'serp_api',
  EXA_API = 'exa_api',
  SOCIAL_SEARCHER = 'social_searcher',
  TWITTER_API = 'twitter_api',
  MEDIASTACK = 'mediastack',
  OTHER = 'other'
}

/**
 * Freshness indicators for content
 */
export interface FreshnessIndicators {
  recencyStatement: string;
  lastUpdatedDisplay: string;
  freshnessSignals: string[];
}

/**
 * Score breakdown for advanced QDF
 */
export interface ScoreBreakdown {
  freshness: number;
  popularity: number;
  relevance: number;
  diversity: number;
  authority: number;
  final: number;
}

/**
 * Fresh content item structure
 */
export interface FreshContentItem {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: ContentSource | string;
  publishedDate: string;
  publishedAt?: Date;
  author?: string;
  relevanceScore: number;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  freshnessScore?: number;
  freshnessLevel?: FreshnessLevel;
  freshnessThreshold?: FreshnessThreshold;
  freshnessIndicators?: FreshnessIndicators;
  contentType?: ContentType;
  imageUrl?: string;
  domain?: string;
  socialMetrics?: {
    shares?: number;
    likes?: number;
    comments?: number;
    engagement?: number;
  };
  keywords?: string[];
  sentiment?: 'positive' | 'neutral' | 'negative';
}

/**
 * Freshness threshold configuration
 */
export interface FreshnessThreshold {
  contentType: ContentType | 'default';
  segment: Segment;
  maxAgeDays: number;
  minFreshnessScore: number;
}

/**
 * QDF (Query Deserves Freshness) score
 */
export interface QDFScore {
  topic: string;
  score: number; // 0-1 where higher means more freshness needed
  lastUpdated: string;
  trendingFactor: number; // 0-1 where higher means more trending
  volatilityFactor: number; // 0-1 where higher means more volatile
  seasonalityFactor: number; // 0-1 where higher means more seasonal
}

/**
 * Aggregation metrics for performance tracking
 */
export interface AggregationMetrics {
  totalAPICalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageResponseTime: number;
  cacheHitRate: number;
  deduplicationRate: number;
}

/**
 * Content metrics for quality assessment
 */
export interface ContentMetrics {
  totalItems: number;
  averageFreshnessScore: number;
  freshnessDistribution: Record<FreshnessLevel, number>;
  sourcesBreakdown: Record<string, number>;
  qualityMetrics: {
    duplicatesRemoved: number;
    averageRelevanceScore: number;
    processingTime: number;
  };
}

/**
 * Fresh content aggregation result
 */
export interface FreshContentResult {
  id: string;
  topic: string;
  segment?: Segment;
  items: FreshContentItem[];
  metadata: ContentMetrics;
  aggregationMetrics?: AggregationMetrics;
  timestamp: Date;
  processingTimeMs: number;
  freshnessThreshold?: string;
  qdfScore?: number;
  collectedAt?: string;
  contentItems?: FreshContentItem[]; // Backward compatibility
  sources?: {
    name: string;
    count: number;
  }[];
  metrics?: {
    averageFreshnessScore: number;
    averageRelevanceScore: number;
    newestContentAge: number; // in days
    oldestContentAge: number; // in days
  };
}

/**
 * Search parameters for content freshness
 */
export interface FreshnessSearchParams {
  topic?: string;
  query?: string;
  segment?: Segment;
  timeframe?: 'last_day' | 'last_week' | 'last_month' | 'last_year' | 'any';
  contentTypes?: ContentType[];
  maxResults?: number;
  maxAgeDays?: number;
  limit?: number;
  minFreshnessScore?: number;
  includeSources?: ContentSource[];
  excludeSources?: ContentSource[];
  includeDomains?: string[];
  excludeDomains?: string[];
}
