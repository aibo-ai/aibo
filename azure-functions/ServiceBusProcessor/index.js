const { CosmosClient } = require("@azure/cosmos");

// Initialize Cosmos client
const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);

module.exports = async function (context, myQueueItem) {
    context.log('Service Bus queue trigger function processed work item', myQueueItem);

    try {
        // Parse the message from Service Bus
        const message = typeof myQueueItem === 'string' ? JSON.parse(myQueueItem) : myQueueItem;
        
        const { 
            type, 
            contentId, 
            data, 
            timestamp = new Date().toISOString(),
            priority = 'normal'
        } = message;

        context.log(`Processing ${type} for content ID: ${contentId}`);

        let result;
        
        // Route to appropriate processing function based on message type
        switch (type) {
            case 'content-generation':
                result = await processContentGeneration(data, context);
                break;
            case 'image-generation':
                result = await processImageGeneration(data, context);
                break;
            case 'audio-generation':
                result = await processAudioGeneration(data, context);
                break;
            case 'seo-analysis':
                result = await processSEOAnalysis(data, context);
                break;
            case 'authority-analysis':
                result = await processAuthorityAnalysis(data, context);
                break;
            default:
                throw new Error(`Unknown processing type: ${type}`);
        }

        // Store result in Cosmos DB
        const outputDocument = {
            id: `${contentId}-${type}-${Date.now()}`,
            contentId: contentId,
            type: type,
            status: 'completed',
            result: result,
            processedAt: new Date().toISOString(),
            originalMessage: message
        };

        context.bindings.outputDocument = outputDocument;
        
        context.log(`Successfully processed ${type} for content ID: ${contentId}`);

    } catch (error) {
        context.log.error(`Error processing Service Bus message: ${error.message}`);
        
        // Store error result
        const errorDocument = {
            id: `error-${Date.now()}`,
            contentId: myQueueItem.contentId || 'unknown',
            type: myQueueItem.type || 'unknown',
            status: 'error',
            error: error.message,
            processedAt: new Date().toISOString(),
            originalMessage: myQueueItem
        };

        context.bindings.outputDocument = errorDocument;
        
        // Re-throw to mark function as failed for retry logic
        throw error;
    }
};

/**
 * Process content generation requests
 */
async function processContentGeneration(data, context) {
    context.log('Processing content generation request');
    
    // This would call the main content generation service
    // For now, return a placeholder result
    return {
        content: "Generated content based on: " + data.query,
        wordCount: 500,
        qualityScore: 85,
        processingTime: Date.now()
    };
}

/**
 * Process image generation requests
 */
async function processImageGeneration(data, context) {
    context.log('Processing image generation request');
    
    return {
        imageUrl: "https://example.com/generated-image.jpg",
        prompt: data.prompt,
        style: data.style || "professional",
        processingTime: Date.now()
    };
}

/**
 * Process audio generation requests
 */
async function processAudioGeneration(data, context) {
    context.log('Processing audio generation request');
    
    return {
        audioUrl: "https://example.com/generated-audio.mp3",
        text: data.text,
        voice: data.voice || "alloy",
        duration: 30,
        processingTime: Date.now()
    };
}

/**
 * Process SEO analysis requests
 */
async function processSEOAnalysis(data, context) {
    context.log('Processing SEO analysis request');
    
    return {
        seoScore: 78,
        keywords: ["AI", "content", "generation"],
        suggestions: ["Add more internal links", "Optimize meta description"],
        processingTime: Date.now()
    };
}

/**
 * Process authority analysis requests
 */
async function processAuthorityAnalysis(data, context) {
    context.log('Processing authority analysis request');
    
    return {
        authorityScore: 82,
        eatScore: 0.85,
        citations: 5,
        suggestions: ["Add author bio", "Include more citations"],
        processingTime: Date.now()
    };
}
