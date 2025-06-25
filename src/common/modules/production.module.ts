import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AzureKeyVaultService } from '../services/azure-keyvault.service';
import { AzureAlertsService } from '../services/azure-alerts.service';
import { PerformanceOptimizationService } from '../services/performance-optimization.service';
import { CacheService } from '../services/cache.service';
import { AzureMonitoringService } from '../services/azure-monitoring.service';
import { ABTestingService } from '../services/ab-testing.service';
import { ABTestingController } from '../controllers/ab-testing.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [ABTestingController],
  providers: [
    AzureKeyVaultService,
    AzureAlertsService,
    PerformanceOptimizationService,
    CacheService,
    AzureMonitoringService,
    ABTestingService
  ],
  exports: [
    AzureKeyVaultService,
    AzureAlertsService,
    PerformanceOptimizationService,
    CacheService,
    AzureMonitoringService,
    ABTestingService
  ]
})
export class ProductionModule {}
