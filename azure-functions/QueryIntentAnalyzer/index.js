const { TextAnalyticsClient, AzureKeyCredential } = require("@azure/ai-text-analytics");
const { OpenAIClient } = require("@azure/openai");

module.exports = async function (context, req) {
    context.log('Query Intent Analyzer function triggered.');

    // Check for required query parameter
    if (!req.body || !req.body.query) {
        context.res = {
            status: 400,
            body: "Please pass a query in the request body"
        };
        return;
    }

    try {
        const query = req.body.query;
        
        // Initialize Text Analytics client for NLP processing
        const textAnalyticsClient = new TextAnalyticsClient(
            process.env.AZURE_COG_SERVICES_ENDPOINT, 
            new AzureKeyCredential(process.env.AZURE_COG_SERVICES_KEY)
        );

        // Initialize Azure OpenAI client
        const openAIClient = new OpenAIClient(
            process.env.AZURE_AI_FOUNDRY_ENDPOINT,
            new AzureKeyCredential(process.env.AZURE_AI_FOUNDRY_KEY)
        );
        
        // 1. Entity Recognition - identify key entities in the query
        const entityResults = await textAnalyticsClient.recognizeEntities([query]);
        const entities = entityResults[0].entities.map(entity => ({
            text: entity.text,
            category: entity.category,
            confidence: entity.confidenceScore
        }));

        // 2. Extract key phrases
        const keyPhraseResults = await textAnalyticsClient.extractKeyPhrases([query]);
        const keyPhrases = keyPhraseResults[0].keyPhrases;

        // 3. Use Azure AI Foundation model to understand intent and generate query variations
        const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "gpt-35-turbo";
        const aiResponse = await openAIClient.getChatCompletions(
            deploymentName,
            [
                { 
                    role: "system", 
                    content: "You are an AI specialized in understanding search intent. Analyze the query to determine: \n1. The primary search intent (informational, navigational, transactional, or commercial)\n2. The topic category\n3. Generate 3 semantically similar query variations that maintain the original intent. Respond in JSON format."
                },
                { role: "user", content: `Analyze this search query: "${query}"` }
            ],
            {
                temperature: 0.3,
                maxTokens: 500
            }
        );
        
        // Parse the AI generated content as JSON
        const intentAnalysis = JSON.parse(aiResponse.choices[0].message.content);

        // 4. Store the analyzed data in Azure Cosmos DB (to be implemented)
        // This would involve storing the query, entities, intent classification, etc.
        
        // Return the combined analysis results
        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: {
                originalQuery: query,
                entities: entities,
                keyPhrases: keyPhrases,
                intentAnalysis: intentAnalysis,
                timestamp: new Date().toISOString()
            }
        };
    } catch (error) {
        context.log.error(`Error in Query Intent Analyzer: ${error.message}`);
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};
