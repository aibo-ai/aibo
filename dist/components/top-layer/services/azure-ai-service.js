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
var AzureAIService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AzureAIService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const key_vault_service_1 = require("../../../common/services/key-vault.service");
const application_insights_service_1 = require("../../../common/services/application-insights.service");
let AzureAIService = AzureAIService_1 = class AzureAIService {
    constructor(keyVaultService, appInsights) {
        this.keyVaultService = keyVaultService;
        this.appInsights = appInsights;
        this.logger = new common_1.Logger(AzureAIService_1.name);
        this.azureOpenAiEndpoint = process.env.AZURE_OPENAI_ENDPOINT || '';
        this.azureOpenAiKey = process.env.AZURE_OPENAI_KEY || '';
        this.azureSearchEndpoint = process.env.AZURE_SEARCH_ENDPOINT || '';
        this.azureSearchKey = process.env.AZURE_SEARCH_KEY || '';
        this.azureSearchIndex = process.env.AZURE_SEARCH_INDEX_NAME || 'content-index';
        if (!this.azureOpenAiEndpoint || !this.azureOpenAiKey) {
            this.logger.warn('Azure OpenAI credentials not configured properly');
        }
        if (!this.azureSearchEndpoint || !this.azureSearchKey) {
            this.logger.warn('Azure Cognitive Search credentials not configured properly');
        }
    }
    async initializeCredentials() {
        if (this.keyVaultService.isKeyVaultAvailable()) {
            this.logger.log('Retrieving Azure AI credentials from Key Vault');
            const openAiKey = await this.keyVaultService.getSecret('AZURE-OPENAI-KEY');
            const searchKey = await this.keyVaultService.getSecret('AZURE-SEARCH-KEY');
            if (openAiKey)
                this.azureOpenAiKey = openAiKey;
            if (searchKey)
                this.azureSearchKey = searchKey;
            this.logger.log('Azure AI credentials updated from Key Vault');
        }
    }
    async generateCompletion(input) {
        const startTime = Date.now();
        const operationId = `search-${Date.now()}`;
        this.appInsights.trackEvent('AzureOpenAI:Completion:Start', {
            deploymentName: input.deploymentName || 'default',
            promptLength: input.prompt.length.toString()
        });
        try {
            await this.initializeCredentials();
            const { prompt, maxTokens = 1000, temperature = 0.7, deploymentName = 'gpt-35-turbo' } = input;
            try {
                this.logger.log(`Attempting to use chat completions API with deployment ${deploymentName}`);
                const chatResponse = await axios_1.default.post(`${this.azureOpenAiEndpoint}/openai/deployments/${deploymentName}/chat/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'}`, {
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant.' },
                        { role: 'user', content: prompt }
                    ],
                    max_tokens: maxTokens,
                    temperature,
                    n: 1,
                    stream: false,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': this.azureOpenAiKey,
                    },
                });
                const duration = Date.now() - startTime;
                this.appInsights.trackEvent('AzureOpenAI:ChatCompletion:Success', {
                    deploymentName: input.deploymentName || 'gpt-35-turbo',
                    durationMs: duration.toString(),
                    totalTokens: chatResponse.data.usage.total_tokens.toString()
                });
                this.appInsights.trackMetric('AzureOpenAI:CompletionLatency', duration, {
                    deploymentName: input.deploymentName || 'gpt-35-turbo',
                    success: 'true'
                });
                return {
                    text: chatResponse.data.choices[0].message.content,
                    finishReason: chatResponse.data.choices[0].finish_reason,
                    usage: {
                        promptTokens: chatResponse.data.usage.prompt_tokens,
                        completionTokens: chatResponse.data.usage.completion_tokens,
                        totalTokens: chatResponse.data.usage.total_tokens,
                    },
                };
            }
            catch (chatError) {
                this.logger.warn(`Chat completions API failed: ${chatError.message}. Falling back to completions API.`);
                const legacyResponse = await axios_1.default.post(`${this.azureOpenAiEndpoint}/openai/deployments/${deploymentName}/completions?api-version=${process.env.AZURE_OPENAI_API_VERSION || '2025-01-01-preview'}`, {
                    prompt,
                    max_tokens: maxTokens,
                    temperature,
                    n: 1,
                    stream: false,
                }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'api-key': this.azureOpenAiKey,
                    },
                });
                const duration = Date.now() - startTime;
                this.appInsights.trackEvent('AzureOpenAI:LegacyCompletion:Success', {
                    deploymentName: input.deploymentName || 'gpt-35-turbo',
                    durationMs: duration.toString(),
                    totalTokens: legacyResponse.data.usage.total_tokens.toString()
                });
                return {
                    text: legacyResponse.data.choices[0].text,
                    finishReason: legacyResponse.data.choices[0].finish_reason,
                    usage: {
                        promptTokens: legacyResponse.data.usage.prompt_tokens,
                        completionTokens: legacyResponse.data.usage.completion_tokens,
                        totalTokens: legacyResponse.data.usage.total_tokens,
                    },
                };
            }
        }
        catch (error) {
            const duration = Date.now() - startTime;
            this.appInsights.trackException(error instanceof Error ? error : new Error(String(error)), {
                deploymentName: input.deploymentName || 'default',
                durationMs: duration.toString(),
                errorType: error.name || 'Unknown',
                operation: 'generateCompletion'
            });
            this.appInsights.trackMetric('AzureOpenAI:CompletionLatency', duration, {
                deploymentName: input.deploymentName || 'default',
                success: 'false',
                errorType: error.name || 'Unknown'
            });
            this.logger.error(`Error generating completion: ${error.message}`);
            throw new Error(`Failed to generate completion: ${error.message}`);
        }
    }
    async search(input) {
        const startTime = Date.now();
        const operationId = `search-${Date.now()}`;
        this.appInsights.trackEvent('AzureSearch:Query:Start', {
            query: input.query,
            filters: input.filters ? input.filters : 'none'
        });
        try {
            await this.initializeCredentials();
            const { query, filters, top = 10, skip = 0, searchMode = 'all' } = input;
            const response = await axios_1.default.post(`${this.azureSearchEndpoint}/indexes/${this.azureSearchIndex}/docs/search?api-version=2023-10-01-Preview`, {
                search: query,
                filter: filters,
                top,
                skip,
                searchMode,
                queryType: 'semantic',
                semanticConfiguration: 'content-config',
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.azureSearchKey,
                },
            });
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureSearch:Query:Success', {
                query: input.query,
                filters: input.filters ? input.filters : 'none',
                durationMs: duration.toString()
            });
            return {
                results: response.data.value.map(item => ({
                    id: item.id,
                    score: item['@search.score'],
                    document: item,
                })),
                count: response.data['@odata.count'] || response.data.value.length,
            };
        }
        catch (error) {
            this.logger.error(`Error searching content: ${error.message}`);
            throw new Error(`Failed to search content: ${error.message}`);
        }
    }
    async generateEmbeddings(input) {
        const startTime = Date.now();
        const operationId = `embedding-${Date.now()}`;
        this.appInsights.trackEvent('AzureOpenAI:Embedding:Start', {
            deploymentName: input.deploymentName || 'text-embedding-ada-002',
            textCount: Array.isArray(input.text) ? input.text.length.toString() : '1'
        });
        try {
            await this.initializeCredentials();
            const { text, deploymentName = 'text-embedding-ada-002' } = input;
            const textsArray = Array.isArray(text) ? text : [text];
            const response = await axios_1.default.post(`${this.azureOpenAiEndpoint}/openai/deployments/${deploymentName}/embeddings?api-version=2023-05-15`, {
                input: textsArray,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'api-key': this.azureOpenAiKey,
                },
            });
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureOpenAI:Embedding:Success', {
                deploymentName: input.deploymentName || 'text-embedding-ada-002',
                durationMs: duration.toString(),
                totalTokens: response.data.usage.total_tokens.toString()
            });
            this.appInsights.trackMetric('AzureOpenAI:EmbeddingLatency', duration, {
                deploymentName: input.deploymentName || 'text-embedding-ada-002',
                success: 'true'
            });
            return {
                embeddings: response.data.data.map(item => item.embedding),
                dimensions: response.data.data[0].embedding.length,
                usage: {
                    promptTokens: response.data.usage.prompt_tokens,
                    totalTokens: response.data.usage.total_tokens,
                },
            };
        }
        catch (error) {
            this.logger.error(`Error generating embeddings: ${error.message}`);
            throw new Error(`Failed to generate embeddings: ${error.message}`);
        }
    }
    async analyzeText(input) {
        const startTime = Date.now();
        const operationId = `analysis-${Date.now()}`;
        this.appInsights.trackEvent('AzureLanguage:Analysis:Start', {
            kind: input.kind,
            textLength: input.text.length.toString()
        });
        try {
            await this.initializeCredentials();
            const { text, kind = 'EntityRecognition', language = 'en' } = input;
            let endpoint = '';
            let requestBody = {};
            switch (kind) {
                case 'EntityRecognition':
                    endpoint = `${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analysis/v1.0/entities/recognition/general`;
                    requestBody = {
                        documents: [{ id: '1', text, language }]
                    };
                    break;
                case 'KeyPhraseExtraction':
                    endpoint = `${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analysis/v1.0/keyPhrases`;
                    requestBody = {
                        documents: [{ id: '1', text, language }]
                    };
                    break;
                case 'SentimentAnalysis':
                    endpoint = `${process.env.AZURE_LANGUAGE_ENDPOINT}/language/analysis/v1.0/sentiment`;
                    requestBody = {
                        documents: [{ id: '1', text, language }]
                    };
                    break;
                default:
                    throw new Error(`Unsupported analysis kind: ${kind}`);
            }
            const response = await axios_1.default.post(endpoint, requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                    'Ocp-Apim-Subscription-Key': process.env.AZURE_LANGUAGE_KEY,
                },
            });
            let result;
            switch (kind) {
                case 'EntityRecognition':
                    result = {
                        entities: response.data.documents[0].entities,
                    };
                    break;
                case 'KeyPhraseExtraction':
                    result = {
                        keyPhrases: response.data.documents[0].keyPhrases,
                    };
                    break;
                case 'SentimentAnalysis':
                    result = {
                        sentiment: response.data.documents[0].sentiment,
                        confidenceScores: response.data.documents[0].confidenceScores,
                        sentences: response.data.documents[0].sentences,
                    };
                    break;
            }
            const duration = Date.now() - startTime;
            this.appInsights.trackEvent('AzureLanguage:Analysis:Success', {
                kind: input.kind,
                durationMs: duration.toString(),
                success: 'true'
            });
            this.appInsights.trackMetric('AzureLanguage:AnalysisLatency', duration, {
                kind: input.kind,
                success: 'true'
            });
            return Object.assign({ kind,
                language }, result);
        }
        catch (error) {
            this.logger.error(`Error analyzing text: ${error.message}`);
            throw new Error(`Failed to analyze text: ${error.message}`);
        }
    }
};
exports.AzureAIService = AzureAIService;
exports.AzureAIService = AzureAIService = AzureAIService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [key_vault_service_1.KeyVaultService,
        application_insights_service_1.ApplicationInsightsService])
], AzureAIService);
//# sourceMappingURL=azure-ai-service.js.map