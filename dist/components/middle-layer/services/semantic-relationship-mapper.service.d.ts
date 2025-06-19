import { ConfigService } from '@nestjs/config';
export declare class SemanticRelationshipMapperService {
    private configService;
    constructor(configService: ConfigService);
    mapSemanticRelationships(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    enhanceWithSemanticInferences(content: any, knowledgeGraph: any): Promise<any>;
    generateCrossReferenceMap(concepts: string[]): Promise<any>;
    private extractEntities;
    private generateRelationships;
    private buildKnowledgeGraph;
    private generateInferences;
    private generateInferenceStatement;
    private generateSupportingEvidence;
    private getRandomSubset;
}
