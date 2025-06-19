import { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';
import { RetryOptions } from '../../../../common/utils/retry-utils';
import { EnhancedBaseApiClient, RateLimitConfig } from './enhanced-base-client';
import { SerpApiResponse, SerpApiOrganicResult, SerpApiNewsResult, SerpSearchOptions } from './serp-api-types';
import { ContentType, WebSearchResult } from '../models/content-models';
import { v4 as uuidv4 } from 'uuid';

/**
 * SERP API rate limit configuration
 * 1000 requests per minute
 */
const SERP_API_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 1000,
  perMilliseconds: 60000, // 1 minute
  maxRetries: 5
};

/**
 * SERP API client for fetching web search results
 */
export class SerpApiClient extends EnhancedBaseApiClient {
  private readonly apiKey: string;
  private readonly retryOptions: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    factor: 2,
    jitter: true
  };

  constructor(apiKey?: string) {
    // Use the base URL from environment variables, default to serpapi.com
    const baseUrl = process.env.SERP_API_URL || 'https://serpapi.com';
    const actualApiKey = apiKey || process.env.SERP_API_KEY;
    
    if (!actualApiKey) {
      throw new Error('SERP API key is required. Set SERP_API_KEY environment variable or pass it to the constructor.');
    }
    
    // Initialize with enhanced base client
    super(
      baseUrl,
      undefined, // We'll handle API key in query params
      'SerpApiClient',
      SERP_API_RATE_LIMIT,
      {
        failureThreshold: 5,
        resetTimeout: 60000, // 1 minute
        successThreshold: 2,
        timeout: 15000 // 15 seconds
      }
    );
    
    this.apiKey = actualApiKey;
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Masks sensitive data in request/response for logging
   */
  private maskSensitiveData(data: any): any {
    if (!data) return data;
    
    const masked = { ...data };
    
    // Mask API keys and other sensitive fields
    if ('api_key' in masked) {
      masked.api_key = '***' + (masked.api_key?.slice(-4) || '');
    }
    if ('password' in masked) {
      masked.password = '***';
    }
    if ('token' in masked) {
      masked.token = '***';
    }
    
    return masked;
  }

  /**
   * Make a request to the SERP API with proper error handling and retries
   */
  private async makeSerpRequest<T = any>(
    endpoint: string,
    params: Record<string, any> = {},
    retryOptions?: RetryOptions
  ): Promise<T> {
    const requestId = uuidv4();
    const requestParams = {
      ...params,
      api_key: this.apiKey,
      source: 'nodejs',
      engine: 'google'
    };

    try {
      return await this.get<T>(
        endpoint,
        {
          params: requestParams,
          headers: {
            'X-Request-ID': requestId,
            'Content-Type': 'application/json'
          }
        },
        { ...this.retryOptions, ...retryOptions }
      );
    } catch (error) {
      const errorMessage = error.response
        ? `Request failed with status ${error.response.status}: ${error.response.statusText}`
        : error.message;

      this.logger.error(`[${requestId}] Request failed: ${errorMessage}`, {
        endpoint,
        params: this.maskSensitiveData(params),
        error: errorMessage
      });

      throw error;
    }
  }

  /**
   * Search for web results
   * @param query Search query
   * @param options Search options
   * @returns Array of web search results
   */
  async search(query: string, options: SerpSearchOptions = {}): Promise<WebSearchResult[]> {
    const params: Record<string, any> = {
      q: query,
      num: options.limit || 10,
      gl: options.region,
      hl: options.language,
      safe: options.safeSearch ? 'active' : 'off'
    };

    // Add timeframe if specified
    if (options.timeframe) {
      params.tbs = `qdr:${options.timeframe}`;
    }

    const response = await this.makeSerpRequest<SerpApiResponse>('/search', params);
    return this.mapSearchResults(response.organic_results || [], query, 'web');
  }

  /**
   * Search for news results
   * @param query Search query
   * @param options Search options
   * @returns Array of web search results
   */
  async searchNews(query: string, options: SerpSearchOptions = {}): Promise<WebSearchResult[]> {
    const params: Record<string, any> = {
      q: query,
      tbm: 'nws', // News search
      num: options.limit || 10,
      gl: options.region,
      hl: options.language
    };

    // Add timeframe if specified
    if (options.timeframe) {
      params.tbs = `qdr:${options.timeframe}`;
    }

    const response = await this.makeSerpRequest<SerpApiResponse>('/search', params);
    return this.mapSearchResults(response.news_results || [], query, 'news');
  }

  /**
   * Map SERP API results to our WebSearchResult model
   * @param results SERP API organic results
   * @param query Original search query
   * @param type Type of search results (web or news)
   * @returns Mapped web search results
   */
  private mapSearchResults(
    results: (SerpApiOrganicResult | SerpApiNewsResult)[],
    query: string,
    type: 'web' | 'news' = 'web'
  ): WebSearchResult[] {
    const now = new Date().toISOString();
    
    return results.map(result => {
      // Try to parse the date, fallback to current time if not available
      let publishedAt = now;
      if ('date' in result && result.date) {
        try {
          const parsedDate = new Date(result.date);
          if (!isNaN(parsedDate.getTime())) {
            publishedAt = parsedDate.toISOString();
          }
        } catch (e) {
          this.logger.warn(`Failed to parse date: ${result.date}`, { error: e });
        }
      }

      // Extract domain from URL
      let domain = '';
      try {
        const url = new URL(result.link);
        domain = url.hostname.replace('www.', '');
      } catch (e) {
        domain = result.displayed_link?.split('/')[0] || 'unknown';
      }

      // Create base result without thumbnail
      const baseResult: Omit<WebSearchResult, 'thumbnail'> = {
        id: `serp_${result.position}_${Date.now()}`,
        title: result.title,
        url: result.link,
        snippet: result.snippet,
        source: domain,
        contentType: type === 'news' ? ContentType.NEWS : ContentType.WEB,
        rank: result.position,
        domain,
        publishedAt,
        retrievedAt: now,
        metadata: {
          position: result.position,
          displayedUrl: result.displayed_link,
          query,
          source: 'serpapi',
          ...(result.source && { sourceName: result.source }),
          ...(result.date && { rawDate: result.date })
        }
      };

      // Add thumbnail only if it exists in the result
      if ('thumbnail' in result && result.thumbnail) {
        return { ...baseResult, thumbnail: result.thumbnail };
      }
      
      return baseResult;
    });
  }
}
