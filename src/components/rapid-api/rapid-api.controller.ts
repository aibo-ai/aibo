import { Controller, Get, Post, Body, Query, Param, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { RapidApiService, ProductSearchRequest, ProductDetails, ProductAnalytics } from '../../common/services/rapid-api.service';
import { AzureMonitoringService } from '../../common/services/azure-monitoring.service';

export interface ProductDetailsDto {
  pid: string;
}

export interface ProductSearchDto {
  productName: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  brand?: string;
  country?: string;
  lookBackPeriod?: number;
}

export interface ProductRecommendationsDto {
  categories: string[];
  priceRange: {
    min: number;
    max: number;
  };
  brands?: string[];
  minRating?: number;
}

export interface TrendingProductsDto {
  category: string;
  limit?: number;
}

export interface PriceHistoryDto {
  pid: string;
  days?: number;
}

@Controller('rapid-api')
export class RapidApiController {
  private readonly logger = new Logger(RapidApiController.name);

  constructor(
    private rapidApiService: RapidApiService,
    private azureMonitoringService: AzureMonitoringService
  ) {}

  /**
   * Get product details by PID
   */
  @Post('product-details')
  async getProductDetails(@Body() productDto: ProductDetailsDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting product details for PID: ${productDto.pid}`);

      this.azureMonitoringService.trackEvent({
        name: 'RapidApiProductDetailsStarted',
        properties: {
          pid: productDto.pid
        }
      });

      const productDetails = await this.rapidApiService.getProductDetails(productDto.pid);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'RapidApiProductDetailsCompleted',
        value: processingTime,
        properties: {
          pid: productDto.pid,
          productName: productDetails.name,
          brand: productDetails.brand,
          price: productDetails.price.current.toString()
        }
      });

      return {
        success: true,
        data: productDetails,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Product details failed for PID ${productDto.pid}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        pid: productDto.pid,
        operation: 'productDetails',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get product details',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Search products by criteria
   */
  @Post('product-search')
  async searchProducts(@Body() searchDto: ProductSearchDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Searching products for: ${searchDto.productName}`);

      this.azureMonitoringService.trackEvent({
        name: 'RapidApiProductSearchStarted',
        properties: {
          productName: searchDto.productName,
          category: searchDto.category || 'all',
          brand: searchDto.brand || 'all'
        }
      });

      const searchResults = await this.rapidApiService.searchProducts(searchDto);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'RapidApiProductSearchCompleted',
        value: processingTime,
        properties: {
          productName: searchDto.productName,
          resultsCount: searchResults.products.length.toString(),
          totalResults: searchResults.totalResults.toString()
        }
      });

      return {
        success: true,
        data: searchResults,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Product search failed for ${searchDto.productName}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        productName: searchDto.productName,
        operation: 'productSearch',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to search products',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get product analytics and insights
   */
  @Post('product-analytics')
  async getProductAnalytics(@Body() productDto: ProductDetailsDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting product analytics for PID: ${productDto.pid}`);

      this.azureMonitoringService.trackEvent({
        name: 'RapidApiProductAnalyticsStarted',
        properties: {
          pid: productDto.pid
        }
      });

      const analytics = await this.rapidApiService.getProductAnalytics(productDto.pid);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'RapidApiProductAnalyticsCompleted',
        value: processingTime,
        properties: {
          pid: productDto.pid,
          marketRank: analytics.marketPosition.rank.toString(),
          competitorCount: analytics.marketPosition.competitorCount.toString(),
          pricePosition: analytics.priceAnalysis.competitivePosition
        }
      });

      return {
        success: true,
        data: analytics,
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Product analytics failed for PID ${productDto.pid}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        pid: productDto.pid,
        operation: 'productAnalytics',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get product analytics',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get trending products by category
   */
  @Post('trending-products')
  async getTrendingProducts(@Body() trendingDto: TrendingProductsDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting trending products for category: ${trendingDto.category}`);

      this.azureMonitoringService.trackEvent({
        name: 'RapidApiTrendingProductsStarted',
        properties: {
          category: trendingDto.category,
          limit: (trendingDto.limit || 20).toString()
        }
      });

      const trendingProducts = await this.rapidApiService.getTrendingProducts(
        trendingDto.category,
        trendingDto.limit
      );
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'RapidApiTrendingProductsCompleted',
        value: processingTime,
        properties: {
          category: trendingDto.category,
          productsCount: trendingProducts.length.toString()
        }
      });

      return {
        success: true,
        data: {
          products: trendingProducts,
          category: trendingDto.category,
          totalCount: trendingProducts.length
        },
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Trending products failed for category ${trendingDto.category}:`, error);
      
      this.azureMonitoringService.trackException(error, {
        category: trendingDto.category,
        operation: 'trendingProducts',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get trending products',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get product recommendations based on preferences
   */
  @Post('product-recommendations')
  async getProductRecommendations(@Body() recommendationsDto: ProductRecommendationsDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting product recommendations for ${recommendationsDto.categories.length} categories`);

      this.azureMonitoringService.trackEvent({
        name: 'RapidApiProductRecommendationsStarted',
        properties: {
          categoriesCount: recommendationsDto.categories.length.toString(),
          priceMin: recommendationsDto.priceRange.min.toString(),
          priceMax: recommendationsDto.priceRange.max.toString()
        }
      });

      const recommendations = await this.rapidApiService.getProductRecommendations(recommendationsDto);
      const processingTime = Date.now() - startTime;

      this.azureMonitoringService.trackMetric({
        name: 'RapidApiProductRecommendationsCompleted',
        value: processingTime,
        properties: {
          recommendationsCount: recommendations.length.toString(),
          categoriesCount: recommendationsDto.categories.length.toString()
        }
      });

      return {
        success: true,
        data: {
          recommendations,
          preferences: recommendationsDto,
          totalCount: recommendations.length
        },
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Product recommendations failed:`, error);
      
      this.azureMonitoringService.trackException(error, {
        operation: 'productRecommendations',
        processingTime: processingTime.toString()
      });

      throw new HttpException(
        {
          success: false,
          error: 'Failed to get product recommendations',
          message: error.message,
          timestamp: new Date().toISOString()
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get price history for a product
   */
  @Post('price-history')
  async getPriceHistory(@Body() priceHistoryDto: PriceHistoryDto) {
    const startTime = Date.now();
    
    try {
      this.logger.log(`Getting price history for PID: ${priceHistoryDto.pid}`);

      const priceHistory = await this.rapidApiService.getPriceHistory(
        priceHistoryDto.pid,
        priceHistoryDto.days
      );
      const processingTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          pid: priceHistoryDto.pid,
          priceHistory,
          days: priceHistoryDto.days || 30
        },
        processingTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      this.logger.error(`Price history failed for PID ${priceHistoryDto.pid}:`, error);
      
      throw new HttpException(
        {
          success: false,
          error: 'Failed to get price history',
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
      const isHealthy = await this.rapidApiService.healthCheck();
      
      return {
        success: true,
        status: isHealthy ? 'healthy' : 'unhealthy',
        service: 'Rapid API (Flipkart)',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Rapid API health check failed:', error);
      
      return {
        success: false,
        status: 'unhealthy',
        service: 'Rapid API (Flipkart)',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
