import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { ExaApiService } from '../common/services/exa-api.service';
import { SocialMonitoringService } from '../common/services/social-monitoring.service';
import { NewsMonitoringService } from '../common/services/news-monitoring.service';
import { SerpMonitoringService } from '../common/services/serp-monitoring.service';
import { AzureMonitoringService } from '../common/services/azure-monitoring.service';
import { AzureServiceBusService } from '../common/services/azure-service-bus.service';

@Module({
  imports: [ConfigModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    ExaApiService,
    SocialMonitoringService,
    NewsMonitoringService,
    SerpMonitoringService,
    AzureMonitoringService,
    AzureServiceBusService
  ],
  exports: [
    IntegrationsService,
    ExaApiService,
    SocialMonitoringService,
    NewsMonitoringService,
    SerpMonitoringService,
    AzureMonitoringService,
    AzureServiceBusService
  ]
})
export class IntegrationsModule {}
