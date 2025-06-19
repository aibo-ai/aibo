import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
export declare class EeatSignalGeneratorService {
    private configService;
    private azureAIService;
    constructor(configService: ConfigService, azureAIService: AzureAIService);
    analyzeEeatSignals(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    enhanceEeatSignals(content: any, segment: 'b2b' | 'b2c'): Promise<any>;
    private analyzeExpertiseSignals;
    private analyzeExperienceSignals;
    private analyzeAuthoritativeness;
    private analyzeTrustworthiness;
    private extractTextFromContent;
    private generateEeatAnalysisPrompt;
    private enhanceExpertiseSignals;
    private enhanceExperienceSignals;
    private enhanceAuthoritativeness;
    private enhanceTrustworthiness;
}
