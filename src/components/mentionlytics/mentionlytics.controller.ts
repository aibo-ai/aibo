import { Controller, Get, Post, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MentionlyticsService, MentionlyticsSearchRequest, MentionlyticsCompetitorAnalysis } from '../../common/services/mentionlytics.service';
import { AzureMonitoringService } from '../../common/services/azure-monitoring.service';

export interface MentionlyticsSearchDto {
  keyword: string;
  platforms?: string[];
  languages?: string[];
  countries?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  sentimentFilter?: 'positive' | 'negative' | 'neutral';
  includeInfluencers?: boolean;
}

export interface CompetitorAnalysisDto {
  competitor: string;
  timeframe?: string;
  includeIndustryComparison?: boolean;
}

export interface BrandMonitoringDto {
  brandName: string;
  keywords?: string[];
  platforms?: string[];
  alertThresholds?: {
    mentionSpike?: number;
    sentimentDrop?: number;
    viralThreshold?: number;
  };
}

@Controller('mentionlytics')
export class MentionlyticsController {
  private readonly logger = new Logger(MentionlyticsController.name);

  constructor(
    private mentionlyticsService: MentionlyticsService,
    private azureMonitoringService: AzureMonitoringService
  ) {}

  /**
   * Search for mentions across social platforms
   */
  @Post('search')
  async searchMentions(@Body() searchDto: MentionlyticsSearchDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Searching mentions for keyword: ${searchDto.keyword}`);

      // Track the search request
      this.azureMonitoringService.trackEvent({
        name: 'MentionlyticsSearchStarted',
        properties: {
          keyword: searchDto.keyword,
          platforms: searchDto.platforms?.join(',') || 'all',
          limit: searchDto.limit?.toString() || '100'
        }
      });

      const searchRequest: MentionlyticsSearchRequest = {
        keyword: searchDto.keyword,
        platforms: searchDto.platforms,
        languages: searchDto.languages || ['en'],
        countries: searchDto.countries,
        startDate: searchDto.startDate,
        endDate: searchDto.endDate,
        limit: searchDto.limit || 100,
        sentimentFilter: searchDto.sentimentFilter,
        includeInfluencers: searchDto.includeInfluencers !== false
      };

      const mentions = await this.mentionlyticsService.searchMentions(searchRequest);
      const processingTime = Date.now() - startTime;

      // Track success metrics
      this.azureMonitoringService.trackMetric({
        name: 'MentionlyticsSearchCompleted',
        value: processingTime,
        properties: {
          keyword: searchDto.keyword,
          mentionCount: mentions.length.toString(),
          success: 'true'
        }
      });

      this.logger.log(`Found ${mentions.length} mentions for ${searchDto.keyword} in ${processingTime}ms`);

      return {
        success: true,
        data: {
          keyword: searchDto.keyword,
          totalMentions: mentions.length,
          mentions,
          searchParameters: searchRequest,
          processingTime
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Mention search failed for ${searchDto.keyword}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        keyword: searchDto.keyword,
        operation: 'mentionSearch',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to search mentions',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get analytics for a specific keyword or brand
   */
  @Post('analytics')
  async getAnalytics(@Body() analyticsDto: {
    keyword: string;
    startDate?: string;
    endDate?: string;
    platforms?: string[];
  }) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting analytics for keyword: ${analyticsDto.keyword}`);

      this.azureMonitoringService.trackEvent({
        name: 'MentionlyticsAnalyticsStarted',
        properties: {
          keyword: analyticsDto.keyword,
          platforms: analyticsDto.platforms?.join(',') || 'all'
        }
      });

      const analytics = await this.mentionlyticsService.getAnalytics(
        analyticsDto.keyword,
        analyticsDto.startDate,
        analyticsDto.endDate,
        analyticsDto.platforms
      );

      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'MentionlyticsAnalyticsCompleted',
        value: processingTime,
        properties: {
          keyword: analyticsDto.keyword,
          totalMentions: analytics.totalMentions.toString()
        }
      });

      return {
        success: true,
        data: {
          keyword: analyticsDto.keyword,
          analytics,
          processingTime
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Analytics failed for ${analyticsDto.keyword}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        keyword: analyticsDto.keyword,
        operation: 'mentionAnalytics',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get analytics',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Perform comprehensive competitor analysis
   */
  @Post('competitor-analysis')
  async analyzeCompetitor(@Body() analysisDto: CompetitorAnalysisDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Analyzing competitor: ${analysisDto.competitor}`);

      this.azureMonitoringService.trackEvent({
        name: 'MentionlyticsCompetitorAnalysisStarted',
        properties: {
          competitor: analysisDto.competitor,
          timeframe: analysisDto.timeframe || '7d'
        }
      });

      const analysis = await this.mentionlyticsService.analyzeCompetitor(
        analysisDto.competitor,
        analysisDto.timeframe || '7d',
        analysisDto.includeIndustryComparison !== false
      );

      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'MentionlyticsCompetitorAnalysisCompleted',
        value: processingTime,
        properties: {
          competitor: analysisDto.competitor,
          mentionCount: analysis.mentions.length.toString(),
          threatLevel: analysis.competitiveInsights.shareOfVoice > 0.3 ? 'high' : 'low'
        }
      });

      return {
        success: true,
        data: analysis,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Competitor analysis failed for ${analysisDto.competitor}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        competitor: analysisDto.competitor,
        operation: 'competitorAnalysis',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to analyze competitor',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Set up brand monitoring with alerts
   */
  @Post('brand-monitoring')
  async setupBrandMonitoring(@Body() monitoringDto: BrandMonitoringDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Setting up brand monitoring for: ${monitoringDto.brandName}`);

      // Get current analytics as baseline
      const analytics = await this.mentionlyticsService.getAnalytics(
        monitoringDto.brandName,
        undefined,
        undefined,
        monitoringDto.platforms
      );

      // Set up monitoring configuration
      const monitoringConfig = {
        brandName: monitoringDto.brandName,
        keywords: monitoringDto.keywords || [monitoringDto.brandName],
        platforms: monitoringDto.platforms || ['twitter', 'facebook', 'instagram', 'linkedin'],
        alertThresholds: {
          mentionSpike: monitoringDto.alertThresholds?.mentionSpike || 50,
          sentimentDrop: monitoringDto.alertThresholds?.sentimentDrop || 0.3,
          viralThreshold: monitoringDto.alertThresholds?.viralThreshold || 1000
        },
        baseline: {
          averageMentions: analytics.totalMentions,
          averageSentiment: analytics.sentimentBreakdown.positive / analytics.totalMentions,
          averageEngagement: analytics.engagementMetrics.averageEngagement
        },
        createdAt: new Date().toISOString()
      };

      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackEvent({
        name: 'BrandMonitoringSetup',
        properties: {
          brandName: monitoringDto.brandName,
          keywordCount: monitoringConfig.keywords.length.toString(),
          platformCount: monitoringConfig.platforms.length.toString()
        }
      });

      return {
        success: true,
        data: {
          monitoringConfig,
          currentAnalytics: analytics,
          message: 'Brand monitoring setup completed successfully'
        },
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Brand monitoring setup failed for ${monitoringDto.brandName}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        brandName: monitoringDto.brandName,
        operation: 'brandMonitoringSetup',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to setup brand monitoring',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    try {
      const isHealthy = await this.mentionlyticsService.healthCheck();
      
      return {
        success: true,
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'Mentionlytics API',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Mentionlytics health check failed:', error);
      
      return {
        success: false,
        status: 'unhealthy',
        service: 'Mentionlytics API',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
