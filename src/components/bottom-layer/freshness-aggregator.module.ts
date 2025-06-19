import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FreshnessAggregatorService } from './services/freshness-aggregator.service';
import { QDFAlgorithmService } from './services/qdf-algorithm.service';
import { FreshnessThresholdsService } from './services/freshness-thresholds.service';
import { ContentFreshnessScorer } from './services/content-freshness-scorer.service';
import { MediastackApiService } from './services/api-clients/mediastack-api.service';
import { SerperApiService } from './services/api-clients/serper-api.service';
import { ExaApiService } from './services/api-clients/exa-api.service';

@Module({
  imports: [ConfigModule],
  providers: [
    FreshnessAggregatorService,
    QDFAlgorithmService,
    FreshnessThresholdsService,
    ContentFreshnessScorer,
    MediastackApiService,
    SerperApiService,
    ExaApiService
  ],
  exports: [FreshnessAggregatorService]
})
export class FreshnessAggregatorModule {}
