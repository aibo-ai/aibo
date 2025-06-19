import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from './base-api-client.service';
import { AxiosRequestConfig } from 'axios';

export interface ExaSearchParams {
  query: string;
  numResults?: number;
  startCursor?: string;
  useAutoprompt?: boolean;
  type?: 'keyword' | 'neural';
  highlights?: boolean;
  includeDomains?: string[];
  excludeDomains?: string[];
  startPublishedDate?: string; // ISO format
  endPublishedDate?: string; // ISO format
  maxContentLength?: number;
  minContentLength?: number;
}

export interface ExaSearchResponse {
  results: ExaResult[];
  autopromptString?: string;
  nextCursor?: string;
}

export interface ExaResult {
  title: string;
  url: string;
  publishedDate?: string;
  author?: string;
  text: string;
  highlights?: {
    text: string[];
  };
  score?: number;
}

@Injectable()
export class ExaApiService extends BaseApiClient {
  constructor(private configService: ConfigService) {
    const apiUrl = configService.get<string>('EXA_API_URL');
    const apiKey = configService.get<string>('EXA_API_KEY');
    
    if (!apiUrl || !apiKey) {
      throw new Error('Exa API configuration missing');
    }
    
    super(apiUrl, apiKey, {
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search for content using the Exa API
   * @param params Search parameters
   * @returns Search results
   */
  async search(params: ExaSearchParams): Promise<ExaSearchResponse> {
    try {
      return this.post<ExaSearchResponse>('', params);
    } catch (error) {
      this.logger.error(`Failed to search with Exa: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for recent content about a topic
   * @param topic The topic to search for
   * @param daysBack Number of days to look back
   * @param limit Maximum number of results
   * @returns Recent content about the topic
   */
  async getRecentContent(topic: string, daysBack: number = 30, limit: number = 10): Promise<ExaSearchResponse> {
    const today = new Date();
    const pastDate = new Date();
    pastDate.setDate(today.getDate() - daysBack);
    
    return this.search({
      query: topic,
      numResults: limit,
      startPublishedDate: pastDate.toISOString(),
      endPublishedDate: today.toISOString(),
      highlights: true,
      type: 'neural' // Use neural search for better semantic understanding
    });
  }
}
