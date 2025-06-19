import { SeoValidationIssue, AxeResult } from '../../../common/interfaces/seo-validator.interfaces';
export declare class AccessibilityValidatorService {
    private readonly logger;
    constructor();
    mapAxeResultsToIssues(axeResults: AxeResult): SeoValidationIssue[];
    calculateAccessibilityScore(axeResults: AxeResult): number;
    generateAccessibilityRecommendations(issues: SeoValidationIssue[]): string[];
}
