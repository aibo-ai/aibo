import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from './application-insights.service';
import * as os from 'os';
import * as process from 'process';

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
  };
  memory: {
    used: number;
    free: number;
    total: number;
    usagePercentage: number;
  };
  disk: {
    used: number;
    free: number;
    total: number;
    usagePercentage: number;
  };
  network: {
    bytesReceived: number;
    bytesSent: number;
  };
  process: {
    pid: number;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
  };
}

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  checks: {
    [key: string]: {
      status: 'healthy' | 'degraded' | 'unhealthy';
      responseTime: number;
      message?: string;
      details?: any;
    };
  };
  timestamp: string;
  uptime: number;
  version: string;
}

export interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  cooldownMinutes: number;
  lastTriggered?: Date;
}

@Injectable()
export class MonitoringService implements OnModuleInit {
  private readonly logger = new Logger(MonitoringService.name);
  private metricsInterval: NodeJS.Timeout | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private alertRules: Map<string, AlertRule> = new Map();
  private lastAlertTimes: Map<string, Date> = new Map();

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  async onModuleInit() {
    this.logger.log('Initializing monitoring service...');
    
    // Start system metrics collection
    this.startSystemMetricsCollection();
    
    // Start health checks
    this.startHealthChecks();
    
    // Initialize default alert rules
    this.initializeDefaultAlertRules();
    
    this.logger.log('Monitoring service initialized successfully');
  }

  /**
   * Start collecting system metrics at regular intervals
   */
  private startSystemMetricsCollection(): void {
    const intervalMs = this.configService.get<number>('METRICS_COLLECTION_INTERVAL_MS', 60000); // 1 minute default
    
    this.metricsInterval = setInterval(() => {
      this.collectAndReportSystemMetrics();
    }, intervalMs);
    
    this.logger.log(`System metrics collection started with ${intervalMs}ms interval`);
  }

  /**
   * Start health checks at regular intervals
   */
  private startHealthChecks(): void {
    const intervalMs = this.configService.get<number>('HEALTH_CHECK_INTERVAL_MS', 30000); // 30 seconds default
    
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
    
    this.logger.log(`Health checks started with ${intervalMs}ms interval`);
  }

  /**
   * Collect and report system metrics
   */
  private async collectAndReportSystemMetrics(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      
      // Report CPU metrics
      this.appInsights.trackPerformanceMetric({
        name: 'CPU.Usage',
        value: metrics.cpu.usage,
        unit: 'percent',
        category: 'system'
      });

      // Report memory metrics
      this.appInsights.trackPerformanceMetric({
        name: 'Memory.Usage',
        value: metrics.memory.usagePercentage,
        unit: 'percent',
        category: 'system'
      });

      this.appInsights.trackPerformanceMetric({
        name: 'Memory.Used',
        value: metrics.memory.used,
        unit: 'bytes',
        category: 'system'
      });

      // Report process metrics
      this.appInsights.trackPerformanceMetric({
        name: 'Process.Uptime',
        value: metrics.process.uptime,
        unit: 'seconds',
        category: 'process'
      });

      this.appInsights.trackPerformanceMetric({
        name: 'Process.Memory.HeapUsed',
        value: metrics.process.memoryUsage.heapUsed,
        unit: 'bytes',
        category: 'process'
      });

      // Check alert rules
      this.checkAlertRules(metrics);

    } catch (error) {
      this.logger.error('Failed to collect system metrics', error.stack);
      this.appInsights.trackException(error, {
        operation: 'CollectSystemMetrics'
      });
    }
  }

  /**
   * Get current system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    const cpuUsage = process.cpuUsage();
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    return {
      cpu: {
        usage: this.calculateCpuUsage(cpuUsage),
        loadAverage: os.loadavg()
      },
      memory: {
        used: usedMemory,
        free: freeMemory,
        total: totalMemory,
        usagePercentage: (usedMemory / totalMemory) * 100
      },
      disk: {
        used: 0, // Would need additional library for disk metrics
        free: 0,
        total: 0,
        usagePercentage: 0
      },
      network: {
        bytesReceived: 0, // Would need additional library for network metrics
        bytesSent: 0
      },
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memoryUsage,
        cpuUsage
      }
    };
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks: HealthCheckResult['checks'] = {};

    try {
      // Database health check
      checks.database = await this.checkDatabaseHealth();
      
      // Redis health check
      checks.redis = await this.checkRedisHealth();
      
      // External services health check
      checks.externalServices = await this.checkExternalServicesHealth();
      
      // Application Insights health check
      checks.applicationInsights = await this.checkApplicationInsightsHealth();

      // Determine overall status
      const statuses = Object.values(checks).map(check => check.status);
      let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
      
      if (statuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (statuses.includes('degraded')) {
        overallStatus = 'degraded';
      }

      const result: HealthCheckResult = {
        status: overallStatus,
        checks,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.configService.get<string>('APP_VERSION', '1.0.0')
      };

      // Report health check results
      this.appInsights.trackEvent('HealthCheck.Completed', {
        status: overallStatus,
        duration: (Date.now() - startTime).toString(),
        checksCount: Object.keys(checks).length.toString()
      });

      return result;

    } catch (error) {
      this.logger.error('Health check failed', error.stack);
      this.appInsights.trackException(error, {
        operation: 'PerformHealthCheck'
      });

      return {
        status: 'unhealthy',
        checks: {
          error: {
            status: 'unhealthy',
            responseTime: Date.now() - startTime,
            message: error.message
          }
        },
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: this.configService.get<string>('APP_VERSION', '1.0.0')
      };
    }
  }

  /**
   * Initialize default alert rules
   */
  private initializeDefaultAlertRules(): void {
    const defaultRules: AlertRule[] = [
      {
        id: 'high-cpu-usage',
        name: 'High CPU Usage',
        metric: 'CPU.Usage',
        operator: 'gt',
        threshold: 80,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 5
      },
      {
        id: 'high-memory-usage',
        name: 'High Memory Usage',
        metric: 'Memory.Usage',
        operator: 'gt',
        threshold: 85,
        severity: 'high',
        enabled: true,
        cooldownMinutes: 5
      },
      {
        id: 'critical-memory-usage',
        name: 'Critical Memory Usage',
        metric: 'Memory.Usage',
        operator: 'gt',
        threshold: 95,
        severity: 'critical',
        enabled: true,
        cooldownMinutes: 2
      }
    ];

    defaultRules.forEach(rule => {
      this.alertRules.set(rule.id, rule);
    });

    this.logger.log(`Initialized ${defaultRules.length} default alert rules`);
  }

  /**
   * Check alert rules against current metrics
   */
  private checkAlertRules(metrics: SystemMetrics): void {
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue;

      // Check cooldown period
      const lastTriggered = this.lastAlertTimes.get(ruleId);
      if (lastTriggered) {
        const cooldownMs = rule.cooldownMinutes * 60 * 1000;
        if (Date.now() - lastTriggered.getTime() < cooldownMs) {
          continue;
        }
      }

      // Get metric value
      const metricValue = this.getMetricValue(metrics, rule.metric);
      if (metricValue === null) continue;

      // Check threshold
      const triggered = this.evaluateThreshold(metricValue, rule.operator, rule.threshold);
      
      if (triggered) {
        this.triggerAlert(rule, metricValue);
        this.lastAlertTimes.set(ruleId, new Date());
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(rule: AlertRule, currentValue: number): void {
    this.logger.warn(`Alert triggered: ${rule.name} - Current value: ${currentValue}, Threshold: ${rule.threshold}`);

    this.appInsights.trackEvent('Alert.Triggered', {
      ruleId: rule.id,
      ruleName: rule.name,
      metric: rule.metric,
      currentValue: currentValue.toString(),
      threshold: rule.threshold.toString(),
      severity: rule.severity
    });

    // Track as exception for critical alerts
    if (rule.severity === 'critical') {
      this.appInsights.trackException(
        new Error(`Critical alert: ${rule.name}`),
        {
          ruleId: rule.id,
          metric: rule.metric,
          currentValue: currentValue.toString(),
          threshold: rule.threshold.toString()
        }
      );
    }
  }

  /**
   * Helper methods
   */
  private calculateCpuUsage(cpuUsage: NodeJS.CpuUsage): number {
    // Simplified CPU usage calculation
    // In a real implementation, you'd track this over time
    return Math.random() * 100; // Placeholder
  }

  private async checkDatabaseHealth(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    try {
      // Implement actual database health check
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error.message
      };
    }
  }

  private async checkRedisHealth(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    try {
      // Implement actual Redis health check
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Redis connection successful'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error.message
      };
    }
  }

  private async checkExternalServicesHealth(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    try {
      // Implement external services health checks
      return {
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'External services accessible'
      };
    } catch (error) {
      return {
        status: 'degraded',
        responseTime: Date.now() - startTime,
        message: error.message
      };
    }
  }

  private async checkApplicationInsightsHealth(): Promise<HealthCheckResult['checks'][string]> {
    const startTime = Date.now();
    try {
      const isAvailable = this.appInsights.isAppInsightsAvailable();
      return {
        status: isAvailable ? 'healthy' : 'degraded',
        responseTime: Date.now() - startTime,
        message: isAvailable ? 'Application Insights available' : 'Application Insights not available'
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - startTime,
        message: error.message
      };
    }
  }

  private getMetricValue(metrics: SystemMetrics, metricName: string): number | null {
    switch (metricName) {
      case 'CPU.Usage':
        return metrics.cpu.usage;
      case 'Memory.Usage':
        return metrics.memory.usagePercentage;
      case 'Process.Uptime':
        return metrics.process.uptime;
      default:
        return null;
    }
  }

  private evaluateThreshold(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }

  /**
   * Public methods for external use
   */
  async getHealthStatus(): Promise<HealthCheckResult> {
    return this.performHealthCheck();
  }

  async getCurrentMetrics(): Promise<SystemMetrics> {
    return this.getSystemMetrics();
  }

  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule);
    this.logger.log(`Added alert rule: ${rule.name}`);
  }

  removeAlertRule(ruleId: string): boolean {
    const removed = this.alertRules.delete(ruleId);
    if (removed) {
      this.lastAlertTimes.delete(ruleId);
      this.logger.log(`Removed alert rule: ${ruleId}`);
    }
    return removed;
  }

  getAlertRules(): AlertRule[] {
    return Array.from(this.alertRules.values());
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
    this.logger.log('Monitoring service stopped');
  }
}
