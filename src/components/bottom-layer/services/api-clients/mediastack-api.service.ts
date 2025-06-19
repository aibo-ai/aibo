import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from './base-api-client.service';
import { AxiosRequestConfig } from 'axios';

export interface MediastackNewsParams {
  keywords?: string;
  categories?: string;
  countries?: string;
  languages?: string;
  sources?: string;
  limit?: number;
  offset?: number;
  sort?: 'published_desc' | 'published_asc' | 'popularity';
  date?: string; // Format: YYYY-MM-DD or YYYY-MM-DD,YYYY-MM-DD for range
}

export interface MediastackNewsResponse {
  pagination: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
  data: MediastackNewsItem[];
}

export interface MediastackNewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  image?: string;
  category: string;
  language: string;
  country: string;
  published_at: string;
}

@Injectable()
export class MediastackApiService extends BaseApiClient {
  constructor(private configService: ConfigService) {
    const apiUrl = configService.get<string>('MEDIASTACK_API_URL');
    const apiKey = configService.get<string>('MEDIASTACK_API_KEY');
    
    if (!apiUrl || !apiKey) {
      throw new Error('Mediastack API configuration missing');
    }
    
    super(apiUrl, apiKey);
  }

  /**
   * Search for news articles using Mediastack API
   * @param params Search parameters
   * @returns News articles matching the search criteria
   */
  async searchNews(params: MediastackNewsParams): Promise<MediastackNewsResponse> {
    try {
      const config: AxiosRequestConfig = {
        params: {
          access_key: this.apiKey,
          ...params
        }
      };
      
      return this.get<MediastackNewsResponse>('', {}, config);
    } catch (error) {
      this.logger.error(`Failed to search news: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get recent news for a specific topic
   * @param topic The topic to search for
   * @param daysBack Number of days to look back
   * @param limit Maximum number of results
   * @returns Recent news articles for the topic
   */
  async getRecentNews(topic: string, daysBack: number = 7, limit: number = 10): Promise<MediastackNewsResponse> {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - daysBack);
    
    const dateRange = `${pastDate.toISOString().split('T')[0]},${today.toISOString().split('T')[0]}`;
    
    return this.searchNews({
      keywords: topic,
      limit,
      sort: 'published_desc',
      date: dateRange
    });
  }
}
