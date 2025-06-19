import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ExternalApisService {
  private readonly exaApiUrl: string;
  private readonly exaApiKey: string;
  
  private readonly serpApiUrl: string;
  private readonly serpApiKey: string;
  
  private readonly socialSearcherApiKey: string;
  private readonly socialSearcherUrl: string;
  
  private readonly xApiUrl: string;
  private readonly xApiKey: string;
  private readonly xApiSecret: string;
  
  private readonly newsApiUrl: string;
  private readonly newsApiKey: string;
  
  private readonly mediastackApiUrl: string;
  private readonly mediastackApiKey: string;

  constructor(private configService: ConfigService) {
    // Exa API (Web Search)
    this.exaApiUrl = this.configService.get<string>('EXA_API_URL');
    this.exaApiKey = this.configService.get<string>('EXA_API_KEY');
    
    // SERP API (Search Engine Results)
    this.serpApiUrl = this.configService.get<string>('SERP_API_URL');
    this.serpApiKey = this.configService.get<string>('SERP_API_KEY');
    
    // Social Searcher API
    this.socialSearcherUrl = this.configService.get<string>('SOCIAL_SEARCHER_SEARCH_URL');
    this.socialSearcherApiKey = this.configService.get<string>('SOCIAL_SEARCHER_API_KEY');
    
    // Twitter/X API
    this.xApiUrl = this.configService.get<string>('X_API_URL');
    this.xApiKey = this.configService.get<string>('X_API_KEY');
    this.xApiSecret = this.configService.get<string>('X_API_SECRET');
    
    // News API
    this.newsApiUrl = this.configService.get<string>('NEWS_API_URL');
    this.newsApiKey = this.configService.get<string>('NEWS_API_KEY');
    
    // Mediastack API
    this.mediastackApiUrl = this.configService.get<string>('MEDIASTACK_API_URL');
    this.mediastackApiKey = this.configService.get<string>('MEDIASTACK_API_KEY');
  }

  /**
   * Search the web using Exa API
   * @param query Search query
   * @param options Additional search options
   */
  async searchWeb(query: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.get(this.exaApiUrl, {
        params: {
          q: query,
          numResults: options.numResults || 10,
          includeDomains: options.includeDomains || '',
          excludeDomains: options.excludeDomains || '',
          useAutoprompt: options.useAutoprompt || true,
        },
        headers: {
          'x-api-key': this.exaApiKey,
          'Content-Type': 'application/json',
        },
      });
      
      return response.data.results || [];
    } catch (error) {
      console.error('Error searching web with Exa API:', error.message);
      throw new Error(`Failed to search web: ${error.message}`);
    }
  }

  /**
   * Get SERP data using SERP API
   * @param query Search query
   * @param options Additional SERP options
   */
  async getSerpData(query: string, options: any = {}): Promise<any> {
    try {
      // Remove the ?engine=google_trends from the URL and add as a query parameter
      const baseUrl = this.serpApiUrl.split('?')[0];
      
      const response = await axios.get(baseUrl, {
        params: {
          engine: options.engine || 'google_trends',
          q: query,
          api_key: this.serpApiKey,
          gl: options.country || 'us',
          hl: options.language || 'en',
          ...options,
        },
      });
      
      return response.data || {};
    } catch (error) {
      console.error('Error getting SERP data:', error.message);
      throw new Error(`Failed to get SERP data: ${error.message}`);
    }
  }

  /**
   * Search social media using Social Searcher API
   * @param query Search query
   * @param options Additional search options
   */
  async searchSocialMedia(query: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.get(this.socialSearcherUrl, {
        params: {
          q: query,
          key: this.socialSearcherApiKey,
          network: options.network || 'all',
          limit: options.limit || 10,
          type: options.type || 'recent',
          lang: options.language || 'en',
        },
      });
      
      return response.data || {};
    } catch (error) {
      console.error('Error searching social media:', error.message);
      throw new Error(`Failed to search social media: ${error.message}`);
    }
  }

  /**
   * Search Twitter/X using Twitter API v2
   * @param query Search query
   * @param options Additional search options
   */
  async searchTwitter(query: string, options: any = {}): Promise<any> {
    try {
      // First, get a bearer token
      const bearerToken = await this.getTwitterBearerToken();
      
      const response = await axios.get(this.xApiUrl, {
        params: {
          query: query,
          max_results: options.maxResults || 10,
          'tweet.fields': options.tweetFields || 'created_at,author_id,public_metrics',
          expansions: options.expansions || 'author_id',
        },
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      });
      
      return response.data || {};
    } catch (error) {
      console.error('Error searching Twitter/X:', error.message);
      throw new Error(`Failed to search Twitter/X: ${error.message}`);
    }
  }

  /**
   * Get Twitter/X bearer token
   * @private
   */
  private async getTwitterBearerToken(): Promise<string> {
    try {
      const encodedCredentials = Buffer.from(`${this.xApiKey}:${this.xApiSecret}`).toString('base64');
      
      const response = await axios.post('https://api.twitter.com/oauth2/token', 
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${encodedCredentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );
      
      return response.data.access_token;
    } catch (error) {
      console.error('Error getting Twitter/X bearer token:', error.message);
      throw new Error(`Failed to get Twitter/X bearer token: ${error.message}`);
    }
  }

  /**
   * Search news articles using News API
   * @param query Search query
   * @param options Additional search options
   */
  async searchNewsArticles(query: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.get(this.newsApiUrl, {
        params: {
          q: query,
          apiKey: this.newsApiKey,
          pageSize: options.pageSize || 20,
          page: options.page || 1,
          ...options,
        },
      });
      
      return response.data.articles || [];
    } catch (error) {
      console.error('Error searching news articles:', error.message);
      throw new Error(`Failed to search news articles: ${error.message}`);
    }
  }

  /**
   * Search media content using Mediastack API
   * @param query Search query
   * @param options Additional search options
   */
  async searchMediaContent(query: string, options: any = {}): Promise<any> {
    try {
      const response = await axios.get(this.mediastackApiUrl, {
        params: {
          access_key: this.mediastackApiKey,
          keywords: query,
          countries: options.countries || 'us',
          limit: options.limit || 20,
          offset: options.offset || 0,
          sort: options.sort || 'published_desc',
          languages: options.languages || 'en',
        },
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('Error searching media content:', error.message);
      throw new Error(`Failed to search media content: ${error.message}`);
    }
  }

  /**
   * Aggregate news and media content from multiple sources
   * @param topic The topic to search for
   */
  async aggregateNewsAndMedia(topic: string): Promise<any> {
    try {
      // Run searches in parallel
      const [newsResults, mediaResults, socialResults] = await Promise.all([
        this.searchNewsArticles(topic).catch(err => {
          console.warn('News API search failed:', err.message);
          return [];
        }),
        this.searchMediaContent(topic).catch(err => {
          console.warn('Mediastack search failed:', err.message);
          return [];
        }),
        this.searchSocialMedia(topic).catch(err => {
          console.warn('Social Searcher failed:', err.message);
          return [];
        }),
      ]);
      
      // Combine and format results
      return {
        news: newsResults,
        media: mediaResults,
        social: socialResults,
        timestamp: new Date().toISOString(),
        query: topic,
      };
    } catch (error) {
      console.error('Error aggregating news and media content:', error.message);
      throw new Error(`Failed to aggregate content: ${error.message}`);
    }
  }

  /**
   * Get search trend data for a topic
   * @param topic The topic to get trends for
   */
  async getTrendData(topic: string): Promise<any> {
    try {
      const serpData = await this.getSerpData(topic, { 
        engine: 'google_trends',
        data_type: 'TIMESERIES',
        cat: '0', // All categories
      }).catch(err => {
        console.warn('SERP API trends search failed:', err.message);
        return {};
      });
      
      return {
        topic,
        trends: serpData.interest_over_time || [],
        relatedTopics: serpData.related_topics || [],
        relatedQueries: serpData.related_queries || [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting trend data:', error.message);
      throw new Error(`Failed to get trend data: ${error.message}`);
    }
  }

  /**
   * Get citation sources for verification from web search
   * @param topic Topic to find citation sources for
   * @param preferredDomains Array of preferred domain names (e.g., .edu, .gov)
   */
  async getCitationSources(topic: string, preferredDomains: string[] = []): Promise<any> {
    try {
      // Add "research" or "study" to the query for better academic results
      const researchQuery = `${topic} research study data`;
      
      // Use our web search to find relevant sources
      const searchResults = await this.searchWeb(researchQuery, {
        numResults: 15,
        includeDomains: preferredDomains.join(','),
      });
      
      // Process and categorize results
      const sources = searchResults.map(result => ({
        title: result.title,
        url: result.url,
        snippet: result.snippet,
        domain: new URL(result.url).hostname,
        authorityScore: this.calculateAuthorityScore(result.url),
        date: result.published_date || 'Unknown',
      }));
      
      return {
        topic,
        sources,
        preferredDomains,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting citation sources:', error.message);
      throw new Error(`Failed to get citation sources: ${error.message}`);
    }
  }
  
  /**
   * Calculate an authority score for a URL based on domain and other factors
   * @param url The URL to score
   * @private
   */
  private calculateAuthorityScore(url: string): number {
    try {
      const domain = new URL(url).hostname;
      
      // Simple scoring based on TLD
      if (domain.endsWith('.gov')) return 0.9;
      if (domain.endsWith('.edu')) return 0.85;
      if (domain.endsWith('.org')) return 0.7;
      
      // Known authoritative sites
      const authoritativeSites = [
        'nih.gov', 'who.int', 'cdc.gov', 'nasa.gov',
        'harvard.edu', 'stanford.edu', 'mit.edu',
        'nature.com', 'science.org', 'sciencedirect.com',
        'ieee.org', 'acm.org'
      ];
      
      for (const site of authoritativeSites) {
        if (domain.includes(site)) return 0.8;
      }
      
      // Default score between 0.3 and 0.6 based on domain length (shorter is generally better)
      const baseScore = Math.max(0.3, Math.min(0.6, 1 - (domain.length / 30)));
      
      return parseFloat(baseScore.toFixed(2));
    } catch (error) {
      console.warn('Error calculating authority score:', error.message);
      return 0.5; // Default middle score
    }
  }
}
