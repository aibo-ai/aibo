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
const redis_cache_service_1 = require("../../../shared/services/redis-cache.service");
const intentClassifier_1 = require("./intentClassifier");
const queryGenerator_1 = require("./queryGenerator");
const searchParameterGenerator_1 = require("./searchParameterGenerator");
const uuid_1 = require("uuid");
const axios_1 = require("axios");
let QueryIntentAnalyzerService = QueryIntentAnalyzerService_1 = class QueryIntentAnalyzerService {
    constructor(configService, azureAIService, redisCacheService, intentClassifier, queryGenerator, searchParameterGenerator) {
        this.configService = configService;
        this.azureAIService = azureAIService;
        this.redisCacheService = redisCacheService;
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
    async analyzeIntent(userInput, segment) {
        try {
            const input = typeof userInput === 'string' ? { topic: userInput } : userInput;
            const targetSegment = segment || 'b2b';
            const cacheKey = `intent_analysis:${input.topic.toLowerCase().replace(/\s+/g, '_')}:${targetSegment}`;
            return await this.redisCacheService.getOrSet(cacheKey, async () => {
                const existingAnalysis = await this.retrieveIntentAnalysis(input.topic, targetSegment);
                if (existingAnalysis) {
                    this.logger.log(`Using database intent analysis for topic: ${input.topic}`);
                    return existingAnalysis;
                }
                const analysis = await this.analyzeSegmentIntent(input, targetSegment);
                return analysis;
            }, 86400);
        }
        catch (error) {
            this.logger.error(`Error analyzing intent: ${error.message}`);
            return this.createDefaultResponse(typeof userInput === 'string' ? userInput : userInput.topic);
        }
    }
    async analyzeSegmentIntent(userInput, segment) {
        try {
            const prompt = `Analyze the intent behind the topic "${userInput.topic}" for ${segment === 'b2b' ? 'business-to-business' : 'business-to-consumer'} audience.`;
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
            const searchParams = await this.searchParameterGenerator.generateSearchParameters(userInput.topic, result.primaryIntent);
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
    async retrieveIntentAnalysis(topic, segment) {
        try {
            const cacheKey = `cosmos_intent:${topic.toLowerCase().replace(/\s+/g, '_')}:${segment}`;
            return await this.redisCacheService.getOrSet(cacheKey, async () => {
                const querySpec = {
                    query: 'SELECT * FROM c WHERE c.segment = @segment AND c.topic = @topic ORDER BY c._ts DESC OFFSET 0 LIMIT 1',
                    parameters: [
                        { name: '@topic', value: topic },
                        { name: '@segment', value: segment }
                    ]
                };
                const feedOptions = {
                    maxItemCount: 1
                };
                const { resources } = await this.queryIntentsContainer.items
                    .query(querySpec, feedOptions)
                    .fetchAll();
                if (resources.length > 0) {
                    return resources[0];
                }
                return null;
            }, 3600);
        }
        catch (error) {
            this.logger.error(`Error retrieving intent analysis: ${error.message}`);
            return null;
        }
    }
    async storeIntentAnalysis(intentAnalysis) {
        try {
            await this.queryIntentsContainer.items.upsert(intentAnalysis);
            this.logger.log(`Intent analysis stored for topic: ${intentAnalysis.topic}`);
            const cacheKey = `intent_analysis:${intentAnalysis.topic.toLowerCase().replace(/\s+/g, '_')}:${intentAnalysis.segment}`;
            await this.redisCacheService.set(cacheKey, intentAnalysis, 86400);
            const cosmosKey = `cosmos_intent:${intentAnalysis.topic.toLowerCase().replace(/\s+/g, '_')}:${intentAnalysis.segment}`;
            await this.redisCacheService.set(cosmosKey, intentAnalysis, 3600);
        }
        catch (error) {
            this.logger.error(`Failed to store intent analysis: ${error.message}`);
        }
    }
    generateKeywordClusters(topic, themes, segment) {
        const baseKeywords = [
            `${topic} guide`,
            `${topic} tutorial`,
            `${topic} best practices`,
            `${topic} examples`
        ];
        const themeKeywords = themes.map(theme => [
            `${topic} ${theme}`,
            `${theme} in ${topic}`,
            `how to use ${theme} with ${topic}`,
            `${topic} ${theme} examples`
        ]).flat();
        const segmentKeywords = segment ? (segment === 'b2b' ? [
            `${topic} for business`,
            `enterprise ${topic} solutions`,
            `${topic} ROI`,
            `${topic} implementation`,
            `${topic} integration`
        ] : [
            `${topic} for consumers`,
            `personal ${topic}`,
            `${topic} benefits`,
            `easy ${topic}`,
            `${topic} for beginners`
        ]) : [];
        return Array.from(new Set([...baseKeywords, ...themeKeywords, ...segmentKeywords]));
    }
    async getSuggestedApproach(topic, intent, segment) {
        try {
            const prompt = 'Generate a content strategy approach for ' + topic + ' with ' + intent +
                ' intent for ' + (segment === 'b2b' ? 'business-to-business' : 'business-to-consumer') + ' audience.';
            const completion = await this.azureAIService.generateCompletion(prompt, {
                deploymentName: this.aiFoundryDeploymentName,
                temperature: 0.7,
                maxTokens: 200
            });
            const response = await this.azureAIService.getCompletion(completion);
            return response.trim();
        }
        catch (error) {
            this.logger.warn('Failed to generate suggested approach: ' + error.message);
            return this.getDefaultContentStrategy(intent, segment);
        }
    }
    getDefaultContentStrategy(intent, segment) {
        const approaches = {
            b2b: {
                'informational': 'Create in-depth, data-driven content that establishes thought leadership and addresses industry pain points',
                'commercial': 'Develop ROI-focused content that emphasizes business value, scalability, and integration capabilities',
                'navigational': 'Create structured, solution-oriented content with clear pathways to technical documentation and support',
                'transactional': 'Develop streamlined content that facilitates purchasing decisions with clear pricing models and case studies',
                'comparison': 'Create detailed comparison frameworks that evaluate solutions based on business-critical features and scalability'
            },
            b2c: {
                'informational': 'Create accessible, engaging content that answers common questions and provides value without technical jargon',
                'commercial': 'Develop persuasive content that emphasizes benefits, lifestyle improvements, and addresses personal pain points',
                'navigational': 'Create intuitive, user-friendly content that guides consumers through options with clear next steps',
                'transactional': 'Develop concise content that simplifies decision-making with compelling calls-to-action',
                'comparison': 'Create easy-to-understand comparison content that highlights key differences in features, pricing, and user benefits'
            }
        };
        return approaches[segment][intent.toLowerCase()] ||
            'Create valuable content that addresses user needs with clear structure and actionable insights';
    }
    getDefaultQueryTypes(segment) {
        if (segment === 'b2b') {
            return {
                informational: 0.5,
                navigational: 0.2,
                commercial: 0.2,
                transactional: 0.05,
                comparison: 0.05
            };
        }
        else if (segment === 'b2c') {
            return {
                informational: 0.4,
                navigational: 0.15,
                commercial: 0.15,
                transactional: 0.2,
                comparison: 0.1
            };
        }
        else {
            return {
                informational: 0.6,
                navigational: 0.2,
                commercial: 0.1,
                transactional: 0.05,
                comparison: 0.05
            };
        }
    }
    convertToLocalSearchParameters(externalParams) {
        var _a, _b, _c;
        return {
            includeDomains: Array.isArray(externalParams.includeDomains) ? externalParams.includeDomains : [],
            excludeDomains: Array.isArray(externalParams.excludeDomains) ? externalParams.excludeDomains : [],
            contentTypes: Array.isArray(externalParams.contentTypes) ? externalParams.contentTypes : ['article', 'blog'],
            timeframe: externalParams.timeframe || 'recent',
            filters: {
                recency: ((_a = externalParams.filters) === null || _a === void 0 ? void 0 : _a.recency) || 'last_year',
                contentTypes: Array.isArray((_b = externalParams.filters) === null || _b === void 0 ? void 0 : _b.contentTypes) ?
                    externalParams.filters.contentTypes : ['article', 'blog'],
                minLength: ((_c = externalParams.filters) === null || _c === void 0 ? void 0 : _c.minLength) || '500'
            },
            semanticBoost: externalParams.semanticBoost !== undefined ? externalParams.semanticBoost : true,
            expandedQueries: Array.isArray(externalParams.expandedQueries) ? externalParams.expandedQueries : [],
            semanticQueries: Array.isArray(externalParams.semanticQueries) ? externalParams.semanticQueries : []
        };
    }
    createDefaultResponse(topic, segment) {
        const timestamp = new Date().toISOString();
        const defaultIntent = 'informational';
        const defaultSearchParams = {
            includeDomains: [],
            excludeDomains: [],
            contentTypes: ['article', 'blog', 'guide'],
            timeframe: 'last_year',
            filters: {
                recency: segment === 'b2b' ? 'last_year' : 'last_month',
                contentTypes: this.mapIntentToContentType(defaultIntent),
                minLength: segment === 'b2b' ? '2000' : '1000'
            },
            semanticBoost: true,
            expandedQueries: [topic + ' guide', topic + ' tutorial'],
            semanticQueries: ['how to use ' + topic, 'learn about ' + topic]
        };
        return {
            id: (0, uuid_1.v4)(),
            topic,
            segment,
            primaryIntent: defaultIntent,
            secondaryIntents: ['navigational'],
            keyThemes: [topic + ' basics', topic + ' examples', topic + ' best practices'],
            searchParameters: defaultSearchParams,
            timestamp,
            confidence: 0.5,
            suggestedApproach: segment ?
                this.getDefaultContentStrategy(defaultIntent, segment) :
                'Create informational content focusing on basic concepts and practical examples',
            intentScores: {
                informational: 0.7,
                navigational: 0.2,
                transactional: 0.05,
                commercial: 0.05
            },
            expandedQueries: [topic + ' guide', topic + ' tutorial', topic + ' examples'],
            semanticQueries: ['how to use ' + topic, 'learn about ' + topic],
            relatedConcepts: [topic + ' basics', topic + ' fundamentals'],
            queryExpansion: {
                expandedQueries: [topic + ' guide', topic + ' tutorial', topic + ' examples'],
                semanticQueries: ['how to use ' + topic, 'learn about ' + topic],
                relatedConcepts: [topic + ' basics', topic + ' fundamentals']
            },
            semanticSearchResults: []
        };
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
    async performSemanticSearch(query, options) {
        try {
            const optionsHash = JSON.stringify(options || {});
            const cacheKey = `semantic_search:${query.toLowerCase().replace(/\s+/g, '_')}:${Buffer.from(optionsHash).toString('base64').substring(0, 10)}`;
            return await this.redisCacheService.getOrSet(cacheKey, async () => {
                if (!this.searchEndpoint || !this.searchKey) {
                    throw new Error('Azure AI Search configuration is incomplete');
                }
                const searchUrl = `${this.searchEndpoint}/indexes/${this.searchIndexName}/docs/search?api-version=2023-07-01-Preview`;
                const headers = {
                    'Content-Type': 'application/json',
                    'api-key': this.searchKey
                };
                const searchBody = {
                    search: query,
                    queryType: 'semantic',
                    semanticConfiguration: 'default',
                    top: (options === null || options === void 0 ? void 0 : options.top) || 10,
                    queryLanguage: (options === null || options === void 0 ? void 0 : options.queryLanguage) || 'en-us',
                    filter: (options === null || options === void 0 ? void 0 : options.filter) || '',
                    select: 'title,url,content,description,name'
                };
                const response = await axios_1.default.post(searchUrl, searchBody, { headers });
                const results = response.data.value.map(item => ({
                    title: item.title || item.name || '',
                    url: item.url || '',
                    snippet: item.content || item.description || '',
                    score: item['@search.score'] || 0
                }));
                return {
                    query,
                    results,
                    totalResults: response.data['@odata.count'] || results.length,
                    executionTime: response.data['@search.latency'] || 0
                };
            }, 1800);
        }
        catch (error) {
            this.logger.warn(`Semantic search failed: ${error.message}`);
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
        redis_cache_service_1.RedisCacheService,
        intentClassifier_1.IntentClassifier,
        queryGenerator_1.QueryGenerator,
        searchParameterGenerator_1.SearchParameterGenerator])
], QueryIntentAnalyzerService);
//# sourceMappingURL=query-intent-analyzer.service.js.map