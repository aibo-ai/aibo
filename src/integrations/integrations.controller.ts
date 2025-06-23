import { Controller, Get, Post, Body, Query, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { IntegrationsService, ComprehensiveCompetitorAnalysis, IntegrationHealthStatus } from './integrations.service';

class ComprehensiveAnalysisDto {
  competitorName: string;
  keywords?: string[];
  timeframe?: string;
}

class SocialSearchDto {
  query: string;
  platforms?: string[];
  timeframe?: string;
  limit?: number;
}

class NewsSearchDto {
  query: string;
  timeframe?: string;
  sources?: string[];
  language?: string;
}

class SerpSearchDto {
  query: string;
  location?: string;
  device?: 'desktop' | 'mobile';
  competitors?: string[];
}

class WebSearchDto {
  query: string;
  type?: 'search' | 'neural' | 'keyword';
  numResults?: number;
  includeText?: boolean;
}

@ApiTags('Integrations')
@Controller('integrations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IntegrationsController {
  private readonly logger = new Logger(IntegrationsController.name);

  constructor(private integrationsService: IntegrationsService) {}

  @Post('comprehensive-analysis')
  @ApiOperation({ summary: 'Perform comprehensive competitor analysis using all integrations' })
  @ApiResponse({ status: 200, description: 'Comprehensive analysis completed', type: Object })
  async performComprehensiveAnalysis(@Body() dto: ComprehensiveAnalysisDto): Promise<ComprehensiveCompetitorAnalysis> {
    this.logger.log(`Starting comprehensive analysis for ${dto.competitorName}`);
    
    return await this.integrationsService.performComprehensiveAnalysis(
      dto.competitorName,
      dto.keywords || [],
      dto.timeframe || '7d'
    );
  }

  @Get('health')
  @ApiOperation({ summary: 'Check health status of all integrations' })
  @ApiResponse({ status: 200, description: 'Integration health status', type: Object })
  async checkHealth(): Promise<IntegrationHealthStatus> {
    return await this.integrationsService.checkIntegrationHealth();
  }

  @Post('social/search')
  @ApiOperation({ summary: 'Search social media mentions' })
  @ApiResponse({ status: 200, description: 'Social media search results' })
  async searchSocialMentions(@Body() dto: SocialSearchDto) {
    this.logger.log(`Searching social mentions for: ${dto.query}`);
    
    const { socialMonitoringService } = this.integrationsService as any;
    
    return await socialMonitoringService.searchMentions({
      query: dto.query,
      platforms: dto.platforms,
      startDate: dto.timeframe ? this.getStartDate(dto.timeframe) : undefined,
      endDate: new Date().toISOString(),
      limit: dto.limit || 100
    });
  }

  @Post('social/monitor')
  @ApiOperation({ summary: 'Monitor competitor social media activity' })
  @ApiResponse({ status: 200, description: 'Social media monitoring results' })
  async monitorSocialActivity(@Body() dto: { competitor: string; timeframe?: string }) {
    this.logger.log(`Monitoring social activity for: ${dto.competitor}`);
    
    const { socialMonitoringService } = this.integrationsService as any;
    
    return await socialMonitoringService.monitorCompetitor(
      dto.competitor,
      dto.timeframe || '24h'
    );
  }

  @Post('news/search')
  @ApiOperation({ summary: 'Search news articles' })
  @ApiResponse({ status: 200, description: 'News search results' })
  async searchNews(@Body() dto: NewsSearchDto) {
    this.logger.log(`Searching news for: ${dto.query}`);
    
    const { newsMonitoringService } = this.integrationsService as any;
    
    return await newsMonitoringService.searchNews({
      query: dto.query,
      from: dto.timeframe ? this.getStartDate(dto.timeframe).split('T')[0] : undefined,
      to: new Date().toISOString().split('T')[0],
      sources: dto.sources,
      language: dto.language || 'en',
      pageSize: 50
    });
  }

  @Post('news/monitor')
  @ApiOperation({ summary: 'Monitor competitor news coverage' })
  @ApiResponse({ status: 200, description: 'News monitoring results' })
  async monitorNews(@Body() dto: { competitor: string; timeframe?: string }) {
    this.logger.log(`Monitoring news for: ${dto.competitor}`);
    
    const { newsMonitoringService } = this.integrationsService as any;
    
    return await newsMonitoringService.monitorCompetitorNews(
      dto.competitor,
      dto.timeframe || '7d'
    );
  }

  @Post('serp/search')
  @ApiOperation({ summary: 'Search SERP results' })
  @ApiResponse({ status: 200, description: 'SERP search results' })
  async searchSerp(@Body() dto: SerpSearchDto) {
    this.logger.log(`Searching SERP for: ${dto.query}`);
    
    const { serpMonitoringService } = this.integrationsService as any;
    
    return await serpMonitoringService.searchSerp({
      query: dto.query,
      location: dto.location || 'United States',
      device: dto.device || 'desktop',
      num: 100
    });
  }

  @Post('serp/monitor-rankings')
  @ApiOperation({ summary: 'Monitor keyword rankings for competitors' })
  @ApiResponse({ status: 200, description: 'Keyword ranking monitoring results' })
  async monitorKeywordRankings(@Body() dto: { keywords: string[]; competitors: string[]; location?: string; device?: string }) {
    this.logger.log(`Monitoring keyword rankings for: ${dto.keywords.join(', ')}`);
    
    const { serpMonitoringService } = this.integrationsService as any;
    
    return await serpMonitoringService.monitorKeywordRankings(
      dto.keywords,
      dto.competitors,
      dto.location || 'United States',
      dto.device as any || 'desktop'
    );
  }

  @Post('serp/track-features')
  @ApiOperation({ summary: 'Track SERP features for keywords' })
  @ApiResponse({ status: 200, description: 'SERP features tracking results' })
  async trackSerpFeatures(@Body() dto: { keyword: string; location?: string }) {
    this.logger.log(`Tracking SERP features for: ${dto.keyword}`);
    
    const { serpMonitoringService } = this.integrationsService as any;
    
    return await serpMonitoringService.trackSerpFeatures(
      dto.keyword,
      dto.location || 'United States'
    );
  }

  @Post('web/search')
  @ApiOperation({ summary: 'Search web content using Exa API' })
  @ApiResponse({ status: 200, description: 'Web search results' })
  async searchWeb(@Body() dto: WebSearchDto) {
    this.logger.log(`Searching web content for: ${dto.query}`);
    
    const { exaApiService } = this.integrationsService as any;
    
    return await exaApiService.search({
      query: dto.query,
      type: dto.type || 'neural',
      numResults: dto.numResults || 10,
      includeText: dto.includeText || false,
      includeSummary: true,
      includeHighlights: true
    });
  }

  @Post('web/competitor-info')
  @ApiOperation({ summary: 'Search competitor information using Exa API' })
  @ApiResponse({ status: 200, description: 'Competitor information search results' })
  async searchCompetitorInfo(@Body() dto: { competitor: string; includeText?: boolean }) {
    this.logger.log(`Searching competitor info for: ${dto.competitor}`);
    
    const { exaApiService } = this.integrationsService as any;
    
    return await exaApiService.searchCompetitorInfo(
      dto.competitor,
      dto.includeText || true
    );
  }

  @Post('web/industry-trends')
  @ApiOperation({ summary: 'Search industry trends using Exa API' })
  @ApiResponse({ status: 200, description: 'Industry trends search results' })
  async searchIndustryTrends(@Body() dto: { industry: string; timeframe?: string }) {
    this.logger.log(`Searching industry trends for: ${dto.industry}`);
    
    const { exaApiService } = this.integrationsService as any;
    
    return await exaApiService.searchIndustryTrends(
      dto.industry,
      dto.timeframe || '6m'
    );
  }

  @Post('web/product-info')
  @ApiOperation({ summary: 'Search product information using Exa API' })
  @ApiResponse({ status: 200, description: 'Product information search results' })
  async searchProductInfo(@Body() dto: { product: string; competitor?: string }) {
    this.logger.log(`Searching product info for: ${dto.product}`);
    
    const { exaApiService } = this.integrationsService as any;
    
    return await exaApiService.searchProductInfo(
      dto.product,
      dto.competitor
    );
  }

  @Post('web/research')
  @ApiOperation({ summary: 'Search research papers and whitepapers using Exa API' })
  @ApiResponse({ status: 200, description: 'Research search results' })
  async searchResearch(@Body() dto: { topic: string }) {
    this.logger.log(`Searching research for: ${dto.topic}`);
    
    const { exaApiService } = this.integrationsService as any;
    
    return await exaApiService.searchResearch(dto.topic);
  }

  @Get('analytics/dashboard')
  @ApiOperation({ summary: 'Get comprehensive analytics dashboard data' })
  @ApiResponse({ status: 200, description: 'Analytics dashboard data' })
  @ApiQuery({ name: 'competitor', required: false, description: 'Competitor name to focus on' })
  @ApiQuery({ name: 'timeframe', required: false, description: 'Time range for analytics' })
  async getAnalyticsDashboard(
    @Query('competitor') competitor?: string,
    @Query('timeframe') timeframe?: string
  ) {
    this.logger.log(`Getting analytics dashboard data`);
    
    try {
      // If competitor specified, get comprehensive analysis
      if (competitor) {
        const analysis = await this.integrationsService.performComprehensiveAnalysis(
          competitor,
          [],
          timeframe || '7d'
        );
        
        return {
          type: 'competitor_focused',
          competitor,
          timeframe: timeframe || '7d',
          data: analysis,
          timestamp: new Date().toISOString()
        };
      }

      // Otherwise, get general health and status
      const health = await this.integrationsService.checkIntegrationHealth();
      
      return {
        type: 'general_overview',
        timeframe: timeframe || '7d',
        data: {
          integrationHealth: health,
          summary: {
            totalIntegrations: Object.keys(health.services).length,
            healthyIntegrations: Object.values(health.services).filter(s => s.status === 'healthy').length,
            overallStatus: health.overall
          }
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error('Analytics dashboard data retrieval failed:', error);
      throw error;
    }
  }

  @Post('batch-analysis')
  @ApiOperation({ summary: 'Perform batch analysis for multiple competitors' })
  @ApiResponse({ status: 200, description: 'Batch analysis results' })
  async performBatchAnalysis(@Body() dto: { competitors: string[]; keywords?: string[]; timeframe?: string }) {
    this.logger.log(`Starting batch analysis for ${dto.competitors.length} competitors`);
    
    const results = await Promise.allSettled(
      dto.competitors.map(competitor =>
        this.integrationsService.performComprehensiveAnalysis(
          competitor,
          dto.keywords || [],
          dto.timeframe || '7d'
        )
      )
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<ComprehensiveCompetitorAnalysis>).value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map((result, index) => ({
        competitor: dto.competitors[index],
        error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
      }));

    return {
      successful,
      failed,
      summary: {
        total: dto.competitors.length,
        successful: successful.length,
        failed: failed.length
      },
      timestamp: new Date().toISOString()
    };
  }

  // Helper method to calculate start date based on timeframe
  private getStartDate(timeframe: string): string {
    const now = new Date();
    
    switch (timeframe) {
      case '24h':
        now.setHours(now.getHours() - 24);
        break;
      case '7d':
        now.setDate(now.getDate() - 7);
        break;
      case '30d':
        now.setDate(now.getDate() - 30);
        break;
      case '90d':
        now.setDate(now.getDate() - 90);
        break;
      case '1y':
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        now.setDate(now.getDate() - 7); // Default to 7 days
    }
    
    return now.toISOString();
  }
}
