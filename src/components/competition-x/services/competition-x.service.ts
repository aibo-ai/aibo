import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../common/services/application-insights.service';
import { CacheService } from '../../../common/services/cache.service';

import { Competitor } from '../entities/competitor.entity';
import { CompetitiveData } from '../entities/competitive-data.entity';
import { MarketInsight } from '../entities/market-insight.entity';

import { DataIngestionService } from './data-ingestion.service';
import { CompetitorAnalysisService } from './competitor-analysis.service';
import { MarketIntelligenceService } from './market-intelligence.service';
import { RealTimeMonitoringService } from './real-time-monitoring.service';

export interface CompetitionXDashboardData {
  overview: {
    totalCompetitors: number;
    activeMonitoring: number;
    alertsToday: number;
    marketShare: number;
  };
  topCompetitors: Array<{
    id: string;
    name: string;
    marketShare: number;
    trend: 'up' | 'down' | 'stable';
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  recentInsights: Array<{
    id: string;
    type: 'pricing' | 'product' | 'marketing' | 'social' | 'seo';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    timestamp: string;
    competitor: string;
  }>;
  marketTrends: {
    labels: string[];
    datasets: Array<{
      label: string;
      data: number[];
      trend: 'up' | 'down' | 'stable';
    }>;
  };
  alerts: Array<{
    id: string;
    type: 'price_change' | 'new_product' | 'marketing_campaign' | 'social_mention' | 'ranking_change';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    competitor: string;
    timestamp: string;
    actionRequired: boolean;
  }>;
}

export interface CompetitorAnalysisRequest {
  competitorId: string;
  analysisType: 'comprehensive' | 'pricing' | 'products' | 'marketing' | 'social' | 'seo';
  timeRange: '24h' | '7d' | '30d' | '90d' | '1y';
  includeForecasting?: boolean;
  includeBenchmarking?: boolean;
}

export interface CompetitorAnalysisResult {
  competitorId: string;
  competitorName: string;
  analysisType: string;
  timeRange: string;
  generatedAt: string;
  
  overview: {
    marketPosition: number;
    threatLevel: 'low' | 'medium' | 'high' | 'critical';
    overallTrend: 'improving' | 'declining' | 'stable';
    keyStrengths: string[];
    keyWeaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
  
  metrics: {
    marketShare: {
      current: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    };
    digitalPresence: {
      websiteTraffic: number;
      socialFollowers: number;
      searchVisibility: number;
      brandMentions: number;
    };
    productPortfolio: {
      totalProducts: number;
      newProducts: number;
      discontinuedProducts: number;
      averagePrice: number;
    };
    marketingActivity: {
      campaignsLaunched: number;
      adSpend: number;
      contentPublished: number;
      engagementRate: number;
    };
  };
  
  insights: Array<{
    category: string;
    insight: string;
    impact: 'low' | 'medium' | 'high';
    confidence: number;
    actionable: boolean;
    recommendation?: string;
  }>;
  
  forecasting?: {
    marketSharePrediction: {
      nextQuarter: number;
      nextYear: number;
      confidence: number;
    };
    threatAssessment: {
      level: 'low' | 'medium' | 'high' | 'critical';
      factors: string[];
      timeline: string;
    };
  };
  
  benchmarking?: {
    vsIndustryAverage: {
      marketShare: number;
      digitalPresence: number;
      innovation: number;
      customerSatisfaction: number;
    };
    vsTopCompetitor: {
      strengths: string[];
      gaps: string[];
      opportunities: string[];
    };
  };
}

@Injectable()
export class CompetitionXService {
  private readonly logger = new Logger(CompetitionXService.name);

  constructor(
    @InjectRepository(Competitor)
    private readonly competitorRepository: Repository<Competitor>,
    @InjectRepository(CompetitiveData)
    private readonly competitiveDataRepository: Repository<CompetitiveData>,
    @InjectRepository(MarketInsight)
    private readonly marketInsightRepository: Repository<MarketInsight>,
    
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService,
    private readonly cacheService: CacheService,
    
    private readonly dataIngestionService: DataIngestionService,
    private readonly competitorAnalysisService: CompetitorAnalysisService,
    private readonly marketIntelligenceService: MarketIntelligenceService,
    private readonly realTimeMonitoringService: RealTimeMonitoringService
  ) {}

  /**
   * Get comprehensive dashboard data for Competition X
   */
  async getDashboardData(): Promise<CompetitionXDashboardData> {
    const startTime = Date.now();
    
    try {
      this.logger.log('Generating Competition X dashboard data');

      // Check cache first
      const cacheKey = 'competition-x:dashboard:data';
      const cachedData = await this.cacheService.get<CompetitionXDashboardData>(cacheKey);
      
      if (cachedData) {
        this.logger.log('Returning cached dashboard data');
        return cachedData;
      }

      // Generate fresh dashboard data
      const [overview, topCompetitors, recentInsights, marketTrends, alerts] = await Promise.all([
        this.generateOverviewData(),
        this.getTopCompetitors(),
        this.getRecentInsights(),
        this.getMarketTrends(),
        this.getActiveAlerts()
      ]);

      const dashboardData: CompetitionXDashboardData = {
        overview,
        topCompetitors,
        recentInsights,
        marketTrends,
        alerts
      };

      // Cache for 5 minutes
      await this.cacheService.set(cacheKey, dashboardData, { ttl: 300 });

      const processingTime = Date.now() - startTime;
      
      this.appInsights.trackEvent('CompetitionX:DashboardGenerated', {
        processingTime: processingTime.toString(),
        competitorCount: topCompetitors.length.toString(),
        insightCount: recentInsights.length.toString(),
        alertCount: alerts.length.toString()
      });

      this.logger.log(`Dashboard data generated in ${processingTime}ms`);
      return dashboardData;

    } catch (error) {
      this.logger.error(`Failed to generate dashboard data: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'GetDashboardData'
      });
      throw error;
    }
  }

  /**
   * Perform comprehensive competitor analysis
   */
  async analyzeCompetitor(request: CompetitorAnalysisRequest): Promise<CompetitorAnalysisResult> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting competitor analysis for ${request.competitorId}`);

      // Track analysis request
      this.appInsights.trackEvent('CompetitionX:AnalysisStarted', {
        competitorId: request.competitorId,
        analysisType: request.analysisType,
        timeRange: request.timeRange,
        includeForecasting: request.includeForecasting?.toString() || 'false',
        includeBenchmarking: request.includeBenchmarking?.toString() || 'false'
      });

      // Get competitor information
      const competitor = await this.competitorRepository.findOne({
        where: { id: request.competitorId }
      });

      if (!competitor) {
        throw new Error(`Competitor not found: ${request.competitorId}`);
      }

      // Perform analysis based on type
      const analysisResult = await this.competitorAnalysisService.performAnalysis(request);

      // Add forecasting if requested
      if (request.includeForecasting) {
        (analysisResult as any).forecasting = await this.generateForecasting(request.competitorId, request.timeRange);
      }

      // Add benchmarking if requested
      if (request.includeBenchmarking) {
        (analysisResult as any).benchmarking = await this.generateBenchmarking(request.competitorId);
      }

      const processingTime = Date.now() - startTime;
      
      this.appInsights.trackEvent('CompetitionX:AnalysisCompleted', {
        competitorId: request.competitorId,
        analysisType: request.analysisType,
        processingTime: processingTime.toString(),
        insightCount: analysisResult.insights.length.toString()
      });

      this.logger.log(`Competitor analysis completed in ${processingTime}ms`);
      return analysisResult;

    } catch (error) {
      this.logger.error(`Competitor analysis failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'AnalyzeCompetitor',
        competitorId: request.competitorId,
        analysisType: request.analysisType
      });
      throw error;
    }
  }

  /**
   * Get list of all competitors
   */
  async getCompetitors(): Promise<Competitor[]> {
    try {
      return await this.competitorRepository.find({
        order: { marketShare: 'DESC' }
      });
    } catch (error) {
      this.logger.error(`Failed to get competitors: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Add new competitor for monitoring
   */
  async addCompetitor(competitorData: Partial<Competitor>): Promise<Competitor> {
    try {
      this.logger.log(`Adding new competitor: ${competitorData.name}`);

      const competitor = this.competitorRepository.create({
        ...competitorData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      const savedCompetitor = await this.competitorRepository.save(competitor);

      // Start monitoring for the new competitor
      await this.realTimeMonitoringService.startMonitoring(savedCompetitor.id);

      this.appInsights.trackEvent('CompetitionX:CompetitorAdded', {
        competitorId: savedCompetitor.id,
        competitorName: savedCompetitor.name,
        industry: savedCompetitor.industry || 'unknown'
      });

      this.logger.log(`Competitor added successfully: ${savedCompetitor.id}`);
      return savedCompetitor;

    } catch (error) {
      this.logger.error(`Failed to add competitor: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'AddCompetitor',
        competitorName: competitorData.name
      });
      throw error;
    }
  }

  /**
   * Update competitor information
   */
  async updateCompetitor(competitorId: string, updateData: Partial<Competitor>): Promise<Competitor> {
    try {
      await this.competitorRepository.update(competitorId, {
        ...updateData,
        updatedAt: new Date()
      });

      const updatedCompetitor = await this.competitorRepository.findOne({
        where: { id: competitorId }
      });

      if (!updatedCompetitor) {
        throw new Error(`Competitor not found: ${competitorId}`);
      }

      this.appInsights.trackEvent('CompetitionX:CompetitorUpdated', {
        competitorId,
        competitorName: updatedCompetitor.name
      });

      return updatedCompetitor;

    } catch (error) {
      this.logger.error(`Failed to update competitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Delete competitor and stop monitoring
   */
  async deleteCompetitor(competitorId: string): Promise<void> {
    try {
      // Stop monitoring first
      await this.realTimeMonitoringService.stopMonitoring(competitorId);

      // Delete competitor data
      await this.competitorRepository.delete(competitorId);

      this.appInsights.trackEvent('CompetitionX:CompetitorDeleted', {
        competitorId
      });

      this.logger.log(`Competitor deleted: ${competitorId}`);

    } catch (error) {
      this.logger.error(`Failed to delete competitor: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Private helper methods
   */
  private async generateOverviewData(): Promise<CompetitionXDashboardData['overview']> {
    const totalCompetitors = await this.competitorRepository.count();
    const activeMonitoring = await this.realTimeMonitoringService.getActiveMonitoringCount();
    const alertsToday = await (this.realTimeMonitoringService as any).getTodayAlertsCount();
    
    // Calculate market share (simplified)
    const marketShare = 15.5; // This would be calculated based on actual data

    return {
      totalCompetitors,
      activeMonitoring,
      alertsToday,
      marketShare
    };
  }

  private async getTopCompetitors(): Promise<CompetitionXDashboardData['topCompetitors']> {
    const competitors = await this.competitorRepository.find({
      take: 5,
      order: { marketShare: 'DESC' }
    });

    return competitors.map(competitor => ({
      id: competitor.id,
      name: competitor.name,
      marketShare: competitor.marketShare || 0,
      trend: this.calculateTrend(competitor.id),
      threatLevel: this.calculateThreatLevel(competitor.marketShare || 0)
    }));
  }

  private async getRecentInsights(): Promise<CompetitionXDashboardData['recentInsights']> {
    const insights = await this.marketInsightRepository.find({
      take: 10,
      order: { createdAt: 'DESC' }
    });

    return insights.map(insight => ({
      id: insight.id,
      type: insight.type as any,
      title: insight.title,
      description: insight.description,
      impact: insight.impact as any,
      timestamp: insight.createdAt.toISOString(),
      competitor: insight.competitorName || 'Unknown'
    }));
  }

  private async getMarketTrends(): Promise<CompetitionXDashboardData['marketTrends']> {
    // This would fetch actual market trend data
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Our Market Share',
          data: [15.2, 15.5, 15.8, 15.6, 15.9, 16.1],
          trend: 'up'
        },
        {
          label: 'Top Competitor',
          data: [22.1, 22.3, 22.0, 21.8, 21.5, 21.3],
          trend: 'down'
        }
      ]
    };
  }

  private async getActiveAlerts(): Promise<CompetitionXDashboardData['alerts']> {
    return await this.realTimeMonitoringService.getActiveAlerts() as CompetitionXDashboardData['alerts'];
  }

  private calculateTrend(competitorId: string): 'up' | 'down' | 'stable' {
    // This would calculate actual trend based on historical data
    const trends = ['up', 'down', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)] as any;
  }

  private calculateThreatLevel(marketShare: number): 'low' | 'medium' | 'high' | 'critical' {
    if (marketShare > 25) return 'critical';
    if (marketShare > 15) return 'high';
    if (marketShare > 8) return 'medium';
    return 'low';
  }

  private async generateForecasting(competitorId: string, timeRange: string): Promise<any> {
    // This would use ML models for forecasting
    return {
      marketSharePrediction: {
        nextQuarter: 16.5,
        nextYear: 18.2,
        confidence: 0.85
      },
      threatAssessment: {
        level: 'medium' as const,
        factors: ['Increasing digital presence', 'New product launches', 'Aggressive pricing'],
        timeline: 'Next 6 months'
      }
    };
  }

  private async generateBenchmarking(competitorId: string): Promise<any> {
    // This would perform actual benchmarking analysis
    return {
      vsIndustryAverage: {
        marketShare: 1.2,
        digitalPresence: 0.9,
        innovation: 1.1,
        customerSatisfaction: 0.95
      },
      vsTopCompetitor: {
        strengths: ['Better pricing', 'Stronger brand recognition'],
        gaps: ['Limited digital presence', 'Slower innovation'],
        opportunities: ['Emerging markets', 'Digital transformation']
      }
    };
  }
}
