import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { Logger } from '@nestjs/common';
import { CircuitBreaker, createCircuitBreaker } from '../../../../common/utils/circuit-breaker';
import { withRetry } from '../../../../common/utils/retry-utils';

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  maxRequests: number;      // Maximum number of requests
  perMilliseconds: number;  // Per how many milliseconds
  maxRetries?: number;      // Maximum number of retries when rate limited
}

/**
 * Default rate limit configuration
 */
const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 100,
  perMilliseconds: 60000, // Per minute
  maxRetries: 3
};

/**
 * Default circuit breaker configuration
 */
const DEFAULT_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,
  resetTimeout: 30000, // 30 seconds
  successThreshold: 2,
  timeout: 10000, // 10 seconds
};

/**
 * Base API client with common functionality for all data source clients
 */
export abstract class BaseApiClient {
  protected readonly axios: AxiosInstance;
  protected readonly logger: Logger;
  protected readonly name: string;
  
  private readonly circuitBreaker: CircuitBreaker;
  private rateLimitConfig: RateLimitConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private requestCount = 0;
  private lastRequestTime = 0;
  private rateLimitResetTimer: NodeJS.Timeout | null = null;
  
  constructor(
    baseURL: string, 
    apiKey?: string, 
    name: string = 'BaseApiClient',
    rateLimitConfig: Partial<RateLimitConfig> = {},
    circuitBreakerConfig: Partial<ConstructorParameters<typeof CircuitBreaker>[0]> = {}
  ) {
    this.name = name;
    this.logger = new Logger(name);
    this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT, ...rateLimitConfig };
    
    // Initialize circuit breaker
    this.circuitBreaker = createCircuitBreaker({
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...circuitBreakerConfig
    });
    
    const config: AxiosRequestConfig = {
      baseURL,
      timeout: 10000, // 10 seconds timeout
      headers: {}
    };
    
    if (apiKey) {
      config.headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    this.axios = axios.create(config);
    
    // Add request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error(`Request error: ${error.message}`);
        return Promise.reject(error);
      }
    );
    
    // Add response interceptor for logging and rate limit handling
    this.axios.interceptors.response.use(
      (response) => {
        this.logger.debug(`Received response from ${response.config.url}`);
        this.updateRateLimitHeaders(response.headers);
        return response;
      },
      async (error: AxiosError) => {
        if (error.response) {
          this.logger.error(`API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
          
          // Handle rate limiting
          if (error.response.status === 429) {
            const retryAfter = this.handleRateLimitError(error);
            if (retryAfter > 0) {
              // Wait and retry
              await new Promise(resolve => setTimeout(resolve, retryAfter));
              return this.axios.request(error.config);
            }
          }
        } else if (error.request) {
          this.logger.error(`No response received: ${error.message}`);
        } else {
          this.logger.error(`Request setup error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Set custom headers for the API client
   * @param headers Headers to set
   */
  protected setHeaders(headers: Record<string, string>): void {
    Object.entries(headers).forEach(([key, value]) => {
      this.axios.defaults.headers.common[key] = value;
    });
  }
  
  /**
   * Handle API errors consistently
   * @param error Error object
   * @param context Context for the error
   */
  protected handleError(error: any, context: string): never {
    let message = `${this.name} error in ${context}: `;
    
    if (error.response) {
      message += `Status ${error.response.status} - ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      message += `No response received - ${error.message}`;
    } else {
      message += error.message;
    }
    
    this.logger.error(message);
    throw new Error(message);
  }
  
  /**
   * Update rate limit headers from response
   * @param headers Response headers
   */
  protected updateRateLimitHeaders(headers: any): void {
    // Extract common rate limit headers
    const rateLimitRemaining = headers['x-ratelimit-remaining'] || headers['x-rate-limit-remaining'];
    const rateLimitReset = headers['x-ratelimit-reset'] || headers['x-rate-limit-reset'];
    
    if (rateLimitRemaining !== undefined) {
      this.logger.debug(`Rate limit remaining: ${rateLimitRemaining}`);
    }
    
    if (rateLimitReset !== undefined) {
      this.logger.debug(`Rate limit resets at: ${rateLimitReset}`);
    }
  }
  
  /**
   * Handle rate limit errors and return retry delay
   * @param error Axios error
   * @returns Retry delay in milliseconds
   */
  protected handleRateLimitError(error: AxiosError): number {
    const retryAfterHeader = error.response?.headers['retry-after'];
    
    if (retryAfterHeader) {
      const retryAfter = parseInt(retryAfterHeader, 10);
      if (!isNaN(retryAfter)) {
        this.logger.warn(`Rate limited. Retrying after ${retryAfter} seconds`);
        return retryAfter * 1000; // Convert to milliseconds
      }
    }
    
    // Default backoff: 60 seconds
    this.logger.warn('Rate limited. Using default 60 second backoff');
    return 60000;
  }
  
  /**
   * Check if the client is properly configured
   */
  abstract isConfigured(): boolean;
  
  /**
   * Get the name of the data source
   */
  getName(): string {
    return this.name;
  }
}
