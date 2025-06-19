import { Module } from '@nestjs/common';
import { QueryIntentAnalyzerService } from './services/query-intent-analyzer.service';
import { FreshnessAggregatorService } from './services/freshness-aggregator.service';
import { ContentChunkerService } from './services/content-chunker.service';
import { KeywordTopicAnalyzerService } from './services/keyword-topic-analyzer.service';
import { AzureDataPersistenceService } from './services/azure-data-persistence.service';
import { BottomLayerController } from './controllers/bottom-layer.controller';
import { TechnicalSeoValidatorModule } from './technical-seo-validator.module';
import { TechnicalSeoValidatorController } from './controllers/technical-seo-validator.controller';

@Module({
  imports: [TechnicalSeoValidatorModule],
  controllers: [BottomLayerController, TechnicalSeoValidatorController],
  providers: [
    QueryIntentAnalyzerService,
    FreshnessAggregatorService,
    ContentChunkerService,
    KeywordTopicAnalyzerService,
    AzureDataPersistenceService,
  ],
  exports: [
    QueryIntentAnalyzerService,
    FreshnessAggregatorService,
    ContentChunkerService,
    KeywordTopicAnalyzerService,
    AzureDataPersistenceService,
  ],
})
export class BottomLayerModule {}
