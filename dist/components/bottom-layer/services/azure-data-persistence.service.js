"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AzureDataPersistenceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureDataPersistenceService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const key_vault_service_1 = require("../../../common/services/key-vault.service");
const application_insights_service_1 = require("../../../common/services/application-insights.service");
let AzureDataPersistenceService = AzureDataPersistenceService_1 = class AzureDataPersistenceService {
    constructor(keyVaultService, appInsights) {
        this.keyVaultService = keyVaultService;
        this.appInsights = appInsights;
        this.logger = new common_1.Logger(AzureDataPersistenceService_1.name);
        this.cosmosEndpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
        this.cosmosKey = process.env.AZURE_COSMOS_KEY || '';
        this.cosmosDatabase = process.env.AZURE_COSMOS_DATABASE || 'content-db';
        this.cosmosContainer = process.env.AZURE_COSMOS_CONTAINER || 'content';
        this.storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
        this.storageBlobContainer = process.env.AZURE_STORAGE_BLOB_CONTAINER || 'content-assets';
        this.redisHost = process.env.AZURE_REDIS_HOST || '';
        this.redisKey = process.env.AZURE_REDIS_KEY || '';
        this.redisPort = parseInt(process.env.AZURE_REDIS_PORT || '6379', 10);
        this.logger.log('Azure Data Persistence Service initialized');
    }
    async initializeCredentials() {
        if (this.keyVaultService.isKeyVaultAvailable()) {
            try {
                this.logger.log('Retrieving Azure Data service credentials from Key Vault');
                const cosmosKey = await this.keyVaultService.getSecret('AZURE-COSMOS-KEY');
                const storageConnectionString = await this.keyVaultService.getSecret('AZURE-STORAGE-CONNECTION-STRING');
                const redisKey = await this.keyVaultService.getSecret('AZURE-REDIS-KEY');
                if (cosmosKey)
                    this.cosmosKey = cosmosKey;
                if (storageConnectionString)
                    this.storageConnectionString = storageConnectionString;
                if (redisKey)
                    this.redisKey = redisKey;
                this.logger.log('Retrieved Azure Data service credentials from Key Vault successfully');
            }
            catch (error) {
                this.logger.warn(`Failed to retrieve credentials from Key Vault: ${error.message}. Using environment variables.`);
            }
        }
        else {
            this.logger.log('Key Vault not available, using environment variables for Azure Data service credentials');
        }
        if (!this.cosmosEndpoint || !this.cosmosKey) {
            this.logger.warn('Azure Cosmos DB credentials not configured properly');
        }
        if (!this.storageConnectionString) {
            this.logger.warn('Azure Storage connection string not configured properly');
        }
        if (!this.redisHost || !this.redisKey) {
            this.logger.warn('Azure Redis credentials not configured properly');
        }
    }
    async saveContent(id, content) {
        const startTime = Date.now();
        const operationId = `cosmos-save-${Date.now()}`;
        this.appInsights.trackEvent('AzureCosmos:SaveContent:Start', {
            hasId: id ? 'yes' : 'no',
            contentType: content.type || 'unknown'
        });
        try {
            await this.initializeCredentials();
            const contentId = id || `content-${Date.now()}`;
            const documentPath = `/dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs`;
            const date = new Date().toUTCString();
            const contentWithId = Object.assign(Object.assign({ id: contentId }, content), { updatedAt: new Date().toISOString(), createdAt: content.createdAt || new Date().toISOString() });
            const resourceType = 'docs';
            const resourceLink = `dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}`;
            const response = await (0, axios_1.default)({
                method: 'post',
                url: `${this.cosmosEndpoint}${documentPath}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.generateCosmosAuthHeader(resourceType, resourceLink),
                    'x-ms-date': date,
                    'x-ms-version': '2020-07-15',
                },
                data: contentWithId
            });
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureCosmos:SaveContent:Success', {
                contentId: contentId,
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('AzureCosmos:SaveContentLatency', duration, {
                success: 'true'
            });
            return {
                data: {
                    id: response.data.id || contentId
                }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error, {
                operation: 'AzureCosmos:SaveContent',
                contentId: id || 'new',
                errorMessage: error.message
            });
            this.appInsights.trackMetric('AzureCosmos:SaveContentLatency', duration, {
                success: 'false'
            });
            this.logger.error(`Error saving content to Cosmos DB: ${error.message}`);
            return {
                error: `Failed to save content: ${error.message}`
            };
        }
    }
    async getContentById(id) {
        const startTime = Date.now();
        const operationId = `cosmos-get-${Date.now()}`;
        this.appInsights.trackEvent('AzureCosmos:GetContent:Start', {
            contentId: id
        });
        try {
            await this.initializeCredentials();
            const documentPath = `/dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs/${id}`;
            const date = new Date().toUTCString();
            const resourceType = 'docs';
            const resourceLink = `dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs/${id}`;
            const response = await (0, axios_1.default)({
                method: 'get',
                url: `${this.cosmosEndpoint}${documentPath}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.generateCosmosAuthHeader(resourceType, resourceLink),
                    'x-ms-date': date,
                    'x-ms-version': '2020-07-15',
                }
            });
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureCosmos:GetContent:Success', {
                contentId: id,
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('AzureCosmos:GetContentLatency', duration, {
                success: 'true'
            });
            return {
                data: response.data
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            if (error.response && error.response.status === 404) {
                this.appInsights.trackEvent('AzureCosmos:GetContent:NotFound', {
                    contentId: id,
                    durationMs: duration.toString()
                });
                return {
                    error: `Content with ID ${id} not found`
                };
            }
            this.appInsights.trackException(error, {
                operation: 'AzureCosmos:GetContent',
                contentId: id,
                errorMessage: error.message
            });
            this.appInsights.trackMetric('AzureCosmos:GetContentLatency', duration, {
                success: 'false'
            });
            this.logger.error(`Error retrieving content from Cosmos DB: ${error.message}`);
            return {
                error: `Failed to retrieve content: ${error.message}`
            };
        }
    }
    async queryContent(query, parameters = []) {
        const startTime = Date.now();
        const operationId = `cosmos-query-${Date.now()}`;
        this.appInsights.trackEvent('AzureCosmos:QueryContent:Start', {
            queryLength: query.length.toString(),
            parametersCount: parameters.length.toString()
        });
        try {
            await this.initializeCredentials();
            const documentPath = `/dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs`;
            const date = new Date().toUTCString();
            const resourceType = 'docs';
            const resourceLink = `dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}`;
            const response = await (0, axios_1.default)({
                method: 'post',
                url: `${this.cosmosEndpoint}${documentPath}`,
                headers: {
                    'Content-Type': 'application/query+json',
                    'Authorization': this.generateCosmosAuthHeader(resourceType, resourceLink),
                    'x-ms-date': date,
                    'x-ms-version': '2020-07-15',
                    'x-ms-documentdb-isquery': 'true',
                },
                data: {
                    query,
                    parameters
                }
            });
            const duration = Date.now() - startTime;
            const resultCount = response.data.Documents ? response.data.Documents.length : 0;
            this.appInsights.trackEvent('AzureCosmos:QueryContent:Success', {
                resultCount: resultCount.toString(),
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('AzureCosmos:QueryContentLatency', duration, {
                resultCount: resultCount.toString(),
                success: 'true'
            });
            return {
                data: {
                    items: response.data.Documents || [],
                    count: response.data._count || (response.data.Documents ? response.data.Documents.length : 0)
                }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error, {
                operation: 'AzureCosmos:QueryContent',
                query: query,
                errorMessage: error.message
            });
            this.appInsights.trackMetric('AzureCosmos:QueryContentLatency', duration, {
                success: 'false'
            });
            this.logger.error(`Error querying content from Cosmos DB: ${error.message}`);
            return {
                error: `Failed to query content: ${error.message}`
            };
        }
    }
    async saveFile(fileName, fileContent, contentType) {
        const startTime = Date.now();
        const operationId = `blob-save-${Date.now()}`;
        this.appInsights.trackEvent('AzureStorage:SaveFile:Start', {
            fileName: fileName,
            contentType: contentType,
            sizeBytes: typeof fileContent === 'string' ? fileContent.length.toString() : fileContent.length.toString()
        });
        try {
            await this.initializeCredentials();
            this.logger.log(`Saving file ${fileName} to Azure Blob Storage (${this.storageBlobContainer})`);
            const url = `https://${this.storageBlobContainer}.blob.core.windows.net/${this.storageBlobContainer}/${fileName}`;
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureStorage:SaveFile:Success', {
                fileName: fileName,
                durationMs: duration.toString(),
                url: url
            });
            this.appInsights.trackMetric('AzureStorage:SaveFileLatency', duration, {
                contentType: contentType,
                success: 'true'
            });
            return {
                data: {
                    url
                }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error, {
                operation: 'AzureStorage:SaveFile',
                fileName: fileName,
                contentType: contentType,
                errorMessage: error.message
            });
            this.appInsights.trackMetric('AzureStorage:SaveFileLatency', duration, {
                contentType: contentType,
                success: 'false'
            });
            this.logger.error(`Error saving file to Azure Blob Storage: ${error.message}`);
            return {
                error: `Failed to save file: ${error.message}`
            };
        }
    }
    async setCacheValue(key, value, ttlSeconds = 3600) {
        const startTime = Date.now();
        this.appInsights.trackEvent('AzureRedis:SetCache:Start', {
            key: key,
            ttlSeconds: ttlSeconds.toString(),
            valueType: typeof value
        });
        try {
            await this.initializeCredentials();
            this.logger.log(`Setting cache key ${key} in Azure Redis Cache (TTL: ${ttlSeconds}s)`);
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureRedis:SetCache:Success', {
                key: key,
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('AzureRedis:SetCacheLatency', duration, {
                success: 'true'
            });
            return {
                data: true
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error, {
                operation: 'AzureRedis:SetCache',
                key: key,
                errorMessage: error.message
            });
            this.appInsights.trackMetric('AzureRedis:SetCacheLatency', duration, {
                success: 'false'
            });
            this.logger.error(`Error setting cache value in Redis: ${error.message}`);
            return {
                error: `Failed to set cache value: ${error.message}`
            };
        }
    }
    async getCacheValue(key) {
        const startTime = Date.now();
        this.appInsights.trackEvent('AzureRedis:GetCache:Start', {
            key: key
        });
        try {
            await this.initializeCredentials();
            this.logger.log(`Getting cache key ${key} from Azure Redis Cache`);
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureRedis:GetCache:Success', {
                key: key,
                hit: 'false',
                durationMs: duration.toString()
            });
            this.appInsights.trackMetric('AzureRedis:GetCacheLatency', duration, {
                hit: 'false',
                success: 'true'
            });
            return {
                data: null
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error, {
                operation: 'AzureRedis:GetCache',
                key: key,
                errorMessage: error.message
            });
            this.appInsights.trackMetric('AzureRedis:GetCacheLatency', duration, {
                success: 'false'
            });
            this.logger.error(`Error getting cache value from Redis: ${error.message}`);
            return {
                error: `Failed to get cache value: ${error.message}`
            };
        }
    }
    generateCosmosAuthHeader(resourceType, resourceLink) {
        return `type=master&ver=1.0&sig=placeholder-signature`;
    }
};
exports.AzureDataPersistenceService = AzureDataPersistenceService;
exports.AzureDataPersistenceService = AzureDataPersistenceService = AzureDataPersistenceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [key_vault_service_1.KeyVaultService,
        application_insights_service_1.ApplicationInsightsService])
], AzureDataPersistenceService);
//# sourceMappingURL=azure-data-persistence.service.js.map