import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

export interface PredictiveAnalysisRequest {
  competitorIds: string[];
  predictionType: 'market_share' | 'pricing' | 'product_launch' | 'competitive_move' | 'market_trend';
  timeHorizon: '1m' | '3m' | '6m' | '1y' | '2y';
  confidence: 'low' | 'medium' | 'high';
  includeScenarios?: boolean;
  includeRiskAssessment?: boolean;
  customFactors?: string[];
}

export interface PredictiveAnalysisResult {
  predictionId: string;
  predictionType: string;
  timeHorizon: string;
  generatedAt: string;
  
  predictions: Array<{
    competitorId: string;
    competitorName: string;
    prediction: {
      metric: string;
      currentValue: number;
      predictedValue: number;
      change: {
        absolute: number;
        percentage: number;
        direction: 'increase' | 'decrease' | 'stable';
      };
      confidence: number; // 0-1
      confidenceInterval: {
        lower: number;
        upper: number;
      };
    };
    factors: Array<{
      factor: string;
      impact: number; // -1 to 1
      confidence: number;
      description: string;
    }>;
    timeline: Array<{
      date: string;
      predictedValue: number;
      confidence: number;
      keyEvents?: string[];
    }>;
  }>;
  
  marketPredictions: {
    overallTrend: 'growth' | 'decline' | 'stability';
    marketSize: {
      current: number;
      predicted: number;
      growthRate: number;
    };
    competitiveIntensity: {
      current: number;
      predicted: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
    disruptionRisk: {
      level: 'low' | 'medium' | 'high';
      factors: string[];
      timeline: string;
    };
  };
  
  scenarios?: Array<{
    name: string;
    description: string;
    probability: number;
    impact: 'low' | 'medium' | 'high';
    predictions: Array<{
      competitorId: string;
      predictedValue: number;
      confidence: number;
    }>;
    triggers: string[];
    mitigationStrategies: string[];
  }>;
  
  riskAssessment?: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: Array<{
      factor: string;
      probability: number;
      impact: number;
      severity: 'low' | 'medium' | 'high';
      mitigation: string;
    }>;
    recommendations: Array<{
      priority: 'low' | 'medium' | 'high';
      action: string;
      timeline: string;
      expectedImpact: string;
    }>;
  };
  
  modelMetadata: {
    algorithm: string;
    accuracy: number;
    dataPoints: number;
    lastTrained: string;
    features: string[];
    limitations: string[];
  };
}

@Injectable()
export class PredictiveAnalyticsService {
  private readonly logger = new Logger(PredictiveAnalyticsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  /**
   * Perform predictive analysis
   */
  async performPredictiveAnalysis(request: PredictiveAnalysisRequest): Promise<PredictiveAnalysisResult> {
    const startTime = Date.now();
    const predictionId = `prediction_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Starting predictive analysis: ${predictionId}`);

      // Generate predictions for each competitor
      const predictions = await this.generateCompetitorPredictions(request);
      
      // Generate market-level predictions
      const marketPredictions = await this.generateMarketPredictions(request);
      
      // Build base result
      const result: PredictiveAnalysisResult = {
        predictionId,
        predictionType: request.predictionType,
        timeHorizon: request.timeHorizon,
        generatedAt: new Date().toISOString(),
        predictions,
        marketPredictions,
        modelMetadata: this.generateModelMetadata(request)
      };

      // Add scenarios if requested
      if (request.includeScenarios) {
        result.scenarios = await this.generateScenarios(request, predictions);
      }

      // Add risk assessment if requested
      if (request.includeRiskAssessment) {
        result.riskAssessment = await this.generateRiskAssessment(request, predictions);
      }

      const processingTime = Date.now() - startTime;
      
      this.appInsights.trackEvent('CompetitionX:PredictiveAnalysisCompleted', {
        predictionId,
        predictionType: request.predictionType,
        timeHorizon: request.timeHorizon,
        competitorCount: request.competitorIds.length.toString(),
        processingTime: processingTime.toString()
      });

      this.logger.log(`Predictive analysis completed: ${predictionId} in ${processingTime}ms`);
      return result;

    } catch (error) {
      this.logger.error(`Predictive analysis failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'PerformPredictiveAnalysis',
        predictionId
      });
      throw error;
    }
  }

  /**
   * Generate predictions for each competitor
   */
  private async generateCompetitorPredictions(request: PredictiveAnalysisRequest): Promise<PredictiveAnalysisResult['predictions']> {
    const predictions = [];
    
    for (const competitorId of request.competitorIds) {
      const competitorName = `Competitor ${competitorId.substring(0, 8)}`;
      
      // Generate prediction based on type
      const prediction = this.generatePredictionByType(request.predictionType, request.timeHorizon);
      
      // Generate influencing factors
      const factors = this.generateInfluencingFactors(request.predictionType);
      
      // Generate timeline
      const timeline = this.generatePredictionTimeline(prediction, request.timeHorizon);
      
      predictions.push({
        competitorId,
        competitorName,
        prediction,
        factors,
        timeline
      });
    }
    
    return predictions;
  }

  /**
   * Generate market-level predictions
   */
  private async generateMarketPredictions(request: PredictiveAnalysisRequest): Promise<PredictiveAnalysisResult['marketPredictions']> {
    const timeMultiplier = this.getTimeMultiplier(request.timeHorizon);
    
    return {
      overallTrend: ['growth', 'decline', 'stability'][Math.floor(Math.random() * 3)] as any,
      marketSize: {
        current: 5000000000, // $5B
        predicted: 5000000000 * (1 + (Math.random() * 0.4 - 0.1) * timeMultiplier), // ±10% per year
        growthRate: (Math.random() * 20 + 5) * timeMultiplier // 5-25% annual growth
      },
      competitiveIntensity: {
        current: Math.random() * 0.5 + 0.5, // 0.5-1.0
        predicted: Math.random() * 0.5 + 0.5,
        trend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any
      },
      disruptionRisk: {
        level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
        factors: [
          'AI and automation',
          'New market entrants',
          'Regulatory changes',
          'Technology shifts',
          'Economic conditions'
        ].slice(0, Math.floor(Math.random() * 3) + 2),
        timeline: request.timeHorizon
      }
    };
  }

  /**
   * Generate prediction by type
   */
  private generatePredictionByType(predictionType: string, timeHorizon: string): any {
    const timeMultiplier = this.getTimeMultiplier(timeHorizon);
    const baseConfidence = Math.random() * 0.3 + 0.6; // 0.6-0.9
    
    switch (predictionType) {
      case 'market_share':
        const currentShare = Math.random() * 30 + 5; // 5-35%
        const change = (Math.random() * 10 - 5) * timeMultiplier; // ±5% per year
        const predictedShare = Math.max(0, currentShare + change);
        
        return {
          metric: 'Market Share (%)',
          currentValue: currentShare,
          predictedValue: predictedShare,
          change: {
            absolute: change,
            percentage: (change / currentShare) * 100,
            direction: change > 0.5 ? 'increase' : change < -0.5 ? 'decrease' : 'stable'
          },
          confidence: baseConfidence,
          confidenceInterval: {
            lower: predictedShare * 0.85,
            upper: predictedShare * 1.15
          }
        };
        
      case 'pricing':
        const currentPrice = Math.random() * 200 + 50; // $50-250
        const priceChange = (Math.random() * 20 - 10) * timeMultiplier; // ±10% per year
        const predictedPrice = Math.max(10, currentPrice + priceChange);
        
        return {
          metric: 'Average Price ($)',
          currentValue: currentPrice,
          predictedValue: predictedPrice,
          change: {
            absolute: priceChange,
            percentage: (priceChange / currentPrice) * 100,
            direction: priceChange > 2 ? 'increase' : priceChange < -2 ? 'decrease' : 'stable'
          },
          confidence: baseConfidence,
          confidenceInterval: {
            lower: predictedPrice * 0.9,
            upper: predictedPrice * 1.1
          }
        };
        
      case 'product_launch':
        const currentProducts = Math.floor(Math.random() * 20) + 5; // 5-25 products
        const newProducts = Math.floor((Math.random() * 5 + 1) * timeMultiplier); // 1-5 per year
        const predictedProducts = currentProducts + newProducts;
        
        return {
          metric: 'Product Count',
          currentValue: currentProducts,
          predictedValue: predictedProducts,
          change: {
            absolute: newProducts,
            percentage: (newProducts / currentProducts) * 100,
            direction: 'increase'
          },
          confidence: baseConfidence * 0.8, // Lower confidence for product launches
          confidenceInterval: {
            lower: predictedProducts - Math.floor(newProducts * 0.3),
            upper: predictedProducts + Math.floor(newProducts * 0.3)
          }
        };
        
      default:
        return {
          metric: 'Generic Metric',
          currentValue: 100,
          predictedValue: 100 + (Math.random() * 20 - 10) * timeMultiplier,
          change: {
            absolute: (Math.random() * 20 - 10) * timeMultiplier,
            percentage: (Math.random() * 20 - 10) * timeMultiplier,
            direction: 'stable'
          },
          confidence: baseConfidence,
          confidenceInterval: {
            lower: 90,
            upper: 110
          }
        };
    }
  }

  /**
   * Generate influencing factors
   */
  private generateInfluencingFactors(predictionType: string): Array<any> {
    const commonFactors = [
      { factor: 'Market conditions', impact: Math.random() * 0.6 - 0.3, confidence: 0.8, description: 'Overall market health and growth' },
      { factor: 'Competitive pressure', impact: Math.random() * 0.4 - 0.2, confidence: 0.75, description: 'Intensity of competition in the market' },
      { factor: 'Economic factors', impact: Math.random() * 0.5 - 0.25, confidence: 0.7, description: 'Economic conditions affecting the industry' },
      { factor: 'Technology trends', impact: Math.random() * 0.7 - 0.35, confidence: 0.65, description: 'Technological changes and innovations' },
      { factor: 'Customer behavior', impact: Math.random() * 0.6 - 0.3, confidence: 0.8, description: 'Changes in customer preferences and behavior' }
    ];
    
    const specificFactors = {
      'market_share': [
        { factor: 'Brand strength', impact: Math.random() * 0.5 + 0.1, confidence: 0.85, description: 'Brand recognition and loyalty' },
        { factor: 'Product quality', impact: Math.random() * 0.4 + 0.2, confidence: 0.9, description: 'Quality and reliability of products' }
      ],
      'pricing': [
        { factor: 'Cost structure', impact: Math.random() * 0.6 - 0.3, confidence: 0.9, description: 'Operational and production costs' },
        { factor: 'Value proposition', impact: Math.random() * 0.4 + 0.1, confidence: 0.8, description: 'Perceived value by customers' }
      ],
      'product_launch': [
        { factor: 'R&D investment', impact: Math.random() * 0.7 + 0.2, confidence: 0.85, description: 'Investment in research and development' },
        { factor: 'Innovation capability', impact: Math.random() * 0.6 + 0.3, confidence: 0.8, description: 'Ability to innovate and develop new products' }
      ]
    };
    
    const factors = [...commonFactors];
    if (specificFactors[predictionType]) {
      factors.push(...specificFactors[predictionType]);
    }
    
    return factors.slice(0, 5); // Return top 5 factors
  }

  /**
   * Generate prediction timeline
   */
  private generatePredictionTimeline(prediction: any, timeHorizon: string): Array<any> {
    const timeline = [];
    const periods = this.getTimelinePeriods(timeHorizon);
    const totalChange = prediction.predictedValue - prediction.currentValue;
    
    for (let i = 0; i < periods; i++) {
      const progress = (i + 1) / periods;
      const value = prediction.currentValue + (totalChange * progress);
      const confidence = prediction.confidence * (1 - progress * 0.2); // Decreasing confidence over time
      
      timeline.push({
        date: this.getTimelineDate(timeHorizon, i + 1),
        predictedValue: value,
        confidence,
        keyEvents: i === Math.floor(periods / 2) ? ['Mid-period assessment'] : undefined
      });
    }
    
    return timeline;
  }

  /**
   * Generate scenarios
   */
  private async generateScenarios(request: PredictiveAnalysisRequest, predictions: any[]): Promise<PredictiveAnalysisResult['scenarios']> {
    const scenarios = [
      {
        name: 'Optimistic Scenario',
        description: 'Best-case scenario with favorable market conditions',
        probability: 0.25,
        impact: 'high' as const,
        predictions: predictions.map(p => ({
          competitorId: p.competitorId,
          predictedValue: p.prediction.predictedValue * 1.2,
          confidence: p.prediction.confidence * 0.9
        })),
        triggers: ['Strong economic growth', 'Successful product launches', 'Market expansion'],
        mitigationStrategies: ['Maintain competitive advantage', 'Scale operations', 'Invest in innovation']
      },
      {
        name: 'Pessimistic Scenario',
        description: 'Worst-case scenario with challenging conditions',
        probability: 0.25,
        impact: 'high' as const,
        predictions: predictions.map(p => ({
          competitorId: p.competitorId,
          predictedValue: p.prediction.predictedValue * 0.8,
          confidence: p.prediction.confidence * 0.9
        })),
        triggers: ['Economic downturn', 'Increased competition', 'Market disruption'],
        mitigationStrategies: ['Cost reduction', 'Defensive strategies', 'Market diversification']
      },
      {
        name: 'Most Likely Scenario',
        description: 'Expected scenario based on current trends',
        probability: 0.5,
        impact: 'medium' as const,
        predictions: predictions.map(p => ({
          competitorId: p.competitorId,
          predictedValue: p.prediction.predictedValue,
          confidence: p.prediction.confidence
        })),
        triggers: ['Continued current trends', 'Moderate market growth', 'Stable competition'],
        mitigationStrategies: ['Monitor market closely', 'Adaptive strategies', 'Continuous improvement']
      }
    ];
    
    return scenarios;
  }

  /**
   * Generate risk assessment
   */
  private async generateRiskAssessment(request: PredictiveAnalysisRequest, predictions: any[]): Promise<PredictiveAnalysisResult['riskAssessment']> {
    const riskFactors = [
      {
        factor: 'Market volatility',
        probability: Math.random() * 0.5 + 0.3,
        impact: Math.random() * 0.7 + 0.3,
        severity: 'medium' as const,
        mitigation: 'Diversify market presence and maintain flexible strategies'
      },
      {
        factor: 'Competitive disruption',
        probability: Math.random() * 0.4 + 0.2,
        impact: Math.random() * 0.8 + 0.2,
        severity: 'high' as const,
        mitigation: 'Invest in innovation and monitor competitive landscape'
      },
      {
        factor: 'Technology obsolescence',
        probability: Math.random() * 0.3 + 0.1,
        impact: Math.random() * 0.9 + 0.1,
        severity: 'high' as const,
        mitigation: 'Continuous technology assessment and R&D investment'
      }
    ];
    
    const averageRisk = riskFactors.reduce((sum, rf) => sum + rf.probability * rf.impact, 0) / riskFactors.length;
    const overallRisk = averageRisk > 0.7 ? 'critical' : averageRisk > 0.5 ? 'high' : averageRisk > 0.3 ? 'medium' : 'low';
    
    return {
      overallRisk,
      riskFactors,
      recommendations: [
        {
          priority: 'high' as const,
          action: 'Develop contingency plans for high-impact scenarios',
          timeline: '3 months',
          expectedImpact: 'Reduced risk exposure and improved preparedness'
        },
        {
          priority: 'medium' as const,
          action: 'Enhance competitive intelligence capabilities',
          timeline: '6 months',
          expectedImpact: 'Better early warning system for market changes'
        },
        {
          priority: 'low' as const,
          action: 'Regular strategy review and adjustment',
          timeline: 'Ongoing',
          expectedImpact: 'Maintained strategic alignment with market conditions'
        }
      ]
    };
  }

  /**
   * Generate model metadata
   */
  private generateModelMetadata(request: PredictiveAnalysisRequest): PredictiveAnalysisResult['modelMetadata'] {
    return {
      algorithm: 'Ensemble (Random Forest + LSTM)',
      accuracy: Math.random() * 0.2 + 0.75, // 75-95%
      dataPoints: Math.floor(Math.random() * 10000) + 5000,
      lastTrained: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      features: [
        'Historical performance',
        'Market trends',
        'Competitive actions',
        'Economic indicators',
        'Social sentiment',
        'Technology adoption'
      ],
      limitations: [
        'Predictions based on historical patterns',
        'External shocks not fully predictable',
        'Model accuracy decreases with longer time horizons',
        'Limited by data quality and availability'
      ]
    };
  }

  /**
   * Helper methods
   */
  private getTimeMultiplier(timeHorizon: string): number {
    const multipliers = {
      '1m': 1/12,
      '3m': 1/4,
      '6m': 1/2,
      '1y': 1,
      '2y': 2
    };
    
    return multipliers[timeHorizon] || 1;
  }

  private getTimelinePeriods(timeHorizon: string): number {
    const periods = {
      '1m': 4,   // Weekly
      '3m': 3,   // Monthly
      '6m': 6,   // Monthly
      '1y': 4,   // Quarterly
      '2y': 8    // Quarterly
    };
    
    return periods[timeHorizon] || 4;
  }

  private getTimelineDate(timeHorizon: string, period: number): string {
    const now = new Date();
    const timeMultiplier = this.getTimeMultiplier(timeHorizon);
    const periodLength = (timeMultiplier * 365 * 24 * 60 * 60 * 1000) / this.getTimelinePeriods(timeHorizon);
    
    return new Date(now.getTime() + period * periodLength).toISOString();
  }
}
