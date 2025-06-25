const { LayeredContentProcessor } = require('../../layered-content-processor');

module.exports = async function (context, req) {
    context.log('🚀 Azure Function: Layered Content Processor started');
    
    try {
        // Validate request
        if (!req.body || !req.body.topic) {
            context.res = {
                status: 400,
                body: {
                    success: false,
                    error: 'Missing required field: topic',
                    timestamp: new Date().toISOString()
                }
            };
            return;
        }

        const startTime = Date.now();
        
        // Initialize the layered content processor
        const processor = new LayeredContentProcessor();
        
        // Process the content request
        context.log('📝 Processing content request:', {
            topic: req.body.topic,
            audience: req.body.audience,
            contentType: req.body.contentType
        });
        
        const result = await processor.processContent(req.body);
        
        const processingTime = Date.now() - startTime;
        context.log(`✅ Content processing completed in ${processingTime}ms`);
        
        // Send to Service Bus for further processing if needed
        if (req.body.enableAsyncProcessing) {
            context.bindings.outputSbMsg = {
                contentId: result.contentId,
                userId: req.body.userId,
                processingType: 'post-processing',
                timestamp: new Date().toISOString(),
                data: {
                    contentId: result.contentId,
                    contentType: req.body.contentType,
                    audience: req.body.audience
                }
            };
            context.log('📤 Sent message to Service Bus for async processing');
        }
        
        // Return successful response
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            body: {
                success: true,
                data: result.data,
                metadata: {
                    ...result.metadata,
                    processingTime: processingTime,
                    processedBy: 'azure-function',
                    functionName: 'LayeredContentProcessor',
                    timestamp: new Date().toISOString()
                },
                layerResults: result.layerResults,
                storageMetadata: result.storageMetadata,
                performanceMetrics: {
                    totalProcessingTime: processingTime,
                    functionExecutionTime: processingTime,
                    memoryUsage: process.memoryUsage(),
                    timestamp: new Date().toISOString()
                }
            }
        };
        
    } catch (error) {
        context.log.error('❌ Error in LayeredContentProcessor:', error);
        
        // Return error response
        context.res = {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: {
                success: false,
                error: error.message,
                errorType: error.name || 'UnknownError',
                timestamp: new Date().toISOString(),
                functionName: 'LayeredContentProcessor',
                requestId: context.invocationId
            }
        };
    }
};
