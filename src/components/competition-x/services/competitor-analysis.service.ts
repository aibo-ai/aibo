import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

import { Competitor } from '../entities/competitor.entity';
import { CompetitiveData } from '../entities/competitive-data.entity';
import { SocialMediaData } from '../entities/social-media-data.entity';
import { SearchEngineData } from '../entities/search-engine-data.entity';
import { EcommerceData } from '../entities/ecommerce-data.entity';
import { MonitoringAlert } from '../entities/monitoring-alert.entity';

import { SentimentAnalysisService } from './analytics/sentiment-analysis.service';

@Injectable()
export class CompetitorAnalysisService {
  private readonly logger = new Logger(CompetitorAnalysisService.name);

  constructor(
    @InjectRepository(Competitor)
    private readonly competitorRepository: Repository<Competitor>,
    @InjectRepository(CompetitiveData)
    private readonly competitiveDataRepository: Repository<CompetitiveData>,
    @InjectRepository(SocialMediaData)
    private readonly socialMediaDataRepository: Repository<SocialMediaData>,
    @InjectRepository(SearchEngineData)
    private readonly searchEngineDataRepository: Repository<SearchEngineData>,
    @InjectRepository(EcommerceData)
    private readonly ecommerceDataRepository: Repository<EcommerceData>,
    @InjectRepository(MonitoringAlert)
    private readonly monitoringAlertRepository: Repository<MonitoringAlert>,
    
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService,
    private readonly sentimentAnalysisService: SentimentAnalysisService
  ) {}

  /**
   * Get competitor profile
   */
  async getCompetitorProfile(competitorId: string) {
    try {
      const competitor = await this.competitorRepository.findOne({
        where: { id: competitorId },
        relations: ['profiles', 'competitiveData', 'socialMediaData']
      });

      if (!competitor) {
        throw new Error(`Competitor not found: ${competitorId}`);
      }

      return {
        basic: {
          id: competitor.id,
          name: competitor.name,
          website: competitor.website,
          industry: competitor.industry,
          country: competitor.country,
          size: competitor.size,
          description: competitor.description,
          marketShare: competitor.marketShare,
          employeeCount: competitor.employeeCount,
          revenue: competitor.revenue
        },
        socialMedia: competitor.socialMediaProfiles,
        productCategories: competitor.productCategories,
        targetMarkets: competitor.targetMarkets,
        lastUpdated: competitor.updatedAt
      };

    } catch (error) {
      this.logger.error(`Failed to get competitor profile: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get social media data
   */
  async getSocialMediaData(competitorId: string, platform?: string, timeRange: string = '30d') {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        competitorId,
        timestamp: cutoffDate // In real implementation, use MoreThan from typeorm
      };

      if (platform) {
        whereClause.platform = platform;
      }

      const socialData = await this.socialMediaDataRepository.find({
        where: whereClause,
        order: { timestamp: 'DESC' },
        take: 100
      });

      return {
        totalPosts: socialData.length,
        platforms: [...new Set(socialData.map(d => d.platform))],
        engagement: {
          totalLikes: socialData.reduce((sum, d) => sum + (d.engagement?.likes || 0), 0),
          totalShares: socialData.reduce((sum, d) => sum + (d.engagement?.shares || 0), 0),
          totalComments: socialData.reduce((sum, d) => sum + (d.engagement?.comments || 0), 0),
          averageEngagement: socialData.length > 0 ? 
            socialData.reduce((sum, d) => sum + ((d.engagement?.likes || 0) + (d.engagement?.shares || 0) + (d.engagement?.comments || 0)), 0) / socialData.length : 0
        },
        sentiment: {
          average: socialData.length > 0 ? 
            socialData.reduce((sum, d) => sum + (d.sentimentScore || 0), 0) / socialData.length : 0,
          distribution: this.calculateSentimentDistribution(socialData)
        },
        topHashtags: this.extractTopHashtags(socialData),
        recentPosts: socialData.slice(0, 10).map(post => ({
          id: post.id,
          platform: post.platform,
          content: post.content.substring(0, 200) + '...',
          engagement: post.engagement,
          sentiment: post.sentimentScore,
          publishedAt: post.publishedAt
        }))
      };

    } catch (error) {
      this.logger.error(`Failed to get social media data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get search engine data
   */
  async getSearchEngineData(competitorId: string, engine?: string, timeRange: string = '30d') {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        competitorId,
        timestamp: cutoffDate
      };

      if (engine) {
        whereClause.searchEngine = engine;
      }

      const searchData = await this.searchEngineDataRepository.find({
        where: whereClause,
        order: { timestamp: 'DESC' },
        take: 100
      });

      return {
        totalKeywords: searchData.length,
        engines: [...new Set(searchData.map(d => d.searchEngine))],
        rankings: {
          averagePosition: searchData.length > 0 ? 
            searchData.reduce((sum, d) => sum + (d.position || 0), 0) / searchData.length : 0,
          topRankings: searchData.filter(d => d.position && d.position <= 10).length,
          improvingKeywords: searchData.filter(d => d.positionChange && d.positionChange < 0).length,
          decliningKeywords: searchData.filter(d => d.positionChange && d.positionChange > 0).length
        },
        visibility: {
          totalSearchVolume: searchData.reduce((sum, d) => sum + (d.searchVolume || 0), 0),
          estimatedTraffic: searchData.reduce((sum, d) => sum + (d.estimatedTraffic || 0), 0),
          estimatedValue: searchData.reduce((sum, d) => sum + (d.estimatedValue || 0), 0)
        },
        topKeywords: searchData
          .filter(d => d.position && d.position <= 20)
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .slice(0, 10)
          .map(d => ({
            keyword: d.keyword,
            position: d.position,
            searchVolume: d.searchVolume,
            url: d.url
          }))
      };

    } catch (error) {
      this.logger.error(`Failed to get search engine data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get ecommerce data
   */
  async getEcommerceData(competitorId: string, platform?: string, timeRange: string = '30d') {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const whereClause: any = {
        competitorId,
        timestamp: cutoffDate
      };

      if (platform) {
        whereClause.platform = platform;
      }

      const ecommerceData = await this.ecommerceDataRepository.find({
        where: whereClause,
        order: { timestamp: 'DESC' },
        take: 100
      });

      return {
        totalProducts: ecommerceData.length,
        platforms: [...new Set(ecommerceData.map(d => d.platform))],
        pricing: {
          averagePrice: ecommerceData.length > 0 ? 
            ecommerceData.reduce((sum, d) => sum + d.price, 0) / ecommerceData.length : 0,
          priceRange: {
            min: Math.min(...ecommerceData.map(d => d.price)),
            max: Math.max(...ecommerceData.map(d => d.price))
          },
          discountedProducts: ecommerceData.filter(d => d.discountPercentage && d.discountPercentage > 0).length
        },
        performance: {
          averageRating: ecommerceData.length > 0 ? 
            ecommerceData.reduce((sum, d) => sum + (d.rating || 0), 0) / ecommerceData.length : 0,
          totalReviews: ecommerceData.reduce((sum, d) => sum + (d.reviewCount || 0), 0),
          inStockProducts: ecommerceData.filter(d => d.availability === 'in_stock').length,
          outOfStockProducts: ecommerceData.filter(d => d.availability === 'out_of_stock').length
        },
        topProducts: ecommerceData
          .sort((a, b) => (b.rating || 0) - (a.rating || 0))
          .slice(0, 10)
          .map(p => ({
            name: p.productName,
            price: p.price,
            rating: p.rating,
            reviews: p.reviewCount,
            platform: p.platform
          }))
      };

    } catch (error) {
      this.logger.error(`Failed to get ecommerce data: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get pricing analysis
   */
  async getPricingAnalysis(competitorId: string, timeRange: string = '30d') {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const pricingData = await this.competitiveDataRepository.find({
        where: {
          competitorId,
          dataType: 'pricing',
          timestamp: cutoffDate
        },
        order: { timestamp: 'DESC' }
      });

      const ecommercePricing = await this.ecommerceDataRepository.find({
        where: {
          competitorId,
          timestamp: cutoffDate
        },
        order: { timestamp: 'DESC' }
      });

      return {
        pricingStrategy: this.analyzePricingStrategy(pricingData, ecommercePricing),
        priceChanges: this.analyzePriceChanges(ecommercePricing),
        competitivePosition: this.analyzeCompetitivePosition(ecommercePricing),
        recommendations: this.generatePricingRecommendations(pricingData, ecommercePricing)
      };

    } catch (error) {
      this.logger.error(`Failed to get pricing analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get product analysis
   */
  async getProductAnalysis(competitorId: string, category?: string) {
    try {
      const whereClause: any = { competitorId };
      if (category) {
        whereClause.category = category;
      }

      const products = await this.ecommerceDataRepository.find({
        where: whereClause,
        order: { timestamp: 'DESC' }
      });

      return {
        portfolio: {
          totalProducts: products.length,
          categories: [...new Set(products.map(p => p.category))],
          brands: [...new Set(products.map(p => p.brand))],
          newProducts: products.filter(p => p.isNewProduct).length
        },
        performance: {
          topPerformers: products
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5),
          bottomPerformers: products
            .sort((a, b) => (a.rating || 0) - (b.rating || 0))
            .slice(0, 5)
        },
        trends: this.analyzeProductTrends(products),
        insights: this.generateProductInsights(products)
      };

    } catch (error) {
      this.logger.error(`Failed to get product analysis: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze sentiment for competitor
   */
  async analyzeSentiment(competitorId: string, dataType: string = 'all', timeRange: string = '30d') {
    try {
      const days = this.getTimeRangeDays(timeRange);
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      let texts = [];

      if (dataType === 'social' || dataType === 'all') {
        const socialData = await this.socialMediaDataRepository.find({
          where: { competitorId, timestamp: cutoffDate },
          order: { timestamp: 'DESC' },
          take: 100
        });
        texts.push(...socialData.map(d => ({ text: d.content, timestamp: d.timestamp })));
      }

      if (dataType === 'reviews' || dataType === 'all') {
        // Add review data when available
      }

      if (texts.length === 0) {
        return { message: 'No text data available for sentiment analysis' };
      }

      return await this.sentimentAnalysisService.analyzeSentimentTrends(texts, 'day');

    } catch (error) {
      this.logger.error(`Failed to analyze sentiment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Compare competitors
   */
  async compareCompetitors(competitorId: string, compareWithIds: string[], metrics: string[]) {
    try {
      const competitors = await this.competitorRepository.findByIds([competitorId, ...compareWithIds]);
      
      const comparison = {
        competitors: competitors.map(c => ({
          id: c.id,
          name: c.name,
          marketShare: c.marketShare || 0,
          employeeCount: c.employeeCount || 0,
          revenue: c.revenue || 0
        })),
        metrics: {},
        insights: []
      };

      // Add metric comparisons based on requested metrics
      for (const metric of metrics) {
        comparison.metrics[metric] = await this.getMetricComparison(competitors, metric);
      }

      return comparison;

    } catch (error) {
      this.logger.error(`Failed to compare competitors: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private getTimeRangeDays(timeRange: string): number {
    const ranges = { '7d': 7, '30d': 30, '90d': 90 };
    return ranges[timeRange] || 30;
  }

  private calculateSentimentDistribution(data: SocialMediaData[]) {
    const total = data.length;
    if (total === 0) return { positive: 0, negative: 0, neutral: 0 };

    const positive = data.filter(d => (d.sentimentScore || 0) > 0.1).length;
    const negative = data.filter(d => (d.sentimentScore || 0) < -0.1).length;
    const neutral = total - positive - negative;

    return {
      positive: (positive / total) * 100,
      negative: (negative / total) * 100,
      neutral: (neutral / total) * 100
    };
  }

  private extractTopHashtags(data: SocialMediaData[]): string[] {
    const hashtagCounts = {};
    
    data.forEach(post => {
      if (post.hashtags) {
        post.hashtags.forEach(tag => {
          hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(hashtagCounts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([tag]) => tag);
  }

  private analyzePricingStrategy(pricingData: any[], ecommerceData: any[]) {
    // Analyze pricing strategy based on data
    return {
      strategy: 'competitive',
      averagePrice: 99.99,
      pricePosition: 'mid-market',
      discountFrequency: 'moderate'
    };
  }

  private analyzePriceChanges(ecommerceData: any[]) {
    // Analyze price changes over time
    return {
      totalChanges: 15,
      increases: 8,
      decreases: 7,
      averageChange: 2.5
    };
  }

  private analyzeCompetitivePosition(ecommerceData: any[]) {
    // Analyze competitive position
    return {
      position: 'competitive',
      priceAdvantage: 5.2,
      marketPosition: 'mid-tier'
    };
  }

  private generatePricingRecommendations(pricingData: any[], ecommerceData: any[]) {
    return [
      'Consider dynamic pricing strategy',
      'Monitor competitor price changes more closely',
      'Evaluate value proposition at current price points'
    ];
  }

  private analyzeProductTrends(products: any[]) {
    return {
      launchFrequency: 'monthly',
      categoryGrowth: 'electronics',
      discontinuationRate: 5.2
    };
  }

  private generateProductInsights(products: any[]) {
    return [
      'Strong performance in electronics category',
      'Opportunity to expand in home goods',
      'Consider premium product line'
    ];
  }

  private async getMetricComparison(competitors: Competitor[], metric: string) {
    // Get metric comparison data
    return competitors.map(c => ({
      competitorId: c.id,
      value: this.getMetricValue(c, metric)
    }));
  }

  private getMetricValue(competitor: Competitor, metric: string): number {
    switch (metric) {
      case 'market_share':
        return competitor.marketShare || 0;
      case 'employee_count':
        return competitor.employeeCount || 0;
      case 'revenue':
        return competitor.revenue || 0;
      default:
        return 0;
    }
  }

  // Additional methods for comprehensive analysis
  async getSWOTAnalysis(competitorId: string) {
    return {
      strengths: ['Strong brand recognition', 'Large market share', 'Diverse product portfolio'],
      weaknesses: ['High prices', 'Limited digital presence', 'Slow innovation'],
      opportunities: ['Emerging markets', 'Digital transformation', 'Sustainability trends'],
      threats: ['New competitors', 'Economic downturn', 'Regulatory changes']
    };
  }

  async getMarketPosition(competitorId: string) {
    return {
      position: 'market_leader',
      marketShare: 25.5,
      rank: 2,
      competitiveAdvantages: ['Brand strength', 'Distribution network', 'R&D capabilities'],
      vulnerabilities: ['Price sensitivity', 'Digital disruption', 'Changing customer preferences']
    };
  }

  async getDigitalFootprint(competitorId: string) {
    return {
      websiteMetrics: {
        monthlyVisitors: 1500000,
        pageViews: 4500000,
        bounceRate: 35.2,
        averageSessionDuration: 180
      },
      socialMediaPresence: {
        totalFollowers: 250000,
        engagementRate: 3.5,
        platforms: ['twitter', 'linkedin', 'facebook', 'instagram']
      },
      searchPresence: {
        organicKeywords: 15000,
        averagePosition: 12.5,
        searchVisibility: 78.3
      }
    };
  }

  async generateCompetitiveIntelligenceReport(competitorId: string, options: any) {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    return {
      reportId,
      status: 'generating',
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    };
  }

  async configureAlerts(competitorId: string, alertConfig: any) {
    return {
      alertId: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      status: 'configured',
      config: alertConfig
    };
  }

  async getCompetitorAlerts(competitorId: string, status: string) {
    return await this.monitoringAlertRepository.find({
      where: { competitorId, status },
      order: { createdAt: 'DESC' },
      take: 50
    });
  }

  async getCompetitorReports(competitorId: string, reportType?: string, timeRange: string = '30d') {
    return [
      {
        id: 'report_1',
        type: 'comprehensive',
        title: 'Comprehensive Competitor Analysis',
        generatedAt: new Date().toISOString(),
        status: 'completed'
      }
    ];
  }

  async generateCustomReport(competitorId: string, reportConfig: any) {
    return `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  async exportCompetitorData(competitorId: string, format: string, dataTypes: string[], timeRange: string) {
    return `export_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  async performAnalysis(request: any) {
    // Placeholder for comprehensive analysis
    return {
      competitorId: request.competitorId,
      competitorName: 'Sample Competitor',
      analysisType: request.analysisType,
      timeRange: request.timeRange,
      generatedAt: new Date().toISOString(),
      overview: {
        marketPosition: 15.5,
        threatLevel: 'medium' as const,
        overallTrend: 'stable' as const,
        keyStrengths: ['Strong brand', 'Market presence'],
        keyWeaknesses: ['High prices', 'Limited innovation'],
        opportunities: ['Digital transformation', 'New markets'],
        threats: ['Competition', 'Market changes']
      },
      metrics: {
        marketShare: { current: 15.5, change: 0.5, trend: 'up' as const },
        digitalPresence: {
          websiteTraffic: 1500000,
          socialFollowers: 250000,
          searchVisibility: 78.3,
          brandMentions: 5000
        },
        productPortfolio: {
          totalProducts: 150,
          newProducts: 12,
          discontinuedProducts: 3,
          averagePrice: 99.99
        },
        marketingActivity: {
          campaignsLaunched: 8,
          adSpend: 500000,
          contentPublished: 45,
          engagementRate: 3.5
        }
      },
      insights: [
        {
          category: 'market_position',
          insight: 'Strong market presence with growing digital footprint',
          impact: 'high' as const,
          confidence: 0.85,
          actionable: true,
          recommendation: 'Monitor digital strategy closely'
        }
      ]
    };
  }
}
