import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MentionlyticsController } from './mentionlytics.controller';
import { MentionlyticsService } from '../../common/services/mentionlytics.service';
import { AzureMonitoringService } from '../../common/services/azure-monitoring.service';
import { ApplicationInsightsService } from '../../common/services/application-insights.service';

@Module({
  imports: [ConfigModule],
  controllers: [MentionlyticsController],
  providers: [
    MentionlyticsService,
    AzureMonitoringService,
    ApplicationInsightsService
  ],
  exports: [MentionlyticsService]
})
export class MentionlyticsModule {}
