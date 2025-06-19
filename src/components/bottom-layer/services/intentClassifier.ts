import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { Segment } from './query-intent-analyzer.service';

/**
 * Intent classification result
 */
export interface IntentClassificationResult {
  primaryIntent: string;
  secondaryIntents: string[];
  intentScores: {
    informational: number;
    navigational: number;
    transactional: number;
    commercial: number;
  };
  keyThemes: string[];
  confidence: number;
}

/**
 * Intent Classifier module that interacts with Azure AI Foundry
 * for classifying query intents
 */
@Injectable()
export class IntentClassifier {
  private readonly logger = new Logger(IntentClassifier.name);

  constructor(
    private configService: ConfigService,
    private azureAIService: AzureAIService
  ) {}

  /**
   * Classify the intent of a topic
   * @param topic The topic to classify
   * @returns Intent classification result
   */
  async classifyIntent(topic: string): Promise<IntentClassificationResult> {
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
        // Parse the JSON response
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
      } catch (parseError) {
        this.logger.error(`Error parsing intent classification result: ${parseError.message}`);
        return this.getDefaultIntentClassification(topic);
      }
    } catch (error) {
      this.logger.error(`Error classifying intent: ${error.message}`);
      return this.getDefaultIntentClassification(topic);
    }
  }

  /**
   * Classify the intent of a topic with segment context
   * @param topic The topic to classify
   * @param segment The business segment (B2B or B2C)
   * @returns Intent classification result
   */
  async classifyIntentWithSegment(topic: string, segment: Segment): Promise<IntentClassificationResult> {
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
        // Parse the JSON response
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
      } catch (parseError) {
        this.logger.error(`Error parsing intent classification result: ${parseError.message}`);
        return this.getDefaultIntentClassification(topic, segment);
      }
    } catch (error) {
      this.logger.error(`Error classifying intent with segment: ${error.message}`);
      return this.getDefaultIntentClassification(topic, segment);
    }
  }

  /**
   * Get default intent classification when AI analysis fails
   * @param topic The topic to classify
   * @param segment Optional segment for segment-specific defaults
   * @returns Default intent classification
   */
  private getDefaultIntentClassification(topic: string, segment?: Segment): IntentClassificationResult {
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
}
