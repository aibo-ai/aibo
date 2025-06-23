import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface ExaSearchRequest {
  query: string;
  type?: 'search' | 'neural' | 'keyword';
  useAutoprompt?: boolean;
  numResults?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
  startCrawlDate?: string;
  endCrawlDate?: string;
  startPublishedDate?: string;
  endPublishedDate?: string;
  includeText?: boolean;
  includeHighlights?: boolean;
  includeSummary?: boolean;
  category?: string;
  subpages?: number;
}

export interface ExaSearchResult {
  id: string;
  url: string;
  title: string;
  score: number;
  publishedDate?: string;
  author?: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
  requestId: string;
}

@Injectable()
export class ExaApiService {
  private readonly logger = new Logger(ExaApiService.name);
  private readonly client: AxiosInstance;
  private readonly apiKey: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('EXA_API_KEY');
    
    if (!this.apiKey) {
      this.logger.warn('Exa API key not configured');
    }

    this.client = axios.create({
      baseURL: 'https://api.exa.ai',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    // Add request/response interceptors for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`Exa API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Exa API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Exa API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('Exa API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Perform neural search using Exa
   */
  async search(request: ExaSearchRequest): Promise<ExaSearchResponse> {
    if (!this.apiKey) {
      throw new Error('Exa API key not configured');
    }

    try {
      const response = await this.client.post('/search', {
        query: request.query,
        type: request.type || 'neural',
        useAutoprompt: request.useAutoprompt || false,
        numResults: request.numResults || 10,
        includeDomains: request.includeDomains,
        excludeDomains: request.excludeDomains,
        startCrawlDate: request.startCrawlDate,
        endCrawlDate: request.endCrawlDate,
        startPublishedDate: request.startPublishedDate,
        endPublishedDate: request.endPublishedDate,
        includeText: request.includeText || false,
        includeHighlights: request.includeHighlights || false,
        includeSummary: request.includeSummary || false,
        category: request.category,
        subpages: request.subpages
      });

      return response.data;
    } catch (error) {
      this.logger.error('Exa search failed:', error);
      throw new Error(`Exa search failed: ${error.message}`);
    }
  }

  /**
   * Get content for specific URLs
   */
  async getContents(urls: string[], includeText = true, includeHighlights = false): Promise<ExaSearchResult[]> {
    if (!this.apiKey) {
      throw new Error('Exa API key not configured');
    }

    try {
      const response = await this.client.post('/contents', {
        ids: urls,
        text: includeText,
        highlights: includeHighlights
      });

      return response.data.results;
    } catch (error) {
      this.logger.error('Exa get contents failed:', error);
      throw new Error(`Exa get contents failed: ${error.message}`);
    }
  }

  /**
   * Find similar content to a given URL
   */
  async findSimilar(url: string, numResults = 10, includeDomains?: string[]): Promise<ExaSearchResponse> {
    if (!this.apiKey) {
      throw new Error('Exa API key not configured');
    }

    try {
      const response = await this.client.post('/findSimilar', {
        url,
        numResults,
        includeDomains
      });

      return response.data;
    } catch (error) {
      this.logger.error('Exa find similar failed:', error);
      throw new Error(`Exa find similar failed: ${error.message}`);
    }
  }

  /**
   * Search for competitor information
   */
  async searchCompetitorInfo(competitorName: string, includeText = true): Promise<ExaSearchResult[]> {
    try {
      const searchRequest: ExaSearchRequest = {
        query: `${competitorName} company information products services revenue market share`,
        type: 'neural',
        numResults: 20,
        includeText,
        includeSummary: true,
        includeHighlights: true,
        startPublishedDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Last year
        excludeDomains: ['wikipedia.org', 'linkedin.com'] // Exclude common but less useful domains
      };

      const response = await this.search(searchRequest);
      return response.results;
    } catch (error) {
      this.logger.error(`Failed to search competitor info for ${competitorName}:`, error);
      throw error;
    }
  }

  /**
   * Search for industry trends and insights
   */
  async searchIndustryTrends(industry: string, timeframe = '6m'): Promise<ExaSearchResult[]> {
    try {
      const startDate = new Date();
      if (timeframe === '6m') {
        startDate.setMonth(startDate.getMonth() - 6);
      } else if (timeframe === '1y') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      } else if (timeframe === '3m') {
        startDate.setMonth(startDate.getMonth() - 3);
      }

      const searchRequest: ExaSearchRequest = {
        query: `${industry} industry trends market analysis insights 2024`,
        type: 'neural',
        numResults: 15,
        includeText: true,
        includeSummary: true,
        startPublishedDate: startDate.toISOString(),
        includeDomains: [
          'mckinsey.com',
          'bcg.com',
          'deloitte.com',
          'pwc.com',
          'forrester.com',
          'gartner.com',
          'bloomberg.com',
          'reuters.com'
        ]
      };

      const response = await this.search(searchRequest);
      return response.results;
    } catch (error) {
      this.logger.error(`Failed to search industry trends for ${industry}:`, error);
      throw error;
    }
  }

  /**
   * Search for product information and reviews
   */
  async searchProductInfo(productName: string, competitorName?: string): Promise<ExaSearchResult[]> {
    try {
      const query = competitorName 
        ? `${productName} ${competitorName} product review specifications features pricing`
        : `${productName} product review specifications features pricing`;

      const searchRequest: ExaSearchRequest = {
        query,
        type: 'neural',
        numResults: 15,
        includeText: true,
        includeSummary: true,
        includeHighlights: true,
        startPublishedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // Last 6 months
        includeDomains: [
          'amazon.com',
          'bestbuy.com',
          'target.com',
          'walmart.com',
          'wayfair.com',
          'overstock.com'
        ]
      };

      const response = await this.search(searchRequest);
      return response.results;
    } catch (error) {
      this.logger.error(`Failed to search product info for ${productName}:`, error);
      throw error;
    }
  }

  /**
   * Search for news and press releases
   */
  async searchNews(query: string, timeframe = '30d'): Promise<ExaSearchResult[]> {
    try {
      const startDate = new Date();
      if (timeframe === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      } else if (timeframe === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === '90d') {
        startDate.setDate(startDate.getDate() - 90);
      }

      const searchRequest: ExaSearchRequest = {
        query: `${query} news press release announcement`,
        type: 'neural',
        numResults: 20,
        includeText: true,
        includeSummary: true,
        startPublishedDate: startDate.toISOString(),
        includeDomains: [
          'reuters.com',
          'bloomberg.com',
          'wsj.com',
          'ft.com',
          'cnbc.com',
          'businesswire.com',
          'prnewswire.com',
          'marketwatch.com'
        ]
      };

      const response = await this.search(searchRequest);
      return response.results;
    } catch (error) {
      this.logger.error(`Failed to search news for ${query}:`, error);
      throw error;
    }
  }

  /**
   * Search for research papers and whitepapers
   */
  async searchResearch(topic: string): Promise<ExaSearchResult[]> {
    try {
      const searchRequest: ExaSearchRequest = {
        query: `${topic} research paper whitepaper study analysis report`,
        type: 'neural',
        numResults: 10,
        includeText: true,
        includeSummary: true,
        startPublishedDate: new Date(Date.now() - 730 * 24 * 60 * 60 * 1000).toISOString(), // Last 2 years
        includeDomains: [
          'arxiv.org',
          'researchgate.net',
          'ieee.org',
          'acm.org',
          'springer.com',
          'sciencedirect.com',
          'jstor.org'
        ]
      };

      const response = await this.search(searchRequest);
      return response.results;
    } catch (error) {
      this.logger.error(`Failed to search research for ${topic}:`, error);
      throw error;
    }
  }

  /**
   * Health check for Exa API
   */
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) {
      return false;
    }

    try {
      const response = await this.search({
        query: 'test query',
        numResults: 1
      });
      
      return response.results.length >= 0; // Even 0 results is a successful response
    } catch (error) {
      this.logger.error('Exa API health check failed:', error);
      return false;
    }
  }
}
