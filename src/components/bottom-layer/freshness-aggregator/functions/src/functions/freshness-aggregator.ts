import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { CosmosClient } from "@azure/cosmos";
import { setupAppInsights } from "../monitoring/appinsights";
import { CacheService } from "../services/cache.service";
import { QdfService } from "../services/qdf.service";

// Initialize monitoring
const appInsightsClient = setupAppInsights();

export async function freshnessAggregator(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startTime = Date.now();
  const operationId = context.invocationId;
  let requestBody: any = {};

  try {
    // Log incoming request
    context.log(`Request received: ${request.method} ${request.url}`, {
      operationId,
      query: request.query,
      body: request.body ? 'Body present' : 'No body'
    });

    // Parse request body properly for Azure Functions v4
    try {
      const bodyText = await request.text();
      requestBody = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      context.error('Failed to parse request body:', parseError);
      return {
        status: 400,
        jsonBody: {
          error: "Invalid JSON in request body",
          message: "Request body must be valid JSON"
        }
      };
    }

    // Validate request
    if (!requestBody?.query) {
      return {
        status: 400,
        jsonBody: {
          error: "Query parameter is required",
          message: "Request body must contain a 'query' field"
        }
      };
    }

    const { query, options = {} } = requestBody;
    
    // Track request in Application Insights
    appInsightsClient?.trackEvent({
      name: "FreshnessAggregatorRequest",
      properties: {
        operationId,
        query,
        options: JSON.stringify(options)
      }
    });

    // Initialize Azure services
    const credential = new DefaultAzureCredential();
    const keyVaultUrl = process.env.KEY_VAULT_URL;
    
    if (!keyVaultUrl) {
      throw new Error("KEY_VAULT_URL environment variable is required");
    }

    const secretClient = new SecretClient(keyVaultUrl, credential);
    
    // Get Cosmos DB connection string from Key Vault
    const cosmosConnectionSecret = await secretClient.getSecret("cosmos-connection-string");
    const cosmosConnectionString = cosmosConnectionSecret.value;
    
    if (!cosmosConnectionString) {
      throw new Error("Failed to retrieve Cosmos DB connection string from Key Vault");
    }

    // Initialize Cosmos DB client
    const cosmosClient = new CosmosClient(cosmosConnectionString);
    
    // Initialize services
    const cacheService = new CacheService(cosmosClient);
    const qdfService = new QdfService(cacheService);
    
    // Check cache first
    const cacheKey = `freshness:${query}:${JSON.stringify(options)}`;
    const cachedResult = await cacheService.get(cacheKey);
    
    if (cachedResult) {
      context.log(`Cache hit for query: ${query}`);
      
      // Track cache hit
      appInsightsClient?.trackEvent({
        name: "FreshnessAggregatorCacheHit",
        properties: {
          operationId,
          query,
          cacheKey
        }
      });
      
      return {
        status: 200,
        jsonBody: {
          success: true,
          data: cachedResult,
          cached: true,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    // Perform fresh content aggregation
    context.log(`Performing fresh content aggregation for query: ${query}`);
    
    // This would integrate with the actual FreshnessAggregatorService
    // For now, return a mock response structure
    const mockResult = {
      query,
      items: [],
      totalItems: 0,
      qdfScore: 0.5,
      executionTime: Date.now() - startTime,
      sources: ['mock'],
      timestamp: new Date().toISOString()
    };
    
    // Cache the result
    await cacheService.set(cacheKey, mockResult, 3600); // Cache for 1 hour
    
    // Track successful request
    appInsightsClient?.trackEvent({
      name: "FreshnessAggregatorSuccess",
      properties: {
        operationId,
        query,
        itemCount: mockResult.totalItems.toString(),
        executionTime: mockResult.executionTime.toString()
      }
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        data: mockResult,
        cached: false,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const statusCode = (error as any)?.status || 500;
    
    context.error(`Error in freshness aggregator: ${errorMessage}`, error);
    
    // Track error in Application Insights
    appInsightsClient?.trackException({
      exception: error instanceof Error ? error : new Error(errorMessage),
      properties: {
        operationId,
        query: requestBody?.query || 'unknown',
        statusCode: statusCode.toString(),
        errorDetails: error instanceof Error ? error.stack : undefined
      }
    });

    return {
      status: statusCode,
      jsonBody: {
        success: false,
        error: errorMessage,
        timestamp: new Date().toISOString(),
        operationId
      }
    };
  }
}

// Register the function with Azure Functions v4
app.http('freshnessAggregator', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: freshnessAggregator
});
