import { ConfigService } from '@nestjs/config';
import { SeoValidationParams, SeoValidationResult } from '../../../common/interfaces/seo-validator.interfaces';
export declare class TechnicalSeoValidatorService {
    private configService;
    private readonly logger;
    private readonly lighthouseApiUrl;
    private readonly azureFunctionUrl;
    constructor(configService: ConfigService);
    validateContent(params: SeoValidationParams): Promise<SeoValidationResult>;
    private validateUrl;
    private validateHtml;
    private createPlaceholderScore;
    private createPlaceholderMetrics;
}
