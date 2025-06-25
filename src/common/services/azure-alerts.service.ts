import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureMonitoringService } from './azure-monitoring.service';

export interface AlertRule {
  name: string;
  description: string;
  severity: 'Critical' | 'Error' | 'Warning' | 'Informational';
  condition: {
    metric: string;
    operator: 'GreaterThan' | 'LessThan' | 'GreaterThanOrEqual' | 'LessThanOrEqual' | 'Equals';
    threshold: number;
    timeAggregation: 'Average' | 'Maximum' | 'Minimum' | 'Total' | 'Count';
    windowSize: string; // ISO 8601 duration format
  };
  actions: {
    email?: string[];
    webhook?: string;
    sms?: string[];
  };
  enabled: boolean;
}

export interface AlertStatus {
  ruleId: string;
  name: string;
  status: 'Fired' | 'Resolved' | 'Disabled';
  lastFired?: Date;
  lastResolved?: Date;
  currentValue?: number;
  threshold: number;
}

@Injectable()
export class AzureAlertsService {
  private readonly logger = new Logger(AzureAlertsService.name);
  private alertRules: Map<string, AlertRule> = new Map();
  private alertStatuses: Map<string, AlertStatus> = new Map();

  constructor(
    private configService: ConfigService,
    private azureMonitoringService: AzureMonitoringService
  ) {
    this.initializeDefaultAlerts();
  }

  /**
   * Initialize default alert rules for the application
   */
  private initializeDefaultAlerts(): void {
    const defaultAlerts: AlertRule[] = [
      {
        name: 'HighErrorRate',
        description: 'Alert when error rate exceeds 5% in 5 minutes',
        severity: 'Critical',
        condition: {
          metric: 'exceptions/count',
          operator: 'GreaterThan',
          threshold: 10,
          timeAggregation: 'Count',
          windowSize: 'PT5M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'HighResponseTime',
        description: 'Alert when average response time exceeds 2 seconds',
        severity: 'Warning',
        condition: {
          metric: 'requests/duration',
          operator: 'GreaterThan',
          threshold: 2000,
          timeAggregation: 'Average',
          windowSize: 'PT5M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'LowAvailability',
        description: 'Alert when availability drops below 95%',
        severity: 'Critical',
        condition: {
          metric: 'availabilityResults/availabilityPercentage',
          operator: 'LessThan',
          threshold: 95,
          timeAggregation: 'Average',
          windowSize: 'PT10M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'HighMemoryUsage',
        description: 'Alert when memory usage exceeds 80%',
        severity: 'Warning',
        condition: {
          metric: 'performanceCounters/memoryAvailableBytes',
          operator: 'LessThan',
          threshold: 1073741824, // 1GB in bytes
          timeAggregation: 'Average',
          windowSize: 'PT5M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'HighCPUUsage',
        description: 'Alert when CPU usage exceeds 80%',
        severity: 'Warning',
        condition: {
          metric: 'performanceCounters/processCpuPercentage',
          operator: 'GreaterThan',
          threshold: 80,
          timeAggregation: 'Average',
          windowSize: 'PT5M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'APIRateLimitExceeded',
        description: 'Alert when API rate limit is exceeded',
        severity: 'Error',
        condition: {
          metric: 'customEvents/count',
          operator: 'GreaterThan',
          threshold: 100,
          timeAggregation: 'Count',
          windowSize: 'PT1M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'DatabaseConnectionFailure',
        description: 'Alert when database connections fail',
        severity: 'Critical',
        condition: {
          metric: 'dependencies/failed',
          operator: 'GreaterThan',
          threshold: 5,
          timeAggregation: 'Count',
          windowSize: 'PT5M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      },
      {
        name: 'LowDiskSpace',
        description: 'Alert when disk space is below 10%',
        severity: 'Warning',
        condition: {
          metric: 'performanceCounters/availableDiskSpace',
          operator: 'LessThan',
          threshold: 10,
          timeAggregation: 'Average',
          windowSize: 'PT15M'
        },
        actions: {
          email: [this.configService.get<string>('ALERT_EMAIL', 'admin@example.com')]
        },
        enabled: true
      }
    ];

    defaultAlerts.forEach(alert => {
      this.alertRules.set(alert.name, alert);
      this.alertStatuses.set(alert.name, {
        ruleId: alert.name,
        name: alert.name,
        status: 'Resolved',
        threshold: alert.condition.threshold
      });
    });

    this.logger.log(`Initialized ${defaultAlerts.length} default alert rules`);
  }

  /**
   * Create a new alert rule
   */
  async createAlertRule(rule: AlertRule): Promise<boolean> {
    try {
      this.alertRules.set(rule.name, rule);
      this.alertStatuses.set(rule.name, {
        ruleId: rule.name,
        name: rule.name,
        status: 'Resolved',
        threshold: rule.condition.threshold
      });

      this.logger.log(`Created alert rule: ${rule.name}`);
      
      // Track alert rule creation
      this.azureMonitoringService.trackEvent({
        name: 'AlertRuleCreated',
        properties: {
          ruleName: rule.name,
          severity: rule.severity,
          metric: rule.condition.metric
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to create alert rule ${rule.name}:`, error);
      return false;
    }
  }

  /**
   * Update an existing alert rule
   */
  async updateAlertRule(name: string, updates: Partial<AlertRule>): Promise<boolean> {
    try {
      const existingRule = this.alertRules.get(name);
      if (!existingRule) {
        this.logger.warn(`Alert rule ${name} not found`);
        return false;
      }

      const updatedRule = { ...existingRule, ...updates };
      this.alertRules.set(name, updatedRule);

      this.logger.log(`Updated alert rule: ${name}`);
      
      // Track alert rule update
      this.azureMonitoringService.trackEvent({
        name: 'AlertRuleUpdated',
        properties: {
          ruleName: name,
          updatedFields: Object.keys(updates).join(',')
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to update alert rule ${name}:`, error);
      return false;
    }
  }

  /**
   * Delete an alert rule
   */
  async deleteAlertRule(name: string): Promise<boolean> {
    try {
      const deleted = this.alertRules.delete(name);
      this.alertStatuses.delete(name);

      if (deleted) {
        this.logger.log(`Deleted alert rule: ${name}`);
        
        // Track alert rule deletion
        this.azureMonitoringService.trackEvent({
          name: 'AlertRuleDeleted',
          properties: {
            ruleName: name
          }
        });
      }

      return deleted;
    } catch (error) {
      this.logger.error(`Failed to delete alert rule ${name}:`, error);
      return false;
    }
  }

  /**
   * Get all alert rules
   */
  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Get alert rule by name
   */
  getAlertRule(name: string): AlertRule | undefined {
    return this.alertRules.get(name);
  }

  /**
   * Get all alert statuses
   */
  getAlertStatuses(): AlertStatus[] {
    return Array.from(this.alertStatuses.values());
  }

  /**
   * Get alert status by name
   */
  getAlertStatus(name: string): AlertStatus | undefined {
    return this.alertStatuses.get(name);
  }

  /**
   * Enable/disable an alert rule
   */
  async toggleAlertRule(name: string, enabled: boolean): Promise<boolean> {
    try {
      const rule = this.alertRules.get(name);
      if (!rule) {
        this.logger.warn(`Alert rule ${name} not found`);
        return false;
      }

      rule.enabled = enabled;
      this.alertRules.set(name, rule);

      this.logger.log(`${enabled ? 'Enabled' : 'Disabled'} alert rule: ${name}`);
      
      // Track alert rule toggle
      this.azureMonitoringService.trackEvent({
        name: 'AlertRuleToggled',
        properties: {
          ruleName: name,
          enabled: enabled.toString()
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Failed to toggle alert rule ${name}:`, error);
      return false;
    }
  }

  /**
   * Evaluate alert conditions (this would typically be called by Azure Monitor)
   */
  async evaluateAlerts(metrics: Record<string, number>): Promise<void> {
    for (const [name, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      try {
        const currentValue = metrics[rule.condition.metric];
        if (currentValue === undefined) continue;

        const status = this.alertStatuses.get(name);
        if (!status) continue;

        const shouldFire = this.evaluateCondition(currentValue, rule.condition);
        
        if (shouldFire && status.status !== 'Fired') {
          await this.fireAlert(name, rule, currentValue);
        } else if (!shouldFire && status.status === 'Fired') {
          await this.resolveAlert(name, rule);
        }

        // Update current value
        status.currentValue = currentValue;
        this.alertStatuses.set(name, status);

      } catch (error) {
        this.logger.error(`Error evaluating alert ${name}:`, error);
      }
    }
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(value: number, condition: AlertRule['condition']): boolean {
    switch (condition.operator) {
      case 'GreaterThan':
        return value > condition.threshold;
      case 'LessThan':
        return value < condition.threshold;
      case 'GreaterThanOrEqual':
        return value >= condition.threshold;
      case 'LessThanOrEqual':
        return value <= condition.threshold;
      case 'Equals':
        return value === condition.threshold;
      default:
        return false;
    }
  }

  /**
   * Fire an alert
   */
  private async fireAlert(name: string, rule: AlertRule, currentValue: number): Promise<void> {
    try {
      const status = this.alertStatuses.get(name);
      if (status) {
        status.status = 'Fired';
        status.lastFired = new Date();
        status.currentValue = currentValue;
        this.alertStatuses.set(name, status);
      }

      this.logger.warn(`Alert fired: ${name} - Current value: ${currentValue}, Threshold: ${rule.condition.threshold}`);

      // Track alert firing
      this.azureMonitoringService.trackEvent({
        name: 'AlertFired',
        properties: {
          ruleName: name,
          severity: rule.severity,
          currentValue: currentValue.toString(),
          threshold: rule.condition.threshold.toString()
        }
      });

      // Send notifications (email, webhook, etc.)
      await this.sendNotifications(rule, currentValue);

    } catch (error) {
      this.logger.error(`Error firing alert ${name}:`, error);
    }
  }

  /**
   * Resolve an alert
   */
  private async resolveAlert(name: string, rule: AlertRule): Promise<void> {
    try {
      const status = this.alertStatuses.get(name);
      if (status) {
        status.status = 'Resolved';
        status.lastResolved = new Date();
        this.alertStatuses.set(name, status);
      }

      this.logger.log(`Alert resolved: ${name}`);

      // Track alert resolution
      this.azureMonitoringService.trackEvent({
        name: 'AlertResolved',
        properties: {
          ruleName: name,
          severity: rule.severity
        }
      });

    } catch (error) {
      this.logger.error(`Error resolving alert ${name}:`, error);
    }
  }

  /**
   * Send notifications for fired alerts
   */
  private async sendNotifications(rule: AlertRule, currentValue: number): Promise<void> {
    try {
      // This is a simplified implementation
      // In production, you would integrate with actual notification services
      
      if (rule.actions.email && rule.actions.email.length > 0) {
        this.logger.log(`Would send email notification to: ${rule.actions.email.join(', ')}`);
        // Implement email sending logic here
      }

      if (rule.actions.webhook) {
        this.logger.log(`Would send webhook notification to: ${rule.actions.webhook}`);
        // Implement webhook sending logic here
      }

      if (rule.actions.sms && rule.actions.sms.length > 0) {
        this.logger.log(`Would send SMS notification to: ${rule.actions.sms.join(', ')}`);
        // Implement SMS sending logic here
      }

    } catch (error) {
      this.logger.error('Error sending notifications:', error);
    }
  }

  /**
   * Get alert summary
   */
  getAlertSummary(): {
    total: number;
    fired: number;
    resolved: number;
    disabled: number;
  } {
    const statuses = Array.from(this.alertStatuses.values());
    
    return {
      total: statuses.length,
      fired: statuses.filter(s => s.status === 'Fired').length,
      resolved: statuses.filter(s => s.status === 'Resolved').length,
      disabled: statuses.filter(s => s.status === 'Disabled').length
    };
  }
}
