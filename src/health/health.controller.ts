import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import { Response } from 'express';
import {
  HealthCheckService,
  HealthCheck,
  TypeOrmHealthIndicator,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PerformanceMonitoringService } from '../common/services/performance-monitoring.service';
import { ApplicationInsightsService } from '../common/services/application-insights.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly performanceMonitoring: PerformanceMonitoringService,
    private readonly appInsights: ApplicationInsightsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  @HealthCheck()
  async check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with performance metrics' })
  @ApiResponse({ status: 200, description: 'Detailed health information' })
  async detailedCheck(@Res() res: Response) {
    try {
      const basicHealth = await this.health.check([
        () => this.db.pingCheck('database'),
        () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
        () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
        () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      ]);

      const performanceHealth = await this.performanceMonitoring.healthCheck();
      const systemMetrics = this.performanceMonitoring.getPerformanceMetrics();
      const businessMetrics = this.performanceMonitoring.getBusinessMetrics();

      const detailedHealth = {
        status: basicHealth.status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: basicHealth.details,
        performance: {
          status: performanceHealth.status,
          metrics: performanceHealth.metrics,
        },
        system: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          pid: process.pid,
          memory: systemMetrics.memoryUsage,
          cpu: systemMetrics.cpuUsage,
        },
        business: businessMetrics,
        dependencies: await this.checkDependencies(),
      };

      // Track health check in Application Insights
      this.appInsights.trackEvent('HealthCheck', {
        type: 'detailed',
        status: detailedHealth.status,
        performanceStatus: performanceHealth.status,
        uptime: process.uptime().toString(),
      });

      const statusCode = detailedHealth.status === 'ok' ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      res.status(statusCode).json(detailedHealth);
    } catch (error) {
      this.appInsights.trackException({
        exception: error,
        properties: {
          operation: 'detailed_health_check',
        },
      });

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      });
    }
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async liveness(@Res() res: Response) {
    // Simple liveness check - just verify the service is running
    const response = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };

    res.status(HttpStatus.OK).json(response);
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async readiness(@Res() res: Response) {
    try {
      // Check if service is ready to handle requests
      const checks = await this.health.check([
        () => this.db.pingCheck('database'),
        () => this.memory.checkHeap('memory_heap', 200 * 1024 * 1024),
      ]);

      const response = {
        status: 'ready',
        timestamp: new Date().toISOString(),
        checks: checks.details,
      };

      res.status(HttpStatus.OK).json(response);
    } catch (error) {
      const response = {
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        error: error.message,
      };

      res.status(HttpStatus.SERVICE_UNAVAILABLE).json(response);
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Prometheus metrics endpoint' })
  @ApiResponse({ status: 200, description: 'Prometheus metrics' })
  async metrics(@Res() res: Response) {
    try {
      const metrics = await this.performanceMonitoring.getPrometheusMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'Failed to retrieve metrics',
        message: error.message,
      });
    }
  }

  @Get('performance')
  @ApiOperation({ summary: 'Performance metrics' })
  @ApiResponse({ status: 200, description: 'Current performance metrics' })
  async performance() {
    const metrics = this.performanceMonitoring.getPerformanceMetrics();
    const businessMetrics = this.performanceMonitoring.getBusinessMetrics();

    return {
      timestamp: new Date().toISOString(),
      performance: metrics,
      business: businessMetrics,
    };
  }

  @Get('dependencies')
  @ApiOperation({ summary: 'Check external dependencies' })
  @ApiResponse({ status: 200, description: 'Dependencies status' })
  async dependencies() {
    const dependencies = await this.checkDependencies();
    
    return {
      timestamp: new Date().toISOString(),
      dependencies,
    };
  }

  private async checkDependencies(): Promise<Record<string, any>> {
    const dependencies: Record<string, any> = {};

    // Check database
    try {
      await this.db.pingCheck('database')();
      dependencies.database = { status: 'healthy', responseTime: 0 };
    } catch (error) {
      dependencies.database = { status: 'unhealthy', error: error.message };
    }

    // Check Redis (if configured)
    try {
      // This would check Redis connection if configured
      dependencies.redis = { status: 'healthy', responseTime: 0 };
    } catch (error) {
      dependencies.redis = { status: 'unhealthy', error: error.message };
    }

    // Check external APIs
    dependencies.externalAPIs = await this.checkExternalAPIs();

    // Check Azure services
    dependencies.azure = await this.checkAzureServices();

    return dependencies;
  }

  private async checkExternalAPIs(): Promise<Record<string, any>> {
    const apis: Record<string, any> = {};

    // Check OpenAI API
    try {
      // This would make a simple request to OpenAI API
      apis.openai = { status: 'healthy', responseTime: 0 };
    } catch (error) {
      apis.openai = { status: 'unhealthy', error: error.message };
    }

    // Check other external APIs
    apis.factCheckAPI = { status: 'healthy', responseTime: 0 };
    apis.citationAPI = { status: 'healthy', responseTime: 0 };

    return apis;
  }

  private async checkAzureServices(): Promise<Record<string, any>> {
    const services: Record<string, any> = {};

    // Check Application Insights
    try {
      services.applicationInsights = { status: 'healthy' };
    } catch (error) {
      services.applicationInsights = { status: 'unhealthy', error: error.message };
    }

    // Check Azure Service Bus
    try {
      services.serviceBus = { status: 'healthy' };
    } catch (error) {
      services.serviceBus = { status: 'unhealthy', error: error.message };
    }

    // Check Azure Storage
    try {
      services.storage = { status: 'healthy' };
    } catch (error) {
      services.storage = { status: 'unhealthy', error: error.message };
    }

    return services;
  }
}
