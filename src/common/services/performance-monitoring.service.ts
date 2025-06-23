import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from './application-insights.service';
import * as promClient from 'prom-client';

export interface PerformanceMetrics {
  requestDuration: number;
  memoryUsage: NodeJS.MemoryUsage;
  cpuUsage: number;
  activeConnections: number;
  errorRate: number;
  throughput: number;
}

export interface BusinessMetrics {
  contentGenerated: number;
  citationsVerified: number;
  factChecksPerformed: number;
  userSessions: number;
  apiCalls: number;
}

@Injectable()
export class PerformanceMonitoringService {
  private readonly logger = new Logger(PerformanceMonitoringService.name);
  private readonly register = new promClient.Registry();
  
  // Prometheus metrics
  private readonly httpRequestDuration = new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
  });

  private readonly httpRequestsTotal = new promClient.Counter({
    name: 'http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  private readonly activeConnections = new promClient.Gauge({
    name: 'active_connections',
    help: 'Number of active connections',
  });

  private readonly memoryUsage = new promClient.Gauge({
    name: 'memory_usage_bytes',
    help: 'Memory usage in bytes',
    labelNames: ['type'],
  });

  private readonly cpuUsage = new promClient.Gauge({
    name: 'cpu_usage_percent',
    help: 'CPU usage percentage',
  });

  // Business metrics
  private readonly contentGenerated = new promClient.Counter({
    name: 'content_generated_total',
    help: 'Total number of content pieces generated',
    labelNames: ['type', 'status'],
  });

  private readonly citationsVerified = new promClient.Counter({
    name: 'citations_verified_total',
    help: 'Total number of citations verified',
    labelNames: ['status', 'source_type'],
  });

  private readonly factChecksPerformed = new promClient.Counter({
    name: 'fact_checks_performed_total',
    help: 'Total number of fact checks performed',
    labelNames: ['result', 'confidence_level'],
  });

  private readonly processingTime = new promClient.Histogram({
    name: 'processing_time_seconds',
    help: 'Time taken to process requests',
    labelNames: ['operation', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  });

  private readonly queueSize = new promClient.Gauge({
    name: 'queue_size',
    help: 'Current queue size',
    labelNames: ['queue_name'],
  });

  private readonly errorRate = new promClient.Gauge({
    name: 'error_rate',
    help: 'Current error rate percentage',
    labelNames: ['service'],
  });

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService,
  ) {
    this.initializeMetrics();
    this.startPeriodicCollection();
  }

  private initializeMetrics(): void {
    // Register all metrics
    this.register.registerMetric(this.httpRequestDuration);
    this.register.registerMetric(this.httpRequestsTotal);
    this.register.registerMetric(this.activeConnections);
    this.register.registerMetric(this.memoryUsage);
    this.register.registerMetric(this.cpuUsage);
    this.register.registerMetric(this.contentGenerated);
    this.register.registerMetric(this.citationsVerified);
    this.register.registerMetric(this.factChecksPerformed);
    this.register.registerMetric(this.processingTime);
    this.register.registerMetric(this.queueSize);
    this.register.registerMetric(this.errorRate);

    // Add default metrics
    promClient.collectDefaultMetrics({ register: this.register });

    this.logger.log('Performance monitoring metrics initialized');
  }

  private startPeriodicCollection(): void {
    // Collect system metrics every 30 seconds
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000);

    // Collect business metrics every 60 seconds
    setInterval(() => {
      this.collectBusinessMetrics();
    }, 60000);
  }

  private collectSystemMetrics(): void {
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      this.memoryUsage.set({ type: 'rss' }, memUsage.rss);
      this.memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
      this.memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
      this.memoryUsage.set({ type: 'external' }, memUsage.external);

      // CPU usage (simplified)
      const cpuUsage = process.cpuUsage();
      const cpuPercent = (cpuUsage.user + cpuUsage.system) / 1000000; // Convert to seconds
      this.cpuUsage.set(cpuPercent);

      // Send to Application Insights
      this.appInsights.trackMetric('MemoryUsage', memUsage.heapUsed / 1024 / 1024, {
        type: 'heap',
        unit: 'MB',
      });

      this.appInsights.trackMetric('CPUUsage', cpuPercent, {
        unit: 'percent',
      });

    } catch (error) {
      this.logger.error('Error collecting system metrics:', error);
    }
  }

  private collectBusinessMetrics(): void {
    try {
      // This would typically query your database for business metrics
      // For now, we'll track what we have in memory
      
      const metrics = this.getBusinessMetrics();
      
      this.appInsights.trackMetric('ContentGenerated', metrics.contentGenerated);
      this.appInsights.trackMetric('CitationsVerified', metrics.citationsVerified);
      this.appInsights.trackMetric('FactChecksPerformed', metrics.factChecksPerformed);
      this.appInsights.trackMetric('ActiveUserSessions', metrics.userSessions);
      this.appInsights.trackMetric('APICallsPerMinute', metrics.apiCalls);

    } catch (error) {
      this.logger.error('Error collecting business metrics:', error);
    }
  }

  // Public methods for tracking metrics
  trackHttpRequest(method: string, route: string, statusCode: number, duration: number): void {
    this.httpRequestDuration.observe({ method, route, status_code: statusCode.toString() }, duration);
    this.httpRequestsTotal.inc({ method, route, status_code: statusCode.toString() });

    this.appInsights.trackMetric('HttpRequestDuration', duration, {
      method,
      route,
      statusCode: statusCode.toString(),
    });
  }

  trackContentGeneration(type: string, status: 'success' | 'failure'): void {
    this.contentGenerated.inc({ type, status });
    
    this.appInsights.trackEvent('ContentGenerated', {
      type,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  trackCitationVerification(status: 'verified' | 'failed', sourceType: string): void {
    this.citationsVerified.inc({ status, source_type: sourceType });
    
    this.appInsights.trackEvent('CitationVerified', {
      status,
      sourceType,
      timestamp: new Date().toISOString(),
    });
  }

  trackFactCheck(result: 'accurate' | 'inaccurate' | 'uncertain', confidenceLevel: string): void {
    this.factChecksPerformed.inc({ result, confidence_level: confidenceLevel });
    
    this.appInsights.trackEvent('FactCheckPerformed', {
      result,
      confidenceLevel,
      timestamp: new Date().toISOString(),
    });
  }

  trackProcessingTime(operation: string, status: string, duration: number): void {
    this.processingTime.observe({ operation, status }, duration);
    
    this.appInsights.trackMetric('ProcessingTime', duration, {
      operation,
      status,
    });
  }

  updateQueueSize(queueName: string, size: number): void {
    this.queueSize.set({ queue_name: queueName }, size);
    
    this.appInsights.trackMetric('QueueSize', size, {
      queueName,
    });
  }

  updateErrorRate(service: string, rate: number): void {
    this.errorRate.set({ service }, rate);
    
    this.appInsights.trackMetric('ErrorRate', rate, {
      service,
    });
  }

  updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
    
    this.appInsights.trackMetric('ActiveConnections', count);
  }

  // Get current performance metrics
  getPerformanceMetrics(): PerformanceMetrics {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    return {
      requestDuration: 0, // This would be calculated from recent requests
      memoryUsage: memUsage,
      cpuUsage: (cpuUsage.user + cpuUsage.system) / 1000000,
      activeConnections: 0, // This would be tracked from connection events
      errorRate: 0, // This would be calculated from recent errors
      throughput: 0, // This would be calculated from recent requests
    };
  }

  // Get current business metrics
  getBusinessMetrics(): BusinessMetrics {
    // In a real implementation, this would query your database
    return {
      contentGenerated: 0,
      citationsVerified: 0,
      factChecksPerformed: 0,
      userSessions: 0,
      apiCalls: 0,
    };
  }

  // Get Prometheus metrics
  async getPrometheusMetrics(): Promise<string> {
    return this.register.metrics();
  }

  // Health check method
  async healthCheck(): Promise<{ status: string; metrics: PerformanceMetrics }> {
    const metrics = this.getPerformanceMetrics();
    
    // Determine health status based on metrics
    let status = 'healthy';
    
    if (metrics.memoryUsage.heapUsed > 1024 * 1024 * 1024) { // 1GB
      status = 'warning';
    }
    
    if (metrics.cpuUsage > 80) {
      status = 'critical';
    }
    
    if (metrics.errorRate > 5) {
      status = 'critical';
    }
    
    return { status, metrics };
  }
}
