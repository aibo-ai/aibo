import { ConfigService } from '@nestjs/config';
import { SeoValidationParams, SeoValidationResult } from '../../../common/interfaces/seo-validator.interfaces';
import { SemanticHtmlAnalyzerService } from './semantic-html-analyzer.service';
import { AccessibilityValidatorService } from './accessibility-validator.service';
export declare class TechnicalSeoValidatorService {
    private configService;
    private semanticHtmlAnalyzer;
    private accessibilityValidator;
    private readonly logger;
    private readonly lighthouseApiUrl;
    private readonly azureFunctionUrl;
    constructor(configService: ConfigService, semanticHtmlAnalyzer: SemanticHtmlAnalyzerService, accessibilityValidator: AccessibilityValidatorService);
    validateContent(params: SeoValidationParams): Promise<SeoValidationResult>;
    private validateUrl;
    private validateHtml;
    private calculateMetrics;
    private calculateScores;
    private calculateCategoryScore;
    private generateRecommendations;
    private createPlaceholderScore;
    private createPlaceholderMetrics;
}
