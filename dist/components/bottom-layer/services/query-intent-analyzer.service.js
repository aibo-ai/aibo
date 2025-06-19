"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var QueryIntentAnalyzerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIntentAnalyzerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const cosmos_1 = require("@azure/cosmos");
const azure_ai_service_1 = require("../../../shared/services/azure-ai.service");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
let QueryIntentAnalyzerService = QueryIntentAnalyzerService_1 = class QueryIntentAnalyzerService {
    constructor(configService, azureAIService) {
        this.configService = configService;
        this.azureAIService = azureAIService;
        this.logger = new common_1.Logger(QueryIntentAnalyzerService_1.name);
        this.databaseId = 'content-architect';
        this.containerId = 'query-intents';
        this.strategyContainerId = 'content-strategies';
        const cosmosKey = this.configService.get('AZURE_COSMOS_KEY');
        const cosmosEndpoint = this.configService.get('AZURE_COSMOS_ENDPOINT');
        if (!cosmosKey || !cosmosEndpoint) {
            this.logger.error('Missing Cosmos DB configuration. AZURE_COSMOS_KEY and AZURE_COSMOS_ENDPOINT must be provided.');
            throw new Error('Missing required Cosmos DB configuration');
        }
        this.cosmosClient = new cosmos_1.CosmosClient({
            endpoint: cosmosEndpoint,
            key: cosmosKey
        });
        this.logger.log('Cosmos DB client initialized');
        this.searchEndpoint = this.configService.get('AZURE_SEARCH_ENDPOINT');
        this.searchKey = this.configService.get('AZURE_SEARCH_KEY');
        this.searchIndexName = this.configService.get('AZURE_SEARCH_INDEX_NAME') || 'content-index';
        if (!this.searchEndpoint || !this.searchKey) {
            this.logger.warn('Azure AI Search configuration incomplete. Some search features may be limited.');
        }
        else {
            this.logger.log('Azure AI Search configuration initialized');
        }
        this.aiFoundryEndpoint = this.configService.get('AZURE_AI_FOUNDRY_ENDPOINT');
        this.aiFoundryKey = this.configService.get('AZURE_AI_FOUNDRY_KEY');
        this.aiFoundryDeploymentName = this.configService.get('AZURE_AI_FOUNDRY_DEPLOYMENT_NAME');
        if (!this.aiFoundryEndpoint || !this.aiFoundryKey) {
            this.logger.warn('Azure AI Foundry configuration incomplete. Using Azure OpenAI as fallback.');
        }
        else {
            this.logger.log('Azure AI Foundry configuration initialized');
        }
    }
    async onModuleInit() {
        try {
            await this.initializeCosmosResources();
            this.logger.log('QueryIntentAnalyzerService initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize QueryIntentAnalyzerService: ${error.message}`);
            throw error;
        }
    }
    async initializeCosmosResources() {
        try {
            this.logger.log('Initializing Cosmos DB resources...');
            const { database } = await this.cosmosClient.databases.createIfNotExists({
                id: this.databaseId
            });
            this.database = database;
            this.logger.log(`Database '${this.databaseId}' initialized`);
            const { container } = await this.database.containers.createIfNotExists({
                id: this.containerId,
                partitionKey: { paths: ["/topic"] }
            });
            this.container = container;
            this.queryIntentsContainer = container;
            this.logger.log(`Container '${this.containerId}' initialized`);
            const { container: strategyContainer } = await this.database.containers.createIfNotExists({
                id: this.strategyContainerId,
                partitionKey: { paths: ["/contentType"] }
            });
            this.strategyContainer = strategyContainer;
            this.contentStrategiesContainer = strategyContainer;
            this.logger.log('Cosmos DB resources initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize Cosmos DB resources: ${error.message}`);
            throw error;
        }
    }
    async analyzeIntent(input, segment) {
        try {
            if (typeof input === 'string') {
                return this.analyzeTopicIntent(input);
            }
            else if (segment) {
                return this.analyzeSegmentIntent(input, segment);
            }
            else {
                return this.analyzeUserInputIntent(input);
            }
        }
        catch (error) {
            this.logger.error(`Error analyzing intent: ${error.message}`);
            throw error;
        }
    }
    mapIntentToContentType(intent) {
        switch (intent.toLowerCase()) {
            case 'informational':
                return ['article', 'blog', 'guide', 'tutorial', 'whitepaper'];
            case 'transactional':
                return ['product', 'service', 'landing-page', 'review'];
            case 'navigational':
                return ['homepage', 'category-page', 'directory', 'index'];
            case 'commercial':
                return ['review', 'comparison', 'case-study', 'testimonial'];
            default:
                return ['article', 'blog', 'guide'];
        }
    }
    async storeIntentAnalysis(intentAnalysis) {
        try {
            this.logger.log(`Storing intent analysis for topic: ${intentAnalysis.topic}`);
            await this.queryIntentsContainer.items.create(intentAnalysis);
            this.logger.log(`Intent analysis stored with id: ${intentAnalysis.id}`);
        }
        catch (error) {
            this.logger.error(`Failed to store intent analysis: ${error.message}`);
        }
    }
    async analyzeTopicIntent(topic) {
        try {
            this.logger.log(`Analyzing intent for simple topic: ${topic}`);
            const prompt = `You are an intent analysis expert. Analyze the provided topic to determine search intent.
        Return a valid JSON object with the following structure:
        {
          "primaryIntent": "one of [informational, transactional, navigational, commercial]",
          "secondaryIntents": ["array of secondary intents"],
          "confidence": decimal between 0-1,
          "queryTypeDistribution": { "informational": decimal, "transactional": decimal, "navigational": decimal, "commercial": decimal },
          "conversationalQueries": [array of 3-5 related conversational queries],
          "keyThemes": [array of 3-7 key themes/topics relevant to the topic]
        }

        Analyze the intent for this topic: "${topic}". Return only valid JSON.`;
            const completion = await this.azureAIService.generateCompletion(prompt, {
                deploymentName: this.aiFoundryDeploymentName,
                temperature: 0.3,
                maxTokens: 800
            });
            const responseText = await this.azureAIService.getCompletion(completion);
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : this.createDefaultResponse(topic);
            const queryExpansion = await this.expandQuery(topic);
            const searchResults = await this.performSemanticSearch(topic, {
                top: 5,
                queryLanguage: 'en-us'
            });
            const suggestedApproach = await this.getSuggestedApproach(topic, jsonResponse.primaryIntent);
            const searchParams = await this.generateSearchParameters(topic, jsonResponse.primaryIntent, jsonResponse.keyThemes);
            const intentAnalysis = {
                id: (0, uuid_1.v4)(),
                topic,
                primaryIntent: jsonResponse.primaryIntent,
                secondaryIntents: jsonResponse.secondaryIntents || [jsonResponse.secondaryIntent],
                confidence: jsonResponse.confidence || 0.7,
                suggestedApproach,
                keyThemes: jsonResponse.keyThemes || [],
                keywordClusters: this.generateKeywordClusters(topic, jsonResponse.keyThemes || []),
                conversationalQueries: jsonResponse.conversationalQueries || [],
                queryTypeDistribution: jsonResponse.queryTypeDistribution || jsonResponse.queryTypes || {
                    informational: 0.7,
                    transactional: 0.1,
                    navigational: 0.1,
                    commercial: 0.1
                },
                searchParameters: searchParams,
                timestamp: new Date().toISOString(),
                queryExpansion: {
                    expandedQueries: queryExpansion.expandedQueries,
                    semanticQueries: queryExpansion.semanticQueries,
                    relatedConcepts: queryExpansion.relatedConcepts
                },
                semanticSearchResults: searchResults.results.slice(0, 3)
            };
            await this.storeIntentAnalysis(intentAnalysis);
            return intentAnalysis;
        }
        catch (error) {
            this.logger.error(`Error analyzing topic intent: ${error.message}`);
            throw error;
        }
    }
    async analyzeUserInputIntent(userInput) {
        try {
            this.logger.log(`Analyzing intent for topic with context: ${userInput.topic}`);
            const systemPrompt = `You are an intent analysis expert. Analyze the user's query intent for the provided topic.
        Determine the primary and secondary intent, confidence level, and provide recommendations.
        Return your analysis as valid JSON with the following structure:
        {
          "primaryIntent": "one of [informational, transactional, navigational, commercial]",
          "secondaryIntents": ["array of secondary intents"],
          "confidence": decimal between 0-1,
          "queryTypeDistribution": { "informational": decimal, "transactional": decimal, "navigational": decimal, "commercial": decimal },
          "conversationalQueries": [array of 3-5 related conversational queries],
          "keyThemes": [array of 3-7 key themes/topics relevant to the query]
        }`;
            const userPrompt = `Analyze the following topic: ${userInput.topic}${userInput.context ? `\nContext: ${userInput.context}` : ''}${userInput.keywords ? `\nKeywords: ${userInput.keywords.join(', ')}` : ''}${userInput.industry ? `\nIndustry: ${userInput.industry}` : ''}${userInput.audience ? `\nTarget audience: ${userInput.audience}` : ''}${userInput.goals ? `\nGoals: ${userInput.goals}` : ''}`;
            const prompt = `${systemPrompt}\n\n${userPrompt}`;
            const completion = await this.azureAIService.generateCompletion(prompt);
            const responseText = await this.azureAIService.getCompletion(completion);
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : this.createDefaultResponse(userInput.topic);
            const queryExpansion = await this.expandQuery(userInput.topic);
            const searchResults = await this.performSemanticSearch(userInput.topic, {
                top: 5,
                queryLanguage: 'en-us'
            });
            const suggestedApproach = await this.getSuggestedApproach(userInput.topic, jsonResponse.primaryIntent);
            const searchParams = await this.generateSearchParameters(userInput.topic, jsonResponse.primaryIntent, jsonResponse.keyThemes);
            const intentAnalysis = {
                id: (0, uuid_1.v4)(),
                topic: userInput.topic,
                primaryIntent: jsonResponse.primaryIntent,
                secondaryIntents: jsonResponse.secondaryIntents || [jsonResponse.secondaryIntent],
                confidence: jsonResponse.confidence || 0.7,
                suggestedApproach,
                keyThemes: jsonResponse.keyThemes || [],
                keywordClusters: this.generateKeywordClusters(userInput.topic, jsonResponse.keyThemes || []),
                conversationalQueries: jsonResponse.conversationalQueries || [],
                queryTypeDistribution: jsonResponse.queryTypeDistribution || jsonResponse.queryTypes || {
                    informational: 0.7,
                    transactional: 0.1,
                    navigational: 0.1,
                    commercial: 0.1
                },
                searchParameters: searchParams,
                timestamp: new Date().toISOString(),
                queryExpansion: {
                    expandedQueries: queryExpansion.expandedQueries,
                    semanticQueries: queryExpansion.semanticQueries,
                    relatedConcepts: queryExpansion.relatedConcepts
                },
                semanticSearchResults: searchResults.results.slice(0, 3)
            };
            await this.storeIntentAnalysis(intentAnalysis);
            return intentAnalysis;
        }
        catch (error) {
            this.logger.error(`Error analyzing user input intent: ${error.message}`);
            throw error;
        }
    }
    async analyzeSegmentIntent(userInput, segment) {
        try {
            this.logger.log(`Analyzing ${segment} intent for topic: ${userInput.topic}`);
            const systemPrompt = `You are an intent analysis expert for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} content.
        Analyze the provided topic specifically for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} audiences.
        Determine the primary and secondary intent specific to ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} contexts, confidence level, and provide recommendations.
        Return your analysis as valid JSON with the following structure:
        {
          "primaryIntent": "one of [informational, transactional, navigational, commercial]",
          "secondaryIntents": ["array of secondary intents"],
          "confidence": decimal between 0-1,
          "queryTypeDistribution": { "informational": decimal, "transactional": decimal, "navigational": decimal, "commercial": decimal },
          "conversationalQueries": [array of 3-5 related conversational queries],
          "keyThemes": [array of 3-7 key themes/topics relevant to the query],
          "suggestedApproach": "brief description of recommended content approach"
        }`;
            const userPrompt = `Analyze the following topic for ${segment} audience: ${userInput.topic}${userInput.context ? `\nContext: ${userInput.context}` : ''}${userInput.keywords ? `\nKeywords: ${userInput.keywords.join(', ')}` : ''}${userInput.industry ? `\nIndustry: ${userInput.industry}` : ''}${userInput.audience ? `\nTarget audience: ${userInput.audience}` : ''}${userInput.goals ? `\nGoals: ${userInput.goals}` : ''}`;
            const prompt = `${systemPrompt}\n\n${userPrompt}`;
            const completion = await this.azureAIService.generateCompletion(prompt, {
                deploymentName: this.aiFoundryDeploymentName,
                temperature: 0.3,
                maxTokens: 800
            });
            const responseText = await this.azureAIService.getCompletion(completion);
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            const jsonResponse = jsonMatch ? JSON.parse(jsonMatch[0]) : this.createDefaultResponse(userInput.topic, segment);
            const queryExpansion = await this.expandQuery(userInput.topic);
            const searchResults = await this.performSemanticSearch(userInput.topic, {
                top: 5,
                queryLanguage: 'en-us',
                filter: segment === 'b2b' ? 'audience eq \'business\'' : 'audience eq \'consumer\''
            });
            const searchParams = await this.generateSearchParametersForSegment(userInput.topic, jsonResponse.primaryIntent, segment, jsonResponse.keyThemes);
            const intentAnalysis = {
                id: (0, uuid_1.v4)(),
                topic: userInput.topic,
                segment,
                primaryIntent: jsonResponse.primaryIntent,
                secondaryIntents: jsonResponse.secondaryIntents || [jsonResponse.secondaryIntent],
                confidence: jsonResponse.confidence || 0.7,
                suggestedApproach: jsonResponse.suggestedApproach || await this.getSuggestedApproach(userInput.topic, jsonResponse.primaryIntent, segment),
                keyThemes: jsonResponse.keyThemes || [],
                keywordClusters: this.generateKeywordClusters(userInput.topic, jsonResponse.keyThemes || [], segment),
                conversationalQueries: jsonResponse.conversationalQueries || [],
                queryTypeDistribution: jsonResponse.queryTypeDistribution || jsonResponse.queryTypes || this.getDefaultQueryTypes(segment),
                searchParameters: searchParams,
                timestamp: new Date().toISOString(),
                queryExpansion: {
                    expandedQueries: queryExpansion.expandedQueries,
                    semanticQueries: queryExpansion.semanticQueries,
                    relatedConcepts: queryExpansion.relatedConcepts
                },
                semanticSearchResults: searchResults.results.slice(0, 3)
            };
            await this.storeIntentAnalysis(intentAnalysis);
            this.logger.log(`Intent analysis complete for topic: ${userInput.topic}`);
            return intentAnalysis;
        }
        catch (error) {
            this.logger.error(`Error analyzing segment intent: ${error.message}`);
            const defaultResponse = this.createDefaultResponse(userInput.topic, segment);
            return defaultResponse;
        }
    }
    async createContentStrategy(intentAnalysis, segment) {
        const topic = intentAnalysis.topic || '';
        const primaryIntent = intentAnalysis.primaryIntent || 'inform';
        return this.generateContentStrategy(topic, primaryIntent, segment);
    }
    async generateContentStrategy(topic, primaryIntent, segment) {
        try {
            const systemPrompt = `You are a content strategy expert for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} content.
        Create a comprehensive content strategy for the topic "${topic}" with primary intent of "${primaryIntent}".
        The strategy should include content structure, tonality guidelines, and content elements.
        Return the strategy as valid JSON with the following structure:
        {
          "contentType": "preferred content type for this topic and segment",
          "structure": ["array of content structure elements, 5-7 items"],
          "tonalityGuide": "guidance on tone and voice appropriate for ${segment} audience",
          "contentElements": ["key elements to include in the content"],
          "citationStrategy": "approach to citations and references",
          "suggestedLLMOptimizations": ["ways to optimize for AI consumption"]
        }`;
            const userPrompt = `Generate a content strategy for topic: "${topic}" with primary intent: ${primaryIntent} for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} audience.`;
            const prompt = `${systemPrompt}\n\n${userPrompt}`;
            const completion = await this.azureAIService.generateCompletion(prompt);
            const responseText = await this.azureAIService.getCompletion(completion);
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            let contentStrategy;
            if (jsonMatch) {
                contentStrategy = JSON.parse(jsonMatch[0]);
            }
            else {
                contentStrategy = this.getDefaultContentStrategy(primaryIntent, segment);
            }
            contentStrategy.timestamp = new Date().toISOString();
            return contentStrategy;
        }
        catch (error) {
            this.logger.warn(`Error generating content strategy: ${error.message}`);
            return this.getDefaultContentStrategy(primaryIntent, segment);
        }
    }
    getDefaultContentStrategy(intent, segment) {
        const strategy = {
            contentType: this.mapIntentToContentType(intent)[0],
            segment: segment,
            structure: [
                "Introduction and problem statement",
                "Key benefits and value proposition",
                "Supporting evidence and statistics",
                "Implementation steps or methodology",
                "Conclusion with call to action"
            ],
            tonalityGuide: segment === 'b2b' ?
                "Professional, authoritative, evidence-based with industry terminology" :
                "Approachable, clear, solutions-oriented with everyday language",
            contentElements: [
                "Data visualizations",
                "Expert quotes",
                "Real-world examples",
                "Action steps"
            ],
            citationStrategy: "Industry research with authoritative sources",
            suggestedLLMOptimizations: [
                "Clear section headers",
                "Bulleted lists for key points",
                "Summary paragraphs at section ends"
            ],
            timestamp: new Date().toISOString()
        };
        return strategy;
    }
    async generateSearchParametersForSegment(topic, intent, segment, keyThemes = []) {
        try {
            const segmentSpecificThemes = keyThemes.map(theme => `${theme} for ${segment === 'b2b' ? 'business' : 'consumer'} audience`);
            const systemPrompt = `You are a search optimization expert for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} content. 
      Generate optimized search parameters for the given topic, intent, and themes.`;
            const userPrompt = `Generate search parameters for:\nTopic: ${topic}\nIntent: ${intent}\nSegment: ${segment}\nKey themes: ${segmentSpecificThemes.join(', ')}`;
            const prompt = `${systemPrompt}\n\n${userPrompt}`;
            const completion = await this.azureAIService.generateCompletion(prompt);
            const responseText = await this.azureAIService.getCompletion(completion);
            const baseParams = await this.generateSearchParameters(topic, intent, keyThemes);
            if (segment === 'b2b') {
                baseParams.excludeDomains = [
                    ...baseParams.excludeDomains || [],
                    'medium.com',
                    'buzzfeed.com',
                    'reddit.com'
                ];
                baseParams.filters = Object.assign(Object.assign({}, baseParams.filters), { minLength: '1000', recency: 'last 2 years' });
            }
            else if (segment === 'b2c') {
                baseParams.excludeDomains = [
                    ...baseParams.excludeDomains || [],
                    'jstor.org',
                    'ieee.org',
                    'academia.edu'
                ];
                baseParams.filters = Object.assign(Object.assign({}, baseParams.filters), { minLength: '400', recency: 'recent' });
                baseParams.semanticBoost = true;
            }
            return baseParams;
        }
        catch (error) {
            this.logger.warn(`Failed to generate segment search parameters: ${error.message}`);
            const baseParams = await this.generateSearchParameters(topic, intent, keyThemes);
            return baseParams;
        }
    }
    createDefaultResponse(topic, segment) {
        const defaultIntent = segment === 'b2b' ? 'informational' : 'commercial';
        const defaultKeyThemes = [topic, ...topic.split(' ').filter(word => word.length > 3)];
        return {
            id: (0, uuid_1.v4)(),
            topic,
            segment,
            primaryIntent: defaultIntent,
            secondaryIntents: segment === 'b2b' ? ['commercial', 'navigational'] : ['informational', 'transactional'],
            keyThemes: defaultKeyThemes.slice(0, 5),
            confidence: 0.6,
            suggestedApproach: `Create ${defaultIntent} content about ${topic}${segment ? ` for ${segment} audience` : ''}`,
            searchParameters: {
                includeDomains: [],
                excludeDomains: ['pinterest.com', 'quora.com'],
                contentTypes: this.mapIntentToContentType(defaultIntent),
                timeframe: 'recent',
                filters: {
                    recency: 'recent',
                    contentTypes: this.mapIntentToContentType(defaultIntent),
                    minLength: segment === 'b2b' ? '1000' : '500'
                },
                semanticBoost: true
            },
            queryTypeDistribution: this.getDefaultQueryTypes(segment),
            timestamp: new Date().toISOString(),
            queryExpansion: {
                expandedQueries: [topic, `${topic} guide`, `${topic} examples`],
                semanticQueries: [`best ${topic}`, `${topic} tutorial`, `${topic} explained`],
                relatedConcepts: [topic.split(' ')[0]]
            },
            semanticSearchResults: []
        };
    }
    getDefaultQueryTypes(segment) {
        if (segment === 'b2b') {
            return {
                informational: 0.4,
                transactional: 0.3,
                navigational: 0.1,
                commercial: 0.2
            };
        }
        else if (segment === 'b2c') {
            return {
                informational: 0.3,
                transactional: 0.4,
                navigational: 0.1,
                commercial: 0.2
            };
        }
        else {
            return {
                informational: 0.35,
                transactional: 0.35,
                navigational: 0.1,
                commercial: 0.2
            };
        }
    }
    generateKeywordClusters(topic, themes, segment) {
        const baseClusters = [
            `${topic} overview`,
            `${topic} guide`,
            `${topic} tutorial`,
            `best ${topic} practices`
        ];
        if (segment === 'b2b') {
            baseClusters.push(`enterprise ${topic} solutions`, `${topic} for business`, `${topic} ROI`, `${topic} implementation strategy`);
        }
        else if (segment === 'b2c') {
            baseClusters.push(`${topic} for beginners`, `easy ${topic} guide`, `${topic} tips and tricks`, `affordable ${topic} options`);
        }
        if (themes && themes.length > 0) {
            const themeClusters = themes.map(theme => {
                if (!theme.toLowerCase().includes(topic.toLowerCase()) &&
                    !topic.toLowerCase().includes(theme.toLowerCase())) {
                    return `${topic} ${theme}`;
                }
                return theme;
            });
            return Array.from(new Set([...baseClusters, ...themeClusters]));
        }
        return baseClusters;
    }
    async getSuggestedApproach(topic, intent, segment) {
        try {
            const systemPrompt = 'You are a content strategy expert. Provide a concise, actionable content approach based on the topic and intent.';
            let userPrompt = `Generate a content approach suggestion for topic: "${topic}" with primary intent: ${intent}`;
            if (segment) {
                userPrompt += ` for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} audience.`;
            }
            const prompt = `${systemPrompt}\n\n${userPrompt}`;
            const completion = await this.azureAIService.generateCompletion(prompt);
            const responseText = await this.azureAIService.getCompletion(completion);
            return responseText.length > 200 ? responseText.substring(0, 197) + '...' : responseText;
        }
        catch (error) {
            this.logger.warn(`Failed to generate suggested approach: ${error.message}`);
            return `Create comprehensive content about ${topic} focusing on ${intent} aspects${segment ? ` for ${segment} audience` : ''}.`;
        }
    }
    async generateSearchParameters(topic, intent, keyThemes = []) {
        try {
            const contentTypes = this.mapIntentToContentType(intent);
            const queryExpansion = await this.expandQuery(topic);
            return {
                includeDomains: [],
                excludeDomains: ['pinterest.com', 'quora.com'],
                contentTypes,
                filters: {
                    recency: intent === 'informational' ? 'last_year' : 'last_month',
                    contentTypes,
                    minLength: '500'
                },
                semanticBoost: true,
                timeframe: intent === 'informational' ? 'any' : 'recent',
                expandedQueries: queryExpansion.expandedQueries,
                semanticQueries: queryExpansion.semanticQueries
            };
        }
        catch (error) {
            this.logger.warn(`Failed to generate search parameters: ${error.message}`);
            return {
                includeDomains: [],
                excludeDomains: ['pinterest.com', 'quora.com'],
                contentTypes: this.mapIntentToContentType(intent),
                timeframe: 'recent',
                filters: {
                    recency: 'recent',
                    contentTypes: this.mapIntentToContentType(intent),
                    minLength: '600'
                }
            };
        }
    }
    async expandQuery(query) {
        try {
            this.logger.log(`Expanding query: ${query}`);
            const prompt = `You are a query expansion expert. For the given topic or query, generate:
      1. Five expanded queries that are variations of the original query with different phrasings
      2. Five semantic queries that capture the same intent but use different terminology
      3. Five related concepts that are relevant to the query topic
      
      Return a valid JSON object with the following structure:
      {
        "expandedQueries": ["array of expanded queries"],
        "semanticQueries": ["array of semantic queries"],
        "relatedConcepts": ["array of related concepts"],
        "confidence": decimal between 0-1
      }
      
      Original query: "${query}"
      Return only valid JSON.`;
            const completion = await this.azureAIService.generateCompletion(prompt, {
                deploymentName: this.aiFoundryDeploymentName,
                temperature: 0.5,
                maxTokens: 800
            });
            const responseText = await this.azureAIService.getCompletion(completion);
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            let jsonResponse;
            if (jsonMatch) {
                jsonResponse = JSON.parse(jsonMatch[0]);
            }
            else {
                this.logger.warn(`Failed to parse JSON from query expansion response. Using default expansion.`);
                jsonResponse = this.createDefaultQueryExpansion(query);
            }
            const result = {
                originalQuery: query,
                expandedQueries: jsonResponse.expandedQueries || [],
                semanticQueries: jsonResponse.semanticQueries || [],
                relatedConcepts: jsonResponse.relatedConcepts || [],
                confidence: jsonResponse.confidence || 0.7
            };
            this.logger.log(`Query expansion complete for: ${query}`);
            return result;
        }
        catch (error) {
            this.logger.error(`Error expanding query: ${error.message}`);
            return this.createDefaultQueryExpansion(query);
        }
    }
    createDefaultQueryExpansion(query) {
        return {
            originalQuery: query,
            expandedQueries: [
                `${query} guide`,
                `${query} tutorial`,
                `how to ${query}`,
                `${query} best practices`,
                `${query} examples`
            ],
            semanticQueries: [
                `learn about ${query}`,
                `understanding ${query}`,
                `${query} explained`,
                `${query} overview`,
                `${query} introduction`
            ],
            relatedConcepts: [
                query,
                `${query} tools`,
                `${query} techniques`,
                `${query} methods`,
                `${query} strategies`
            ],
            confidence: 0.5
        };
    }
    async performSemanticSearch(query, options = {}) {
        try {
            this.logger.log(`Performing semantic search for: ${query}`);
            if (!this.searchEndpoint || !this.searchKey) {
                this.logger.warn('Azure AI Search not configured. Using simulated search results.');
                return this.simulateSearchResults(query);
            }
            const startTime = Date.now();
            const searchUrl = `${this.searchEndpoint}/indexes/${this.searchIndexName}/docs/search?api-version=2023-11-01`;
            const searchPayload = {
                search: query,
                queryType: 'semantic',
                semanticConfiguration: 'default',
                top: options.top || 10,
                select: options.select || 'title,url,content,snippet',
                searchFields: options.searchFields || ['title', 'content'],
                queryLanguage: options.queryLanguage || 'en-us',
                captions: 'extractive',
                answers: 'extractive',
                filter: options.filter || ''
            };
            const response = await axios_1.default.post(searchUrl, searchPayload, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.searchKey
                }
            });
            const executionTime = Date.now() - startTime;
            const results = response.data.value.map(item => ({
                title: item.title || '',
                url: item.url || '',
                snippet: item.snippet || item.content || '',
                score: item['@search.score'] || 0
            }));
            return {
                query,
                results,
                totalResults: response.data['@odata.count'] || results.length,
                executionTime
            };
        }
        catch (error) {
            this.logger.error(`Error performing semantic search: ${error.message}`);
            return this.simulateSearchResults(query);
        }
    }
    simulateSearchResults(query) {
        return {
            query,
            results: [
                {
                    title: `${query} - Comprehensive Guide`,
                    url: `https://example.com/${query.toLowerCase().replace(/\s+/g, '-')}-guide`,
                    snippet: `This comprehensive guide covers everything you need to know about ${query}. Learn the fundamentals, advanced techniques, and best practices.`,
                    score: 0.95
                },
                {
                    title: `Understanding ${query} - Tutorial`,
                    url: `https://example.com/tutorials/${query.toLowerCase().replace(/\s+/g, '-')}`,
                    snippet: `Step-by-step tutorial on ${query}. Follow along with practical examples and code samples to master the concepts.`,
                    score: 0.85
                },
                {
                    title: `${query} Best Practices`,
                    url: `https://example.com/best-practices/${query.toLowerCase().replace(/\s+/g, '-')}`,
                    snippet: `Learn the industry-standard best practices for ${query}. Avoid common pitfalls and optimize your approach.`,
                    score: 0.75
                }
            ],
            totalResults: 3,
            executionTime: 50
        };
    }
    getStrategyTemplate(intent, segment) {
        if (segment === 'b2b') {
            return {
                structure: [
                    'Executive Summary',
                    'Industry Context',
                    'Challenge Analysis',
                    'Solution Framework',
                    'Implementation Guide',
                    'Case Examples',
                    'ROI Analysis',
                    'Next Steps'
                ],
                tonality: 'Professional, authoritative, data-driven, strategic',
                contentElements: ['Industry statistics', 'Technical specifications', 'Process diagrams', 'ROI calculators', 'Expert quotes'],
                citationStrategy: 'Academic and industry research, technical documentation, case studies',
                llmOptimizations: ['Comprehensive topic coverage', 'Technical accuracy', 'Industry terminology', 'Problem-solution framework']
            };
        }
        else {
            return {
                structure: [
                    'Engaging Hook',
                    'Relatable Problem',
                    'Solution Introduction',
                    'Benefits Overview',
                    'How-To Guide',
                    'Success Stories',
                    'Emotional Appeal',
                    'Call to Action'
                ],
                tonality: 'Conversational, empathetic, engaging, inspiring',
                contentElements: ['Personal stories', 'Visual elements', 'Step-by-step guides', 'Before/after scenarios', 'Social proof'],
                citationStrategy: 'Consumer testimonials, product reviews, lifestyle publications, expert opinions',
                llmOptimizations: ['Question-answer format', 'Emotional engagement', 'Benefits focus', 'Relatable examples']
            };
        }
    }
    getDefaultApproachBySegment(intent, segment) {
        const approaches = {
            b2b: {
                'informational': 'Develop in-depth, authoritative content that clearly addresses business pain points and provides actionable insights',
                'commercial': 'Create solution-focused content that highlights ROI, scalability, and integration with existing business processes',
                'navigational': 'Provide clear, structured information architecture with easy paths to product specifications and technical documentation',
                'transactional': 'Develop streamlined content that facilitates purchasing decisions with clear pricing models and case studies',
                'comparison': 'Create detailed comparison frameworks that evaluate solutions based on business-critical features and scalability'
            },
            b2c: {
                'informational': 'Create accessible, engaging content that answers common questions and provides value without technical jargon',
                'commercial': 'Develop persuasive content that emphasizes benefits, lifestyle improvements, and addresses personal pain points',
                'navigational': 'Create intuitive guides and visual navigation that helps users find relevant products and information quickly',
                'transactional': 'Develop content that builds trust and simplifies the purchase process with clear CTAs and testimonials',
                'comparison': 'Create balanced comparison content that helps consumers make confident decisions based on personal needs'
            }
        };
        return approaches[segment][intent] || 'Develop comprehensive content with clear value proposition and actionable insights';
    }
};
exports.QueryIntentAnalyzerService = QueryIntentAnalyzerService;
exports.QueryIntentAnalyzerService = QueryIntentAnalyzerService = QueryIntentAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        azure_ai_service_1.AzureAIService])
], QueryIntentAnalyzerService);
//# sourceMappingURL=query-intent-analyzer.service.js.map