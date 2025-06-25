import { Controller, Get, Post, Body, Query, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { MozSeoService, MozSeoAnalysisRequest, MozSeoAnalysisResult } from '../../common/services/moz-seo.service';
import { AzureMonitoringService } from '../../common/services/azure-monitoring.service';

export interface UrlMetricsDto {
  url: string;
}

export interface KeywordAnalysisDto {
  keywords: string[];
  location?: string;
}

export interface CompetitorAnalysisDto {
  domain: string;
}

export interface SeoOptimizationDto {
  websiteUrl: string;
  name: string;
  location?: string;
  targetAudience?: string;
  keywords?: string[];
  competitors?: string[];
}

@Controller('moz-seo')
export class MozSeoController {
  private readonly logger = new Logger(MozSeoController.name);

  constructor(
    private mozSeoService: MozSeoService,
    private azureMonitoringService: AzureMonitoringService
  ) {}

  /**
   * Get URL metrics including Domain Authority, Page Authority
   */
  @Post('url-metrics')
  async getUrlMetrics(@Body() urlDto: UrlMetricsDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting URL metrics for: ${urlDto.url}`);

      this.azureMonitoringService.trackEvent({
        name: 'MozSeoUrlMetricsStarted',
        properties: {
          url: urlDto.url
        }
      });

      const metrics = await this.mozSeoService.getUrlMetrics(urlDto.url);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'MozSeoUrlMetricsCompleted',
        value: processingTime,
        properties: {
          url: urlDto.url,
          domainAuthority: metrics.domainAuthority.toString(),
          pageAuthority: metrics.pageAuthority.toString()
        }
      });

      return {
        success: true,
        data: metrics,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`URL metrics failed for ${urlDto.url}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        url: urlDto.url,
        operation: 'urlMetrics',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get URL metrics',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get keyword difficulty and search volume analysis
   */
  @Post('keyword-analysis')
  async getKeywordAnalysis(@Body() keywordDto: KeywordAnalysisDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Analyzing ${keywordDto.keywords.length} keywords`);

      this.azureMonitoringService.trackEvent({
        name: 'MozSeoKeywordAnalysisStarted',
        properties: {
          keywordCount: keywordDto.keywords.length.toString(),
          location: keywordDto.location || 'US'
        }
      });

      const analysis = await this.mozSeoService.getKeywordDifficulty(
        keywordDto.keywords,
        keywordDto.location
      );

      const processingTime = Date.now() - startTime;

      // Calculate summary statistics
      const avgDifficulty = analysis.reduce((sum, k) => sum + k.difficulty, 0) / analysis.length;
      const totalVolume = analysis.reduce((sum, k) => sum + k.volume, 0);

      this.azureMonitoringService.trackMetric({
        name: 'MozSeoKeywordAnalysisCompleted',
        value: processingTime,
        properties: {
          keywordCount: analysis.length.toString(),
          avgDifficulty: avgDifficulty.toString(),
          totalVolume: totalVolume.toString()
        }
      });

      return {
        success: true,
        data: {
          keywords: analysis,
          summary: {
            totalKeywords: analysis.length,
            averageDifficulty: Math.round(avgDifficulty),
            totalSearchVolume: totalVolume,
            easyKeywords: analysis.filter(k => k.difficulty <= 30).length,
            mediumKeywords: analysis.filter(k => k.difficulty > 30 && k.difficulty <= 60).length,
            hardKeywords: analysis.filter(k => k.difficulty > 60).length
          }
        },
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Keyword analysis failed:`, error);
      
      this.azureMonitoringService.trackException(error, {
        keywordCount: keywordDto.keywords.length.toString(),
        operation: 'keywordAnalysis',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to analyze keywords',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get competitor analysis
   */
  @Post('competitor-analysis')
  async getCompetitorAnalysis(@Body() competitorDto: CompetitorAnalysisDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Analyzing competitor: ${competitorDto.domain}`);

      this.azureMonitoringService.trackEvent({
        name: 'MozSeoCompetitorAnalysisStarted',
        properties: {
          domain: competitorDto.domain
        }
      });

      const analysis = await this.mozSeoService.getCompetitorAnalysis(competitorDto.domain);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'MozSeoCompetitorAnalysisCompleted',
        value: processingTime,
        properties: {
          domain: competitorDto.domain,
          competitorCount: analysis.competitors.length.toString()
        }
      });

      return {
        success: true,
        data: analysis,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Competitor analysis failed for ${competitorDto.domain}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        domain: competitorDto.domain,
        operation: 'competitorAnalysis',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to analyze competitor',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Perform comprehensive SEO analysis and optimization recommendations
   */
  @Post('seo-optimization')
  async performSeoOptimization(@Body() optimizationDto: SeoOptimizationDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Performing SEO optimization for: ${optimizationDto.websiteUrl}`);

      this.azureMonitoringService.trackEvent({
        name: 'MozSeoOptimizationStarted',
        properties: {
          websiteUrl: optimizationDto.websiteUrl,
          name: optimizationDto.name,
          keywordCount: optimizationDto.keywords?.length.toString() || '0',
          competitorCount: optimizationDto.competitors?.length.toString() || '0'
        }
      });

      const analysis = await this.mozSeoService.performSeoAnalysis(optimizationDto);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'MozSeoOptimizationCompleted',
        value: processingTime,
        properties: {
          websiteUrl: optimizationDto.websiteUrl,
          overallScore: analysis.scores.overall.toString(),
          domainAuthority: analysis.website.metrics.domainAuthority.toString()
        }
      });

      return {
        success: true,
        data: analysis,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`SEO optimization failed for ${optimizationDto.websiteUrl}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        websiteUrl: optimizationDto.websiteUrl,
        operation: 'seoOptimization',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to perform SEO optimization',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get SEO recommendations for keyword optimization
   */
  @Post('keyword-optimization')
  async getKeywordOptimization(@Body() data: {
    currentKeywords: string[];
    targetAudience?: string;
    location?: string;
    contentType?: string;
  }) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting keyword optimization recommendations`);

      // Get keyword difficulty analysis
      const keywordAnalysis = await this.mozSeoService.getKeywordDifficulty(
        data.currentKeywords,
        data.location
      );

      // Generate optimization recommendations
      const recommendations = {
        primaryTargets: keywordAnalysis.filter(k => k.difficulty <= 30 && k.volume > 100),
        opportunityKeywords: keywordAnalysis.filter(k => k.difficulty > 30 && k.difficulty <= 60 && k.volume > 50),
        longTailSuggestions: keywordAnalysis.filter(k => k.difficulty <= 40).map(k => ({
          base: k.keyword,
          suggestions: [
            `${k.keyword} guide`,
            `${k.keyword} tips`,
            `best ${k.keyword}`,
            `how to ${k.keyword}`,
            `${k.keyword} for ${data.targetAudience || 'beginners'}`
          ]
        })),
        contentGaps: keywordAnalysis.filter(k => k.volume > 200 && k.difficulty > 60).map(k => ({
          keyword: k.keyword,
          suggestion: `Create comprehensive content targeting "${k.keyword}" with supporting long-tail keywords`,
          difficulty: k.difficulty,
          volume: k.volume
        }))
      };

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          analysis: keywordAnalysis,
          recommendations,
          summary: {
            totalAnalyzed: keywordAnalysis.length,
            primaryTargets: recommendations.primaryTargets.length,
            opportunities: recommendations.opportunityKeywords.length,
            contentGaps: recommendations.contentGaps.length
          }
        },
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Keyword optimization failed:`, error);
      
      this.azureMonitoringService.trackException(error, {
        operation: 'keywordOptimization',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get keyword optimization',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Health check endpoint
   */
  @Get('health')
  async healthCheck() {
    try {
      const isHealthy = await this.mozSeoService.healthCheck();
      
      return {
        success: true,
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'MOZ SEO API',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('MOZ SEO health check failed:', error);
      
      return {
        success: false,
        status: 'unhealthy',
        service: 'MOZ SEO API',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
