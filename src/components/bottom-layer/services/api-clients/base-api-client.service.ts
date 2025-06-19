import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

@Injectable()
export class BaseApiClient {
  protected readonly logger = new Logger(this.constructor.name);
  protected readonly client: AxiosInstance;
  protected baseUrl: string;
  protected apiKey: string;

  constructor(baseUrl: string, apiKey: string, config: AxiosRequestConfig = {}) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 30000, // 30 seconds default timeout
      ...config
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use((config) => {
      this.logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
      return config;
    });

    // Add response interceptor for logging
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`API Response: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        if (error.response) {
          this.logger.error(`API Error: ${error.response.status} ${error.response.statusText}`);
          this.logger.error(`Error details: ${JSON.stringify(error.response.data)}`);
        } else if (error.request) {
          this.logger.error('API Error: No response received');
        } else {
          this.logger.error(`API Error: ${error.message}`);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make a GET request to the API
   * @param url The URL to request
   * @param params Query parameters
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  protected async get<T>(url: string, params?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, {
        params,
        ...config
      });
      return response.data;
    } catch (error) {
      this.logger.error(`GET request failed: ${url}`);
      throw error;
    }
  }

  /**
   * Make a POST request to the API
   * @param url The URL to request
   * @param data The data to send
   * @param config Additional Axios config
   * @returns Promise with response data
   */
  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return response.data;
    } catch (error) {
      this.logger.error(`POST request failed: ${url}`);
      throw error;
    }
  }
}
