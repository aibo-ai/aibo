import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrchestratorModule } from './components/orchestrator/orchestrator.module';
import { BottomLayerModule } from './components/bottom-layer/bottom-layer.module';
import { MiddleLayerModule } from './components/middle-layer/middle-layer.module';
import { TopLayerModule } from './components/top-layer/top-layer.module';
import { TechnicalSeoValidatorModule } from './modules/technical-seo-validator/technical-seo-validator.module';
import { ImageGenerationModule } from './components/image-generation/image-generation.module';
import { AudioGenerationModule } from './components/audio-generation/audio-generation.module';
import { MentionlyticsModule } from './components/mentionlytics/mentionlytics.module';
import { MozSeoModule } from './components/moz-seo/moz-seo.module';
import { RapidApiModule } from './components/rapid-api/rapid-api.module';
// TODO: Create or import these modules when implementing user and API integration features
// import { ApiIntegrationModule } from './components/api-integration/api-integration.module';
// import { UserModule } from './components/user/user.module';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from './common/common.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { InternalModule } from './internal/internal.module';
import { ProductionModule } from './common/modules/production.module';
import { SeoDataIntegrationModule } from './components/seo-data-integration/seo-data-integration.module';
import { GeminiIntegrationModule } from './components/gemini-integration/gemini-integration.module';
import { RootController } from './controllers/root.controller';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    
    // Shared Services and Integrations
    SharedModule,
    CommonModule,
    IntegrationsModule,
    InternalModule,
    ProductionModule,
    SeoDataIntegrationModule,
    GeminiIntegrationModule,
    
    // Core Architectural Layers
    OrchestratorModule,
    BottomLayerModule,
    MiddleLayerModule,
    TopLayerModule,
    TechnicalSeoValidatorModule,
    ImageGenerationModule,
    AudioGenerationModule,
    MentionlyticsModule,
    MozSeoModule,
    RapidApiModule,
    // TODO: Uncomment these when the modules are created
    // ApiIntegrationModule,
    
    // User Management
    // UserModule,
  ],
  controllers: [RootController],
  providers: [],
})
export class AppModule {}
