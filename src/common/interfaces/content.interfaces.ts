/**
 * Content types supported by the system
 */
export type ContentType = 
  | 'article' 
  | 'blog_post' 
  | 'news' 
  | 'social_post' 
  | 'research_paper' 
  | 'case_study' 
  | 'white_paper'
  | 'video'
  | 'podcast'
  | 'infographic'
  | 'ebook'
  | 'guide'
  | 'tutorial'
  | 'review'
  | 'product_page'
  | 'landing_page'
  | 'other';

/**
 * Content metadata interface
 */
export interface ContentMetadata {
  title: string;
  description?: string;
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  url?: string;
  domain?: string;
  contentType: ContentType;
  wordCount?: number;
  readingTime?: number;
  imageCount?: number;
  hasVideo?: boolean;
  language?: string;
  tags?: string[];
  categories?: string[];
}

/**
 * Content score metrics
 */
export interface ContentScoreMetrics {
  relevance?: number;
  freshness?: number;
  authority?: number;
  engagement?: number;
  readability?: number;
  sentiment?: number;
  overall?: number;
}

/**
 * Base content interface
 */
export interface BaseContent {
  id: string;
  metadata: ContentMetadata;
  score?: ContentScoreMetrics;
  createdAt: string;
  updatedAt: string;
}
