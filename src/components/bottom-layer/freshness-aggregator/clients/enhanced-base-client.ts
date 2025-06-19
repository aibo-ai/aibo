import axios, { AxiosInstance, AxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { Logger } from '@nestjs/common';
import { CircuitBreaker, createCircuitBreaker } from '../../../../common/utils/circuit-breaker';
import { withRetry, RetryOptions } from '../../../../common/utils/retry-utils';

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
 * Enhanced base API client with circuit breaker and rate limiting
 */
export abstract class EnhancedBaseApiClient {
  protected readonly axios: AxiosInstance;
  protected readonly logger: Logger;
  protected readonly name: string;
  
  private readonly circuitBreaker: CircuitBreaker;
  private readonly rateLimitConfig: RateLimitConfig;
  private requestQueue: Array<() => Promise<any>> = [];
  private requestCount: number;
  private lastRequestTime: number = 0;
  private rateLimitResetTimer: NodeJS.Timeout | null = null;
  
  constructor(
    baseURL: string, 
    apiKey?: string, 
    name: string = 'EnhancedBaseApiClient',
    rateLimitConfig: Partial<RateLimitConfig> = {},
    circuitBreakerConfig: Partial<ConstructorParameters<typeof CircuitBreaker>[0]> = {}
  ) {
    this.name = name;
    this.logger = new Logger(name);
    this.rateLimitConfig = { ...DEFAULT_RATE_LIMIT, ...rateLimitConfig };
    this.requestCount = this.rateLimitConfig.maxRequests;
    
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
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${apiKey}`
      };
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
   * Update rate limit headers from response
   */
  private updateRateLimitHeaders(headers: any): void {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    
    if (remaining !== undefined) {
      this.requestCount = parseInt(remaining, 10);
    }
    
    if (reset) {
      const resetTime = parseInt(reset, 10) * 1000; // Convert to milliseconds
      const now = Date.now();
      if (resetTime > now) {
        this.scheduleRateLimitReset(resetTime - now);
      }
    }
  }
  
  /**
   * Handle rate limit error (429)
   */
  private handleRateLimitError(error: AxiosError): number {
    const retryAfter = error.response?.headers?.['retry-after'];
    
    if (retryAfter) {
      const waitTime = parseInt(retryAfter, 10) * 1000 || 60000; // Default to 60 seconds
      this.logger.warn(`Rate limited. Waiting ${waitTime}ms before retrying...`);
      this.scheduleRateLimitReset(waitTime);
      return waitTime;
    }
    
    return 0;
  }
  
  /**
   * Schedule rate limit reset
   */
  private scheduleRateLimitReset(timeout: number): void {
    if (this.rateLimitResetTimer) {
      clearTimeout(this.rateLimitResetTimer);
    }
    
    this.rateLimitResetTimer = setTimeout(() => {
      this.requestCount = this.rateLimitConfig.maxRequests;
      this.rateLimitResetTimer = null;
      this.processRequestQueue();
    }, timeout);
  }
  
  /**
   * Process queued requests
   */
  private async processRequestQueue(): Promise<void> {
    if (this.requestQueue.length === 0) return;
    
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = this.rateLimitConfig.perMilliseconds / this.rateLimitConfig.maxRequests;
    
    if (timeSinceLastRequest < minTimeBetweenRequests) {
      // Wait before processing next request
      setTimeout(() => this.processRequestQueue(), minTimeBetweenRequests - timeSinceLastRequest);
      return;
    }
    
    const request = this.requestQueue.shift();
    if (request) {
      this.lastRequestTime = Date.now();
      try {
        await request();
      } catch (error) {
        this.logger.error(`Error processing queued request: ${error.message}`);
      }
      
      // Process next request
      setImmediate(() => this.processRequestQueue());
    }
  }
  
  /**
   * Make a request with rate limiting and circuit breaker
   */
  protected async makeRequest<T = any>(
    config: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    // Wrap the request in a circuit breaker
    return this.circuitBreaker.execute(async () => {
      // Check rate limits
      if (this.requestCount <= 0) {
        return new Promise<T>((resolve, reject) => {
          this.requestQueue.push(async () => {
            try {
              const response = await this.axios.request<T>(config);
              resolve(response.data);
            } catch (error) {
              reject(error);
            }
          });
          
          if (!this.rateLimitResetTimer) {
            this.processRequestQueue();
          }
        });
      }
      
      // Make the request if we're under rate limits
      this.requestCount--;
      this.lastRequestTime = Date.now();
      
      const response = await withRetry(
        async () => this.axios.request<T>(config),
        retryOptions
      );
      
      return response.data;
    });
  }
  
  /**
   * Make a GET request with rate limiting and circuit breaker
   */
  protected async get<T = any>(
    url: string, 
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.makeRequest<T>({ ...config, method: 'GET', url }, retryOptions);
  }
  
  /**
   * Make a POST request with rate limiting and circuit breaker
   */
  protected async post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.makeRequest<T>(
      { ...config, method: 'POST', url, data },
      retryOptions
    );
  }
  
  /**
   * Make a PUT request with rate limiting and circuit breaker
   */
  protected async put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.makeRequest<T>(
      { ...config, method: 'PUT', url, data },
      retryOptions
    );
  }
  
  /**
   * Make a DELETE request with rate limiting and circuit breaker
   */
  protected async delete<T = any>(
    url: string,
    config?: AxiosRequestConfig,
    retryOptions?: RetryOptions
  ): Promise<T> {
    return this.makeRequest<T>(
      { ...config, method: 'DELETE', url },
      retryOptions
    );
  }
}
