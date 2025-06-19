import { ConfigService } from '@nestjs/config';
export declare class QDFAlgorithmService {
    private configService;
    private readonly logger;
    private qdfScoresContainer;
    constructor(configService: ConfigService);
    calculateQDFScore(topic: string): Promise<number>;
    private getStoredQDFScore;
    private storeQDFScore;
    private calculateTrendingFactor;
    private calculateVolatilityFactor;
    private calculateSeasonalityFactor;
}
