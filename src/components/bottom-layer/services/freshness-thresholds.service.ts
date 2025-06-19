import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ContentType } from '../../../common/interfaces/content.interfaces';
import { FreshnessThreshold, Segment } from '../interfaces/freshness.interfaces';

/**
 * Service for managing freshness thresholds for different content types
 */
@Injectable()
export class FreshnessThresholdsService {
  private readonly logger = new Logger(FreshnessThresholdsService.name);
  private thresholds: FreshnessThreshold[] = [];
  
  constructor(private configService: ConfigService) {
    this.initializeThresholds();
  }
  
  /**
   * Initialize default freshness thresholds for different content types
   */
  private initializeThresholds(): void {
    // B2B thresholds - generally longer freshness periods
    this.thresholds.push(
      { contentType: 'news', segment: Segment.B2B, maxAgeDays: 14, minFreshnessScore: 70 },
      { contentType: 'blog_post', segment: Segment.B2B, maxAgeDays: 90, minFreshnessScore: 60 },
      { contentType: 'white_paper', segment: Segment.B2B, maxAgeDays: 365, minFreshnessScore: 50 },
      { contentType: 'case_study', segment: Segment.B2B, maxAgeDays: 365, minFreshnessScore: 55 },
      { contentType: 'research_paper', segment: Segment.B2B, maxAgeDays: 730, minFreshnessScore: 45 },
      { contentType: 'ebook', segment: Segment.B2B, maxAgeDays: 365, minFreshnessScore: 55 },
      { contentType: 'article', segment: Segment.B2B, maxAgeDays: 180, minFreshnessScore: 60 },
      { contentType: 'video', segment: Segment.B2B, maxAgeDays: 365, minFreshnessScore: 55 },
      { contentType: 'podcast', segment: Segment.B2B, maxAgeDays: 180, minFreshnessScore: 60 },
      { contentType: 'default', segment: Segment.B2B, maxAgeDays: 180, minFreshnessScore: 60 }
    );
    
    // B2C thresholds - generally shorter freshness periods
    this.thresholds.push(
      { contentType: 'news', segment: Segment.B2C, maxAgeDays: 7, minFreshnessScore: 80 },
      { contentType: 'blog_post', segment: Segment.B2C, maxAgeDays: 30, minFreshnessScore: 70 },
      { contentType: 'article', segment: Segment.B2C, maxAgeDays: 60, minFreshnessScore: 65 },
      { contentType: 'social_post', segment: Segment.B2C, maxAgeDays: 3, minFreshnessScore: 85 },
      { contentType: 'review', segment: Segment.B2C, maxAgeDays: 90, minFreshnessScore: 60 },
      { contentType: 'video', segment: Segment.B2C, maxAgeDays: 90, minFreshnessScore: 65 },
      { contentType: 'tutorial', segment: Segment.B2C, maxAgeDays: 180, minFreshnessScore: 55 },
      { contentType: 'guide', segment: Segment.B2C, maxAgeDays: 180, minFreshnessScore: 55 },
      { contentType: 'product_page', segment: Segment.B2C, maxAgeDays: 90, minFreshnessScore: 70 },
      { contentType: 'default', segment: Segment.B2C, maxAgeDays: 60, minFreshnessScore: 70 }
    );
    
    this.logger.log(`Initialized ${this.thresholds.length} freshness thresholds`);
  }
  
  /**
   * Get freshness threshold for a specific content type and segment
   * @param contentType The content type
   * @param segment The segment (b2b or b2c)
   * @returns The freshness threshold
   */
  getFreshnessThreshold(contentType: ContentType, segment: Segment): FreshnessThreshold {
    // Find specific threshold for this content type and segment
    const threshold = this.thresholds.find(t => 
      t.contentType === contentType && t.segment === segment
    );
    
    // If not found, return default threshold for the segment
    if (!threshold) {
      const defaultThreshold = this.thresholds.find(t => 
        t.contentType === 'default' && t.segment === segment
      );
      
      return defaultThreshold || {
        contentType: 'default',
        segment,
        maxAgeDays: segment === Segment.B2B ? 180 : 60,
        minFreshnessScore: segment === Segment.B2B ? 60 : 70
      };
    }
    
    return threshold;
  }
  
  /**
   * Adjust freshness threshold based on QDF score
   * @param threshold Base threshold
   * @param qdfScore Query Deserves Freshness score (0-1)
   * @returns Adjusted threshold
   */
  adjustThresholdByQDF(threshold: FreshnessThreshold, qdfScore: number): FreshnessThreshold {
    // Higher QDF score means topic deserves more freshness, so reduce max age
    const qdfFactor = qdfScore * 2; // Scale QDF score to have more impact (0-2 range)
    
    const adjustedMaxAgeDays = Math.max(
      1, // Minimum 1 day
      Math.round(threshold.maxAgeDays / qdfFactor)
    );
    
    const adjustedMinFreshnessScore = Math.min(
      95, // Maximum 95%
      Math.round(threshold.minFreshnessScore + (qdfScore * 20))
    );
    
    return {
      ...threshold,
      maxAgeDays: adjustedMaxAgeDays,
      minFreshnessScore: adjustedMinFreshnessScore
    };
  }
  
  /**
   * Add or update a custom freshness threshold
   * @param threshold The threshold to add or update
   */
  setCustomThreshold(threshold: FreshnessThreshold): void {
    // Remove existing threshold for this content type and segment
    this.thresholds = this.thresholds.filter(t => 
      !(t.contentType === threshold.contentType && t.segment === threshold.segment)
    );
    
    // Add new threshold
    this.thresholds.push(threshold);
    this.logger.log(`Set custom threshold for ${threshold.contentType} (${threshold.segment}): ${threshold.maxAgeDays} days`);
  }
  
  /**
   * Get all thresholds
   * @returns All freshness thresholds
   */
  getAllThresholds(): FreshnessThreshold[] {
    return [...this.thresholds];
  }
}
