import { ContentType } from '../../shared/interfaces/content.interfaces';
export type Segment = 'b2b' | 'b2c';
export type FreshnessLevel = 'very_fresh' | 'fresh' | 'moderate' | 'needs_updating';
export type ContentSource = 'news' | 'serp' | 'social' | 'blog' | 'research' | 'other';
export interface FreshnessIndicators {
    recencyStatement: string;
    lastUpdatedDisplay: string;
    freshnessSignals: string[];
}
export interface FreshContentItem {
    id: string;
    title: string;
    description?: string;
    content?: string;
    url: string;
    source: ContentSource | string;
    publishedDate: string;
    author?: string;
    relevanceScore: number;
    freshnessScore?: number;
    freshnessLevel?: FreshnessLevel;
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
export interface FreshnessThreshold {
    contentType: ContentType | 'default';
    segment: Segment;
    maxAgeDays: number;
    minFreshnessScore: number;
}
export interface QDFScore {
    topic: string;
    score: number;
    lastUpdated: string;
    trendingFactor: number;
    volatilityFactor: number;
    seasonalityFactor: number;
}
export interface FreshContentResult {
    topic: string;
    segment?: Segment;
    freshnessThreshold: string;
    qdfScore?: number;
    collectedAt: string;
    contentItems: FreshContentItem[];
    sources: {
        name: string;
        count: number;
    }[];
    metrics: {
        averageFreshnessScore: number;
        averageRelevanceScore: number;
        newestContentAge: number;
        oldestContentAge: number;
    };
}
export interface FreshnessSearchParams {
    topic: string;
    segment?: Segment;
    timeframe?: 'last_day' | 'last_week' | 'last_month' | 'last_year' | 'any';
    contentTypes?: ContentType[];
    maxResults?: number;
    minFreshnessScore?: number;
    includeSources?: ContentSource[];
    excludeSources?: ContentSource[];
    includeDomains?: string[];
    excludeDomains?: string[];
}
