const { OpenAIClient, AzureKeyCredential } = require("@azure/openai");
const { TextAnalyticsClient } = require("@azure/ai-text-analytics");
const { CosmosClient } = require("@azure/cosmos");
const axios = require('axios');

// Initialize clients
const openAIClient = new OpenAIClient(
    process.env.AZURE_AI_FOUNDRY_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_AI_FOUNDRY_KEY)
);

const textAnalyticsClient = new TextAnalyticsClient(
    process.env.AZURE_COG_SERVICES_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_COG_SERVICES_KEY)
);

const cosmosClient = new CosmosClient({
    endpoint: process.env.COSMOS_DB_ENDPOINT,
    key: process.env.COSMOS_DB_KEY
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
const authorityContainer = database.container("authoritySignals");

module.exports = async function (context, req) {
    context.log('Authority Signals Analysis function triggered');

    if (!req.body || !req.body.content) {
        context.res = {
            status: 400,
            body: "Please provide content to analyze in the request body"
        };
        return;
    }

    try {
        const { 
            content, 
            contentId, 
            url,
            domain,
            title,
            author,
            publicationDate,
            contentType = "article"
        } = req.body;

        // Generate a unique ID for this analysis
        const analysisId = contentId || `auth-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
        
        // Step 1: Analyze factual claims and citations
        const factualAnalysis = await analyzeFactualClaims(content);
        
        // Step 2: Check citation quality if URLs are present
        const citationAnalysis = await analyzeCitations(content, factualAnalysis.extractedCitations);
        
        // Step 3: Evaluate expertise, authoritativeness, and trustworthiness
        const eatAnalysis = await evaluateEAT(
            content, 
            title,
            author, 
            domain,
            contentType
        );
        
        // Step 4: Analyze domain authority and trust signals if domain provided
        let domainAnalysis = { trust: 0, authority: 0 };
        if (domain) {
            domainAnalysis = await analyzeDomainAuthority(domain);
        }
        
        // Step 5: Compute overall authority score
        const overallScore = computeAuthorityScore(
            factualAnalysis.score,
            citationAnalysis.score,
            eatAnalysis.score,
            domainAnalysis
        );
        
        // Step 6: Store results in Cosmos DB
        const result = {
            id: analysisId,
            contentId: contentId,
            url: url,
            domain: domain,
            title: title,
            author: author,
            publicationDate: publicationDate,
            contentType: contentType,
            factualAnalysis: factualAnalysis,
            citationAnalysis: citationAnalysis,
            eatAnalysis: eatAnalysis,
            domainAnalysis: domainAnalysis,
            overallScore: overallScore,
            timestamp: new Date().toISOString()
        };
        
        await authorityContainer.items.create(result);
        
        // Format response
        context.res = {
            status: 200,
            body: {
                id: analysisId,
                overallScore,
                factualScore: factualAnalysis.score,
                citationScore: citationAnalysis.score,
                expertiseScore: eatAnalysis.score,
                domainTrust: domainAnalysis.trust,
                domainAuthority: domainAnalysis.authority,
                claimAnalysis: factualAnalysis.claims,
                improvementSuggestions: [
                    ...factualAnalysis.suggestions,
                    ...citationAnalysis.suggestions,
                    ...eatAnalysis.suggestions
                ]
            }
        };
        
    } catch (error) {
        context.log.error(`Error in Authority Signals Analysis: ${error.message}`);
        context.res = {
            status: 500,
            body: `An error occurred: ${error.message}`
        };
    }
};

/**
 * Analyze factual claims in the content
 */
async function analyzeFactualClaims(content) {
    try {
        // Use Azure OpenAI to identify and analyze factual claims
        const messages = [
            { 
                role: "system", 
                content: `You are an expert fact-checker and content analyst. Identify factual claims in the provided content, assess their verifiability, and extract any citations. Focus on statements presented as facts rather than opinions. Output only valid JSON.`
            },
            { 
                role: "user", 
                content: `
                Content: ${content.substring(0, 4000)}
                
                Analyze this content for:
                1. Factual claims that would benefit from citations
                2. Existing citations or references
                3. Overall factual precision and accuracy
                
                Return a JSON object with:
                - claims: array of identified factual claims
                - extractedCitations: array of citations/references found in the text
                - score: numerical assessment (0-100) of factual precision
                - suggestions: array of suggestions to improve factual credibility
                `
            }
        ];
        
        const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "gpt-4";
        const response = await openAIClient.getChatCompletions(
            deploymentName,
            messages,
            {
                temperature: 0.3,
                maxTokens: 1500
            }
        );
        
        return JSON.parse(response.choices[0].message.content);
        
    } catch (error) {
        console.error(`Error analyzing factual claims: ${error.message}`);
        // Return basic analysis if AI analysis fails
        return {
            claims: [],
            extractedCitations: [],
            score: 50,
            suggestions: ["Couldn't perform detailed factual analysis due to technical error"]
        };
    }
}

/**
 * Analyze the quality of citations in the content
 */
async function analyzeCitations(content, extractedCitations) {
    try {
        if (!extractedCitations || extractedCitations.length === 0) {
            return {
                citationsFound: 0,
                validCitations: 0,
                qualityScore: 0,
                score: 30, // Low score due to lack of citations
                suggestions: ["Add citations to support factual claims"]
            };
        }
        
        // Filter for URLs in citations
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const urls = extractedCitations
            .map(citation => citation.match(urlRegex))
            .filter(Boolean)
            .flat();
        
        if (urls.length === 0) {
            return {
                citationsFound: extractedCitations.length,
                validCitations: 0,
                qualityScore: 40,
                score: 40,
                suggestions: ["Include hyperlinks or properly formatted citations"]
            };
        }
        
        // Check validity and quality of citation sources
        // This would ideally involve checking if URLs are valid and assessing source quality
        // For now, we'll use a simplified approach
        
        const citationQuality = {
            citationsFound: extractedCitations.length,
            validCitations: urls.length,
            qualityScore: 70, // Placeholder - would need actual assessment
            score: Math.min(85, 40 + urls.length * 5), // Scale with number of valid citations, max 85
            suggestions: [
                "Ensure all factual claims have citations",
                "Use authoritative sources for citations"
            ]
        };
        
        return citationQuality;
        
    } catch (error) {
        console.error(`Error analyzing citations: ${error.message}`);
        return {
            citationsFound: 0,
            validCitations: 0,
            qualityScore: 0,
            score: 30,
            suggestions: ["Unable to analyze citations due to an error"]
        };
    }
}

/**
 * Evaluate Expertise, Authoritativeness, and Trustworthiness (E-A-T)
 */
async function evaluateEAT(content, title, author, domain, contentType) {
    try {
        // Use Azure OpenAI to evaluate E-A-T signals
        const messages = [
            { 
                role: "system", 
                content: `You are an expert in Expertise, Authoritativeness, and Trustworthiness (E-A-T) evaluation. Analyze the provided content for signals of these qualities. Output only valid JSON.`
            },
            { 
                role: "user", 
                content: `
                Content: ${content.substring(0, 4000)}
                
                Title: ${title || "Not provided"}
                Author: ${author || "Not provided"}
                Domain: ${domain || "Not provided"}
                Content Type: ${contentType || "article"}
                
                Analyze this content for E-A-T signals:
                1. Expertise: Signs that the content demonstrates subject matter expertise
                2. Authoritativeness: Signals of authority in the field
                3. Trustworthiness: Elements that build trust with readers
                
                Return a JSON object with:
                - expertise: numerical score (0-100) with brief explanation
                - authority: numerical score (0-100) with brief explanation
                - trustworthiness: numerical score (0-100) with brief explanation
                - score: overall E-A-T score (0-100)
                - suggestions: array of specific suggestions to improve E-A-T signals
                `
            }
        ];
        
        const deploymentName = process.env.AZURE_AI_FOUNDRY_DEPLOYMENT_NAME || "gpt-4";
        const response = await openAIClient.getChatCompletions(
            deploymentName,
            messages,
            {
                temperature: 0.3,
                maxTokens: 1200
            }
        );
        
        return JSON.parse(response.choices[0].message.content);
        
    } catch (error) {
        console.error(`Error evaluating E-A-T: ${error.message}`);
        // Return basic analysis if AI analysis fails
        return {
            expertise: { score: 50, explanation: "Could not evaluate due to technical error" },
            authority: { score: 50, explanation: "Could not evaluate due to technical error" },
            trustworthiness: { score: 50, explanation: "Could not evaluate due to technical error" },
            score: 50,
            suggestions: ["Include author credentials to demonstrate expertise"]
        };
    }
}

/**
 * Analyze domain authority and trust signals
 */
async function analyzeDomainAuthority(domain) {
    try {
        // This would typically involve API calls to domain authority services
        // and checking against databases of trusted domains
        // For now, we'll use a placeholder implementation
        
        // In a production system, you might integrate with services like:
        // - Moz Domain Authority API
        // - Ahrefs Domain Rating
        // - Majestic Trust Flow
        // - Google's SafeBrowsing API
        
        // Placeholder values - would be replaced with actual API calls
        const trust = 75; // Scale 0-100
        const authority = 65; // Scale 0-100
        
        return { trust, authority };
        
    } catch (error) {
        console.error(`Error analyzing domain authority: ${error.message}`);
        return { trust: 50, authority: 50 };
    }
}

/**
 * Compute overall authority score based on various signals
 */
function computeAuthorityScore(factualScore, citationScore, eatScore, domainAnalysis) {
    // Weight the different components to calculate overall score
    const weights = {
        factual: 0.25,
        citation: 0.20,
        eat: 0.40,
        domain: 0.15
    };
    
    const weightedScore = 
        (factualScore * weights.factual) +
        (citationScore * weights.citation) +
        (eatScore * weights.eat) +
        ((domainAnalysis.trust + domainAnalysis.authority) / 2 * weights.domain);
    
    return Math.round(weightedScore);
}
