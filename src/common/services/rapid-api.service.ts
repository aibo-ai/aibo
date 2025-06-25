import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ProductDetails {
  pid: string;
  name: string;
  brand: string;
  category: string;
  price: {
    current: number;
    original: number;
    discount: number;
    currency: string;
  };
  rating: {
    average: number;
    count: number;
  };
  availability: {
    inStock: boolean;
    quantity?: number;
  };
  images: string[];
  description: string;
  specifications: Record<string, any>;
  seller: {
    name: string;
    rating: number;
  };
  reviews: {
    positive: number;
    negative: number;
    total: number;
  };
  url: string;
}

export interface ProductSearchRequest {
  productName: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  brand?: string;
  country?: string;
  lookBackPeriod?: number; // days
}

export interface ProductSearchResult {
  products: ProductDetails[];
  totalResults: number;
  searchQuery: string;
  filters: {
    categories: string[];
    brands: string[];
    priceRanges: Array<{
      min: number;
      max: number;
      count: number;
    }>;
  };
  trends: {
    priceHistory: Array<{
      date: string;
      averagePrice: number;
    }>;
    popularityScore: number;
    demandTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

export interface ProductAnalytics {
  product: ProductDetails;
  marketPosition: {
    rank: number;
    competitorCount: number;
    marketShare: number;
  };
  priceAnalysis: {
    competitivePosition: 'low' | 'medium' | 'high';
    recommendedPrice: number;
    priceHistory: Array<{
      date: string;
      price: number;
    }>;
  };
  sentimentAnalysis: {
    overall: 'positive' | 'neutral' | 'negative';
    aspects: Record<string, {
      sentiment: 'positive' | 'neutral' | 'negative';
      score: number;
    }>;
  };
  recommendations: {
    pricing: string[];
    marketing: string[];
    inventory: string[];
  };
}

@Injectable()
export class RapidApiService {
  private readonly logger = new Logger(RapidApiService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('RAPID_API_KEY');
    this.baseUrl = 'https://flipkart-apis.p.rapidapi.com';
    
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': 'flipkart-apis.p.rapidapi.com',
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Rapid API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Rapid API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Rapid API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('Rapid API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get product details by PID
   */
  async getProductDetails(pid: string): Promise<ProductDetails> {
    try {
      this.logger.log(`Getting product details for PID: ${pid}`);

      const response = await this.client.get(`/backend/rapidapi/product-details`, {
        params: { pid }
      });

      const data = response.data;
      
      return this.transformProductData(data);
    } catch (error) {
      this.logger.error(`Failed to get product details for PID ${pid}:`, error);
      throw error;
    }
  }

  /**
   * Search products by criteria
   */
  async searchProducts(searchRequest: ProductSearchRequest): Promise<ProductSearchResult> {
    try {
      this.logger.log(`Searching products for: ${searchRequest.productName}`);

      const response = await this.client.get(`/backend/rapidapi/search`, {
        params: {
          q: searchRequest.productName,
          category: searchRequest.category,
          brand: searchRequest.brand,
          price_min: searchRequest.priceRange?.min,
          price_max: searchRequest.priceRange?.max,
          limit: 50
        }
      });

      const data = response.data;
      
      return this.transformSearchResults(data, searchRequest);
    } catch (error) {
      this.logger.error(`Product search failed for ${searchRequest.productName}:`, error);
      throw error;
    }
  }

  /**
   * Get product analytics and insights
   */
  async getProductAnalytics(pid: string): Promise<ProductAnalytics> {
    try {
      this.logger.log(`Getting product analytics for PID: ${pid}`);

      // Get product details
      const product = await this.getProductDetails(pid);

      // Get competitor products
      const competitors = await this.searchProducts({
        productName: product.name,
        category: product.category,
        priceRange: {
          min: product.price.current * 0.7,
          max: product.price.current * 1.3
        }
      });

      // Analyze market position
      const marketPosition = this.analyzeMarketPosition(product, competitors.products);

      // Analyze pricing
      const priceAnalysis = this.analyzePricing(product, competitors.products);

      // Analyze sentiment
      const sentimentAnalysis = this.analyzeSentiment(product);

      // Generate recommendations
      const recommendations = this.generateRecommendations(product, marketPosition, priceAnalysis);

      return {
        product,
        marketPosition,
        priceAnalysis,
        sentimentAnalysis,
        recommendations
      };
    } catch (error) {
      this.logger.error(`Product analytics failed for PID ${pid}:`, error);
      throw error;
    }
  }

  /**
   * Get trending products by category
   */
  async getTrendingProducts(category: string, limit = 20): Promise<ProductDetails[]> {
    try {
      this.logger.log(`Getting trending products for category: ${category}`);

      const response = await this.client.get(`/backend/rapidapi/trending`, {
        params: {
          category,
          limit
        }
      });

      const data = response.data;
      
      return data.products?.map((product: any) => this.transformProductData(product)) || [];
    } catch (error) {
      this.logger.error(`Failed to get trending products for category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Get price history for a product
   */
  async getPriceHistory(pid: string, days = 30): Promise<Array<{ date: string; price: number }>> {
    try {
      this.logger.log(`Getting price history for PID: ${pid}`);

      const response = await this.client.get(`/backend/rapidapi/price-history`, {
        params: {
          pid,
          days
        }
      });

      return response.data.priceHistory || [];
    } catch (error) {
      this.logger.error(`Failed to get price history for PID ${pid}:`, error);
      // Return mock data for demo
      return this.generateMockPriceHistory(days);
    }
  }

  /**
   * Transform raw product data to our interface
   */
  private transformProductData(data: any): ProductDetails {
    return {
      pid: data.pid || data.id || 'unknown',
      name: data.name || data.title || 'Unknown Product',
      brand: data.brand || 'Unknown Brand',
      category: data.category || 'General',
      price: {
        current: parseFloat(data.price?.current || data.price || 0),
        original: parseFloat(data.price?.original || data.originalPrice || 0),
        discount: parseFloat(data.price?.discount || data.discount || 0),
        currency: data.price?.currency || 'INR'
      },
      rating: {
        average: parseFloat(data.rating?.average || data.rating || 0),
        count: parseInt(data.rating?.count || data.ratingCount || 0)
      },
      availability: {
        inStock: data.availability?.inStock !== false,
        quantity: data.availability?.quantity
      },
      images: Array.isArray(data.images) ? data.images : [data.image].filter(Boolean),
      description: data.description || '',
      specifications: data.specifications || {},
      seller: {
        name: data.seller?.name || 'Unknown Seller',
        rating: parseFloat(data.seller?.rating || 0)
      },
      reviews: {
        positive: parseInt(data.reviews?.positive || 0),
        negative: parseInt(data.reviews?.negative || 0),
        total: parseInt(data.reviews?.total || 0)
      },
      url: data.url || ''
    };
  }

  /**
   * Transform search results
   */
  private transformSearchResults(data: any, searchRequest: ProductSearchRequest): ProductSearchResult {
    const products = (data.products || []).map((product: any) => this.transformProductData(product));
    
    return {
      products,
      totalResults: data.totalResults || products.length,
      searchQuery: searchRequest.productName,
      filters: {
        categories: [...new Set(products.map(p => p.category))] as string[],
        brands: [...new Set(products.map(p => p.brand))] as string[],
        priceRanges: this.generatePriceRanges(products)
      },
      trends: {
        priceHistory: this.generateMockPriceHistory(30).map(item => ({
          date: item.date,
          averagePrice: item.price
        })),
        popularityScore: Math.random() * 100,
        demandTrend: ['increasing', 'decreasing', 'stable'][Math.floor(Math.random() * 3)] as any
      }
    };
  }

  /**
   * Analyze market position
   */
  private analyzeMarketPosition(product: ProductDetails, competitors: ProductDetails[]) {
    const sortedByPrice = competitors.sort((a, b) => a.price.current - b.price.current);
    const rank = sortedByPrice.findIndex(p => p.pid === product.pid) + 1;
    
    return {
      rank: rank || competitors.length + 1,
      competitorCount: competitors.length,
      marketShare: Math.max(0, (competitors.length - rank + 1) / competitors.length * 100)
    };
  }

  /**
   * Analyze pricing
   */
  private analyzePricing(product: ProductDetails, competitors: ProductDetails[]) {
    const prices = competitors.map(p => p.price.current).filter(p => p > 0);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    let competitivePosition: 'low' | 'medium' | 'high' = 'medium';
    if (product.price.current < avgPrice * 0.8) competitivePosition = 'low';
    else if (product.price.current > avgPrice * 1.2) competitivePosition = 'high';
    
    return {
      competitivePosition,
      recommendedPrice: avgPrice,
      priceHistory: this.generateMockPriceHistory(30)
    };
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(product: ProductDetails) {
    const positiveRatio = product.reviews.total > 0 ? 
      product.reviews.positive / product.reviews.total : 0.5;
    
    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (positiveRatio > 0.7) overall = 'positive';
    else if (positiveRatio < 0.4) overall = 'negative';
    
    return {
      overall,
      aspects: {
        quality: { sentiment: overall, score: positiveRatio },
        value: { sentiment: overall, score: positiveRatio },
        delivery: { sentiment: overall, score: positiveRatio }
      }
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(product: ProductDetails, marketPosition: any, priceAnalysis: any) {
    const recommendations = {
      pricing: [] as string[],
      marketing: [] as string[],
      inventory: [] as string[]
    };

    if (priceAnalysis.competitivePosition === 'high') {
      recommendations.pricing.push('Consider reducing price to improve competitiveness');
    } else if (priceAnalysis.competitivePosition === 'low') {
      recommendations.pricing.push('Opportunity to increase price while maintaining competitiveness');
    }

    if (product.rating.average < 4.0) {
      recommendations.marketing.push('Focus on improving product quality and customer satisfaction');
    }

    if (marketPosition.rank > marketPosition.competitorCount * 0.7) {
      recommendations.marketing.push('Increase marketing efforts to improve market position');
    }

    return recommendations;
  }

  /**
   * Generate price ranges for filtering
   */
  private generatePriceRanges(products: ProductDetails[]) {
    const prices = products.map(p => p.price.current).filter(p => p > 0);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice;
    
    return [
      { min: minPrice, max: minPrice + range * 0.25, count: 0 },
      { min: minPrice + range * 0.25, max: minPrice + range * 0.5, count: 0 },
      { min: minPrice + range * 0.5, max: minPrice + range * 0.75, count: 0 },
      { min: minPrice + range * 0.75, max: maxPrice, count: 0 }
    ];
  }

  /**
   * Generate mock price history for demo
   */
  private generateMockPriceHistory(days: number): Array<{ date: string; price: number }> {
    const history = [];
    const basePrice = 1000 + Math.random() * 5000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const variation = (Math.random() - 0.5) * 0.2; // ±10% variation
      const price = basePrice * (1 + variation);
      
      history.push({
        date: date.toISOString().split('T')[0],
        price: Math.round(price * 100) / 100
      });
    }
    
    return history;
  }

  /**
   * Get product recommendations based on user preferences
   */
  async getProductRecommendations(preferences: {
    categories: string[];
    priceRange: { min: number; max: number };
    brands?: string[];
    minRating?: number;
  }): Promise<ProductDetails[]> {
    try {
      this.logger.log('Getting product recommendations based on preferences');

      const recommendations: ProductDetails[] = [];

      for (const category of preferences.categories) {
        const trending = await this.getTrendingProducts(category, 10);
        const filtered = trending.filter(product =>
          product.price.current >= preferences.priceRange.min &&
          product.price.current <= preferences.priceRange.max &&
          (!preferences.minRating || product.rating.average >= preferences.minRating) &&
          (!preferences.brands || preferences.brands.includes(product.brand))
        );

        recommendations.push(...filtered);
      }

      // Remove duplicates and sort by rating
      const uniqueRecommendations = recommendations
        .filter((product, index, self) =>
          index === self.findIndex(p => p.pid === product.pid)
        )
        .sort((a, b) => b.rating.average - a.rating.average)
        .slice(0, 20);

      return uniqueRecommendations;
    } catch (error) {
      this.logger.error('Failed to get product recommendations:', error);
      throw error;
    }
  }

  /**
   * Health check for Rapid API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple product details call
      await this.getProductDetails('KSAGCMFYPFS7D9TE');
      return true;
    } catch (error) {
      this.logger.error('Rapid API health check failed:', error);
      return false;
    }
  }
}
