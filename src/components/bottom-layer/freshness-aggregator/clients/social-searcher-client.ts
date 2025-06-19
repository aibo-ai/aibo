import { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';
import { EnhancedBaseApiClient, RateLimitConfig } from './enhanced-base-client';
import { ContentType, SocialPlatform, SocialPost } from '../models/content-models';
import { v4 as uuidv4 } from 'uuid';
import { RetryOptions } from '../../../../common/utils/retry-utils';

/**
 * Social Searcher API response interfaces
 */
interface SocialSearcherResponse {
  posts: SocialSearcherPost[];
  networks: string[];
  total: number;
  page: number;
  pages: number;
  error?: {
    code: number;
    message: string;
    details?: Record<string, any>;
  };
  [key: string]: any; // Allow for additional properties
}

interface SocialSearcherPost {
  id: string;
  network: string;
  type: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  text: string;
  title?: string;
  user: {
    id: string;
    name: string;
    url: string;
    image?: string;
    verified?: boolean;
  };
  url: string;
  postUrl: string;
  image?: string;
  date: string;
  likes?: number;
  shares?: number;
  comments?: number;
  popularity?: number;
  engagement?: number;
  location?: string;
  language?: string;
  sentiment_score?: number;
}

/**
 * Social Searcher API client for fetching social media posts
 * 
 * Rate limits:
 * - Free: 100 requests per hour
 * - Professional: 10,000 requests per day
 * - Business: 100,000 requests per day
 * - Enterprise: Custom limits
 */
export class SocialSearcherClient extends EnhancedBaseApiClient {
  private readonly RATE_LIMIT: RateLimitConfig = {
    maxRequests: 100, // Default to free tier
    perMilliseconds: 60 * 60 * 1000, // 1 hour in milliseconds
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
      'https://api.social-searcher.com/v2',
      undefined, // We'll handle auth in makeRequest
      'SocialSearcherClient',
      {
        maxRequests: 100, // Free tier
        perMilliseconds: 60 * 60 * 1000, // 1 hour
        maxRetries: 3,
      },
      {
        failureThreshold: 3,
        resetTimeout: 60000, // 1 minute
        successThreshold: 2,
        timeout: 10000, // 10 seconds
      }
    );

    if (!apiKey) {
      throw new Error('Social Searcher API key is required');
    }

    this.apiKey = apiKey;
  }

  /**
   * Make a request to the Social Searcher API with retry and rate limiting
   * @override
   */
  protected async makeRequest<T>(
    config: AxiosRequestConfig,
    retryOptions = this.RETRY_OPTIONS
  ): Promise<T> {
    const requestId = uuidv4();
    
    try {
      this.logger.debug(`[${requestId}] Making request to ${config.url}`, {
        method: config.method,
        params: config.params,
      });

      // Add authorization and headers
      const requestConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          ...config.headers,
          'x-request-id': requestId,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        params: {
          ...config.params,
          key: this.apiKey,
        },
        validateStatus: (status) => status >= 200 && status < 500,
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
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Social Searcher API key');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${error.response.data?.error?.message || 'Unknown error'}`);
      } else if (error.response?.status === 404) {
        throw new Error('Requested resource not found');
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
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for social media posts
   * @param query Search query
   * @param options Search options
   * @returns Array of social posts
   */
  async searchSocial(
    query: string, 
    options: {
      networks?: string[];
      lang?: string;
      type?: 'text' | 'link' | 'image' | 'video' | 'all';
      sentiment?: 'positive' | 'negative' | 'neutral' | 'all';
      page?: number;
      limit?: number;
      from?: string;
      to?: string;
      sort?: 'date' | 'popularity';
    } = {}
  ): Promise<SocialPost[]> {
    const requestId = uuidv4();
    
    try {
      // Validate query
      if (!query?.trim()) {
        throw new Error('Search query is required');
      }

      // Validate and sanitize options
      const validatedOptions = {
        networks: Array.isArray(options.networks) && options.networks.length > 0 
          ? options.networks.join(',')
          : 'twitter',
        lang: options.lang || 'en',
        page: Math.max(1, Number(options.page) || 1),
        limit: Math.min(100, Math.max(1, Number(options.limit) || 10)),
        sort: options.sort || 'date',
        sentiment: options.sentiment,
        from: options.from,
        to: options.to,
        type: options.type
      };

      this.logger.debug(`[${requestId}] Searching social media for: "${query}"`, {
        options: validatedOptions,
        hasSentiment: Boolean(validatedOptions.sentiment),
        hasDateRange: Boolean(validatedOptions.from && validatedOptions.to)
      });

      // Build query parameters
      const params: Record<string, string | number> = {
        q: query.trim(),
        networks: validatedOptions.networks,
        lang: validatedOptions.lang,
        limit: validatedOptions.limit,
        sort: validatedOptions.sort,
      };

      // Add optional parameters if they exist
      if (validatedOptions.sentiment) {
        params.sentiment = validatedOptions.sentiment;
      }
      if (validatedOptions.from) {
        params.from = validatedOptions.from;
      }
      if (validatedOptions.to) {
        params.to = validatedOptions.to;
      }
      if (validatedOptions.type && validatedOptions.type !== 'all') {
        params.type = validatedOptions.type;
      }

      // Make the API request using our enhanced client
      const response = await this.makeRequest<SocialSearcherResponse>({
        url: '/search',
        method: 'GET',
        params,
      });

      // Log successful response summary
      this.logger.debug(`[${requestId}] Found ${response.posts?.length || 0} posts`);

      // Ensure we have valid posts data
      if (!response.posts || !Array.isArray(response.posts)) {
        throw new Error('Invalid response format from Social Searcher API');
      }
      
      return this.mapPosts(response.posts);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`[${requestId}] Social search failed: ${errorMessage}`, {
        query,
        error: error.response?.data,
        status: error.response?.status,
      });
      
      // Re-throw with more context
      throw new Error(`Social search failed: ${errorMessage}`);
    }
  }

  /**
   * Get trending topics on social media
   * @param options Trending options
   * @returns Array of social posts
   */
  async getTrending(options: {
    networks?: string[];
    lang?: string;
    limit?: number;
    type?: 'hashtag' | 'mention' | 'all';
  } = {}): Promise<SocialPost[]> {
    const requestId = uuidv4();
    
    try {
      // Validate and sanitize options
      const validatedOptions = {
        networks: Array.isArray(options.networks) && options.networks.length > 0 
          ? options.networks.join(',')
          : 'twitter',
        lang: options.lang || 'en',
        limit: Math.min(50, Math.max(1, Number(options.limit) || 10)),
        type: options.type || 'all',
      };

      this.logger.debug(`[${requestId}] Fetching trending social media posts`, {
        options: validatedOptions,
      });

      // Build query parameters
      const params: Record<string, string | number> = {
        networks: validatedOptions.networks,
        lang: validatedOptions.lang,
        limit: validatedOptions.limit,
      };

      // Add type if specified
      if (validatedOptions.type !== 'all') {
        params.type = validatedOptions.type;
      }

      // Make the API request using our enhanced client
      const response = await this.makeRequest<SocialSearcherResponse>({
        url: '/trending',
        method: 'GET',
        params,
      });

      // Log successful response summary
      this.logger.debug(`[${requestId}] Found ${response.posts?.length || 0} trending posts`);

      // Ensure we have valid posts data
      if (!response.posts || !Array.isArray(response.posts)) {
        throw new Error('Invalid response format from Social Searcher API');
      }
      
      return this.mapPosts(response.posts);
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || error.message;
      this.logger.error(`[${requestId}] Failed to fetch trending posts: ${errorMessage}`, {
        error: error.response?.data,
        status: error.response?.status,
      });
      
      // Re-throw with more context
      throw new Error(`Failed to fetch trending posts: ${errorMessage}`);
    }
  }

  /**
   * Map Social Searcher posts to our SocialPost model
   * @param posts Social Searcher posts
   * @returns Mapped social posts
   */
  /**
   * Map Social Searcher posts to our SocialPost model with validation and error handling
   */
  private mapPosts(posts: SocialSearcherPost[]): SocialPost[] {
    const now = new Date();
    
    return posts.map(post => {
      try {
        // Validate required fields
        if (!post || typeof post !== 'object') {
          throw new Error('Invalid post data');
        }

        // Map network to our SocialPlatform enum
        let platform: SocialPlatform;
        const network = (post.network || '').toLowerCase();
        
        switch (network) {
          case 'twitter':
            platform = SocialPlatform.TWITTER;
            break;
          case 'facebook':
            platform = SocialPlatform.FACEBOOK;
            break;
          case 'instagram':
            platform = SocialPlatform.INSTAGRAM;
            break;
          case 'linkedin':
            platform = SocialPlatform.LINKEDIN;
            break;
          case 'reddit':
            platform = SocialPlatform.REDDIT;
            break;
          default:
            platform = SocialPlatform.OTHER;
        }
        
        // Ensure we have valid user data
        const user = post.user || { name: 'Unknown', url: '' };
        const userImage = 'image' in user ? user.image : undefined;
        
        // Extract text content safely
        const text = post.text || '';
        
        // Calculate engagement metrics safely
        const likes = typeof post.likes === 'number' ? post.likes : 0;
        const shares = typeof post.shares === 'number' ? post.shares : 0;
        const comments = typeof post.comments === 'number' ? post.comments : 0;
        const totalEngagement = typeof post.engagement === 'number' 
          ? post.engagement 
          : (likes + shares + comments);
        
        // Parse date with fallback to current time
        let publishedAt: Date;
        try {
          publishedAt = post.date ? new Date(post.date) : now;
          if (isNaN(publishedAt.getTime())) {
            throw new Error('Invalid date');
          }
        } catch (e) {
          this.logger.warn(`Invalid date '${post.date}' for post ${post.id}, using current time`, e);
          publishedAt = now;
        }
        
        // Create the mapped post
        return {
          id: post.id || uuidv4(),
          title: post.title || text.substring(0, 100).trim() || 'Untitled Post',
          url: post.url || post.postUrl || '',
          source: post.network || 'unknown',
          publishedAt,
          retrievedAt: now,
          contentType: ContentType.SOCIAL,
          platform,
          snippet: text,
          author: user.name || 'Unknown',
          imageUrl: post.image || userImage || '',
          username: user.name || 'unknown',
          profileUrl: user.url || '',
          metadata: {
            sentiment: post.sentiment || 'neutral',
            sentiment_score: typeof post.sentiment_score === 'number' ? post.sentiment_score : 0,
            location: post.location || '',
            language: post.language || 'en',
            popularity: typeof post.popularity === 'number' ? post.popularity : 0,
            network: post.network || 'unknown',
            post_id: post.id || uuidv4(),
          },
          engagement: {
            likes,
            shares,
            comments,
            totalEngagement
          }
        };
      } catch (error) {
        const errorObj = error as Error;
        this.logger.error('Error mapping social post', {
          error: errorObj.message,
          postId: post?.id,
          network: post?.network,
        });
        
        // Return a minimal valid post with error information
        return {
          id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: 'Error loading post',
          url: '',
          source: 'error',
          publishedAt: now,
          retrievedAt: now,
          contentType: ContentType.SOCIAL,
          platform: SocialPlatform.OTHER,
          snippet: 'Unable to load post content due to an error.',
          author: 'System',
          imageUrl: '',
          username: 'system',
          profileUrl: '',
          metadata: {
            error: 'Failed to map post data',
            originalError: errorObj.message,
          },
          engagement: {
            likes: 0,
            shares: 0,
            comments: 0,
            totalEngagement: 0
          }
        };
      }
    });
  }
}
