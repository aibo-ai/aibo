import { ConfigService } from '@nestjs/config';
export declare class PlatformSpecificTunerService {
    private configService;
    constructor(configService: ConfigService);
    optimizeForPlatform(content: any, platform: 'chatgpt' | 'perplexity' | 'gemini' | 'grok'): Promise<any>;
    optimizeForMultiplePlatforms(content: any, platforms: string[]): Promise<any>;
    testCrossplatformPerformance(content: any, platforms: string[]): Promise<any>;
    private getPlatformStrategy;
    private applyPlatformOptimizations;
    private findCommonOptimizations;
    private applyCommonOptimizations;
    private calculateAggregateScore;
    private generateRecommendations;
    private getRandomSubset;
}
