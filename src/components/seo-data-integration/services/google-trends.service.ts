import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TrendData {
  keyword: string;
  interest: number; // 0-100
  relatedQueries: string[];
  risingQueries: string[];
  geoData: Array<{
    location: string;
    interest: number;
  }>;
  timelineData: Array<{
    date: string;
    interest: number;
  }>;
}

export interface TrendRequest {
  keywords: string[];
  timeframe?: string; // 'now 1-H', 'now 4-H', 'now 1-d', 'now 7-d', 'today 1-m', 'today 3-m', 'today 12-m', 'today 5-y'
  geo?: string; // Country code like 'US', 'IN', 'GB'
  category?: number; // Google Trends category ID
}

@Injectable()
export class GoogleTrendsService {
  private readonly logger = new Logger(GoogleTrendsService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Get trending data for keywords
   */
  async getTrends(request: TrendRequest): Promise<TrendData[]> {
    try {
      this.logger.log(`Getting trends for keywords: ${request.keywords.join(', ')}`);

      // In production, this would use Google Trends API or a service like SerpAPI
      // For now, we'll simulate the data
      const trendsData: TrendData[] = request.keywords.map(keyword => ({
        keyword,
        interest: Math.floor(Math.random() * 100) + 1,
        relatedQueries: this.generateRelatedQueries(keyword),
        risingQueries: this.generateRisingQueries(keyword),
        geoData: this.generateGeoData(keyword),
        timelineData: this.generateTimelineData(keyword)
      }));

      return trendsData;

    } catch (error) {
      this.logger.error('Error getting Google Trends data:', error);
      throw error;
    }
  }

  /**
   * Get trending keywords for a category
   */
  async getTrendingKeywords(category?: string, geo?: string): Promise<string[]> {
    try {
      this.logger.log(`Getting trending keywords for category: ${category || 'all'}, geo: ${geo || 'global'}`);

      // Simulate trending keywords based on category
      const trendingKeywords = this.generateTrendingKeywords(category);
      
      return trendingKeywords;

    } catch (error) {
      this.logger.error('Error getting trending keywords:', error);
      throw error;
    }
  }

  /**
   * Compare keywords performance
   */
  async compareKeywords(keywords: string[], timeframe?: string, geo?: string): Promise<{
    comparison: Array<{
      keyword: string;
      averageInterest: number;
      peakInterest: number;
      trend: 'rising' | 'falling' | 'stable';
    }>;
    winner: string;
    insights: string[];
  }> {
    try {
      this.logger.log(`Comparing keywords: ${keywords.join(', ')}`);

      const comparison = keywords.map(keyword => {
        const averageInterest = Math.floor(Math.random() * 80) + 20;
        const peakInterest = averageInterest + Math.floor(Math.random() * 20);
        const trendValue = Math.random();
        
        let trend: 'rising' | 'falling' | 'stable';
        if (trendValue > 0.6) trend = 'rising';
        else if (trendValue < 0.4) trend = 'falling';
        else trend = 'stable';

        return {
          keyword,
          averageInterest,
          peakInterest,
          trend
        };
      });

      // Find winner (highest average interest)
      const winner = comparison.reduce((prev, current) => 
        prev.averageInterest > current.averageInterest ? prev : current
      ).keyword;

      // Generate insights
      const insights = this.generateInsights(comparison);

      return {
        comparison,
        winner,
        insights
      };

    } catch (error) {
      this.logger.error('Error comparing keywords:', error);
      throw error;
    }
  }

  /**
   * Get seasonal trends for keywords
   */
  async getSeasonalTrends(keywords: string[]): Promise<Array<{
    keyword: string;
    seasonality: {
      peak_months: string[];
      low_months: string[];
      seasonal_score: number; // 0-100, higher means more seasonal
    };
    yearly_trend: 'growing' | 'declining' | 'stable';
  }>> {
    try {
      this.logger.log(`Getting seasonal trends for: ${keywords.join(', ')}`);

      return keywords.map(keyword => ({
        keyword,
        seasonality: {
          peak_months: this.generatePeakMonths(),
          low_months: this.generateLowMonths(),
          seasonal_score: Math.floor(Math.random() * 100)
        },
        yearly_trend: this.generateYearlyTrend()
      }));

    } catch (error) {
      this.logger.error('Error getting seasonal trends:', error);
      throw error;
    }
  }

  /**
   * Get related topics and queries
   */
  async getRelatedTopics(keyword: string): Promise<{
    relatedTopics: Array<{
      topic: string;
      relevance: number;
      rising: boolean;
    }>;
    relatedQueries: Array<{
      query: string;
      relevance: number;
      rising: boolean;
    }>;
  }> {
    try {
      this.logger.log(`Getting related topics for: ${keyword}`);

      return {
        relatedTopics: this.generateRelatedTopics(keyword),
        relatedQueries: this.generateRelatedQueriesDetailed(keyword)
      };

    } catch (error) {
      this.logger.error('Error getting related topics:', error);
      throw error;
    }
  }

  // Helper methods for generating mock data
  private generateRelatedQueries(keyword: string): string[] {
    const templates = [
      `${keyword} tutorial`,
      `${keyword} guide`,
      `${keyword} tips`,
      `${keyword} best practices`,
      `${keyword} examples`,
      `how to ${keyword}`,
      `${keyword} vs`,
      `${keyword} benefits`,
      `${keyword} cost`,
      `${keyword} reviews`
    ];
    
    return templates.slice(0, 5);
  }

  private generateRisingQueries(keyword: string): string[] {
    const templates = [
      `${keyword} 2024`,
      `${keyword} AI`,
      `${keyword} automation`,
      `${keyword} trends`,
      `${keyword} future`
    ];
    
    return templates.slice(0, 3);
  }

  private generateGeoData(keyword: string): Array<{ location: string; interest: number }> {
    const locations = ['United States', 'India', 'United Kingdom', 'Canada', 'Australia', 'Germany', 'France'];
    
    return locations.map(location => ({
      location,
      interest: Math.floor(Math.random() * 100) + 1
    }));
  }

  private generateTimelineData(keyword: string): Array<{ date: string; interest: number }> {
    const data = [];
    const now = new Date();
    
    for (let i = 30; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        interest: Math.floor(Math.random() * 100) + 1
      });
    }
    
    return data;
  }

  private generateTrendingKeywords(category?: string): string[] {
    const keywordSets = {
      technology: ['AI', 'machine learning', 'blockchain', 'cloud computing', 'cybersecurity'],
      business: ['digital transformation', 'remote work', 'e-commerce', 'startup', 'entrepreneurship'],
      health: ['mental health', 'fitness', 'nutrition', 'wellness', 'meditation'],
      default: ['trending', 'viral', 'popular', 'hot topics', 'breaking news']
    };
    
    return keywordSets[category] || keywordSets.default;
  }

  private generateInsights(comparison: any[]): string[] {
    const insights = [];
    
    const risingKeywords = comparison.filter(k => k.trend === 'rising');
    if (risingKeywords.length > 0) {
      insights.push(`Rising keywords: ${risingKeywords.map(k => k.keyword).join(', ')}`);
    }
    
    const highPerformers = comparison.filter(k => k.averageInterest > 70);
    if (highPerformers.length > 0) {
      insights.push(`High-performing keywords: ${highPerformers.map(k => k.keyword).join(', ')}`);
    }
    
    insights.push('Consider focusing on rising keywords for future content strategy');
    
    return insights;
  }

  private generatePeakMonths(): string[] {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return months.slice(0, Math.floor(Math.random() * 3) + 1);
  }

  private generateLowMonths(): string[] {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                   'July', 'August', 'September', 'October', 'November', 'December'];
    
    return months.slice(0, Math.floor(Math.random() * 2) + 1);
  }

  private generateYearlyTrend(): 'growing' | 'declining' | 'stable' {
    const trends = ['growing', 'declining', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)] as any;
  }

  private generateRelatedTopics(keyword: string): Array<{ topic: string; relevance: number; rising: boolean }> {
    const topics = [
      `${keyword} industry`,
      `${keyword} market`,
      `${keyword} technology`,
      `${keyword} solutions`,
      `${keyword} services`
    ];
    
    return topics.map(topic => ({
      topic,
      relevance: Math.floor(Math.random() * 100) + 1,
      rising: Math.random() > 0.5
    }));
  }

  private generateRelatedQueriesDetailed(keyword: string): Array<{ query: string; relevance: number; rising: boolean }> {
    const queries = this.generateRelatedQueries(keyword);
    
    return queries.map(query => ({
      query,
      relevance: Math.floor(Math.random() * 100) + 1,
      rising: Math.random() > 0.5
    }));
  }

  /**
   * Health check for Google Trends service
   */
  async healthCheck(): Promise<{ status: string; available: boolean }> {
    try {
      // In production, this would test the actual API connection
      return {
        status: 'healthy',
        available: true
      };
    } catch (error) {
      this.logger.error('Google Trends health check failed:', error);
      return {
        status: 'unhealthy',
        available: false
      };
    }
  }
}
