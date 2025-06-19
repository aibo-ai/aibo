import { ConfigService } from '@nestjs/config';
export declare class SchemaMarkupGeneratorService {
    private configService;
    constructor(configService: ConfigService);
    generateSchemaMarkup(content: any, contentType: string, segment: 'b2b' | 'b2c'): Promise<any>;
    analyzeContentForSchemaRecommendations(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    enhanceSchemaMarkup(existingSchema: any, content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    private determineSchemaType;
    private createSchemaForType;
    private generateFaqEntities;
    private generateHowToSteps;
    private analyzeContentStructure;
    private generateSchemaRecommendations;
    private generateEnhancedProperties;
}
