import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as crypto from 'crypto';

export interface MozUrlMetrics {
  url: string;
  domainAuthority: number;
  pageAuthority: number;
  spamScore: number;
  linkingRootDomains: number;
  totalLinks: number;
  mozRank: number;
  mozTrust: number;
  title?: string;
  lastCrawled?: string;
}

export interface MozKeywordDifficulty {
  keyword: string;
  difficulty: number;
  volume: number;
  opportunity: number;
  potential: number;
  location?: string;
}

export interface MozCompetitorAnalysis {
  domain: string;
  competitors: Array<{
    domain: string;
    domainAuthority: number;
    commonKeywords: number;
    overlapScore: number;
  }>;
}

export interface MozSeoAnalysisRequest {
  websiteUrl: string;
  name: string;
  location?: string;
  targetAudience?: string;
  keywords?: string[];
  competitors?: string[];
}

export interface MozSeoAnalysisResult {
  website: {
    url: string;
    name: string;
    metrics: MozUrlMetrics;
  };
  keywords: {
    primary: MozKeywordDifficulty[];
    opportunities: MozKeywordDifficulty[];
    competitive: MozKeywordDifficulty[];
  };
  competitors: MozCompetitorAnalysis[];
  recommendations: {
    technical: string[];
    content: string[];
    linkBuilding: string[];
    keywords: string[];
  };
  scores: {
    overall: number;
    technical: number;
    content: number;
    authority: number;
  };
}

@Injectable()
export class MozSeoService {
  private readonly logger = new Logger(MozSeoService.name);
  private readonly client: AxiosInstance;
  private readonly accessId: string;
  private readonly secretKey: string;

  constructor(private configService: ConfigService) {
    this.accessId = this.configService.get<string>('MOZ_ACCESS_ID');
    this.secretKey = this.configService.get<string>('MOZ_SECRET_KEY');
    
    this.client = axios.create({
      baseURL: 'https://lsapi.seomoz.com/v2',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ContentArchitect/1.0'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.client.interceptors.request.use(
      (config) => {
        // Add MOZ authentication
        const timestamp = Math.floor(Date.now() / 1000);
        const stringToSign = `${this.accessId}\n${timestamp}`;
        const signature = crypto
          .createHmac('sha1', this.secretKey)
          .update(stringToSign)
          .digest('base64');

        config.headers['Authorization'] = `Basic ${Buffer.from(`${this.accessId}:${signature}`).toString('base64')}`;
        config.headers['X-Moz-Date'] = timestamp.toString();
        
        this.logger.debug(`MOZ API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('MOZ API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`MOZ API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('MOZ API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get URL metrics including Domain Authority, Page Authority, etc.
   */
  async getUrlMetrics(url: string): Promise<MozUrlMetrics> {
    try {
      this.logger.log(`Getting URL metrics for: ${url}`);

      const response = await this.client.post('/url_metrics', {
        targets: [url]
      });

      const data = response.data.results?.[0];
      if (!data) {
        throw new Error('No metrics data received from MOZ');
      }

      return {
        url: data.page || url,
        domainAuthority: data.domain_authority || 0,
        pageAuthority: data.page_authority || 0,
        spamScore: data.spam_score || 0,
        linkingRootDomains: data.linking_root_domains || 0,
        totalLinks: data.external_links || 0,
        mozRank: data.page_rank || 0,
        mozTrust: data.trust_rank || 0,
        title: data.title,
        lastCrawled: data.last_crawled
      };
    } catch (error) {
      this.logger.error(`Failed to get URL metrics for ${url}:`, error);
      throw error;
    }
  }

  /**
   * Get keyword difficulty and search volume data
   */
  async getKeywordDifficulty(keywords: string[], location = 'US'): Promise<MozKeywordDifficulty[]> {
    try {
      this.logger.log(`Getting keyword difficulty for ${keywords.length} keywords`);

      const response = await this.client.post('/keyword_difficulty', {
        keywords: keywords.map(keyword => ({ keyword, location }))
      });

      return response.data.results?.map((result: any) => ({
        keyword: result.keyword,
        difficulty: result.difficulty || 0,
        volume: result.volume || 0,
        opportunity: result.opportunity || 0,
        potential: result.potential || 0,
        location: result.location || location
      })) || [];
    } catch (error) {
      this.logger.error(`Failed to get keyword difficulty:`, error);
      throw error;
    }
  }

  /**
   * Get competitor analysis
   */
  async getCompetitorAnalysis(domain: string): Promise<MozCompetitorAnalysis> {
    try {
      this.logger.log(`Getting competitor analysis for: ${domain}`);

      const response = await this.client.post('/competitor_metrics', {
        site: domain,
        limit: 10
      });

      const competitors = response.data.results?.map((competitor: any) => ({
        domain: competitor.site,
        domainAuthority: competitor.domain_authority || 0,
        commonKeywords: competitor.common_keywords || 0,
        overlapScore: competitor.overlap_score || 0
      })) || [];

      return {
        domain,
        competitors
      };
    } catch (error) {
      this.logger.error(`Failed to get competitor analysis for ${domain}:`, error);
      throw error;
    }
  }

  /**
   * Perform comprehensive SEO analysis
   */
  async performSeoAnalysis(request: MozSeoAnalysisRequest): Promise<MozSeoAnalysisResult> {
    try {
      this.logger.log(`Performing SEO analysis for: ${request.websiteUrl}`);

      // Get website metrics
      const websiteMetrics = await this.getUrlMetrics(request.websiteUrl);

      // Get keyword analysis if keywords provided
      let keywordAnalysis = {
        primary: [] as MozKeywordDifficulty[],
        opportunities: [] as MozKeywordDifficulty[],
        competitive: [] as MozKeywordDifficulty[]
      };

      if (request.keywords && request.keywords.length > 0) {
        const keywordDifficulties = await this.getKeywordDifficulty(request.keywords, request.location);
        
        // Categorize keywords
        keywordAnalysis.primary = keywordDifficulties.filter(k => k.difficulty <= 30);
        keywordAnalysis.opportunities = keywordDifficulties.filter(k => k.difficulty > 30 && k.difficulty <= 60);
        keywordAnalysis.competitive = keywordDifficulties.filter(k => k.difficulty > 60);
      }

      // Get competitor analysis
      let competitorAnalysis: MozCompetitorAnalysis[] = [];
      if (request.competitors && request.competitors.length > 0) {
        competitorAnalysis = await Promise.all(
          request.competitors.map(competitor => this.getCompetitorAnalysis(competitor))
        );
      }

      // Generate recommendations
      const recommendations = this.generateRecommendations(websiteMetrics, keywordAnalysis, competitorAnalysis);

      // Calculate scores
      const scores = this.calculateScores(websiteMetrics, keywordAnalysis, competitorAnalysis);

      return {
        website: {
          url: request.websiteUrl,
          name: request.name,
          metrics: websiteMetrics
        },
        keywords: keywordAnalysis,
        competitors: competitorAnalysis,
        recommendations,
        scores
      };
    } catch (error) {
      this.logger.error(`SEO analysis failed for ${request.websiteUrl}:`, error);
      throw error;
    }
  }

  /**
   * Generate SEO recommendations based on analysis
   */
  private generateRecommendations(
    metrics: MozUrlMetrics,
    keywords: any,
    competitors: MozCompetitorAnalysis[]
  ) {
    const recommendations = {
      technical: [] as string[],
      content: [] as string[],
      linkBuilding: [] as string[],
      keywords: [] as string[]
    };

    // Technical recommendations
    if (metrics.domainAuthority < 30) {
      recommendations.technical.push('Focus on building domain authority through quality content and backlinks');
    }
    if (metrics.spamScore > 5) {
      recommendations.technical.push('Review and clean up potentially spammy backlinks');
    }
    if (metrics.pageAuthority < 20) {
      recommendations.technical.push('Optimize on-page SEO elements and internal linking');
    }

    // Content recommendations
    if (keywords.primary.length > 0) {
      recommendations.content.push(`Target ${keywords.primary.length} low-difficulty keywords for quick wins`);
    }
    if (keywords.opportunities.length > 0) {
      recommendations.content.push(`Create comprehensive content for ${keywords.opportunities.length} medium-difficulty keywords`);
    }

    // Link building recommendations
    if (metrics.linkingRootDomains < 50) {
      recommendations.linkBuilding.push('Increase the number of linking root domains through outreach');
    }
    if (competitors.length > 0) {
      const avgCompetitorDA = competitors.reduce((sum, comp) => 
        sum + comp.competitors.reduce((s, c) => s + c.domainAuthority, 0) / comp.competitors.length, 0
      ) / competitors.length;
      
      if (metrics.domainAuthority < avgCompetitorDA) {
        recommendations.linkBuilding.push('Competitor analysis shows opportunity to improve domain authority');
      }
    }

    // Keyword recommendations
    if (keywords.competitive.length > 0) {
      recommendations.keywords.push(`Consider long-tail variations for ${keywords.competitive.length} high-difficulty keywords`);
    }

    return recommendations;
  }

  /**
   * Calculate overall SEO scores
   */
  private calculateScores(
    metrics: MozUrlMetrics,
    keywords: any,
    competitors: MozCompetitorAnalysis[]
  ) {
    // Technical score (0-100)
    const technical = Math.min(100, (metrics.domainAuthority + metrics.pageAuthority) / 2);

    // Content score based on keyword opportunities
    const totalKeywords = keywords.primary.length + keywords.opportunities.length + keywords.competitive.length;
    const content = totalKeywords > 0 ? 
      Math.min(100, (keywords.primary.length * 3 + keywords.opportunities.length * 2 + keywords.competitive.length) / totalKeywords * 25) : 50;

    // Authority score
    const authority = Math.min(100, metrics.domainAuthority + (metrics.linkingRootDomains / 10));

    // Overall score
    const overall = (technical * 0.4 + content * 0.3 + authority * 0.3);

    return {
      overall: Math.round(overall),
      technical: Math.round(technical),
      content: Math.round(content),
      authority: Math.round(authority)
    };
  }

  /**
   * Health check for MOZ API
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple URL metrics call
      await this.getUrlMetrics('https://example.com');
      return true;
    } catch (error) {
      this.logger.error('MOZ health check failed:', error);
      return false;
    }
  }
}
