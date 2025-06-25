import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { AzureMonitoringService } from './azure-monitoring.service';

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
  cacheHitRate: number;
  activeConnections: number;
  timestamp: Date;
}

export interface OptimizationRecommendation {
  type: 'cache' | 'database' | 'api' | 'memory' | 'cpu';
  priority: 'high' | 'medium' | 'low';
  description: string;
  impact: string;
  implementation: string;
  estimatedImprovement: string;
}

export interface PerformanceThresholds {
  responseTime: number; // milliseconds
  errorRate: number; // percentage
  memoryUsage: number; // percentage
  cpuUsage: number; // percentage
  cacheHitRate: number; // percentage
}

@Injectable()
export class PerformanceOptimizationService {
  private readonly logger = new Logger(PerformanceOptimizationService.name);
  private metricsHistory: PerformanceMetrics[] = [];
  private readonly maxHistorySize = 1000;
  private performanceThresholds: PerformanceThresholds;

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private azureMonitoringService: AzureMonitoringService
  ) {
    this.performanceThresholds = {
      responseTime: this.configService.get<number>('PERF_RESPONSE_TIME_THRESHOLD', 2000),
      errorRate: this.configService.get<number>('PERF_ERROR_RATE_THRESHOLD', 5),
      memoryUsage: this.configService.get<number>('PERF_MEMORY_THRESHOLD', 80),
      cpuUsage: this.configService.get<number>('PERF_CPU_THRESHOLD', 80),
      cacheHitRate: this.configService.get<number>('PERF_CACHE_HIT_THRESHOLD', 80)
    };

    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Start continuous performance monitoring
   */
  private startPerformanceMonitoring(): void {
    // Collect metrics every 30 seconds
    setInterval(async () => {
      await this.collectMetrics();
    }, 30000);

    // Analyze performance every 5 minutes
    setInterval(async () => {
      await this.analyzePerformance();
    }, 300000);

    this.logger.log('Performance monitoring started');
  }

  /**
   * Collect current performance metrics
   */
  async collectMetrics(): Promise<PerformanceMetrics> {
    try {
      const metrics: PerformanceMetrics = {
        responseTime: await this.getAverageResponseTime(),
        throughput: await this.getThroughput(),
        errorRate: await this.getErrorRate(),
        memoryUsage: await this.getMemoryUsage(),
        cpuUsage: await this.getCpuUsage(),
        cacheHitRate: await this.getCacheHitRate(),
        activeConnections: await this.getActiveConnections(),
        timestamp: new Date()
      };

      // Add to history
      this.metricsHistory.push(metrics);
      
      // Keep only recent metrics
      if (this.metricsHistory.length > this.maxHistorySize) {
        this.metricsHistory = this.metricsHistory.slice(-this.maxHistorySize);
      }

      // Track metrics in Azure Monitor
      this.azureMonitoringService.trackMetric({
        name: 'PerformanceMetrics',
        value: metrics.responseTime,
        properties: {
          throughput: metrics.throughput.toString(),
          errorRate: metrics.errorRate.toString(),
          memoryUsage: metrics.memoryUsage.toString(),
          cpuUsage: metrics.cpuUsage.toString(),
          cacheHitRate: metrics.cacheHitRate.toString()
        }
      });

      return metrics;

    } catch (error) {
      this.logger.error('Error collecting performance metrics:', error);
      throw error;
    }
  }

  /**
   * Analyze performance and generate recommendations
   */
  async analyzePerformance(): Promise<OptimizationRecommendation[]> {
    try {
      const recommendations: OptimizationRecommendation[] = [];
      const currentMetrics = await this.collectMetrics();

      // Analyze response time
      if (currentMetrics.responseTime > this.performanceThresholds.responseTime) {
        recommendations.push({
          type: 'api',
          priority: 'high',
          description: `Response time (${currentMetrics.responseTime}ms) exceeds threshold (${this.performanceThresholds.responseTime}ms)`,
          impact: 'Poor user experience and potential timeout issues',
          implementation: 'Optimize database queries, implement caching, or scale horizontally',
          estimatedImprovement: '30-50% response time reduction'
        });
      }

      // Analyze error rate
      if (currentMetrics.errorRate > this.performanceThresholds.errorRate) {
        recommendations.push({
          type: 'api',
          priority: 'high',
          description: `Error rate (${currentMetrics.errorRate}%) exceeds threshold (${this.performanceThresholds.errorRate}%)`,
          impact: 'Service reliability issues and user frustration',
          implementation: 'Review error logs, implement circuit breakers, improve error handling',
          estimatedImprovement: '80-90% error reduction'
        });
      }

      // Analyze memory usage
      if (currentMetrics.memoryUsage > this.performanceThresholds.memoryUsage) {
        recommendations.push({
          type: 'memory',
          priority: 'medium',
          description: `Memory usage (${currentMetrics.memoryUsage}%) exceeds threshold (${this.performanceThresholds.memoryUsage}%)`,
          impact: 'Potential memory leaks and application instability',
          implementation: 'Optimize memory usage, implement garbage collection tuning, or scale vertically',
          estimatedImprovement: '20-40% memory usage reduction'
        });
      }

      // Analyze CPU usage
      if (currentMetrics.cpuUsage > this.performanceThresholds.cpuUsage) {
        recommendations.push({
          type: 'cpu',
          priority: 'medium',
          description: `CPU usage (${currentMetrics.cpuUsage}%) exceeds threshold (${this.performanceThresholds.cpuUsage}%)`,
          impact: 'Slow response times and potential service degradation',
          implementation: 'Optimize algorithms, implement async processing, or scale horizontally',
          estimatedImprovement: '25-45% CPU usage reduction'
        });
      }

      // Analyze cache hit rate
      if (currentMetrics.cacheHitRate < this.performanceThresholds.cacheHitRate) {
        recommendations.push({
          type: 'cache',
          priority: 'medium',
          description: `Cache hit rate (${currentMetrics.cacheHitRate}%) below threshold (${this.performanceThresholds.cacheHitRate}%)`,
          impact: 'Increased database load and slower response times',
          implementation: 'Optimize cache strategy, increase cache TTL, or implement cache warming',
          estimatedImprovement: '40-60% response time improvement'
        });
      }

      // Log recommendations
      if (recommendations.length > 0) {
        this.logger.warn(`Generated ${recommendations.length} performance recommendations`);
        recommendations.forEach(rec => {
          this.logger.warn(`${rec.priority.toUpperCase()}: ${rec.description}`);
        });

        // Track recommendations in Azure Monitor
        this.azureMonitoringService.trackEvent({
          name: 'PerformanceRecommendationsGenerated',
          properties: {
            count: recommendations.length.toString(),
            highPriority: recommendations.filter(r => r.priority === 'high').length.toString(),
            mediumPriority: recommendations.filter(r => r.priority === 'medium').length.toString(),
            lowPriority: recommendations.filter(r => r.priority === 'low').length.toString()
          }
        });
      }

      return recommendations;

    } catch (error) {
      this.logger.error('Error analyzing performance:', error);
      return [];
    }
  }

  /**
   * Get performance metrics history
   */
  getMetricsHistory(hours = 24): PerformanceMetrics[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.metricsHistory.filter(metric => metric.timestamp >= cutoff);
  }

  /**
   * Get current performance summary
   */
  async getPerformanceSummary(): Promise<{
    current: PerformanceMetrics;
    trends: {
      responseTime: 'improving' | 'degrading' | 'stable';
      errorRate: 'improving' | 'degrading' | 'stable';
      throughput: 'improving' | 'degrading' | 'stable';
    };
    recommendations: OptimizationRecommendation[];
  }> {
    const current = await this.collectMetrics();
    const recommendations = await this.analyzePerformance();
    const trends = this.calculateTrends();

    return {
      current,
      trends,
      recommendations
    };
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(): {
    responseTime: 'improving' | 'degrading' | 'stable';
    errorRate: 'improving' | 'degrading' | 'stable';
    throughput: 'improving' | 'degrading' | 'stable';
  } {
    const recentMetrics = this.getMetricsHistory(1); // Last hour
    
    if (recentMetrics.length < 2) {
      return {
        responseTime: 'stable',
        errorRate: 'stable',
        throughput: 'stable'
      };
    }

    const latest = recentMetrics[recentMetrics.length - 1];
    const previous = recentMetrics[0];

    return {
      responseTime: this.getTrend(latest.responseTime, previous.responseTime, false),
      errorRate: this.getTrend(latest.errorRate, previous.errorRate, false),
      throughput: this.getTrend(latest.throughput, previous.throughput, true)
    };
  }

  /**
   * Calculate trend direction
   */
  private getTrend(current: number, previous: number, higherIsBetter: boolean): 'improving' | 'degrading' | 'stable' {
    const changePercent = ((current - previous) / previous) * 100;
    
    if (Math.abs(changePercent) < 5) {
      return 'stable';
    }
    
    if (higherIsBetter) {
      return changePercent > 0 ? 'improving' : 'degrading';
    } else {
      return changePercent < 0 ? 'improving' : 'degrading';
    }
  }

  // Mock implementations for metrics collection
  private async getAverageResponseTime(): Promise<number> {
    // In production, this would query actual metrics
    return Math.random() * 3000 + 500; // 500-3500ms
  }

  private async getThroughput(): Promise<number> {
    // In production, this would query actual metrics
    return Math.random() * 1000 + 100; // 100-1100 requests/min
  }

  private async getErrorRate(): Promise<number> {
    // In production, this would query actual metrics
    return Math.random() * 10; // 0-10%
  }

  private async getMemoryUsage(): Promise<number> {
    // In production, this would query actual system metrics
    return Math.random() * 40 + 40; // 40-80%
  }

  private async getCpuUsage(): Promise<number> {
    // In production, this would query actual system metrics
    return Math.random() * 50 + 30; // 30-80%
  }

  private async getCacheHitRate(): Promise<number> {
    // In production, this would query cache statistics
    const stats = await this.cacheService.getStats();
    const total = stats.hits + stats.misses;
    return total > 0 ? (stats.hits / total) * 100 : 0;
  }

  private async getActiveConnections(): Promise<number> {
    // In production, this would query actual connection metrics
    return Math.floor(Math.random() * 100) + 10; // 10-110 connections
  }

  /**
   * Update performance thresholds
   */
  updateThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.performanceThresholds = { ...this.performanceThresholds, ...thresholds };
    this.logger.log('Performance thresholds updated');
  }

  /**
   * Get current thresholds
   */
  getThresholds(): PerformanceThresholds {
    return { ...this.performanceThresholds };
  }
}
