import { ConfigService } from '@nestjs/config';
export declare class FeedbackLoopService {
    private configService;
    constructor(configService: ConfigService);
    collectPerformanceMetrics(contentId: string, clientType: 'b2b' | 'b2c'): Promise<any>;
    generateImprovementSuggestions(contentId: string, metrics: any): Promise<any>;
    applyAutomatedImprovements(contentId: string, improvements: string[]): Promise<any>;
}
