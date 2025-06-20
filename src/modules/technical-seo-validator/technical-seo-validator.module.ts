import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TechnicalSeoValidatorService } from './technical-seo-validator.service';
import { TechnicalSeoValidatorController } from './technical-seo-validator.controller';

@Module({
  imports: [ConfigModule],
  controllers: [TechnicalSeoValidatorController],
  providers: [TechnicalSeoValidatorService],
  exports: [TechnicalSeoValidatorService]
})
export class TechnicalSeoValidatorModule {}
