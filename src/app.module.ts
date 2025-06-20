import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { OrchestratorModule } from './components/orchestrator/orchestrator.module';
import { BottomLayerModule } from './components/bottom-layer/bottom-layer.module';
import { MiddleLayerModule } from './components/middle-layer/middle-layer.module';
import { TopLayerModule } from './components/top-layer/top-layer.module';
import { TechnicalSeoValidatorModule } from './modules/technical-seo-validator/technical-seo-validator.module';
// TODO: Create or import these modules when implementing user and API integration features
// import { ApiIntegrationModule } from './components/api-integration/api-integration.module';
// import { UserModule } from './components/user/user.module';
import { SharedModule } from './shared/shared.module';
import { CommonModule } from './common/common.module';

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
    
    // Core Architectural Layers
    OrchestratorModule,
    BottomLayerModule,
    MiddleLayerModule,
    TopLayerModule,
    TechnicalSeoValidatorModule,
    // TODO: Uncomment these when the modules are created
    // ApiIntegrationModule,
    
    // User Management
    // UserModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
