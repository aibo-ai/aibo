import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MozSeoController } from './moz-seo.controller';
import { MozSeoService } from '../../common/services/moz-seo.service';
import { AzureMonitoringService } from '../../common/services/azure-monitoring.service';
import { ApplicationInsightsService } from '../../common/services/application-insights.service';

@Module({
  imports: [ConfigModule],
  controllers: [MozSeoController],
  providers: [
    MozSeoService,
    AzureMonitoringService,
    ApplicationInsightsService
  ],
  exports: [MozSeoService]
})
export class MozSeoModule {}
