import { Module } from '@nestjs/common';
import { CommonModule } from '../../common/common.module';
import { LLMContentController } from './controllers/llm-content-controller';
import { LLMContentOptimizerService } from './services/llm-content-optimizer.service';
import { LLMContentAnalyzerService } from './services/llm-content-analyzer.service';
import { AzureAIService } from './services/azure-ai-service';
import { BlufContentStructurerService } from '../middle-layer/services/bluf-content-structurer.service';
import { ContentChunkerService } from '../bottom-layer/services/content-chunker.service';

@Module({
  imports: [
    CommonModule
  ],
  controllers: [
    LLMContentController
  ],
  providers: [
    LLMContentOptimizerService,
    LLMContentAnalyzerService,
    AzureAIService,
    BlufContentStructurerService,
    ContentChunkerService
  ],
  exports: [
    LLMContentOptimizerService,
    LLMContentAnalyzerService
  ]
})
export class LLMContentModule {}
