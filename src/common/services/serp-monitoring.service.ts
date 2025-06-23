import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SerpResult {
  position: number;
  title: string;
  link: string;
  snippet: string;
  displayedLink: string;
  domain: string;
  type: 'organic' | 'ad' | 'featured_snippet' | 'knowledge_panel' | 'local' | 'shopping';
  sitelinks?: Array<{
    title: string;
    link: string;
  }>;
  richSnippet?: {
    type: string;
    data: any;
  };
  thumbnail?: string;
}

export interface SerpSearchRequest {
  query: string;
  location?: string;
  language?: string;
  device?: 'desktop' | 'mobile' | 'tablet';
  searchEngine?: 'google' | 'bing' | 'yahoo';
  num?: number;
  page?: number;
  includeAds?: boolean;
  includeLocal?: boolean;
  includeShopping?: boolean;
}

export interface SerpAnalytics {
  query: string;
  totalResults: number;
  searchEngine: string;
  location: string;
  device: string;
  timestamp: string;
  organicResults: number;
  adResults: number;
  featuredSnippets: number;
  localResults: number;
  shoppingResults: number;
  topDomains: Array<{
    domain: string;
    positions: number[];
    averagePosition: number;
    visibility: number;
  }>;
  competitorAnalysis: Array<{
    competitor: string;
    positions: number[];
    bestPosition: number;
    visibility: number;
    change: number;
  }>;
}

export interface RankingChange {
  keyword: string;
  domain: string;
  previousPosition: number;
  currentPosition: number;
  change: number;
  changeType: 'improvement' | 'decline' | 'new' | 'lost';
  date: string;
}

@Injectable()
export class SerpMonitoringService {
  private readonly logger = new Logger(SerpMonitoringService.name);
  private readonly serpApiClient: AxiosInstance;
  private readonly valueSerpsClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    // Initialize SerpAPI client
    this.serpApiClient = axios.create({
      baseURL: 'https://serpapi.com',
      timeout: 30000,
      params: {
        api_key: this.configService.get<string>('SERPAPI_KEY')
      }
    });

    // Initialize ValueSERP client
    this.valueSerpsClient = axios.create({
      baseURL: 'https://api.valueserp.com',
      timeout: 30000,
      params: {
        api_key: this.configService.get<string>('VALUESERP_API_KEY')
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // SerpAPI interceptors
    this.serpApiClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`SerpAPI Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.serpApiClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`SerpAPI Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('SerpAPI Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    // ValueSERP interceptors
    this.valueSerpsClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`ValueSERP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.valueSerpsClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`ValueSERP Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('ValueSERP Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search SERP results
   */
  async searchSerp(request: SerpSearchRequest): Promise<SerpResult[]> {
    try {
      let results: SerpResult[] = [];

      // Try SerpAPI first
      if (this.configService.get<string>('SERPAPI_KEY')) {
        try {
          results = await this.searchWithSerpAPI(request);
        } catch (error) {
          this.logger.warn('SerpAPI failed, trying ValueSERP:', error.message);
        }
      }

      // Fallback to ValueSERP if SerpAPI failed or not configured
      if (results.length === 0 && this.configService.get<string>('VALUESERP_API_KEY')) {
        results = await this.searchWithValueSERP(request);
      }

      return results;
    } catch (error) {
      this.logger.error('SERP search failed:', error);
      throw new Error(`SERP search failed: ${error.message}`);
    }
  }

  /**
   * Search using SerpAPI
   */
  private async searchWithSerpAPI(request: SerpSearchRequest): Promise<SerpResult[]> {
    const params = {
      engine: request.searchEngine || 'google',
      q: request.query,
      location: request.location,
      hl: request.language || 'en',
      device: request.device || 'desktop',
      num: request.num || 100,
      start: ((request.page || 1) - 1) * (request.num || 100)
    };

    const response = await this.serpApiClient.get('/search', { params });
    
    const results: SerpResult[] = [];
    
    // Process organic results
    if (response.data.organic_results) {
      response.data.organic_results.forEach((result: any, index: number) => {
        results.push(this.mapSerpAPIResult(result, index + 1, 'organic'));
      });
    }

    // Process ads if requested
    if (request.includeAds && response.data.ads) {
      response.data.ads.forEach((ad: any, index: number) => {
        results.push(this.mapSerpAPIResult(ad, index + 1, 'ad'));
      });
    }

    // Process featured snippets
    if (response.data.answer_box) {
      results.unshift(this.mapSerpAPIResult(response.data.answer_box, 0, 'featured_snippet'));
    }

    // Process local results if requested
    if (request.includeLocal && response.data.local_results) {
      response.data.local_results.forEach((local: any, index: number) => {
        results.push(this.mapSerpAPIResult(local, index + 1, 'local'));
      });
    }

    // Process shopping results if requested
    if (request.includeShopping && response.data.shopping_results) {
      response.data.shopping_results.forEach((shopping: any, index: number) => {
        results.push(this.mapSerpAPIResult(shopping, index + 1, 'shopping'));
      });
    }

    return results;
  }

  /**
   * Search using ValueSERP
   */
  private async searchWithValueSERP(request: SerpSearchRequest): Promise<SerpResult[]> {
    const params = {
      search_type: 'web',
      q: request.query,
      location: request.location,
      language: request.language || 'en',
      device: request.device || 'desktop',
      num: request.num || 100,
      page: request.page || 1
    };

    const response = await this.valueSerpsClient.get('/search', { params });
    
    const results: SerpResult[] = [];
    
    // Process organic results
    if (response.data.organic_results) {
      response.data.organic_results.forEach((result: any) => {
        results.push(this.mapValueSERPResult(result, 'organic'));
      });
    }

    return results;
  }

  /**
   * Map SerpAPI result to SerpResult
   */
  private mapSerpAPIResult(result: any, position: number, type: SerpResult['type']): SerpResult {
    return {
      position,
      title: result.title || result.question || '',
      link: result.link || result.url || '',
      snippet: result.snippet || result.answer || '',
      displayedLink: result.displayed_link || result.link || '',
      domain: this.extractDomain(result.link || result.url || ''),
      type,
      sitelinks: result.sitelinks?.map((link: any) => ({
        title: link.title,
        link: link.link
      })),
      richSnippet: result.rich_snippet ? {
        type: result.rich_snippet.type,
        data: result.rich_snippet
      } : undefined,
      thumbnail: result.thumbnail
    };
  }

  /**
   * Map ValueSERP result to SerpResult
   */
  private mapValueSERPResult(result: any, type: SerpResult['type']): SerpResult {
    return {
      position: result.position || 0,
      title: result.title || '',
      link: result.link || '',
      snippet: result.snippet || '',
      displayedLink: result.displayed_link || result.link || '',
      domain: this.extractDomain(result.link || ''),
      type
    };
  }

  /**
   * Monitor keyword rankings for competitors
   */
  async monitorKeywordRankings(
    keywords: string[],
    competitors: string[],
    location?: string,
    device?: 'desktop' | 'mobile'
  ): Promise<{
    rankings: Array<{
      keyword: string;
      results: SerpResult[];
      competitorPositions: Record<string, number>;
    }>;
    analytics: SerpAnalytics[];
    changes: RankingChange[];
  }> {
    try {
      const rankings = [];
      const analytics = [];
      const changes = [];

      for (const keyword of keywords) {
        const results = await this.searchSerp({
          query: keyword,
          location,
          device: device || 'desktop',
          num: 100
        });

        // Find competitor positions
        const competitorPositions: Record<string, number> = {};
        competitors.forEach(competitor => {
          const position = results.findIndex(result => 
            result.domain.toLowerCase().includes(competitor.toLowerCase()) ||
            result.link.toLowerCase().includes(competitor.toLowerCase())
          );
          competitorPositions[competitor] = position >= 0 ? position + 1 : -1;
        });

        rankings.push({
          keyword,
          results,
          competitorPositions
        });

        // Generate analytics
        const keywordAnalytics = this.generateSerpAnalytics(keyword, results, competitors, location, device);
        analytics.push(keywordAnalytics);

        // Check for ranking changes (mock implementation)
        const keywordChanges = await this.detectRankingChanges(keyword, competitorPositions);
        changes.push(...keywordChanges);
      }

      return { rankings, analytics, changes };
    } catch (error) {
      this.logger.error('Keyword ranking monitoring failed:', error);
      throw error;
    }
  }

  /**
   * Generate SERP analytics
   */
  private generateSerpAnalytics(
    query: string,
    results: SerpResult[],
    competitors: string[],
    location?: string,
    device?: string
  ): SerpAnalytics {
    const organicResults = results.filter(r => r.type === 'organic').length;
    const adResults = results.filter(r => r.type === 'ad').length;
    const featuredSnippets = results.filter(r => r.type === 'featured_snippet').length;
    const localResults = results.filter(r => r.type === 'local').length;
    const shoppingResults = results.filter(r => r.type === 'shopping').length;

    // Calculate domain visibility
    const domainMap = new Map();
    results.forEach(result => {
      if (result.type === 'organic') {
        if (!domainMap.has(result.domain)) {
          domainMap.set(result.domain, []);
        }
        domainMap.get(result.domain).push(result.position);
      }
    });

    const topDomains = Array.from(domainMap.entries())
      .map(([domain, positions]) => ({
        domain,
        positions,
        averagePosition: positions.reduce((sum: number, pos: number) => sum + pos, 0) / positions.length,
        visibility: this.calculateVisibility(positions)
      }))
      .sort((a, b) => b.visibility - a.visibility)
      .slice(0, 10);

    // Analyze competitors
    const competitorAnalysis = competitors.map(competitor => {
      const competitorResults = results.filter(result => 
        result.domain.toLowerCase().includes(competitor.toLowerCase()) ||
        result.link.toLowerCase().includes(competitor.toLowerCase())
      );
      
      const positions = competitorResults.map(r => r.position);
      
      return {
        competitor,
        positions,
        bestPosition: positions.length > 0 ? Math.min(...positions) : -1,
        visibility: this.calculateVisibility(positions),
        change: 0 // Would be calculated from historical data
      };
    });

    return {
      query,
      totalResults: results.length,
      searchEngine: 'google',
      location: location || 'global',
      device: device || 'desktop',
      timestamp: new Date().toISOString(),
      organicResults,
      adResults,
      featuredSnippets,
      localResults,
      shoppingResults,
      topDomains,
      competitorAnalysis
    };
  }

  /**
   * Calculate visibility score based on positions
   */
  private calculateVisibility(positions: number[]): number {
    if (positions.length === 0) return 0;
    
    // CTR-based visibility calculation
    const ctrMap = {
      1: 0.284, 2: 0.147, 3: 0.103, 4: 0.073, 5: 0.053,
      6: 0.040, 7: 0.031, 8: 0.025, 9: 0.020, 10: 0.016
    };
    
    return positions.reduce((sum, pos) => {
      const ctr = ctrMap[pos as keyof typeof ctrMap] || (pos <= 20 ? 0.01 : 0.005);
      return sum + ctr;
    }, 0);
  }

  /**
   * Detect ranking changes (mock implementation)
   */
  private async detectRankingChanges(keyword: string, currentPositions: Record<string, number>): Promise<RankingChange[]> {
    // In a real implementation, this would compare with historical data
    const changes: RankingChange[] = [];
    
    // Mock some changes for demonstration
    Object.entries(currentPositions).forEach(([competitor, position]) => {
      if (position > 0 && Math.random() > 0.7) { // 30% chance of change
        const previousPosition = position + Math.floor(Math.random() * 10 - 5);
        const change = previousPosition - position;
        
        changes.push({
          keyword,
          domain: competitor,
          previousPosition,
          currentPosition: position,
          change,
          changeType: change > 0 ? 'improvement' : change < 0 ? 'decline' : 'new',
          date: new Date().toISOString()
        });
      }
    });
    
    return changes;
  }

  /**
   * Track SERP features for a keyword
   */
  async trackSerpFeatures(keyword: string, location?: string): Promise<{
    features: Array<{
      type: string;
      present: boolean;
      content?: any;
    }>;
    competitorFeatures: Array<{
      competitor: string;
      features: string[];
    }>;
  }> {
    try {
      const results = await this.searchSerp({
        query: keyword,
        location,
        includeAds: true,
        includeLocal: true,
        includeShopping: true
      });

      const features = [
        {
          type: 'featured_snippet',
          present: results.some(r => r.type === 'featured_snippet'),
          content: results.find(r => r.type === 'featured_snippet')
        },
        {
          type: 'local_pack',
          present: results.some(r => r.type === 'local'),
          content: results.filter(r => r.type === 'local')
        },
        {
          type: 'shopping_results',
          present: results.some(r => r.type === 'shopping'),
          content: results.filter(r => r.type === 'shopping')
        },
        {
          type: 'ads',
          present: results.some(r => r.type === 'ad'),
          content: results.filter(r => r.type === 'ad')
        },
        {
          type: 'sitelinks',
          present: results.some(r => r.sitelinks && r.sitelinks.length > 0),
          content: results.filter(r => r.sitelinks && r.sitelinks.length > 0)
        }
      ];

      // Analyze competitor features
      const competitorMap = new Map();
      results.forEach(result => {
        if (!competitorMap.has(result.domain)) {
          competitorMap.set(result.domain, new Set());
        }
        
        const featureSet = competitorMap.get(result.domain);
        featureSet.add(result.type);
        
        if (result.sitelinks && result.sitelinks.length > 0) {
          featureSet.add('sitelinks');
        }
        if (result.richSnippet) {
          featureSet.add('rich_snippet');
        }
      });

      const competitorFeatures = Array.from(competitorMap.entries())
        .map(([competitor, features]) => ({
          competitor,
          features: Array.from(features)
        }))
        .slice(0, 10);

      return { features, competitorFeatures };
    } catch (error) {
      this.logger.error('SERP features tracking failed:', error);
      throw error;
    }
  }

  // Helper methods
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'unknown';
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple search
      const results = await this.searchSerp({
        query: 'test',
        num: 1
      });
      
      return results.length >= 0; // Even 0 results is a successful response
    } catch (error) {
      this.logger.error('SERP monitoring health check failed:', error);
      return false;
    }
  }
}
