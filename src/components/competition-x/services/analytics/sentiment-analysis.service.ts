import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

export interface SentimentAnalysisRequest {
  text: string;
  language?: string;
  context?: 'social_media' | 'review' | 'news' | 'general';
  includeEmotions?: boolean;
  includeKeywords?: boolean;
  includeEntities?: boolean;
}

export interface SentimentAnalysisResult {
  overall: {
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number; // -1.0 to 1.0
    confidence: number; // 0.0 to 1.0
    magnitude: number; // 0.0 to 1.0 (strength of sentiment)
  };
  emotions?: {
    joy: number;
    anger: number;
    fear: number;
    sadness: number;
    surprise: number;
    disgust: number;
  };
  keywords?: Array<{
    keyword: string;
    sentiment: number;
    relevance: number;
    frequency: number;
  }>;
  entities?: Array<{
    entity: string;
    type: 'person' | 'organization' | 'location' | 'product' | 'other';
    sentiment: number;
    confidence: number;
    mentions: number;
  }>;
  aspects?: Array<{
    aspect: string;
    sentiment: number;
    confidence: number;
    mentions: Array<{
      text: string;
      sentiment: number;
    }>;
  }>;
  metadata: {
    language: string;
    wordCount: number;
    processingTime: number;
    model: string;
  };
}

export interface BulkSentimentAnalysisRequest {
  texts: Array<{
    id: string;
    text: string;
    metadata?: any;
  }>;
  options: Omit<SentimentAnalysisRequest, 'text'>;
}

export interface BulkSentimentAnalysisResult {
  results: Array<{
    id: string;
    sentiment: SentimentAnalysisResult;
    error?: string;
  }>;
  summary: {
    totalProcessed: number;
    successful: number;
    failed: number;
    averageSentiment: number;
    sentimentDistribution: {
      positive: number;
      negative: number;
      neutral: number;
    };
    processingTime: number;
  };
}

@Injectable()
export class SentimentAnalysisService {
  private readonly logger = new Logger(SentimentAnalysisService.name);
  
  // Azure Cognitive Services configuration
  private readonly azureTextAnalyticsEndpoint: string;
  private readonly azureTextAnalyticsKey: string;
  
  // Alternative sentiment analysis APIs
  private readonly googleCloudApiKey: string;
  private readonly awsAccessKey: string;
  private readonly awsSecretKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.azureTextAnalyticsEndpoint = this.configService.get('AZURE_TEXT_ANALYTICS_ENDPOINT', '');
    this.azureTextAnalyticsKey = this.configService.get('AZURE_TEXT_ANALYTICS_KEY', '');
    this.googleCloudApiKey = this.configService.get('GOOGLE_CLOUD_API_KEY', '');
    this.awsAccessKey = this.configService.get('AWS_ACCESS_KEY', '');
    this.awsSecretKey = this.configService.get('AWS_SECRET_KEY', '');
  }

  /**
   * Analyze sentiment of a single text
   */
  async analyzeSentiment(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Analyzing sentiment for text (${request.text.length} characters)`);

      // Validate input
      if (!request.text || request.text.trim().length === 0) {
        throw new Error('Text is required for sentiment analysis');
      }

      if (request.text.length > 10000) {
        throw new Error('Text is too long for sentiment analysis (max 10,000 characters)');
      }

      // Perform sentiment analysis
      const result = await this.performSentimentAnalysis(request);
      
      const processingTime = Date.now() - startTime;
      result.metadata.processingTime = processingTime;

      this.appInsights.trackEvent('CompetitionX:SentimentAnalyzed', {
        textLength: request.text.length.toString(),
        sentiment: result.overall.sentiment,
        score: result.overall.score.toString(),
        confidence: result.overall.confidence.toString(),
        processingTime: processingTime.toString()
      });

      this.logger.log(`Sentiment analysis completed: ${result.overall.sentiment} (${result.overall.score.toFixed(2)}) in ${processingTime}ms`);
      return result;

    } catch (error) {
      this.logger.error(`Sentiment analysis failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'AnalyzeSentiment',
        textLength: request.text?.length?.toString()
      });
      throw error;
    }
  }

  /**
   * Analyze sentiment for multiple texts
   */
  async analyzeBulkSentiment(request: BulkSentimentAnalysisRequest): Promise<BulkSentimentAnalysisResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Analyzing sentiment for ${request.texts.length} texts`);

      const results = [];
      let successful = 0;
      let failed = 0;
      let totalSentiment = 0;
      const sentimentCounts = { positive: 0, negative: 0, neutral: 0 };

      // Process each text
      for (const textItem of request.texts) {
        try {
          const sentimentRequest: SentimentAnalysisRequest = {
            text: textItem.text,
            ...request.options
          };

          const sentiment = await this.performSentimentAnalysis(sentimentRequest);
          
          results.push({
            id: textItem.id,
            sentiment
          });

          successful++;
          totalSentiment += sentiment.overall.score;
          sentimentCounts[sentiment.overall.sentiment]++;

        } catch (error) {
          results.push({
            id: textItem.id,
            sentiment: null,
            error: error.message
          });
          failed++;
        }
      }

      const processingTime = Date.now() - startTime;

      const bulkResult: BulkSentimentAnalysisResult = {
        results,
        summary: {
          totalProcessed: request.texts.length,
          successful,
          failed,
          averageSentiment: successful > 0 ? totalSentiment / successful : 0,
          sentimentDistribution: {
            positive: sentimentCounts.positive / successful * 100,
            negative: sentimentCounts.negative / successful * 100,
            neutral: sentimentCounts.neutral / successful * 100
          },
          processingTime
        }
      };

      this.appInsights.trackEvent('CompetitionX:BulkSentimentAnalyzed', {
        totalTexts: request.texts.length.toString(),
        successful: successful.toString(),
        failed: failed.toString(),
        averageSentiment: bulkResult.summary.averageSentiment.toString(),
        processingTime: processingTime.toString()
      });

      this.logger.log(`Bulk sentiment analysis completed: ${successful}/${request.texts.length} successful in ${processingTime}ms`);
      return bulkResult;

    } catch (error) {
      this.logger.error(`Bulk sentiment analysis failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'AnalyzeBulkSentiment',
        textCount: request.texts?.length?.toString()
      });
      throw error;
    }
  }

  /**
   * Analyze sentiment trends over time
   */
  async analyzeSentimentTrends(
    texts: Array<{ text: string; timestamp: Date; metadata?: any }>,
    timeGranularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    trends: Array<{
      period: string;
      averageSentiment: number;
      sentimentDistribution: { positive: number; negative: number; neutral: number };
      volume: number;
      topKeywords: string[];
    }>;
    overallTrend: 'improving' | 'declining' | 'stable';
    insights: string[];
  }> {
    
    try {
      this.logger.log(`Analyzing sentiment trends for ${texts.length} texts`);

      // Group texts by time period
      const groupedTexts = this.groupTextsByTimePeriod(texts, timeGranularity);
      
      const trends = [];
      
      for (const [period, periodTexts] of Object.entries(groupedTexts)) {
        // Analyze sentiment for each period
        const bulkRequest: BulkSentimentAnalysisRequest = {
          texts: periodTexts.map((t, i) => ({ id: i.toString(), text: t.text })),
          options: { includeKeywords: true }
        };

        const bulkResult = await this.analyzeBulkSentiment(bulkRequest);
        
        // Extract top keywords
        const allKeywords = bulkResult.results
          .filter(r => r.sentiment?.keywords)
          .flatMap(r => r.sentiment.keywords)
          .sort((a, b) => b.relevance - a.relevance)
          .slice(0, 5)
          .map(k => k.keyword);

        trends.push({
          period,
          averageSentiment: bulkResult.summary.averageSentiment,
          sentimentDistribution: bulkResult.summary.sentimentDistribution,
          volume: periodTexts.length,
          topKeywords: allKeywords
        });
      }

      // Determine overall trend
      const overallTrend = this.calculateOverallTrend(trends);
      
      // Generate insights
      const insights = this.generateTrendInsights(trends, overallTrend);

      return {
        trends,
        overallTrend,
        insights
      };

    } catch (error) {
      this.logger.error(`Sentiment trend analysis failed: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Perform the actual sentiment analysis
   */
  private async performSentimentAnalysis(request: SentimentAnalysisRequest): Promise<SentimentAnalysisResult> {
    // In a real implementation, this would call Azure Text Analytics, Google Cloud Natural Language, or AWS Comprehend
    // For now, we'll simulate the analysis
    
    const text = request.text.toLowerCase();
    const wordCount = text.split(/\s+/).length;
    
    // Simple sentiment scoring based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome', 'fantastic', 'wonderful', 'perfect'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing', 'poor', 'useless', 'broken'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      positiveScore += matches;
    });
    
    negativeWords.forEach(word => {
      const matches = (text.match(new RegExp(word, 'g')) || []).length;
      negativeScore += matches;
    });
    
    // Calculate overall sentiment
    const totalWords = positiveScore + negativeScore;
    let sentimentScore = 0;
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    
    if (totalWords > 0) {
      sentimentScore = (positiveScore - negativeScore) / Math.max(totalWords, wordCount / 10);
      sentimentScore = Math.max(-1, Math.min(1, sentimentScore));
      
      if (sentimentScore > 0.1) sentiment = 'positive';
      else if (sentimentScore < -0.1) sentiment = 'negative';
    }
    
    const confidence = Math.min(0.95, Math.max(0.5, totalWords / (wordCount / 10) + 0.3));
    const magnitude = Math.abs(sentimentScore);

    const result: SentimentAnalysisResult = {
      overall: {
        sentiment,
        score: sentimentScore,
        confidence,
        magnitude
      },
      metadata: {
        language: request.language || 'en',
        wordCount,
        processingTime: 0, // Will be set by caller
        model: 'simulated-sentiment-v1.0'
      }
    };

    // Add emotions if requested
    if (request.includeEmotions) {
      result.emotions = {
        joy: sentiment === 'positive' ? Math.random() * 0.5 + 0.3 : Math.random() * 0.3,
        anger: sentiment === 'negative' ? Math.random() * 0.5 + 0.3 : Math.random() * 0.2,
        fear: Math.random() * 0.3,
        sadness: sentiment === 'negative' ? Math.random() * 0.4 + 0.2 : Math.random() * 0.2,
        surprise: Math.random() * 0.4,
        disgust: sentiment === 'negative' ? Math.random() * 0.3 + 0.1 : Math.random() * 0.1
      };
    }

    // Add keywords if requested
    if (request.includeKeywords) {
      result.keywords = this.extractKeywords(text, sentimentScore);
    }

    // Add entities if requested
    if (request.includeEntities) {
      result.entities = this.extractEntities(text, sentimentScore);
    }

    // Add aspects for detailed analysis
    result.aspects = this.extractAspects(text, sentimentScore);

    return result;
  }

  /**
   * Extract keywords with sentiment
   */
  private extractKeywords(text: string, overallSentiment: number): SentimentAnalysisResult['keywords'] {
    const words = text.toLowerCase().split(/\s+/);
    const wordFreq = {};
    
    words.forEach(word => {
      if (word.length > 3) {
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });

    return Object.entries(wordFreq)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 10)
      .map(([keyword, frequency]) => ({
        keyword,
        sentiment: overallSentiment + (Math.random() - 0.5) * 0.4,
        relevance: Math.min(1, (frequency as number) / words.length * 10),
        frequency: frequency as number
      }));
  }

  /**
   * Extract entities with sentiment
   */
  private extractEntities(text: string, overallSentiment: number): SentimentAnalysisResult['entities'] {
    // Simulate entity extraction
    const entities = [];
    
    // Look for capitalized words (potential entities)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    const uniqueEntities = [...new Set(capitalizedWords)].slice(0, 5);
    
    uniqueEntities.forEach(entity => {
      entities.push({
        entity,
        type: ['person', 'organization', 'location', 'product'][Math.floor(Math.random() * 4)] as any,
        sentiment: overallSentiment + (Math.random() - 0.5) * 0.3,
        confidence: Math.random() * 0.4 + 0.6,
        mentions: Math.floor(Math.random() * 3) + 1
      });
    });

    return entities;
  }

  /**
   * Extract aspects with sentiment
   */
  private extractAspects(text: string, overallSentiment: number): SentimentAnalysisResult['aspects'] {
    const commonAspects = ['quality', 'price', 'service', 'features', 'usability', 'support'];
    const aspects = [];

    commonAspects.forEach(aspect => {
      if (text.toLowerCase().includes(aspect)) {
        aspects.push({
          aspect,
          sentiment: overallSentiment + (Math.random() - 0.5) * 0.4,
          confidence: Math.random() * 0.3 + 0.7,
          mentions: [{
            text: `Mention of ${aspect} in the text`,
            sentiment: overallSentiment + (Math.random() - 0.5) * 0.3
          }]
        });
      }
    });

    return aspects;
  }

  /**
   * Group texts by time period
   */
  private groupTextsByTimePeriod(
    texts: Array<{ text: string; timestamp: Date; metadata?: any }>,
    granularity: 'hour' | 'day' | 'week' | 'month'
  ): { [period: string]: Array<{ text: string; timestamp: Date; metadata?: any }> } {
    
    const grouped = {};
    
    texts.forEach(textItem => {
      let period: string;
      const date = new Date(textItem.timestamp);
      
      switch (granularity) {
        case 'hour':
          period = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          period = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          period = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          period = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
      }
      
      if (!grouped[period]) {
        grouped[period] = [];
      }
      grouped[period].push(textItem);
    });
    
    return grouped;
  }

  /**
   * Calculate overall trend direction
   */
  private calculateOverallTrend(trends: any[]): 'improving' | 'declining' | 'stable' {
    if (trends.length < 2) return 'stable';
    
    const firstHalf = trends.slice(0, Math.floor(trends.length / 2));
    const secondHalf = trends.slice(Math.floor(trends.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, t) => sum + t.averageSentiment, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, t) => sum + t.averageSentiment, 0) / secondHalf.length;
    
    const difference = secondAvg - firstAvg;
    
    if (difference > 0.1) return 'improving';
    if (difference < -0.1) return 'declining';
    return 'stable';
  }

  /**
   * Generate insights from trend analysis
   */
  private generateTrendInsights(trends: any[], overallTrend: string): string[] {
    const insights = [];
    
    insights.push(`Overall sentiment trend is ${overallTrend}`);
    
    const avgSentiment = trends.reduce((sum, t) => sum + t.averageSentiment, 0) / trends.length;
    if (avgSentiment > 0.3) {
      insights.push('Generally positive sentiment across all periods');
    } else if (avgSentiment < -0.3) {
      insights.push('Generally negative sentiment across all periods');
    } else {
      insights.push('Mixed sentiment with neutral overall tone');
    }
    
    const maxVolume = Math.max(...trends.map(t => t.volume));
    const maxVolumePeriod = trends.find(t => t.volume === maxVolume);
    insights.push(`Highest activity in period: ${maxVolumePeriod.period}`);
    
    return insights;
  }
}
