import { Global, Module } from '@nestjs/common';
import { KeyVaultService } from './services/key-vault.service';
import { ApplicationInsightsService } from './services/application-insights.service';
import { ProductionHealthController } from './controllers/production-health.controller';

@Global()
@Module({
  controllers: [ProductionHealthController],
  providers: [KeyVaultService, ApplicationInsightsService],
  exports: [KeyVaultService, ApplicationInsightsService],
})
export class CommonModule {}
