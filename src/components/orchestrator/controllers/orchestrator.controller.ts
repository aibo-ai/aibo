import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CrossLayerDataFlowService } from '../services/cross-layer-data-flow.service';
import { FeedbackLoopService } from '../services/feedback-loop.service';
import { PerformanceMonitoringService } from '../services/performance-monitoring.service';

@ApiTags('orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private readonly crossLayerDataFlowService: CrossLayerDataFlowService,
    private readonly feedbackLoopService: FeedbackLoopService,
    private readonly performanceMonitoringService: PerformanceMonitoringService,
  ) {}

  @Post('workflow')
  @ApiOperation({ summary: 'Start a content generation workflow' })
  async startWorkflow(@Body() workflowConfig: any) {
    return this.crossLayerDataFlowService.orchestrateWorkflow(
      workflowConfig,
      workflowConfig.initialData || {},
    );
  }

  @Get('content/:id/metrics')
  @ApiOperation({ summary: 'Get performance metrics for content' })
  async getContentMetrics(
    @Param('id') contentId: string,
    @Query('clientType') clientType: 'b2b' | 'b2c',
  ) {
    return this.feedbackLoopService.collectPerformanceMetrics(
      contentId,
      clientType,
    );
  }

  @Post('content/:id/improvements')
  @ApiOperation({ summary: 'Generate improvement suggestions for content' })
  async generateImprovements(
    @Param('id') contentId: string,
    @Body() metrics: any,
  ) {
    return this.feedbackLoopService.generateImprovementSuggestions(
      contentId,
      metrics,
    );
  }

  @Post('content/:id/apply-improvements')
  @ApiOperation({ summary: 'Apply automated improvements to content' })
  async applyImprovements(
    @Param('id') contentId: string,
    @Body() improvements: string[],
  ) {
    return this.feedbackLoopService.applyAutomatedImprovements(
      contentId,
      improvements,
    );
  }

  @Post('monitoring/initialize')
  @ApiOperation({ summary: 'Initialize monitoring for content' })
  async initializeMonitoring(
    @Body() params: { contentId: string; contentType: 'b2b' | 'b2c' },
  ) {
    return this.performanceMonitoringService.initializeMonitoring(
      params.contentId,
      params.contentType,
    );
  }

  @Get('content/:id/performance')
  @ApiOperation({ summary: 'Get performance status for content' })
  async getPerformanceStatus(@Param('id') contentId: string) {
    return this.performanceMonitoringService.getPerformanceStatus(contentId);
  }

  @Post('feedback/external')
  @ApiOperation({ summary: 'Record external feedback on generated content' })
  async recordExternalFeedback(
    @Body() feedback: {
      contentId: string;
      source: 'user_rating' | 'analytics' | 'social_media' | 'conversion_tracking';
      metrics: {
        engagementRate?: number;
        conversionRate?: number;
        userSatisfaction?: number;
        socialShares?: number;
        timeOnPage?: number;
        bounceRate?: number;
        clickThroughRate?: number;
      };
      metadata?: {
        platform?: string;
        audience?: 'b2b' | 'b2c';
        contentType?: string;
        timestamp?: string;
      };
    }
  ) {
    return this.feedbackLoopService.collectPerformanceMetrics(feedback.contentId, feedback.metadata?.audience || 'b2b');
  }

  @Post('feedback/continuous-improvement')
  @ApiOperation({ summary: 'Trigger continuous improvement process' })
  async triggerContinuousImprovement() {
    return this.feedbackLoopService.runContinuousImprovementProcess();
  }

  @Get('feedback/optimization-suggestions')
  @ApiOperation({ summary: 'Get optimization suggestions for content type and audience' })
  async getOptimizationSuggestions(
    @Query('contentType') contentType: string,
    @Query('audience') audience: 'b2b' | 'b2c'
  ) {
    return this.feedbackLoopService.getOptimizationSuggestions(contentType, audience);
  }

  @Get('feedback/trend-analysis')
  @ApiOperation({ summary: 'Get comprehensive trend analysis' })
  async getTrendAnalysis(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const range = {
      start: startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: endDate ? new Date(endDate) : new Date()
    };

    return this.feedbackLoopService.analyzeTrends(`${range.start.toISOString()}-${range.end.toISOString()}`);
  }

  @Post('feedback/batch-metrics')
  @ApiOperation({ summary: 'Record batch performance metrics from external systems' })
  async recordBatchMetrics(
    @Body() batchData: {
      metrics: Array<{
        contentId: string;
        timestamp: string;
        source: string;
        metrics: any;
        metadata?: any;
      }>;
      batchId?: string;
      source: string;
    }
  ) {
    const results = [];

    for (const metric of batchData.metrics) {
      try {
        const result = await this.feedbackLoopService.collectPerformanceMetrics(metric.contentId, 'b2b');
        results.push({ contentId: metric.contentId, status: 'success', result });
      } catch (error) {
        results.push({
          contentId: metric.contentId,
          status: 'error',
          error: error.message
        });
      }
    }

    return {
      batchId: batchData.batchId,
      totalMetrics: batchData.metrics.length,
      successful: results.filter(r => r.status === 'success').length,
      failed: results.filter(r => r.status === 'error').length,
      results
    };
  }

  @Get('feedback/performance-dashboard')
  @ApiOperation({ summary: 'Get comprehensive performance dashboard data' })
  async getPerformanceDashboard(
    @Query('timeRange') timeRange: '1h' | '24h' | '7d' | '30d' = '24h'
  ) {
    const timeRangeMs = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000
    };

    const range = {
      start: new Date(Date.now() - timeRangeMs[timeRange]),
      end: new Date()
    };

    const [trendAnalysis, optimizationSuggestions] = await Promise.all([
      this.feedbackLoopService.analyzeTrends(`${range.start.toISOString()}-${range.end.toISOString()}`),
      this.feedbackLoopService.getOptimizationSuggestions('general', 'b2b')
    ]);

    return {
      timeRange,
      range: {
        start: range.start.toISOString(),
        end: range.end.toISOString()
      },
      trendAnalysis,
      optimizationSuggestions,
      lastUpdated: new Date().toISOString()
    };
  }

  @Post('performance/aggregate')
  @ApiOperation({ summary: 'Aggregate performance metrics for multiple content pieces' })
  async aggregatePerformance(
    @Body() params: { contentIds: string[]; segmentBy?: string },
  ) {
    return this.performanceMonitoringService.aggregatePerformanceMetrics(
      params.contentIds,
      params.segmentBy,
    );
  }

  @Get('content/:id/report')
  @ApiOperation({ summary: 'Generate a performance report for content' })
  async generateReport(
    @Param('id') contentId: string,
    @Query('timeframe') timeframe: 'day' | 'week' | 'month' = 'week',
  ) {
    return this.performanceMonitoringService.generatePerformanceReport(
      contentId,
      timeframe,
    );
  }
}
