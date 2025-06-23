import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CitationCacheService } from '../services/citation-cache.service';
import { CitationMonitoringService } from '../services/citation-monitoring.service';
import { ExternalApiService } from '../services/external-api.service';
import { ConfigService } from '@nestjs/config';

@ApiTags('Citation Health')
@Controller('health/citation')
export class CitationHealthController {
  private readonly logger = new Logger(CitationHealthController.name);

  constructor(
    private readonly cacheService: CitationCacheService,
    private readonly monitoringService: CitationMonitoringService,
    private readonly externalApiService: ExternalApiService,
    private readonly configService: ConfigService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get overall citation verification system health' })
  @ApiResponse({ 
    status: 200, 
    description: 'System health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
        timestamp: { type: 'string' },
        version: { type: 'string' },
        uptime: { type: 'number' },
        components: {
          type: 'object',
          properties: {
            cache: { type: 'object' },
            monitoring: { type: 'object' },
            externalApis: { type: 'object' }
          }
        }
      }
    }
  })
  async getHealth() {
    const startTime = Date.now();
    
    try {
      // Check cache health
      const cacheHealth = await this.checkCacheHealth();
      
      // Check monitoring health
      const monitoringHealth = this.checkMonitoringHealth();
      
      // Check external API health
      const externalApiHealth = await this.checkExternalApiHealth();
      
      // Determine overall status
      const componentStatuses = [
        cacheHealth.status,
        monitoringHealth.status,
        externalApiHealth.status
      ];
      
      let overallStatus = 'healthy';
      if (componentStatuses.includes('unhealthy')) {
        overallStatus = 'unhealthy';
      } else if (componentStatuses.includes('degraded')) {
        overallStatus = 'degraded';
      }

      const health = {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        version: this.configService.get('npm_package_version', '1.0.0'),
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        components: {
          cache: cacheHealth,
          monitoring: monitoringHealth,
          externalApis: externalApiHealth
        }
      };

      this.logger.log(`Health check completed: ${overallStatus} (${Date.now() - startTime}ms)`);
      return health;

    } catch (error) {
      this.logger.error(`Health check failed: ${error.message}`, error.stack);
      
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: this.configService.get('npm_package_version', '1.0.0'),
        uptime: process.uptime(),
        responseTime: Date.now() - startTime,
        error: error.message,
        components: {
          cache: { status: 'unknown' },
          monitoring: { status: 'unknown' },
          externalApis: { status: 'unknown' }
        }
      };
    }
  }

  @Get('cache')
  @ApiOperation({ summary: 'Get citation cache health and statistics' })
  @ApiResponse({ status: 200, description: 'Cache health and statistics' })
  async getCacheHealth() {
    return this.checkCacheHealth();
  }

  @Get('monitoring')
  @ApiOperation({ summary: 'Get citation monitoring system health' })
  @ApiResponse({ status: 200, description: 'Monitoring system health' })
  getMonitoringHealth() {
    return this.checkMonitoringHealth();
  }

  @Get('external-apis')
  @ApiOperation({ summary: 'Get external API connectivity status' })
  @ApiResponse({ status: 200, description: 'External API status' })
  async getExternalApiHealth() {
    return this.checkExternalApiHealth();
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get citation verification metrics' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  getMetrics() {
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
      end: new Date()
    };

    const metrics = this.monitoringService.generateAnalyticsReport(timeRange);
    const realtimeHealth = this.monitoringService.getHealthStatus();

    return {
      timeRange,
      analytics: metrics,
      realtime: realtimeHealth,
      timestamp: new Date().toISOString()
    };
  }

  private async checkCacheHealth(): Promise<any> {
    try {
      const stats = this.cacheService.getCacheStats();
      
      let status = 'healthy';
      const issues = [];

      // Check cache hit rate
      if (stats.hitCounts.total > 100 && stats.hitCounts.average < 0.3) {
        status = 'degraded';
        issues.push('Low cache hit rate detected');
      }

      // Check cache size
      if (stats.totalEntries > stats.maxSize * 0.9) {
        status = 'degraded';
        issues.push('Cache approaching maximum size');
      }

      // Check for expired entries
      if (stats.expiredEntries > stats.totalEntries * 0.5) {
        status = 'degraded';
        issues.push('High number of expired cache entries');
      }

      return {
        status,
        enabled: stats.enabled,
        statistics: stats,
        issues,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private checkMonitoringHealth(): any {
    try {
      const healthStatus = this.monitoringService.getHealthStatus();
      
      return {
        status: healthStatus.status === 'healthy' ? 'healthy' : 
                healthStatus.status === 'degraded' ? 'degraded' : 'unhealthy',
        metrics: healthStatus.metrics,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async checkExternalApiHealth(): Promise<any> {
    const apiChecks = [];
    
    try {
      // Test URL validation (quick check)
      const urlCheck = this.testUrlValidation();
      apiChecks.push(urlCheck);

      // Test DOI verification (if configured)
      if (this.configService.get('CROSSREF_API_URL')) {
        const doiCheck = this.testDoiVerification();
        apiChecks.push(doiCheck);
      }

      const results = await Promise.allSettled(apiChecks);
      
      let overallStatus = 'healthy';
      const apiStatuses = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          apiStatuses.push(result.value);
          if (result.value.status !== 'healthy') {
            overallStatus = 'degraded';
          }
        } else {
          apiStatuses.push({
            name: `api-${index}`,
            status: 'unhealthy',
            error: result.reason?.message || 'Unknown error'
          });
          overallStatus = 'unhealthy';
        }
      });

      return {
        status: overallStatus,
        apis: apiStatuses,
        lastChecked: new Date().toISOString()
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        lastChecked: new Date().toISOString()
      };
    }
  }

  private async testUrlValidation(): Promise<any> {
    try {
      const testUrl = 'https://httpbin.org/status/200';
      const startTime = Date.now();
      
      const result = await this.externalApiService.validateUrl(testUrl);
      const responseTime = Date.now() - startTime;

      return {
        name: 'url-validation',
        status: result.isValid && result.isAccessible ? 'healthy' : 'degraded',
        responseTime,
        details: {
          testUrl,
          isValid: result.isValid,
          isAccessible: result.isAccessible
        }
      };

    } catch (error) {
      return {
        name: 'url-validation',
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  private async testDoiVerification(): Promise<any> {
    try {
      const testDoi = '10.1000/test';
      const startTime = Date.now();
      
      const result = await this.externalApiService.verifyDoi(testDoi);
      const responseTime = Date.now() - startTime;

      return {
        name: 'doi-verification',
        status: responseTime < 5000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          testDoi,
          apiResponded: true
        }
      };

    } catch (error) {
      return {
        name: 'doi-verification',
        status: 'degraded', // DOI verification failures are expected for test DOIs
        responseTime: 0,
        note: 'Test DOI verification - failures expected'
      };
    }
  }
}
