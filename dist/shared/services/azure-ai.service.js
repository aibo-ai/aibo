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
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var AzureAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureAIService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("axios");
const openai_1 = require("@azure/openai");
const search_documents_1 = require("@azure/search-documents");
let AzureAIService = AzureAIService_1 = class AzureAIService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AzureAIService_1.name);
        this.aiFoundryEndpoint = this.configService.get('AZURE_AI_FOUNDRY_ENDPOINT');
        this.aiFoundryKey = this.configService.get('AZURE_AI_FOUNDRY_KEY');
        this.aiFoundryDeploymentUrl = this.configService.get('AZURE_AU_FOUNDRY_DEPLOYMENT_URL');
        this.aiFoundryDeploymentName = this.configService.get('AZURE_AI_FOUNDRY_DEPLOYMENT_NAME');
        this.aiFoundryApiVersion = this.configService.get('AZURE_AI_FOUNDRY_API_VERSION');
        this.endpoint = this.aiFoundryEndpoint;
        this.apiKey = this.aiFoundryKey;
        this.logger.log('Initializing Azure AI Service with AI Foundry configuration');
        try {
            this.openaiClient = new openai_1.OpenAIClient(this.aiFoundryEndpoint, new openai_1.AzureKeyCredential(this.aiFoundryKey));
            this.logger.log('OpenAI client initialized successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize OpenAI client: ${error.message}`);
        }
        try {
            const searchEndpoint = this.configService.get('AZURE_SEARCH_ENDPOINT');
            const searchApiKey = this.configService.get('AZURE_SEARCH_KEY');
            const indexName = this.configService.get('AZURE_SEARCH_INDEX_NAME') || 'content-index';
            if (searchEndpoint && searchApiKey) {
                this.searchClient = new search_documents_1.SearchClient(searchEndpoint, indexName, new search_documents_1.AzureKeyCredential(searchApiKey));
                this.logger.log('Azure Search client initialized successfully');
            }
            else {
                this.logger.warn('Azure Search client not initialized: missing endpoint or key');
            }
        }
        catch (error) {
            this.logger.error(`Failed to initialize Azure Search client: ${error.message}`);
        }
    }
    async generateCompletion(prompt, options = {}) {
        try {
            const deploymentName = options.deploymentName || this.aiFoundryDeploymentName || 'gpt-4o';
            this.logger.log(`Generating completion using deployment: ${deploymentName}`);
            try {
                const result = await this.openaiClient.getChatCompletions(deploymentName, [
                    { role: "system", content: options.systemMessage || "You are an AI assistant helping with content creation." },
                    { role: "user", content: prompt }
                ], {
                    temperature: options.temperature || 0.7,
                    maxTokens: options.maxTokens || 1000,
                    topP: options.topP || 1,
                    frequencyPenalty: options.frequencyPenalty,
                    presencePenalty: options.presencePenalty,
                    stop: options.stop
                });
                return {
                    id: result.id,
                    created: new Date().getTime(),
                    choices: [
                        {
                            text: result.choices[0].message.content,
                            finish_reason: result.choices[0].finishReason
                        }
                    ],
                    usage: result.usage
                };
            }
            catch (clientError) {
                this.logger.warn(`OpenAI client failed: ${clientError.message}. Falling back to direct API call.`);
                const apiUrl = this.aiFoundryDeploymentUrl ||
                    `${this.aiFoundryEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${this.aiFoundryApiVersion || '2025-01-01-preview'}`;
                this.logger.log(`Using API URL: ${apiUrl}`);
                const response = await axios_1.default.post(apiUrl, {
                    messages: [
                        { role: "system", content: options.systemMessage || "You are an AI assistant helping with content creation." },
                        { role: "user", content: prompt }
                    ],
                    temperature: options.temperature || 0.7,
                    max_tokens: options.maxTokens || 1000,
                    top_p: options.topP || 1,
                    frequency_penalty: options.frequencyPenalty,
                    presence_penalty: options.presencePenalty,
                    stop: options.stop
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': this.aiFoundryKey
                    }
                });
                return {
                    id: response.data.id,
                    created: new Date().getTime(),
                    choices: [
                        {
                            text: response.data.choices[0].message.content,
                            finish_reason: response.data.choices[0].finish_reason
                        }
                    ],
                    usage: response.data.usage
                };
            }
        }
        catch (error) {
            this.logger.error(`Error generating completion from Azure AI Foundry: ${error.message}`);
            throw new Error(`Failed to generate completion: ${error.message}`);
        }
    }
    async getCompletion(prompt, options = {}) {
        try {
            if (typeof prompt === 'object' && prompt.choices && prompt.choices[0] && prompt.choices[0].text) {
                return prompt.choices[0].text;
            }
            const result = await this.generateCompletion(prompt, options);
            return result.choices[0].text || '';
        }
        catch (error) {
            this.logger.error(`Error in getCompletion: ${error.message}`);
            throw new Error(`Failed to get completion: ${error.message}`);
        }
    }
    async generateEmbeddings(text) {
        try {
            const deploymentName = 'text-embedding-ada-002';
            const result = await this.openaiClient.getEmbeddings(deploymentName, [text]);
            return result.data[0].embedding;
        }
        catch (error) {
            console.error('Error generating embeddings from Azure OpenAI:', error.message);
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
    }
    async analyzeText(text, features = ['entities', 'sentiment', 'keyphrases']) {
        try {
            const cogServicesEndpoint = this.configService.get('AZURE_COG_SERVICES_ENDPOINT');
            const cogServicesKey = this.configService.get('AZURE_COG_SERVICES_KEY');
            const response = await axios_1.default.post(`${cogServicesEndpoint}text/analytics/v3.1/analyze`, {
                documents: [
                    {
                        id: '1',
                        language: 'en',
                        text,
                    },
                ],
                kind: features,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': cogServicesKey,
                },
            });
            return response.data;
        }
        catch (error) {
            console.error('Error analyzing text with Azure Cognitive Services:', error.message);
            throw new Error(`Failed to analyze text: ${error.message}`);
        }
    }
    async search(query, indexName = 'content-index') {
        var _a, e_1, _b, _c;
        try {
            const searchResults = await this.searchClient.search(query, {
                queryType: 'simple',
                searchFields: ['content', 'title', 'description'],
                select: ['title', 'content', 'description', 'url', 'lastUpdated']
            });
            const results = [];
            try {
                for (var _d = true, _e = __asyncValues(searchResults.results), _f; _f = await _e.next(), _a = _f.done, !_a; _d = true) {
                    _c = _f.value;
                    _d = false;
                    const result = _c;
                    results.push(result.document);
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (!_d && !_a && (_b = _e.return)) await _b.call(_e);
                }
                finally { if (e_1) throw e_1.error; }
            }
            return results;
        }
        catch (error) {
            console.error('Error searching with Azure Cognitive Search via SDK:', error.message);
            try {
                const searchEndpoint = this.configService.get('AZURE_SEARCH_ENDPOINT');
                const searchKey = this.configService.get('AZURE_SEARCH_KEY');
                const response = await axios_1.default.post(`${searchEndpoint}/indexes/${indexName}/docs/search`, {
                    search: query,
                    queryType: 'semantic',
                    searchFields: ['content', 'title', 'description'],
                    select: 'title,content,description,url,lastUpdated',
                    top: 10,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': searchKey,
                    },
                });
                return response.data.value;
            }
            catch (fallbackError) {
                console.error('Error searching with Azure Cognitive Search via REST API:', fallbackError.message);
                throw new Error(`Failed to search: ${fallbackError.message}`);
            }
        }
    }
};
exports.AzureAIService = AzureAIService;
exports.AzureAIService = AzureAIService = AzureAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AzureAIService);
//# sourceMappingURL=azure-ai.service.js.map