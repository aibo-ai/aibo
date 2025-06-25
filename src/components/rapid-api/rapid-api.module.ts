import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RapidApiController } from './rapid-api.controller';
import { RapidApiService } from '../../common/services/rapid-api.service';
import { AzureMonitoringService } from '../../common/services/azure-monitoring.service';
import { ApplicationInsightsService } from '../../common/services/application-insights.service';

@Module({
  imports: [ConfigModule],
  controllers: [RapidApiController],
  providers: [
    RapidApiService,
    AzureMonitoringService,
    ApplicationInsightsService
  ],
  exports: [RapidApiService]
})
export class RapidApiModule {}
