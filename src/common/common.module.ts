import { Global, Module } from '@nestjs/common';
import { KeyVaultService } from './services/key-vault.service';
import { ApplicationInsightsService } from './services/application-insights.service';

@Global()
@Module({
  providers: [KeyVaultService, ApplicationInsightsService],
  exports: [KeyVaultService, ApplicationInsightsService],
})
export class CommonModule {}
