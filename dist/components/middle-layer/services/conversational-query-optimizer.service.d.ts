import { ConfigService } from '@nestjs/config';
export declare class ConversationalQueryOptimizerService {
    private configService;
    constructor(configService: ConfigService);
    optimizeForConversationalQueries(content: any, targetQueries: string[]): Promise<any>;
    identifyQueryGaps(queries: string[], content: any): Promise<any>;
    generateAnticipatoryQuestions(content: any, count?: number): Promise<string[]>;
    private enhanceWithConversationalPatterns;
    private findMostRelevantSection;
    private findSecondaryRelevantSections;
    private generateFollowUpQuestions;
    private findRelevantSections;
    private isCovered;
    private identifyMissingAspects;
    private identifyTopContentGaps;
}
