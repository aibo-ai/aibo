import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BottomLayerModule } from './components/bottom-layer/bottom-layer.module';
import { MiddleLayerModule } from './components/middle-layer/middle-layer.module';
import { TopLayerModule } from './components/top-layer/top-layer.module';
import { SharedModule } from './shared/shared.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    
    // Shared Services and Integrations
    SharedModule,
    
    // Core Architectural Layers (excluding problematic modules)
    BottomLayerModule,
    MiddleLayerModule,
    TopLayerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppMinimalModule {}
