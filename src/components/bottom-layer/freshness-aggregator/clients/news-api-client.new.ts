import { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';
import { EnhancedBaseApiClient, RateLimitConfig } from './enhanced-base-client';
import { ContentType, NewsArticle } from '../models/content-models';
import { v4 as uuidv4 } from 'uuid';
import { RetryOptions } from '../../../../common/utils/retry-utils';
import { withRetry } from '../../../../common/utils/retry-utils';

/**
 * NewsAPI rate limit configuration
 * 100 requests per day (free plan), 100 requests per 24h window
 */
const NEWS_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  perMilliseconds: 24 * 60 * 60 * 1000, // 24 hours
  maxRetries: 3
};

/**
 * NewsAPI response interfaces
 */
interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
  code?: string;
  message?: string;
}

interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage?: string | null;
  publishedAt: string;
  content: string | null;
  sourceUrl?: string;
}

/**
 * NewsAPI search options
 */
export interface NewsApiSearchOptions {
  sources?: string[];
  domains?: string[];
  from?: string;
  to?: string;
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  pageSize?: number;
  page?: number;
  country?: string;
  category?: string;
  qInTitle?: string;
  excludeDomains?: string[];
  limit?: number;
}

/**
 * NewsAPI client for fetching news articles with rate limiting and circuit breaking
 */
export class NewsApiClient extends EnhancedBaseApiClient {
  private readonly apiKey: string;
  private readonly retryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    factor: 2,
    jitter: true
  };
  protected readonly logger = new Logger(NewsApiClient.name);

  constructor(apiKey?: string) {
    const actualApiKey = apiKey || process.env.NEWS_API_KEY;
    
    if (!actualApiKey) {
      throw new Error('NewsAPI key is required. Set NEWS_API_KEY environment variable or pass it to the constructor.');
    }
    
    super(
      'https://newsapi.org/v2',
      actualApiKey, // Pass API key for auth header
      'NewsApiClient',
      NEWS_API_RATE_LIMIT,
      {
        failureThreshold: 3,
        resetTimeout: 60000, // 1 minute
        successThreshold: 2,
        timeout: 10000 // 10 seconds
      }
    );
    
    this.apiKey = actualApiKey;
    
    // Set default headers
    this.axios.defaults.headers.common['X-Api-Key'] = this.apiKey;
  }

  /**
   * Make a request to the NewsAPI with proper error handling and retries
   */
  protected async makeRequest<T = any>(
    config: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    // Delegate to parent class implementation
    return super.makeRequest<T>({
      ...config,
      headers: {
        ...config.headers,
        'X-Api-Key': this.apiKey
      }
    }, retryOptions);
  }
  
  private async makeNewsRequest<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.makeNewsApiRequest('GET', endpoint, params, {}, { ...this.retryOptions, ...retryOptions });
  }
  
  /**
   * Mask sensitive data in logs
   */
  private maskSensitiveData(data: any): any {
    if (!data) return data;
    
    const masked = { ...data };
    if (masked.apiKey) masked.apiKey = '***';
    if (masked.api_key) masked.api_key = '***';
    if (masked['X-Api-Key']) masked['X-Api-Key'] = '***';
    
    return masked;
  }
  
  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
  
  /**
   * Search for news articles
   */
  async searchNews(
    query: string, 
    options: NewsApiSearchOptions = {}
  ): Promise<NewsArticle[]> {
    const params: Record<string, any> = {
      q: query,
      pageSize: options.pageSize || 10,
      page: options.page || 1,
      ...(options.language && { language: options.language }),
      sortBy: options.sortBy || 'publishedAt',
      ...(options.from && { from: options.from }),
      ...(options.to && { to: options.to }),
      ...(options.domains && { domains: options.domains.join(',') }),
      ...(options.sources && { sources: options.sources.join(',') }),
      ...(options.excludeDomains && { excludeDomains: options.excludeDomains.join(',') }),
      ...(options.qInTitle && { qInTitle: options.qInTitle })
    };

    const response = await this.makeNewsRequest<NewsApiResponse>('/everything', params);
    
    if (response.status !== 'ok') {
      throw new Error(response.message || 'Failed to fetch news articles');
    }

    return this.mapArticles(response.articles || []);
  }

  /**
   * Get top headlines
   */
  async getTopHeadlines(options: {
    country?: string;
    category?: string;
    sources?: string[];
    q?: string;
    pageSize?: number;
    page?: number;
  } = {}): Promise<NewsArticle[]> {
    const params: Record<string, any> = {
      ...(options.country && { country: options.country }),
      ...(options.category && { category: options.category }),
      ...(options.sources && { sources: options.sources.join(',') }),
      ...(options.q && { q: options.q }),
      pageSize: options.pageSize || 10,
      page: options.page || 1
    };

    const response = await this.makeNewsRequest<NewsApiResponse>('/top-headlines', params);
    
    if (response.status !== 'ok') {
      throw new Error(response.message || 'Failed to fetch top headlines');
    }

    return this.mapArticles(response.articles || []);
  }

  /**
   * Get available news sources
   */
  async getSources(options: {
    country?: string;
    category?: string;
    language?: string;
  } = {}): Promise<Array<{
    id: string;
    name: string;
    description: string;
    url: string;
    category: string;
    language: string;
    country: string;
  }>> {
    const response = await this.makeNewsRequest<{
      status: string;
      sources: Array<{
        id: string;
        name: string;
        description: string;
        url: string;
        category: string;
        language: string;
        country: string;
      }>;
    }>('/sources', {
      ...(options.country && { country: options.country }),
      ...(options.category && { category: options.category }),
      ...(options.language && { language: options.language })
    });
    
    if (response.status !== 'ok') {
      throw new Error('Failed to fetch news sources');
    }

    return response.sources;
  }

  /**
   * Map NewsAPI article to our internal NewsArticle format
   */
  private mapArticles(articles: NewsApiArticle[]): NewsArticle[] {
    return articles.map(article => ({
      id: article.url,
      title: article.title,
      description: article.description || '',
      url: article.url,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
      source: article.source.name,
      author: article.author || 'Unknown',
      content: article.content || '',
      imageUrl: article.urlToImage || undefined,
      category: 'general', // Default category, can be overridden
      language: 'en', // Default language, can be overridden
      type: ContentType.NEWS,
      contentType: ContentType.NEWS,
      metadata: {
        sourceId: article.source.id || '',
        sourceName: article.source.name,
        sourceUrl: article.sourceUrl || ''
      },
      score: 0, // Default score
      retrievedAt: new Date()
    }));
  }

  /**
   * Make a GET request with rate limiting and circuit breaker
   */
  protected async makeNewsApiRequest<T = any>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    params?: Record<string, any>,
    config: AxiosRequestConfig = {},
    retryOptions?: RetryOptions
  ): Promise<T> {
    const requestId = uuidv4();
    const requestConfig: AxiosRequestConfig = {
      ...config,
      method,
      url,
      params,
      headers: {
        ...config?.headers,
        'X-Request-ID': requestId,
        'Content-Type': 'application/json'
      }
    };

    try {
      return await this.makeRequest<T>(requestConfig, retryOptions);
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status;
      
      this.logger.error(`[${requestId}] Request failed: ${errorMessage}`, {
        url,
        statusCode,
        params: this.maskSensitiveData(params || {})
      });
      
      // Handle specific NewsAPI errors
      if (statusCode === 429) {
        throw new Error('Rate limit exceeded. Please wait before making more requests.');
      } else if (statusCode === 401) {
        throw new Error('Invalid API key. Please check your NewsAPI key.');
      } else if (statusCode === 426) {
        throw new Error('Your plan only allows HTTP connections. Please upgrade to a plan that supports HTTPS.');
      }
      
      throw error;
    }
  }
}
