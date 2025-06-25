import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface SocialMention {
  id: string;
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'reddit' | 'youtube';
  content: string;
  author: string;
  authorFollowers?: number;
  url: string;
  publishedAt: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  sentimentScore: number;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
    views?: number;
  };
  mentions: string[];
  hashtags: string[];
  language: string;
  location?: string;
  verified: boolean;
}

export interface SocialMetrics {
  platform: string;
  totalMentions: number;
  sentimentBreakdown: {
    positive: number;
    negative: number;
    neutral: number;
  };
  engagementMetrics: {
    totalLikes: number;
    totalShares: number;
    totalComments: number;
    averageEngagement: number;
  };
  topInfluencers: Array<{
    author: string;
    followers: number;
    mentions: number;
    avgSentiment: number;
  }>;
  trendingHashtags: Array<{
    hashtag: string;
    count: number;
  }>;
  timeRange: {
    start: string;
    end: string;
  };
}

export interface SocialSearchRequest {
  query: string;
  platforms?: string[];
  languages?: string[];
  countries?: string[];
  startDate?: string;
  endDate?: string;
  limit?: number;
  sentimentFilter?: 'positive' | 'negative' | 'neutral';
  verifiedOnly?: boolean;
  minFollowers?: number;
}

@Injectable()
export class SocialMonitoringService {
  private readonly logger = new Logger(SocialMonitoringService.name);
  private readonly socialSearcherClient: AxiosInstance;
  private readonly twitterClient: AxiosInstance;

  constructor(private configService: ConfigService) {
    // Initialize Social Searcher API client
    this.socialSearcherClient = axios.create({
      baseURL: 'https://api.social-searcher.com/v2',
      timeout: 30000,
      params: {
        key: this.configService.get<string>('SOCIAL_SEARCHER_API_KEY')
      }
    });

    // Initialize Twitter API client
    this.twitterClient = axios.create({
      baseURL: 'https://api.twitter.com/2',
      timeout: 30000,
      headers: {
        'Authorization': `Bearer ${this.configService.get<string>('TWITTER_BEARER_TOKEN')}`
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Social Searcher interceptors
    this.socialSearcherClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Social Searcher Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.socialSearcherClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Social Searcher Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('Social Searcher API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );

    // Twitter interceptors
    this.twitterClient.interceptors.request.use(
      (config) => {
        this.logger.debug(`Twitter API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      }
    );

    this.twitterClient.interceptors.response.use(
      (response) => {
        this.logger.debug(`Twitter API Response: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error('Twitter API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Search for social media mentions
   */
  async searchMentions(request: SocialSearchRequest): Promise<SocialMention[]> {
    try {
      const mentions: SocialMention[] = [];

      // Search using Social Searcher API
      if (this.configService.get<string>('SOCIAL_SEARCHER_API_KEY')) {
        const socialSearcherMentions = await this.searchWithSocialSearcher(request);
        mentions.push(...socialSearcherMentions);
      }

      // Search Twitter specifically if included in platforms
      if (!request.platforms || request.platforms.includes('twitter')) {
        if (this.configService.get<string>('TWITTER_BEARER_TOKEN')) {
          const twitterMentions = await this.searchTwitter(request);
          mentions.push(...twitterMentions);
        }
      }

      // Remove duplicates and sort by published date
      const uniqueMentions = this.removeDuplicates(mentions);
      return uniqueMentions.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );

    } catch (error) {
      this.logger.error('Social mentions search failed:', error);
      throw new Error(`Social mentions search failed: ${error.message}`);
    }
  }

  /**
   * Search using Social Searcher API
   */
  private async searchWithSocialSearcher(request: SocialSearchRequest): Promise<SocialMention[]> {
    try {
      const params = {
        q: request.query,
        type: 'web',
        lang: request.languages?.join(',') || 'en',
        country: request.countries?.join(','),
        since: request.startDate,
        until: request.endDate,
        limit: request.limit || 100
      };

      const response = await this.socialSearcherClient.get('/search', { params });
      
      return response.data.posts?.map((post: any) => this.mapSocialSearcherPost(post)) || [];
    } catch (error) {
      this.logger.error('Social Searcher API failed:', error);
      return [];
    }
  }

  /**
   * Search Twitter using Twitter API v2
   */
  private async searchTwitter(request: SocialSearchRequest): Promise<SocialMention[]> {
    try {
      const query = this.buildTwitterQuery(request);
      
      const params = {
        query,
        max_results: Math.min(request.limit || 100, 100),
        'tweet.fields': 'created_at,author_id,public_metrics,lang,geo,context_annotations',
        'user.fields': 'verified,public_metrics,location',
        'expansions': 'author_id'
      };

      if (request.startDate) {
        params['start_time'] = new Date(request.startDate).toISOString();
      }

      if (request.endDate) {
        params['end_time'] = new Date(request.endDate).toISOString();
      }

      const response = await this.twitterClient.get('/tweets/search/recent', { params });
      
      return this.mapTwitterResponse(response.data);
    } catch (error) {
      this.logger.error('Twitter API search failed:', error);
      return [];
    }
  }

  /**
   * Build Twitter search query
   */
  private buildTwitterQuery(request: SocialSearchRequest): string {
    let query = request.query;

    if (request.languages?.length) {
      query += ` lang:${request.languages[0]}`;
    }

    if (request.verifiedOnly) {
      query += ' is:verified';
    }

    if (request.sentimentFilter === 'positive') {
      query += ' :)';
    } else if (request.sentimentFilter === 'negative') {
      query += ' :(';
    }

    return query;
  }

  /**
   * Map Social Searcher post to SocialMention
   */
  private mapSocialSearcherPost(post: any): SocialMention {
    return {
      id: post.id || `ss-${Date.now()}-${Math.random()}`,
      platform: this.detectPlatform(post.url),
      content: post.text || '',
      author: post.user?.name || 'Unknown',
      authorFollowers: post.user?.followers,
      url: post.url,
      publishedAt: post.posted,
      sentiment: this.analyzeSentiment(post.text || ''),
      sentimentScore: post.sentiment || 0,
      engagement: {
        likes: post.likes || 0,
        shares: post.shares || 0,
        comments: post.comments || 0,
        views: post.views
      },
      mentions: this.extractMentions(post.text || ''),
      hashtags: this.extractHashtags(post.text || ''),
      language: post.lang || 'en',
      location: post.user?.location,
      verified: post.user?.verified || false
    };
  }

  /**
   * Map Twitter response to SocialMention array
   */
  private mapTwitterResponse(data: any): SocialMention[] {
    if (!data.data) return [];

    const users = data.includes?.users || [];
    const userMap = new Map(users.map((user: any) => [user.id, user]));

    return data.data.map((tweet: any) => {
      const user = userMap.get(tweet.author_id) || {};
      
      return {
        id: tweet.id,
        platform: 'twitter' as const,
        content: tweet.text,
        author: (user as any)?.username || 'Unknown',
        authorFollowers: (user as any)?.public_metrics?.followers_count,
        url: `https://twitter.com/${(user as any)?.username}/status/${tweet.id}`,
        publishedAt: tweet.created_at,
        sentiment: this.analyzeSentiment(tweet.text),
        sentimentScore: this.calculateSentimentScore(tweet.text),
        engagement: {
          likes: tweet.public_metrics?.like_count || 0,
          shares: tweet.public_metrics?.retweet_count || 0,
          comments: tweet.public_metrics?.reply_count || 0,
          views: tweet.public_metrics?.impression_count
        },
        mentions: this.extractMentions(tweet.text),
        hashtags: this.extractHashtags(tweet.text),
        language: tweet.lang || 'en',
        location: (user as any)?.location,
        verified: (user as any)?.verified || false
      };
    });
  }

  /**
   * Analyze social metrics for a given query
   */
  async analyzeSocialMetrics(query: string, timeRange: { start: string; end: string }): Promise<SocialMetrics[]> {
    try {
      const platforms = ['twitter', 'linkedin', 'instagram', 'facebook', 'reddit'];
      const metrics: SocialMetrics[] = [];

      for (const platform of platforms) {
        const mentions = await this.searchMentions({
          query,
          platforms: [platform],
          startDate: timeRange.start,
          endDate: timeRange.end,
          limit: 1000
        });

        const platformMetrics = this.calculatePlatformMetrics(platform, mentions, timeRange);
        metrics.push(platformMetrics);
      }

      return metrics;
    } catch (error) {
      this.logger.error('Social metrics analysis failed:', error);
      throw error;
    }
  }

  /**
   * Calculate metrics for a specific platform
   */
  private calculatePlatformMetrics(platform: string, mentions: SocialMention[], timeRange: any): SocialMetrics {
    const platformMentions = mentions.filter(m => m.platform === platform);
    
    const sentimentBreakdown = {
      positive: platformMentions.filter(m => m.sentiment === 'positive').length,
      negative: platformMentions.filter(m => m.sentiment === 'negative').length,
      neutral: platformMentions.filter(m => m.sentiment === 'neutral').length
    };

    const totalEngagement = platformMentions.reduce((sum, m) => 
      sum + m.engagement.likes + m.engagement.shares + m.engagement.comments, 0
    );

    const influencers = this.getTopInfluencers(platformMentions);
    const hashtags = this.getTrendingHashtags(platformMentions);

    return {
      platform,
      totalMentions: platformMentions.length,
      sentimentBreakdown,
      engagementMetrics: {
        totalLikes: platformMentions.reduce((sum, m) => sum + m.engagement.likes, 0),
        totalShares: platformMentions.reduce((sum, m) => sum + m.engagement.shares, 0),
        totalComments: platformMentions.reduce((sum, m) => sum + m.engagement.comments, 0),
        averageEngagement: platformMentions.length > 0 ? totalEngagement / platformMentions.length : 0
      },
      topInfluencers: influencers,
      trendingHashtags: hashtags,
      timeRange
    };
  }

  /**
   * Monitor competitor mentions
   */
  async monitorCompetitor(competitorName: string, timeframe = '24h'): Promise<{
    mentions: SocialMention[];
    metrics: SocialMetrics[];
    alerts: Array<{ type: string; message: string; severity: string }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      
      if (timeframe === '24h') {
        startDate.setHours(startDate.getHours() - 24);
      } else if (timeframe === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }

      const mentions = await this.searchMentions({
        query: competitorName,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        limit: 500
      });

      const metrics = await this.analyzeSocialMetrics(competitorName, {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      });

      const alerts = this.generateAlerts(mentions, metrics);

      return { mentions, metrics, alerts };
    } catch (error) {
      this.logger.error(`Competitor monitoring failed for ${competitorName}:`, error);
      throw error;
    }
  }

  /**
   * Generate alerts based on social data
   */
  private generateAlerts(mentions: SocialMention[], metrics: SocialMetrics[]): Array<{ type: string; message: string; severity: string }> {
    const alerts = [];

    // Check for sentiment spikes
    const negativeMentions = mentions.filter(m => m.sentiment === 'negative').length;
    const totalMentions = mentions.length;
    
    if (totalMentions > 0 && (negativeMentions / totalMentions) > 0.3) {
      alerts.push({
        type: 'sentiment_spike',
        message: `High negative sentiment detected: ${Math.round((negativeMentions / totalMentions) * 100)}% of mentions are negative`,
        severity: 'high'
      });
    }

    // Check for mention volume spikes
    const recentMentions = mentions.filter(m => 
      new Date(m.publishedAt).getTime() > Date.now() - 3600000 // Last hour
    ).length;

    if (recentMentions > 50) {
      alerts.push({
        type: 'volume_spike',
        message: `Unusual mention volume: ${recentMentions} mentions in the last hour`,
        severity: 'medium'
      });
    }

    // Check for viral content
    const viralMentions = mentions.filter(m => 
      m.engagement.likes + m.engagement.shares > 1000
    );

    if (viralMentions.length > 0) {
      alerts.push({
        type: 'viral_content',
        message: `${viralMentions.length} mentions with high engagement detected`,
        severity: 'medium'
      });
    }

    return alerts;
  }

  // Helper methods
  private detectPlatform(url: string): SocialMention['platform'] {
    if (url.includes('twitter.com') || url.includes('t.co')) return 'twitter';
    if (url.includes('linkedin.com')) return 'linkedin';
    if (url.includes('instagram.com')) return 'instagram';
    if (url.includes('facebook.com')) return 'facebook';
    if (url.includes('reddit.com')) return 'reddit';
    if (url.includes('youtube.com')) return 'youtube';
    return 'twitter'; // Default
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis - in production, use a proper sentiment analysis service
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'love', 'best', 'awesome'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'worst', 'horrible', 'disappointing'];
    
    const lowerText = text.toLowerCase();
    const positiveCount = positiveWords.filter(word => lowerText.includes(word)).length;
    const negativeCount = negativeWords.filter(word => lowerText.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateSentimentScore(text: string): number {
    // Simple scoring - in production, use a proper sentiment analysis service
    const sentiment = this.analyzeSentiment(text);
    switch (sentiment) {
      case 'positive': return Math.random() * 0.5 + 0.5; // 0.5 to 1.0
      case 'negative': return Math.random() * 0.5; // 0.0 to 0.5
      default: return 0.5; // neutral
    }
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    return matches ? matches.map(m => m.substring(1)) : [];
  }

  private extractHashtags(text: string): string[] {
    const hashtagRegex = /#(\w+)/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(h => h.substring(1)) : [];
  }

  private removeDuplicates(mentions: SocialMention[]): SocialMention[] {
    const seen = new Set();
    return mentions.filter(mention => {
      const key = `${mention.platform}-${mention.content}-${mention.author}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private getTopInfluencers(mentions: SocialMention[]): Array<{ author: string; followers: number; mentions: number; avgSentiment: number }> {
    const influencerMap = new Map();
    
    mentions.forEach(mention => {
      if (!influencerMap.has(mention.author)) {
        influencerMap.set(mention.author, {
          author: mention.author,
          followers: mention.authorFollowers || 0,
          mentions: 0,
          totalSentiment: 0
        });
      }
      
      const influencer = influencerMap.get(mention.author);
      influencer.mentions++;
      influencer.totalSentiment += mention.sentimentScore;
    });

    return Array.from(influencerMap.values())
      .map(inf => ({
        ...inf,
        avgSentiment: inf.totalSentiment / inf.mentions
      }))
      .sort((a, b) => b.followers - a.followers)
      .slice(0, 10);
  }

  private getTrendingHashtags(mentions: SocialMention[]): Array<{ hashtag: string; count: number }> {
    const hashtagMap = new Map();
    
    mentions.forEach(mention => {
      mention.hashtags.forEach(hashtag => {
        hashtagMap.set(hashtag, (hashtagMap.get(hashtag) || 0) + 1);
      });
    });

    return Array.from(hashtagMap.entries())
      .map(([hashtag, count]) => ({ hashtag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Test with a simple search
      const mentions = await this.searchMentions({
        query: 'test',
        limit: 1
      });
      
      return true; // If no error thrown, service is healthy
    } catch (error) {
      this.logger.error('Social monitoring health check failed:', error);
      return false;
    }
  }
}
