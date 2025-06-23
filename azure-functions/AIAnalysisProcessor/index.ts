import { InvocationContext } from "@azure/functions";
import { ServiceBusReceivedMessage } from "@azure/service-bus";
import axios from 'axios';

interface AIAnalysisJob {
  jobId: string;
  type: 'competitor_scoring' | 'market_prediction' | 'insight_generation' | 'trend_analysis';
  competitorId?: string;
  timeframe: 'immediate' | 'short-term' | 'long-term';
  parameters: Record<string, any>;
  callbackUrl?: string;
}

interface AIInsight {
  id: string;
  type: 'opportunity' | 'threat' | 'recommendation' | 'prediction';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  timeframe: string;
  data: any;
}

// Service Bus triggered Azure Function for AI analysis
const aiAnalysisProcessor = async function (context: InvocationContext, myQueueItem: ServiceBusReceivedMessage): Promise<void> {
  const startTime = Date.now();
  const functionId = `ai-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  context.log(`[${functionId}] AI analysis processor started`);
  context.log(`[${functionId}] Message received:`, JSON.stringify(myQueueItem, null, 2));

  try {
    // Parse the message
    const message = typeof myQueueItem === 'string' ? JSON.parse(myQueueItem) : myQueueItem;
    const job: AIAnalysisJob = message;

    if (!job.jobId || !job.type) {
      throw new Error('Invalid message format: missing required fields (jobId, type)');
    }

    context.log(`[${functionId}] Processing AI analysis job: ${job.jobId} (${job.type})`);

    // Update job status to processing
    await updateJobStatus(context, job.jobId, 'processing', 'AI analysis started');

    // Process the job based on type
    let result: any;
    switch (job.type) {
      case 'competitor_scoring':
        result = await processCompetitorScoring(context, job, functionId);
        break;
      case 'market_prediction':
        result = await processMarketPrediction(context, job, functionId);
        break;
      case 'insight_generation':
        result = await processInsightGeneration(context, job, functionId);
        break;
      case 'trend_analysis':
        result = await processTrendAnalysis(context, job, functionId);
        break;
      default:
        throw new Error(`Unknown AI analysis type: ${job.type}`);
    }

    const processingTime = Date.now() - startTime;
    context.log(`[${functionId}] AI analysis completed successfully in ${processingTime}ms`);

    // Update job status to completed
    await updateJobStatus(context, job.jobId, 'completed', 'AI analysis completed');

    // Send callback if provided
    if (job.callbackUrl) {
      await sendCallback(context, job.callbackUrl, {
        jobId: job.jobId,
        status: 'completed',
        result,
        completedAt: new Date().toISOString()
      }, functionId);
    }

    // Track success metrics
    await trackMetrics(context, {
      jobId: job.jobId,
      type: job.type,
      status: 'completed',
      processingTime,
      functionId
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    context.log.error(`[${functionId}] AI analysis failed:`, error);

    // Update job status to failed
    const jobId = (myQueueItem as any)?.jobId || 'unknown';
    await updateJobStatus(context, jobId, 'failed', error.message);

    // Send failure callback if provided
    const callbackUrl = (myQueueItem as any)?.callbackUrl;
    if (callbackUrl) {
      await sendCallback(context, callbackUrl, {
        jobId,
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString()
      }, functionId);
    }

    // Track failure metrics
    await trackMetrics(context, {
      jobId,
      type: (myQueueItem as any)?.type || 'unknown',
      status: 'failed',
      error: error.message,
      processingTime,
      functionId
    });

    throw error;
  }
};

/**
 * Process competitor scoring analysis
 */
async function processCompetitorScoring(
  context: Context, 
  job: AIAnalysisJob, 
  functionId: string
): Promise<any> {
  context.log(`[${functionId}] Starting competitor scoring analysis`);

  try {
    // Call AI service for competitor scoring
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    // Gather competitor data
    const competitorData = await gatherCompetitorData(context, job.competitorId);

    // Generate AI-powered scoring
    const prompt = `
    Analyze the following competitor data and provide a comprehensive scoring analysis:
    
    Competitor Data: ${JSON.stringify(competitorData, null, 2)}
    
    Please provide:
    1. Overall competitive score (0-100)
    2. Category scores for: innovation, market position, customer satisfaction, financial health, digital presence
    3. Key strengths and weaknesses
    4. Strategic recommendations
    
    Format the response as JSON.
    `;

    const response = await axios.post(`${aiServiceUrl}/chat/completions`, {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert business analyst specializing in competitive intelligence and market analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const aiAnalysis = JSON.parse(response.data.choices[0].message.content);

    context.log(`[${functionId}] Competitor scoring analysis completed`);
    return {
      competitorId: job.competitorId,
      analysis: aiAnalysis,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    context.log.error(`[${functionId}] Competitor scoring failed:`, error);
    throw error;
  }
}

/**
 * Process market prediction analysis
 */
async function processMarketPrediction(
  context: Context, 
  job: AIAnalysisJob, 
  functionId: string
): Promise<any> {
  context.log(`[${functionId}] Starting market prediction analysis`);

  try {
    // Gather market data
    const marketData = await gatherMarketData(context, job.parameters);

    // Call AI service for market prediction
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
    Based on the following market data, generate predictions for the next ${job.timeframe}:
    
    Market Data: ${JSON.stringify(marketData, null, 2)}
    
    Please provide:
    1. Market size predictions
    2. Growth rate forecasts
    3. Key trend predictions
    4. Risk assessments
    5. Opportunity identification
    
    Format the response as JSON with confidence scores.
    `;

    const response = await axios.post(`${aiServiceUrl}/chat/completions`, {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert market analyst with deep knowledge of business trends and forecasting.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const predictions = JSON.parse(response.data.choices[0].message.content);

    context.log(`[${functionId}] Market prediction analysis completed`);
    return {
      timeframe: job.timeframe,
      predictions,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    context.log.error(`[${functionId}] Market prediction failed:`, error);
    throw error;
  }
}

/**
 * Process insight generation
 */
async function processInsightGeneration(
  context: Context, 
  job: AIAnalysisJob, 
  functionId: string
): Promise<any> {
  context.log(`[${functionId}] Starting insight generation`);

  try {
    // Gather comprehensive data
    const competitorData = await gatherCompetitorData(context, job.competitorId);
    const marketData = await gatherMarketData(context, job.parameters);

    // Generate AI insights
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
    Analyze the following data and generate strategic insights:
    
    Competitor Data: ${JSON.stringify(competitorData, null, 2)}
    Market Data: ${JSON.stringify(marketData, null, 2)}
    
    Generate insights for:
    1. Opportunities (market gaps, competitive advantages)
    2. Threats (competitive risks, market challenges)
    3. Recommendations (strategic actions, tactical moves)
    4. Predictions (future scenarios, trend forecasts)
    
    Each insight should include:
    - Type (opportunity/threat/recommendation/prediction)
    - Title and description
    - Confidence score (0-100)
    - Impact level (low/medium/high)
    - Timeframe for action
    
    Format as JSON array of insights.
    `;

    const response = await axios.post(`${aiServiceUrl}/chat/completions`, {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic business consultant with expertise in competitive intelligence and market strategy.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 3000,
      temperature: 0.4
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const insights = JSON.parse(response.data.choices[0].message.content);

    context.log(`[${functionId}] Insight generation completed`);
    return {
      insights,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    context.log.error(`[${functionId}] Insight generation failed:`, error);
    throw error;
  }
}

/**
 * Process trend analysis
 */
async function processTrendAnalysis(
  context: Context, 
  job: AIAnalysisJob, 
  functionId: string
): Promise<any> {
  context.log(`[${functionId}] Starting trend analysis`);

  try {
    // Gather historical data
    const historicalData = await gatherHistoricalData(context, job.parameters);

    // Perform trend analysis using AI
    const aiServiceUrl = process.env.AI_SERVICE_URL || 'https://api.openai.com/v1';
    const apiKey = process.env.OPENAI_API_KEY;

    const prompt = `
    Analyze the following historical data to identify trends and patterns:
    
    Historical Data: ${JSON.stringify(historicalData, null, 2)}
    
    Provide:
    1. Trend identification (upward, downward, cyclical, seasonal)
    2. Pattern analysis (correlations, anomalies, inflection points)
    3. Trend strength and confidence
    4. Future trend projections
    5. Key drivers and influencing factors
    
    Format as JSON with detailed trend analysis.
    `;

    const response = await axios.post(`${aiServiceUrl}/chat/completions`, {
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a data scientist specializing in trend analysis and pattern recognition.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.2
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    });

    const trendAnalysis = JSON.parse(response.data.choices[0].message.content);

    context.log(`[${functionId}] Trend analysis completed`);
    return {
      analysis: trendAnalysis,
      generatedAt: new Date().toISOString()
    };

  } catch (error) {
    context.log.error(`[${functionId}] Trend analysis failed:`, error);
    throw error;
  }
}

/**
 * Gather competitor data
 */
async function gatherCompetitorData(context: Context, competitorId?: string): Promise<any> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.get(`${apiBaseUrl}/internal/competitors/${competitorId}/data`, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    context.log.error('Failed to gather competitor data:', error.message);
    return {};
  }
}

/**
 * Gather market data
 */
async function gatherMarketData(context: Context, parameters: any): Promise<any> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/market/data`, parameters, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 15000
    });

    return response.data;
  } catch (error) {
    context.log.error('Failed to gather market data:', error.message);
    return {};
  }
}

/**
 * Gather historical data
 */
async function gatherHistoricalData(context: Context, parameters: any): Promise<any> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/analytics/historical`, parameters, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 20000
    });

    return response.data;
  } catch (error) {
    context.log.error('Failed to gather historical data:', error.message);
    return {};
  }
}

/**
 * Update job status
 */
async function updateJobStatus(
  context: Context, 
  jobId: string, 
  status: string, 
  message?: string
): Promise<void> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    await axios.patch(`${apiBaseUrl}/internal/jobs/${jobId}/status`, {
      status,
      message,
      updatedBy: 'ai-analysis-function'
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 10000
    });

    context.log(`Job status updated: ${jobId} -> ${status}`);
  } catch (error) {
    context.log.error(`Failed to update job status for ${jobId}:`, error.message);
  }
}

/**
 * Send callback notification
 */
async function sendCallback(
  context: Context, 
  callbackUrl: string, 
  data: any, 
  functionId: string
): Promise<void> {
  try {
    await axios.post(callbackUrl, data, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ContentArchitect-AIAnalysis/1.0'
      },
      timeout: 30000
    });

    context.log(`[${functionId}] Callback sent successfully`);
  } catch (error) {
    context.log.error(`[${functionId}] Callback failed:`, error.message);
  }
}

/**
 * Track metrics
 */
async function trackMetrics(context: Context, metrics: any): Promise<void> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    await axios.post(`${apiBaseUrl}/internal/metrics/track`, {
      ...metrics,
      source: 'ai-analysis-function',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 5000
    });

    context.log('AI analysis metrics tracked successfully');
  } catch (error) {
    context.log.error('Failed to track AI analysis metrics:', error.message);
  }
}

export default aiAnalysisProcessor;
