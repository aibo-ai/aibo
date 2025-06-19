import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { FreshnessAggregatorService } from '../services/freshness-aggregator.service';
import { FreshnessSearchParameters, FreshnessAggregatorResponse } from '../models/content-models';
import { ConfigService } from '@nestjs/config';

/**
 * Azure Function to aggregate fresh content from multiple sources
 * This function is triggered by an HTTP request and returns aggregated content
 * with freshness scores based on the Query Deserves Freshness (QDF) algorithm.
 */
const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
  const startTime = Date.now();
  context.log('Freshness Aggregator Function triggered');
  
  try {
    // Initialize services
    const configService = new ConfigService();
    const freshnessAggregator = new FreshnessAggregatorService(configService);
    
    // Extract search parameters from request
    const searchParams: FreshnessSearchParameters = {
      query: req.query.query || req.body?.query,
      limit: req.query.limit ? parseInt(req.query.limit) : (req.body?.limit || 20),
      sortBy: req.query.sortBy || req.body?.sortBy || 'mixed',
      contentTypes: req.query.contentTypes?.split(',') || req.body?.contentTypes,
      language: req.query.language || req.body?.language || 'en',
      region: req.query.region || req.body?.region,
      skipCache: req.query.skipCache === 'true' || req.body?.skipCache === true,
      timeframe: {
        startDate: req.query.startDate ? new Date(req.query.startDate) : 
                  (req.body?.startDate ? new Date(req.body.startDate) : undefined),
        endDate: req.query.endDate ? new Date(req.query.endDate) : 
                (req.body?.endDate ? new Date(req.body.endDate) : undefined)
      }
    };
    
    // Validate required parameters
    if (!searchParams.query) {
      context.res = {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          error: 'Missing required parameter: query',
          status: 400
        }
      };
      return;
    }
    
    // Aggregate fresh content
    const result = await freshnessAggregator.aggregateFreshContent(searchParams);
    
    // Return results
    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: {
        data: result,
        executionTime: Date.now() - startTime
      }
    };
  } catch (error) {
    context.log.error(`Error in Freshness Aggregator: ${error.message}`);
    context.log.error(error);
    
    // Return error response
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: {
        error: 'Error aggregating fresh content',
        message: error.message,
        status: 500
      }
    };
  }
};

export default httpTrigger;
