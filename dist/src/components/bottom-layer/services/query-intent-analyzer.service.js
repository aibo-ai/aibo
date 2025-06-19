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
const intentClassifier_1 = require("./intentClassifier");
const queryGenerator_1 = require("./queryGenerator");
const searchParameterGenerator_1 = require("./searchParameterGenerator");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
let QueryIntentAnalyzerService = QueryIntentAnalyzerService_1 = class QueryIntentAnalyzerService {
    constructor(configService, azureAIService, intentClassifier, queryGenerator, searchParameterGenerator) {
        this.configService = configService;
        this.azureAIService = azureAIService;
        this.intentClassifier = intentClassifier;
        this.queryGenerator = queryGenerator;
        this.searchParameterGenerator = searchParameterGenerator;
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
        this.cosmosClient = new cosmos_1.CosmosClient({ endpoint: cosmosEndpoint, key: cosmosKey });
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
                partitionKey: { paths: ['/topic'] }
            });
            this.container = container;
            this.queryIntentsContainer = container;
            this.logger.log(`Container '${this.containerId}' initialized`);
            const { container: strategyContainer } = await this.database.containers.createIfNotExists({
                id: this.strategyContainerId,
                partitionKey: { paths: ['/contentType'] }
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
            this.logger.log(`Analyzing intent for topic: ${topic}`);
            const intentResult = await this.intentClassifier.classifyIntent(topic);
            const searchParams = await this.searchParameterGenerator.generateSearchParameters(topic, intentResult.primaryIntent, intentResult.keyThemes);
            const queryExpansion = await this.queryGenerator.generateConversationalQueries(topic, intentResult);
            const keywordClusters = this.generateKeywordClusters(topic, intentResult.keyThemes);
            const suggestedApproach = await this.getSuggestedApproach(topic, intentResult.primaryIntent);
            const intentAnalysis = {
                id: (0, uuid_1.v4)(),
                topic,
                primaryIntent: intentResult.primaryIntent,
                secondaryIntents: intentResult.secondaryIntents || [],
                keyThemes: intentResult.keyThemes || [],
                keywordClusters,
                queryTypeDistribution: this.getDefaultQueryTypes(),
                searchParameters: this.convertToLocalSearchParameters(searchParams),
                timestamp: new Date().toISOString(),
                confidence: intentResult.confidence || 0.7,
                suggestedApproach,
                intentScores: intentResult.intentScores || {
                    informational: 0,
                    navigational: 0,
                    transactional: 0,
                    commercial: 0
                },
                expandedQueries: queryExpansion.expandedQueries,
                semanticQueries: queryExpansion.semanticQueries,
                relatedConcepts: queryExpansion.relatedConcepts,
                conversationalQueries: queryExpansion.conversationalQueries || [],
                queryExpansion: {
                    expandedQueries: queryExpansion.expandedQueries,
                    semanticQueries: queryExpansion.semanticQueries,
                    relatedConcepts: queryExpansion.relatedConcepts
                }
            };
            await this.storeIntentAnalysis(intentAnalysis);
            return intentAnalysis;
        }
        catch (error) {
            this.logger.error(`Error analyzing topic intent: ${error.message}`);
            return this.createDefaultResponse(topic);
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
                secondaryIntents: jsonResponse.secondaryIntents || [],
                confidence: jsonResponse.confidence || 0.7,
                suggestedApproach,
                keyThemes: jsonResponse.keyThemes || [],
                keywordClusters: this.generateKeywordClusters(userInput.topic, jsonResponse.keyThemes || []),
                conversationalQueries: jsonResponse.conversationalQueries || [],
                queryTypeDistribution: jsonResponse.queryTypeDistribution || this.getDefaultQueryTypes(),
                searchParameters: searchParams,
                timestamp: new Date().toISOString(),
                expandedQueries: queryExpansion.expandedQueries,
                semanticQueries: queryExpansion.semanticQueries,
                relatedConcepts: queryExpansion.relatedConcepts,
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
            const result = jsonMatch ? JSON.parse(jsonMatch[0]) : this.createDefaultResponse(userInput.topic, segment);
            const queryExpansion = await this.queryGenerator.generateConversationalQueries(userInput.topic, result);
            const searchResults = await this.performSemanticSearch(userInput.topic, {
                top: 5,
                queryLanguage: 'en-us',
                filter: segment === 'b2b' ? 'audience eq \'business\'' : 'audience eq \'consumer\''
            });
            const searchParams = await this.searchParameterGenerator.generateSearchParameters(userInput.topic, result.primaryIntent, result.keyThemes, segment);
            const intentAnalysis = {
                id: (0, uuid_1.v4)(),
                topic: userInput.topic,
                segment,
                primaryIntent: result.primaryIntent,
                secondaryIntents: result.secondaryIntents || [],
                confidence: result.confidence || 0.7,
                suggestedApproach: result.suggestedApproach || await this.getSuggestedApproach(userInput.topic, result.primaryIntent, segment),
                keyThemes: result.keyThemes || [],
                keywordClusters: this.generateKeywordClusters(userInput.topic, result.keyThemes || [], segment),
                conversationalQueries: result.conversationalQueries || [],
                queryTypeDistribution: result.queryTypeDistribution || this.getDefaultQueryTypes(segment),
                searchParameters: searchParams,
                timestamp: new Date().toISOString(),
                expandedQueries: queryExpansion.expandedQueries,
                semanticQueries: queryExpansion.semanticQueries,
                relatedConcepts: queryExpansion.relatedConcepts,
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
    getDefaultContentStrategy(intent, segment) {
        const template = {
            contentType: this.mapIntentToContentType(intent)[0],
            segment: segment,
            structure: [
                'Introduction and problem statement',
                'Key benefits and value proposition',
                'Supporting evidence and statistics',
                'Implementation steps or methodology',
                'Conclusion with call to action'
            ],
            tonalityGuide: segment === 'b2b' ? 'Professional, authoritative, evidence-based with industry terminology' : 'Approachable, clear, solutions-oriented with everyday language',
            contentElements: [
                'Data visualizations',
                'Expert quotes',
                'Real-world examples',
                'Action steps'
            ],
            citationStrategy: 'Industry research with authoritative sources',
            suggestedLLMOptimizations: [
                'Clear section headers',
                'Bulleted lists for key points',
                'Summary paragraphs at section ends'
            ],
            timestamp: new Date().toISOString()
        };
        const defaultContentStrategy = Object.assign(Object.assign({ id: (0, uuid_1.v4)() }, template), { expandedQueries: [], semanticQueries: [], relatedConcepts: [] });
        return defaultContentStrategy;
    }
    createDefaultResponse(topic, segment) {
        const defaultIntent = segment === 'b2b' ? 'informational' : 'commercial';
        const defaultKeyThemes = [topic, ...topic.split(' ').filter(word => word.length > 3)];
        const intentAnalysis = {
            id: (0, uuid_1.v4)(),
            topic,
            segment,
            primaryIntent: defaultIntent,
            secondaryIntents: segment === 'b2b' ? ['commercial'] : ['informational'],
            keyThemes: defaultKeyThemes.slice(0, 5),
            confidence: 0.6,
            suggestedApproach: this.getDefaultApproachBySegment(defaultIntent, segment),
            searchParameters: {
                includeDomains: [],
                excludeDomains: ['pinterest.com', 'quora.com'],
                contentTypes: this.mapIntentToContentType(defaultIntent),
                timeframe: 'recent',
                filters: {
                    recency: 'recent',
                    contentTypes: this.mapIntentToContentType(defaultIntent),
                    minLength: segment === 'b2b' ? '2000' : '1000'
                },
                semanticBoost: true
            },
            queryTypeDistribution: this.getDefaultQueryTypes(segment),
            timestamp: new Date().toISOString(),
            expandedQueries: [`${topic} guide`, `${topic} tutorial`, `${topic} examples`],
            semanticQueries: [`how to understand ${topic}`, `learn about ${topic}`],
            relatedConcepts: [`${topic} basics`, `${topic} fundamentals`],
            queryExpansion: {
                expandedQueries: [`${topic} guide`, `${topic} tutorial`, `${topic} examples`],
                semanticQueries: [`how to understand ${topic}`, `learn about ${topic}`],
                relatedConcepts: [`${topic} basics`, `${topic} fundamentals`]
            },
            semanticSearchResults: []
        };
        return intentAnalysis;
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
    getDefaultApproachBySegment(intent, segment) {
        if (segment === 'b2b') {
            if (intent === 'informational') {
                return 'Create in-depth, data-driven content that establishes thought leadership and addresses business pain points.';
            }
            else if (intent === 'commercial') {
                return 'Develop ROI-focused content that highlights business value and competitive advantages.';
            }
            else {
                return 'Create solution-oriented content that guides business decision-makers through the evaluation process.';
            }
        }
        else {
            if (intent === 'informational') {
                return 'Create accessible, engaging content that educates consumers and builds brand awareness.';
            }
            else if (intent === 'commercial') {
                return 'Develop benefit-focused content that emphasizes value and addresses consumer pain points.';
            }
            else {
                return 'Create practical content that guides consumers through their decision journey with clear CTAs.';
            }
        }
    }
    async expandQuery(query) {
        try {
            this.logger.log(`Expanding query: ${query}`);
            const result = await this.queryGenerator.generateConversationalQueries(query);
            return {
                originalQuery: query,
                expandedQueries: result.expandedQueries || [],
                semanticQueries: result.semanticQueries || [],
                relatedConcepts: result.relatedConcepts || [],
                confidence: result.confidence || 0.7
            };
        }
        catch (error) {
            this.logger.error(`Error expanding query: ${error.message}`);
            return {
                originalQuery: query,
                expandedQueries: [`${query} guide`, `${query} tutorial`, `${query} examples`],
                semanticQueries: [`how to understand ${query}`, `learn about ${query}`],
                relatedConcepts: [`${query} basics`, `${query} fundamentals`],
                confidence: 0.5
            };
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
                },
                semanticBoost: true,
                expandedQueries: [],
                semanticQueries: []
            };
        }
    }
    async generateSearchParametersForSegment(topic, intent, segment, keyThemes = []) {
        try {
            const contentTypes = this.mapIntentToContentType(intent);
            const queryExpansion = await this.expandQuery(topic);
            const minLength = segment === 'b2b' ? '1500' : '800';
            const timeframe = segment === 'b2b' ?
                (intent === 'informational' ? 'any' : 'last_year') :
                (intent === 'informational' ? 'last_year' : 'last_month');
            return {
                includeDomains: [],
                excludeDomains: ['pinterest.com', 'quora.com'],
                contentTypes,
                filters: {
                    recency: segment === 'b2b' ? 'last_year' : 'last_month',
                    contentTypes,
                    minLength
                },
                semanticBoost: true,
                timeframe,
                expandedQueries: queryExpansion.expandedQueries,
                semanticQueries: queryExpansion.semanticQueries
            };
        }
        catch (error) {
            this.logger.warn(`Failed to generate segment-specific search parameters: ${error.message}`);
            return {
                includeDomains: [],
                excludeDomains: ['pinterest.com', 'quora.com'],
                contentTypes: this.mapIntentToContentType(intent),
                timeframe: segment === 'b2b' ? 'any' : 'recent',
                filters: {
                    recency: segment === 'b2b' ? 'last_year' : 'recent',
                    contentTypes: this.mapIntentToContentType(intent),
                    minLength: segment === 'b2b' ? '1500' : '800'
                },
                semanticBoost: true,
                expandedQueries: [],
                semanticQueries: []
            };
        }
    }
    async performSemanticSearch(query, options = {}) {
        try {
            this.logger.log(`Performing semantic search for: ${query}`);
            if (!this.searchEndpoint || !this.searchKey) {
                this.logger.warn('Azure AI Search not configured. Returning empty results.');
                return {
                    query,
                    results: [],
                    totalResults: 0,
                    executionTime: 0
                };
            }
            const searchResults = await this.azureAIService.performSearch(query, Object.assign(Object.assign({}, options), { searchEndpoint: this.searchEndpoint, searchKey: this.searchKey, indexName: this.searchIndexName }));
            return searchResults;
        }
        catch (error) {
            this.logger.error(`Error performing semantic search: ${error.message}`);
            return {
                query,
                results: [],
                totalResults: 0,
                executionTime: 0
            };
        }
    }
};
exports.QueryIntentAnalyzerService = QueryIntentAnalyzerService;
exports.QueryIntentAnalyzerService = QueryIntentAnalyzerService = QueryIntentAnalyzerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        azure_ai_service_1.AzureAIService,
        intentClassifier_1.IntentClassifier,
        queryGenerator_1.QueryGenerator,
        searchParameterGenerator_1.SearchParameterGenerator])
], QueryIntentAnalyzerService);
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
async;
expandQuery(query, string);
Promise < QueryExpansionResult > {
    try: {
        this: .logger.log(`Expanding query: ${query}`),
        const: prompt = `You are a query expansion expert. For the given topic or query, generate:
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
      Return only valid JSON.`,
        const: completion = await this.azureAIService.generateCompletion(prompt, {
            deploymentName: this.aiFoundryDeploymentName,
            temperature: 0.5,
            maxTokens: 800
        }),
        const: responseText = await this.azureAIService.getCompletion(completion),
        const: jsonMatch = responseText.match(/\{[\s\S]*\}/),
        let, jsonResponse,
        if(jsonMatch) {
            jsonResponse = JSON.parse(jsonMatch[0]);
        }, else: {
            this: .logger.warn(`Failed to parse JSON from query expansion response. Using default expansion.`),
            jsonResponse = this.createDefaultQueryExpansion(query)
        },
        const: result, QueryExpansionResult = {
            originalQuery: query,
            expandedQueries: jsonResponse.expandedQueries || [],
            semanticQueries: jsonResponse.semanticQueries || [],
            relatedConcepts: jsonResponse.relatedConcepts || [],
            confidence: jsonResponse.confidence || 0.7
        },
        this: .logger.log(`Query expansion complete for: ${query}`),
        return: result
    }, catch(error) {
        this.logger.error(`Error expanding query: ${error.message}`);
        return this.createDefaultQueryExpansion(query);
    }
};
createDefaultQueryExpansion(query, string);
QueryExpansionResult;
{
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
async;
performSemanticSearch(query, string, options, any = {});
Promise < SemanticSearchResult > {
    try: {
        this: .logger.log(`Performing semantic search for: ${query}`),
        : .searchEndpoint || !this.searchKey
    }
};
{
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
try { }
catch (error) {
    this.logger.error(`Error performing semantic search: ${error.message}`);
    return this.simulateSearchResults(query);
}
simulateSearchResults(query, string);
SemanticSearchResult;
{
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
getStrategyTemplate(intent, string, segment, 'b2b' | 'b2c');
any;
{
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
getDefaultApproachBySegment(intent, string, segment, Segment);
string;
{
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
//# sourceMappingURL=query-intent-analyzer.service.js.map