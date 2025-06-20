import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { ConfigService } from '@nestjs/config';

// Define interfaces locally to avoid import path issues
interface FreshnessSearchParameters {
  query: string;
  limit?: number;
  sortBy?: 'freshness' | 'relevance' | 'mixed';
  contentTypes?: string[];
  language?: string;
  region?: string;
  skipCache?: boolean;
  timeframe?: {
    startDate?: Date;
    endDate?: Date;
  };
}

/**
 * Azure Function to aggregate fresh content from multiple sources
 * This function is triggered by an HTTP request and returns aggregated content
 * with freshness scores based on the Query Deserves Freshness (QDF) algorithm.
 */
export async function aggregateFreshContent(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startTime = Date.now();
  
  try {
    context.log('Freshness Aggregator Function triggered');
    
    let requestBody: any = {};
    
    // Parse request body for Azure Functions v4
    try {
      const bodyText = await request.text();
      requestBody = bodyText ? JSON.parse(bodyText) : {};
    } catch (parseError) {
      context.error('Failed to parse request body:', parseError);
      return {
        status: 400,
        jsonBody: {
          error: "Invalid JSON in request body"
        }
      };
    }

    // Extract search parameters from query string and request body
    const searchParams: FreshnessSearchParameters = {
      query: request.query.get('query') || requestBody?.query,
      limit: parseInt(request.query.get('limit') || requestBody?.limit || '20'),
      sortBy: request.query.get('sortBy') as any || requestBody?.sortBy || 'mixed',
      contentTypes: request.query.get('contentTypes')?.split(',') || requestBody?.contentTypes,
      language: request.query.get('language') || requestBody?.language || 'en',
      region: request.query.get('region') || requestBody?.region,
      skipCache: request.query.get('skipCache') === 'true' || requestBody?.skipCache === true,
      timeframe: {
        startDate: request.query.get('startDate') ? new Date(request.query.get('startDate')!) :
                  (requestBody?.startDate ? new Date(requestBody.startDate) : undefined),
        endDate: request.query.get('endDate') ? new Date(request.query.get('endDate')!) :
                (requestBody?.endDate ? new Date(requestBody.endDate) : undefined)
      }
    };
    
    // Validate required parameters
    if (!searchParams.query) {
      return {
        status: 400,
        jsonBody: {
          error: 'Missing required parameter: query',
          status: 400
        }
      };
    }

    // Mock ConfigService for Azure Functions environment
    const mockConfigService = {
      get: (key: string) => process.env[key]
    } as ConfigService;

    // Initialize the service
    const freshnessService = new (require('../services/freshness-aggregator.service').FreshnessAggregatorService)(mockConfigService);

    // Aggregate fresh content
    const result = await freshnessService.aggregateFreshContent(searchParams);
    
    // Return results
    return {
      status: 200,
      jsonBody: {
        data: result,
        executionTime: Date.now() - startTime
      }
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    context.error('Error in Freshness Aggregator:', error);
    
    // Return error response
    return {
      status: 500,
      jsonBody: {
        error: 'Error aggregating fresh content',
        message: errorMessage,
        status: 500
      }
    };
  }
}

app.http('aggregateFreshContent', {
  methods: ['GET', 'POST'],
  authLevel: 'function',
  handler: aggregateFreshContent
});
