const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const { TextAnalyticsClient } = require('@azure/ai-text-analytics');
const { OpenAIClient } = require('@azure/openai');
const axios = require('axios');

module.exports = async function (context, req) {
    context.log('🔍 Query Intent Analyzer function triggered');
    
    try {
        // Initialize Azure clients
        const credential = new DefaultAzureCredential();
        const keyVaultUrl = process.env.AZURE_KEY_VAULT_URL;
        const secretClient = new SecretClient(keyVaultUrl, credential);
        
        // Get API keys from Key Vault
        const exaApiKey = await secretClient.getSecret('exa-api-key');
        const serpApiKey = await secretClient.getSecret('serp-api-key');
        
        // Initialize Azure Language Service
        const languageEndpoint = process.env.AZURE_LANGUAGE_SERVICE_ENDPOINT;
        const languageKey = process.env.AZURE_LANGUAGE_SERVICE_API_KEY;
        const textAnalyticsClient = new TextAnalyticsClient(languageEndpoint, credential);
        
        // Initialize Azure OpenAI
        const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
        const openaiKey = process.env.AZURE_OPENAI_API_KEY;
        const openaiClient = new OpenAIClient(openaiEndpoint, credential);
        
        const { query, audience = 'b2b', contentType = 'blog_post' } = req.body || req.query;
        
        if (!query) {
            context.res = {
                status: 400,
                body: { error: 'Query parameter is required' }
            };
            return;
        }
        
        context.log(`Analyzing query intent for: "${query}"`);
        
        // 1. Analyze query with Azure Language Service
        const languageAnalysis = await analyzeWithLanguageService(textAnalyticsClient, query);
        
        // 2. Enhance with Azure OpenAI
        const aiEnhancement = await enhanceWithOpenAI(openaiClient, query, audience, contentType);
        
        // 3. External API enrichment
        const externalData = await enrichWithExternalAPIs(query, exaApiKey.value, serpApiKey.value);
        
        // 4. Compile comprehensive intent analysis
        const intentAnalysis = {
            query,
            audience,
            contentType,
            primaryIntent: determinePrimaryIntent(query, languageAnalysis, aiEnhancement),
            secondaryIntents: getSecondaryIntents(query, audience),
            intentScores: calculateIntentScores(query, languageAnalysis),
            confidence: calculateConfidence(languageAnalysis, aiEnhancement),
            searchParameters: generateSearchParameters(query, audience, externalData),
            queryComplexity: assessQueryComplexity(query, languageAnalysis),
            userJourney: mapUserJourney(query, audience),
            entities: languageAnalysis.entities || [],
            keyPhrases: languageAnalysis.keyPhrases || [],
            sentiment: languageAnalysis.sentiment || {},
            externalInsights: externalData,
            aiEnhancement,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - context.executionContext.invocationId
        };
        
        // Send to next layer via Service Bus
        context.bindings.outputSbMsg = {
            layer: 'bottom',
            service: 'QueryIntentAnalyzer',
            data: intentAnalysis,
            nextLayer: 'middle',
            timestamp: new Date().toISOString()
        };
        
        context.res = {
            status: 200,
            body: {
                success: true,
                service: 'QueryIntentAnalyzer',
                data: intentAnalysis,
                message: 'Query intent analysis completed successfully'
            }
        };
        
    } catch (error) {
        context.log.error('❌ Query Intent Analyzer error:', error);
        context.res = {
            status: 500,
            body: {
                success: false,
                error: 'Query intent analysis failed',
                message: error.message
            }
        };
    }
};

async function analyzeWithLanguageService(client, query) {
    try {
        const documents = [{ id: '1', text: query, language: 'en' }];
        
        // Parallel analysis
        const [entitiesResult, keyPhrasesResult, sentimentResult] = await Promise.all([
            client.recognizeEntities(documents),
            client.extractKeyPhrases(documents),
            client.analyzeSentiment(documents)
        ]);
        
        return {
            entities: entitiesResult[0]?.entities || [],
            keyPhrases: keyPhrasesResult[0]?.keyPhrases || [],
            sentiment: sentimentResult[0]?.sentiment || {}
        };
    } catch (error) {
        console.error('Language service analysis failed:', error);
        return { entities: [], keyPhrases: [], sentiment: {} };
    }
}

async function enhanceWithOpenAI(client, query, audience, contentType) {
    try {
        const prompt = `Analyze the search intent for this query: "${query}"
        
        Audience: ${audience}
        Content Type: ${contentType}
        
        Provide a JSON response with:
        1. Primary intent (informational, navigational, commercial, transactional)
        2. Intent confidence (0-1)
        3. User motivation
        4. Content recommendations
        5. SEO opportunities`;
        
        const response = await client.getChatCompletions(
            process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
            [{ role: 'user', content: prompt }],
            { maxTokens: 500, temperature: 0.3 }
        );
        
        const content = response.choices[0]?.message?.content;
        return JSON.parse(content);
    } catch (error) {
        console.error('OpenAI enhancement failed:', error);
        return { primaryIntent: 'informational', confidence: 0.7 };
    }
}

async function enrichWithExternalAPIs(query, exaApiKey, serpApiKey) {
    try {
        const [exaData, serpData] = await Promise.all([
            fetchExaData(query, exaApiKey),
            fetchSerpData(query, serpApiKey)
        ]);
        
        return {
            exa: exaData,
            serp: serpData,
            enrichmentTimestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('External API enrichment failed:', error);
        return { exa: null, serp: null };
    }
}

async function fetchExaData(query, apiKey) {
    try {
        const response = await axios.post('https://api.exa.ai/search', {
            query,
            numResults: 5,
            includeDomains: ['wikipedia.org', 'britannica.com'],
            useAutoprompt: true
        }, {
            headers: { 'x-api-key': apiKey },
            timeout: 10000
        });
        
        return response.data;
    } catch (error) {
        console.error('Exa API failed:', error);
        return null;
    }
}

async function fetchSerpData(query, apiKey) {
    try {
        const response = await axios.get('https://serpapi.com/search', {
            params: {
                q: query,
                engine: 'google',
                api_key: apiKey,
                num: 5
            },
            timeout: 10000
        });
        
        return response.data;
    } catch (error) {
        console.error('SERP API failed:', error);
        return null;
    }
}

function determinePrimaryIntent(query, languageAnalysis, aiEnhancement) {
    const informationalKeywords = ['how', 'what', 'why', 'guide', 'tutorial', 'learn'];
    const commercialKeywords = ['buy', 'price', 'cost', 'compare', 'review', 'best'];
    const transactionalKeywords = ['purchase', 'order', 'signup', 'download', 'get'];
    
    const queryLower = query.toLowerCase();
    
    if (aiEnhancement?.primaryIntent) {
        return aiEnhancement.primaryIntent;
    }
    
    if (informationalKeywords.some(keyword => queryLower.includes(keyword))) {
        return 'informational';
    } else if (transactionalKeywords.some(keyword => queryLower.includes(keyword))) {
        return 'transactional';
    } else if (commercialKeywords.some(keyword => queryLower.includes(keyword))) {
        return 'commercial';
    }
    
    return 'informational'; // Default
}

function getSecondaryIntents(query, audience) {
    const intents = ['educational', 'research'];
    
    if (audience === 'b2b') {
        intents.push('commercial', 'comparison');
    } else if (audience === 'b2c') {
        intents.push('transactional', 'entertainment');
    }
    
    return intents;
}

function calculateIntentScores(query, languageAnalysis) {
    const sentiment = languageAnalysis.sentiment;
    const entities = languageAnalysis.entities || [];
    
    return {
        informational: 0.8 - (entities.length * 0.05),
        navigational: 0.1,
        transactional: Math.min(entities.length * 0.1, 0.4),
        commercial: sentiment?.confidence > 0.7 ? 0.3 : 0.2
    };
}

function calculateConfidence(languageAnalysis, aiEnhancement) {
    const baseConfidence = 0.7;
    const languageConfidence = languageAnalysis.sentiment?.confidence || 0.5;
    const aiConfidence = aiEnhancement?.confidence || 0.7;
    
    return (baseConfidence + languageConfidence + aiConfidence) / 3;
}

function generateSearchParameters(query, audience, externalData) {
    return {
        includeDomains: getAuthorityDomains(query),
        contentTypes: getContentTypes(audience),
        timeframe: getTimeframe(query),
        geoTargeting: getGeoTargeting(audience),
        externalInsights: externalData ? 'enriched' : 'basic'
    };
}

function getAuthorityDomains(query) {
    const generalDomains = ['wikipedia.org', 'britannica.com', 'edu'];
    const techDomains = ['stackoverflow.com', 'github.com', 'techcrunch.com'];
    const businessDomains = ['harvard.edu', 'mit.edu', 'mckinsey.com'];
    
    if (query.toLowerCase().includes('tech') || query.toLowerCase().includes('software')) {
        return [...generalDomains, ...techDomains];
    } else if (query.toLowerCase().includes('business') || query.toLowerCase().includes('strategy')) {
        return [...generalDomains, ...businessDomains];
    }
    
    return generalDomains;
}

function getContentTypes(audience) {
    const typeMap = {
        'b2b': ['article', 'whitepaper', 'case-study'],
        'b2c': ['article', 'blog', 'guide'],
        'technical': ['documentation', 'tutorial', 'reference'],
        'academic': ['research', 'paper', 'study']
    };
    return typeMap[audience] || ['article', 'guide'];
}

function getTimeframe(query) {
    const timeSensitiveKeywords = ['trend', 'new', 'latest', '2024', 'current'];
    const isTimeSensitive = timeSensitiveKeywords.some(keyword => 
        query.toLowerCase().includes(keyword)
    );
    return isTimeSensitive ? 'recent' : 'all-time';
}

function getGeoTargeting(audience) {
    if (audience === 'local') return 'local';
    if (audience === 'global') return 'global';
    return 'regional';
}

function assessQueryComplexity(query, languageAnalysis) {
    const words = query.split(' ').length;
    const entities = languageAnalysis.entities?.length || 0;
    const technicalTerms = ['algorithm', 'implementation', 'architecture', 'optimization'];
    const hasTechnicalTerms = technicalTerms.some(term => 
        query.toLowerCase().includes(term)
    );
    
    if (words > 5 || entities > 3 || hasTechnicalTerms) return 'high';
    if (words > 3 || entities > 1) return 'medium';
    return 'low';
}

function mapUserJourney(query, audience) {
    const stages = ['awareness', 'consideration', 'decision'];
    const currentStage = determineJourneyStage(query);
    
    return {
        currentStage,
        allStages: stages,
        nextSteps: getNextSteps(currentStage, audience),
        contentGaps: identifyContentGaps(currentStage, query)
    };
}

function determineJourneyStage(query) {
    const awarenessKeywords = ['what', 'why', 'introduction', 'overview'];
    const considerationKeywords = ['how', 'compare', 'vs', 'options'];
    const decisionKeywords = ['best', 'buy', 'choose', 'implement'];
    
    const queryLower = query.toLowerCase();
    
    if (decisionKeywords.some(keyword => queryLower.includes(keyword))) {
        return 'decision';
    } else if (considerationKeywords.some(keyword => queryLower.includes(keyword))) {
        return 'consideration';
    }
    return 'awareness';
}

function getNextSteps(stage, audience) {
    const nextStepsMap = {
        awareness: ['Learn more about benefits', 'Explore use cases', 'Understand basics'],
        consideration: ['Compare options', 'Read reviews', 'Evaluate features'],
        decision: ['Get pricing', 'Start trial', 'Contact sales', 'Make purchase']
    };
    
    return nextStepsMap[stage] || nextStepsMap.awareness;
}

function identifyContentGaps(stage, query) {
    return [
        `Advanced ${query} strategies`,
        `${query} case studies`,
        `${query} implementation guide`,
        `${query} troubleshooting`
    ];
}
