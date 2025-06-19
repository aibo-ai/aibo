const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, req) {
    context.log('Content Chunker function triggered.');

    if (!req.body || !req.body.content || !req.body.chunkingStrategy) {
        context.res = {
            status: 400,
            body: "Please provide content and chunking strategy in the request body"
        };
        return;
    }

    try {
        const { content, chunkingStrategy, maxChunkSize = 1000, overlap = 100 } = req.body;
        
        // Initialize the Text Analytics client for NLP support
        const textAnalyticsClient = new TextAnalyticsClient(
            process.env.AZURE_COG_SERVICES_ENDPOINT,
            new AzureKeyCredential(process.env.AZURE_COG_SERVICES_KEY)
        );

        // Initialize Cosmos DB client for storing chunks
        const cosmosClient = new CosmosClient({
            endpoint: process.env.COSMOS_DB_ENDPOINT,
            key: process.env.COSMOS_DB_KEY
        });
        const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
        const container = database.container("contentChunks");
        
        // Set contentId to track related chunks 
        const contentId = req.body.contentId || `chunk-${Date.now()}`;
        
        let chunks = [];
        
        // Perform chunking based on specified strategy
        switch (chunkingStrategy) {
            case 'paragraph':
                // Split by paragraphs (double newline)
                chunks = chunkByParagraph(content, maxChunkSize, overlap);
                break;
                
            case 'semantic':
                // Use Azure Cognitive Services to detect sentence boundaries
                // and create chunks based on semantic units
                chunks = await chunkBySemantic(content, textAnalyticsClient, maxChunkSize, overlap);
                break;
                
            case 'fixed':
                // Fixed chunk size with overlap
                chunks = chunkByFixedSize(content, maxChunkSize, overlap);
                break;
                
            case 'heading':
                // Split by headings (using markdown or html heading tags)
                chunks = chunkByHeadings(content, maxChunkSize, overlap);
                break;
                
            default:
                // Default to paragraph-based chunking
                chunks = chunkByParagraph(content, maxChunkSize, overlap);
        }
        
        // Enrich chunks with NLP metadata
        const enrichedChunks = await enrichChunks(chunks, textAnalyticsClient);
        
        // Store chunks in Cosmos DB
        const batchOperations = enrichedChunks.map((chunk, index) => ({
            operationType: "Create",
            resourceBody: {
                id: `${contentId}-${index}`,
                contentId: contentId,
                chunkIndex: index,
                text: chunk.text,
                keyPhrases: chunk.keyPhrases,
                entities: chunk.entities,
                chunkStrategy: chunkingStrategy,
                timestamp: new Date().toISOString()
            }
        }));
        
        if (batchOperations.length > 0) {
            // Split into batches of 100 (Cosmos DB limitation)
            for (let i = 0; i < batchOperations.length; i += 100) {
                const batch = batchOperations.slice(i, i + 100);
                await container.items.batch(batch);
            }
        }
        
        context.res = {
            status: 200,
            body: {
                contentId: contentId,
                totalChunks: chunks.length,
                chunkStrategy: chunkingStrategy,
                chunks: enrichedChunks.map(chunk => ({
                    text: chunk.text.substring(0, 100) + "...", // Preview only
                    keyPhrases: chunk.keyPhrases,
                    entities: chunk.entities
                }))
            }
        };
        
    } catch (error) {
        context.log.error(`Error in Content Chunker: ${error.message}`);
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};

function chunkByParagraph(text, maxSize, overlap) {
    const paragraphs = text.split(/\n\s*\n/);
    return combineChunks(paragraphs, maxSize, overlap);
}

function chunkByFixedSize(text, maxSize, overlap) {
    const chunks = [];
    let startIdx = 0;
    
    while (startIdx < text.length) {
        const endIdx = Math.min(startIdx + maxSize, text.length);
        chunks.push(text.substring(startIdx, endIdx));
        startIdx = endIdx - overlap;
    }
    
    return chunks;
}

function chunkByHeadings(text, maxSize, overlap) {
    // Match markdown headings (e.g., # Heading) or HTML headings (<h1>Heading</h1>)
    const headingRegex = /(?:^|\n)(?:#{1,6}\s+[^\n]+|\<h[1-6][^>]*\>[^<]+\<\/h[1-6]\>)/g;
    const sections = text.split(headingRegex);
    const headings = text.match(headingRegex) || [];
    
    const contentWithHeadings = [];
    
    // Combine each heading with its content
    headings.forEach((heading, i) => {
        if (sections[i + 1]) {
            contentWithHeadings.push(heading + sections[i + 1]);
        }
    });
    
    // If there's content before the first heading
    if (sections[0].trim()) {
        contentWithHeadings.unshift(sections[0]);
    }
    
    return combineChunks(contentWithHeadings, maxSize, overlap);
}

async function chunkBySemantic(text, textAnalyticsClient, maxSize, overlap) {
    // Use Azure Cognitive Services to split text at semantically meaningful boundaries
    try {
        // First, use sentence detection
        const sentenceResults = await textAnalyticsClient.analyzeSentiment([text]);
        
        if (!sentenceResults[0].sentences || sentenceResults[0].sentences.length === 0) {
            // Fallback to paragraph chunking if sentence detection fails
            return chunkByParagraph(text, maxSize, overlap);
        }
        
        const sentences = sentenceResults[0].sentences.map(s => s.text);
        return combineChunks(sentences, maxSize, overlap, true);
        
    } catch (error) {
        console.error(`Error in semantic chunking: ${error.message}`);
        // Fallback to paragraph chunking
        return chunkByParagraph(text, maxSize, overlap);
    }
}

function combineChunks(textParts, maxSize, overlap, respectBoundaries = false) {
    const chunks = [];
    let currentChunk = "";
    
    for (const part of textParts) {
        // If adding this part would exceed max size, store current chunk and start a new one
        if (currentChunk.length + part.length > maxSize && currentChunk.length > 0) {
            chunks.push(currentChunk);
            
            if (respectBoundaries) {
                // For semantic chunking, don't include overlap
                currentChunk = "";
            } else {
                // For other chunking strategies, include overlap from end of previous chunk
                const overlapStartIndex = currentChunk.length - Math.min(overlap, currentChunk.length);
                currentChunk = currentChunk.substring(overlapStartIndex);
            }
        }
        
        currentChunk += (currentChunk.length > 0 ? " " : "") + part;
    }
    
    // Add the last chunk if there's anything left
    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk);
    }
    
    return chunks;
}

async function enrichChunks(chunks, textAnalyticsClient) {
    const enrichedChunks = [];
    
    // Process in batches of 10 (Azure Cognitive Services limit)
    for (let i = 0; i < chunks.length; i += 10) {
        const batch = chunks.slice(i, i + 10);
        
        try {
            // Extract key phrases
            const keyPhraseResults = await textAnalyticsClient.extractKeyPhrases(batch);
            
            // Recognize entities
            const entityResults = await textAnalyticsClient.recognizeEntities(batch);
            
            // Combine results
            for (let j = 0; j < batch.length; j++) {
                enrichedChunks.push({
                    text: batch[j],
                    keyPhrases: keyPhraseResults[j].keyPhrases || [],
                    entities: entityResults[j].entities.map(e => ({
                        text: e.text,
                        category: e.category,
                        confidence: e.confidenceScore
                    })) || []
                });
            }
        } catch (error) {
            console.error(`Error enriching chunks: ${error.message}`);
            // Add chunks without enrichment if the API call fails
            batch.forEach(text => {
                enrichedChunks.push({
                    text,
                    keyPhrases: [],
                    entities: []
                });
            });
        }
    }
    
    return enrichedChunks;
}
