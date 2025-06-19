import { SeoValidationIssue } from '../../../common/interfaces/seo-validator.interfaces';
export declare class SemanticHtmlAnalyzerService {
    private readonly logger;
    constructor();
    analyzeHtml(html: string): Promise<SeoValidationIssue[]>;
    private checkHeadingStructure;
    private checkSemanticElements;
    private checkAccessibility;
}
