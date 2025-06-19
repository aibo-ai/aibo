import { EeatSignalGeneratorService } from '../services/eeat-signal-generator.service';
import { OriginalResearchEngineService } from '../services/original-research-engine.service';
import { CitationAuthorityVerifierService } from '../services/citation-authority-verifier.service';
import { SchemaMarkupGeneratorService } from '../services/schema-markup-generator.service';
export declare class TopLayerController {
    private readonly eeatSignalGeneratorService;
    private readonly originalResearchEngineService;
    private readonly citationAuthorityVerifierService;
    private readonly schemaMarkupGeneratorService;
    constructor(eeatSignalGeneratorService: EeatSignalGeneratorService, originalResearchEngineService: OriginalResearchEngineService, citationAuthorityVerifierService: CitationAuthorityVerifierService, schemaMarkupGeneratorService: SchemaMarkupGeneratorService);
    analyzeEeatSignals(data: any): Promise<any>;
    enhanceEeatSignals(data: any): Promise<any>;
    generateOriginalResearch(data: any): Promise<any>;
    integrateResearch(data: any): Promise<any>;
    identifyResearchGaps(data: any): Promise<any>;
    verifyCitations(data: any): Promise<any>;
    enhanceCitations(data: any): Promise<any>;
    generateCitationStrategy(data: any): Promise<any>;
    generateSchema(data: any): Promise<any>;
    analyzeForSchema(data: any): Promise<any>;
    enhanceSchema(data: any): Promise<any>;
}
