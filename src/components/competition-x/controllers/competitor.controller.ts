import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { CompetitorAnalysisService } from '../services/competitor-analysis.service';
import { SentimentAnalysisService, SentimentAnalysisRequest } from '../services/analytics/sentiment-analysis.service';
import { TrendAnalysisService, TrendAnalysisRequest } from '../services/analytics/trend-analysis.service';
import { PredictiveAnalyticsService, PredictiveAnalysisRequest } from '../services/analytics/predictive-analytics.service';

@ApiTags('Competitor Analysis')
@Controller('competition-x/competitors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompetitorController {
  constructor(
    private readonly competitorAnalysisService: CompetitorAnalysisService,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly trendAnalysisService: TrendAnalysisService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService
  ) {}

  @Get(':id/profile')
  @ApiOperation({ summary: 'Get detailed competitor profile' })
  @ApiResponse({ status: 200, description: 'Competitor profile retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getCompetitorProfile(@Param('id') competitorId: string) {
    return this.competitorAnalysisService.getCompetitorProfile(competitorId);
  }

  @Get(':id/social-media')
  @ApiOperation({ summary: 'Get competitor social media data' })
  @ApiResponse({ status: 200, description: 'Social media data retrieved successfully' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getSocialMediaData(
    @Param('id') competitorId: string,
    @Query('platform') platform?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    return this.competitorAnalysisService.getSocialMediaData(competitorId, platform, timeRange);
  }

  @Get(':id/search-engine')
  @ApiOperation({ summary: 'Get competitor search engine data' })
  @ApiResponse({ status: 200, description: 'Search engine data retrieved successfully' })
  @ApiQuery({ name: 'engine', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getSearchEngineData(
    @Param('id') competitorId: string,
    @Query('engine') engine?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    return this.competitorAnalysisService.getSearchEngineData(competitorId, engine, timeRange);
  }

  @Get(':id/ecommerce')
  @ApiOperation({ summary: 'Get competitor ecommerce data' })
  @ApiResponse({ status: 200, description: 'Ecommerce data retrieved successfully' })
  @ApiQuery({ name: 'platform', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getEcommerceData(
    @Param('id') competitorId: string,
    @Query('platform') platform?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    return this.competitorAnalysisService.getEcommerceData(competitorId, platform, timeRange);
  }

  @Get(':id/pricing')
  @ApiOperation({ summary: 'Get competitor pricing analysis' })
  @ApiResponse({ status: 200, description: 'Pricing analysis retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getPricingAnalysis(
    @Param('id') competitorId: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    return this.competitorAnalysisService.getPricingAnalysis(competitorId, timeRange);
  }

  @Get(':id/products')
  @ApiOperation({ summary: 'Get competitor product analysis' })
  @ApiResponse({ status: 200, description: 'Product analysis retrieved successfully' })
  @ApiQuery({ name: 'category', required: false })
  @Roles('admin', 'analyst', 'user')
  async getProductAnalysis(
    @Param('id') competitorId: string,
    @Query('category') category?: string
  ) {
    return this.competitorAnalysisService.getProductAnalysis(competitorId, category);
  }

  @Post(':id/sentiment-analysis')
  @ApiOperation({ summary: 'Analyze sentiment for competitor content' })
  @ApiResponse({ status: 200, description: 'Sentiment analysis completed successfully' })
  @Roles('admin', 'analyst')
  async analyzeSentiment(
    @Param('id') competitorId: string,
    @Body() request: {
      text?: string;
      dataType?: 'social' | 'reviews' | 'news' | 'all';
      timeRange?: '7d' | '30d' | '90d';
      includeEmotions?: boolean;
      includeKeywords?: boolean;
      includeEntities?: boolean;
    }
  ) {
    if (request.text) {
      // Analyze specific text
      const sentimentRequest: SentimentAnalysisRequest = {
        text: request.text,
        includeEmotions: request.includeEmotions,
        includeKeywords: request.includeKeywords,
        includeEntities: request.includeEntities
      };
      
      return this.sentimentAnalysisService.analyzeSentiment(sentimentRequest);
    } else {
      // Analyze competitor's content
      return this.competitorAnalysisService.analyzeSentiment(
        competitorId, 
        request.dataType || 'all', 
        request.timeRange || '30d'
      );
    }
  }

  @Post(':id/trend-analysis')
  @ApiOperation({ summary: 'Analyze trends for competitor' })
  @ApiResponse({ status: 200, description: 'Trend analysis completed successfully' })
  @Roles('admin', 'analyst')
  async analyzeTrends(
    @Param('id') competitorId: string,
    @Body() request: {
      dataTypes: string[];
      timeRange: '7d' | '30d' | '90d' | '1y';
      granularity: 'hour' | 'day' | 'week' | 'month';
      metrics: string[];
      includeForecasting?: boolean;
      includeSeasonality?: boolean;
      includeAnomalies?: boolean;
    }
  ) {
    const trendRequest: TrendAnalysisRequest = {
      competitorIds: [competitorId],
      ...request
    };
    
    return this.trendAnalysisService.analyzeTrends(trendRequest);
  }

  @Post(':id/predictive-analysis')
  @ApiOperation({ summary: 'Perform predictive analysis for competitor' })
  @ApiResponse({ status: 200, description: 'Predictive analysis completed successfully' })
  @Roles('admin', 'analyst')
  async performPredictiveAnalysis(
    @Param('id') competitorId: string,
    @Body() request: {
      predictionType: 'market_share' | 'pricing' | 'product_launch' | 'competitive_move' | 'market_trend';
      timeHorizon: '1m' | '3m' | '6m' | '1y' | '2y';
      confidence: 'low' | 'medium' | 'high';
      includeScenarios?: boolean;
      includeRiskAssessment?: boolean;
      customFactors?: string[];
    }
  ) {
    const predictiveRequest: PredictiveAnalysisRequest = {
      competitorIds: [competitorId],
      ...request
    };
    
    return this.predictiveAnalyticsService.performPredictiveAnalysis(predictiveRequest);
  }

  @Get(':id/comparison')
  @ApiOperation({ summary: 'Compare competitor with others' })
  @ApiResponse({ status: 200, description: 'Comparison completed successfully' })
  @ApiQuery({ name: 'compareWith', required: true })
  @ApiQuery({ name: 'metrics', required: false })
  @Roles('admin', 'analyst', 'user')
  async compareCompetitors(
    @Param('id') competitorId: string,
    @Query('compareWith') compareWith: string,
    @Query('metrics') metrics?: string
  ) {
    const compareWithIds = compareWith.split(',');
    const comparisonMetrics = metrics ? metrics.split(',') : [
      'market_share', 'digital_presence', 'product_portfolio', 'pricing', 'social_engagement'
    ];
    
    return this.competitorAnalysisService.compareCompetitors(
      competitorId, 
      compareWithIds, 
      comparisonMetrics
    );
  }

  @Get(':id/swot-analysis')
  @ApiOperation({ summary: 'Get SWOT analysis for competitor' })
  @ApiResponse({ status: 200, description: 'SWOT analysis retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getSWOTAnalysis(@Param('id') competitorId: string) {
    return this.competitorAnalysisService.getSWOTAnalysis(competitorId);
  }

  @Get(':id/market-position')
  @ApiOperation({ summary: 'Get competitor market position analysis' })
  @ApiResponse({ status: 200, description: 'Market position analysis retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getMarketPosition(@Param('id') competitorId: string) {
    return this.competitorAnalysisService.getMarketPosition(competitorId);
  }

  @Get(':id/digital-footprint')
  @ApiOperation({ summary: 'Get competitor digital footprint analysis' })
  @ApiResponse({ status: 200, description: 'Digital footprint analysis retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getDigitalFootprint(@Param('id') competitorId: string) {
    return this.competitorAnalysisService.getDigitalFootprint(competitorId);
  }

  @Get(':id/competitive-intelligence')
  @ApiOperation({ summary: 'Get comprehensive competitive intelligence report' })
  @ApiResponse({ status: 200, description: 'Competitive intelligence report generated successfully' })
  @ApiQuery({ name: 'includeForecasting', type: 'boolean', required: false })
  @ApiQuery({ name: 'includeBenchmarking', type: 'boolean', required: false })
  @Roles('admin', 'analyst')
  async getCompetitiveIntelligence(
    @Param('id') competitorId: string,
    @Query('includeForecasting') includeForecasting: boolean = false,
    @Query('includeBenchmarking') includeBenchmarking: boolean = false
  ) {
    return this.competitorAnalysisService.generateCompetitiveIntelligenceReport(
      competitorId,
      {
        includeForecasting,
        includeBenchmarking,
        includeRiskAssessment: true,
        includeActionableInsights: true
      }
    );
  }

  @Post(':id/alerts/configure')
  @ApiOperation({ summary: 'Configure alerts for competitor' })
  @ApiResponse({ status: 200, description: 'Alerts configured successfully' })
  @Roles('admin', 'analyst')
  async configureAlerts(
    @Param('id') competitorId: string,
    @Body() alertConfig: {
      alertTypes: string[];
      thresholds: { [key: string]: number };
      notifications: {
        email?: string[];
        slack?: string;
        webhook?: string;
      };
      frequency: 'immediate' | 'hourly' | 'daily';
    }
  ) {
    return this.competitorAnalysisService.configureAlerts(competitorId, alertConfig);
  }

  @Get(':id/alerts')
  @ApiOperation({ summary: 'Get alerts for competitor' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiQuery({ name: 'status', enum: ['active', 'resolved', 'all'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getCompetitorAlerts(
    @Param('id') competitorId: string,
    @Query('status') status: 'active' | 'resolved' | 'all' = 'active'
  ) {
    return this.competitorAnalysisService.getCompetitorAlerts(competitorId, status);
  }

  @Get(':id/reports')
  @ApiOperation({ summary: 'Get available reports for competitor' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiQuery({ name: 'reportType', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getCompetitorReports(
    @Param('id') competitorId: string,
    @Query('reportType') reportType?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    return this.competitorAnalysisService.getCompetitorReports(competitorId, reportType, timeRange);
  }

  @Post(':id/reports/generate')
  @ApiOperation({ summary: 'Generate custom report for competitor' })
  @ApiResponse({ status: 200, description: 'Report generation started successfully' })
  @Roles('admin', 'analyst')
  async generateCustomReport(
    @Param('id') competitorId: string,
    @Body() reportConfig: {
      reportType: 'comprehensive' | 'executive_summary' | 'technical' | 'marketing';
      sections: string[];
      timeRange: '7d' | '30d' | '90d' | '1y';
      format: 'pdf' | 'html' | 'json';
      includeCharts: boolean;
      includeRawData: boolean;
    }
  ) {
    const reportId = await this.competitorAnalysisService.generateCustomReport(competitorId, reportConfig);
    
    return {
      reportId,
      status: 'generating',
      message: 'Report generation started successfully',
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
      downloadUrl: `/competition-x/competitors/${competitorId}/reports/${reportId}/download`
    };
  }

  @Get(':id/export')
  @ApiOperation({ summary: 'Export competitor data' })
  @ApiResponse({ status: 200, description: 'Export started successfully' })
  @ApiQuery({ name: 'format', enum: ['json', 'csv', 'xlsx'], required: false })
  @ApiQuery({ name: 'dataTypes', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst')
  async exportCompetitorData(
    @Param('id') competitorId: string,
    @Query('format') format: 'json' | 'csv' | 'xlsx' = 'json',
    @Query('dataTypes') dataTypes?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    const exportTypes = dataTypes ? dataTypes.split(',') : ['all'];
    const exportId = await this.competitorAnalysisService.exportCompetitorData(
      competitorId, 
      format, 
      exportTypes, 
      timeRange
    );
    
    return {
      exportId,
      format,
      status: 'processing',
      message: 'Export started successfully',
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      downloadUrl: `/competition-x/competitors/${competitorId}/exports/${exportId}/download`
    };
  }
}
