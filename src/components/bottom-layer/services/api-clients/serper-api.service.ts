import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BaseApiClient } from './base-api-client.service';
import { AxiosRequestConfig } from 'axios';

export interface SerperSearchParams {
  q: string;
  gl?: string; // Country code (e.g., "us")
  hl?: string; // Language (e.g., "en")
  num?: number; // Number of results (default: 10, max: 100)
  page?: number; // Page number (default: 1)
  type?: 'search' | 'news' | 'places' | 'images' | 'shopping'; // Search type
  tbs?: string; // Time-based search (e.g., "qdr:d1" for past 24 hours)
}

export interface SerperSearchResult {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
    num: number;
    type: string;
    page: number;
  };
  organic: SerperOrganicResult[];
  news?: SerperNewsResult[];
  knowledgeGraph?: any;
  relatedSearches?: string[];
  peopleAlsoAsk?: string[];
  pagination?: {
    currentPage: number;
    nextPage?: number;
  };
}

export interface SerperOrganicResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  date?: string;
  sitelinks?: {
    title: string;
    link: string;
    snippet?: string;
  }[];
}

export interface SerperNewsResult {
  title: string;
  link: string;
  snippet: string;
  date: string;
  source: string;
  imageUrl?: string;
  position: number;
}

@Injectable()
export class SerperApiService extends BaseApiClient {
  constructor(private configService: ConfigService) {
    const apiUrl = configService.get<string>('SERPER_API_URL');
    const apiKey = configService.get<string>('SERPER_API_KEY');
    
    if (!apiUrl || !apiKey) {
      throw new Error('Serper API configuration missing');
    }
    
    super(apiUrl, apiKey, {
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Perform a search using the Serper API
   * @param params Search parameters
   * @returns Search results
   */
  async search(params: SerperSearchParams): Promise<SerperSearchResult> {
    try {
      return this.post<SerperSearchResult>('', params);
    } catch (error) {
      this.logger.error(`Failed to perform search: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for recent content about a topic
   * @param topic The topic to search for
   * @param timeframe Time-based search parameter
   * @param resultType Type of results to return
   * @param limit Number of results to return
   * @returns Recent search results for the topic
   */
  async searchRecent(
    topic: string, 
    timeframe: 'd1' | 'w1' | 'm1' | 'y1' = 'w1', 
    resultType: 'search' | 'news' = 'search',
    limit: number = 10
  ): Promise<SerperSearchResult> {
    return this.search({
      q: topic,
      tbs: `qdr:${timeframe}`, // d1 = past 24h, w1 = past week, m1 = past month, y1 = past year
      type: resultType,
      num: limit
    });
  }

  /**
   * Get recent news about a topic
   * @param topic The topic to search for
   * @param daysBack How many days back to search
   * @param limit Number of results to return
   * @returns Recent news about the topic
   */
  async getRecentNews(topic: string, daysBack: number = 7, limit: number = 10): Promise<SerperSearchResult> {
    // Map days back to appropriate timeframe parameter
    let timeframe: 'd1' | 'w1' | 'm1' | 'y1';
    if (daysBack <= 1) timeframe = 'd1';
    else if (daysBack <= 7) timeframe = 'w1';
    else if (daysBack <= 30) timeframe = 'm1';
    else timeframe = 'y1';
    
    return this.searchRecent(topic, timeframe, 'news', limit);
  }
}
