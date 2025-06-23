import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface QueryIntent {
  primary: 'informational' | 'navigational' | 'transactional' | 'commercial';
  confidence: number;
  entities: Array<{
    text: string;
    category: string;
    confidence: number;
  }>;
  searchParameters: {
    keywords: string[];
    semanticVariations: string[];
    relatedQueries: string[];
    queryType: string;
  };
  conversationalQueries: string[];
}

export interface QueryAnalysisInput {
  topic: string;
  audience: string;
  contentType: string;
  context?: string;
}

@Injectable()
export class QueryIntentAnalyzerService {
  private readonly logger = new Logger(QueryIntentAnalyzerService.name);

  constructor(private readonly configService: ConfigService) {}

  async analyzeIntent(input: QueryAnalysisInput): Promise<QueryIntent> {
    this.logger.log(`Analyzing query intent for topic: ${input.topic}`);

    try {
      // Step 1: Extract entities and classify intent
      const entities = await this.extractEntities(input.topic);
      const primaryIntent = this.classifyIntent(input.topic, input.contentType);
      
      // Step 2: Generate search parameters
      const searchParameters = await this.generateSearchParameters(input);
      
      // Step 3: Create conversational query variations
      const conversationalQueries = this.generateConversationalQueries(input);

      const result: QueryIntent = {
        primary: primaryIntent.type,
        confidence: primaryIntent.confidence,
        entities,
        searchParameters,
        conversationalQueries
      };

      this.logger.log(`Query intent analysis complete. Primary intent: ${result.primary} (${result.confidence}% confidence)`);
      return result;

    } catch (error) {
      this.logger.error('Error analyzing query intent:', error);
      throw new Error(`Query intent analysis failed: ${error.message}`);
    }
  }

  private async extractEntities(topic: string): Promise<Array<{text: string; category: string; confidence: number}>> {
    // Entity extraction using NLP patterns
    const entities = [];
    
    // Technology entities
    const techKeywords = ['AI', 'machine learning', 'automation', 'cloud', 'API', 'software', 'platform', 'system'];
    techKeywords.forEach(keyword => {
      if (topic.toLowerCase().includes(keyword.toLowerCase())) {
        entities.push({
          text: keyword,
          category: 'technology',
          confidence: 0.9
        });
      }
    });

    // Business entities
    const businessKeywords = ['strategy', 'growth', 'revenue', 'ROI', 'efficiency', 'optimization', 'management'];
    businessKeywords.forEach(keyword => {
      if (topic.toLowerCase().includes(keyword.toLowerCase())) {
        entities.push({
          text: keyword,
          category: 'business',
          confidence: 0.85
        });
      }
    });

    // Industry entities
    const industryKeywords = ['healthcare', 'finance', 'retail', 'manufacturing', 'education', 'government'];
    industryKeywords.forEach(keyword => {
      if (topic.toLowerCase().includes(keyword.toLowerCase())) {
        entities.push({
          text: keyword,
          category: 'industry',
          confidence: 0.8
        });
      }
    });

    return entities;
  }

  private classifyIntent(topic: string, contentType: string): {type: QueryIntent['primary']; confidence: number} {
    const topicLower = topic.toLowerCase();
    
    // Transactional intent indicators
    if (topicLower.includes('buy') || topicLower.includes('purchase') || topicLower.includes('price') || 
        topicLower.includes('cost') || contentType === 'product_review') {
      return { type: 'transactional', confidence: 0.9 };
    }

    // Commercial intent indicators
    if (topicLower.includes('best') || topicLower.includes('compare') || topicLower.includes('vs') ||
        topicLower.includes('review') || topicLower.includes('solution')) {
      return { type: 'commercial', confidence: 0.85 };
    }

    // Navigational intent indicators
    if (topicLower.includes('login') || topicLower.includes('dashboard') || topicLower.includes('portal') ||
        topicLower.includes('account')) {
      return { type: 'navigational', confidence: 0.8 };
    }

    // Default to informational
    return { type: 'informational', confidence: 0.75 };
  }

  private async generateSearchParameters(input: QueryAnalysisInput): Promise<QueryIntent['searchParameters']> {
    const topic = input.topic;
    const audience = input.audience;
    
    // Generate primary keywords
    const keywords = [
      topic,
      `${topic} ${audience}`,
      `${topic} guide`,
      `${topic} best practices`,
      `${topic} strategy`
    ];

    // Generate semantic variations
    const semanticVariations = [
      `how to ${topic}`,
      `${topic} implementation`,
      `${topic} benefits`,
      `${topic} challenges`,
      `${topic} trends 2024`,
      `${topic} for ${audience}`,
      `${topic} ROI`,
      `${topic} case study`
    ];

    // Generate related queries
    const relatedQueries = [
      `what is ${topic}`,
      `why ${topic} matters`,
      `${topic} vs alternatives`,
      `${topic} success stories`,
      `${topic} getting started`,
      `${topic} tools and platforms`,
      `${topic} metrics and KPIs`,
      `${topic} future outlook`
    ];

    return {
      keywords,
      semanticVariations,
      relatedQueries,
      queryType: input.contentType
    };
  }

  private generateConversationalQueries(input: QueryAnalysisInput): string[] {
    const topic = input.topic;
    const audience = input.audience;
    
    return [
      `Tell me about ${topic}`,
      `How can ${audience} benefit from ${topic}?`,
      `What are the best practices for ${topic}?`,
      `How do I get started with ${topic}?`,
      `What are the challenges with ${topic}?`,
      `Can you explain ${topic} in simple terms?`,
      `What's the ROI of ${topic}?`,
      `How does ${topic} compare to other solutions?`,
      `What tools do I need for ${topic}?`,
      `What are the latest trends in ${topic}?`,
      `How long does it take to implement ${topic}?`,
      `What are the costs associated with ${topic}?`,
      `Who are the leading providers of ${topic}?`,
      `What skills do I need for ${topic}?`,
      `How do I measure success with ${topic}?`
    ];
  }

  async generateQueryVariations(originalQuery: string): Promise<string[]> {
    // Generate multiple variations of the original query
    const variations = [];
    
    // Question variations
    variations.push(`What is ${originalQuery}?`);
    variations.push(`How does ${originalQuery} work?`);
    variations.push(`Why is ${originalQuery} important?`);
    
    // Action variations
    variations.push(`How to implement ${originalQuery}`);
    variations.push(`Getting started with ${originalQuery}`);
    variations.push(`${originalQuery} best practices`);
    
    // Comparison variations
    variations.push(`${originalQuery} vs alternatives`);
    variations.push(`Best ${originalQuery} solutions`);
    variations.push(`${originalQuery} comparison`);
    
    // Problem-solving variations
    variations.push(`${originalQuery} challenges`);
    variations.push(`${originalQuery} solutions`);
    variations.push(`${originalQuery} troubleshooting`);

    return variations;
  }

  async mapToConversationalPatterns(topic: string): Promise<{
    patterns: string[];
    followUpQuestions: string[];
    voiceSearchOptimized: string[];
  }> {
    const patterns = [
      `Tell me about ${topic}`,
      `Explain ${topic} to me`,
      `I want to learn about ${topic}`,
      `Help me understand ${topic}`
    ];

    const followUpQuestions = [
      `What else should I know about ${topic}?`,
      `Are there any alternatives to ${topic}?`,
      `What are the next steps for ${topic}?`,
      `How can I learn more about ${topic}?`
    ];

    const voiceSearchOptimized = [
      `Hey Google, what is ${topic}?`,
      `Alexa, tell me about ${topic}`,
      `How do I get started with ${topic}?`,
      `What are the benefits of ${topic}?`
    ];

    return {
      patterns,
      followUpQuestions,
      voiceSearchOptimized
    };
  }
}
