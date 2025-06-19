import { ConfigService } from '@nestjs/config';
export declare class ExternalApisService {
    private configService;
    private readonly exaApiUrl;
    private readonly exaApiKey;
    private readonly serpApiUrl;
    private readonly serpApiKey;
    private readonly socialSearcherApiKey;
    private readonly socialSearcherUrl;
    private readonly xApiUrl;
    private readonly xApiKey;
    private readonly xApiSecret;
    private readonly newsApiUrl;
    private readonly newsApiKey;
    private readonly mediastackApiUrl;
    private readonly mediastackApiKey;
    constructor(configService: ConfigService);
    searchWeb(query: string, options?: any): Promise<any>;
    getSerpData(query: string, options?: any): Promise<any>;
    searchSocialMedia(query: string, options?: any): Promise<any>;
    searchTwitter(query: string, options?: any): Promise<any>;
    private getTwitterBearerToken;
    searchNewsArticles(query: string, options?: any): Promise<any>;
    searchMediaContent(query: string, options?: any): Promise<any>;
    aggregateNewsAndMedia(topic: string): Promise<any>;
    getTrendData(topic: string): Promise<any>;
    getCitationSources(topic: string, preferredDomains?: string[]): Promise<any>;
    private calculateAuthorityScore;
}
