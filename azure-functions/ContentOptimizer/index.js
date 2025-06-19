const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { CosmosClient } = require("@azure/cosmos");
const { SearchClient } = require("@azure/search-documents");
const axios = require('axios');

// Initialize clients
const openAIClient = new OpenAIClient(
    process.env.AZURE_AI_FOUNDRY_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_AI_FOUNDRY_KEY)
);

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
const contentContainer = database.container("generatedContent");
const optimizationHistoryContainer = database.container("optimizationHistory");

// Search client for retrieving reference content
const searchClient = new SearchClient(
    process.env.AZURE_SEARCH_ENDPOINT,
    process.env.AZURE_SEARCH_INDEX_NAME || "content-index",
    new AzureKeyCredential(process.env.AZURE_SEARCH_KEY)
);

module.exports = async function (context, req) {
    context.log('Content Optimizer function triggered');

    if (!req.body || !req.body.content || !req.body.optimizationGoals) {
        context.res = {
            status: 400,
            body: "Please provide content and optimization goals in the request body"
        };
        return;
    }

    try {
        const { 
            content, 
            contentId, 
            optimizationGoals,
            targetAudience,
            searchIntent,
            keywords = [],
            style = "professional",
            maxLength,
            enhanceWithResearch = true,
            includeReferences = true,
            version = 1
        } = req.body;

        // Generate a unique ID for this optimization job
        const optimizationId = contentId || `opt-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Step 1: Gather reference content if enhanceWithResearch is true
        let referenceContent = [];
        if (enhanceWithResearch) {
            referenceContent = await gatherReferenceContent(keywords, searchIntent);
        }
        
        // Step 2: Analyze content and create optimization plan
        const optimizationPlan = await createOptimizationPlan(
            content, 
            optimizationGoals, 
            targetAudience,
            keywords
        );

        // Step 3: Optimize content based on the plan
        const optimizedResult = await optimizeContent(
            content,
            optimizationPlan,
            targetAudience,
            style,
            keywords,
            searchIntent,
            referenceContent,
            maxLength
        );
        
        // Step 4: Evaluate and score the optimized content
        const scoreMetrics = await evaluateContent(
            optimizedResult.content,
            optimizationGoals,
            keywords,
            searchIntent,
            targetAudience
        );
        
        // Step 5: Store results in Cosmos DB
        const result = {
            id: optimizationId,
            originalContent: content,
            optimizedContent: optimizedResult.content,
            score: scoreMetrics,
            optimizationPlan: optimizationPlan,
            appliedChanges: optimizedResult.changes,
            referencesUsed: includeReferences ? optimizedResult.references : [],
            contentType: req.body.contentType || "article",
            version: version,
            timestamp: new Date().toISOString()
        };
        
        await contentContainer.items.create(result);
        
        // Save optimization history
        await optimizationHistoryContainer.items.create({
            id: `${optimizationId}-v${version}`,
            contentId: optimizationId,
            version: version,
            optimizationGoals: optimizationGoals,
            scoreImprovement: {
                before: optimizedResult.beforeScore || {},
                after: scoreMetrics
            },
            timestamp: new Date().toISOString()
        });
        
        // Format response
        context.res = {
            status: 200,
            body: {
                id: optimizationId,
                originalContentPreview: content.substring(0, 150) + "...",
                optimizedContent: optimizedResult.content,
                score: scoreMetrics,
                summary: optimizedResult.summary,
                changes: optimizedResult.changes,
                references: includeReferences ? optimizedResult.references : []
            }
        };
        
    } catch (error) {
        context.log.error(`Error in Content Optimizer: ${error.message}`);
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};

/**
 * Search for reference content to enhance optimization
 */
async function gatherReferenceContent(keywords, searchIntent) {
    try {
        // Combine keywords and search intent for better results
        const searchQuery = [...keywords, searchIntent].filter(Boolean).join(" ");
        
        if (!searchQuery) {
            return [];
        }
        
        // Search for relevant content in the vector index
        const searchResults = await searchClient.search(searchQuery, {
            top: 5,
            queryType: "semantic",
            searchFields: ["text", "title", "keyPhrases"],
            select: ["id", "text", "title", "source", "created"]
        });
        
        const references = [];
        for await (const result of searchResults.results) {
            references.push({
                id: result.document.id,
                title: result.document.title,
                text: result.document.text,
                source: result.document.source,
                created: result.document.created,
                score: result.score
            });
        }
        
        return references;
        
    } catch (error) {
        console.error(`Error gathering reference content: ${error.message}`);
        return [];
    }
}

/**
 * Create a plan for content optimization
 */
async function createOptimizationPlan(content, goals, audience, keywords) {
    try {
        // Use Azure OpenAI to analyze content and create optimization plan
        const messages = [
            { 
                role: "system", 
                content: `You are an AI content optimization expert. Analyze the content and create a detailed optimization plan based on the goals and target audience. Focus on specific, actionable improvements. Output only valid JSON.`
            },
            { 
                role: "user", 
                content: `
                Content: ${content.substring(0, 4000)}
                
                Optimization Goals: ${goals.join(", ")}
                Target Audience: ${audience || "General"}
                Keywords to emphasize: ${keywords.join(", ")}
                
                Create a detailed optimization plan with specific sections to improve.
                `
            }
        ];
        
        const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "gpt-4";
        const response = await openAIClient.getChatCompletions(
            deploymentName,
            messages,
            {
                temperature: 0.3,
                maxTokens: 1000
            }
        );
        
        return JSON.parse(response.choices[0].message.content);
        
    } catch (error) {
        console.error(`Error creating optimization plan: ${error.message}`);
        // Return a basic plan if AI analysis fails
        return {
            improvements: [
                { section: "Overall content", recommendation: "Apply general improvements based on specified goals" }
            ],
            keywordSuggestions: keywords,
            structuralChanges: []
        };
    }
}

/**
 * Optimize the content according to the plan
 */
async function optimizeContent(content, plan, audience, style, keywords, intent, references, maxLength) {
    try {
        const referencesText = references.map(ref => 
            `Reference: ${ref.title}\n${ref.text.substring(0, 500)}...\nSource: ${ref.source}`
        ).join("\n\n").substring(0, 2000); // Limit reference text length
        
        // Create structured prompt for content optimization
        const messages = [
            { 
                role: "system", 
                content: `You are an expert content writer and optimizer. Your task is to improve the given content based on the optimization plan, target audience, and style guidelines. Maintain the appropriate tone and ensure all factual claims are accurate. Structure the content for readability and SEO optimization.`
            },
            { 
                role: "user", 
                content: `
                # Original Content
                ${content.substring(0, 4000)}
                
                # Optimization Plan
                ${JSON.stringify(plan, null, 2)}
                
                # Parameters
                - Target audience: ${audience || "General"}
                - Style: ${style}
                - Target keywords: ${keywords.join(", ")}
                - Search intent: ${intent}
                - Maximum length: ${maxLength || "No specific limit"}
                
                # Reference Materials
                ${references.length > 0 ? referencesText : "No references provided"}
                
                Please optimize the content according to the plan. Return your response as a JSON object with these keys:
                - content: The optimized content
                - summary: Brief summary of improvements made
                - changes: Array of specific changes made
                - references: Array of references used, if any
                `
            }
        ];
        
        const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "gpt-4";
        const response = await openAIClient.getChatCompletions(
            deploymentName,
            messages,
            {
                temperature: 0.7,
                maxTokens: 4000
            }
        );
        
        // Parse the optimized content
        return JSON.parse(response.choices[0].message.content);
        
    } catch (error) {
        console.error(`Error optimizing content: ${error.message}`);
        // Return the original content if optimization fails
        return {
            content: content,
            summary: "Optimization failed due to an error",
            changes: [],
            references: []
        };
    }
}

/**
 * Evaluate and score the optimized content
 */
async function evaluateContent(content, goals, keywords, intent, audience) {
    try {
        // Use Azure OpenAI to evaluate content quality
        const messages = [
            { 
                role: "system", 
                content: `You are an expert content evaluator. Assess the provided content based on specific optimization goals and provide detailed scores. Output only valid JSON.`
            },
            { 
                role: "user", 
                content: `
                Content: ${content.substring(0, 4000)}
                
                Optimization Goals: ${goals.join(", ")}
                Target Keywords: ${keywords.join(", ")}
                Search Intent: ${intent}
                Target Audience: ${audience || "General"}
                
                Evaluate this content and provide scores (0-100) for each of these metrics:
                - Relevance: How well the content addresses the search intent
                - KeywordOptimization: Proper usage of target keywords
                - Readability: How easy the content is to read and understand
                - EngagementPotential: How likely the content is to engage the target audience
                - ContentDepth: Depth and comprehensiveness of the content
                - Structure: Organization and flow of the content
                - Overall: Overall quality score
                
                For each metric, also provide a brief explanation of your score.
                `
            }
        ];
        
        const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "gpt-4";
        const response = await openAIClient.getChatCompletions(
            deploymentName,
            messages,
            {
                temperature: 0.3,
                maxTokens: 1000
            }
        );
        
        return JSON.parse(response.choices[0].message.content);
        
    } catch (error) {
        console.error(`Error evaluating content: ${error.message}`);
        // Return basic scores if evaluation fails
        return {
            relevance: { score: 70, explanation: "Score estimation due to evaluation error" },
            keywordOptimization: { score: 70, explanation: "Score estimation due to evaluation error" },
            readability: { score: 70, explanation: "Score estimation due to evaluation error" },
            engagementPotential: { score: 70, explanation: "Score estimation due to evaluation error" },
            contentDepth: { score: 70, explanation: "Score estimation due to evaluation error" },
            structure: { score: 70, explanation: "Score estimation due to evaluation error" },
            overall: { score: 70, explanation: "Score estimation due to evaluation error" }
        };
    }
}
