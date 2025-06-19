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
