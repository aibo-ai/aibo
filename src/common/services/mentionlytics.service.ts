import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface MentionlyticsSearchRequest {
  keyword: string;
  platforms?: string[];
  languages?: string[];
  countries?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  sentimentFilter?: 'positive' | 'negative' | 'neutral';
  includeInfluencers?: boolean;
}

export interface MentionlyticsMention {
  id: string;
  platform: string;
  content: string;
  author: {
    name: string;
    username: string;
    followers: number;
    verified: boolean;
    profileUrl: string;
  };
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
    retweets?: number;
  };
  mentions: string[];
  hashtags: string[];
  language: string;
  location?: {
    country: string;
    city?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  reach: number;
  influence: number;
  mediaUrls?: string[];
}

export interface MentionlyticsAnalytics {
  totalMentions: number;
  timeRange: {
    start: string;
    end: string;
  };
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  platformBreakdown: Record<string, number>;
  languageBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  engagementMetrics: {
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    totalViews: number;
    averageEngagement: number;
    totalReach: number;
  };
  topInfluencers: Array<{
    author: string;
    username: string;
    platform: string;
    followers: number;
    mentions: number;
    avgSentiment: number;
    totalReach: number;
    verified: boolean;
  }>;
  trendingHashtags: Array<{
    hashtag: string;
    count: number;
    sentiment: number;
  }>;
  keywordClusters: Array<{
    cluster: string;
    keywords: string[];
    count: number;
    sentiment: number;
  }>;
  viralContent: Array<{
    id: string;
    content: string;
    platform: string;
    engagement: number;
    reach: number;
    url: string;
  }>;
}

export interface MentionlyticsCompetitorAnalysis {
  competitor: string;
  timeframe: string;
  mentions: MentionlyticsMention[];
  analytics: MentionlyticsAnalytics;
  competitiveInsights: {
    shareOfVoice: number;
    sentimentComparison: {
      competitor: number;
      industry: number;
    };
    engagementComparison: {
      competitor: number;
      industry: number;
    };
    topCompetingKeywords: string[];
    opportunityKeywords: string[];
    threatKeywords: string[];
  };
  alerts: Array<{
    type: 'spike' | 'sentiment_drop' | 'viral_content' | 'influencer_mention';
    message: string;
    severity: 'low' | 'medium' | 'high';
    timestamp: string;
    data?: any;
  }>;
}

@Injectable()
export class MentionlyticsService {
  private readonly logger = new Logger(MentionlyticsService.name);
  private readonly client: AxiosInstance;
  private readonly apiToken: string;

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get<string>('MENTIONLYTICS_API_TOKEN');
    
    this.client = axios.create({
      baseURL: this.configService.get<string>('MENTIONLYTICS_API_URL'),
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
        // Add token to all requests
        config.params = {
          ...config.params,
          token: this.apiToken
        };
        
        this.logger.debug(`Mentionlytics API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Mentionlytics API Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`Mentionlytics API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        this.logger.error('Mentionlytics API Response Error:', {
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
   * Search for mentions using Mentionlytics API
   */
  async searchMentions(request: MentionlyticsSearchRequest): Promise<MentionlyticsMention[]> {
    try {
      this.logger.log(`Searching mentions for keyword: ${request.keyword}`);

      const params = {
        q: request.keyword,
        platforms: request.platforms?.join(','),
        languages: request.languages?.join(','),
        countries: request.countries?.join(','),
        start_date: request.startDate,
        end_date: request.endDate,
        limit: request.limit || 100,
        sentiment: request.sentimentFilter,
        include_influencers: request.includeInfluencers || true
      };

      const response = await this.client.get('', { params });
      
      if (response.data && response.data.mentions) {
        return this.transformMentions(response.data.mentions);
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to search mentions for ${request.keyword}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific keyword or brand
   */
  async getAnalytics(
    keyword: string,
    startDate?: string,
    endDate?: string,
    platforms?: string[]
  ): Promise<MentionlyticsAnalytics> {
    try {
      this.logger.log(`Getting analytics for keyword: ${keyword}`);

      const params = {
        q: keyword,
        start_date: startDate,
        end_date: endDate,
        platforms: platforms?.join(','),
        analytics: true
      };

      const response = await this.client.get('/analytics', { params });
      
      if (response.data) {
        return this.transformAnalytics(response.data);
      }

      throw new Error('No analytics data received');
    } catch (error) {
      this.logger.error(`Failed to get analytics for ${keyword}:`, error);
      throw error;
    }
  }

  /**
   * Perform comprehensive competitor analysis
   */
  async analyzeCompetitor(
    competitor: string,
    timeframe = '7d',
    includeIndustryComparison = true
  ): Promise<MentionlyticsCompetitorAnalysis> {
    try {
      this.logger.log(`Analyzing competitor: ${competitor}`);

      const endDate = new Date().toISOString().split('T')[0];
      const startDate = this.calculateStartDate(timeframe);

      // Get mentions and analytics in parallel
      const [mentions, analytics] = await Promise.all([
        this.searchMentions({
          keyword: competitor,
          startDate,
          endDate,
          limit: 500,
          includeInfluencers: true
        }),
        this.getAnalytics(competitor, startDate, endDate)
      ]);

      // Generate competitive insights
      const competitiveInsights = await this.generateCompetitiveInsights(
        competitor,
        mentions,
        analytics,
        includeIndustryComparison
      );

      // Generate alerts
      const alerts = this.generateAlerts(mentions, analytics);

      return {
        competitor,
        timeframe,
        mentions,
        analytics,
        competitiveInsights,
        alerts
      };
    } catch (error) {
      this.logger.error(`Failed to analyze competitor ${competitor}:`, error);
      throw error;
    }
  }

  /**
   * Health check for Mentionlytics API
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', {
        timeout: 5000,
        params: { token: this.apiToken }
      });
      return response.status === 200;
    } catch (error) {
      this.logger.error('Mentionlytics health check failed:', error);
      return false;
    }
  }

  // Private helper methods
  private transformMentions(rawMentions: any[]): MentionlyticsMention[] {
    return rawMentions.map(mention => ({
      id: mention.id || `mention_${Date.now()}_${Math.random()}`,
      platform: mention.platform || 'unknown',
      content: mention.content || mention.text || '',
      author: {
        name: mention.author?.name || mention.user?.name || 'Unknown',
        username: mention.author?.username || mention.user?.username || '',
        followers: mention.author?.followers || mention.user?.followers || 0,
        verified: mention.author?.verified || mention.user?.verified || false,
        profileUrl: mention.author?.profile_url || mention.user?.profile_url || ''
      },
      url: mention.url || mention.link || '',
      publishedAt: mention.published_at || mention.created_at || new Date().toISOString(),
      sentiment: mention.sentiment || 'neutral',
      sentimentScore: mention.sentiment_score || 0.5,
      engagement: {
        likes: mention.engagement?.likes || mention.likes || 0,
        shares: mention.engagement?.shares || mention.shares || 0,
        comments: mention.engagement?.comments || mention.comments || 0,
        views: mention.engagement?.views || mention.views,
        retweets: mention.engagement?.retweets || mention.retweets
      },
      mentions: mention.mentions || [],
      hashtags: mention.hashtags || [],
      language: mention.language || 'en',
      location: mention.location ? {
        country: mention.location.country || '',
        city: mention.location.city,
        coordinates: mention.location.coordinates
      } : undefined,
      reach: mention.reach || 0,
      influence: mention.influence || 0,
      mediaUrls: mention.media_urls || mention.media || []
    }));
  }

  private transformAnalytics(rawAnalytics: any): MentionlyticsAnalytics {
    return {
      totalMentions: rawAnalytics.total_mentions || 0,
      timeRange: {
        start: rawAnalytics.time_range?.start || '',
        end: rawAnalytics.time_range?.end || ''
      },
      sentimentBreakdown: {
        positive: rawAnalytics.sentiment?.positive || 0,
        negative: rawAnalytics.sentiment?.negative || 0,
        neutral: rawAnalytics.sentiment?.neutral || 0
      },
      platformBreakdown: rawAnalytics.platforms || {},
      languageBreakdown: rawAnalytics.languages || {},
      countryBreakdown: rawAnalytics.countries || {},
      engagementMetrics: {
        totalLikes: rawAnalytics.engagement?.total_likes || 0,
        totalShares: rawAnalytics.engagement?.total_shares || 0,
        totalComments: rawAnalytics.engagement?.total_comments || 0,
        totalViews: rawAnalytics.engagement?.total_views || 0,
        averageEngagement: rawAnalytics.engagement?.average || 0,
        totalReach: rawAnalytics.engagement?.total_reach || 0
      },
      topInfluencers: rawAnalytics.top_influencers || [],
      trendingHashtags: rawAnalytics.trending_hashtags || [],
      keywordClusters: rawAnalytics.keyword_clusters || [],
      viralContent: rawAnalytics.viral_content || []
    };
  }

  private async generateCompetitiveInsights(
    competitor: string,
    mentions: MentionlyticsMention[],
    analytics: MentionlyticsAnalytics,
    includeIndustryComparison: boolean
  ) {
    // Calculate share of voice (simplified)
    const shareOfVoice = mentions.length > 0 ? Math.min(mentions.length / 1000, 1) : 0;

    // Calculate sentiment comparison
    const competitorSentiment = analytics.sentimentBreakdown.positive /
      (analytics.sentimentBreakdown.positive + analytics.sentimentBreakdown.negative + analytics.sentimentBreakdown.neutral);

    // Industry average (mock data - in real implementation, this would come from industry benchmarks)
    const industrySentiment = 0.6;

    // Calculate engagement comparison
    const competitorEngagement = analytics.engagementMetrics.averageEngagement;
    const industryEngagement = 150; // Mock industry average

    // Extract keywords from mentions
    const allKeywords = mentions.flatMap(mention =>
      mention.content.toLowerCase().split(/\s+/).filter(word => word.length > 3)
    );

    const keywordCounts = allKeywords.reduce((acc, keyword) => {
      acc[keyword] = (acc[keyword] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topKeywords = Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([keyword]) => keyword);

    return {
      shareOfVoice,
      sentimentComparison: {
        competitor: competitorSentiment,
        industry: industrySentiment
      },
      engagementComparison: {
        competitor: competitorEngagement,
        industry: industryEngagement
      },
      topCompetingKeywords: topKeywords.slice(0, 5),
      opportunityKeywords: topKeywords.slice(5, 8),
      threatKeywords: mentions
        .filter(m => m.sentiment === 'negative')
        .flatMap(m => m.hashtags)
        .slice(0, 3)
    };
  }

  private generateAlerts(mentions: MentionlyticsMention[], analytics: MentionlyticsAnalytics) {
    const alerts = [];

    // Spike detection
    if (analytics.totalMentions > 100) {
      alerts.push({
        type: 'spike' as const,
        message: `Mention spike detected: ${analytics.totalMentions} mentions`,
        severity: 'medium' as const,
        timestamp: new Date().toISOString(),
        data: { mentionCount: analytics.totalMentions }
      });
    }

    // Sentiment drop detection
    const negativeRatio = analytics.sentimentBreakdown.negative / analytics.totalMentions;
    if (negativeRatio > 0.3) {
      alerts.push({
        type: 'sentiment_drop' as const,
        message: `High negative sentiment detected: ${Math.round(negativeRatio * 100)}%`,
        severity: 'high' as const,
        timestamp: new Date().toISOString(),
        data: { negativeRatio }
      });
    }

    // Viral content detection
    const viralMentions = mentions.filter(m => m.engagement.likes + m.engagement.shares > 1000);
    if (viralMentions.length > 0) {
      alerts.push({
        type: 'viral_content' as const,
        message: `${viralMentions.length} viral mentions detected`,
        severity: 'medium' as const,
        timestamp: new Date().toISOString(),
        data: { viralCount: viralMentions.length }
      });
    }

    // Influencer mention detection
    const influencerMentions = mentions.filter(m => m.author.followers > 10000);
    if (influencerMentions.length > 0) {
      alerts.push({
        type: 'influencer_mention' as const,
        message: `${influencerMentions.length} influencer mentions detected`,
        severity: 'low' as const,
        timestamp: new Date().toISOString(),
        data: { influencerCount: influencerMentions.length }
      });
    }

    return alerts;
  }

  private calculateStartDate(timeframe: string): string {
    const now = new Date();
    const days = timeframe.includes('d') ? parseInt(timeframe) :
                 timeframe.includes('w') ? parseInt(timeframe) * 7 :
                 timeframe.includes('m') ? parseInt(timeframe) * 30 : 7;

    const startDate = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    return startDate.toISOString().split('T')[0];
  }
}
