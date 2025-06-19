import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { KeyVaultService } from '../../../common/services/key-vault.service';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

/**
 * Response interface that follows the structure used in frontend components
 * with a data object containing the actual content and a possible error field
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Bottom layer service that handles direct interactions with Azure storage services
 * This service provides data persistence operations with Azure Cosmos DB, Blob Storage, and Redis Cache
 */
@Injectable()
export class AzureDataPersistenceService {
  private readonly logger = new Logger(AzureDataPersistenceService.name);
  // Using private variables (not readonly) so they can be updated from Key Vault
  private cosmosEndpoint: string;
  private cosmosKey: string;
  private cosmosDatabase: string;
  private cosmosContainer: string;
  private storageConnectionString: string;
  private storageBlobContainer: string;
  private redisHost: string;
  private redisKey: string;
  private redisPort: number;

  constructor(
    private readonly keyVaultService: KeyVaultService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    // Initialize with empty or default values, will be populated in initializeCredentials
    this.cosmosEndpoint = process.env.AZURE_COSMOS_ENDPOINT || '';
    this.cosmosKey = process.env.AZURE_COSMOS_KEY || '';
    this.cosmosDatabase = process.env.AZURE_COSMOS_DATABASE || 'content-db';
    this.cosmosContainer = process.env.AZURE_COSMOS_CONTAINER || 'content';
    this.storageConnectionString = process.env.AZURE_STORAGE_CONNECTION_STRING || '';
    this.storageBlobContainer = process.env.AZURE_STORAGE_BLOB_CONTAINER || 'content-assets';
    this.redisHost = process.env.AZURE_REDIS_HOST || '';
    this.redisKey = process.env.AZURE_REDIS_KEY || '';
    this.redisPort = parseInt(process.env.AZURE_REDIS_PORT || '6379', 10);
    
    // Log initialization
    this.logger.log('Azure Data Persistence Service initialized');
  }
  
  /**
   * Initialize credentials from Key Vault if available
   * This should be called before any data operations
   */
  async initializeCredentials(): Promise<void> {
    if (this.keyVaultService.isKeyVaultAvailable()) {
      try {
        this.logger.log('Retrieving Azure Data service credentials from Key Vault');
        
        // Get secrets from Key Vault
        const cosmosKey = await this.keyVaultService.getSecret('AZURE-COSMOS-KEY');
        const storageConnectionString = await this.keyVaultService.getSecret('AZURE-STORAGE-CONNECTION-STRING');
        const redisKey = await this.keyVaultService.getSecret('AZURE-REDIS-KEY');
        
        // Update credentials if retrieved from Key Vault
        if (cosmosKey) this.cosmosKey = cosmosKey;
        if (storageConnectionString) this.storageConnectionString = storageConnectionString;
        if (redisKey) this.redisKey = redisKey;
        
        this.logger.log('Retrieved Azure Data service credentials from Key Vault successfully');
      } catch (error) {
        this.logger.warn(`Failed to retrieve credentials from Key Vault: ${error.message}. Using environment variables.`);
      }
    } else {
      this.logger.log('Key Vault not available, using environment variables for Azure Data service credentials');
    }
    
    // Log warning if credentials are still missing
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

  /**
   * Create or update a content item in Cosmos DB
   * @param id Content ID (optional, will be generated if not provided)
   * @param content Content data to store
   */
  async saveContent(id: string | undefined, content: any): Promise<ApiResponse<{ id: string }>> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `cosmos-save-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureCosmos:SaveContent:Start', {
      hasId: id ? 'yes' : 'no',
      contentType: content.type || 'unknown'
    });
    
    try {
      // Initialize credentials if necessary
      await this.initializeCredentials();
      
      const contentId = id || `content-${Date.now()}`;
      const documentPath = `/dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs`;
      const date = new Date().toUTCString();
      const contentWithId = {
        id: contentId,
        ...content,
        updatedAt: new Date().toISOString(),
        createdAt: content.createdAt || new Date().toISOString()
      };

      // Cosmos DB REST API requires a specific authorization header
      const resourceType = 'docs';
      const resourceLink = `dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}`;
      
      // Use axios to call Cosmos DB REST API
      const response = await axios({
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
      
      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful operation
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
    } catch (error) {
      // Calculate performance metrics for failure case
      const duration = Date.now() - startTime;
      
      // Track the exception
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

  /**
   * Retrieve a content item from Cosmos DB by ID
   * @param id Content ID
   */
  async getContentById(id: string): Promise<ApiResponse<any>> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `cosmos-get-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureCosmos:GetContent:Start', {
      contentId: id
    });
    
    try {
      // Initialize credentials if necessary
      await this.initializeCredentials();
      
      const documentPath = `/dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs/${id}`;
      const date = new Date().toUTCString();
      
      // Cosmos DB REST API requires a specific authorization header
      const resourceType = 'docs';
      const resourceLink = `dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs/${id}`;
      
      // Use axios to call Cosmos DB REST API
      const response = await axios({
        method: 'get',
        url: `${this.cosmosEndpoint}${documentPath}`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.generateCosmosAuthHeader(resourceType, resourceLink),
          'x-ms-date': date,
          'x-ms-version': '2020-07-15',
        }
      });
      
      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful operation
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
    } catch (error) {
      // Calculate performance metrics for failure case
      const duration = Date.now() - startTime;
      
      if (error.response && error.response.status === 404) {
        // Track not found as a separate event
        this.appInsights.trackEvent('AzureCosmos:GetContent:NotFound', {
          contentId: id,
          durationMs: duration.toString()
        });
        
        return {
          error: `Content with ID ${id} not found`
        };
      }

      // Track the exception
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

  /**
   * Query content items from Cosmos DB
   * @param query SQL-like query
   * @param parameters Query parameters
   */
  async queryContent(query: string, parameters: any[] = []): Promise<ApiResponse<{ items: any[], count: number }>> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `cosmos-query-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureCosmos:QueryContent:Start', {
      queryLength: query.length.toString(),
      parametersCount: parameters.length.toString()
    });
    
    try {
      // Initialize credentials if necessary
      await this.initializeCredentials();
      
      const documentPath = `/dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}/docs`;
      const date = new Date().toUTCString();
      
      // Cosmos DB REST API requires a specific authorization header
      const resourceType = 'docs';
      const resourceLink = `dbs/${this.cosmosDatabase}/colls/${this.cosmosContainer}`;
      
      // Use axios to call Cosmos DB REST API
      const response = await axios({
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
      
      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful operation
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
    } catch (error) {
      // Calculate performance metrics for failure case
      const duration = Date.now() - startTime;
      
      // Track the exception
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

  /**
   * Save a binary file to Azure Blob Storage
   * @param fileName File name (should be unique)
   * @param fileContent File content as Buffer or string
   * @param contentType MIME type
   */
  async saveFile(fileName: string, fileContent: Buffer | string, contentType: string): Promise<ApiResponse<{ url: string }>> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    const operationId = `blob-save-${Date.now()}`;
    
    // Track the request
    this.appInsights.trackEvent('AzureStorage:SaveFile:Start', {
      fileName: fileName,
      contentType: contentType,
      sizeBytes: typeof fileContent === 'string' ? fileContent.length.toString() : fileContent.length.toString()
    });
    
    try {
      // Initialize credentials if necessary
      await this.initializeCredentials();
      
      // In a real implementation, we would use the @azure/storage-blob package
      // For this simplified example, we'll just log the operation
      this.logger.log(`Saving file ${fileName} to Azure Blob Storage (${this.storageBlobContainer})`);
      
      // Placeholder for actual implementation
      const url = `https://${this.storageBlobContainer}.blob.core.windows.net/${this.storageBlobContainer}/${fileName}`;
      
      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful operation
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
    } catch (error) {
      // Calculate performance metrics for failure case
      const duration = Date.now() - startTime;
      
      // Track the exception
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

  /**
   * Store a value in Redis cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttlSeconds Time to live in seconds (default: 1 hour)
   */
  async setCacheValue(key: string, value: any, ttlSeconds: number = 3600): Promise<ApiResponse<boolean>> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    
    // Track the request
    this.appInsights.trackEvent('AzureRedis:SetCache:Start', {
      key: key,
      ttlSeconds: ttlSeconds.toString(),
      valueType: typeof value
    });
    
    try {
      // Initialize credentials if necessary
      await this.initializeCredentials();
      
      // In a real implementation, we would use the ioredis package
      // For this simplified example, we'll just log the operation
      this.logger.log(`Setting cache key ${key} in Azure Redis Cache (TTL: ${ttlSeconds}s)`);
      
      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful operation
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
    } catch (error) {
      // Calculate performance metrics for failure case
      const duration = Date.now() - startTime;
      
      // Track the exception
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

  /**
   * Get a value from Redis cache
   * @param key Cache key
   */
  async getCacheValue(key: string): Promise<ApiResponse<any>> {
    // Start performance timer and prepare telemetry
    const startTime = Date.now();
    
    // Track the request
    this.appInsights.trackEvent('AzureRedis:GetCache:Start', {
      key: key
    });
    
    try {
      // Initialize credentials if necessary
      await this.initializeCredentials();
      
      // In a real implementation, we would use the ioredis package
      // For this simplified example, we'll just log the operation
      this.logger.log(`Getting cache key ${key} from Azure Redis Cache`);
      
      // Calculate performance metrics
      const duration = Date.now() - startTime;
      
      // Track successful operation (cache miss in this example)
      this.appInsights.trackEvent('AzureRedis:GetCache:Success', {
        key: key,
        hit: 'false',
        durationMs: duration.toString()
      });
      
      this.appInsights.trackMetric('AzureRedis:GetCacheLatency', duration, {
        hit: 'false',
        success: 'true'
      });
      
      // Simulate cache miss
      return {
        data: null
      };
    } catch (error) {
      // Calculate performance metrics for failure case
      const duration = Date.now() - startTime;
      
      // Track the exception
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

  /**
   * Generate authorization header for Cosmos DB REST API
   * @param resourceType Resource type
   * @param resourceLink Resource link
   * @private
   */
  private generateCosmosAuthHeader(resourceType: string, resourceLink: string): string {
    // In a real implementation, we would generate the auth token using crypto
    // For this simplified example, we'll just return a placeholder
    return `type=master&ver=1.0&sig=placeholder-signature`;
  }
}
