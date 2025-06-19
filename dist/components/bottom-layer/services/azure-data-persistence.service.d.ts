import { KeyVaultService } from '../../../common/services/key-vault.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}
export declare class AzureDataPersistenceService {
    private readonly keyVaultService;
    private readonly appInsights;
    private readonly logger;
    private cosmosEndpoint;
    private cosmosKey;
    private cosmosDatabase;
    private cosmosContainer;
    private storageConnectionString;
    private storageBlobContainer;
    private redisHost;
    private redisKey;
    private redisPort;
    constructor(keyVaultService: KeyVaultService, appInsights: ApplicationInsightsService);
    initializeCredentials(): Promise<void>;
    saveContent(id: string | undefined, content: any): Promise<ApiResponse<{
        id: string;
    }>>;
    getContentById(id: string): Promise<ApiResponse<any>>;
    queryContent(query: string, parameters?: any[]): Promise<ApiResponse<{
        items: any[];
        count: number;
    }>>;
    saveFile(fileName: string, fileContent: Buffer | string, contentType: string): Promise<ApiResponse<{
        url: string;
    }>>;
    setCacheValue(key: string, value: any, ttlSeconds?: number): Promise<ApiResponse<boolean>>;
    getCacheValue(key: string): Promise<ApiResponse<any>>;
    private generateCosmosAuthHeader;
}
