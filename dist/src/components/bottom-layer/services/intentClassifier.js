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
var IntentClassifier_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntentClassifier = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const azure_ai_service_1 = require("../../../shared/services/azure-ai.service");
let IntentClassifier = IntentClassifier_1 = class IntentClassifier {
    constructor(configService, azureAIService) {
        this.configService = configService;
        this.azureAIService = azureAIService;
        this.logger = new common_1.Logger(IntentClassifier_1.name);
    }
    async classifyIntent(topic) {
        try {
            this.logger.log(`Classifying intent for topic: ${topic}`);
            const systemMessage = `You are an expert in content strategy and search intent analysis. 
      Analyze the search intent behind the given topic and classify it according to the following categories:
      - Informational: User wants to learn about a topic
      - Navigational: User wants to find a specific website or page
      - Transactional: User wants to complete an action or purchase
      - Commercial: User is researching products or services before making a purchase decision
      
      Also identify key themes related to the topic.`;
            const prompt = `Analyze the search intent for the topic: "${topic}"
      
      Provide your analysis in the following JSON format:
      {
        "primaryIntent": "informational|navigational|transactional|commercial",
        "secondaryIntents": ["intent1", "intent2"],
        "intentScores": {
          "informational": 0.0-1.0,
          "navigational": 0.0-1.0,
          "transactional": 0.0-1.0,
          "commercial": 0.0-1.0
        },
        "keyThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
        "confidence": 0.0-1.0
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
                    primaryIntent: result.primaryIntent,
                    secondaryIntents: result.secondaryIntents || [],
                    intentScores: result.intentScores || {
                        informational: 0,
                        navigational: 0,
                        transactional: 0,
                        commercial: 0
                    },
                    keyThemes: result.keyThemes || [],
                    confidence: result.confidence || 0.7
                };
            }
            catch (parseError) {
                this.logger.error(`Error parsing intent classification result: ${parseError.message}`);
                return this.getDefaultIntentClassification(topic);
            }
        }
        catch (error) {
            this.logger.error(`Error classifying intent: ${error.message}`);
            return this.getDefaultIntentClassification(topic);
        }
    }
    async classifyIntentWithSegment(topic, segment) {
        try {
            this.logger.log(`Classifying intent for topic: ${topic} with segment: ${segment}`);
            const systemMessage = `You are an expert in content strategy and search intent analysis for ${segment.toUpperCase()} audiences. 
      Analyze the search intent behind the given topic and classify it according to the following categories:
      - Informational: User wants to learn about a topic
      - Navigational: User wants to find a specific website or page
      - Transactional: User wants to complete an action or purchase
      - Commercial: User is researching products or services before making a purchase decision
      
      Also identify key themes related to the topic that would be relevant for ${segment.toUpperCase()} audiences.`;
            const prompt = `Analyze the search intent for the ${segment.toUpperCase()} topic: "${topic}"
      
      Provide your analysis in the following JSON format:
      {
        "primaryIntent": "informational|navigational|transactional|commercial",
        "secondaryIntents": ["intent1", "intent2"],
        "intentScores": {
          "informational": 0.0-1.0,
          "navigational": 0.0-1.0,
          "transactional": 0.0-1.0,
          "commercial": 0.0-1.0
        },
        "keyThemes": ["theme1", "theme2", "theme3", "theme4", "theme5"],
        "confidence": 0.0-1.0
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
                    primaryIntent: result.primaryIntent,
                    secondaryIntents: result.secondaryIntents || [],
                    intentScores: result.intentScores || {
                        informational: 0,
                        navigational: 0,
                        transactional: 0,
                        commercial: 0
                    },
                    keyThemes: result.keyThemes || [],
                    confidence: result.confidence || 0.7
                };
            }
            catch (parseError) {
                this.logger.error(`Error parsing intent classification result: ${parseError.message}`);
                return this.getDefaultIntentClassification(topic, segment);
            }
        }
        catch (error) {
            this.logger.error(`Error classifying intent with segment: ${error.message}`);
            return this.getDefaultIntentClassification(topic, segment);
        }
    }
    getDefaultIntentClassification(topic, segment) {
        const defaultScores = segment === 'b2b'
            ? { informational: 0.7, navigational: 0.1, transactional: 0.1, commercial: 0.3 }
            : { informational: 0.6, navigational: 0.2, transactional: 0.3, commercial: 0.2 };
        return {
            primaryIntent: 'informational',
            secondaryIntents: ['commercial'],
            intentScores: defaultScores,
            keyThemes: [topic, 'guide', 'overview', 'tutorial', 'examples'],
            confidence: 0.6
        };
    }
};
exports.IntentClassifier = IntentClassifier;
exports.IntentClassifier = IntentClassifier = IntentClassifier_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        azure_ai_service_1.AzureAIService])
], IntentClassifier);
//# sourceMappingURL=intentClassifier.js.map