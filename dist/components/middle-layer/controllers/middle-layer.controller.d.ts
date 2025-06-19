import { BlufContentStructurerService } from '../services/bluf-content-structurer.service';
import { ConversationalQueryOptimizerService } from '../services/conversational-query-optimizer.service';
import { SemanticRelationshipMapperService } from '../services/semantic-relationship-mapper.service';
import { PlatformSpecificTunerService } from '../services/platform-specific-tuner.service';
export declare class MiddleLayerController {
    private readonly blufContentStructurerService;
    private readonly conversationalQueryOptimizerService;
    private readonly semanticRelationshipMapperService;
    private readonly platformSpecificTunerService;
    constructor(blufContentStructurerService: BlufContentStructurerService, conversationalQueryOptimizerService: ConversationalQueryOptimizerService, semanticRelationshipMapperService: SemanticRelationshipMapperService, platformSpecificTunerService: PlatformSpecificTunerService);
    structureContentBluf(data: any): Promise<any>;
    createLayeredStructure(data: any): Promise<any>;
    optimizeForConversation(data: any): Promise<any>;
    findQueryGaps(data: any): Promise<any>;
    generateFollowupQuestions(data: any): Promise<string[]>;
    mapRelationships(data: any): Promise<any>;
    enhanceWithInferences(data: any): Promise<any>;
    generateCrossReferences(data: any): Promise<any>;
    optimizeForPlatform(data: any): Promise<any>;
    optimizeForMultiplePlatforms(data: any): Promise<any>;
    testCrossPlatformPerformance(data: any): Promise<any>;
}
