import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { CompetitiveAnalyticsService, CompetitiveAnalysisRequest } from '../services/analytics/competitive-analytics.service';
import { SentimentAnalysisService, SentimentAnalysisRequest, BulkSentimentAnalysisRequest } from '../services/analytics/sentiment-analysis.service';
import { TrendAnalysisService, TrendAnalysisRequest } from '../services/analytics/trend-analysis.service';
import { PredictiveAnalyticsService, PredictiveAnalysisRequest } from '../services/analytics/predictive-analytics.service';

@ApiTags('Competition X Analytics')
@Controller('competition-x/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(
    private readonly competitiveAnalyticsService: CompetitiveAnalyticsService,
    private readonly sentimentAnalysisService: SentimentAnalysisService,
    private readonly trendAnalysisService: TrendAnalysisService,
    private readonly predictiveAnalyticsService: PredictiveAnalyticsService
  ) {}

  @Post('competitive-analysis')
  @ApiOperation({ summary: 'Perform comprehensive competitive analysis' })
  @ApiResponse({ status: 200, description: 'Competitive analysis completed successfully' })
  @Roles('admin', 'analyst')
  async performCompetitiveAnalysis(
    @Body() request: {
      competitorIds: string[];
      analysisType: 'market_position' | 'pricing_analysis' | 'product_comparison' | 'digital_presence' | 'comprehensive';
      timeRange: '7d' | '30d' | '90d' | '1y';
      includeForecasting?: boolean;
      includeBenchmarking?: boolean;
      customMetrics?: string[];
    }
  ) {
    const analysisRequest: CompetitiveAnalysisRequest = {
      ...request
    };
    
    return this.competitiveAnalyticsService.performAnalysis(analysisRequest);
  }

  @Post('sentiment-analysis')
  @ApiOperation({ summary: 'Analyze sentiment of text content' })
  @ApiResponse({ status: 200, description: 'Sentiment analysis completed successfully' })
  @Roles('admin', 'analyst', 'user')
  async analyzeSentiment(
    @Body() request: {
      text: string;
      language?: string;
      context?: 'social_media' | 'review' | 'news' | 'general';
      includeEmotions?: boolean;
      includeKeywords?: boolean;
      includeEntities?: boolean;
    }
  ) {
    const sentimentRequest: SentimentAnalysisRequest = {
      ...request
    };
    
    return this.sentimentAnalysisService.analyzeSentiment(sentimentRequest);
  }

  @Post('sentiment-analysis/bulk')
  @ApiOperation({ summary: 'Analyze sentiment for multiple texts' })
  @ApiResponse({ status: 200, description: 'Bulk sentiment analysis completed successfully' })
  @Roles('admin', 'analyst')
  async analyzeBulkSentiment(
    @Body() request: {
      texts: Array<{
        id: string;
        text: string;
        metadata?: any;
      }>;
      options: {
        language?: string;
        context?: 'social_media' | 'review' | 'news' | 'general';
        includeEmotions?: boolean;
        includeKeywords?: boolean;
        includeEntities?: boolean;
      };
    }
  ) {
    const bulkRequest: BulkSentimentAnalysisRequest = {
      ...request
    };
    
    return this.sentimentAnalysisService.analyzeBulkSentiment(bulkRequest);
  }

  @Post('sentiment-analysis/trends')
  @ApiOperation({ summary: 'Analyze sentiment trends over time' })
  @ApiResponse({ status: 200, description: 'Sentiment trend analysis completed successfully' })
  @Roles('admin', 'analyst')
  async analyzeSentimentTrends(
    @Body() request: {
      texts: Array<{
        text: string;
        timestamp: string;
        metadata?: any;
      }>;
      timeGranularity: 'hour' | 'day' | 'week' | 'month';
    }
  ) {
    const texts = request.texts.map(t => ({
      ...t,
      timestamp: new Date(t.timestamp)
    }));
    
    return this.sentimentAnalysisService.analyzeSentimentTrends(texts, request.timeGranularity);
  }

  @Post('trend-analysis')
  @ApiOperation({ summary: 'Perform trend analysis across competitors' })
  @ApiResponse({ status: 200, description: 'Trend analysis completed successfully' })
  @Roles('admin', 'analyst')
  async analyzeTrends(
    @Body() request: {
      competitorIds: string[];
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
      ...request
    };
    
    return this.trendAnalysisService.analyzeTrends(trendRequest);
  }

  @Post('predictive-analysis')
  @ApiOperation({ summary: 'Perform predictive analysis' })
  @ApiResponse({ status: 200, description: 'Predictive analysis completed successfully' })
  @Roles('admin', 'analyst')
  async performPredictiveAnalysis(
    @Body() request: {
      competitorIds: string[];
      predictionType: 'market_share' | 'pricing' | 'product_launch' | 'competitive_move' | 'market_trend';
      timeHorizon: '1m' | '3m' | '6m' | '1y' | '2y';
      confidence: 'low' | 'medium' | 'high';
      includeScenarios?: boolean;
      includeRiskAssessment?: boolean;
      customFactors?: string[];
    }
  ) {
    const predictiveRequest: PredictiveAnalysisRequest = {
      ...request
    };
    
    return this.predictiveAnalyticsService.performPredictiveAnalysis(predictiveRequest);
  }

  @Get('market-overview')
  @ApiOperation({ summary: 'Get market overview analytics' })
  @ApiResponse({ status: 200, description: 'Market overview retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d', '1y'], required: false })
  @ApiQuery({ name: 'industry', required: false })
  @Roles('admin', 'analyst', 'user')
  async getMarketOverview(
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' | '1y' = '30d',
    @Query('industry') industry?: string
  ) {
    // This would generate market overview analytics
    return {
      timeRange,
      industry: industry || 'All Industries',
      marketSize: {
        current: 5000000000, // $5B
        growth: 15.5, // 15.5% YoY
        trend: 'growing'
      },
      competitorCount: 25,
      marketConcentration: 'moderate',
      topTrends: [
        'Digital transformation acceleration',
        'AI and automation adoption',
        'Sustainability focus',
        'Remote work solutions',
        'Customer experience optimization'
      ],
      keyMetrics: {
        averageMarketShare: 4.0,
        averageGrowthRate: 12.3,
        innovationIndex: 78.5,
        competitiveIntensity: 'high'
      },
      insights: [
        'Market showing strong growth with increasing competition',
        'Digital transformation driving new opportunities',
        'Customer experience becoming key differentiator'
      ]
    };
  }

  @Get('performance-metrics')
  @ApiOperation({ summary: 'Get analytics performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d'], required: false })
  @Roles('admin', 'analyst')
  async getPerformanceMetrics(
    @Query('timeRange') timeRange: '24h' | '7d' | '30d' = '24h'
  ) {
    return {
      timeRange,
      analytics: {
        competitiveAnalyses: {
          total: 45,
          successful: 43,
          failed: 2,
          averageProcessingTime: 125000 // ms
        },
        sentimentAnalyses: {
          total: 1250,
          successful: 1235,
          failed: 15,
          averageProcessingTime: 850 // ms
        },
        trendAnalyses: {
          total: 28,
          successful: 27,
          failed: 1,
          averageProcessingTime: 95000 // ms
        },
        predictiveAnalyses: {
          total: 12,
          successful: 12,
          failed: 0,
          averageProcessingTime: 180000 // ms
        }
      },
      systemHealth: {
        status: 'healthy',
        cpuUsage: 65.2,
        memoryUsage: 78.5,
        diskUsage: 45.3,
        apiResponseTime: 245 // ms
      },
      insights: [
        'Analytics performance within normal parameters',
        'Sentiment analysis showing high throughput',
        'Predictive analytics maintaining 100% success rate'
      ]
    };
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get analytics insights and recommendations' })
  @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'priority', enum: ['low', 'medium', 'high'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getAnalyticsInsights(
    @Query('category') category?: string,
    @Query('priority') priority?: 'low' | 'medium' | 'high'
  ) {
    // This would retrieve actual insights from the database
    const insights = [
      {
        id: 'insight_1',
        category: 'market_trends',
        title: 'Emerging AI Adoption Trend',
        description: 'Competitors are increasingly adopting AI technologies in their products',
        priority: 'high',
        confidence: 0.89,
        impact: 'high',
        actionable: true,
        recommendation: 'Accelerate AI integration in product roadmap',
        createdAt: new Date().toISOString(),
        sources: ['social_media', 'product_analysis', 'news']
      },
      {
        id: 'insight_2',
        category: 'pricing',
        title: 'Pricing Pressure in Mid-Market',
        description: 'Mid-market segment showing increased price sensitivity',
        priority: 'medium',
        confidence: 0.76,
        impact: 'medium',
        actionable: true,
        recommendation: 'Consider value-based pricing strategy for mid-market',
        createdAt: new Date().toISOString(),
        sources: ['pricing_analysis', 'customer_feedback']
      },
      {
        id: 'insight_3',
        category: 'competitive_moves',
        title: 'Competitor Partnership Strategy',
        description: 'Key competitor forming strategic partnerships to expand market reach',
        priority: 'high',
        confidence: 0.92,
        impact: 'high',
        actionable: true,
        recommendation: 'Evaluate partnership opportunities in similar markets',
        createdAt: new Date().toISOString(),
        sources: ['news', 'social_media', 'web_scraping']
      }
    ];

    // Filter by category and priority if specified
    let filteredInsights = insights;
    
    if (category) {
      filteredInsights = filteredInsights.filter(insight => insight.category === category);
    }
    
    if (priority) {
      filteredInsights = filteredInsights.filter(insight => insight.priority === priority);
    }

    return {
      insights: filteredInsights,
      summary: {
        total: filteredInsights.length,
        highPriority: filteredInsights.filter(i => i.priority === 'high').length,
        actionable: filteredInsights.filter(i => i.actionable).length,
        averageConfidence: filteredInsights.reduce((sum, i) => sum + i.confidence, 0) / filteredInsights.length
      },
      categories: ['market_trends', 'pricing', 'competitive_moves', 'product_analysis', 'digital_presence'],
      lastUpdated: new Date().toISOString()
    };
  }

  @Get('reports')
  @ApiOperation({ summary: 'Get available analytics reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiQuery({ name: 'reportType', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst', 'user')
  async getAnalyticsReports(
    @Query('reportType') reportType?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    const reports = [
      {
        id: 'report_1',
        type: 'competitive_landscape',
        title: 'Competitive Landscape Analysis',
        description: 'Comprehensive analysis of competitive positioning and market dynamics',
        generatedAt: new Date().toISOString(),
        timeRange,
        status: 'completed',
        downloadUrl: '/competition-x/analytics/reports/report_1/download'
      },
      {
        id: 'report_2',
        type: 'sentiment_trends',
        title: 'Market Sentiment Trends',
        description: 'Analysis of sentiment trends across social media and news sources',
        generatedAt: new Date().toISOString(),
        timeRange,
        status: 'completed',
        downloadUrl: '/competition-x/analytics/reports/report_2/download'
      },
      {
        id: 'report_3',
        type: 'predictive_insights',
        title: 'Predictive Market Insights',
        description: 'Forward-looking analysis with market predictions and scenarios',
        generatedAt: new Date().toISOString(),
        timeRange,
        status: 'generating',
        estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      }
    ];

    let filteredReports = reports;
    
    if (reportType) {
      filteredReports = filteredReports.filter(report => report.type === reportType);
    }

    return {
      reports: filteredReports,
      summary: {
        total: filteredReports.length,
        completed: filteredReports.filter(r => r.status === 'completed').length,
        generating: filteredReports.filter(r => r.status === 'generating').length
      },
      availableTypes: ['competitive_landscape', 'sentiment_trends', 'predictive_insights', 'market_overview']
    };
  }

  @Post('reports/generate')
  @ApiOperation({ summary: 'Generate custom analytics report' })
  @ApiResponse({ status: 200, description: 'Report generation started successfully' })
  @Roles('admin', 'analyst')
  async generateCustomReport(
    @Body() reportConfig: {
      reportType: 'competitive_landscape' | 'sentiment_trends' | 'predictive_insights' | 'market_overview';
      competitorIds?: string[];
      timeRange: '7d' | '30d' | '90d' | '1y';
      sections: string[];
      format: 'pdf' | 'html' | 'json';
      includeCharts: boolean;
      includeRawData: boolean;
      customTitle?: string;
    }
  ) {
    const reportId = `report_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    return {
      reportId,
      status: 'generating',
      message: 'Report generation started successfully',
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
      downloadUrl: `/competition-x/analytics/reports/${reportId}/download`,
      config: reportConfig
    };
  }
}
