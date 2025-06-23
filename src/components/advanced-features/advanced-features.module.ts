import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MLContentOptimizerService } from './services/ml-content-optimizer.service';
import { RealtimeFactCheckerService } from './services/realtime-fact-checker.service';
import { BlockchainVerificationService } from './services/blockchain-verification.service';
import { AdvancedFeaturesController } from './controllers/advanced-features.controller';
import { ApplicationInsightsService } from '../../common/services/application-insights.service';

@Module({
  imports: [ConfigModule],
  controllers: [AdvancedFeaturesController],
  providers: [
    MLContentOptimizerService,
    RealtimeFactCheckerService,
    BlockchainVerificationService,
    ApplicationInsightsService,
  ],
  exports: [
    MLContentOptimizerService,
    RealtimeFactCheckerService,
    BlockchainVerificationService,
  ],
})
export class AdvancedFeaturesModule {}
