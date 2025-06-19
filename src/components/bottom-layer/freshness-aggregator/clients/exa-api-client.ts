import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * Exa API search result interface
 */
interface ExaSearchResult {
  id: string;
  url: string;
  title: string;
  text?: string;
  score?: number;
  published_date?: string;
  author?: string;
}

/**
 * Exa API response interface
 */
interface ExaApiResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

/**
 * Standardized web search result interface
 */
export interface WebSearchResult {
  id: string;
  title: string;
  description?: string;
  content?: string;
  url: string;
  source: string;
  domain: string;
  snippet?: string;
  publishedDate: string;
  relevanceScore: number;
  contentType?: string;
  rank?: number;
}

/**
 * Exa API search options
 */
export interface ExaSearchOptions {
  numResults?: number;
  startCursor?: string;
  includeDomains?: string[];
  excludeDomains?: string[];
  daysAgo?: number;
  language?: string;
  startPublishedDate?: string;
}

/**
 * Exa API client service
 */
@Injectable()
export class ExaApiClient {
  private readonly logger = new Logger(ExaApiClient.name);
  private readonly httpClient: AxiosInstance;
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.exa.ai';

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('EXA_API_KEY') || '';
    
    this.httpClient = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Search for content using Exa API
   * @param query Search query
   * @param options Search options
   * @returns Array of web search results
   */
  async searchContent(query: string, options: ExaSearchOptions = {}): Promise<WebSearchResult[]> {
    try {
      if (!this.apiKey) {
        throw new Error('Exa API key not configured');
      }

      const requestBody = {
        query,
        numResults: options.numResults || 10,
        ...(options.startCursor && { startCursor: options.startCursor }),
        ...(options.includeDomains && { includeDomains: options.includeDomains }),
        ...(options.excludeDomains && { excludeDomains: options.excludeDomains }),
        ...(options.daysAgo && { daysAgo: options.daysAgo }),
        ...(options.language && { language: options.language }),
        ...(options.startPublishedDate && { startPublishedDate: options.startPublishedDate })
      };

      const response = await this.httpClient.post<ExaApiResponse>('/search', requestBody);
      
      return this.mapResults(response.data.results || []);
    } catch (error) {
      this.logger.error(`Error searching with Exa API: ${error.message}`);
      throw error;
    }
  }

  /**
   * Map Exa API results to standardized format
   * @param results Raw Exa API results
   * @returns Standardized web search results
   */
  private mapResults(results: ExaSearchResult[]): WebSearchResult[] {
    return results.map((result, index) => {
      let publishedDate = new Date();
      
      if (result.published_date) {
        try {
          publishedDate = new Date(result.published_date);
        } catch (e) {
          this.logger.warn(`Failed to parse date: ${result.published_date}`);
        }
      }

      return {
        id: `exa_${Date.now()}_${index}`,
        title: result.title,
        description: result.text || undefined,
        content: result.text || undefined,
        url: result.url,
        source: this.extractDomain(result.url),
        domain: this.extractDomain(result.url),
        snippet: result.text?.substring(0, 200) || undefined,
        publishedDate: publishedDate.toISOString(),
        relevanceScore: result.score || 0.5,
        contentType: 'article',
        rank: index + 1
      };
    });
  }

  /**
   * Extract domain from URL
   * @param url URL to extract domain from
   * @returns Domain name
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }
}
