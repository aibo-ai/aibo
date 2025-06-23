import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MonitoringService, HealthCheckResult, SystemMetrics } from '../services/monitoring.service';
import { ApplicationInsightsService } from '../services/application-insights.service';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(
    private readonly monitoringService: MonitoringService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealth(): Promise<{ status: string; timestamp: string }> {
    const healthResult = await this.monitoringService.getHealthStatus();
    
    return {
      status: healthResult.status,
      timestamp: healthResult.timestamp
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Get detailed health check results' })
  @ApiResponse({ status: 200, description: 'Detailed health status retrieved successfully' })
  async getDetailedHealth(): Promise<HealthCheckResult> {
    const healthResult = await this.monitoringService.getHealthStatus();
    
    // Track health check access
    this.appInsights.trackEvent('HealthCheck.Accessed', {
      status: healthResult.status,
      checksCount: Object.keys(healthResult.checks).length.toString()
    });
    
    return healthResult;
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get current system metrics' })
  @ApiResponse({ status: 200, description: 'System metrics retrieved successfully' })
  async getMetrics(): Promise<SystemMetrics> {
    const metrics = await this.monitoringService.getCurrentMetrics();
    
    // Track metrics access
    this.appInsights.trackEvent('SystemMetrics.Accessed', {
      cpuUsage: metrics.cpu.usage.toString(),
      memoryUsage: metrics.memory.usagePercentage.toString(),
      uptime: metrics.process.uptime.toString()
    });
    
    return metrics;
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Kubernetes readiness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is ready to accept traffic' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async getReadiness(): Promise<{ status: string; ready: boolean }> {
    const healthResult = await this.monitoringService.getHealthStatus();
    const isReady = healthResult.status === 'healthy' || healthResult.status === 'degraded';
    
    if (!isReady) {
      throw new Error('Service not ready');
    }
    
    return {
      status: 'ready',
      ready: true
    };
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness(): Promise<{ status: string; alive: boolean }> {
    // Simple liveness check - if we can respond, we're alive
    return {
      status: 'alive',
      alive: true
    };
  }

  @Get('startup')
  @ApiOperation({ summary: 'Kubernetes startup probe endpoint' })
  @ApiResponse({ status: 200, description: 'Service has started successfully' })
  @ApiResponse({ status: 503, description: 'Service is still starting' })
  async getStartup(): Promise<{ status: string; started: boolean }> {
    const healthResult = await this.monitoringService.getHealthStatus();
    const hasStarted = healthResult.uptime > 30; // Consider started after 30 seconds
    
    if (!hasStarted) {
      throw new Error('Service still starting');
    }
    
    return {
      status: 'started',
      started: true
    };
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Get health status of external dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies health status retrieved successfully' })
  async getDependenciesHealth(): Promise<{
    status: string;
    dependencies: { [key: string]: any };
  }> {
    const healthResult = await this.monitoringService.getHealthStatus();
    
    // Filter out non-dependency checks
    const dependencies = Object.entries(healthResult.checks)
      .filter(([key]) => !['error'].includes(key))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as { [key: string]: any });
    
    const dependencyStatuses = Object.values(dependencies).map(dep => dep.status);
    let overallStatus = 'healthy';
    
    if (dependencyStatuses.includes('unhealthy')) {
      overallStatus = 'unhealthy';
    } else if (dependencyStatuses.includes('degraded')) {
      overallStatus = 'degraded';
    }
    
    return {
      status: overallStatus,
      dependencies
    };
  }

  @Get('version')
  @ApiOperation({ summary: 'Get application version and build information' })
  @ApiResponse({ status: 200, description: 'Version information retrieved successfully' })
  async getVersion(): Promise<{
    version: string;
    buildDate?: string;
    gitCommit?: string;
    environment: string;
  }> {
    return {
      version: process.env.APP_VERSION || '1.0.0',
      buildDate: process.env.BUILD_DATE,
      gitCommit: process.env.GIT_COMMIT,
      environment: process.env.NODE_ENV || 'development'
    };
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance metrics summary' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiQuery({ name: 'timeRange', enum: ['1h', '24h', '7d'], required: false })
  async getPerformanceMetrics(
    @Query('timeRange') timeRange: '1h' | '24h' | '7d' = '1h'
  ): Promise<{
    timeRange: string;
    summary: {
      averageResponseTime: number;
      requestCount: number;
      errorRate: number;
      throughput: number;
    };
    topEndpoints: Array<{
      endpoint: string;
      averageResponseTime: number;
      requestCount: number;
      errorRate: number;
    }>;
  }> {
    // In a real implementation, this would query actual performance data
    // For now, we'll return simulated data
    
    const summary = {
      averageResponseTime: Math.random() * 500 + 100, // 100-600ms
      requestCount: Math.floor(Math.random() * 10000) + 1000,
      errorRate: Math.random() * 5, // 0-5%
      throughput: Math.random() * 100 + 50 // 50-150 req/min
    };
    
    const topEndpoints = [
      {
        endpoint: '/api/content/generate',
        averageResponseTime: Math.random() * 1000 + 200,
        requestCount: Math.floor(Math.random() * 1000) + 100,
        errorRate: Math.random() * 3
      },
      {
        endpoint: '/api/analytics/insights',
        averageResponseTime: Math.random() * 800 + 150,
        requestCount: Math.floor(Math.random() * 800) + 80,
        errorRate: Math.random() * 2
      },
      {
        endpoint: '/api/competition-x/dashboard',
        averageResponseTime: Math.random() * 600 + 100,
        requestCount: Math.floor(Math.random() * 600) + 60,
        errorRate: Math.random() * 1
      }
    ];
    
    // Track performance metrics access
    this.appInsights.trackEvent('PerformanceMetrics.Accessed', {
      timeRange,
      averageResponseTime: summary.averageResponseTime.toString(),
      requestCount: summary.requestCount.toString(),
      errorRate: summary.errorRate.toString()
    });
    
    return {
      timeRange,
      summary,
      topEndpoints
    };
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get current alert rules and status' })
  @ApiResponse({ status: 200, description: 'Alert rules retrieved successfully' })
  async getAlerts(): Promise<{
    rules: Array<{
      id: string;
      name: string;
      metric: string;
      threshold: number;
      severity: string;
      enabled: boolean;
      lastTriggered?: string;
    }>;
    activeAlerts: number;
  }> {
    const alertRules = this.monitoringService.getAlertRules();
    
    return {
      rules: alertRules.map(rule => ({
        id: rule.id,
        name: rule.name,
        metric: rule.metric,
        threshold: rule.threshold,
        severity: rule.severity,
        enabled: rule.enabled,
        lastTriggered: rule.lastTriggered?.toISOString()
      })),
      activeAlerts: alertRules.filter(rule => 
        rule.lastTriggered && 
        Date.now() - rule.lastTriggered.getTime() < 60000 // Active if triggered in last minute
      ).length
    };
  }

  @Get('telemetry')
  @ApiOperation({ summary: 'Get telemetry system status' })
  @ApiResponse({ status: 200, description: 'Telemetry status retrieved successfully' })
  async getTelemetryStatus(): Promise<{
    applicationInsights: {
      enabled: boolean;
      status: string;
    };
    monitoring: {
      enabled: boolean;
      metricsCollected: boolean;
      healthChecksRunning: boolean;
    };
  }> {
    const appInsightsEnabled = this.appInsights.isAppInsightsAvailable();
    
    return {
      applicationInsights: {
        enabled: appInsightsEnabled,
        status: appInsightsEnabled ? 'connected' : 'disconnected'
      },
      monitoring: {
        enabled: true,
        metricsCollected: true,
        healthChecksRunning: true
      }
    };
  }

  @Get('environment')
  @ApiOperation({ summary: 'Get environment information' })
  @ApiResponse({ status: 200, description: 'Environment information retrieved successfully' })
  async getEnvironment(): Promise<{
    nodeVersion: string;
    platform: string;
    architecture: string;
    environment: string;
    timezone: string;
    uptime: number;
    pid: number;
  }> {
    return {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      environment: process.env.NODE_ENV || 'development',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      uptime: process.uptime(),
      pid: process.pid
    };
  }
}
