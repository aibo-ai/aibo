import { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';
import { EnhancedBaseApiClient, RateLimitConfig } from './enhanced-base-client';
import { ContentType, NewsArticle } from '../models/content-models';
import { v4 as uuidv4 } from 'uuid';
import { RetryOptions } from '../../../../common/utils/retry-utils';

/**
 * Mediastack API response interfaces
 */
interface MediastackResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: MediastackArticle[];
}

interface MediastackArticle {
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  source: string;
  image: string | null;
  category: string;
  language: string;
  country: string;
  published_at: string;
}

/**
 * Mediastack API client for fetching news articles
 * 
 * Rate limits:
 * - Free: 500 requests/month
 * - Professional: 50,000 requests/month
 * - Business: 250,000 requests/month
 */
export class MediastackApiClient extends EnhancedBaseApiClient {
  private readonly RATE_LIMIT: RateLimitConfig = {
    maxRequests: 500, // Default to free tier
    perMilliseconds: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
    maxRetries: 3,
  };

  private readonly RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    factor: 2,
    jitter: true,
  };

  private readonly apiKey: string;

  constructor(apiKey: string) {
    super(
      'http://api.mediastack.com/v1',
      undefined, // API key is passed as query param
      'MediastackApiClient',
      {
        maxRequests: 500, // Free tier: 500 requests/month
        perMilliseconds: 30 * 24 * 60 * 60 * 1000, // 30 days
        maxRetries: 3,
      },
      {
        failureThreshold: 3,
        resetTimeout: 30000, // 30 seconds
        successThreshold: 2,
        timeout: 10000, // 10 seconds
      }
    );

    if (!apiKey) {
      throw new Error('Mediastack API key is required');
    }

    this.apiKey = apiKey;
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Make a request to the Mediastack API with retry and rate limiting
   * @override
   */
  protected async makeRequest<T>(
    config: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    const requestId = uuidv4();
    
    try {
      this.logger.debug(`[${requestId}] Making request to ${config.url}`, {
        method: config.method,
        params: config.params,
      });

      // Add API key to query params
      const requestConfig: AxiosRequestConfig = {
        ...config,
        params: {
          ...config.params,
          access_key: this.apiKey,
        },
        headers: {
          ...config.headers,
          'x-request-id': requestId,
        },
      };

      const response = await this.executeWithCircuitBreaker<T>(requestConfig);
      return response.data;
    } catch (error) {
      this.logError(error, requestId);
      throw error;
    }
  }

  /**
   * Execute request with circuit breaker pattern
   */
  private async executeWithCircuitBreaker<T>(
    config: AxiosRequestConfig
  ): Promise<any> {
    try {
      return await this.axios.request<T>(config);
    } catch (error) {
      if (error.response?.status === 429) {
        throw new Error('Mediastack API rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Mediastack API key. Please check your API key and try again.');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${error.response.data?.error?.info || 'Unknown error'}`);
      }
      throw error;
    }
  }

  /**
   * Log error with request context
   */
  private logError(error: any, requestId: string): void {
    this.logger.error(`[${requestId}] Request failed: ${error.message}`, {
      error: error.response?.data,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method,
    });
  }

  /**
   * Search for news articles
   * @param query Search query
   * @param options Search options
   * @returns Array of news articles
   */
  /**
   * Search for news articles
   * @param query Search query
   * @param options Search options
   */
  async searchNews(
    query: string,
    options: {
      languages?: string[];
      countries?: string[];
      categories?: string[];
      sources?: string[];
      limit?: number;
      offset?: number;
      sort?: 'published_desc' | 'published_asc' | 'popularity';
      date?: string; // Format: YYYY-MM-DD,YYYY-MM-DD for date range
    } = {}
  ): Promise<NewsArticle[]> {
    // Validate required parameters
    if (!this.apiKey) {
      throw new Error('Mediastack API key is not configured');
    }
    
    if (!query?.trim()) {
      throw new Error('Search query is required');
    }
    try {
      const params = {
        keywords: query,
        languages: options.languages?.join(','),
        countries: options.countries?.join(','),
        categories: options.categories?.join(','),
        sources: options.sources?.join(','),
        limit: options.limit || 25,
        offset: options.offset || 0,
        sort: options.sort || 'published_desc',
        date: options.date
      };

      const response = await this.makeRequest<MediastackResponse>({
        url: '/news',
        method: 'GET',
        params,
      });

      if (!response?.data) {
        throw new Error('Invalid response from Mediastack API');
      }

      return this.mapArticles(response.data);
    } catch (error) {
      this.logError(error, 'searchNews');
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Get live news updates
   * @param options News options
   * @returns Array of news articles
   */
  async getLiveNews(options: {
    languages?: string[];
    countries?: string[];
    categories?: string[];
    sources?: string[];
    keywords?: string;
    limit?: number;
    offset?: number;
    sort?: 'published_desc' | 'published_asc' | 'popularity';
    date?: string;
  } = {}): Promise<NewsArticle[]> {
    // Validate required parameters
    if (!this.apiKey) {
      throw new Error('Mediastack API key is not configured');
    }
    try {
      const params = {
        languages: options.languages?.join(','),
        countries: options.countries?.join(','),
        categories: options.categories?.join(','),
        sources: options.sources?.join(','),
        keywords: options.keywords,
        limit: options.limit || 25,
        offset: options.offset || 0,
        sort: options.sort || 'published_desc',
        date: options.date
      };

      const response = await this.makeRequest<MediastackResponse>({
        url: '/news',
        method: 'GET',
        params,
      });

      if (!response?.data) {
        throw new Error('Invalid response from Mediastack API');
      }

      return this.mapArticles(response.data);
    } catch (error) {
      this.logError(error, 'getLiveNews');
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Map API response to NewsArticle format
   * @param articles Array of articles from API
   * @returns Array of NewsArticle objects
   */
  private mapArticles(articles: MediastackArticle[]): NewsArticle[] {
    if (!Array.isArray(articles)) {
      this.logger.warn('Expected array of articles but received', { articles });
      return [];
    }

    return articles.reduce<NewsArticle[]>((acc, article) => {
      if (!article) {
        this.logger.warn('Skipping null/undefined article');
        return acc;
      }

      try {
        // Ensure we have the minimum required fields for NewsArticle
        if (!article.url || !article.title) {
          this.logger.warn('Skipping article with missing required fields', {
            hasUrl: !!article.url,
            hasTitle: !!article.title
          });
          return acc;
        }

        // Parse published date or use current date as fallback
        const publishedAt = article.published_at ? new Date(article.published_at) : new Date();
        const retrievedAt = new Date();

        // Create metadata object with all additional fields
        const metadata: Record<string, any> = {
          sourceApi: 'mediastack',
          description: article.description,
          category: article.category,
          language: article.language,
          country: article.country,
          imageUrl: article.image,
          ...(article as any) // Include all original fields in metadata
        };

        // Create the news article with required fields
        const newsArticle: NewsArticle = {
          id: `mediastack-${article.url}`,
          title: article.title,
          url: article.url,
          source: article.source,
          publishedAt,
          retrievedAt,
          contentType: ContentType.NEWS,
          metadata,
          // Optional fields
          author: article.author,
          imageUrl: article.image,
          snippet: article.description,
          tags: [] // Initialize empty tags array
        };
        
        acc.push(newsArticle);
        return acc;
      } catch (error) {
        this.logger.error('Error mapping article', {
          error: error.message,
          article: article ? JSON.stringify(article).substring(0, 200) + '...' : 'null/undefined'
        });
        return acc;
      }
    }, []);
  }
}
