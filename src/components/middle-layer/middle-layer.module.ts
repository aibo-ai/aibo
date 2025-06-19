import { Module, forwardRef } from '@nestjs/common';
import { BlufContentStructurerService } from './services/bluf-content-structurer.service';
import { ConversationalQueryOptimizerService } from './services/conversational-query-optimizer.service';
import { SemanticRelationshipMapperService } from './services/semantic-relationship-mapper.service';
import { PlatformSpecificTunerService } from './services/platform-specific-tuner.service';
import { AzureIntegrationService } from './services/azure-integration.service';
import { MiddleLayerController } from './controllers/middle-layer.controller';
import { TopLayerModule } from '../top-layer/top-layer.module';

@Module({
  imports: [forwardRef(() => TopLayerModule)],
  controllers: [MiddleLayerController],
  providers: [
    BlufContentStructurerService,
    ConversationalQueryOptimizerService,
    SemanticRelationshipMapperService,
    PlatformSpecificTunerService,
    AzureIntegrationService,
  ],
  exports: [
    BlufContentStructurerService,
    ConversationalQueryOptimizerService,
    SemanticRelationshipMapperService,
    PlatformSpecificTunerService,
    AzureIntegrationService,
  ],
})
export class MiddleLayerModule {}
