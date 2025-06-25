module.exports = async function (context, documents) {
    context.log('Cosmos DB trigger function processed', documents.length, 'documents');

    if (!!documents && documents.length > 0) {
        for (const document of documents) {
            context.log('Processing document:', document.id);

            try {
                // Determine the type of processing needed based on document structure
                const processingType = determineProcessingType(document);
                
                if (processingType) {
                    // Create message for Service Bus queue
                    const message = {
                        type: processingType,
                        contentId: document.id,
                        data: document,
                        timestamp: new Date().toISOString(),
                        priority: document.priority || 'normal'
                    };

                    // Send to Service Bus queue for async processing
                    context.bindings.outputSbQueue = message;
                    
                    context.log(`Queued ${processingType} processing for document ${document.id}`);
                } else {
                    context.log(`No processing needed for document ${document.id}`);
                }

            } catch (error) {
                context.log.error(`Error processing document ${document.id}: ${error.message}`);
            }
        }
    }
};

/**
 * Determine what type of processing is needed based on document structure
 */
function determineProcessingType(document) {
    // Check document properties to determine processing type
    
    if (document.requestType) {
        return document.requestType;
    }
    
    if (document.query && !document.content) {
        return 'content-generation';
    }
    
    if (document.imagePrompt && !document.imageUrl) {
        return 'image-generation';
    }
    
    if (document.textToSpeech && !document.audioUrl) {
        return 'audio-generation';
    }
    
    if (document.content && !document.seoAnalysis) {
        return 'seo-analysis';
    }
    
    if (document.content && !document.authorityAnalysis) {
        return 'authority-analysis';
    }
    
    // No processing needed
    return null;
}
