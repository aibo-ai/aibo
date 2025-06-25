import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { GoogleTrendsService, TrendRequest } from '../services/google-trends.service';
import { AmazonKeywordsService } from '../services/amazon-keywords.service';

@Controller('seo-data')
export class SeoDataController {
  constructor(
    private googleTrendsService: GoogleTrendsService,
    private amazonKeywordsService: AmazonKeywordsService
  ) {}

  /**
   * Get Google Trends data
   */
  @Post('google-trends')
  async getGoogleTrends(@Body() request: TrendRequest) {
    try {
      const trends = await this.googleTrendsService.getTrends(request);
      
      return {
        success: true,
        data: trends,
        message: 'Google Trends data retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get trending keywords
   */
  @Get('google-trends/trending')
  async getTrendingKeywords(
    @Query('category') category?: string,
    @Query('geo') geo?: string
  ) {
    try {
      const keywords = await this.googleTrendsService.getTrendingKeywords(category, geo);
      
      return {
        success: true,
        data: keywords,
        message: 'Trending keywords retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Compare keywords performance
   */
  @Post('google-trends/compare')
  async compareKeywords(@Body() body: {
    keywords: string[];
    timeframe?: string;
    geo?: string;
  }) {
    try {
      const comparison = await this.googleTrendsService.compareKeywords(
        body.keywords,
        body.timeframe,
        body.geo
      );
      
      return {
        success: true,
        data: comparison,
        message: 'Keyword comparison completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get seasonal trends
   */
  @Post('google-trends/seasonal')
  async getSeasonalTrends(@Body() body: { keywords: string[] }) {
    try {
      const seasonalTrends = await this.googleTrendsService.getSeasonalTrends(body.keywords);
      
      return {
        success: true,
        data: seasonalTrends,
        message: 'Seasonal trends retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get related topics and queries
   */
  @Get('google-trends/related/:keyword')
  async getRelatedTopics(@Param('keyword') keyword: string) {
    try {
      const related = await this.googleTrendsService.getRelatedTopics(keyword);
      
      return {
        success: true,
        data: related,
        message: 'Related topics and queries retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Amazon ranked keywords
   */
  @Get('amazon-keywords/ranked')
  async getAmazonRankedKeywords(
    @Query('product') productQuery: string,
    @Query('category') category?: string
  ) {
    try {
      if (!productQuery) {
        return {
          success: false,
          error: 'Product query is required'
        };
      }

      const keywords = await this.amazonKeywordsService.getRankedKeywords(productQuery, category);
      
      return {
        success: true,
        data: keywords,
        message: 'Amazon ranked keywords retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get product-specific keywords
   */
  @Get('amazon-keywords/product/:productId')
  async getProductKeywords(@Param('productId') productId: string) {
    try {
      const productKeywords = await this.amazonKeywordsService.getProductKeywords(productId);
      
      return {
        success: true,
        data: productKeywords,
        message: 'Product keywords retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find keyword opportunities
   */
  @Post('amazon-keywords/opportunities')
  async findKeywordOpportunities(@Body() body: {
    seedKeywords: string[];
    category?: string;
  }) {
    try {
      const opportunities = await this.amazonKeywordsService.findKeywordOpportunities(
        body.seedKeywords,
        body.category
      );
      
      return {
        success: true,
        data: opportunities,
        message: 'Keyword opportunities found successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Analyze keyword competition
   */
  @Post('amazon-keywords/competition')
  async analyzeCompetition(@Body() body: { keywords: string[] }) {
    try {
      const analysis = await this.amazonKeywordsService.analyzeCompetition(body.keywords);
      
      return {
        success: true,
        data: analysis,
        message: 'Competition analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get seasonal keyword trends
   */
  @Post('amazon-keywords/seasonal')
  async getAmazonSeasonalTrends(@Body() body: { keywords: string[] }) {
    try {
      const seasonalTrends = await this.amazonKeywordsService.getSeasonalTrends(body.keywords);
      
      return {
        success: true,
        data: seasonalTrends,
        message: 'Amazon seasonal trends retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get keyword suggestions by category
   */
  @Get('amazon-keywords/suggestions')
  async getKeywordSuggestions(
    @Query('category') category: string,
    @Query('limit') limit?: string
  ) {
    try {
      if (!category) {
        return {
          success: false,
          error: 'Category is required'
        };
      }

      const limitNum = limit ? parseInt(limit) : 50;
      const suggestions = await this.amazonKeywordsService.getKeywordSuggestions(category, limitNum);
      
      return {
        success: true,
        data: suggestions,
        message: 'Keyword suggestions retrieved successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Track keyword rankings
   */
  @Post('amazon-keywords/rankings')
  async trackKeywordRankings(@Body() body: {
    keywords: string[];
    productId?: string;
  }) {
    try {
      const rankings = await this.amazonKeywordsService.trackKeywordRankings(
        body.keywords,
        body.productId
      );
      
      return {
        success: true,
        data: rankings,
        message: 'Keyword rankings tracked successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get comprehensive SEO analysis
   */
  @Post('comprehensive-analysis')
  async getComprehensiveAnalysis(@Body() body: {
    keywords: string[];
    productQuery?: string;
    category?: string;
    includeCompetition?: boolean;
    includeSeasonal?: boolean;
  }) {
    try {
      const results = await Promise.all([
        // Google Trends analysis
        this.googleTrendsService.getTrends({
          keywords: body.keywords,
          timeframe: 'today 3-m'
        }),
        this.googleTrendsService.compareKeywords(body.keywords),
        
        // Amazon Keywords analysis
        body.productQuery ? 
          this.amazonKeywordsService.getRankedKeywords(body.productQuery, body.category) : 
          Promise.resolve([]),
        this.amazonKeywordsService.findKeywordOpportunities(body.keywords, body.category),
        
        // Optional analyses
        body.includeCompetition ? 
          this.amazonKeywordsService.analyzeCompetition(body.keywords) : 
          Promise.resolve([]),
        body.includeSeasonal ? 
          this.googleTrendsService.getSeasonalTrends(body.keywords) : 
          Promise.resolve([])
      ]);

      const [
        googleTrends,
        keywordComparison,
        amazonKeywords,
        opportunities,
        competition,
        seasonal
      ] = results;

      return {
        success: true,
        data: {
          googleTrends,
          keywordComparison,
          amazonKeywords,
          opportunities,
          competition: body.includeCompetition ? competition : null,
          seasonal: body.includeSeasonal ? seasonal : null,
          summary: {
            totalKeywords: body.keywords.length,
            topOpportunity: opportunities.length > 0 ? opportunities[0] : null,
            winningKeyword: keywordComparison.winner,
            analysisDate: new Date().toISOString()
          }
        },
        message: 'Comprehensive SEO analysis completed successfully'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Health check for SEO data services
   */
  @Get('health')
  async healthCheck() {
    try {
      const [googleTrendsHealth, amazonKeywordsHealth] = await Promise.all([
        this.googleTrendsService.healthCheck(),
        this.amazonKeywordsService.healthCheck()
      ]);

      const overallStatus = googleTrendsHealth.available && amazonKeywordsHealth.available ? 
        'healthy' : 'degraded';

      return {
        success: true,
        status: overallStatus,
        services: {
          googleTrends: googleTrendsHealth,
          amazonKeywords: amazonKeywordsHealth
        },
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message
      };
    }
  }
}
