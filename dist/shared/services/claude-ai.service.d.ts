import { ConfigService } from '@nestjs/config';
export declare class ClaudeAIService {
    private readonly configService;
    private readonly apiKey;
    private readonly logger;
    private isApiKeyValid;
    constructor(configService: ConfigService);
    private validateApiKey;
    generateCompletion(prompt: string, options?: any): Promise<any>;
    generateStructuredContent(content: string, instructions: string, outputFormat?: string): Promise<any>;
    analyzeContent(content: string, analysisType: string): Promise<any>;
}
