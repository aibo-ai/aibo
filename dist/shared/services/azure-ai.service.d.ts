import { ConfigService } from '@nestjs/config';
export declare class AzureAIService {
    private configService;
    private readonly logger;
    private readonly endpoint;
    private readonly apiKey;
    private readonly openaiClient;
    private readonly searchClient;
    private readonly aiFoundryEndpoint;
    private readonly aiFoundryKey;
    private readonly aiFoundryDeploymentUrl;
    private readonly aiFoundryDeploymentName;
    private readonly aiFoundryApiVersion;
    constructor(configService: ConfigService);
    generateCompletion(prompt: string, options?: any): Promise<any>;
    getCompletion(prompt: string | any, options?: any): Promise<string>;
    generateEmbeddings(text: string): Promise<number[]>;
    analyzeText(text: string, features?: string[]): Promise<any>;
    search(query: string, indexName?: string): Promise<any>;
}
