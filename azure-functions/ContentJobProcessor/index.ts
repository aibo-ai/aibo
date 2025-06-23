import { InvocationContext } from "@azure/functions";
import { ServiceBusReceivedMessage } from "@azure/service-bus";
import axios from 'axios';

// Azure Function triggered by Service Bus messages
const serviceBusQueueTrigger = async function (context: InvocationContext, myQueueItem: ServiceBusReceivedMessage): Promise<void> {
    const startTime = Date.now();
    const functionId = `func-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    context.log(`[${functionId}] Content job processor started`);
    context.log(`[${functionId}] Message received:`, JSON.stringify(myQueueItem, null, 2));

    try {
        // Parse the message
        const message = typeof myQueueItem === 'string' ? JSON.parse(myQueueItem) : myQueueItem;
        const { jobId, type, request } = message;

        if (!jobId || !type || !request) {
            throw new Error('Invalid message format: missing required fields (jobId, type, request)');
        }

        context.log(`[${functionId}] Processing job: ${jobId} (${type})`);

        // Initialize orchestration service
        const orchestrationService = await initializeOrchestrationService(context);

        // Process the job based on type
        switch (type) {
            case 'content_generation':
                await processContentGenerationJob(context, orchestrationService, message, functionId);
                break;
            
            case 'citation_verification':
                await processCitationVerificationJob(context, orchestrationService, message, functionId);
                break;
            
            case 'research_generation':
                await processResearchGenerationJob(context, orchestrationService, message, functionId);
                break;
            
            default:
                throw new Error(`Unknown job type: ${type}`);
        }

        const processingTime = Date.now() - startTime;
        context.log(`[${functionId}] Job completed successfully in ${processingTime}ms`);

        // Track success metrics
        await trackMetrics(context, {
            jobId,
            type,
            status: 'completed',
            processingTime,
            functionId
        });

    } catch (error) {
        const processingTime = Date.now() - startTime;
        context.log.error(`[${functionId}] Job processing failed:`, error);

        // Track failure metrics
        await trackMetrics(context, {
            jobId: (myQueueItem as any)?.jobId || 'unknown',
            type: (myQueueItem as any)?.type || 'unknown',
            status: 'failed',
            error: error.message,
            processingTime,
            functionId
        });

        // Re-throw to trigger retry mechanism
        throw error;
    }
};

/**
 * Process content generation job
 */
async function processContentGenerationJob(
    context: Context, 
    orchestrationService: any, 
    message: any, 
    functionId: string
): Promise<void> {
    const { jobId, request } = message;
    
    context.log(`[${functionId}] Starting content generation for job: ${jobId}`);

    try {
        // Update job status to processing
        await updateJobStatus(context, jobId, 'processing', 'Content generation started');

        // Execute the orchestration workflow
        const result = await orchestrationService.processContentGenerationJob(message);

        context.log(`[${functionId}] Content generation completed for job: ${jobId}`);

        // Send callback if provided
        if (request.callbackUrl) {
            await sendCallback(context, request.callbackUrl, {
                jobId,
                status: 'completed',
                result,
                completedAt: new Date().toISOString()
            }, functionId);
        }

    } catch (error) {
        context.log.error(`[${functionId}] Content generation failed for job: ${jobId}`, error);
        
        // Update job status to failed
        await updateJobStatus(context, jobId, 'failed', error.message);

        // Send failure callback if provided
        if (request.callbackUrl) {
            await sendCallback(context, request.callbackUrl, {
                jobId,
                status: 'failed',
                error: error.message,
                failedAt: new Date().toISOString()
            }, functionId);
        }

        throw error;
    }
}

/**
 * Process citation verification job
 */
async function processCitationVerificationJob(
    context: Context, 
    orchestrationService: any, 
    message: any, 
    functionId: string
): Promise<void> {
    const { jobId, request } = message;
    
    context.log(`[${functionId}] Starting citation verification for job: ${jobId}`);

    try {
        await updateJobStatus(context, jobId, 'processing', 'Citation verification started');

        // Call citation verification service
        const result = await orchestrationService.processCitationVerificationJob(message);

        context.log(`[${functionId}] Citation verification completed for job: ${jobId}`);

        if (request.callbackUrl) {
            await sendCallback(context, request.callbackUrl, {
                jobId,
                status: 'completed',
                result,
                completedAt: new Date().toISOString()
            }, functionId);
        }

    } catch (error) {
        context.log.error(`[${functionId}] Citation verification failed for job: ${jobId}`, error);
        
        await updateJobStatus(context, jobId, 'failed', error.message);

        if (request.callbackUrl) {
            await sendCallback(context, request.callbackUrl, {
                jobId,
                status: 'failed',
                error: error.message,
                failedAt: new Date().toISOString()
            }, functionId);
        }

        throw error;
    }
}

/**
 * Process research generation job
 */
async function processResearchGenerationJob(
    context: Context, 
    orchestrationService: any, 
    message: any, 
    functionId: string
): Promise<void> {
    const { jobId, request } = message;
    
    context.log(`[${functionId}] Starting research generation for job: ${jobId}`);

    try {
        await updateJobStatus(context, jobId, 'processing', 'Research generation started');

        // Call research generation service
        const result = await orchestrationService.processResearchGenerationJob(message);

        context.log(`[${functionId}] Research generation completed for job: ${jobId}`);

        if (request.callbackUrl) {
            await sendCallback(context, request.callbackUrl, {
                jobId,
                status: 'completed',
                result,
                completedAt: new Date().toISOString()
            }, functionId);
        }

    } catch (error) {
        context.log.error(`[${functionId}] Research generation failed for job: ${jobId}`, error);
        
        await updateJobStatus(context, jobId, 'failed', error.message);

        if (request.callbackUrl) {
            await sendCallback(context, request.callbackUrl, {
                jobId,
                status: 'failed',
                error: error.message,
                failedAt: new Date().toISOString()
            }, functionId);
        }

        throw error;
    }
}

/**
 * Initialize orchestration service
 */
async function initializeOrchestrationService(context: Context): Promise<any> {
    // In a real implementation, this would initialize the NestJS application context
    // or create a lightweight version of the orchestration service
    
    const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3000';
    
    return {
        async processContentGenerationJob(message: any) {
            context.log('Calling orchestration service for content generation');
            
            // Make HTTP call to the main application's orchestration service
            const response = await axios.post(`${apiBaseUrl}/internal/orchestration/process-job`, {
                message,
                source: 'azure-function'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
                },
                timeout: 300000 // 5 minutes timeout
            });
            
            return response.data;
        },

        async processCitationVerificationJob(message: any) {
            context.log('Calling orchestration service for citation verification');
            
            const response = await axios.post(`${apiBaseUrl}/internal/citation/process-job`, {
                message,
                source: 'azure-function'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
                },
                timeout: 180000 // 3 minutes timeout
            });
            
            return response.data;
        },

        async processResearchGenerationJob(message: any) {
            context.log('Calling orchestration service for research generation');
            
            const response = await axios.post(`${apiBaseUrl}/internal/research/process-job`, {
                message,
                source: 'azure-function'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
                },
                timeout: 240000 // 4 minutes timeout
            });
            
            return response.data;
        }
    };
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
        const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3000';
        
        await axios.patch(`${apiBaseUrl}/internal/jobs/${jobId}/status`, {
            status,
            message,
            updatedBy: 'azure-function'
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
            },
            timeout: 10000
        });

        context.log(`Job status updated: ${jobId} -> ${status}`);
    } catch (error) {
        context.log.error(`Failed to update job status for ${jobId}:`, error.message);
        // Don't throw here as this is not critical for job processing
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
        context.log(`[${functionId}] Sending callback to: ${callbackUrl}`);
        
        await axios.post(callbackUrl, data, {
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'ContentArchitect-AzureFunction/1.0'
            },
            timeout: 30000
        });

        context.log(`[${functionId}] Callback sent successfully`);
    } catch (error) {
        context.log.error(`[${functionId}] Callback failed:`, error.message);
        // Don't throw here as callback failure shouldn't fail the job
    }
}

/**
 * Track metrics and telemetry
 */
async function trackMetrics(context: Context, metrics: any): Promise<void> {
    try {
        // Send metrics to Application Insights or monitoring service
        const apiBaseUrl = process.env.CONTENT_ARCHITECT_API_URL || 'http://localhost:3000';
        
        await axios.post(`${apiBaseUrl}/internal/metrics/track`, {
            ...metrics,
            source: 'azure-function',
            timestamp: new Date().toISOString()
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.INTERNAL_API_TOKEN}`
            },
            timeout: 5000
        });

        context.log('Metrics tracked successfully');
    } catch (error) {
        context.log.error('Failed to track metrics:', error.message);
        // Don't throw here as metrics tracking failure shouldn't fail the job
    }
}

export default serviceBusQueueTrigger;
