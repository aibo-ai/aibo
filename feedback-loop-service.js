const { CosmosClient } = require('@azure/cosmos');
const { ServiceBusClient } = require('@azure/service-bus');
const crypto = require('crypto');

class FeedbackLoopService {
  constructor() {
    this.cosmosClient = new CosmosClient({
      endpoint: process.env.COSMOS_DB_ENDPOINT,
      key: process.env.COSMOS_DB_KEY
    });
    this.database = this.cosmosClient.database('ContentArchitect');
    this.feedbackContainer = this.database.container('ContentFeedback');
    this.improvementsContainer = this.database.container('QualityImprovements');
    this.modelsContainer = this.database.container('LearningModels');

    // Service Bus for async processing
    this.serviceBusClient = new ServiceBusClient(process.env.AZURE_SERVICE_BUS_CONNECTION_STRING);
    this.feedbackSender = this.serviceBusClient.createSender('feedback-processing-queue');
  }

  /**
   * Collect feedback from various sources
   */
  async collectFeedback(feedbackData) {
    const feedbackId = this.generateFeedbackId();
    const timestamp = new Date().toISOString();

    const feedback = {
      id: feedbackId,
      contentId: feedbackData.contentId,
      versionId: feedbackData.versionId,
      source: feedbackData.source, // user, system, external_api, ab_test
      type: feedbackData.type, // quality, engagement, performance, seo
      
      // Feedback details
      rating: feedbackData.rating, // 1-5 scale
      metrics: feedbackData.metrics || {},
      comments: feedbackData.comments || '',
      
      // User information
      userId: feedbackData.userId,
      userRole: feedbackData.userRole, // content_creator, reviewer, end_user
      
      // Context
      context: {
        platform: feedbackData.platform,
        device: feedbackData.device,
        location: feedbackData.location,
        timestamp: timestamp
      },
      
      // Automated analysis
      sentiment: await this.analyzeSentiment(feedbackData.comments),
      categories: await this.categorizeFeedback(feedbackData),
      priority: this.calculatePriority(feedbackData),
      
      // Processing status
      status: 'pending',
      processedAt: null,
      improvements: [],
      
      // Metadata
      tags: feedbackData.tags || [],
      metadata: feedbackData.metadata || {}
    };

    try {
      const { resource } = await this.feedbackContainer.items.create(feedback);
      
      // Send to processing queue for async analysis
      await this.queueFeedbackProcessing(resource);
      
      console.log(`✅ Feedback collected: ${feedbackId}`);
      return resource;
    } catch (error) {
      console.error('❌ Error collecting feedback:', error);
      throw error;
    }
  }

  /**
   * Process feedback and generate improvements
   */
  async processFeedback(feedbackId) {
    try {
      const feedback = await this.getFeedback(feedbackId);
      if (!feedback) {
        throw new Error('Feedback not found');
      }

      // Analyze feedback patterns
      const patterns = await this.analyzeFeedbackPatterns(feedback);
      
      // Generate improvement suggestions
      const improvements = await this.generateImprovements(feedback, patterns);
      
      // Update learning models
      await this.updateLearningModels(feedback, improvements);
      
      // Create improvement records
      const improvementRecords = await this.createImprovementRecords(feedback, improvements);
      
      // Update feedback status
      await this.feedbackContainer.item(feedbackId).patch([
        { op: 'replace', path: '/status', value: 'processed' },
        { op: 'replace', path: '/processedAt', value: new Date().toISOString() },
        { op: 'replace', path: '/improvements', value: improvementRecords.map(r => r.id) }
      ]);

      console.log(`✅ Feedback processed: ${feedbackId}`);
      return {
        feedback,
        patterns,
        improvements: improvementRecords
      };
    } catch (error) {
      console.error('❌ Error processing feedback:', error);
      throw error;
    }
  }

  /**
   * Get improvement recommendations for content generation
   */
  async getImprovementRecommendations(contentRequest) {
    try {
      // Get historical feedback for similar content
      const similarFeedback = await this.findSimilarContentFeedback(contentRequest);
      
      // Get current learning models
      const models = await this.getCurrentLearningModels();
      
      // Generate recommendations
      const recommendations = {
        layerOptimizations: await this.getLayerOptimizations(contentRequest, similarFeedback, models),
        parameterAdjustments: await this.getParameterAdjustments(contentRequest, similarFeedback, models),
        qualityEnhancements: await this.getQualityEnhancements(contentRequest, similarFeedback, models),
        riskMitigations: await this.getRiskMitigations(contentRequest, similarFeedback, models)
      };

      return {
        recommendations,
        confidence: this.calculateRecommendationConfidence(recommendations, similarFeedback),
        basedOnSamples: similarFeedback.length,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting improvement recommendations:', error);
      throw error;
    }
  }

  /**
   * Apply improvements to content generation process
   */
  async applyImprovements(contentRequest, improvements) {
    const optimizedRequest = { ...contentRequest };

    // Apply layer-specific optimizations
    if (improvements.layerOptimizations) {
      optimizedRequest.layerOptimizations = improvements.layerOptimizations;
    }

    // Apply parameter adjustments
    if (improvements.parameterAdjustments) {
      Object.keys(improvements.parameterAdjustments).forEach(param => {
        optimizedRequest[param] = improvements.parameterAdjustments[param];
      });
    }

    // Apply quality enhancements
    if (improvements.qualityEnhancements) {
      optimizedRequest.qualityEnhancements = improvements.qualityEnhancements;
    }

    // Add improvement metadata
    optimizedRequest.improvementMetadata = {
      appliedAt: new Date().toISOString(),
      improvementVersion: improvements.version || '1.0',
      basedOnFeedback: improvements.basedOnSamples || 0,
      confidence: improvements.confidence || 0.5
    };

    return optimizedRequest;
  }

  /**
   * Track improvement effectiveness
   */
  async trackImprovementEffectiveness(improvementId, results) {
    try {
      const effectiveness = {
        id: `effectiveness_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        improvementId,
        results,
        
        // Metrics comparison
        beforeMetrics: results.beforeMetrics || {},
        afterMetrics: results.afterMetrics || {},
        improvement: this.calculateImprovementDelta(results.beforeMetrics, results.afterMetrics),
        
        // Effectiveness scores
        qualityImprovement: results.qualityImprovement || 0,
        userSatisfactionImprovement: results.userSatisfactionImprovement || 0,
        performanceImprovement: results.performanceImprovement || 0,
        
        // Validation
        validated: results.validated || false,
        validationMethod: results.validationMethod || 'automatic',
        
        timestamp: new Date().toISOString()
      };

      await this.improvementsContainer.items.create(effectiveness);
      
      // Update learning models with effectiveness data
      await this.updateModelEffectiveness(improvementId, effectiveness);
      
      return effectiveness;
    } catch (error) {
      console.error('❌ Error tracking improvement effectiveness:', error);
      throw error;
    }
  }

  /**
   * Get feedback analytics and insights
   */
  async getFeedbackAnalytics(filters = {}) {
    try {
      const timeRange = filters.timeRange || 30; // days
      const startDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000).toISOString();

      // Get feedback data
      const { resources: feedback } = await this.feedbackContainer.items.query({
        query: `
          SELECT * FROM c 
          WHERE c.context.timestamp >= @startDate
          ORDER BY c.context.timestamp DESC
        `,
        parameters: [{ name: '@startDate', value: startDate }]
      }).fetchAll();

      // Calculate analytics
      const analytics = {
        totalFeedback: feedback.length,
        averageRating: this.calculateAverageRating(feedback),
        feedbackBySource: this.groupFeedbackBySource(feedback),
        feedbackByType: this.groupFeedbackByType(feedback),
        sentimentAnalysis: this.analyzeFeedbackSentiment(feedback),
        trendAnalysis: this.analyzeFeedbackTrends(feedback),
        topIssues: this.identifyTopIssues(feedback),
        improvementOpportunities: this.identifyImprovementOpportunities(feedback),
        qualityTrends: this.analyzeQualityTrends(feedback),
        userSatisfactionTrends: this.analyzeUserSatisfactionTrends(feedback)
      };

      return analytics;
    } catch (error) {
      console.error('❌ Error getting feedback analytics:', error);
      throw error;
    }
  }

  /**
   * Generate quality improvement report
   */
  async generateQualityReport(contentId = null) {
    try {
      let query = 'SELECT * FROM c';
      const parameters = [];

      if (contentId) {
        query += ' WHERE c.contentId = @contentId';
        parameters.push({ name: '@contentId', value: contentId });
      }

      const { resources: improvements } = await this.improvementsContainer.items.query({
        query,
        parameters
      }).fetchAll();

      const report = {
        totalImprovements: improvements.length,
        successfulImprovements: improvements.filter(i => i.effectiveness?.improvement > 0).length,
        averageImprovement: this.calculateAverageImprovement(improvements),
        topImprovementAreas: this.identifyTopImprovementAreas(improvements),
        recommendedActions: this.generateRecommendedActions(improvements),
        qualityTrends: this.analyzeQualityImprovementTrends(improvements),
        roi: this.calculateImprovementROI(improvements),
        generatedAt: new Date().toISOString()
      };

      return report;
    } catch (error) {
      console.error('❌ Error generating quality report:', error);
      throw error;
    }
  }

  // Helper methods
  generateFeedbackId() {
    return `feedback_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  }

  async analyzeSentiment(text) {
    if (!text) return { score: 0, label: 'neutral' };
    
    // Simple sentiment analysis (in production, use Azure Text Analytics)
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'love'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'poor', 'worst'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    const score = (positiveCount - negativeCount) / words.length;
    let label = 'neutral';
    if (score > 0.1) label = 'positive';
    else if (score < -0.1) label = 'negative';
    
    return { score, label, positiveCount, negativeCount };
  }

  async categorizeFeedback(feedbackData) {
    const categories = [];
    
    // Categorize based on type and content
    if (feedbackData.type === 'quality') categories.push('content_quality');
    if (feedbackData.type === 'performance') categories.push('system_performance');
    if (feedbackData.type === 'seo') categories.push('seo_optimization');
    if (feedbackData.type === 'engagement') categories.push('user_engagement');
    
    // Categorize based on rating
    if (feedbackData.rating <= 2) categories.push('critical_issue');
    else if (feedbackData.rating <= 3) categories.push('improvement_needed');
    else if (feedbackData.rating >= 4) categories.push('positive_feedback');
    
    return categories;
  }

  calculatePriority(feedbackData) {
    let priority = 'medium';
    
    if (feedbackData.rating <= 2) priority = 'high';
    else if (feedbackData.rating >= 4) priority = 'low';
    
    if (feedbackData.source === 'system' && feedbackData.type === 'performance') {
      priority = 'high';
    }
    
    return priority;
  }

  async queueFeedbackProcessing(feedback) {
    try {
      const message = {
        body: {
          feedbackId: feedback.id,
          priority: feedback.priority,
          type: feedback.type
        }
      };
      
      await this.feedbackSender.sendMessages(message);
    } catch (error) {
      console.error('❌ Error queuing feedback processing:', error);
    }
  }

  async getFeedback(feedbackId) {
    try {
      const { resource } = await this.feedbackContainer.item(feedbackId).read();
      return resource;
    } catch (error) {
      if (error.code === 404) return null;
      throw error;
    }
  }

  async analyzeFeedbackPatterns(feedback) {
    // Analyze patterns in feedback data
    return {
      commonIssues: this.identifyCommonIssues([feedback]),
      qualityPatterns: this.identifyQualityPatterns([feedback]),
      userBehaviorPatterns: this.identifyUserBehaviorPatterns([feedback]),
      temporalPatterns: this.identifyTemporalPatterns([feedback])
    };
  }

  async generateImprovements(feedback, patterns) {
    const improvements = [];

    // Generate improvements based on feedback type
    switch (feedback.type) {
      case 'quality':
        improvements.push(...this.generateQualityImprovements(feedback, patterns));
        break;
      case 'performance':
        improvements.push(...this.generatePerformanceImprovements(feedback, patterns));
        break;
      case 'seo':
        improvements.push(...this.generateSEOImprovements(feedback, patterns));
        break;
      case 'engagement':
        improvements.push(...this.generateEngagementImprovements(feedback, patterns));
        break;
    }

    return improvements;
  }

  generateQualityImprovements(feedback, patterns) {
    const improvements = [];

    if (feedback.rating <= 3) {
      improvements.push({
        type: 'content_structure',
        description: 'Improve content structure and readability',
        parameters: {
          enhanceReadability: true,
          improveStructure: true,
          addMoreExamples: true
        },
        confidence: 0.8
      });

      improvements.push({
        type: 'authority_enhancement',
        description: 'Enhance authority signals and citations',
        parameters: {
          increaseEEATSignals: true,
          addMoreCitations: true,
          improveResearch: true
        },
        confidence: 0.7
      });
    }

    return improvements;
  }

  generatePerformanceImprovements(feedback, patterns) {
    return [
      {
        type: 'processing_optimization',
        description: 'Optimize processing performance',
        parameters: {
          optimizeLayerProcessing: true,
          enableCaching: true,
          parallelizeOperations: true
        },
        confidence: 0.9
      }
    ];
  }

  generateSEOImprovements(feedback, patterns) {
    return [
      {
        type: 'seo_optimization',
        description: 'Enhance SEO optimization',
        parameters: {
          improveKeywordDensity: true,
          enhanceMetaTags: true,
          optimizeSchemaMarkup: true
        },
        confidence: 0.8
      }
    ];
  }

  generateEngagementImprovements(feedback, patterns) {
    return [
      {
        type: 'engagement_enhancement',
        description: 'Improve user engagement',
        parameters: {
          addInteractiveElements: true,
          improveCallToActions: true,
          enhanceVisualElements: true
        },
        confidence: 0.7
      }
    ];
  }

  async updateLearningModels(feedback, improvements) {
    // Update machine learning models with new feedback data
    const modelUpdate = {
      id: `model_update_${Date.now()}`,
      feedbackId: feedback.id,
      improvements: improvements,
      timestamp: new Date().toISOString(),
      modelVersion: '1.0'
    };

    try {
      await this.modelsContainer.items.create(modelUpdate);
    } catch (error) {
      console.error('❌ Error updating learning models:', error);
    }
  }

  async createImprovementRecords(feedback, improvements) {
    const records = [];

    for (const improvement of improvements) {
      const record = {
        id: `improvement_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
        feedbackId: feedback.id,
        contentId: feedback.contentId,
        type: improvement.type,
        description: improvement.description,
        parameters: improvement.parameters,
        confidence: improvement.confidence,
        status: 'pending',
        createdAt: new Date().toISOString(),
        appliedAt: null,
        effectiveness: null
      };

      const { resource } = await this.improvementsContainer.items.create(record);
      records.push(resource);
    }

    return records;
  }

  // Analytics helper methods
  calculateAverageRating(feedback) {
    if (feedback.length === 0) return 0;
    const ratings = feedback.filter(f => f.rating).map(f => f.rating);
    return ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
  }

  groupFeedbackBySource(feedback) {
    const grouped = {};
    feedback.forEach(f => {
      grouped[f.source] = (grouped[f.source] || 0) + 1;
    });
    return grouped;
  }

  groupFeedbackByType(feedback) {
    const grouped = {};
    feedback.forEach(f => {
      grouped[f.type] = (grouped[f.type] || 0) + 1;
    });
    return grouped;
  }

  analyzeFeedbackSentiment(feedback) {
    const sentiments = feedback.filter(f => f.sentiment).map(f => f.sentiment);
    const positive = sentiments.filter(s => s.label === 'positive').length;
    const negative = sentiments.filter(s => s.label === 'negative').length;
    const neutral = sentiments.filter(s => s.label === 'neutral').length;

    return {
      positive: (positive / sentiments.length * 100).toFixed(1),
      negative: (negative / sentiments.length * 100).toFixed(1),
      neutral: (neutral / sentiments.length * 100).toFixed(1),
      averageScore: sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length
    };
  }

  identifyCommonIssues(feedback) {
    // Identify common issues from feedback
    return ['content_quality', 'processing_speed', 'seo_optimization'];
  }

  identifyQualityPatterns(feedback) {
    // Identify quality-related patterns
    return ['low_readability', 'insufficient_citations', 'poor_structure'];
  }

  identifyUserBehaviorPatterns(feedback) {
    // Identify user behavior patterns
    return ['quick_feedback', 'detailed_comments', 'rating_only'];
  }

  identifyTemporalPatterns(feedback) {
    // Identify temporal patterns in feedback
    return ['peak_hours', 'weekend_usage', 'seasonal_trends'];
  }

  calculateImprovementDelta(beforeMetrics, afterMetrics) {
    if (!beforeMetrics || !afterMetrics) return 0;
    
    const qualityDelta = (afterMetrics.qualityScore || 0) - (beforeMetrics.qualityScore || 0);
    const eeatDelta = (afterMetrics.eeatScore || 0) - (beforeMetrics.eeatScore || 0);
    
    return (qualityDelta + eeatDelta) / 2;
  }
}

module.exports = { FeedbackLoopService };
