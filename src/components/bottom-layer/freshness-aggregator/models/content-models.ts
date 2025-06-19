/**
 * Common interfaces for the Freshness Aggregator
 */

/**
 * Base interface for all content items
 */
export interface ContentItem {
  id: string;
  title: string;
  url: string;
  source: string;
  publishedAt: Date;
  retrievedAt: Date;
  contentType: ContentType;
  snippet?: string;
  author?: string;
  imageUrl?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

/**
 * Types of content that can be aggregated
 */
export enum ContentType {
  NEWS = 'news',
  WEB = 'web',
  SOCIAL = 'social',
  BLOG = 'blog',
  FORUM = 'forum',
  VIDEO = 'video',
  PODCAST = 'podcast',
  DOCUMENT = 'document',
  WIKI = 'wiki',
  REVIEW = 'review',
  COMMENT = 'comment',
  SERP = 'serp',
  ACADEMIC = 'academic',
  OTHER = 'other'
}

/**
 * News article from news APIs
 */
export interface NewsArticle extends ContentItem {
  contentType: ContentType.NEWS;
  source: string;
  sourceId?: string;
  category?: string;
  sentiment?: number;
}

/**
 * Social media post
 */
export interface SocialPost extends ContentItem {
  contentType: ContentType.SOCIAL;
  platform: SocialPlatform;
  engagement: SocialEngagement;
  username: string;
  profileUrl?: string;
}

/**
 * Social media platforms
 */
export enum SocialPlatform {
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  REDDIT = 'reddit',
  OTHER = 'other'
}

/**
 * Social media engagement metrics
 */
export interface SocialEngagement {
  likes?: number;
  shares?: number;
  comments?: number;
  views?: number;
  totalEngagement: number;
}

/**
 * Web search result
 */
export interface WebSearchResult extends Omit<ContentItem, 'contentType' | 'publishedAt' | 'retrievedAt'> {
  contentType: ContentType.SERP | ContentType.WEB | ContentType.NEWS;
  rank: number;
  domain: string;
  snippet: string;
  publishedAt: string;
  retrievedAt: string;
  metadata?: Record<string, any>;
  thumbnail?: string;
}

/**
 * Aggregated content item with freshness score
 */
export interface AggregatedContentItem extends ContentItem {
  freshness: FreshnessScore;
  relevanceScore: number;
  originalItem: ContentItem;
}

/**
 * Freshness score and metadata
 */
export interface FreshnessScore {
  score: number;  // 0-100 score
  age: number;    // Age in hours
  recency: RecencyCategory;
  qdfScore?: number;  // Query Deserves Freshness score
}

/**
 * Recency categories
 */
export enum RecencyCategory {
  BREAKING = 'breaking',     // < 1 hour
  VERY_RECENT = 'very_recent', // < 6 hours
  RECENT = 'recent',         // < 24 hours
  TODAY = 'today',           // < 48 hours
  THIS_WEEK = 'this_week',   // < 7 days
  THIS_MONTH = 'this_month', // < 30 days
  OLDER = 'older'            // > 30 days
}

/**
 * Search parameters for the Freshness Aggregator
 */
export interface FreshnessSearchParameters {
  query: string;
  limit?: number;
  sortBy?: 'freshness' | 'relevance' | 'engagement' | 'mixed';
  contentTypes?: ContentType[];
  timeframe?: {
    startDate?: Date;
    endDate?: Date;
  };
  language?: string;
  region?: string;
  skipCache?: boolean;
  minFreshnessScore?: number;
  qdfEnabled?: boolean;
}

/**
 * Response from the Freshness Aggregator
 */
export interface FreshnessAggregatorResponse {
  query: string;
  qdfScore: number;
  totalItems: number;
  items: AggregatedContentItem[];
  sources: string[];
  executionTime: number;
}

/**
 * Data model for Cosmos DB storage
 */
export interface ContentItemDocument {
  id: string;
  partitionKey: string;  // Usually the content type or source
  type: string;         // Document type (e.g., 'freshness-results')
  query: string;        // Search query
  timestamp: string;    // ISO timestamp
  data: any;           // Stored data (e.g., FreshnessAggregatorResponse)
  ttl?: number;        // Time-to-live in seconds
  searchQueries?: string[];  // Queries this content was returned for
  freshnessScores?: Record<string, FreshnessScore>;  // Freshness scores by query
}
