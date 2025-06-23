import { Injectable, Logger } from '@nestjs/common';
import { ExaApiService, ExaSearchResult } from '../common/services/exa-api.service';
import { SocialMonitoringService, SocialMention, SocialMetrics } from '../common/services/social-monitoring.service';
import { NewsMonitoringService, NewsArticle, NewsAnalytics } from '../common/services/news-monitoring.service';
import { SerpMonitoringService, SerpResult, SerpAnalytics } from '../common/services/serp-monitoring.service';
import { AzureMonitoringService } from '../common/services/azure-monitoring.service';
import { AzureServiceBusService } from '../common/services/azure-service-bus.service';

export interface ComprehensiveCompetitorAnalysis {
  competitorName: string;
  timeframe: string;
  timestamp: string;
  webIntelligence: {
    companyInfo: ExaSearchResult[];
    industryTrends: ExaSearchResult[];
    productInfo: ExaSearchResult[];
    research: ExaSearchResult[];
  };
  socialIntelligence: {
    mentions: SocialMention[];
    metrics: SocialMetrics[];
    alerts: Array<{ type: string; message: string; severity: string }>;
  };
  newsIntelligence: {
    articles: NewsArticle[];
    analytics: NewsAnalytics;
    alerts: Array<{ type: string; message: string; severity: string }>;
  };
  searchIntelligence: {
    rankings: Array<{
      keyword: string;
      results: SerpResult[];
      competitorPositions: Record<string, number>;
    }>;
    analytics: SerpAnalytics[];
    serpFeatures: Array<{
      keyword: string;
      features: any;
    }>;
  };
  summary: {
    overallSentiment: 'positive' | 'negative' | 'neutral';
    sentimentScore: number;
    visibilityScore: number;
    threatLevel: 'low' | 'medium' | 'high';
    opportunities: string[];
    threats: string[];
    recommendations: string[];
  };
}

export interface IntegrationHealthStatus {
  timestamp: string;
  services: {
    exa: { status: 'healthy' | 'unhealthy'; lastCheck: string; error?: string };
    social: { status: 'healthy' | 'unhealthy'; lastCheck: string; error?: string };
    news: { status: 'healthy' | 'unhealthy'; lastCheck: string; error?: string };
    serp: { status: 'healthy' | 'unhealthy'; lastCheck: string; error?: string };
    azure: { status: 'healthy' | 'unhealthy'; lastCheck: string; error?: string };
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private exaApiService: ExaApiService,
    private socialMonitoringService: SocialMonitoringService,
    private newsMonitoringService: NewsMonitoringService,
    private serpMonitoringService: SerpMonitoringService,
    private azureMonitoringService: AzureMonitoringService,
    private azureServiceBusService: AzureServiceBusService
  ) {}

  /**
   * Perform comprehensive competitor analysis using all available integrations
   */
  async performComprehensiveAnalysis(
    competitorName: string,
    keywords: string[] = [],
    timeframe = '7d'
  ): Promise<ComprehensiveCompetitorAnalysis> {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Starting comprehensive analysis for ${competitorName}`);

      // Track the analysis start
      this.azureMonitoringService.trackEvent({
        name: 'ComprehensiveAnalysisStarted',
        properties: {
          competitor: competitorName,
          timeframe,
          keywordCount: keywords.length.toString()
        }
      });

      // Parallel execution of all intelligence gathering
      const [webIntelligence, socialIntelligence, newsIntelligence, searchIntelligence] = await Promise.allSettled([
        this.gatherWebIntelligence(competitorName),
        this.gatherSocialIntelligence(competitorName, timeframe),
        this.gatherNewsIntelligence(competitorName, timeframe),
        this.gatherSearchIntelligence(competitorName, keywords)
      ]);

      // Process results and handle any failures
      const webData = webIntelligence.status === 'fulfilled' ? webIntelligence.value : this.getEmptyWebIntelligence();
      const socialData = socialIntelligence.status === 'fulfilled' ? socialIntelligence.value : this.getEmptySocialIntelligence();
      const newsData = newsIntelligence.status === 'fulfilled' ? newsIntelligence.value : this.getEmptyNewsIntelligence();
      const searchData = searchIntelligence.status === 'fulfilled' ? searchIntelligence.value : this.getEmptySearchIntelligence();

      // Generate comprehensive summary
      const summary = this.generateAnalysisSummary(webData, socialData, newsData, searchData);

      const analysis: ComprehensiveCompetitorAnalysis = {
        competitorName,
        timeframe,
        timestamp: new Date().toISOString(),
        webIntelligence: webData,
        socialIntelligence: socialData,
        newsIntelligence: newsData,
        searchIntelligence: searchData,
        summary
      };

      const processingTime = Date.now() - startTime;

      // Track completion metrics
      this.azureMonitoringService.trackMetric({
        name: 'ComprehensiveAnalysisCompleted',
        value: processingTime,
        properties: {
          competitor: competitorName,
          timeframe,
          threatLevel: summary.threatLevel
        }
      });

      this.logger.log(`Comprehensive analysis completed for ${competitorName} in ${processingTime}ms`);
      return analysis;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Comprehensive analysis failed for ${competitorName}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        competitor: competitorName,
        operation: 'comprehensiveAnalysis',
        processingTime: processingTime.toString()
      });

      throw error;
    }
  }

  /**
   * Gather web intelligence using Exa API
   */
  private async gatherWebIntelligence(competitorName: string) {
    try {
      const [companyInfo, industryTrends, productInfo, research] = await Promise.allSettled([
        this.exaApiService.searchCompetitorInfo(competitorName, true),
        this.exaApiService.searchIndustryTrends('office furniture', '6m'),
        this.exaApiService.searchProductInfo(competitorName),
        this.exaApiService.searchResearch(`${competitorName} market analysis`)
      ]);

      return {
        companyInfo: companyInfo.status === 'fulfilled' ? companyInfo.value : [],
        industryTrends: industryTrends.status === 'fulfilled' ? industryTrends.value : [],
        productInfo: productInfo.status === 'fulfilled' ? productInfo.value : [],
        research: research.status === 'fulfilled' ? research.value : []
      };
    } catch (error) {
      this.logger.error('Web intelligence gathering failed:', error);
      return this.getEmptyWebIntelligence();
    }
  }

  /**
   * Gather social intelligence
   */
  private async gatherSocialIntelligence(competitorName: string, timeframe: string) {
    try {
      return await this.socialMonitoringService.monitorCompetitor(competitorName, timeframe);
    } catch (error) {
      this.logger.error('Social intelligence gathering failed:', error);
      return this.getEmptySocialIntelligence();
    }
  }

  /**
   * Gather news intelligence
   */
  private async gatherNewsIntelligence(competitorName: string, timeframe: string) {
    try {
      return await this.newsMonitoringService.monitorCompetitorNews(competitorName, timeframe);
    } catch (error) {
      this.logger.error('News intelligence gathering failed:', error);
      return this.getEmptyNewsIntelligence();
    }
  }

  /**
   * Gather search intelligence
   */
  private async gatherSearchIntelligence(competitorName: string, keywords: string[]) {
    try {
      if (keywords.length === 0) {
        keywords = [`${competitorName}`, `${competitorName} products`, `${competitorName} reviews`];
      }

      const { rankings, analytics } = await this.serpMonitoringService.monitorKeywordRankings(
        keywords,
        [competitorName],
        'United States',
        'desktop'
      );

      // Get SERP features for key keywords
      const serpFeatures = await Promise.allSettled(
        keywords.slice(0, 3).map(keyword => 
          this.serpMonitoringService.trackSerpFeatures(keyword, 'United States')
            .then(features => ({ keyword, features }))
        )
      );

      return {
        rankings,
        analytics,
        serpFeatures: serpFeatures
          .filter(result => result.status === 'fulfilled')
          .map(result => (result as PromiseFulfilledResult<any>).value)
      };
    } catch (error) {
      this.logger.error('Search intelligence gathering failed:', error);
      return this.getEmptySearchIntelligence();
    }
  }

  /**
   * Generate comprehensive analysis summary
   */
  private generateAnalysisSummary(webData: any, socialData: any, newsData: any, searchData: any) {
    // Calculate overall sentiment
    const sentiments = [];
    
    if (socialData.mentions?.length > 0) {
      const avgSocialSentiment = socialData.mentions.reduce((sum: number, mention: SocialMention) => 
        sum + mention.sentimentScore, 0) / socialData.mentions.length;
      sentiments.push(avgSocialSentiment);
    }

    if (newsData.articles?.length > 0) {
      const avgNewsSentiment = newsData.articles.reduce((sum: number, article: NewsArticle) => 
        sum + article.sentimentScore, 0) / newsData.articles.length;
      sentiments.push(avgNewsSentiment);
    }

    const overallSentimentScore = sentiments.length > 0 
      ? sentiments.reduce((sum, score) => sum + score, 0) / sentiments.length 
      : 0.5;

    const overallSentiment: 'positive' | 'negative' | 'neutral' = overallSentimentScore > 0.6 ? 'positive' :
                           overallSentimentScore < 0.4 ? 'negative' : 'neutral';

    // Calculate visibility score
    const visibilityScore = searchData.analytics?.length > 0 
      ? searchData.analytics.reduce((sum: number, analytics: SerpAnalytics) => {
          const competitorAnalysis = analytics.competitorAnalysis?.[0];
          return sum + (competitorAnalysis?.visibility || 0);
        }, 0) / searchData.analytics.length
      : 0;

    // Determine threat level
    const threatLevel = this.calculateThreatLevel(socialData, newsData, searchData, overallSentimentScore);

    // Generate opportunities and threats
    const opportunities = this.identifyOpportunities(webData, socialData, newsData, searchData);
    const threats = this.identifyThreats(socialData, newsData, searchData);
    const recommendations = this.generateRecommendations(opportunities, threats, threatLevel);

    return {
      overallSentiment,
      sentimentScore: overallSentimentScore,
      visibilityScore,
      threatLevel,
      opportunities,
      threats,
      recommendations
    };
  }

  /**
   * Calculate threat level based on various factors
   */
  private calculateThreatLevel(socialData: any, newsData: any, searchData: any, sentimentScore: number): 'low' | 'medium' | 'high' {
    let threatScore = 0;

    // Negative sentiment increases threat
    if (sentimentScore < 0.4) threatScore += 2;
    else if (sentimentScore < 0.5) threatScore += 1;

    // High social activity can be threatening
    if (socialData.mentions?.length > 100) threatScore += 1;

    // Negative news coverage
    if (newsData.analytics?.sentimentBreakdown?.negative > newsData.analytics?.sentimentBreakdown?.positive) {
      threatScore += 2;
    }

    // High search visibility is competitive threat
    if (searchData.analytics?.some((a: SerpAnalytics) => a.competitorAnalysis?.[0]?.visibility > 0.3)) {
      threatScore += 1;
    }

    if (threatScore >= 4) return 'high';
    if (threatScore >= 2) return 'medium';
    return 'low';
  }

  /**
   * Identify opportunities from the analysis
   */
  private identifyOpportunities(webData: any, socialData: any, newsData: any, searchData: any): string[] {
    const opportunities = [];

    // Low competitor visibility = opportunity
    if (searchData.analytics?.every((a: SerpAnalytics) => a.competitorAnalysis?.[0]?.visibility < 0.1)) {
      opportunities.push('Low competitor search visibility presents SEO opportunity');
    }

    // Positive sentiment trend
    if (socialData.metrics?.some((m: SocialMetrics) => m.sentimentBreakdown.positive > m.sentimentBreakdown.negative)) {
      opportunities.push('Positive social sentiment indicates market acceptance');
    }

    // Industry trends from web intelligence
    if (webData.industryTrends?.length > 0) {
      opportunities.push('Industry trend analysis reveals growth opportunities');
    }

    // Gap in SERP features
    if (searchData.serpFeatures?.some((f: any) => !f.features.features.some((feat: any) => feat.type === 'featured_snippet' && feat.present))) {
      opportunities.push('Featured snippet opportunities available for key terms');
    }

    return opportunities;
  }

  /**
   * Identify threats from the analysis
   */
  private identifyThreats(socialData: any, newsData: any, searchData: any): string[] {
    const threats = [];

    // High negative sentiment
    if (socialData.metrics?.some((m: SocialMetrics) => m.sentimentBreakdown.negative > m.sentimentBreakdown.positive)) {
      threats.push('Negative social sentiment trend detected');
    }

    // Negative news coverage
    if (newsData.analytics?.sentimentBreakdown?.negative > 5) {
      threats.push('Significant negative news coverage');
    }

    // Strong competitor search presence
    if (searchData.analytics?.some((a: SerpAnalytics) => a.competitorAnalysis?.[0]?.bestPosition <= 3)) {
      threats.push('Competitor has strong search engine presence');
    }

    // High competitor visibility
    if (searchData.analytics?.some((a: SerpAnalytics) => a.competitorAnalysis?.[0]?.visibility > 0.5)) {
      threats.push('Competitor dominates search results for key terms');
    }

    return threats;
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(opportunities: string[], threats: string[], threatLevel: string): string[] {
    const recommendations = [];

    if (threatLevel === 'high') {
      recommendations.push('Immediate competitive response required');
      recommendations.push('Increase monitoring frequency to daily');
      recommendations.push('Develop counter-strategy for identified threats');
    }

    if (opportunities.length > threats.length) {
      recommendations.push('Focus on capitalizing on identified opportunities');
      recommendations.push('Accelerate product development in trending areas');
    }

    if (threats.length > 0) {
      recommendations.push('Address negative sentiment through improved communication');
      recommendations.push('Enhance SEO strategy to compete for key terms');
    }

    recommendations.push('Continue monitoring competitor activities');
    recommendations.push('Regular analysis updates recommended');

    return recommendations;
  }

  /**
   * Check health status of all integrations
   */
  async checkIntegrationHealth(): Promise<IntegrationHealthStatus> {
    const timestamp = new Date().toISOString();
    
    const [exaHealth, socialHealth, newsHealth, serpHealth, azureHealth] = await Promise.allSettled([
      this.exaApiService.healthCheck(),
      this.socialMonitoringService.healthCheck(),
      this.newsMonitoringService.healthCheck(),
      this.serpMonitoringService.healthCheck(),
      this.azureServiceBusService.healthCheck()
    ]);

    const services = {
      exa: {
        status: (exaHealth.status === 'fulfilled' && exaHealth.value) ? 'healthy' as const : 'unhealthy' as const,
        lastCheck: timestamp,
        error: exaHealth.status === 'rejected' ? exaHealth.reason?.message : undefined
      },
      social: {
        status: (socialHealth.status === 'fulfilled' && socialHealth.value) ? 'healthy' as const : 'unhealthy' as const,
        lastCheck: timestamp,
        error: socialHealth.status === 'rejected' ? socialHealth.reason?.message : undefined
      },
      news: {
        status: (newsHealth.status === 'fulfilled' && newsHealth.value) ? 'healthy' as const : 'unhealthy' as const,
        lastCheck: timestamp,
        error: newsHealth.status === 'rejected' ? newsHealth.reason?.message : undefined
      },
      serp: {
        status: (serpHealth.status === 'fulfilled' && serpHealth.value) ? 'healthy' as const : 'unhealthy' as const,
        lastCheck: timestamp,
        error: serpHealth.status === 'rejected' ? serpHealth.reason?.message : undefined
      },
      azure: {
        status: (azureHealth.status === 'fulfilled' && azureHealth.value) ? 'healthy' as const : 'unhealthy' as const,
        lastCheck: timestamp,
        error: azureHealth.status === 'rejected' ? azureHealth.reason?.message : undefined
      }
    };

    const healthyCount = Object.values(services).filter(service => service.status === 'healthy').length;
    const totalCount = Object.keys(services).length;

    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyCount === totalCount) {
      overall = 'healthy';
    } else if (healthyCount >= totalCount / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      timestamp,
      services,
      overall
    };
  }

  // Helper methods for empty data structures
  private getEmptyWebIntelligence() {
    return {
      companyInfo: [],
      industryTrends: [],
      productInfo: [],
      research: []
    };
  }

  private getEmptySocialIntelligence() {
    return {
      mentions: [],
      metrics: [],
      alerts: []
    };
  }

  private getEmptyNewsIntelligence() {
    return {
      articles: [],
      analytics: {
        totalArticles: 0,
        timeRange: { start: '', end: '' },
        sentimentBreakdown: { positive: 0, negative: 0, neutral: 0 },
        topSources: [],
        topKeywords: [],
        topEntities: [],
        trendingTopics: []
      },
      alerts: []
    };
  }

  private getEmptySearchIntelligence() {
    return {
      rankings: [],
      analytics: [],
      serpFeatures: []
    };
  }
}
