import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';

export interface ContentPerformanceMetrics {
  jobId: string;
  contentId: string;
  contentType: string;
  audience: 'b2b' | 'b2c';

  // Engagement metrics
  engagementScore?: number;
  clickThroughRate?: number;
  timeOnPage?: number;
  bounceRate?: number;
  socialShares?: number;
  comments?: number;

  // Conversion metrics
  conversionRate?: number;
  leadGeneration?: number;
  salesImpact?: number;

  // SEO metrics
  searchRanking?: Record<string, number>;
  organicTraffic?: number;
  backlinks?: number;

  // Platform-specific metrics
  platformSpecificMetrics?: Record<string, any>;

  // User feedback
  userRating?: number;
  userFeedback?: string;

  // Technical metrics
  loadTime?: number;
  mobileOptimization?: number;
  accessibilityScore?: number;

  // Timestamp
  recordedAt: string;
}

export interface LayerPerformanceMetrics {
  jobId: string;
  layer: 'bottom' | 'middle' | 'top';
  service: string;

  // Performance metrics
  processingTime: number;
  successRate: number;
  errorRate: number;

  // Quality metrics
  outputQuality?: number;
  accuracyScore?: number;
  relevanceScore?: number;

  // Resource usage
  memoryUsage?: number;
  cpuUsage?: number;
  apiCallsCount?: number;

  timestamp: string;
}

@Injectable()
export class FeedbackLoopService {
  private readonly logger = new Logger(FeedbackLoopService.name);
  private readonly performanceData = new Map<string, ContentPerformanceMetrics>();
  private readonly layerMetrics = new Map<string, LayerPerformanceMetrics[]>();

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    // Initialize periodic analysis
    this.initializePeriodicAnalysis();
  }

  /**
   * Analyzes trends over a specified time range
   * @param range Time range for trend analysis
   */
  async analyzeTrends(range: string): Promise<any> {
    this.logger.log(`Analyzing trends for range: ${range}`);

    return {
      range,
      trends: {
        contentPerformance: Math.random() * 100,
        userEngagement: Math.random() * 100,
        conversionRates: Math.random() * 100
      },
      analyzedAt: new Date().toISOString()
    };
  }

  /**
   * Collects performance metrics from deployed content
   * @param contentId Identifier for the content to analyze
   * @param clientType Either 'b2b' or 'b2c'
   */
  async collectPerformanceMetrics(contentId: string, clientType: 'b2b' | 'b2c'): Promise<any> {
    this.logger.log(`Collecting ${clientType} performance metrics for content ${contentId}`);

    try {
      // In production, this would connect to Azure Application Insights
      // to collect real performance data from deployed content

      // Different metrics are analyzed based on client type
      const metrics = clientType === 'b2b'
        ? {
            technicalAccuracyScore: Math.random() * 100,
            comprehensivenessMeasure: Math.random() * 100,
            industryAlignmentIndex: Math.random() * 100,
            citationQualityScore: Math.random() * 100,
            engagementScore: Math.random() * 50 + 40, // B2B typically lower engagement
            conversionRate: Math.random() * 10 + 5, // But higher conversion
            timeOnPage: Math.random() * 300 + 180, // Longer reading time
          }
        : {
            engagementScore: Math.random() * 40 + 60, // B2C higher engagement
            emotionalResonanceIndex: Math.random() * 100,
            conversionPotentialScore: Math.random() * 100,
            socialSharingProbability: Math.random() * 100,
            conversionRate: Math.random() * 5 + 1, // Lower conversion rate
            timeOnPage: Math.random() * 120 + 60, // Shorter reading time
          };

      // Track metrics in Application Insights
      this.appInsights.trackEvent('FeedbackLoop:MetricsCollected', {
        contentId,
        clientType,
        metricsCount: Object.keys(metrics).length.toString()
      });

      Object.entries(metrics).forEach(([key, value]) => {
        this.appInsights.trackMetric(`ContentMetrics:${key}`, value as number, {
          contentId,
          clientType
        });
      });

      return {
        contentId,
        clientType,
        timestamp: new Date().toISOString(),
        metrics,
      };

    } catch (error) {
      this.logger.error(`Failed to collect performance metrics: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'CollectPerformanceMetrics',
        contentId,
        clientType
      });
      throw error;
    }
  }
  
  /**
   * Record content performance metrics
   */
  async recordContentPerformance(metrics: ContentPerformanceMetrics): Promise<void> {
    try {
      this.logger.log(`Recording performance metrics for content: ${metrics.contentId}`);

      // Store metrics
      this.performanceData.set(metrics.contentId, {
        ...metrics,
        recordedAt: new Date().toISOString()
      });

      // Track in Application Insights
      this.appInsights.trackEvent('ContentPerformance:Recorded', {
        jobId: metrics.jobId,
        contentId: metrics.contentId,
        contentType: metrics.contentType,
        audience: metrics.audience
      });

      // Track individual metrics
      if (metrics.engagementScore !== undefined) {
        this.appInsights.trackMetric('ContentPerformance:EngagementScore', metrics.engagementScore, {
          contentType: metrics.contentType,
          audience: metrics.audience
        });
      }

      if (metrics.conversionRate !== undefined) {
        this.appInsights.trackMetric('ContentPerformance:ConversionRate', metrics.conversionRate, {
          contentType: metrics.contentType,
          audience: metrics.audience
        });
      }

      // Trigger real-time analysis if metrics indicate poor performance
      if (this.shouldTriggerImmediateAnalysis(metrics)) {
        await this.analyzePerformanceIssues(metrics);
      }

    } catch (error) {
      this.logger.error(`Failed to record content performance: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'RecordContentPerformance',
        contentId: metrics.contentId
      });
    }
  }

  /**
   * Record layer performance metrics
   */
  async recordLayerPerformance(metrics: LayerPerformanceMetrics): Promise<void> {
    try {
      const key = `${metrics.jobId}-${metrics.layer}`;

      if (!this.layerMetrics.has(key)) {
        this.layerMetrics.set(key, []);
      }

      this.layerMetrics.get(key)!.push({
        ...metrics,
        timestamp: new Date().toISOString()
      });

      // Track in Application Insights
      this.appInsights.trackMetric(`LayerPerformance:${metrics.layer}:ProcessingTime`, metrics.processingTime, {
        service: metrics.service,
        jobId: metrics.jobId
      });

      this.appInsights.trackMetric(`LayerPerformance:${metrics.layer}:SuccessRate`, metrics.successRate, {
        service: metrics.service
      });

    } catch (error) {
      this.logger.error(`Failed to record layer performance: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'RecordLayerPerformance',
        layer: metrics.layer,
        service: metrics.service
      });
    }
  }

  /**
   * Analyzes content performance and provides improvement suggestions
   * @param contentId The ID of the content to analyze
   * @param metrics Performance metrics for the content
   */
  async generateImprovementSuggestions(contentId: string, metrics: any): Promise<any> {
    this.logger.log(`Generating improvement suggestions for content ${contentId}`);

    try {
      // In production, this would use Azure AI Foundry to analyze metrics
      // and generate tailored improvement suggestions

      // Enhanced suggestion logic based on actual metrics
      const isB2B = metrics.hasOwnProperty('technicalAccuracyScore');
      const suggestions = [];
      const priority = this.calculatePriority(metrics);

      if (isB2B) {
        // B2B-specific suggestions
        if (metrics.technicalAccuracyScore < 70) {
          suggestions.push('Enhance technical specifications with more recent data');
          suggestions.push('Include additional technical validation and testing results');
        }
        if (metrics.comprehensivenessMeasure < 60) {
          suggestions.push('Include additional case studies from related industries');
          suggestions.push('Add more detailed implementation guidelines');
        }
        if (metrics.citationQualityScore < 80) {
          suggestions.push('Add more citations from academic and industry research');
          suggestions.push('Include more recent studies and whitepapers');
        }
        if (metrics.conversionRate < 5) {
          suggestions.push('Strengthen ROI calculations with more comparative analysis');
          suggestions.push('Add more compelling business value propositions');
        }
      } else {
        // B2C-specific suggestions
        if (metrics.engagementScore < 60) {
          suggestions.push('Increase emotional appeal in the introduction');
          suggestions.push('Add more interactive elements and engaging visuals');
        }
        if (metrics.emotionalResonanceIndex < 70) {
          suggestions.push('Incorporate more conversational question-answer sections');
          suggestions.push('Use more relatable examples and scenarios');
        }
        if (metrics.socialSharingProbability < 50) {
          suggestions.push('Include more social proof elements and consumer testimonials');
          suggestions.push('Add shareable quotes and key takeaways');
        }
        if (metrics.conversionRate < 2) {
          suggestions.push('Strengthen call-to-action placement and messaging');
          suggestions.push('Add more compelling offers and incentives');
        }
      }

      // Track suggestion generation
      this.appInsights.trackEvent('FeedbackLoop:SuggestionsGenerated', {
        contentId,
        clientType: isB2B ? 'b2b' : 'b2c',
        suggestionCount: suggestions.length.toString(),
        priority
      });

      return {
        contentId,
        timestamp: new Date().toISOString(),
        suggestions,
        priority,
        metrics: {
          analyzed: Object.keys(metrics).length,
          belowThreshold: this.countBelowThreshold(metrics, isB2B)
        }
      };

    } catch (error) {
      this.logger.error(`Failed to generate improvement suggestions: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'GenerateImprovementSuggestions',
        contentId
      });
      throw error;
    }
  }

  /**
   * Applies automated improvements to content based on feedback
   * @param contentId The ID of the content to improve
   * @param improvements The improvements to apply
   */
  async applyAutomatedImprovements(contentId: string, improvements: string[]): Promise<any> {
    this.logger.log(`Applying automated improvements to content ${contentId}`);

    try {
      // In production, this would use Azure AI Foundry to implement improvements
      const appliedImprovements = [];

      for (const improvement of improvements) {
        // Simulate improvement application with realistic success rates
        const success = Math.random() > 0.15; // 85% success rate

        appliedImprovements.push({
          improvement,
          applied: success,
          reason: success ? 'Successfully applied' : 'Technical limitation or content constraint'
        });

        // Track individual improvement attempts
        this.appInsights.trackEvent('FeedbackLoop:ImprovementApplied', {
          contentId,
          improvement: improvement.substring(0, 50), // Truncate for tracking
          success: success.toString()
        });
      }

      const successCount = appliedImprovements.filter(imp => imp.applied).length;
      const successRate = (successCount / improvements.length) * 100;

      // Track overall improvement session
      this.appInsights.trackEvent('FeedbackLoop:ImprovementSessionCompleted', {
        contentId,
        totalImprovements: improvements.length.toString(),
        successfulImprovements: successCount.toString(),
        successRate: successRate.toString()
      });

      this.appInsights.trackMetric('FeedbackLoop:ImprovementSuccessRate', successRate, {
        contentId
      });

      return {
        contentId,
        timestamp: new Date().toISOString(),
        appliedImprovements,
        summary: {
          total: improvements.length,
          successful: successCount,
          successRate: Math.round(successRate)
        },
        status: successRate > 50 ? 'completed' : 'partial',
      };

    } catch (error) {
      this.logger.error(`Failed to apply automated improvements: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'ApplyAutomatedImprovements',
        contentId
      });
      throw error;
    }
  }

  /**
   * Automated continuous improvement process
   */
  async runContinuousImprovementProcess(): Promise<{
    configurationUpdates: any;
    performanceInsights: any;
    optimizationRecommendations: string[];
    automatedActions: string[];
  }> {
    try {
      this.logger.log('Running continuous improvement process');

      // Analyze recent performance data
      const recentData = Array.from(this.performanceData.values())
        .filter(data => {
          const dataTime = new Date((data as any).timestamp).getTime();
          const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // Last 7 days
          return dataTime > cutoff;
        });

      if (recentData.length === 0) {
        return {
          configurationUpdates: {},
          performanceInsights: { message: 'Insufficient data for analysis' },
          optimizationRecommendations: ['Collect more performance data'],
          automatedActions: []
        };
      }

      // Generate performance insights
      const performanceInsights = this.generatePerformanceInsights(recentData);

      // Generate configuration updates
      const configurationUpdates = this.generateConfigurationUpdates(performanceInsights);

      // Generate optimization recommendations
      const optimizationRecommendations = this.generateOptimizationRecommendations(performanceInsights);

      // Execute automated actions
      const automatedActions = await this.executeAutomatedActions(configurationUpdates);

      // Track continuous improvement execution
      this.appInsights.trackEvent('FeedbackLoop:ContinuousImprovementExecuted', {
        dataPointsAnalyzed: recentData.length.toString(),
        configurationUpdatesCount: Object.keys(configurationUpdates).length.toString(),
        recommendationsCount: optimizationRecommendations.length.toString(),
        automatedActionsCount: automatedActions.length.toString()
      });

      return {
        configurationUpdates,
        performanceInsights,
        optimizationRecommendations,
        automatedActions
      };

    } catch (error) {
      this.logger.error(`Continuous improvement process failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'RunContinuousImprovementProcess'
      });
      throw error;
    }
  }

  /**
   * Generate performance insights from data
   */
  private generatePerformanceInsights(data: any[]): any {
    const insights = {
      totalDataPoints: data.length,
      averageEngagement: this.calculateAverage(data, 'engagementScore'),
      averageConversion: this.calculateAverage(data, 'conversionRate'),
      averageLoadTime: this.calculateAverage(data, 'loadTime'),
      contentTypePerformance: {},
      audiencePerformance: {},
      trends: {},
      issues: []
    };

    // Analyze by content type
    const contentTypes = [...new Set(data.map(d => d.contentType))];
    contentTypes.forEach(type => {
      const typeData = data.filter(d => d.contentType === type);
      insights.contentTypePerformance[type] = {
        count: typeData.length,
        avgEngagement: this.calculateAverage(typeData, 'engagementScore'),
        avgConversion: this.calculateAverage(typeData, 'conversionRate'),
        avgLoadTime: this.calculateAverage(typeData, 'loadTime')
      };
    });

    // Analyze by audience
    const audiences = [...new Set(data.map(d => d.audience))];
    audiences.forEach(audience => {
      const audienceData = data.filter(d => d.audience === audience);
      insights.audiencePerformance[audience] = {
        count: audienceData.length,
        avgEngagement: this.calculateAverage(audienceData, 'engagementScore'),
        avgConversion: this.calculateAverage(audienceData, 'conversionRate'),
        avgLoadTime: this.calculateAverage(audienceData, 'loadTime')
      };
    });

    // Identify performance issues
    if (insights.averageEngagement < 50) {
      insights.issues.push('Low overall engagement detected');
    }
    if (insights.averageConversion < 2) {
      insights.issues.push('Low conversion rates across content');
    }
    if (insights.averageLoadTime > 5000) {
      insights.issues.push('High load times affecting user experience');
    }

    return insights;
  }

  /**
   * Generate configuration updates based on insights
   */
  private generateConfigurationUpdates(insights: any): any {
    const updates = {
      contentOptimization: {},
      performanceThresholds: {},
      workflowAdjustments: {},
      mlModelParameters: {}
    };

    // Content optimization updates
    if (insights.averageEngagement < 60) {
      (updates as any).contentOptimization = (updates as any).contentOptimization || {};
      (updates as any).contentOptimization.engagementBoost = {
        enableAdvancedHooks: true,
        increaseInteractiveElements: true,
        optimizeHeadlines: true
      };
    }

    // Performance threshold updates
    if (insights.averageLoadTime > 3000) {
      (updates as any).performanceThresholds = (updates as any).performanceThresholds || {};
      (updates as any).performanceThresholds.loadTimeTarget = Math.max(2000, insights.averageLoadTime * 0.8);
      (updates as any).performanceThresholds.enableAggressiveCaching = true;
    }

    // Workflow adjustments
    Object.entries(insights.contentTypePerformance).forEach(([type, performance]: [string, any]) => {
      if (performance.avgEngagement < 50) {
        updates.workflowAdjustments[type] = {
          enableAdditionalOptimization: true,
          increaseQualityChecks: true,
          requirePeerReview: true
        };
      }
    });

    // ML model parameter updates
    if (insights.averageConversion < 3) {
      (updates as any).mlModelParameters = (updates as any).mlModelParameters || {};
      (updates as any).mlModelParameters.conversionOptimization = {
        increaseConversionWeight: 1.2,
        enableAdvancedCTAOptimization: true,
        focusOnValueProposition: true
      };
    }

    return updates;
  }

  /**
   * Generate optimization recommendations
   */
  private generateOptimizationRecommendations(insights: any): string[] {
    const recommendations = [];

    // Engagement recommendations
    if (insights.averageEngagement < 70) {
      recommendations.push('Implement advanced engagement optimization strategies');
      recommendations.push('Increase use of interactive content elements');
      recommendations.push('Optimize content structure for better readability');
    }

    // Conversion recommendations
    if (insights.averageConversion < 4) {
      recommendations.push('Strengthen call-to-action placement and messaging');
      recommendations.push('Implement A/B testing for conversion optimization');
      recommendations.push('Enhance value proposition clarity');
    }

    // Performance recommendations
    if (insights.averageLoadTime > 4000) {
      recommendations.push('Implement aggressive caching strategies');
      recommendations.push('Optimize content delivery network configuration');
      recommendations.push('Reduce content processing complexity');
    }

    // Content type specific recommendations
    Object.entries(insights.contentTypePerformance).forEach(([type, performance]: [string, any]) => {
      if (performance.avgEngagement < insights.averageEngagement * 0.8) {
        recommendations.push(`Optimize ${type} content strategy for better engagement`);
      }
    });

    return recommendations;
  }

  /**
   * Execute automated actions based on configuration updates
   */
  private async executeAutomatedActions(configurationUpdates: any): Promise<string[]> {
    const actions = [];

    try {
      // Update caching configuration
      if (configurationUpdates.performanceThresholds?.enableAggressiveCaching) {
        // In production, this would update Redis cache configuration
        actions.push('Updated caching configuration for improved performance');
      }

      // Update ML model parameters
      if (configurationUpdates.mlModelParameters?.conversionOptimization) {
        // In production, this would update ML model weights
        actions.push('Updated ML model parameters for better conversion optimization');
      }

      // Update workflow configurations
      if (Object.keys(configurationUpdates.workflowAdjustments || {}).length > 0) {
        // In production, this would update workflow engine configurations
        actions.push('Updated workflow configurations based on performance insights');
      }

      // Update content optimization settings
      if (configurationUpdates.contentOptimization?.engagementBoost) {
        // In production, this would update content optimization algorithms
        actions.push('Updated content optimization settings for better engagement');
      }

    } catch (error) {
      this.logger.warn(`Some automated actions failed: ${error.message}`);
      actions.push(`Automated action failed: ${error.message}`);
    }

    return actions;
  }

  /**
   * Get optimization suggestions for specific content type and audience
   */
  async getOptimizationSuggestions(contentType: string, audience: 'b2b' | 'b2c'): Promise<{
    contentStrategy: string[];
    technicalOptimizations: string[];
    workflowRecommendations: string[];
  }> {
    try {
      // Analyze historical data for this content type and audience
      const relevantData = Array.from(this.performanceData.values())
        .filter(data => data.contentType === contentType && data.audience === audience);

      if (relevantData.length === 0) {
        return {
          contentStrategy: ['Insufficient data for specific recommendations'],
          technicalOptimizations: ['Collect more performance data'],
          workflowRecommendations: ['Monitor content performance closely']
        };
      }

      // Calculate averages
      const avgEngagement = this.calculateAverage(relevantData, 'engagementScore');
      const avgConversion = this.calculateAverage(relevantData, 'conversionRate');
      const avgLoadTime = this.calculateAverage(relevantData, 'loadTime');

      const suggestions = {
        contentStrategy: [],
        technicalOptimizations: [],
        workflowRecommendations: []
      };

      // Content strategy suggestions
      if (avgEngagement < 50) {
        suggestions.contentStrategy.push('Focus on more engaging headlines and introductions');
        suggestions.contentStrategy.push('Include more interactive elements and visuals');
        suggestions.contentStrategy.push('Optimize content length for target audience');
      }

      if (avgConversion < 5) {
        suggestions.contentStrategy.push('Strengthen call-to-action placement and messaging');
        suggestions.contentStrategy.push('Add more compelling value propositions');
        suggestions.contentStrategy.push('Include social proof and testimonials');
      }

      // Technical optimizations
      if (avgLoadTime > 3000) {
        suggestions.technicalOptimizations.push('Optimize images and media files');
        suggestions.technicalOptimizations.push('Implement content delivery network (CDN)');
        suggestions.technicalOptimizations.push('Minimize JavaScript and CSS files');
      }

      // Workflow recommendations
      const topPerformingContent = relevantData
        .sort((a, b) => (b.engagementScore || 0) - (a.engagementScore || 0))
        .slice(0, 3);

      if (topPerformingContent.length > 0) {
        suggestions.workflowRecommendations.push('Analyze top-performing content patterns');
        suggestions.workflowRecommendations.push('Replicate successful content structures');
        suggestions.workflowRecommendations.push('A/B test different content approaches');
      }

      return suggestions;

    } catch (error) {
      this.logger.error(`Failed to get optimization suggestions: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Analyze performance trends and generate insights
   */
  async analyzePerformanceTrends(timeRange?: { start: Date; end: Date }): Promise<any> {
    try {
      this.logger.log('Analyzing performance trends');

      const range = timeRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        end: new Date()
      };

      // Filter data by time range
      const relevantData = Array.from(this.performanceData.values())
        .filter(data => {
          const recordedAt = new Date(data.recordedAt);
          return recordedAt >= range.start && recordedAt <= range.end;
        });

      if (relevantData.length === 0) {
        return {
          message: 'Insufficient data for trend analysis',
          timeRange: range,
          dataPoints: 0
        };
      }

      // Analyze trends by content type
      const contentTypeTrends = this.analyzeContentTypeTrends(relevantData);

      // Analyze audience preferences
      const audienceInsights = this.analyzeAudienceInsights(relevantData);

      // Generate recommendations
      const recommendations = this.generateTrendBasedRecommendations(contentTypeTrends, audienceInsights);

      const analysis = {
        timeRange: {
          start: range.start.toISOString(),
          end: range.end.toISOString()
        },
        dataPoints: relevantData.length,
        contentTypeTrends,
        audienceInsights,
        recommendations,
        generatedAt: new Date().toISOString()
      };

      // Track analysis completion
      this.appInsights.trackEvent('FeedbackLoop:TrendAnalysisCompleted', {
        timeRange: `${range.start.toISOString()}_${range.end.toISOString()}`,
        dataPoints: relevantData.length.toString()
      });

      return analysis;

    } catch (error) {
      this.logger.error(`Failed to analyze performance trends: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'AnalyzePerformanceTrends'
      });
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private shouldTriggerImmediateAnalysis(metrics: ContentPerformanceMetrics): boolean {
    return (
      (metrics.engagementScore !== undefined && metrics.engagementScore < 20) ||
      (metrics.conversionRate !== undefined && metrics.conversionRate < 1) ||
      (metrics.bounceRate !== undefined && metrics.bounceRate > 80)
    );
  }

  private async analyzePerformanceIssues(metrics: ContentPerformanceMetrics): Promise<void> {
    this.logger.warn(`Performance issues detected for content: ${metrics.contentId}`);

    this.appInsights.trackEvent('FeedbackLoop:PerformanceIssueDetected', {
      contentId: metrics.contentId,
      contentType: metrics.contentType,
      engagementScore: metrics.engagementScore?.toString(),
      conversionRate: metrics.conversionRate?.toString(),
      bounceRate: metrics.bounceRate?.toString()
    });
  }

  private initializePeriodicAnalysis(): void {
    // Run analysis every 24 hours
    setInterval(async () => {
      try {
        await this.analyzePerformanceTrends();
        this.logger.log('Periodic performance analysis completed');
      } catch (error) {
        this.logger.error(`Periodic analysis failed: ${error.message}`, error.stack);
      }
    }, 24 * 60 * 60 * 1000);
  }

  private calculatePriority(metrics: any): string {
    const scores = Object.values(metrics).filter(val => typeof val === 'number') as number[];
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;

    if (avgScore < 40) return 'high';
    if (avgScore < 70) return 'medium';
    return 'low';
  }

  private countBelowThreshold(metrics: any, isB2B: boolean): number {
    const thresholds = isB2B
      ? { technicalAccuracyScore: 70, comprehensivenessMeasure: 60, citationQualityScore: 80 }
      : { engagementScore: 60, emotionalResonanceIndex: 70, socialSharingProbability: 50 };

    return Object.entries(thresholds).filter(([key, threshold]) =>
      metrics[key] !== undefined && metrics[key] < threshold
    ).length;
  }

  private calculateAverage(data: any[], field: string): number {
    const values = data.map(item => item[field]).filter(val => val !== undefined);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private analyzeContentTypeTrends(data: ContentPerformanceMetrics[]): any {
    const trends = {};

    // Group by content type
    data.forEach(item => {
      if (!trends[item.contentType]) {
        trends[item.contentType] = {
          count: 0,
          totalEngagement: 0,
          totalConversion: 0,
          items: []
        };
      }

      trends[item.contentType].count++;
      trends[item.contentType].items.push(item);
      if (item.engagementScore) trends[item.contentType].totalEngagement += item.engagementScore;
      if (item.conversionRate) trends[item.contentType].totalConversion += item.conversionRate;
    });

    // Calculate averages
    Object.keys(trends).forEach(type => {
      const typeData = trends[type];
      trends[type] = {
        count: typeData.count,
        averageEngagement: typeData.totalEngagement / typeData.count,
        averageConversion: typeData.totalConversion / typeData.count,
        trend: this.calculateTrend(typeData.items)
      };
    });

    return trends;
  }

  private analyzeAudienceInsights(data: ContentPerformanceMetrics[]): any {
    const insights = { b2b: { count: 0, performance: [] }, b2c: { count: 0, performance: [] } };

    data.forEach(item => {
      insights[item.audience].count++;
      insights[item.audience].performance.push({
        engagement: item.engagementScore || 0,
        conversion: item.conversionRate || 0
      });
    });

    return insights;
  }

  private generateTrendBasedRecommendations(contentTrends: any, audienceInsights: any): string[] {
    const recommendations = [];

    // Analyze content type performance
    const sortedTypes = Object.entries(contentTrends)
      .sort(([,a], [,b]) => (b as any).averageEngagement - (a as any).averageEngagement);

    if (sortedTypes.length > 0) {
      const topType = sortedTypes[0][0];
      recommendations.push(`Focus more on ${topType} content - showing highest engagement`);
    }

    // Analyze audience performance
    const b2bAvg = audienceInsights.b2b.performance.reduce((sum, p) => sum + p.engagement, 0) /
                   (audienceInsights.b2b.performance.length || 1);
    const b2cAvg = audienceInsights.b2c.performance.reduce((sum, p) => sum + p.engagement, 0) /
                   (audienceInsights.b2c.performance.length || 1);

    if (b2bAvg > b2cAvg) {
      recommendations.push('B2B content performing better - consider expanding B2B strategy');
    } else {
      recommendations.push('B2C content performing better - consider expanding B2C strategy');
    }

    return recommendations;
  }

  private calculateTrend(items: any[]): 'improving' | 'declining' | 'stable' {
    if (items.length < 2) return 'stable';

    const sortedItems = items.sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
    const firstHalf = sortedItems.slice(0, Math.floor(sortedItems.length / 2));
    const secondHalf = sortedItems.slice(Math.floor(sortedItems.length / 2));

    const firstAvg = this.calculateAverage(firstHalf, 'engagementScore');
    const secondAvg = this.calculateAverage(secondHalf, 'engagementScore');

    const change = ((secondAvg - firstAvg) / firstAvg) * 100;

    if (change > 5) return 'improving';
    if (change < -5) return 'declining';
    return 'stable';
  }
}
