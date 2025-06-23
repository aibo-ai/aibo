import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

import { CompetitiveData } from '../../entities/competitive-data.entity';
import { SocialMediaData } from '../../entities/social-media-data.entity';
import { SearchEngineData } from '../../entities/search-engine-data.entity';
import { EcommerceData } from '../../entities/ecommerce-data.entity';

export interface TrendAnalysisRequest {
  competitorIds: string[];
  dataTypes: string[]; // 'social', 'search', 'ecommerce', 'pricing', 'products'
  timeRange: '7d' | '30d' | '90d' | '1y';
  granularity: 'hour' | 'day' | 'week' | 'month';
  metrics: string[]; // 'engagement', 'sentiment', 'volume', 'ranking', 'price'
  includeForecasting?: boolean;
  includeSeasonality?: boolean;
  includeAnomalies?: boolean;
}

export interface TrendAnalysisResult {
  analysisId: string;
  timeRange: string;
  granularity: string;
  generatedAt: string;
  
  trends: {
    [metric: string]: {
      dataPoints: Array<{
        timestamp: string;
        value: number;
        competitorId?: string;
        metadata?: any;
      }>;
      trendDirection: 'up' | 'down' | 'stable';
      trendStrength: number; // 0-1
      changeRate: number; // percentage change
      volatility: number; // 0-1
      correlation?: { [otherMetric: string]: number };
    };
  };
  
  insights: Array<{
    type: 'trend' | 'anomaly' | 'correlation' | 'seasonality';
    metric: string;
    description: string;
    significance: 'low' | 'medium' | 'high';
    confidence: number;
    timeframe: string;
    actionable: boolean;
    recommendation?: string;
  }>;
  
  forecasting?: {
    [metric: string]: {
      predictions: Array<{
        timestamp: string;
        predictedValue: number;
        confidenceInterval: { lower: number; upper: number };
        confidence: number;
      }>;
      model: string;
      accuracy: number;
      riskFactors: string[];
    };
  };
  
  seasonality?: {
    [metric: string]: {
      hasSeasonality: boolean;
      seasonalPeriod?: string; // 'weekly', 'monthly', 'quarterly', 'yearly'
      seasonalStrength: number; // 0-1
      peakPeriods: string[];
      lowPeriods: string[];
    };
  };
  
  anomalies?: Array<{
    timestamp: string;
    metric: string;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
    possibleCauses: string[];
  }>;
}

@Injectable()
export class TrendAnalysisService {
  private readonly logger = new Logger(TrendAnalysisService.name);

  constructor(
    @InjectRepository(CompetitiveData)
    private readonly competitiveDataRepository: Repository<CompetitiveData>,
    @InjectRepository(SocialMediaData)
    private readonly socialMediaDataRepository: Repository<SocialMediaData>,
    @InjectRepository(SearchEngineData)
    private readonly searchEngineDataRepository: Repository<SearchEngineData>,
    @InjectRepository(EcommerceData)
    private readonly ecommerceDataRepository: Repository<EcommerceData>,
    
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {}

  /**
   * Perform comprehensive trend analysis
   */
  async analyzeTrends(request: TrendAnalysisRequest): Promise<TrendAnalysisResult> {
    const startTime = Date.now();
    const analysisId = `trend_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    try {
      this.logger.log(`Starting trend analysis: ${analysisId}`);

      // Collect data for analysis
      const timeSeriesData = await this.collectTimeSeriesData(request);
      
      // Analyze trends for each metric
      const trends = {};
      for (const metric of request.metrics) {
        trends[metric] = await this.analyzeTrendForMetric(metric, timeSeriesData[metric] || [], request);
      }

      // Generate insights
      const insights = await this.generateTrendInsights(trends, request);

      // Build result
      const result: TrendAnalysisResult = {
        analysisId,
        timeRange: request.timeRange,
        granularity: request.granularity,
        generatedAt: new Date().toISOString(),
        trends,
        insights
      };

      // Add forecasting if requested
      if (request.includeForecasting) {
        result.forecasting = await this.generateForecasting(trends, request);
      }

      // Add seasonality analysis if requested
      if (request.includeSeasonality) {
        result.seasonality = await this.analyzeSeasonality(trends, request);
      }

      // Add anomaly detection if requested
      if (request.includeAnomalies) {
        result.anomalies = await this.detectAnomalies(trends, request);
      }

      const processingTime = Date.now() - startTime;
      
      this.appInsights.trackEvent('CompetitionX:TrendAnalysisCompleted', {
        analysisId,
        competitorCount: request.competitorIds.length.toString(),
        metricCount: request.metrics.length.toString(),
        timeRange: request.timeRange,
        processingTime: processingTime.toString(),
        insightCount: insights.length.toString()
      });

      this.logger.log(`Trend analysis completed: ${analysisId} in ${processingTime}ms`);
      return result;

    } catch (error) {
      this.logger.error(`Trend analysis failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'AnalyzeTrends',
        analysisId
      });
      throw error;
    }
  }

  /**
   * Collect time series data for analysis
   */
  private async collectTimeSeriesData(request: TrendAnalysisRequest): Promise<{ [metric: string]: any[] }> {
    const timeSeriesData = {};
    
    // Calculate time range
    const days = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    }[request.timeRange] || 30;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const endDate = new Date();

    // Collect data for each metric
    for (const metric of request.metrics) {
      timeSeriesData[metric] = await this.collectMetricData(
        metric, 
        request.competitorIds, 
        startDate, 
        endDate, 
        request.granularity
      );
    }

    return timeSeriesData;
  }

  /**
   * Collect data for a specific metric
   */
  private async collectMetricData(
    metric: string,
    competitorIds: string[],
    startDate: Date,
    endDate: Date,
    granularity: string
  ): Promise<any[]> {
    
    // In a real implementation, this would query the appropriate tables
    // For now, we'll simulate time series data
    
    const dataPoints = [];
    const intervalMs = this.getIntervalMs(granularity);
    
    for (let timestamp = startDate.getTime(); timestamp <= endDate.getTime(); timestamp += intervalMs) {
      for (const competitorId of competitorIds) {
        const value = this.simulateMetricValue(metric, timestamp, competitorId);
        
        dataPoints.push({
          timestamp: new Date(timestamp).toISOString(),
          value,
          competitorId,
          metadata: {
            metric,
            granularity
          }
        });
      }
    }

    return dataPoints;
  }

  /**
   * Analyze trend for a specific metric
   */
  private async analyzeTrendForMetric(
    metric: string,
    dataPoints: any[],
    request: TrendAnalysisRequest
  ): Promise<TrendAnalysisResult['trends'][string]> {
    
    if (dataPoints.length === 0) {
      return {
        dataPoints: [],
        trendDirection: 'stable',
        trendStrength: 0,
        changeRate: 0,
        volatility: 0
      };
    }

    // Calculate trend direction and strength
    const values = dataPoints.map(dp => dp.value);
    const trendAnalysis = this.calculateTrend(values);
    
    // Calculate volatility
    const volatility = this.calculateVolatility(values);
    
    // Calculate correlations with other metrics
    const correlation = {};
    for (const otherMetric of request.metrics) {
      if (otherMetric !== metric) {
        correlation[otherMetric] = Math.random() * 2 - 1; // Simulate correlation -1 to 1
      }
    }

    return {
      dataPoints,
      trendDirection: trendAnalysis.direction,
      trendStrength: trendAnalysis.strength,
      changeRate: trendAnalysis.changeRate,
      volatility,
      correlation
    };
  }

  /**
   * Generate insights from trend analysis
   */
  private async generateTrendInsights(
    trends: { [metric: string]: any },
    request: TrendAnalysisRequest
  ): Promise<TrendAnalysisResult['insights']> {
    
    const insights = [];

    for (const [metric, trendData] of Object.entries(trends)) {
      // Trend insights
      if (trendData.trendStrength > 0.7) {
        insights.push({
          type: 'trend' as const,
          metric,
          description: `Strong ${trendData.trendDirection}ward trend detected in ${metric}`,
          significance: 'high' as const,
          confidence: trendData.trendStrength,
          timeframe: request.timeRange,
          actionable: true,
          recommendation: `Monitor ${metric} closely and consider strategic adjustments`
        });
      }

      // Volatility insights
      if (trendData.volatility > 0.8) {
        insights.push({
          type: 'trend' as const,
          metric,
          description: `High volatility detected in ${metric}`,
          significance: 'medium' as const,
          confidence: 0.85,
          timeframe: request.timeRange,
          actionable: true,
          recommendation: `Investigate causes of ${metric} volatility`
        });
      }

      // Correlation insights
      if (trendData.correlation) {
        for (const [otherMetric, correlation] of Object.entries(trendData.correlation)) {
          if (Math.abs(correlation as number) > 0.7) {
            insights.push({
              type: 'correlation' as const,
              metric,
              description: `Strong ${correlation > 0 ? 'positive' : 'negative'} correlation between ${metric} and ${otherMetric}`,
              significance: 'medium' as const,
              confidence: Math.abs(correlation as number),
              timeframe: request.timeRange,
              actionable: true,
              recommendation: `Leverage ${metric}-${otherMetric} relationship for strategic planning`
            });
          }
        }
      }
    }

    return insights;
  }

  /**
   * Generate forecasting predictions
   */
  private async generateForecasting(
    trends: { [metric: string]: any },
    request: TrendAnalysisRequest
  ): Promise<TrendAnalysisResult['forecasting']> {
    
    const forecasting = {};
    
    for (const [metric, trendData] of Object.entries(trends)) {
      const predictions = [];
      const lastValue = trendData.dataPoints[trendData.dataPoints.length - 1]?.value || 0;
      const trendRate = trendData.changeRate / 100;
      
      // Generate predictions for next 30 days
      for (let i = 1; i <= 30; i++) {
        const predictedValue = lastValue * (1 + trendRate * i / 30);
        const uncertainty = Math.min(0.5, i * 0.02); // Increasing uncertainty over time
        
        predictions.push({
          timestamp: new Date(Date.now() + i * 24 * 60 * 60 * 1000).toISOString(),
          predictedValue,
          confidenceInterval: {
            lower: predictedValue * (1 - uncertainty),
            upper: predictedValue * (1 + uncertainty)
          },
          confidence: Math.max(0.5, 1 - uncertainty)
        });
      }
      
      forecasting[metric] = {
        predictions,
        model: 'linear_trend_extrapolation',
        accuracy: Math.max(0.6, 1 - trendData.volatility),
        riskFactors: [
          'Market volatility',
          'Competitive actions',
          'External events',
          'Seasonal variations'
        ]
      };
    }
    
    return forecasting;
  }

  /**
   * Analyze seasonality patterns
   */
  private async analyzeSeasonality(
    trends: { [metric: string]: any },
    request: TrendAnalysisRequest
  ): Promise<TrendAnalysisResult['seasonality']> {
    
    const seasonality = {};
    
    for (const [metric, trendData] of Object.entries(trends)) {
      // Simulate seasonality detection
      const hasSeasonality = Math.random() > 0.6;
      
      if (hasSeasonality) {
        const seasonalPeriods = ['weekly', 'monthly', 'quarterly'];
        const seasonalPeriod = seasonalPeriods[Math.floor(Math.random() * seasonalPeriods.length)];
        
        seasonality[metric] = {
          hasSeasonality: true,
          seasonalPeriod,
          seasonalStrength: Math.random() * 0.5 + 0.3,
          peakPeriods: this.generatePeakPeriods(seasonalPeriod),
          lowPeriods: this.generateLowPeriods(seasonalPeriod)
        };
      } else {
        seasonality[metric] = {
          hasSeasonality: false,
          seasonalStrength: 0,
          peakPeriods: [],
          lowPeriods: []
        };
      }
    }
    
    return seasonality;
  }

  /**
   * Detect anomalies in trends
   */
  private async detectAnomalies(
    trends: { [metric: string]: any },
    request: TrendAnalysisRequest
  ): Promise<TrendAnalysisResult['anomalies']> {
    
    const anomalies = [];
    
    for (const [metric, trendData] of Object.entries(trends)) {
      const values = trendData.dataPoints.map(dp => dp.value);
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
      
      // Detect outliers (values beyond 2 standard deviations)
      trendData.dataPoints.forEach(dp => {
        const deviation = Math.abs(dp.value - mean) / stdDev;
        
        if (deviation > 2) {
          anomalies.push({
            timestamp: dp.timestamp,
            metric,
            value: dp.value,
            expectedValue: mean,
            deviation,
            severity: deviation > 3 ? 'high' : deviation > 2.5 ? 'medium' : 'low',
            possibleCauses: [
              'Data collection error',
              'Unusual market event',
              'Competitive action',
              'Technical issue',
              'Seasonal variation'
            ].slice(0, Math.floor(Math.random() * 3) + 1)
          });
        }
      });
    }
    
    return anomalies;
  }

  /**
   * Helper methods
   */
  private getIntervalMs(granularity: string): number {
    const intervals = {
      'hour': 60 * 60 * 1000,
      'day': 24 * 60 * 60 * 1000,
      'week': 7 * 24 * 60 * 60 * 1000,
      'month': 30 * 24 * 60 * 60 * 1000
    };
    
    return intervals[granularity] || intervals.day;
  }

  private simulateMetricValue(metric: string, timestamp: number, competitorId: string): number {
    // Simulate realistic metric values with some trend and noise
    const baseValue = {
      'engagement': 1000,
      'sentiment': 0.5,
      'volume': 500,
      'ranking': 50,
      'price': 100
    }[metric] || 100;
    
    const trend = Math.sin(timestamp / (7 * 24 * 60 * 60 * 1000)) * 0.1; // Weekly trend
    const noise = (Math.random() - 0.5) * 0.2;
    const competitorFactor = competitorId.charCodeAt(0) / 100; // Unique per competitor
    
    return baseValue * (1 + trend + noise + competitorFactor);
  }

  private calculateTrend(values: number[]): { direction: 'up' | 'down' | 'stable'; strength: number; changeRate: number } {
    if (values.length < 2) {
      return { direction: 'stable', strength: 0, changeRate: 0 };
    }
    
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const changeRate = (slope / (sumY / n)) * 100;
    
    const direction = slope > 0.01 ? 'up' : slope < -0.01 ? 'down' : 'stable';
    const strength = Math.min(1, Math.abs(slope) * 10);
    
    return { direction, strength, changeRate };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return Math.min(1, stdDev / mean);
  }

  private generatePeakPeriods(seasonalPeriod: string): string[] {
    const periods = {
      'weekly': ['Monday', 'Friday'],
      'monthly': ['Week 1', 'Week 3'],
      'quarterly': ['Q1', 'Q4']
    };
    
    return periods[seasonalPeriod] || [];
  }

  private generateLowPeriods(seasonalPeriod: string): string[] {
    const periods = {
      'weekly': ['Wednesday', 'Sunday'],
      'monthly': ['Week 2', 'Week 4'],
      'quarterly': ['Q2', 'Q3']
    };
    
    return periods[seasonalPeriod] || [];
  }
}
