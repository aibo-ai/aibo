import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AzureKeyVaultService } from '../services/azure-keyvault.service';
import { AzureAlertsService } from '../services/azure-alerts.service';
import { PerformanceOptimizationService } from '../services/performance-optimization.service';
import { CacheService } from '../services/cache.service';
import { AzureMonitoringService } from '../services/azure-monitoring.service';

@Controller('production')
export class ProductionHealthController {
  constructor(
    private azureKeyVaultService: AzureKeyVaultService,
    private azureAlertsService: AzureAlertsService,
    private performanceOptimizationService: PerformanceOptimizationService,
    private cacheService: CacheService,
    private azureMonitoringService: AzureMonitoringService
  ) {}

  /**
   * Overall production health check
   */
  @Get('health')
  async getProductionHealth() {
    try {
      const [
        keyVaultHealth,
        cacheHealth,
        alertSummary,
        performanceSummary
      ] = await Promise.all([
        this.azureKeyVaultService.healthCheck(),
        this.cacheService.healthCheck(),
        this.azureAlertsService.getAlertSummary(),
        this.performanceOptimizationService.getPerformanceSummary()
      ]);

      const overallStatus = this.determineOverallStatus([
        keyVaultHealth.status === 'healthy',
        cacheHealth,
        alertSummary.fired === 0,
        performanceSummary.recommendations.filter(r => r.priority === 'high').length === 0
      ]);

      return {
        success: true,
        status: overallStatus,
        timestamp: new Date().toISOString(),
        services: {
          keyVault: keyVaultHealth,
          cache: {
            status: cacheHealth ? 'healthy' : 'unhealthy',
            stats: await this.cacheService.getStats()
          },
          alerts: {
            status: alertSummary.fired === 0 ? 'healthy' : 'warning',
            summary: alertSummary
          },
          performance: {
            status: performanceSummary.recommendations.filter(r => r.priority === 'high').length === 0 ? 'healthy' : 'warning',
            current: performanceSummary.current,
            trends: performanceSummary.trends,
            recommendationCount: performanceSummary.recommendations.length
          }
        }
      };

    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get Azure Key Vault status
   */
  @Get('keyvault/status')
  async getKeyVaultStatus() {
    try {
      const health = await this.azureKeyVaultService.healthCheck();
      const cacheStats = this.azureKeyVaultService.getCacheStats();

      return {
        success: true,
        data: {
          ...health,
          cache: cacheStats
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get secrets list (names only for security)
   */
  @Get('keyvault/secrets')
  async getSecretsList() {
    try {
      const secrets = await this.azureKeyVaultService.listSecrets();
      
      return {
        success: true,
        data: secrets.map(secret => ({
          name: secret.name,
          enabled: secret.enabled,
          createdOn: secret.createdOn,
          contentType: secret.contentType
        }))
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get alert rules and statuses
   */
  @Get('alerts')
  async getAlerts() {
    try {
      const rules = this.azureAlertsService.getAlertRules();
      const statuses = this.azureAlertsService.getAlertStatuses();
      const summary = this.azureAlertsService.getAlertSummary();

      return {
        success: true,
        data: {
          summary,
          rules: rules.map(rule => ({
            name: rule.name,
            description: rule.description,
            severity: rule.severity,
            enabled: rule.enabled,
            condition: rule.condition
          })),
          statuses
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create new alert rule
   */
  @Post('alerts')
  async createAlert(@Body() alertRule: any) {
    try {
      const success = await this.azureAlertsService.createAlertRule(alertRule);
      
      return {
        success,
        message: success ? 'Alert rule created successfully' : 'Failed to create alert rule'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Toggle alert rule
   */
  @Post('alerts/:name/toggle')
  async toggleAlert(@Param('name') name: string, @Body() body: { enabled: boolean }) {
    try {
      const success = await this.azureAlertsService.toggleAlertRule(name, body.enabled);
      
      return {
        success,
        message: success ? `Alert rule ${body.enabled ? 'enabled' : 'disabled'} successfully` : 'Failed to toggle alert rule'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get performance metrics and recommendations
   */
  @Get('performance')
  async getPerformance() {
    try {
      const summary = await this.performanceOptimizationService.getPerformanceSummary();
      const history = this.performanceOptimizationService.getMetricsHistory(24);
      const thresholds = this.performanceOptimizationService.getThresholds();

      return {
        success: true,
        data: {
          summary,
          history,
          thresholds
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update performance thresholds
   */
  @Post('performance/thresholds')
  async updatePerformanceThresholds(@Body() thresholds: any) {
    try {
      this.performanceOptimizationService.updateThresholds(thresholds);
      
      return {
        success: true,
        message: 'Performance thresholds updated successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cache statistics
   */
  @Get('cache/stats')
  async getCacheStats() {
    try {
      const stats = await this.cacheService.getStats();
      const health = await this.cacheService.healthCheck();

      return {
        success: true,
        data: {
          stats,
          health,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clear cache
   */
  @Post('cache/clear')
  async clearCache(@Body() body?: { prefix?: string }) {
    try {
      const success = await this.cacheService.clear(body?.prefix);
      
      return {
        success,
        message: success ? 'Cache cleared successfully' : 'Failed to clear cache'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Azure Monitor metrics
   */
  @Get('monitoring/metrics')
  async getMonitoringMetrics() {
    try {
      // This would typically fetch from Azure Monitor
      return {
        success: true,
        data: {
          message: 'Azure Monitor integration active',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Backup production configuration
   */
  @Post('backup')
  async backupConfiguration() {
    try {
      const [
        secretsBackup,
        alertRules,
        performanceThresholds
      ] = await Promise.all([
        this.azureKeyVaultService.backupSecrets(),
        this.azureAlertsService.getAlertRules(),
        this.performanceOptimizationService.getThresholds()
      ]);

      const backup = {
        timestamp: new Date().toISOString(),
        secrets: secretsBackup,
        alerts: alertRules,
        performance: performanceThresholds
      };

      return {
        success: true,
        data: backup,
        message: 'Production configuration backed up successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Determine overall system status
   */
  private determineOverallStatus(healthChecks: boolean[]): 'healthy' | 'warning' | 'unhealthy' {
    const healthyCount = healthChecks.filter(check => check).length;
    const totalChecks = healthChecks.length;
    
    if (healthyCount === totalChecks) {
      return 'healthy';
    } else if (healthyCount >= totalChecks * 0.7) {
      return 'warning';
    } else {
      return 'unhealthy';
    }
  }
}
