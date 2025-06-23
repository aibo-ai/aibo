import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';

import { RealTimeMonitoringService } from '../services/real-time-monitoring.service';

@ApiTags('Competition X Monitoring')
@Controller('competition-x/monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MonitoringController {
  constructor(
    private readonly realTimeMonitoringService: RealTimeMonitoringService
  ) {}

  @Get('status')
  @ApiOperation({ summary: 'Get monitoring system status' })
  @ApiResponse({ status: 200, description: 'Monitoring status retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getMonitoringStatus() {
    return this.realTimeMonitoringService.getMonitoringStatus();
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get monitoring alerts' })
  @ApiResponse({ status: 200, description: 'Alerts retrieved successfully' })
  @ApiQuery({ name: 'status', enum: ['active', 'acknowledged', 'resolved', 'all'], required: false })
  @ApiQuery({ name: 'severity', enum: ['info', 'warning', 'critical', 'urgent'], required: false })
  @ApiQuery({ name: 'competitorId', required: false })
  @ApiQuery({ name: 'limit', type: 'number', required: false })
  @Roles('admin', 'analyst', 'user')
  async getAlerts(
    @Query('status') status: 'active' | 'acknowledged' | 'resolved' | 'all' = 'active',
    @Query('severity') severity?: 'info' | 'warning' | 'critical' | 'urgent',
    @Query('competitorId') competitorId?: string,
    @Query('limit') limit: number = 50
  ) {
    return this.realTimeMonitoringService.getAlerts({
      status,
      severity,
      competitorId,
      limit
    });
  }

  @Post('alerts')
  @ApiOperation({ summary: 'Create manual alert' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @Roles('admin', 'analyst')
  async createAlert(
    @Body() alertData: {
      type: string;
      severity: 'info' | 'warning' | 'critical' | 'urgent';
      title: string;
      message: string;
      competitorId: string;
      competitorName: string;
      source: string;
      sourceUrl?: string;
      alertData?: any;
      metadata?: any;
      actionRequired?: boolean;
      suggestedActions?: Array<{
        action: string;
        priority: string;
        description?: string;
      }>;
    }
  ) {
    return this.realTimeMonitoringService.createAlert(alertData);
  }

  @Put('alerts/:id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge alert' })
  @ApiResponse({ status: 200, description: 'Alert acknowledged successfully' })
  @Roles('admin', 'analyst')
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @Body() acknowledgment: {
      acknowledgedBy: string;
      notes?: string;
    }
  ) {
    await this.realTimeMonitoringService.acknowledgeAlert(
      alertId, 
      acknowledgment.acknowledgedBy, 
      acknowledgment.notes
    );
    
    return { message: 'Alert acknowledged successfully' };
  }

  @Put('alerts/:id/resolve')
  @ApiOperation({ summary: 'Resolve alert' })
  @ApiResponse({ status: 200, description: 'Alert resolved successfully' })
  @Roles('admin', 'analyst')
  async resolveAlert(
    @Param('id') alertId: string,
    @Body() resolution: {
      resolvedBy: string;
      resolutionNotes: string;
    }
  ) {
    await this.realTimeMonitoringService.resolveAlert(
      alertId, 
      resolution.resolvedBy, 
      resolution.resolutionNotes
    );
    
    return { message: 'Alert resolved successfully' };
  }

  @Put('alerts/:id/escalate')
  @ApiOperation({ summary: 'Escalate alert' })
  @ApiResponse({ status: 200, description: 'Alert escalated successfully' })
  @Roles('admin', 'analyst')
  async escalateAlert(
    @Param('id') alertId: string,
    @Body() escalation: {
      escalatedTo: string;
      escalatedBy: string;
      reason: string;
    }
  ) {
    await this.realTimeMonitoringService.escalateAlert(
      alertId, 
      escalation.escalatedTo, 
      escalation.escalatedBy, 
      escalation.reason
    );
    
    return { message: 'Alert escalated successfully' };
  }

  @Delete('alerts/:id')
  @ApiOperation({ summary: 'Delete alert' })
  @ApiResponse({ status: 200, description: 'Alert deleted successfully' })
  @Roles('admin')
  async deleteAlert(@Param('id') alertId: string) {
    await this.realTimeMonitoringService.deleteAlert(alertId);
    
    return { message: 'Alert deleted successfully' };
  }

  @Get('alerts/statistics')
  @ApiOperation({ summary: 'Get alert statistics' })
  @ApiResponse({ status: 200, description: 'Alert statistics retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d'], required: false })
  @Roles('admin', 'analyst')
  async getAlertStatistics(
    @Query('timeRange') timeRange: '24h' | '7d' | '30d' = '24h'
  ) {
    return this.realTimeMonitoringService.getAlertStatistics(timeRange);
  }

  @Post('competitors/:id/start')
  @ApiOperation({ summary: 'Start monitoring for competitor' })
  @ApiResponse({ status: 200, description: 'Monitoring started successfully' })
  @Roles('admin', 'analyst')
  async startMonitoring(
    @Param('id') competitorId: string,
    @Body() monitoringConfig?: {
      dataTypes?: string[];
      frequency?: 'hourly' | 'daily' | 'weekly';
      alertThresholds?: { [key: string]: number };
      notifications?: {
        email?: string[];
        slack?: string;
        webhook?: string;
      };
    }
  ) {
    await this.realTimeMonitoringService.startMonitoring(competitorId, monitoringConfig);
    
    return { message: 'Monitoring started successfully' };
  }

  @Post('competitors/:id/stop')
  @ApiOperation({ summary: 'Stop monitoring for competitor' })
  @ApiResponse({ status: 200, description: 'Monitoring stopped successfully' })
  @Roles('admin', 'analyst')
  async stopMonitoring(@Param('id') competitorId: string) {
    await this.realTimeMonitoringService.stopMonitoring(competitorId);
    
    return { message: 'Monitoring stopped successfully' };
  }

  @Get('competitors/:id/status')
  @ApiOperation({ summary: 'Get monitoring status for competitor' })
  @ApiResponse({ status: 200, description: 'Competitor monitoring status retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getCompetitorMonitoringStatus(@Param('id') competitorId: string) {
    return this.realTimeMonitoringService.getCompetitorMonitoringStatus(competitorId);
  }

  @Put('competitors/:id/configure')
  @ApiOperation({ summary: 'Configure monitoring for competitor' })
  @ApiResponse({ status: 200, description: 'Monitoring configuration updated successfully' })
  @Roles('admin', 'analyst')
  async configureMonitoring(
    @Param('id') competitorId: string,
    @Body() config: {
      dataTypes: string[];
      frequency: 'hourly' | 'daily' | 'weekly';
      alertThresholds: { [key: string]: number };
      notifications: {
        email?: string[];
        slack?: string;
        webhook?: string;
      };
      customRules?: Array<{
        name: string;
        condition: string;
        action: string;
        severity: 'info' | 'warning' | 'critical' | 'urgent';
      }>;
    }
  ) {
    await this.realTimeMonitoringService.configureMonitoring(competitorId, config);
    
    return { message: 'Monitoring configuration updated successfully' };
  }

  @Get('rules')
  @ApiOperation({ summary: 'Get monitoring rules' })
  @ApiResponse({ status: 200, description: 'Monitoring rules retrieved successfully' })
  @ApiQuery({ name: 'competitorId', required: false })
  @ApiQuery({ name: 'ruleType', required: false })
  @Roles('admin', 'analyst')
  async getMonitoringRules(
    @Query('competitorId') competitorId?: string,
    @Query('ruleType') ruleType?: string
  ) {
    return this.realTimeMonitoringService.getMonitoringRules(competitorId, ruleType);
  }

  @Post('rules')
  @ApiOperation({ summary: 'Create monitoring rule' })
  @ApiResponse({ status: 201, description: 'Monitoring rule created successfully' })
  @Roles('admin', 'analyst')
  async createMonitoringRule(
    @Body() ruleData: {
      name: string;
      description: string;
      competitorId?: string;
      ruleType: 'threshold' | 'pattern' | 'anomaly' | 'custom';
      condition: string;
      action: string;
      severity: 'info' | 'warning' | 'critical' | 'urgent';
      isActive: boolean;
      notifications?: {
        email?: string[];
        slack?: string;
        webhook?: string;
      };
    }
  ) {
    return this.realTimeMonitoringService.createMonitoringRule(ruleData);
  }

  @Put('rules/:id')
  @ApiOperation({ summary: 'Update monitoring rule' })
  @ApiResponse({ status: 200, description: 'Monitoring rule updated successfully' })
  @Roles('admin', 'analyst')
  async updateMonitoringRule(
    @Param('id') ruleId: string,
    @Body() updateData: any
  ) {
    await this.realTimeMonitoringService.updateMonitoringRule(ruleId, updateData);
    
    return { message: 'Monitoring rule updated successfully' };
  }

  @Delete('rules/:id')
  @ApiOperation({ summary: 'Delete monitoring rule' })
  @ApiResponse({ status: 200, description: 'Monitoring rule deleted successfully' })
  @Roles('admin')
  async deleteMonitoringRule(@Param('id') ruleId: string) {
    await this.realTimeMonitoringService.deleteMonitoringRule(ruleId);
    
    return { message: 'Monitoring rule deleted successfully' };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get monitoring dashboard data' })
  @ApiResponse({ status: 200, description: 'Monitoring dashboard data retrieved successfully' })
  @Roles('admin', 'analyst', 'user')
  async getMonitoringDashboard() {
    const [
      status,
      recentAlerts,
      statistics
    ] = await Promise.all([
      this.realTimeMonitoringService.getMonitoringStatus(),
      this.realTimeMonitoringService.getAlerts({ status: 'active', limit: 10 }),
      this.realTimeMonitoringService.getAlertStatistics('24h')
    ]);

    return {
      status,
      recentAlerts: recentAlerts.alerts,
      statistics,
      summary: {
        totalCompetitors: status.totalCompetitors,
        activeMonitoring: status.activeMonitoring,
        alertsToday: status.alertsToday,
        systemHealth: status.systemHealth
      },
      charts: {
        alertTrends: statistics.alertTrends,
        severityDistribution: statistics.severityDistribution,
        responseTimeMetrics: statistics.responseTimeMetrics
      },
      lastUpdated: new Date().toISOString()
    };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get monitoring system health' })
  @ApiResponse({ status: 200, description: 'Monitoring system health retrieved successfully' })
  @Roles('admin', 'analyst')
  async getSystemHealth() {
    return this.realTimeMonitoringService.getSystemHealth();
  }

  @Post('test-alert')
  @ApiOperation({ summary: 'Send test alert for monitoring system validation' })
  @ApiResponse({ status: 200, description: 'Test alert sent successfully' })
  @Roles('admin')
  async sendTestAlert(
    @Body() testConfig: {
      alertType: string;
      severity: 'info' | 'warning' | 'critical' | 'urgent';
      competitorId: string;
      notificationChannels: string[];
    }
  ) {
    const alertId = await this.realTimeMonitoringService.sendTestAlert(testConfig);
    
    return {
      alertId,
      message: 'Test alert sent successfully',
      testConfig
    };
  }

  @Get('notifications/history')
  @ApiOperation({ summary: 'Get notification history' })
  @ApiResponse({ status: 200, description: 'Notification history retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['24h', '7d', '30d'], required: false })
  @ApiQuery({ name: 'channel', required: false })
  @Roles('admin', 'analyst')
  async getNotificationHistory(
    @Query('timeRange') timeRange: '24h' | '7d' | '30d' = '24h',
    @Query('channel') channel?: string
  ) {
    return this.realTimeMonitoringService.getNotificationHistory(timeRange, channel);
  }

  @Post('notifications/test')
  @ApiOperation({ summary: 'Test notification channels' })
  @ApiResponse({ status: 200, description: 'Notification test completed successfully' })
  @Roles('admin')
  async testNotifications(
    @Body() testConfig: {
      channels: Array<{
        type: 'email' | 'slack' | 'webhook';
        target: string;
        message?: string;
      }>;
    }
  ) {
    const results = await this.realTimeMonitoringService.testNotifications(testConfig.channels);
    
    return {
      message: 'Notification test completed',
      results,
      summary: {
        total: results.length,
        successful: results.filter(r => r.status === 'success').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    };
  }
}
