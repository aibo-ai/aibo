import { AxiosRequestConfig } from 'axios';
import { Logger } from '@nestjs/common';
import { EnhancedBaseApiClient, RateLimitConfig } from './enhanced-base-client';
import { ContentType, SocialPlatform, SocialPost } from '../models/content-models';
import { v4 as uuidv4 } from 'uuid';
import { RetryOptions } from '../../../../common/utils/retry-utils';

/**
 * Twitter API response interfaces
 */
interface TwitterApiResponse {
  data: TwitterTweet[];
  includes?: {
    users?: TwitterUser[];
    media?: TwitterMedia[];
  };
  meta?: {
    next_token?: string;
    result_count: number;
    newest_id?: string;
    oldest_id?: string;
  };
}

interface TwitterTweet {
  id: string;
  text: string;
  author_id: string;
  created_at: string;
  lang?: string;
  public_metrics: {
    retweet_count?: number;
    reply_count?: number;
    like_count?: number;
    quote_count?: number;
    impression_count?: number;
  };
  entities?: {
    hashtags?: Array<{ tag: string; start?: number; end?: number }>;
    mentions?: Array<{ username: string; id?: string; start?: number; end?: number }>;
    urls?: Array<{
      url: string;
      expanded_url: string;
      display_url: string;
      media_key?: string;
      start?: number;
      end?: number;
    }>;
  };
  attachments?: {
    media_keys?: string[];
  };
  [key: string]: any; // Allow additional properties
}

interface TwitterUser {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string;
  verified?: boolean;
}

interface TwitterMedia {
  media_key: string;
  type: 'photo' | 'video' | 'animated_gif';
  url?: string;
  preview_image_url?: string;
  width?: number;
  height?: number;
}

interface TwitterSearchOptions {
  maxResults?: number;
  startTime?: string;
  endTime?: string;
  nextToken?: string;
  sortOrder?: 'recency' | 'relevancy';
}

/**
 * Twitter (X) API client for fetching tweets
 * 
 * Rate limits:
 * - Standard v2: 500,000 requests per 15-minute window (app auth)
 * - Essential v2: 50,000 requests per 15-minute window (app auth)
 * - Elevated v2: 2,000,000 requests per 15-minute window (app auth)
 */
export class TwitterApiClient extends EnhancedBaseApiClient {
  private readonly RATE_LIMIT: RateLimitConfig = {
    maxRequests: 500000, // Default to standard tier
    perMilliseconds: 15 * 60 * 1000, // 15 minutes in milliseconds
    maxRetries: 3,
  };

  private readonly RETRY_OPTIONS: RetryOptions = {
    maxRetries: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    factor: 2,
    jitter: true,
  };

  private readonly bearerToken: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(apiKey: string, apiSecret: string, bearerToken: string) {
    super(
      'https://api.twitter.com/2',
      undefined, // We'll handle auth in makeRequest
      'TwitterApiClient',
      {
        maxRequests: 500000, // Standard tier
        perMilliseconds: 15 * 60 * 1000, // 15 minutes
        maxRetries: 3,
      },
      {
        failureThreshold: 3,
        resetTimeout: 30000, // 30 seconds
        successThreshold: 2,
        timeout: 10000, // 10 seconds
      }
    );

    if (!apiKey || !apiSecret || !bearerToken) {
      throw new Error('Twitter API credentials are required');
    }

    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
    this.bearerToken = bearerToken;
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return !!this.bearerToken && !!this.apiKey && !!this.apiSecret;
  }

  /**
   * Make a request to the Twitter API with retry and rate limiting
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

      // Add authorization header
      const requestConfig: AxiosRequestConfig = {
        ...config,
        headers: {
          ...config.headers,
          'Authorization': `Bearer ${this.bearerToken}`,
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
        const resetTime = error.response?.headers?.['x-rate-limit-reset'];
        const resetDate = resetTime ? new Date(parseInt(resetTime) * 1000) : new Date(Date.now() + 60000);
        const retryAfter = Math.ceil((resetDate.getTime() - Date.now()) / 1000);
        
        throw new Error(`Twitter API rate limit exceeded. Try again in ${retryAfter} seconds.`);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Twitter API credentials. Please check your API key, secret, and bearer token.');
      } else if (error.response?.status === 400) {
        throw new Error(`Invalid request: ${error.response.data?.detail || 'Unknown error'}`);
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
      rateLimit: {
        limit: error.response?.headers?.['x-rate-limit-limit'],
        remaining: error.response?.headers?.['x-rate-limit-remaining'],
        reset: error.response?.headers?.['x-rate-limit-reset'],
      },
    });
  }

  /**
   * Search for recent tweets
   * @param query Search query
   * @param options Search options
   * @returns Array of social posts
   */
  async searchTweets(
    query: string,
    options: TwitterSearchOptions = {}
  ): Promise<SocialPost[]> {
    const requestId = uuidv4();
    
    try {
      if (!query?.trim()) {
        throw new Error('Search query is required');
      }

      // Ensure maxResults is between 10 and 100
      const maxResults = Math.min(Math.max(options.maxResults || 10, 10), 100);
      const { sortOrder = 'recency' } = options;
      
      // Build query parameters
      const params: Record<string, any> = {
        query: query.trim(),
        max_results: maxResults,
        'tweet.fields': 'created_at,public_metrics,entities,attachments',
        'user.fields': 'name,username,profile_image_url,verified',
        'media.fields': 'url,preview_image_url',
        'expansions': 'author_id,attachments.media_keys',
        sort_order: sortOrder,
      };
      
      // Add optional parameters if provided
      if (options.startTime) params.start_time = options.startTime;
      if (options.endTime) params.end_time = options.endTime;
      if (options.nextToken) params.next_token = options.nextToken;

      this.logger.debug(`[${requestId}] Searching tweets with query: "${query}"`, { 
        params,
        options 
      });

      const response = await this.makeRequest<TwitterApiResponse>({
        url: '/tweets/search/recent',
        method: 'GET',
        params,
      });
      
      this.logger.debug(`[${requestId}] Found ${response.data?.length || 0} tweets for query "${query}"`);
      
      return this.mapTweets(response);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      this.logger.error(`[${requestId}] Tweet search failed: ${errorMessage}`, {
        query,
        error: error.response?.data,
        status: error.response?.status,
      });
      
      // Provide more specific error messages for common issues
      if (error.response?.status === 400) {
        throw new Error(`Invalid search parameters: ${errorMessage}`);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Twitter API credentials');
      } else if (error.response?.status === 429) {
        const resetTime = error.response?.headers?.['x-rate-limit-reset'];
        throw new Error(`Rate limit exceeded. Try again later.${resetTime ? ` Resets at ${new Date(parseInt(resetTime) * 1000)}` : ''}`);
      }
      
      throw error;
    }
  }

  /**
   * Get tweets from a specific user
   * @param username Twitter username
   * @param options Search options
   * @returns Array of social posts
   */
  async getUserTweets(username: string, options: {
    maxResults?: number;
    sinceId?: string;
    untilId?: string;
    excludeReplies?: boolean;
    excludeRetweets?: boolean;
  } = {}): Promise<SocialPost[]> {
    const requestId = uuidv4();
    
    try {
      if (!username?.trim()) {
        throw new Error('Username is required');
      }

      // First get the user ID
      const userResponse = await this.makeRequest<{ data: { id: string } }>({
        url: `/users/by/username/${encodeURIComponent(username)}`,
        method: 'GET',
        params: {
          'user.fields': 'name,username,profile_image_url,verified'
        }
      });
      
      if (!userResponse?.data?.id) {
        throw new Error('Failed to retrieve user ID from Twitter API');
      }
      
      const userId = userResponse.data.id;
      
      // Build query parameters
      const params: Record<string, any> = {
        max_results: Math.min(Math.max(options.maxResults || 10, 5), 100), // Enforce min/max
        'tweet.fields': 'created_at,public_metrics,entities,attachments',
        'user.fields': 'name,username,profile_image_url,verified',
        'media.fields': 'url,preview_image_url',
        'expansions': 'author_id,attachments.media_keys',
      };
      
      // Add optional parameters if provided
      if (options.sinceId) params.since_id = options.sinceId;
      if (options.untilId) params.until_id = options.untilId;
      if (options.excludeReplies) params.exclude_replies = true;
      if (options.excludeRetweets) params.exclude_retweets = true;

      this.logger.debug(`[${requestId}] Fetching tweets for user ${username} (${userId})`, { params });
      
      const response = await this.makeRequest<TwitterApiResponse>({
        url: `/users/${userId}/tweets`,
        method: 'GET',
        params,
      });
      
      this.logger.debug(`[${requestId}] Successfully retrieved ${response.data?.length || 0} tweets`);
      
      return this.mapTweets(response);
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message;
      this.logger.error(`[${requestId}] Failed to get user tweets: ${errorMessage}`, {
        username,
        error: error.response?.data,
        status: error.response?.status,
      });
      
      // Provide more specific error messages for common issues
      if (error.response?.status === 404) {
        throw new Error(`User @${username} not found`);
      } else if (error.response?.status === 401) {
        throw new Error('Invalid Twitter API credentials');
      } else if (error.response?.status === 429) {
        const resetTime = error.response?.headers?.['x-rate-limit-reset'];
        throw new Error(`Rate limit exceeded. Try again later.${resetTime ? ` Resets at ${new Date(parseInt(resetTime) * 1000)}` : ''}`);
      }
      
      throw error;
    }
  }

  /**
   * Map Twitter API response to our SocialPost model
   * @param response Twitter API response
   * @returns Mapped social posts
   */
  private mapTweets(response: TwitterApiResponse): SocialPost[] {
    try {
      if (!response?.data || !Array.isArray(response.data)) {
        this.logger.warn('Invalid Twitter API response format', { response });
        return [];
      }

      const now = new Date();
      const users = new Map<string, TwitterUser>();
      const media = new Map<string, TwitterMedia>();
      
      // Create lookup maps for users and media
      if (response.includes?.users) {
        response.includes.users.forEach(user => {
          if (user?.id) {
            users.set(user.id, user);
          }
        });
      }
      
      if (response.includes?.media) {
        response.includes.media.forEach(item => {
          if (item?.media_key) {
            media.set(item.media_key, item);
          }
        });
      }
      
      return response.data.reduce<SocialPost[]>((acc, tweet) => {
        try {
          if (!tweet?.id) {
            this.logger.warn('Skipping tweet with missing ID', { tweet });
            return acc;
          }

          const user = tweet.author_id ? users.get(tweet.author_id) : null;
          const username = user?.username || 'unknown';
          const tweetUrl = `https://twitter.com/${username}/status/${tweet.id}`;
          
          // Get the first media item if available
          let imageUrl: string | undefined;
          const mediaKey = tweet.attachments?.media_keys?.[0];
          if (mediaKey) {
            const mediaItem = media.get(mediaKey);
            imageUrl = mediaItem?.url || mediaItem?.preview_image_url;
          }
          
          // Extract hashtags and mentions
          const hashtags = (tweet.entities?.hashtags || [])
            .map(h => typeof h === 'string' ? h : h.tag)
            .filter((tag): tag is string => Boolean(tag));
            
          const mentions = (tweet.entities?.mentions || [])
            .map(m => typeof m === 'string' ? m : m.username)
            .filter((username): username is string => Boolean(username));
          
          // Calculate engagement metrics with proper null checks
          const metrics = tweet.public_metrics || {};
          const retweetCount = typeof metrics.retweet_count === 'number' ? metrics.retweet_count : 0;
          const replyCount = typeof metrics.reply_count === 'number' ? metrics.reply_count : 0;
          const likeCount = typeof metrics.like_count === 'number' ? metrics.like_count : 0;
          const quoteCount = typeof metrics.quote_count === 'number' ? metrics.quote_count : 0;
          const impressionCount = typeof metrics.impression_count === 'number' ? metrics.impression_count : 0;
          
          const totalEngagement = retweetCount + replyCount + likeCount + quoteCount;
          
          // Create the social post
          const post: SocialPost = {
            id: tweet.id,
            title: tweet.text.substring(0, 100), // First 100 chars as title
            url: tweetUrl,
            source: 'Twitter',
            publishedAt: tweet.created_at ? new Date(tweet.created_at) : now,
            retrievedAt: now,
            contentType: ContentType.SOCIAL,
            platform: SocialPlatform.TWITTER,
            snippet: tweet.text,
            author: user?.name,
            imageUrl,
            username,
            profileUrl: user?.username ? `https://twitter.com/${user.username}` : undefined,
            tags: hashtags.length > 0 ? hashtags : undefined,
            metadata: {
              mentions,
              language: tweet.lang,
              isRetweet: tweet.text.startsWith('RT @'),
              mediaType: imageUrl ? (imageUrl.endsWith('.mp4') ? 'video' : 'image') : undefined,
              originalData: tweet // Include original tweet data for reference
            },
            engagement: {
              likes: likeCount,
              shares: retweetCount,
              comments: replyCount,
              views: impressionCount,
              totalEngagement
            }
          };
          
          acc.push(post);
          return acc;
        } catch (error) {
          const errorObj = error as Error;
          this.logger.error('Error mapping tweet', {
            tweetId: tweet?.id,
            error: errorObj.message,
            stack: errorObj.stack
          });
          return acc; // Skip this tweet but continue processing others
        }
      }, []);
    } catch (error) {
      const errorObj = error as Error;
      this.logger.error('Failed to map tweets', {
        error: errorObj.message,
        stack: errorObj.stack
      });
      return [];
    }
  }
}
