import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TechnicalSeoValidatorService } from './services/technical-seo-validator.service';
import { SemanticHtmlAnalyzerService } from './services/semantic-html-analyzer.service';
import { AccessibilityValidatorService } from './services/accessibility-validator.service';

@Module({
  imports: [ConfigModule],
  providers: [
    TechnicalSeoValidatorService,
    SemanticHtmlAnalyzerService,
    AccessibilityValidatorService
  ],
  exports: [
    TechnicalSeoValidatorService,
    SemanticHtmlAnalyzerService,
    AccessibilityValidatorService
  ]
})
export class TechnicalSeoValidatorModule {}
