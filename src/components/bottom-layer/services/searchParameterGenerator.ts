import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AzureAIService } from '../../../shared/services/azure-ai.service';
import { IntentClassificationResult } from './intentClassifier';
import { Segment } from './query-intent-analyzer.service';

/**
 * Search parameters for content discovery and optimization
 */
export interface SearchParameters {
  includeDomains?: string[];
  excludeDomains?: string[];
  contentTypes?: string[];
  timeframe?: string;
  filters?: {
    recency?: string;
    contentTypes?: string[];
    minLength?: string;
    [key: string]: any;
  };
  semanticBoost?: boolean;
  expandedQueries?: string[];
  semanticQueries?: string[];
}

/**
 * Search Parameter Generator module for generating search parameters
 * based on intent classification
 */
@Injectable()
export class SearchParameterGenerator {
  private readonly logger = new Logger(SearchParameterGenerator.name);

  constructor(
    private configService: ConfigService,
    private azureAIService: AzureAIService
  ) {}

  /**
   * Generate search parameters based on topic and intent classification
   * @param topic The original topic
   * @param intentResult The intent classification result
   * @returns Search parameters for content discovery
   */
  async generateSearchParameters(
    topic: string, 
    intentResult: IntentClassificationResult
  ): Promise<SearchParameters> {
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
        // Parse the JSON response
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
      } catch (parseError) {
        this.logger.error(`Error parsing search parameters result: ${parseError.message}`);
        return this.getDefaultSearchParameters(intentResult.primaryIntent);
      }
    } catch (error) {
      this.logger.error(`Error generating search parameters: ${error.message}`);
      return this.getDefaultSearchParameters(intentResult.primaryIntent);
    }
  }

  /**
   * Generate search parameters with segment context
   * @param topic The original topic
   * @param intentResult The intent classification result
   * @param segment The business segment (B2B or B2C)
   * @returns Search parameters optimized for the segment
   */
  async generateSearchParametersForSegment(
    topic: string, 
    intentResult: IntentClassificationResult,
    segment: Segment
  ): Promise<SearchParameters> {
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
        // Parse the JSON response
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
      } catch (parseError) {
        this.logger.error(`Error parsing search parameters result: ${parseError.message}`);
        return this.getDefaultSearchParametersForSegment(intentResult.primaryIntent, segment);
      }
    } catch (error) {
      this.logger.error(`Error generating search parameters with segment: ${error.message}`);
      return this.getDefaultSearchParametersForSegment(intentResult.primaryIntent, segment);
    }
  }

  /**
   * Map content intent to preferred content types
   * @param intent The primary content intent
   * @returns Array of content types suited for the intent
   */
  private mapIntentToContentType(intent: string): string[] {
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

  /**
   * Map content intent to preferred content types for a specific segment
   * @param intent The primary content intent
   * @param segment The business segment (B2B or B2C)
   * @returns Array of content types suited for the intent and segment
   */
  private mapIntentToContentTypeForSegment(intent: string, segment: Segment): string[] {
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
    } else {
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

  /**
   * Get default search parameters when AI generation fails
   * @param intent Primary intent for search parameters
   * @returns Default search parameters
   */
  private getDefaultSearchParameters(intent: string): SearchParameters {
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

  /**
   * Get default search parameters for a segment when AI generation fails
   * @param intent Primary intent for search parameters
   * @param segment Target audience segment
   * @returns Default search parameters optimized for the segment
   */
  private getDefaultSearchParametersForSegment(intent: string, segment: Segment): SearchParameters {
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
}
