import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';

/**
 * News API article interface
 */
interface NewsApiArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

/**
 * News API response interface
 */
interface NewsApiResponse {
  status: string;
  totalResults: number;
  articles: NewsApiArticle[];
  message?: string;
}

/**
 * Standardized news article interface
 */
export interface NewsArticle {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: string;
  author?: string;
  publishedDate: string;
  imageUrl?: string;
  relevanceScore: number;
}

/**
 * Search options for News API
 */
export interface NewsApiSearchOptions {
  language?: string;
  sortBy?: 'relevancy' | 'popularity' | 'publishedAt';
  from?: string;
  to?: string;
  pageSize?: number;
  page?: number;
  sources?: string[];
  domains?: string[];
  excludeDomains?: string[];
}

/**
 * News API client service
 */
@Injectable()
export class NewsApiService {
  private readonly logger = new Logger(NewsApiService.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://newsapi.org/v2';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('NEWS_API_KEY') || '';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'X-API-Key': this.apiKey,
        'User-Agent': 'ContentArchitect/1.0'
      }
    });

    // Add request interceptor for logging
    this.httpClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        this.logger.error(`Response error: ${error.message}`);
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded for News API');
        }
        if (error.response?.status === 401) {
          throw new Error('Invalid API key for News API');
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for news articles
   * @param query Search query
   * @param options Search options
   * @returns Array of news articles
   */
  async searchNews(
    query: string, 
    options: NewsApiSearchOptions = {}
  ): Promise<NewsArticle[]> {
    try {
      // Validate API key
      if (!this.apiKey) {
        throw new Error('News API key not configured');
      }

      const params: Record<string, any> = {
        q: query,
        language: options.language || 'en',
        sortBy: options.sortBy || 'publishedAt',
        pageSize: Math.min(options.pageSize || 20, 100),
        page: options.page || 1,
        ...(options.from && { from: options.from }),
        ...(options.to && { to: options.to }),
        ...(options.sources && { sources: options.sources.join(',') }),
        ...(options.domains && { domains: options.domains.join(',') }),
        ...(options.excludeDomains && { excludeDomains: options.excludeDomains.join(',') })
      };

      const response = await this.makeRequest<NewsApiResponse>('/everything', params);
      
      if (response.status !== 'ok') {
        throw new Error(response.message || 'Failed to search news');
      }

      return this.mapArticles(response.articles || []);
    } catch (error) {
      this.logger.error(`Error searching news: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get top headlines
   * @param options Headlines options
   * @returns Array of news articles
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

    const response = await this.makeRequest<NewsApiResponse>('/top-headlines', params);
    
    if (response.status !== 'ok') {
      throw new Error(response.message || 'Failed to fetch top headlines');
    }

    return this.mapArticles(response.articles || []);
  }

  /**
   * Make HTTP request to News API
   * @param endpoint API endpoint
   * @param params Query parameters
   * @returns API response
   */
  private async makeRequest<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    const response: AxiosResponse<T> = await this.httpClient.get(endpoint, { params });
    return response.data;
  }

  /**
   * Map News API articles to standardized format
   * @param articles Raw News API articles
   * @returns Standardized news articles
   */
  private mapArticles(articles: NewsApiArticle[]): NewsArticle[] {
    return articles
      .filter(article => article.title && article.url)
      .map((article, index) => ({
        id: `newsapi_${Date.now()}_${index}`,
        title: article.title,
        description: article.description || undefined,
        content: article.content || undefined,
        url: article.url,
        source: article.source.name || 'Unknown',
        author: article.author || undefined,
        publishedDate: article.publishedAt,
        imageUrl: article.urlToImage || undefined,
        relevanceScore: 0.8 // Default relevance score
      }));
  }
}
