import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { IntentClassificationResult } from './intentClassifier';
import { Segment } from './query-intent-analyzer.service';

/**
 * Query expansion result
 */
export interface QueryExpansionResult {
  originalQuery: string;
  expandedQueries: string[];
  semanticQueries: string[];
  relatedConcepts: string[];
  conversationalQueries: string[];
  confidence: number;
}

/**
 * Conversational Query Generator module for generating conversational queries
 * based on intent classification
 */
@Injectable()
export class QueryGenerator {
  private readonly logger = new Logger(QueryGenerator.name);

  constructor(
    private configService: ConfigService,
    private azureAIService: AzureAIService
  ) {}

  /**
   * Generate conversational queries based on topic and intent classification
   * @param topic The original topic
   * @param intentResult The intent classification result
   * @returns Query expansion result with conversational queries
   */
  async generateConversationalQueries(
    topic: string, 
    intentResult: IntentClassificationResult
  ): Promise<QueryExpansionResult> {
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
        // Parse the JSON response
        const result = JSON.parse(completion);
        return {
          originalQuery: topic,
          expandedQueries: result.expandedQueries || [],
          semanticQueries: result.semanticQueries || [],
          relatedConcepts: result.relatedConcepts || [],
          conversationalQueries: result.conversationalQueries || [],
          confidence: result.confidence || 0.7
        };
      } catch (parseError) {
        this.logger.error(`Error parsing query generation result: ${parseError.message}`);
        return this.createDefaultQueryExpansion(topic);
      }
    } catch (error) {
      this.logger.error(`Error generating conversational queries: ${error.message}`);
      return this.createDefaultQueryExpansion(topic);
    }
  }

  /**
   * Generate conversational queries with segment context
   * @param topic The original topic
   * @param intentResult The intent classification result
   * @param segment The business segment (B2B or B2C)
   * @returns Query expansion result with segment-specific conversational queries
   */
  async generateConversationalQueriesWithSegment(
    topic: string, 
    intentResult: IntentClassificationResult,
    segment: Segment
  ): Promise<QueryExpansionResult> {
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
        // Parse the JSON response
        const result = JSON.parse(completion);
        return {
          originalQuery: topic,
          expandedQueries: result.expandedQueries || [],
          semanticQueries: result.semanticQueries || [],
          relatedConcepts: result.relatedConcepts || [],
          conversationalQueries: result.conversationalQueries || [],
          confidence: result.confidence || 0.7
        };
      } catch (parseError) {
        this.logger.error(`Error parsing query generation result: ${parseError.message}`);
        return this.createDefaultQueryExpansion(topic, segment);
      }
    } catch (error) {
      this.logger.error(`Error generating conversational queries with segment: ${error.message}`);
      return this.createDefaultQueryExpansion(topic, segment);
    }
  }

  /**
   * Create a default query expansion result when AI-based expansion fails
   * @param query The original query
   * @param segment Optional segment for segment-specific defaults
   * @returns A basic QueryExpansionResult
   */
  private createDefaultQueryExpansion(query: string, segment?: Segment): QueryExpansionResult {
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
}
