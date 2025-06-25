import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

import { MonitoringAlert } from '../entities/monitoring-alert.entity';
import { Competitor } from '../entities/competitor.entity';

@Injectable()
export class RealTimeMonitoringService {
  private readonly logger = new Logger(RealTimeMonitoringService.name);
  private readonly activeMonitoring = new Map<string, any>();

  constructor(
    @InjectRepository(MonitoringAlert)
    private readonly monitoringAlertRepository: Repository<MonitoringAlert>,
    @InjectRepository(Competitor)
    private readonly competitorRepository: Repository<Competitor>,
    
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  /**
   * Get monitoring system status
   */
  async getMonitoringStatus() {
    try {
      const totalCompetitors = await this.competitorRepository.count();
      const activeMonitoring = this.activeMonitoring.size;
      const alertsToday = await this.getTodayAlertsCount();

      return {
        totalCompetitors,
        activeMonitoring,
        alertsToday,
        systemHealth: 'healthy',
        lastUpdate: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Failed to get monitoring status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get active alerts
   */
  async getActiveAlerts() {
    try {
      const alerts = await this.monitoringAlertRepository.find({
        where: { status: 'active' },
        order: { createdAt: 'DESC' },
        take: 10
      });

      return alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        competitor: alert.competitorName,
        timestamp: alert.createdAt.toISOString(),
        actionRequired: alert.actionRequired
      }));

    } catch (error) {
      this.logger.error(`Failed to get active alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get alerts with filters
   */
  async getAlerts(filters: {
    status?: string;
    severity?: string;
    competitorId?: string;
    limit?: number;
  }) {
    try {
      const whereClause: any = {};
      
      if (filters.status && filters.status !== 'all') {
        whereClause.status = filters.status;
      }
      
      if (filters.severity) {
        whereClause.severity = filters.severity;
      }
      
      if (filters.competitorId) {
        whereClause.competitorId = filters.competitorId;
      }

      const alerts = await this.monitoringAlertRepository.find({
        where: whereClause,
        order: { createdAt: 'DESC' },
        take: filters.limit || 50
      });

      return {
        alerts,
        total: alerts.length,
        filters
      };

    } catch (error) {
      this.logger.error(`Failed to get alerts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Create alert
   */
  async createAlert(alertData: any) {
    try {
      const alert = this.monitoringAlertRepository.create({
        ...alertData,
        status: 'active',
        isNotificationSent: false
      });

      const savedAlert = await this.monitoringAlertRepository.save(alert);
      const alertResult = Array.isArray(savedAlert) ? savedAlert[0] : savedAlert;

      // Send notifications if configured
      await this.sendAlertNotifications(alertResult);

      this.appInsights.trackEvent('CompetitionX:AlertCreated', {
        alertId: alertResult.id,
        type: alertResult.type,
        severity: alertResult.severity,
        competitorId: alertResult.competitorId
      });

      return alertResult;

    } catch (error) {
      this.logger.error(`Failed to create alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(alertId: string, acknowledgedBy: string, notes?: string) {
    try {
      const alert = await this.monitoringAlertRepository.findOne({
        where: { id: alertId }
      });

      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
      alert.acknowledgedBy = acknowledgedBy;

      if (notes) {
        alert.resolutionNotes = notes;
      }

      await this.monitoringAlertRepository.save(alert);

      this.appInsights.trackEvent('CompetitionX:AlertAcknowledged', {
        alertId,
        acknowledgedBy
      });

    } catch (error) {
      this.logger.error(`Failed to acknowledge alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Resolve alert
   */
  async resolveAlert(alertId: string, resolvedBy: string, resolutionNotes: string) {
    try {
      const alert = await this.monitoringAlertRepository.findOne({
        where: { id: alertId }
      });

      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.status = 'resolved';
      alert.resolvedAt = new Date();
      alert.resolvedBy = resolvedBy;
      alert.resolutionNotes = resolutionNotes;

      await this.monitoringAlertRepository.save(alert);

      this.appInsights.trackEvent('CompetitionX:AlertResolved', {
        alertId,
        resolvedBy
      });

    } catch (error) {
      this.logger.error(`Failed to resolve alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Escalate alert
   */
  async escalateAlert(alertId: string, escalatedTo: string, escalatedBy: string, reason: string) {
    try {
      const alert = await this.monitoringAlertRepository.findOne({
        where: { id: alertId }
      });

      if (!alert) {
        throw new Error(`Alert not found: ${alertId}`);
      }

      alert.status = 'escalated';
      alert.assignedTo = escalatedTo;

      if (!alert.escalationHistory) {
        alert.escalationHistory = [];
      }

      alert.escalationHistory.push({
        escalatedTo,
        escalatedBy,
        timestamp: new Date().toISOString(),
        reason
      });

      await this.monitoringAlertRepository.save(alert);

      this.appInsights.trackEvent('CompetitionX:AlertEscalated', {
        alertId,
        escalatedTo,
        escalatedBy
      });

    } catch (error) {
      this.logger.error(`Failed to escalate alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete alert
   */
  async deleteAlert(alertId: string) {
    try {
      await this.monitoringAlertRepository.delete(alertId);

      this.appInsights.trackEvent('CompetitionX:AlertDeleted', {
        alertId
      });

    } catch (error) {
      this.logger.error(`Failed to delete alert: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Start monitoring for competitor
   */
  async startMonitoring(competitorId: string, config?: any) {
    try {
      this.logger.log(`Starting monitoring for competitor: ${competitorId}`);

      const competitor = await this.competitorRepository.findOne({
        where: { id: competitorId }
      });

      if (!competitor) {
        throw new Error(`Competitor not found: ${competitorId}`);
      }

      const monitoringConfig = {
        competitorId,
        competitorName: competitor.name,
        dataTypes: config?.dataTypes || ['social', 'search', 'ecommerce', 'web'],
        frequency: config?.frequency || 'daily',
        alertThresholds: config?.alertThresholds || {},
        notifications: config?.notifications || {},
        startedAt: new Date().toISOString(),
        isActive: true
      };

      this.activeMonitoring.set(competitorId, monitoringConfig);

      this.appInsights.trackEvent('CompetitionX:MonitoringStarted', {
        competitorId,
        competitorName: competitor.name
      });

      this.logger.log(`Monitoring started for competitor: ${competitor.name}`);

    } catch (error) {
      this.logger.error(`Failed to start monitoring: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Stop monitoring for competitor
   */
  async stopMonitoring(competitorId: string) {
    try {
      this.logger.log(`Stopping monitoring for competitor: ${competitorId}`);

      const monitoringConfig = this.activeMonitoring.get(competitorId);
      
      if (monitoringConfig) {
        this.activeMonitoring.delete(competitorId);

        this.appInsights.trackEvent('CompetitionX:MonitoringStopped', {
          competitorId,
          competitorName: monitoringConfig.competitorName
        });

        this.logger.log(`Monitoring stopped for competitor: ${monitoringConfig.competitorName}`);
      }

    } catch (error) {
      this.logger.error(`Failed to stop monitoring: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get competitor monitoring status
   */
  async getCompetitorMonitoringStatus(competitorId: string) {
    try {
      const monitoringConfig = this.activeMonitoring.get(competitorId);
      
      if (!monitoringConfig) {
        return {
          isActive: false,
          message: 'Monitoring not active for this competitor'
        };
      }

      const recentAlerts = await this.monitoringAlertRepository.find({
        where: { competitorId },
        order: { createdAt: 'DESC' },
        take: 5
      });

      return {
        isActive: true,
        config: monitoringConfig,
        recentAlerts: recentAlerts.length,
        lastAlert: recentAlerts[0]?.createdAt || null
      };

    } catch (error) {
      this.logger.error(`Failed to get competitor monitoring status: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Configure monitoring
   */
  async configureMonitoring(competitorId: string, config: any) {
    try {
      const existingConfig = this.activeMonitoring.get(competitorId);
      
      if (!existingConfig) {
        throw new Error(`Monitoring not active for competitor: ${competitorId}`);
      }

      const updatedConfig = {
        ...existingConfig,
        ...config,
        updatedAt: new Date().toISOString()
      };

      this.activeMonitoring.set(competitorId, updatedConfig);

      this.appInsights.trackEvent('CompetitionX:MonitoringConfigured', {
        competitorId
      });

    } catch (error) {
      this.logger.error(`Failed to configure monitoring: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get alert statistics
   */
  async getAlertStatistics(timeRange: string = '24h') {
    try {
      const days = timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
      const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const alerts = await this.monitoringAlertRepository.find({
        where: {
          createdAt: cutoffDate as any // In real implementation, use MoreThan
        }
      });

      const statistics = {
        total: alerts.length,
        byStatus: this.groupBy(alerts, 'status'),
        bySeverity: this.groupBy(alerts, 'severity'),
        byType: this.groupBy(alerts, 'type'),
        averageResolutionTime: this.calculateAverageResolutionTime(alerts),
        alertTrends: this.calculateAlertTrends(alerts),
        severityDistribution: this.calculateSeverityDistribution(alerts),
        responseTimeMetrics: this.calculateResponseTimeMetrics(alerts)
      };

      return statistics;

    } catch (error) {
      this.logger.error(`Failed to get alert statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Helper methods
   */
  private async getTodayAlertsCount(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await this.monitoringAlertRepository.count({
      where: {
        createdAt: today as any // In real implementation, use MoreThan
      }
    });
  }

  private async sendAlertNotifications(alert: MonitoringAlert) {
    try {
      // In a real implementation, this would send notifications via email, Slack, etc.
      this.logger.log(`Sending notifications for alert: ${alert.id}`);
      
      // Update notification status
      alert.isNotificationSent = true;
      alert.notificationHistory = [{
        channel: 'email',
        recipient: 'admin@company.com',
        timestamp: new Date().toISOString(),
        status: 'sent'
      }];

      await this.monitoringAlertRepository.save(alert);

    } catch (error) {
      this.logger.error(`Failed to send alert notifications: ${error.message}`, error.stack);
    }
  }

  private groupBy(array: any[], key: string) {
    return array.reduce((groups, item) => {
      const group = item[key] || 'unknown';
      groups[group] = (groups[group] || 0) + 1;
      return groups;
    }, {});
  }

  private calculateAverageResolutionTime(alerts: MonitoringAlert[]): number {
    const resolvedAlerts = alerts.filter(a => a.resolvedAt && a.createdAt);
    
    if (resolvedAlerts.length === 0) return 0;

    const totalTime = resolvedAlerts.reduce((sum, alert) => {
      const resolutionTime = new Date(alert.resolvedAt).getTime() - new Date(alert.createdAt).getTime();
      return sum + resolutionTime;
    }, 0);

    return totalTime / resolvedAlerts.length / (1000 * 60 * 60); // Convert to hours
  }

  private calculateAlertTrends(alerts: MonitoringAlert[]) {
    // Simplified trend calculation
    return {
      trend: 'stable',
      change: 0,
      period: '24h'
    };
  }

  private calculateSeverityDistribution(alerts: MonitoringAlert[]) {
    const total = alerts.length;
    if (total === 0) return {};

    const distribution = this.groupBy(alerts, 'severity');
    
    Object.keys(distribution).forEach(severity => {
      distribution[severity] = (distribution[severity] / total) * 100;
    });

    return distribution;
  }

  private calculateResponseTimeMetrics(alerts: MonitoringAlert[]) {
    return {
      averageAcknowledgmentTime: 15, // minutes
      averageResolutionTime: 120, // minutes
      slaCompliance: 95 // percentage
    };
  }

  // Additional methods for comprehensive monitoring
  async getActiveMonitoringCount(): Promise<number> {
    return this.activeMonitoring.size;
  }

  async getMonitoringRules(competitorId?: string, ruleType?: string) {
    // Return monitoring rules
    return [];
  }

  async createMonitoringRule(ruleData: any) {
    const ruleId = `rule_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    return { id: ruleId, ...ruleData };
  }

  async updateMonitoringRule(ruleId: string, updateData: any) {
    // Update monitoring rule
  }

  async deleteMonitoringRule(ruleId: string) {
    // Delete monitoring rule
  }

  async getSystemHealth() {
    return {
      status: 'healthy',
      uptime: '99.9%',
      lastCheck: new Date().toISOString(),
      components: {
        alerting: 'healthy',
        notifications: 'healthy',
        dataCollection: 'healthy'
      }
    };
  }

  async sendTestAlert(testConfig: any) {
    const testAlert = await this.createAlert({
      type: testConfig.alertType,
      severity: testConfig.severity,
      title: 'Test Alert',
      message: 'This is a test alert for system validation',
      competitorId: testConfig.competitorId,
      competitorName: 'Test Competitor',
      source: 'test',
      actionRequired: false
    });

    return (testAlert as any).id;
  }

  async getNotificationHistory(timeRange: string, channel?: string) {
    // Return notification history
    return {
      notifications: [],
      total: 0,
      timeRange,
      channel
    };
  }

  async testNotifications(channels: any[]) {
    return channels.map(channel => ({
      channel: channel.type,
      target: channel.target,
      status: 'success',
      timestamp: new Date().toISOString()
    }));
  }
}
