import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
export declare class OriginalResearchEngineService {
    private configService;
    private azureAIService;
    constructor(configService: ConfigService, azureAIService: AzureAIService);
    private generateResearchPrompt;
    private extractResearchType;
    private extractResearchData;
    private extractMethodology;
    private extractDemographicData;
    private extractTrendData;
    private extractComparativeData;
    private extractKeyFindings;
    generateOriginalResearch(topic: string, contentType: string, segment: 'b2b' | 'b2c'): Promise<any>;
    integrateResearchIntoContent(content: any, researchData: any): Promise<any>;
    identifyResearchGaps(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    private generateDataPoints;
    private generateVisualizations;
    private generateInsights;
    private getDataSources;
    private getIntegrationPoints;
    private getResearchOpportunities;
    private getRecommendedApproach;
}
