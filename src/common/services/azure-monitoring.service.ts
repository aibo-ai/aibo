import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as appInsights from 'applicationinsights';

export interface CustomMetric {
  name: string;
  value: number;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

export interface CustomEvent {
  name: string;
  properties?: Record<string, string>;
  measurements?: Record<string, number>;
}

export interface PerformanceMetric {
  operationName: string;
  duration: number;
  success: boolean;
  properties?: Record<string, string>;
}

@Injectable()
export class AzureMonitoringService {
  private readonly logger = new Logger(AzureMonitoringService.name);
  private telemetryClient: appInsights.TelemetryClient;
  private isInitialized = false;

  constructor(private configService: ConfigService) {
    this.initializeAppInsights();
  }

  private initializeAppInsights(): void {
    try {
      const instrumentationKey = this.configService.get<string>('APPINSIGHTS_INSTRUMENTATIONKEY');
      const connectionString = this.configService.get<string>('APPLICATIONINSIGHTS_CONNECTION_STRING');

      if (!instrumentationKey && !connectionString) {
        this.logger.warn('Application Insights not configured - monitoring will be disabled');
        return;
      }

      // Configure Application Insights
      appInsights.setup(connectionString || instrumentationKey)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true, true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .setAutoCollectConsole(true)
        .setUseDiskRetryCaching(true)
        .setSendLiveMetrics(true)
        .setDistributedTracingMode(appInsights.DistributedTracingModes.AI_AND_W3C);

      // Set cloud role name
      appInsights.defaultClient.context.tags[appInsights.defaultClient.context.keys.cloudRole] = 'content-architect-api';

      // Start Application Insights
      appInsights.start();

      this.telemetryClient = appInsights.defaultClient;
      this.isInitialized = true;

      this.logger.log('Application Insights initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Application Insights:', error);
    }
  }

  /**
   * Track custom metric
   */
  trackMetric(metric: CustomMetric): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.trackMetric({
        name: metric.name,
        value: typeof metric.value === 'number' ? metric.value : (typeof metric.measurements === 'number' ? metric.measurements : 0),
        properties: metric.properties
      });
    } catch (error) {
      this.logger.error('Failed to track metric:', error);
    }
  }

  /**
   * Track custom event
   */
  trackEvent(event: CustomEvent): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.trackEvent({
        name: event.name,
        properties: event.properties,
        measurements: event.measurements
      });
    } catch (error) {
      this.logger.error('Failed to track event:', error);
    }
  }

  /**
   * Track exception
   */
  trackException(error: Error, properties?: Record<string, string>): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.trackException({
        exception: error,
        properties
      });
    } catch (trackingError) {
      this.logger.error('Failed to track exception:', trackingError);
    }
  }

  /**
   * Track dependency call
   */
  trackDependency(
    dependencyTypeName: string,
    name: string,
    data: string,
    duration: number,
    success: boolean,
    properties?: Record<string, string>
  ): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.trackDependency({
        dependencyTypeName,
        name,
        data,
        duration,
        success,
        resultCode: success ? 200 : 500,
        properties
      });
    } catch (error) {
      this.logger.error('Failed to track dependency:', error);
    }
  }

  /**
   * Track request performance
   */
  trackRequest(
    name: string,
    url: string,
    duration: number,
    responseCode: string,
    success: boolean,
    properties?: Record<string, string>
  ): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.trackRequest({
        name,
        url,
        duration,
        resultCode: responseCode,
        success,
        properties
      });
    } catch (error) {
      this.logger.error('Failed to track request:', error);
    }
  }

  /**
   * Track page view (for client-side tracking)
   */
  trackPageView(
    name: string,
    url?: string,
    duration?: number,
    properties?: Record<string, string>
  ): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.trackPageView({
        name,
        url,
        duration,
        properties
      });
    } catch (error) {
      this.logger.error('Failed to track page view:', error);
    }
  }

  /**
   * Track business metrics
   */
  trackBusinessMetrics(metrics: {
    contentGenerated?: number;
    apiCallsCount?: number;
    userEngagement?: number;
    conversionRate?: number;
    errorRate?: number;
    [key: string]: number;
  }): void {
    if (!this.isInitialized) return;

    try {
      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          this.trackMetric({
            name: `Business.${key}`,
            value,
            properties: {
              category: 'business',
              timestamp: new Date().toISOString()
            }
          });
        }
      });
    } catch (error) {
      this.logger.error('Failed to track business metrics:', error);
    }
  }

  /**
   * Track performance metrics
   */
  trackPerformanceMetrics(metrics: {
    responseTime?: number;
    throughput?: number;
    cpuUsage?: number;
    memoryUsage?: number;
    diskUsage?: number;
    [key: string]: number;
  }): void {
    if (!this.isInitialized) return;

    try {
      Object.entries(metrics).forEach(([key, value]) => {
        if (typeof value === 'number') {
          this.trackMetric({
            name: `Performance.${key}`,
            value,
            properties: {
              category: 'performance',
              timestamp: new Date().toISOString()
            }
          });
        }
      });
    } catch (error) {
      this.logger.error('Failed to track performance metrics:', error);
    }
  }

  /**
   * Track competitor analysis metrics
   */
  trackCompetitorMetrics(metrics: {
    competitorId: string;
    analysisType: string;
    processingTime: number;
    dataPoints: number;
    accuracy?: number;
    [key: string]: string | number;
  }): void {
    if (!this.isInitialized) return;

    try {
      this.trackEvent({
        name: 'CompetitorAnalysis',
        properties: {
          competitorId: metrics.competitorId,
          analysisType: metrics.analysisType,
          timestamp: new Date().toISOString()
        },
        measurements: {
          processingTime: metrics.processingTime,
          dataPoints: metrics.dataPoints,
          accuracy: metrics.accuracy || 0
        }
      });
    } catch (error) {
      this.logger.error('Failed to track competitor metrics:', error);
    }
  }

  /**
   * Track AI analysis metrics
   */
  trackAIMetrics(metrics: {
    modelType: string;
    inputTokens: number;
    outputTokens: number;
    processingTime: number;
    confidence: number;
    cost?: number;
  }): void {
    if (!this.isInitialized) return;

    try {
      this.trackEvent({
        name: 'AIAnalysis',
        properties: {
          modelType: metrics.modelType,
          timestamp: new Date().toISOString()
        },
        measurements: {
          inputTokens: metrics.inputTokens,
          outputTokens: metrics.outputTokens,
          processingTime: metrics.processingTime,
          confidence: metrics.confidence,
          cost: metrics.cost || 0
        }
      });
    } catch (error) {
      this.logger.error('Failed to track AI metrics:', error);
    }
  }

  /**
   * Create custom dashboard data
   */
  async getDashboardMetrics(timeRange: string = '24h'): Promise<any> {
    try {
      // In a real implementation, this would query Application Insights Analytics API
      // For now, return mock dashboard data
      return {
        timeRange,
        metrics: {
          totalRequests: 15420,
          averageResponseTime: 245,
          errorRate: 0.02,
          activeUsers: 1250,
          contentGenerated: 3420,
          competitorAnalyses: 156,
          aiInsights: 89
        },
        trends: {
          requestTrend: 'up',
          performanceTrend: 'stable',
          errorTrend: 'down'
        },
        alerts: [
          {
            severity: 'warning',
            message: 'Response time increased by 15% in the last hour',
            timestamp: new Date().toISOString()
          }
        ]
      };
    } catch (error) {
      this.logger.error('Failed to get dashboard metrics:', error);
      return null;
    }
  }

  /**
   * Flush telemetry data
   */
  flush(): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.flush();
    } catch (error) {
      this.logger.error('Failed to flush telemetry:', error);
    }
  }

  /**
   * Set user context
   */
  setUserContext(userId: string, properties?: Record<string, string>): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.context.tags[this.telemetryClient.context.keys.userId] = userId;
      
      if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
          this.telemetryClient.context.tags[`user.${key}`] = value;
        });
      }
    } catch (error) {
      this.logger.error('Failed to set user context:', error);
    }
  }

  /**
   * Set session context
   */
  setSessionContext(sessionId: string, properties?: Record<string, string>): void {
    if (!this.isInitialized) return;

    try {
      this.telemetryClient.context.tags[this.telemetryClient.context.keys.sessionId] = sessionId;
      
      if (properties) {
        Object.entries(properties).forEach(([key, value]) => {
          this.telemetryClient.context.tags[`session.${key}`] = value;
        });
      }
    } catch (error) {
      this.logger.error('Failed to set session context:', error);
    }
  }

  /**
   * Create correlation context
   */
  createCorrelationContext(): string {
    if (!this.isInitialized) return '';

    try {
      return (this.telemetryClient as any).context?.operation?.id || '';
    } catch (error) {
      this.logger.error('Failed to create correlation context:', error);
      return '';
    }
  }
}
