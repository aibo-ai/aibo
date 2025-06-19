import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { CosmosClient } from "@azure/cosmos";
import { setupAppInsights } from "../monitoring/appinsights";
import { CacheService } from "../services/cache.service";
import { QdfService } from "../services/qdf.service";

// Initialize monitoring
const appInsightsClient = setupAppInsights();

const httpTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest
): Promise<void> {
  const startTime = Date.now();
  const operationId = context.invocationId;

  try {
    // Log incoming request
    context.log(`Request received: ${req.method} ${req.url}`, {
      operationId,
      query: req.query,
      body: req.body ? 'Body present' : 'No body'
    });

    // Validate request
    if (!req.body?.query) {
      throw {
        status: 400,
        message: "Query parameter is required"
      };
    }

    const { query, options = {} } = req.body;
    
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
      throw new Error("KEY_VAULT_URL environment variable is not set");
    }

    // Get secrets from Key Vault
    const secretClient = new SecretClient(keyVaultUrl, credential);
    const cosmosConnectionString = await secretClient.getSecret("cosmos-db-connection");
    
    // Initialize Cosmos DB client
    const cosmosClient = new CosmosClient(cosmosConnectionString.value);
    
    // Initialize services
    const cacheService = new CacheService(cosmosClient, "freshness-aggregator", "cache");
    const qdfService = new QdfService(cacheService);
    
    // Process the query
    const results = await qdfService.processQuery(query, options);

    // Log success
    const duration = Date.now() - startTime;
    context.log(`Query processed in ${duration}ms`, { 
      operationId,
      query,
      resultCount: results?.length || 0
    });
    
    // Track success in Application Insights
    appInsightsClient?.trackMetric({
      name: "QueryDuration",
      value: duration,
      properties: {
        operationId,
        query,
        resultCount: results?.length || 0
      }
    });

    // Return successful response
    context.res = {
      status: 200,
      body: {
        query,
        results,
        metadata: {
          processedAt: new Date().toISOString(),
          durationMs: duration
        }
      }
    };
  } catch (error) {
    // Log error
    const errorMessage = error.message || "Unknown error";
    const statusCode = error.status || 500;
    
    context.log.error(`Error processing request: ${errorMessage}`, {
      operationId,
      error: error.stack,
      statusCode
    });
    
    // Track error in Application Insights
    appInsightsClient?.trackException({
      exception: new Error(errorMessage),
      properties: {
        operationId,
        query: req.body?.query,
        statusCode,
        errorDetails: error.stack
      }
    });

    // Return error response
    context.res = {
      status: statusCode,
      body: {
        error: "Failed to process query",
        message: errorMessage,
        operationId,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    };
  }
};

export default httpTrigger;
