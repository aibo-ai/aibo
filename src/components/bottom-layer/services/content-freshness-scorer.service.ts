import { Injectable, Logger } from '@nestjs/common';
import { FreshContentItem, FreshnessLevel, Segment } from '../interfaces/freshness.interfaces';
import { ContentType } from '../../../common/interfaces/content.interfaces';

/**
 * Service for calculating freshness scores for content items
 */
@Injectable()
export class ContentFreshnessScorer {
  private readonly logger = new Logger(ContentFreshnessScorer.name);
  
  /**
   * Calculate freshness score for a content item
   * @param content The content item to score
   * @param segment The target segment (b2b or b2c)
   * @returns Freshness score between 0-100
   */
  calculateFreshnessScore(content: FreshContentItem, segment: Segment): number {
    try {
      // Calculate content age in days
      const publishDate = new Date(content.publishedDate);
      const currentDate = new Date();
      const contentAgeInDays = Math.max(0, Math.floor(
        (currentDate.getTime() - publishDate.getTime()) / (1000 * 60 * 60 * 24)
      ));
      
      // Different freshness calculation based on segment
      if (segment === Segment.B2B) {
        return this.calculateB2BFreshnessScore(content, contentAgeInDays);
      } else {
        return this.calculateB2CFreshnessScore(content, contentAgeInDays);
      }
    } catch (error) {
      this.logger.error(`Error calculating freshness score: ${error.message}`);
      return 50; // Default moderate score on error
    }
  }
  
  /**
   * Calculate freshness score for B2B content
   * @param content The content item
   * @param contentAgeInDays Age of content in days
   * @returns Freshness score between 0-100
   */
  private calculateB2BFreshnessScore(content: FreshContentItem, contentAgeInDays: number): number {
    // B2B values accuracy and comprehensiveness over pure recency
    // Content type affects the age decay factor
    const ageDecayFactor = this.getAgeDecayFactor(content.contentType, Segment.B2B);
    
    // Calculate age score (inverse relationship with age)
    const maxAgeDays = this.getMaxAgeDays(content.contentType, Segment.B2B);
    const ageScore = Math.max(0, 1 - (contentAgeInDays / maxAgeDays));
    
    // Estimate other factors based on content properties
    const comprehensivenessScore = this.estimateComprehensiveness(content);
    const authorityScore = this.estimateAuthority(content);
    
    // Calculate weighted score
    return Math.min(100, Math.round(
      (ageDecayFactor * ageScore * 100) +
      (0.3 * comprehensivenessScore) +
      (0.3 * authorityScore)
    ));
  }
  
  /**
   * Calculate freshness score for B2C content
   * @param content The content item
   * @param contentAgeInDays Age of content in days
   * @returns Freshness score between 0-100
   */
  private calculateB2CFreshnessScore(content: FreshContentItem, contentAgeInDays: number): number {
    // B2C values recency and engagement more heavily
    // Content type affects the age decay factor
    const ageDecayFactor = this.getAgeDecayFactor(content.contentType, Segment.B2C);
    
    // Calculate age score (inverse relationship with age)
    const maxAgeDays = this.getMaxAgeDays(content.contentType, Segment.B2C);
    const ageScore = Math.max(0, 1 - (contentAgeInDays / maxAgeDays));
    
    // Estimate other factors based on content properties
    const engagementScore = this.estimateEngagement(content);
    const relevanceScore = content.relevanceScore || 70;
    
    // Calculate weighted score
    return Math.min(100, Math.round(
      (ageDecayFactor * ageScore * 100) +
      (0.3 * engagementScore) +
      (0.1 * relevanceScore)
    ));
  }
  
  /**
   * Get age decay factor based on content type and segment
   * @param contentType The content type
   * @param segment The segment
   * @returns Age decay factor between 0-1
   */
  private getAgeDecayFactor(contentType: ContentType | string, segment: Segment): number {
    // How much age affects freshness score
    if (segment === Segment.B2B) {
      switch (contentType) {
        case 'news':
          return 0.7;
        case 'blog_post':
          return 0.5;
        case 'white_paper':
        case 'research_paper':
          return 0.3;
        case 'case_study':
          return 0.4;
        default:
          return 0.5;
      }
    } else {
      switch (contentType) {
        case 'news':
        case 'social_post':
          return 0.8;
        case 'blog_post':
          return 0.7;
        case 'review':
          return 0.6;
        case 'tutorial':
        case 'guide':
          return 0.4;
        default:
          return 0.6;
      }
    }
  }
  
  /**
   * Get maximum age in days based on content type and segment
   * @param contentType The content type
   * @param segment The segment
   * @returns Maximum age in days
   */
  private getMaxAgeDays(contentType: ContentType | string, segment: Segment): number {
    if (segment === Segment.B2B) {
      switch (contentType) {
        case 'news':
          return 30;
        case 'blog_post':
          return 180;
        case 'white_paper':
        case 'research_paper':
          return 730; // 2 years
        case 'case_study':
          return 365;
        default:
          return 180;
      }
    } else {
      switch (contentType) {
        case 'news':
          return 14;
        case 'social_post':
          return 7;
        case 'blog_post':
          return 90;
        case 'review':
          return 180;
        case 'tutorial':
        case 'guide':
          return 365;
        default:
          return 90;
      }
    }
  }
  
  /**
   * Estimate comprehensiveness of content (for B2B)
   * @param content The content item
   * @returns Comprehensiveness score between 0-100
   */
  private estimateComprehensiveness(content: FreshContentItem): number {
    // In a real implementation, this would analyze content length, structure, etc.
    // For now, use a simple heuristic based on content type
    switch (content.contentType) {
      case 'white_paper':
      case 'research_paper':
        return 85;
      case 'case_study':
        return 80;
      case 'blog_post':
        return 65;
      case 'news':
        return 50;
      default:
        return 60;
    }
  }
  
  /**
   * Estimate authority of content (for B2B)
   * @param content The content item
   * @returns Authority score between 0-100
   */
  private estimateAuthority(content: FreshContentItem): number {
    // In a real implementation, this would analyze source reputation, author, etc.
    // For now, use domain as a simple proxy for authority
    const domain = content.domain || this.extractDomain(content.url);
    
    // List of high-authority domains (simplified)
    const highAuthorityDomains = [
      'harvard.edu', 'mit.edu', 'stanford.edu',
      'mckinsey.com', 'gartner.com', 'forrester.com',
      'hbr.org', 'wsj.com', 'economist.com',
      'techcrunch.com', 'wired.com', 'bloomberg.com'
    ];
    
    if (highAuthorityDomains.some(d => domain.includes(d))) {
      return 90;
    }
    
    // Default moderate authority
    return 60;
  }
  
  /**
   * Estimate engagement of content (for B2C)
   * @param content The content item
   * @returns Engagement score between 0-100
   */
  private estimateEngagement(content: FreshContentItem): number {
    // Use social metrics if available
    if (content.socialMetrics) {
      const { shares, likes, comments, engagement } = content.socialMetrics;
      
      if (engagement !== undefined) {
        return Math.min(100, engagement);
      }
      
      if (shares !== undefined || likes !== undefined || comments !== undefined) {
        const shareScore = shares ? Math.min(100, shares / 10) : 0;
        const likeScore = likes ? Math.min(100, likes / 50) : 0;
        const commentScore = comments ? Math.min(100, comments * 2) : 0;
        
        // Calculate weighted average of available metrics
        let totalWeight = 0;
        let totalScore = 0;
        
        if (shares !== undefined) {
          totalWeight += 0.4;
          totalScore += 0.4 * shareScore;
        }
        
        if (likes !== undefined) {
          totalWeight += 0.3;
          totalScore += 0.3 * likeScore;
        }
        
        if (comments !== undefined) {
          totalWeight += 0.3;
          totalScore += 0.3 * commentScore;
        }
        
        return totalWeight > 0 ? totalScore / totalWeight : 50;
      }
    }
    
    // Default moderate engagement
    return 50;
  }
  
  /**
   * Extract domain from URL
   * @param url The URL to extract domain from
   * @returns Domain name
   */
  private extractDomain(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.startsWith('www.') ? hostname.substring(4) : hostname;
    } catch (error) {
      return '';
    }
  }
  
  /**
   * Get freshness level based on freshness score
   * @param freshnessScore The freshness score (0-100)
   * @returns Freshness level
   */
  getFreshnessLevel(freshnessScore: number): FreshnessLevel {
    if (freshnessScore >= 80) {
      return FreshnessLevel.VERY_FRESH;
    } else if (freshnessScore >= 60) {
      return FreshnessLevel.FRESH;
    } else if (freshnessScore >= 40) {
      return FreshnessLevel.MODERATE;
    } else {
      return FreshnessLevel.NEEDS_UPDATING;
    }
  }
  
  /**
   * Generate freshness indicators based on freshness level
   * @param freshnessLevel The freshness level
   * @param publishedDate The published date of the content
   * @returns Freshness indicators
   */
  generateFreshnessIndicators(freshnessLevel: FreshnessLevel, publishedDate: string): any {
    const recencyStatement = this.getRecencyStatement(freshnessLevel);
    const lastUpdatedDisplay = `Last updated: ${new Date(publishedDate).toLocaleDateString()}`;
    const freshnessSignals = this.getFreshnessSignals(freshnessLevel);
    
    return {
      recencyStatement,
      lastUpdatedDisplay,
      freshnessSignals
    };
  }
  
  /**
   * Get recency statement based on freshness level
   * @param freshnessLevel The freshness level
   * @returns Recency statement
   */
  private getRecencyStatement(freshnessLevel: FreshnessLevel): string {
    switch (freshnessLevel) {
      case FreshnessLevel.VERY_FRESH:
        return 'This content contains the most recent data and trends available.';
      case FreshnessLevel.FRESH:
        return 'This content is up-to-date with current industry standards.';
      case FreshnessLevel.MODERATE:
        return 'This content contains mostly current information with some updates pending.';
      case FreshnessLevel.NEEDS_UPDATING:
      default:
        return 'This content may contain information that needs updating.';
    }
  }
  
  /**
   * Get freshness signals based on freshness level
   * @param freshnessLevel The freshness level
   * @returns Array of freshness signals
   */
  private getFreshnessSignals(freshnessLevel: FreshnessLevel): string[] {
    switch (freshnessLevel) {
      case FreshnessLevel.VERY_FRESH:
        return [
          'Includes data from the past week',
          'References latest industry developments',
          'Incorporates recent statistical updates',
          'Mentions current market conditions',
        ];
      case FreshnessLevel.FRESH:
        return [
          'Includes recent industry standards',
          'References data from the current quarter',
          'Aligns with current best practices',
          'Reflects present market conditions',
        ];
      case FreshnessLevel.MODERATE:
        return [
          'Contains some recent references',
          'Includes partially updated statistics',
          'Presents some current methodologies',
          'References some recent developments',
        ];
      case FreshnessLevel.NEEDS_UPDATING:
      default:
        return [
          'May contain outdated statistics',
          'Could benefit from recent examples',
          'Should incorporate newer methodologies',
          'Needs alignment with current trends',
        ];
    }
  }
}
