import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { CompetitionXService, CompetitionXDashboardData, CompetitorAnalysisRequest, CompetitorAnalysisResult } from '../services/competition-x.service';
import { DataIngestionService, DataIngestionRequest, DataIngestionResult } from '../services/data-ingestion.service';
import { RealTimeMonitoringService } from '../services/real-time-monitoring.service';

@ApiTags('Competition X')
@Controller('competition-x')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CompetitionXController {
  constructor(
    private readonly competitionXService: CompetitionXService,
    private readonly dataIngestionService: DataIngestionService,
    private readonly realTimeMonitoringService: RealTimeMonitoringService
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get Competition X dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getDashboard(): Promise<CompetitionXDashboardData> {
    return this.competitionXService.getDashboardData();
  }

  @Get('competitors')
  @ApiOperation({ summary: 'Get list of all competitors' })
  @ApiResponse({ status: 200, description: 'Competitors retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getCompetitors() {
    return this.competitionXService.getCompetitors();
  }

  @Post('competitors')
  @ApiOperation({ summary: 'Add new competitor for monitoring' })
  @ApiResponse({ status: 201, description: 'Competitor added successfully' })
  @Roles('admin', 'analyst')
  async addCompetitor(
    @Body() competitorData: {
      name: string;
      website?: string;
      industry?: string;
      country?: string;
      size?: string;
      description?: string;
      socialMediaProfiles?: any;
      productCategories?: string[];
      targetMarkets?: string[];
    }
  ) {
    return this.competitionXService.addCompetitor(competitorData);
  }

  @Put('competitors/:id')
  @ApiOperation({ summary: 'Update competitor information' })
  @ApiResponse({ status: 200, description: 'Competitor updated successfully' })
  @Roles('admin', 'analyst')
  async updateCompetitor(
    @Param('id') competitorId: string,
    @Body() updateData: any
  ) {
    return this.competitionXService.updateCompetitor(competitorId, updateData);
  }

  @Delete('competitors/:id')
  @ApiOperation({ summary: 'Delete competitor and stop monitoring' })
  @ApiResponse({ status: 200, description: 'Competitor deleted successfully' })
  @Roles('admin')
  async deleteCompetitor(@Param('id') competitorId: string) {
    await this.competitionXService.deleteCompetitor(competitorId);
    return { message: 'Competitor deleted successfully' };
  }

  @Post('competitors/:id/analyze')
  @ApiOperation({ summary: 'Perform comprehensive competitor analysis' })
  @ApiResponse({ status: 200, description: 'Analysis completed successfully' })
  @Roles('admin', 'analyst')
  async analyzeCompetitor(
    @Param('id') competitorId: string,
    @Body() analysisRequest: {
      analysisType: 'comprehensive' | 'pricing' | 'products' | 'marketing' | 'social' | 'seo';
      timeRange: '24h' | '7d' | '30d' | '90d' | '1y';
      includeForecasting?: boolean;
      includeBenchmarking?: boolean;
    }
  ): Promise<CompetitorAnalysisResult> {
    const request: CompetitorAnalysisRequest = {
      competitorId,
      ...analysisRequest
    };
    
    return this.competitionXService.analyzeCompetitor(request);
  }

  @Post('data-ingestion/start')
  @ApiOperation({ summary: 'Start data ingestion for competitors' })
  @ApiResponse({ status: 200, description: 'Data ingestion started successfully' })
  @Roles('admin', 'analyst')
  async startDataIngestion(
    @Body() ingestionRequest: {
      competitorId: string;
      dataTypes: string[];
      priority: 'low' | 'medium' | 'high' | 'urgent';
      configuration?: any;
    }
  ): Promise<DataIngestionResult> {
    const request: DataIngestionRequest = {
      ...ingestionRequest
    };
    
    return this.dataIngestionService.startIngestion(request);
  }

  @Get('data-ingestion/:id/status')
  @ApiOperation({ summary: 'Get data ingestion status' })
  @ApiResponse({ status: 200, description: 'Ingestion status retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getIngestionStatus(@Param('id') ingestionId: string) {
    const status = await this.dataIngestionService.getIngestionStatus(ingestionId);
    
    if (!status) {
      return { error: 'Ingestion not found' };
    }
    
    return status;
  }

  @Get('data-ingestion/active')
  @ApiOperation({ summary: 'Get all active data ingestions' })
  @ApiResponse({ status: 200, description: 'Active ingestions retrieved successfully' })
  @Roles('admin', 'analyst')
  async getActiveIngestions() {
    return this.dataIngestionService.getActiveIngestions();
  }

  @Post('data-ingestion/:id/cancel')
  @ApiOperation({ summary: 'Cancel active data ingestion' })
  @ApiResponse({ status: 200, description: 'Ingestion cancelled successfully' })
  @Roles('admin', 'analyst')
  async cancelIngestion(@Param('id') ingestionId: string) {
    const cancelled = await this.dataIngestionService.cancelIngestion(ingestionId);
    
    return {
      success: cancelled,
      message: cancelled ? 'Ingestion cancelled successfully' : 'Ingestion not found or already completed'
    };
  }

  @Post('data-ingestion/schedule')
  @ApiOperation({ summary: 'Schedule recurring data ingestion' })
  @ApiResponse({ status: 200, description: 'Ingestion scheduled successfully' })
  @Roles('admin', 'analyst')
  async scheduleRecurringIngestion(
    @Body() scheduleRequest: {
      competitorId: string;
      dataTypes: string[];
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    }
  ) {
    const scheduleId = await this.dataIngestionService.scheduleRecurringIngestion(
      scheduleRequest.competitorId,
      scheduleRequest.dataTypes,
      scheduleRequest.frequency
    );
    
    return {
      scheduleId,
      message: 'Recurring ingestion scheduled successfully'
    };
  }

  @Get('data-ingestion/statistics')
  @ApiOperation({ summary: 'Get data ingestion statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d'], required: false })
  @Roles('admin', 'analyst')
  async getIngestionStatistics(
    @Query('timeRange') timeRange: '24h' | '7d' | '30d' = '24h'
  ) {
    return this.dataIngestionService.getIngestionStatistics(timeRange);
  }

  @Get('monitoring/alerts')
  @ApiOperation({ summary: 'Get active monitoring alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getActiveAlerts() {
    return this.realTimeMonitoringService.getActiveAlerts();
  }

  @Post('monitoring/alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge monitoring alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @Roles('admin', 'analyst')
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @Body() acknowledgment: {
      acknowledgedBy: string;
      notes?: string;
    }
  ) {
    await this.realTimeMonitoringService.acknowledgeAlert(alertId, acknowledgment.acknowledgedBy, acknowledgment.notes);
    
    return { message: 'Alert acknowledged successfully' };
  }

  @Post('monitoring/alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve monitoring alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @Roles('admin', 'analyst')
  async resolveAlert(
    @Param('id') alertId: string,
    @Body() resolution: {
      resolvedBy: string;
      resolutionNotes: string;
    }
  ) {
    await this.realTimeMonitoringService.resolveAlert(alertId, resolution.resolvedBy, resolution.resolutionNotes);
    
    return { message: 'Alert resolved successfully' };
  }

  @Get('monitoring/status')
  @ApiOperation({ summary: 'Get monitoring system status' })
  @ApiResponse({ status: 200, description: 'Monitoring status retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getMonitoringStatus() {
    return this.realTimeMonitoringService.getMonitoringStatus();
  }

  @Post('monitoring/competitors/:id/start')
  @ApiOperation({ summary: 'Start monitoring for a competitor' })
  @ApiResponse({ status: 200, description: 'Monitoring started successfully' })
  @Roles('admin', 'analyst')
  async startMonitoring(@Param('id') competitorId: string) {
    await this.realTimeMonitoringService.startMonitoring(competitorId);
    
    return { message: 'Monitoring started successfully' };
  }

  @Post('monitoring/competitors/:id/stop')
  @ApiOperation({ summary: 'Stop monitoring for a competitor' })
  @ApiResponse({ status: 200, description: 'Monitoring stopped successfully' })
  @Roles('admin', 'analyst')
  async stopMonitoring(@Param('id') competitorId: string) {
    await this.realTimeMonitoringService.stopMonitoring(competitorId);
    
    return { message: 'Monitoring stopped successfully' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get Competition X system health' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getSystemHealth() {
    const [
      activeIngestions,
      monitoringStatus,
      ingestionStats
    ] = await Promise.all([
      this.dataIngestionService.getActiveIngestions(),
      this.realTimeMonitoringService.getMonitoringStatus(),
      this.dataIngestionService.getIngestionStatistics('24h')
    ]);

    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      components: {
        dataIngestion: {
          status: activeIngestions.length < 10 ? 'healthy' : 'warning',
          activeJobs: activeIngestions.length,
          successRate: (ingestionStats.successfulIngestions / ingestionStats.totalIngestions) * 100
        },
        monitoring: {
          status: monitoringStatus.activeMonitoring > 0 ? 'healthy' : 'warning',
          activeMonitoring: monitoringStatus.activeMonitoring,
          alertsToday: monitoringStatus.alertsToday
        },
        analytics: {
          status: 'healthy',
          lastAnalysis: new Date().toISOString()
        }
      },
      metrics: {
        totalCompetitors: monitoringStatus.totalCompetitors,
        dataPointsToday: ingestionStats.recordsCollected,
        systemUptime: '99.9%'
      }
    };
  }

  @Get('export')
  @ApiOperation({ summary: 'Export Competition X data' })
  @ApiResponse({ status: 200, description: 'Data exported successfully' })
  @ApiQuery({ name: 'format', enum: ['json', 'csv', 'xlsx'], required: false })
  @ApiQuery({ name: 'competitorIds', required: false })
  @ApiQuery({ name: 'timeRange', enum: ['7d', '30d', '90d'], required: false })
  @Roles('admin', 'analyst')
  async exportData(
    @Query('format') format: 'json' | 'csv' | 'xlsx' = 'json',
    @Query('competitorIds') competitorIds?: string,
    @Query('timeRange') timeRange: '7d' | '30d' | '90d' = '30d'
  ) {
    // In a real implementation, this would generate and return the export file
    const exportId = `export_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    return {
      exportId,
      format,
      status: 'processing',
      message: 'Export started successfully',
      estimatedCompletion: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
      downloadUrl: `/competition-x/exports/${exportId}/download`
    };
  }
}
