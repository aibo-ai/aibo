import { InvocationContext } from "@azure/functions";
import axios from 'axios';

interface CompetitorMonitoringJob {
  jobId: string;
  competitorId: string;
  monitoringType: 'price' | 'product' | 'social' | 'news' | 'ranking';
  config: {
    frequency: 'realtime' | 'hourly' | 'daily';
    thresholds: Record<string, number>;
    notifications: {
      email: boolean;
      webhook: boolean;
      sms: boolean;
    };
  };
  callbackUrl?: string;
}

interface MonitoringAlert {
  id: string;
  competitorId: string;
  type: 'price_change' | 'new_product' | 'social_mention' | 'news' | 'ranking_change';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  data: any;
  timestamp: string;
  actionRequired: boolean;
}

// Timer-triggered Azure Function for competitor monitoring
const competitorMonitoringTimer = async function (context: InvocationContext, myTimer: any): Promise<void> {
  const startTime = Date.now();
  const functionId = `monitor-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  
  context.log(`[${functionId}] Competitor monitoring started`);

  try {
    // Get active monitoring jobs
    const monitoringJobs = await getActiveMonitoringJobs(context);
    context.log(`[${functionId}] Found ${monitoringJobs.length} active monitoring jobs`);

    // Process each monitoring job
    const results = await Promise.allSettled(
      monitoringJobs.map(job => processMonitoringJob(context, job, functionId))
    );

    // Count successes and failures
    const successes = results.filter(r => r.status === 'fulfilled').length;
    const failures = results.filter(r => r.status === 'rejected').length;

    const processingTime = Date.now() - startTime;
    context.log(`[${functionId}] Monitoring completed: ${successes} successful, ${failures} failed in ${processingTime}ms`);

    // Track metrics
    await trackMonitoringMetrics(context, {
      functionId,
      totalJobs: monitoringJobs.length,
      successes,
      failures,
      processingTime
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    context.log.error(`[${functionId}] Monitoring failed:`, error);

    await trackMonitoringMetrics(context, {
      functionId,
      status: 'failed',
      error: error.message,
      processingTime
    });

    throw error;
  }
};

/**
 * Get active monitoring jobs from the database
 */
async function getActiveMonitoringJobs(context: Context): Promise<CompetitorMonitoringJob[]> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.get(`${apiBaseUrl}/internal/monitoring/active-jobs`, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 10000
    });

    return response.data.jobs || [];
  } catch (error) {
    context.log.error('Failed to get active monitoring jobs:', error.message);
    return [];
  }
}

/**
 * Process a single monitoring job
 */
async function processMonitoringJob(
  context: Context, 
  job: CompetitorMonitoringJob, 
  functionId: string
): Promise<void> {
  context.log(`[${functionId}] Processing monitoring job: ${job.jobId} (${job.monitoringType})`);

  try {
    let alerts: MonitoringAlert[] = [];

    // Process based on monitoring type
    switch (job.monitoringType) {
      case 'price':
        alerts = await monitorPriceChanges(context, job, functionId);
        break;
      case 'product':
        alerts = await monitorProductChanges(context, job, functionId);
        break;
      case 'social':
        alerts = await monitorSocialMentions(context, job, functionId);
        break;
      case 'news':
        alerts = await monitorNewsUpdates(context, job, functionId);
        break;
      case 'ranking':
        alerts = await monitorRankingChanges(context, job, functionId);
        break;
      default:
        throw new Error(`Unknown monitoring type: ${job.monitoringType}`);
    }

    // Process alerts
    if (alerts.length > 0) {
      context.log(`[${functionId}] Generated ${alerts.length} alerts for job ${job.jobId}`);
      
      // Save alerts to database
      await saveAlerts(context, alerts);
      
      // Send notifications
      await sendNotifications(context, job, alerts, functionId);
      
      // Send callback if configured
      if (job.callbackUrl) {
        await sendCallback(context, job.callbackUrl, {
          jobId: job.jobId,
          alerts,
          timestamp: new Date().toISOString()
        }, functionId);
      }
    }

    context.log(`[${functionId}] Monitoring job completed: ${job.jobId}`);

  } catch (error) {
    context.log.error(`[${functionId}] Monitoring job failed: ${job.jobId}`, error);
    throw error;
  }
}

/**
 * Monitor price changes
 */
async function monitorPriceChanges(
  context: Context, 
  job: CompetitorMonitoringJob, 
  functionId: string
): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];
  
  try {
    // Call price monitoring service
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/monitoring/price-check`, {
      competitorId: job.competitorId,
      thresholds: job.config.thresholds
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 30000
    });

    const priceChanges = response.data.changes || [];
    
    for (const change of priceChanges) {
      if (Math.abs(change.percentageChange) >= (job.config.thresholds.priceChange || 5)) {
        alerts.push({
          id: `price-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          competitorId: job.competitorId,
          type: 'price_change',
          severity: Math.abs(change.percentageChange) >= 15 ? 'critical' : 'warning',
          title: 'Price Change Detected',
          description: `${change.productName} price changed by ${change.percentageChange.toFixed(1)}%`,
          data: change,
          timestamp: new Date().toISOString(),
          actionRequired: Math.abs(change.percentageChange) >= 10
        });
      }
    }

  } catch (error) {
    context.log.error(`[${functionId}] Price monitoring failed:`, error.message);
  }

  return alerts;
}

/**
 * Monitor product changes
 */
async function monitorProductChanges(
  context: Context, 
  job: CompetitorMonitoringJob, 
  functionId: string
): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];
  
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/monitoring/product-check`, {
      competitorId: job.competitorId
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 30000
    });

    const newProducts = response.data.newProducts || [];
    
    for (const product of newProducts) {
      alerts.push({
        id: `product-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        competitorId: job.competitorId,
        type: 'new_product',
        severity: 'info',
        title: 'New Product Detected',
        description: `New product launched: ${product.name}`,
        data: product,
        timestamp: new Date().toISOString(),
        actionRequired: false
      });
    }

  } catch (error) {
    context.log.error(`[${functionId}] Product monitoring failed:`, error.message);
  }

  return alerts;
}

/**
 * Monitor social mentions
 */
async function monitorSocialMentions(
  context: Context, 
  job: CompetitorMonitoringJob, 
  functionId: string
): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];
  
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/monitoring/social-check`, {
      competitorId: job.competitorId,
      thresholds: job.config.thresholds
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 30000
    });

    const socialData = response.data;
    
    if (socialData.mentionSpike && socialData.mentionCount >= (job.config.thresholds.socialMentions || 100)) {
      alerts.push({
        id: `social-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        competitorId: job.competitorId,
        type: 'social_mention',
        severity: socialData.sentiment === 'negative' ? 'critical' : 'info',
        title: 'Social Media Activity Spike',
        description: `${socialData.mentionCount} mentions detected with ${socialData.sentiment} sentiment`,
        data: socialData,
        timestamp: new Date().toISOString(),
        actionRequired: socialData.sentiment === 'negative'
      });
    }

  } catch (error) {
    context.log.error(`[${functionId}] Social monitoring failed:`, error.message);
  }

  return alerts;
}

/**
 * Monitor news updates
 */
async function monitorNewsUpdates(
  context: Context, 
  job: CompetitorMonitoringJob, 
  functionId: string
): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];
  
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/monitoring/news-check`, {
      competitorId: job.competitorId
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 30000
    });

    const newsItems = response.data.newsItems || [];
    
    for (const news of newsItems) {
      alerts.push({
        id: `news-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        competitorId: job.competitorId,
        type: 'news',
        severity: news.sentiment === 'negative' ? 'warning' : 'info',
        title: 'News Coverage Detected',
        description: news.title,
        data: news,
        timestamp: new Date().toISOString(),
        actionRequired: news.sentiment === 'negative'
      });
    }

  } catch (error) {
    context.log.error(`[${functionId}] News monitoring failed:`, error.message);
  }

  return alerts;
}

/**
 * Monitor ranking changes
 */
async function monitorRankingChanges(
  context: Context, 
  job: CompetitorMonitoringJob, 
  functionId: string
): Promise<MonitoringAlert[]> {
  const alerts: MonitoringAlert[] = [];
  
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    const response = await axios.post(`${apiBaseUrl}/internal/monitoring/ranking-check`, {
      competitorId: job.competitorId,
      thresholds: job.config.thresholds
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 30000
    });

    const rankingChanges = response.data.changes || [];
    
    for (const change of rankingChanges) {
      if (Math.abs(change.positionChange) >= (job.config.thresholds.rankingChange || 3)) {
        alerts.push({
          id: `ranking-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          competitorId: job.competitorId,
          type: 'ranking_change',
          severity: Math.abs(change.positionChange) >= 5 ? 'warning' : 'info',
          title: 'Search Ranking Change',
          description: `Ranking changed by ${change.positionChange} positions for "${change.keyword}"`,
          data: change,
          timestamp: new Date().toISOString(),
          actionRequired: change.positionChange < -3
        });
      }
    }

  } catch (error) {
    context.log.error(`[${functionId}] Ranking monitoring failed:`, error.message);
  }

  return alerts;
}

/**
 * Save alerts to database
 */
async function saveAlerts(context: Context, alerts: MonitoringAlert[]): Promise<void> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    await axios.post(`${apiBaseUrl}/internal/monitoring/alerts`, {
      alerts
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 10000
    });

    context.log(`Saved ${alerts.length} alerts to database`);
  } catch (error) {
    context.log.error('Failed to save alerts:', error.message);
  }
}

/**
 * Send notifications
 */
async function sendNotifications(
  context: Context, 
  job: CompetitorMonitoringJob, 
  alerts: MonitoringAlert[], 
  functionId: string
): Promise<void> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    await axios.post(`${apiBaseUrl}/internal/notifications/send`, {
      jobId: job.jobId,
      alerts,
      config: job.config.notifications
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 15000
    });

    context.log(`[${functionId}] Notifications sent for ${alerts.length} alerts`);
  } catch (error) {
    context.log.error(`[${functionId}] Failed to send notifications:`, error.message);
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
        'User-Agent': 'ContentArchitect-CompetitorMonitoring/1.0'
      },
      timeout: 30000
    });

    context.log(`[${functionId}] Callback sent successfully`);
  } catch (error) {
    context.log.error(`[${functionId}] Callback failed:`, error.message);
  }
}

/**
 * Track monitoring metrics
 */
async function trackMonitoringMetrics(context: Context, metrics: any): Promise<void> {
  try {
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3001';
    
    await axios.post(`${apiBaseUrl}/internal/metrics/track`, {
      ...metrics,
      source: 'competitor-monitoring-function',
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
      },
      timeout: 5000
    });

    context.log('Monitoring metrics tracked successfully');
  } catch (error) {
    context.log.error('Failed to track monitoring metrics:', error.message);
  }
}

export default competitorMonitoringTimer;
