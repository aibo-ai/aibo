import {
  ContentItem,
  ContentType,
  FreshnessScore,
  RecencyCategory,
  AggregatedContentItem
} from '../models/content-models';

/**
 * Utility functions for freshness calculations and content aggregation
 */
export class FreshnessUtils {
  /**
   * Calculate freshness score for a content item
   * @param item Content item
   * @param freshnessThresholds Freshness thresholds in hours for each content type
   * @returns Freshness score object
   */
  static calculateFreshnessScore(
    item: ContentItem,
    freshnessThresholds: Record<ContentType, number>
  ): FreshnessScore {
    const now = new Date();
    const publishedAt = item.publishedAt;
    
    // Calculate age in hours
    const ageInHours = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);
    
    // Get threshold for this content type
    const threshold = freshnessThresholds[item.contentType] || 
      freshnessThresholds[ContentType.OTHER];
    
    // Calculate score (100 when fresh, decreasing to 0 at threshold)
    let score = 100 * (1 - (ageInHours / threshold));
    score = Math.max(0, Math.min(100, score)); // Clamp between 0-100
    
    // Determine recency category
    let recency: RecencyCategory;
    if (ageInHours < 1) {
      recency = RecencyCategory.BREAKING;
    } else if (ageInHours < 6) {
      recency = RecencyCategory.VERY_RECENT;
    } else if (ageInHours < 24) {
      recency = RecencyCategory.RECENT;
    } else if (ageInHours < 48) {
      recency = RecencyCategory.TODAY;
    } else if (ageInHours < 168) { // 7 days
      recency = RecencyCategory.THIS_WEEK;
    } else if (ageInHours < 720) { // 30 days
      recency = RecencyCategory.THIS_MONTH;
    } else {
      recency = RecencyCategory.OLDER;
    }
    
    return {
      score,
      age: ageInHours,
      recency
    };
  }
  
  /**
   * Calculate Query Deserves Freshness (QDF) score
   * @param query Search query
   * @param contentItems Content items
   * @returns QDF score between 0-1
   */
  static calculateQDFScore(query: string, contentItems: ContentItem[]): number {
    if (!contentItems.length) return 0;
    
    // Count items in each recency category
    const recencyCounts = {
      [RecencyCategory.BREAKING]: 0,
      [RecencyCategory.VERY_RECENT]: 0,
      [RecencyCategory.RECENT]: 0,
      [RecencyCategory.TODAY]: 0,
      [RecencyCategory.THIS_WEEK]: 0,
      [RecencyCategory.THIS_MONTH]: 0,
      [RecencyCategory.OLDER]: 0
    };
    
    // Calculate freshness scores for all items
    const freshnessThresholds = {
      [ContentType.NEWS]: 24,
      [ContentType.SOCIAL]: 6,
      [ContentType.BLOG]: 72,
      [ContentType.FORUM]: 48,
      [ContentType.ACADEMIC]: 720,
      [ContentType.SERP]: 168,
      [ContentType.OTHER]: 168
    };
    
    contentItems.forEach(item => {
      const freshness = FreshnessUtils.calculateFreshnessScore(item, freshnessThresholds);
      recencyCounts[freshness.recency]++;
    });
    
    // Calculate QDF score based on recency distribution
    // Higher weight for more recent content
    const totalItems = contentItems.length;
    const qdfScore = (
      (recencyCounts[RecencyCategory.BREAKING] * 1.0) +
      (recencyCounts[RecencyCategory.VERY_RECENT] * 0.8) +
      (recencyCounts[RecencyCategory.RECENT] * 0.6) +
      (recencyCounts[RecencyCategory.TODAY] * 0.4) +
      (recencyCounts[RecencyCategory.THIS_WEEK] * 0.2) +
      (recencyCounts[RecencyCategory.THIS_MONTH] * 0.1)
    ) / totalItems;
    
    return Math.min(1, qdfScore);
  }
  
  /**
   * Create an aggregated content item with freshness score
   * @param item Original content item
   * @param freshnessThresholds Freshness thresholds in hours for each content type
   * @param relevanceScore Optional relevance score (0-100)
   * @returns Aggregated content item with freshness score
   */
  static createAggregatedItem(
    item: ContentItem,
    freshnessThresholds: Record<ContentType, number>,
    relevanceScore: number = 50
  ): AggregatedContentItem {
    const freshness = FreshnessUtils.calculateFreshnessScore(item, freshnessThresholds);
    
    return {
      ...item,
      freshness,
      relevanceScore,
      originalItem: item
    };
  }
  
  /**
   * Sort aggregated content items based on sort method
   * @param items Aggregated content items
   * @param sortBy Sort method
   * @returns Sorted items
   */
  static sortAggregatedItems(
    items: AggregatedContentItem[],
    sortBy: 'freshness' | 'relevance' | 'engagement' | 'mixed' = 'mixed'
  ): AggregatedContentItem[] {
    switch (sortBy) {
      case 'freshness':
        return items.sort((a, b) => b.freshness.score - a.freshness.score);
        
      case 'relevance':
        return items.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
      case 'engagement':
        return items.sort((a, b) => {
          const aEngagement = a.contentType === ContentType.SOCIAL ? 
            (a as any).engagement?.totalEngagement || 0 : 0;
          const bEngagement = b.contentType === ContentType.SOCIAL ? 
            (b as any).engagement?.totalEngagement || 0 : 0;
          return bEngagement - aEngagement;
        });
        
      case 'mixed':
      default:
        // Combined score of freshness (60%) and relevance (40%)
        return items.sort((a, b) => {
          const scoreA = (a.freshness.score * 0.6) + (a.relevanceScore * 0.4);
          const scoreB = (b.freshness.score * 0.6) + (b.relevanceScore * 0.4);
          return scoreB - scoreA;
        });
    }
  }
  
  /**
   * Remove duplicate content items based on URL
   * @param items Content items
   * @returns Deduplicated items
   */
  static deduplicateItems(items: ContentItem[]): ContentItem[] {
    const uniqueUrls = new Set<string>();
    return items.filter(item => {
      if (uniqueUrls.has(item.url)) {
        return false;
      }
      uniqueUrls.add(item.url);
      return true;
    });
  }
}
