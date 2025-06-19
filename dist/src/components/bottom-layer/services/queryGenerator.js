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
var QueryGenerator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryGenerator = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const azure_ai_service_1 = require("../../../shared/services/azure-ai.service");
let QueryGenerator = QueryGenerator_1 = class QueryGenerator {
    constructor(configService, azureAIService) {
        this.configService = configService;
        this.azureAIService = azureAIService;
        this.logger = new common_1.Logger(QueryGenerator_1.name);
    }
    async generateConversationalQueries(topic, intentResult) {
        try {
            this.logger.log(`Generating conversational queries for topic: ${topic}`);
            const systemMessage = `You are an expert in search behavior and query formulation. 
      Generate conversational queries that users might ask related to the given topic, 
      based on the provided intent classification and key themes.`;
            const prompt = `Topic: "${topic}"
      Intent Classification: ${intentResult.primaryIntent} (confidence: ${intentResult.confidence})
      Secondary Intents: ${intentResult.secondaryIntents.join(', ')}
      Key Themes: ${intentResult.keyThemes.join(', ')}
      
      Generate the following:
      1. 5-8 expanded search queries that are variations of the original topic
      2. 5-8 semantic queries that capture the meaning but use different terminology
      3. 5-8 related concepts that are connected to the topic
      4. 5-8 conversational queries phrased as questions that users might ask
      
      Provide your response in the following JSON format:
      {
        "expandedQueries": ["query1", "query2", ...],
        "semanticQueries": ["query1", "query2", ...],
        "relatedConcepts": ["concept1", "concept2", ...],
        "conversationalQueries": ["question1?", "question2?", ...],
        "confidence": 0.0-1.0
      }`;
            const options = {
                systemMessage,
                temperature: 0.7,
                maxTokens: 800
            };
            const completion = await this.azureAIService.getCompletion(prompt, options);
            try {
                const result = JSON.parse(completion);
                return {
                    originalQuery: topic,
                    expandedQueries: result.expandedQueries || [],
                    semanticQueries: result.semanticQueries || [],
                    relatedConcepts: result.relatedConcepts || [],
                    conversationalQueries: result.conversationalQueries || [],
                    confidence: result.confidence || 0.7
                };
            }
            catch (parseError) {
                this.logger.error(`Error parsing query generation result: ${parseError.message}`);
                return this.createDefaultQueryExpansion(topic);
            }
        }
        catch (error) {
            this.logger.error(`Error generating conversational queries: ${error.message}`);
            return this.createDefaultQueryExpansion(topic);
        }
    }
    async generateConversationalQueriesWithSegment(topic, intentResult, segment) {
        try {
            this.logger.log(`Generating ${segment} conversational queries for topic: ${topic}`);
            const systemMessage = `You are an expert in ${segment.toUpperCase()} search behavior and query formulation. 
      Generate conversational queries that ${segment.toUpperCase()} users might ask related to the given topic, 
      based on the provided intent classification and key themes.`;
            const prompt = `Topic: "${topic}"
      Segment: ${segment.toUpperCase()}
      Intent Classification: ${intentResult.primaryIntent} (confidence: ${intentResult.confidence})
      Secondary Intents: ${intentResult.secondaryIntents.join(', ')}
      Key Themes: ${intentResult.keyThemes.join(', ')}
      
      Generate the following specifically for ${segment.toUpperCase()} audiences:
      1. 5-8 expanded search queries that are variations of the original topic
      2. 5-8 semantic queries that capture the meaning but use different terminology
      3. 5-8 related concepts that are connected to the topic
      4. 5-8 conversational queries phrased as questions that ${segment.toUpperCase()} users might ask
      
      Provide your response in the following JSON format:
      {
        "expandedQueries": ["query1", "query2", ...],
        "semanticQueries": ["query1", "query2", ...],
        "relatedConcepts": ["concept1", "concept2", ...],
        "conversationalQueries": ["question1?", "question2?", ...],
        "confidence": 0.0-1.0
      }`;
            const options = {
                systemMessage,
                temperature: 0.7,
                maxTokens: 800
            };
            const completion = await this.azureAIService.getCompletion(prompt, options);
            try {
                const result = JSON.parse(completion);
                return {
                    originalQuery: topic,
                    expandedQueries: result.expandedQueries || [],
                    semanticQueries: result.semanticQueries || [],
                    relatedConcepts: result.relatedConcepts || [],
                    conversationalQueries: result.conversationalQueries || [],
                    confidence: result.confidence || 0.7
                };
            }
            catch (parseError) {
                this.logger.error(`Error parsing query generation result: ${parseError.message}`);
                return this.createDefaultQueryExpansion(topic, segment);
            }
        }
        catch (error) {
            this.logger.error(`Error generating conversational queries with segment: ${error.message}`);
            return this.createDefaultQueryExpansion(topic, segment);
        }
    }
    createDefaultQueryExpansion(query, segment) {
        const defaultExpanded = [
            `${query} guide`,
            `${query} tutorial`,
            `${query} examples`,
            `${query} best practices`,
            `${query} overview`
        ];
        const defaultSemantic = [
            `how to understand ${query}`,
            `learn about ${query}`,
            `${query} fundamentals`,
            `${query} explained`,
            `${query} basics`
        ];
        const defaultRelated = [
            `${query} tools`,
            `${query} techniques`,
            `${query} strategies`,
            `${query} methods`,
            `${query} trends`
        ];
        const defaultConversational = segment === 'b2b'
            ? [
                `What are the best ${query} strategies for businesses?`,
                `How can our company implement ${query}?`,
                `What ROI can we expect from ${query}?`,
                `Which ${query} tools are best for enterprise use?`,
                `How do competitors use ${query} successfully?`
            ]
            : [
                `What is ${query}?`,
                `How does ${query} work?`,
                `Why is ${query} important?`,
                `What are the benefits of ${query}?`,
                `How can I learn ${query}?`
            ];
        return {
            originalQuery: query,
            expandedQueries: defaultExpanded,
            semanticQueries: defaultSemantic,
            relatedConcepts: defaultRelated,
            conversationalQueries: defaultConversational,
            confidence: 0.6
        };
    }
};
exports.QueryGenerator = QueryGenerator;
exports.QueryGenerator = QueryGenerator = QueryGenerator_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        azure_ai_service_1.AzureAIService])
], QueryGenerator);
//# sourceMappingURL=queryGenerator.js.map