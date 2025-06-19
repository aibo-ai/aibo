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
var SearchParameterGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchParameterGenerator = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const azure_ai_service_1 = require("../../../shared/services/azure-ai.service");
let SearchParameterGenerator = SearchParameterGenerator_1 = class SearchParameterGenerator {
    constructor(configService, azureAIService) {
        this.configService = configService;
        this.azureAIService = azureAIService;
        this.logger = new common_1.Logger(SearchParameterGenerator_1.name);
    }
    async generateSearchParameters(topic, intentResult) {
        try {
            this.logger.log(`Generating search parameters for topic: ${topic}`);
            const systemMessage = `You are an expert in search optimization and content discovery. 
      Generate optimal search parameters for finding high-quality content related to the given topic, 
      based on the provided intent classification and key themes.`;
            const prompt = `Topic: "${topic}"
      Intent Classification: ${intentResult.primaryIntent} (confidence: ${intentResult.confidence})
      Secondary Intents: ${intentResult.secondaryIntents.join(', ')}
      Key Themes: ${intentResult.keyThemes.join(', ')}
      
      Generate optimal search parameters for discovering high-quality content related to this topic.
      
      Provide your response in the following JSON format:
      {
        "includeDomains": ["domain1.com", "domain2.com", ...],
        "excludeDomains": ["pinterest.com", "quora.com", ...],
        "contentTypes": ["article", "guide", "whitepaper", ...],
        "timeframe": "recent|all|past_year",
        "filters": {
          "recency": "recent|all|past_year",
          "contentTypes": ["article", "guide", ...],
          "minLength": "1000|2000|5000"
        },
        "semanticBoost": true|false
      }`;
            const options = {
                systemMessage,
                temperature: 0.3,
                maxTokens: 500
            };
            const completion = await this.azureAIService.getCompletion(prompt, options);
            try {
                const result = JSON.parse(completion);
                return {
                    includeDomains: result.includeDomains || [],
                    excludeDomains: result.excludeDomains || ['pinterest.com', 'quora.com'],
                    contentTypes: result.contentTypes || this.mapIntentToContentType(intentResult.primaryIntent),
                    timeframe: result.timeframe || 'recent',
                    filters: result.filters || {
                        recency: 'recent',
                        contentTypes: this.mapIntentToContentType(intentResult.primaryIntent),
                        minLength: '1000'
                    },
                    semanticBoost: result.semanticBoost !== undefined ? result.semanticBoost : true
                };
            }
            catch (parseError) {
                this.logger.error(`Error parsing search parameters result: ${parseError.message}`);
                return this.getDefaultSearchParameters(intentResult.primaryIntent);
            }
        }
        catch (error) {
            this.logger.error(`Error generating search parameters: ${error.message}`);
            return this.getDefaultSearchParameters(intentResult.primaryIntent);
        }
    }
    async generateSearchParametersForSegment(topic, intentResult, segment) {
        try {
            this.logger.log(`Generating ${segment} search parameters for topic: ${topic}`);
            const systemMessage = `You are an expert in ${segment.toUpperCase()} search optimization and content discovery. 
      Generate optimal search parameters for finding high-quality ${segment.toUpperCase()} content related to the given topic, 
      based on the provided intent classification and key themes.`;
            const prompt = `Topic: "${topic}"
      Segment: ${segment.toUpperCase()}
      Intent Classification: ${intentResult.primaryIntent} (confidence: ${intentResult.confidence})
      Secondary Intents: ${intentResult.secondaryIntents.join(', ')}
      Key Themes: ${intentResult.keyThemes.join(', ')}
      
      Generate optimal search parameters for discovering high-quality ${segment.toUpperCase()} content related to this topic.
      
      Provide your response in the following JSON format:
      {
        "includeDomains": ["domain1.com", "domain2.com", ...],
        "excludeDomains": ["pinterest.com", "quora.com", ...],
        "contentTypes": ["article", "guide", "whitepaper", ...],
        "timeframe": "recent|all|past_year",
        "filters": {
          "recency": "recent|all|past_year",
          "contentTypes": ["article", "guide", ...],
          "minLength": "1000|2000|5000"
        },
        "semanticBoost": true|false
      }`;
            const options = {
                systemMessage,
                temperature: 0.3,
                maxTokens: 500
            };
            const completion = await this.azureAIService.getCompletion(prompt, options);
            try {
                const result = JSON.parse(completion);
                return {
                    includeDomains: result.includeDomains || [],
                    excludeDomains: result.excludeDomains || ['pinterest.com', 'quora.com'],
                    contentTypes: result.contentTypes || this.mapIntentToContentTypeForSegment(intentResult.primaryIntent, segment),
                    timeframe: result.timeframe || 'recent',
                    filters: result.filters || {
                        recency: 'recent',
                        contentTypes: this.mapIntentToContentTypeForSegment(intentResult.primaryIntent, segment),
                        minLength: segment === 'b2b' ? '2000' : '1000'
                    },
                    semanticBoost: result.semanticBoost !== undefined ? result.semanticBoost : true
                };
            }
            catch (parseError) {
                this.logger.error(`Error parsing search parameters result: ${parseError.message}`);
                return this.getDefaultSearchParametersForSegment(intentResult.primaryIntent, segment);
            }
        }
        catch (error) {
            this.logger.error(`Error generating search parameters with segment: ${error.message}`);
            return this.getDefaultSearchParametersForSegment(intentResult.primaryIntent, segment);
        }
    }
    mapIntentToContentType(intent) {
        switch (intent.toLowerCase()) {
            case 'informational':
                return ['article', 'guide', 'tutorial', 'blog'];
            case 'navigational':
                return ['homepage', 'landing page', 'directory'];
            case 'transactional':
                return ['product page', 'service page', 'landing page'];
            case 'commercial':
                return ['review', 'comparison', 'case study', 'product guide'];
            default:
                return ['article', 'guide', 'blog'];
        }
    }
    mapIntentToContentTypeForSegment(intent, segment) {
        if (segment === 'b2b') {
            switch (intent.toLowerCase()) {
                case 'informational':
                    return ['whitepaper', 'case study', 'industry report', 'guide'];
                case 'navigational':
                    return ['resource center', 'knowledge base', 'documentation'];
                case 'transactional':
                    return ['product page', 'solution page', 'demo request'];
                case 'commercial':
                    return ['case study', 'comparison', 'ROI calculator', 'technical specification'];
                default:
                    return ['whitepaper', 'case study', 'guide'];
            }
        }
        else {
            switch (intent.toLowerCase()) {
                case 'informational':
                    return ['article', 'guide', 'tutorial', 'blog'];
                case 'navigational':
                    return ['homepage', 'category page', 'directory'];
                case 'transactional':
                    return ['product page', 'checkout page', 'service page'];
                case 'commercial':
                    return ['review', 'comparison', 'buying guide', 'product feature'];
                default:
                    return ['article', 'guide', 'blog'];
            }
        }
    }
    getDefaultSearchParameters(intent) {
        return {
            excludeDomains: ['pinterest.com', 'quora.com'],
            contentTypes: this.mapIntentToContentType(intent),
            timeframe: 'recent',
            filters: {
                recency: 'recent',
                contentTypes: this.mapIntentToContentType(intent),
                minLength: '1000'
            },
            semanticBoost: true
        };
    }
    getDefaultSearchParametersForSegment(intent, segment) {
        return {
            excludeDomains: ['pinterest.com', 'quora.com'],
            contentTypes: this.mapIntentToContentTypeForSegment(intent, segment),
            timeframe: 'recent',
            filters: {
                recency: 'recent',
                contentTypes: this.mapIntentToContentTypeForSegment(intent, segment),
                minLength: segment === 'b2b' ? '2000' : '1000'
            },
            semanticBoost: true
        };
    }
};
exports.SearchParameterGenerator = SearchParameterGenerator;
exports.SearchParameterGenerator = SearchParameterGenerator = SearchParameterGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        azure_ai_service_1.AzureAIService])
], SearchParameterGenerator);
//# sourceMappingURL=searchParameterGenerator.js.map