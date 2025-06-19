import { ContentType } from '../../../common/interfaces/content.interfaces';
import { SeoValidationParams, SeoValidationResult } from '../../../common/interfaces/seo-validator.interfaces';
import { TechnicalSeoValidatorService } from '../services/technical-seo-validator.service';
declare class ValidateSeoDto implements SeoValidationParams {
    url?: string;
    html?: string;
    contentType?: ContentType;
    validateMobileFriendliness?: boolean;
    validateAccessibility?: boolean;
    validateHeadingStructure?: boolean;
    validateSemanticHtml?: boolean;
    validateCrawlerAccessibility?: boolean;
    validateStructuredData?: boolean;
    validateMetaTags?: boolean;
    validatePerformance?: boolean;
    validateContentQuality?: boolean;
}
export declare class TechnicalSeoValidatorController {
    private readonly seoValidator;
    private readonly logger;
    constructor(seoValidator: TechnicalSeoValidatorService);
    validateContent(validateSeoDto: ValidateSeoDto): Promise<{
        data: SeoValidationResult;
        error?: string;
    }>;
}
export {};
