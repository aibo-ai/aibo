import { Module, forwardRef } from '@nestjs/common';
import { EeatSignalGeneratorService } from './services/eeat-signal-generator.service';
import { OriginalResearchEngineService } from './services/original-research-engine.service';
import { CitationAuthorityVerifierService } from './services/citation-authority-verifier.service';
import { SchemaMarkupGeneratorService } from './services/schema-markup-generator.service';
import { AzureAIService } from './services/azure-ai-service';
import { TopLayerController } from './controllers/top-layer.controller';
import { LLMContentController } from './controllers/llm-content-controller';
import { LLMContentOptimizerService } from './services/llm-content-optimizer.service';
import { LLMContentAnalyzerService } from './services/llm-content-analyzer.service';
import { CommonModule } from '../../common/common.module';
import { MiddleLayerModule } from '../middle-layer/middle-layer.module';
import { BottomLayerModule } from '../bottom-layer/bottom-layer.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [
    CommonModule,
    SharedModule,
    forwardRef(() => MiddleLayerModule),
    BottomLayerModule
  ],
  controllers: [
    TopLayerController,
    LLMContentController
  ],
  providers: [
    EeatSignalGeneratorService,
    OriginalResearchEngineService,
    CitationAuthorityVerifierService,
    SchemaMarkupGeneratorService,
    AzureAIService,
    LLMContentOptimizerService,
    LLMContentAnalyzerService
  ],
  exports: [
    EeatSignalGeneratorService,
    OriginalResearchEngineService,
    CitationAuthorityVerifierService,
    SchemaMarkupGeneratorService,
    AzureAIService,
    LLMContentOptimizerService,
    LLMContentAnalyzerService
  ],
})
export class TopLayerModule {}
