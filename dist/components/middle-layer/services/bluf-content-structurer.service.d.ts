import { ConfigService } from '@nestjs/config';
export declare class BlufContentStructurerService {
    private configService;
    constructor(configService: ConfigService);
    structureContent(content: any, segment: 'b2b' | 'b2c', contentType?: string): Promise<any>;
    structureWithBluf(content: any, segment: 'b2b' | 'b2c', contentType?: string): Promise<any>;
    createLayeredStructure(content: any, maxDepth: number, segment: 'b2b' | 'b2c'): Promise<any>;
    private createContentLayers;
    getStructureTemplate(contentType: string, segment: 'b2b' | 'b2c'): Promise<any>;
    createLayeredAnswer(question: string, content: string, depth?: number): Promise<any>;
    private applyStructure;
    private generateSectionContent;
    private generateMockAnswer;
}
