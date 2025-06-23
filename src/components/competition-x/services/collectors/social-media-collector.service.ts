import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { ApplicationInsightsService } from '../../../../common/services/application-insights.service';

import { SocialMediaData } from '../../entities/social-media-data.entity';
import { Competitor } from '../../entities/competitor.entity';

export interface SocialMediaCollectionConfig {
  platforms: string[]; // 'twitter', 'linkedin', 'facebook', 'instagram', 'youtube'
  lookbackDays: number;
  includeAds: boolean;
  maxPostsPerPlatform?: number;
  includeEngagementMetrics?: boolean;
  includeSentimentAnalysis?: boolean;
}

@Injectable()
export class SocialMediaCollectorService {
  private readonly logger = new Logger(SocialMediaCollectorService.name);
  
  // API configurations
  private readonly twitterApiKey: string;
  private readonly linkedinApiKey: string;
  private readonly facebookApiKey: string;
  private readonly instagramApiKey: string;
  private readonly youtubeApiKey: string;

  constructor(
    @InjectRepository(SocialMediaData)
    private readonly socialMediaDataRepository: Repository<SocialMediaData>,
    @InjectRepository(Competitor)
    private readonly competitorRepository: Repository<Competitor>,
    
    private readonly configService: ConfigService,
    private readonly appInsights: ApplicationInsightsService
  ) {
    this.twitterApiKey = this.configService.get('TWITTER_API_KEY', '');
    this.linkedinApiKey = this.configService.get('LINKEDIN_API_KEY', '');
    this.facebookApiKey = this.configService.get('FACEBOOK_API_KEY', '');
    this.instagramApiKey = this.configService.get('INSTAGRAM_API_KEY', '');
    this.youtubeApiKey = this.configService.get('YOUTUBE_API_KEY', '');
  }

  /**
   * Collect social media data for a competitor
   */
  async collectData(
    competitorId: string, 
    config: SocialMediaCollectionConfig = {
      platforms: ['twitter', 'linkedin', 'facebook'],
      lookbackDays: 7,
      includeAds: true,
      maxPostsPerPlatform: 100,
      includeEngagementMetrics: true,
      includeSentimentAnalysis: true
    }
  ): Promise<{ recordsCollected: number; metadata?: any }> {
    
    const startTime = Date.now();
    let totalRecords = 0;
    const platformResults = {};

    try {
      this.logger.log(`Collecting social media data for competitor ${competitorId}`);

      // Get competitor information
      const competitor = await this.competitorRepository.findOne({
        where: { id: competitorId }
      });

      if (!competitor) {
        throw new Error(`Competitor not found: ${competitorId}`);
      }

      // Collect data from each platform
      for (const platform of config.platforms) {
        try {
          const platformData = await this.collectPlatformData(
            competitor, 
            platform, 
            config
          );
          
          platformResults[platform] = {
            recordsCollected: platformData.length,
            status: 'success'
          };
          
          totalRecords += platformData.length;
          
          // Save data to database
          if (platformData.length > 0) {
            await this.socialMediaDataRepository.save(platformData);
          }

        } catch (error) {
          this.logger.error(`Failed to collect ${platform} data: ${error.message}`);
          platformResults[platform] = {
            recordsCollected: 0,
            status: 'failed',
            error: error.message
          };
        }
      }

      const processingTime = Date.now() - startTime;

      this.appInsights.trackEvent('CompetitionX:SocialMediaCollected', {
        competitorId,
        platforms: config.platforms.join(','),
        totalRecords: totalRecords.toString(),
        processingTime: processingTime.toString()
      });

      this.logger.log(`Social media collection completed: ${totalRecords} records in ${processingTime}ms`);

      return {
        recordsCollected: totalRecords,
        metadata: {
          platforms: platformResults,
          processingTime,
          config
        }
      };

    } catch (error) {
      this.logger.error(`Social media collection failed: ${error.message}`, error.stack);
      this.appInsights.trackException(error, {
        operation: 'CollectSocialMediaData',
        competitorId
      });
      throw error;
    }
  }

  /**
   * Collect data from a specific platform
   */
  private async collectPlatformData(
    competitor: Competitor, 
    platform: string, 
    config: SocialMediaCollectionConfig
  ): Promise<SocialMediaData[]> {
    
    switch (platform) {
      case 'twitter':
        return await this.collectTwitterData(competitor, config);
      case 'linkedin':
        return await this.collectLinkedInData(competitor, config);
      case 'facebook':
        return await this.collectFacebookData(competitor, config);
      case 'instagram':
        return await this.collectInstagramData(competitor, config);
      case 'youtube':
        return await this.collectYouTubeData(competitor, config);
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }
  }

  /**
   * Collect Twitter data
   */
  private async collectTwitterData(
    competitor: Competitor, 
    config: SocialMediaCollectionConfig
  ): Promise<SocialMediaData[]> {
    
    const data: SocialMediaData[] = [];
    
    try {
      // In a real implementation, this would use Twitter API v2
      // For now, we'll simulate data collection
      
      const twitterHandle = competitor.socialMediaProfiles?.twitter;
      if (!twitterHandle) {
        this.logger.warn(`No Twitter handle found for competitor ${competitor.name}`);
        return data;
      }

      // Simulate API calls and data processing
      const simulatedPosts = this.generateSimulatedTwitterData(
        competitor.id, 
        twitterHandle, 
        config
      );

      data.push(...simulatedPosts);

      this.logger.log(`Collected ${data.length} Twitter posts for ${competitor.name}`);

    } catch (error) {
      this.logger.error(`Twitter collection failed: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Collect LinkedIn data
   */
  private async collectLinkedInData(
    competitor: Competitor, 
    config: SocialMediaCollectionConfig
  ): Promise<SocialMediaData[]> {
    
    const data: SocialMediaData[] = [];
    
    try {
      const linkedinUrl = competitor.socialMediaProfiles?.linkedin;
      if (!linkedinUrl) {
        this.logger.warn(`No LinkedIn profile found for competitor ${competitor.name}`);
        return data;
      }

      // Simulate LinkedIn data collection
      const simulatedPosts = this.generateSimulatedLinkedInData(
        competitor.id, 
        linkedinUrl, 
        config
      );

      data.push(...simulatedPosts);

      this.logger.log(`Collected ${data.length} LinkedIn posts for ${competitor.name}`);

    } catch (error) {
      this.logger.error(`LinkedIn collection failed: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Collect Facebook data
   */
  private async collectFacebookData(
    competitor: Competitor, 
    config: SocialMediaCollectionConfig
  ): Promise<SocialMediaData[]> {
    
    const data: SocialMediaData[] = [];
    
    try {
      const facebookUrl = competitor.socialMediaProfiles?.facebook;
      if (!facebookUrl) {
        this.logger.warn(`No Facebook profile found for competitor ${competitor.name}`);
        return data;
      }

      // Simulate Facebook data collection
      const simulatedPosts = this.generateSimulatedFacebookData(
        competitor.id, 
        facebookUrl, 
        config
      );

      data.push(...simulatedPosts);

      this.logger.log(`Collected ${data.length} Facebook posts for ${competitor.name}`);

    } catch (error) {
      this.logger.error(`Facebook collection failed: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Collect Instagram data
   */
  private async collectInstagramData(
    competitor: Competitor, 
    config: SocialMediaCollectionConfig
  ): Promise<SocialMediaData[]> {
    
    const data: SocialMediaData[] = [];
    
    try {
      const instagramUrl = competitor.socialMediaProfiles?.instagram;
      if (!instagramUrl) {
        this.logger.warn(`No Instagram profile found for competitor ${competitor.name}`);
        return data;
      }

      // Simulate Instagram data collection
      const simulatedPosts = this.generateSimulatedInstagramData(
        competitor.id, 
        instagramUrl, 
        config
      );

      data.push(...simulatedPosts);

      this.logger.log(`Collected ${data.length} Instagram posts for ${competitor.name}`);

    } catch (error) {
      this.logger.error(`Instagram collection failed: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Collect YouTube data
   */
  private async collectYouTubeData(
    competitor: Competitor, 
    config: SocialMediaCollectionConfig
  ): Promise<SocialMediaData[]> {
    
    const data: SocialMediaData[] = [];
    
    try {
      const youtubeUrl = competitor.socialMediaProfiles?.youtube;
      if (!youtubeUrl) {
        this.logger.warn(`No YouTube channel found for competitor ${competitor.name}`);
        return data;
      }

      // Simulate YouTube data collection
      const simulatedVideos = this.generateSimulatedYouTubeData(
        competitor.id, 
        youtubeUrl, 
        config
      );

      data.push(...simulatedVideos);

      this.logger.log(`Collected ${data.length} YouTube videos for ${competitor.name}`);

    } catch (error) {
      this.logger.error(`YouTube collection failed: ${error.message}`);
      throw error;
    }

    return data;
  }

  /**
   * Generate simulated Twitter data for demonstration
   */
  private generateSimulatedTwitterData(
    competitorId: string, 
    handle: string, 
    config: SocialMediaCollectionConfig
  ): SocialMediaData[] {
    
    const posts: SocialMediaData[] = [];
    const postCount = Math.min(config.maxPostsPerPlatform || 50, 50);
    
    for (let i = 0; i < postCount; i++) {
      const post = this.socialMediaDataRepository.create({
        competitorId,
        platform: 'twitter',
        postId: `tweet_${Date.now()}_${i}`,
        postType: 'post',
        content: `Sample tweet content ${i + 1} from ${handle}`,
        postUrl: `https://twitter.com/${handle}/status/${Date.now()}${i}`,
        authorHandle: handle,
        authorName: handle.replace('@', ''),
        engagement: {
          likes: Math.floor(Math.random() * 1000),
          shares: Math.floor(Math.random() * 100),
          comments: Math.floor(Math.random() * 50),
          views: Math.floor(Math.random() * 10000)
        },
        hashtags: ['#innovation', '#technology', '#business'],
        sentimentScore: (Math.random() - 0.5) * 2, // -1 to 1
        sentimentLabel: ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)],
        language: 'en',
        publishedAt: new Date(Date.now() - Math.random() * config.lookbackDays * 24 * 60 * 60 * 1000),
        timestamp: new Date()
      });
      
      posts.push(post);
    }
    
    return posts;
  }

  /**
   * Generate simulated LinkedIn data
   */
  private generateSimulatedLinkedInData(
    competitorId: string, 
    profileUrl: string, 
    config: SocialMediaCollectionConfig
  ): SocialMediaData[] {
    
    const posts: SocialMediaData[] = [];
    const postCount = Math.min(config.maxPostsPerPlatform || 30, 30);
    
    for (let i = 0; i < postCount; i++) {
      const post = this.socialMediaDataRepository.create({
        competitorId,
        platform: 'linkedin',
        postId: `linkedin_${Date.now()}_${i}`,
        postType: 'post',
        content: `Professional LinkedIn post ${i + 1} about industry insights`,
        postUrl: `${profileUrl}/posts/${Date.now()}${i}`,
        authorHandle: profileUrl.split('/').pop(),
        engagement: {
          likes: Math.floor(Math.random() * 500),
          shares: Math.floor(Math.random() * 50),
          comments: Math.floor(Math.random() * 25)
        },
        sentimentScore: Math.random() * 0.8 + 0.1, // Mostly positive
        sentimentLabel: 'positive',
        language: 'en',
        publishedAt: new Date(Date.now() - Math.random() * config.lookbackDays * 24 * 60 * 60 * 1000),
        timestamp: new Date()
      });
      
      posts.push(post);
    }
    
    return posts;
  }

  /**
   * Generate simulated Facebook data
   */
  private generateSimulatedFacebookData(
    competitorId: string, 
    pageUrl: string, 
    config: SocialMediaCollectionConfig
  ): SocialMediaData[] {
    
    const posts: SocialMediaData[] = [];
    const postCount = Math.min(config.maxPostsPerPlatform || 40, 40);
    
    for (let i = 0; i < postCount; i++) {
      const post = this.socialMediaDataRepository.create({
        competitorId,
        platform: 'facebook',
        postId: `fb_${Date.now()}_${i}`,
        postType: Math.random() > 0.7 ? 'video' : 'post',
        content: `Facebook post ${i + 1} with engaging content`,
        postUrl: `${pageUrl}/posts/${Date.now()}${i}`,
        engagement: {
          likes: Math.floor(Math.random() * 2000),
          shares: Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 100),
          reactions: {
            like: Math.floor(Math.random() * 1000),
            love: Math.floor(Math.random() * 300),
            laugh: Math.floor(Math.random() * 100)
          }
        },
        sentimentScore: (Math.random() - 0.3) * 1.5, // Slightly positive bias
        sentimentLabel: ['positive', 'neutral'][Math.floor(Math.random() * 2)],
        language: 'en',
        publishedAt: new Date(Date.now() - Math.random() * config.lookbackDays * 24 * 60 * 60 * 1000),
        timestamp: new Date()
      });
      
      posts.push(post);
    }
    
    return posts;
  }

  /**
   * Generate simulated Instagram data
   */
  private generateSimulatedInstagramData(
    competitorId: string, 
    profileUrl: string, 
    config: SocialMediaCollectionConfig
  ): SocialMediaData[] {
    
    const posts: SocialMediaData[] = [];
    const postCount = Math.min(config.maxPostsPerPlatform || 35, 35);
    
    for (let i = 0; i < postCount; i++) {
      const post = this.socialMediaDataRepository.create({
        competitorId,
        platform: 'instagram',
        postId: `ig_${Date.now()}_${i}`,
        postType: Math.random() > 0.5 ? 'post' : 'story',
        content: `Instagram post ${i + 1} with visual content`,
        media: [{
          type: 'image',
          url: `https://example.com/image_${i}.jpg`,
          thumbnail: `https://example.com/thumb_${i}.jpg`
        }],
        engagement: {
          likes: Math.floor(Math.random() * 5000),
          comments: Math.floor(Math.random() * 200),
          saves: Math.floor(Math.random() * 100)
        },
        hashtags: ['#brand', '#lifestyle', '#innovation'],
        sentimentScore: Math.random() * 0.9 + 0.1, // Generally positive
        sentimentLabel: 'positive',
        language: 'en',
        publishedAt: new Date(Date.now() - Math.random() * config.lookbackDays * 24 * 60 * 60 * 1000),
        timestamp: new Date()
      });
      
      posts.push(post);
    }
    
    return posts;
  }

  /**
   * Generate simulated YouTube data
   */
  private generateSimulatedYouTubeData(
    competitorId: string, 
    channelUrl: string, 
    config: SocialMediaCollectionConfig
  ): SocialMediaData[] {
    
    const videos: SocialMediaData[] = [];
    const videoCount = Math.min(config.maxPostsPerPlatform || 20, 20);
    
    for (let i = 0; i < videoCount; i++) {
      const video = this.socialMediaDataRepository.create({
        competitorId,
        platform: 'youtube',
        postId: `yt_${Date.now()}_${i}`,
        postType: 'video',
        content: `YouTube video ${i + 1} - Educational content`,
        postUrl: `https://youtube.com/watch?v=${Date.now()}${i}`,
        media: [{
          type: 'video',
          url: `https://youtube.com/watch?v=${Date.now()}${i}`,
          thumbnail: `https://img.youtube.com/vi/${Date.now()}${i}/maxresdefault.jpg`,
          duration: Math.floor(Math.random() * 1800) + 300 // 5-35 minutes
        }],
        engagement: {
          likes: Math.floor(Math.random() * 10000),
          views: Math.floor(Math.random() * 100000),
          comments: Math.floor(Math.random() * 500)
        },
        sentimentScore: Math.random() * 0.8 + 0.1,
        sentimentLabel: 'positive',
        language: 'en',
        publishedAt: new Date(Date.now() - Math.random() * config.lookbackDays * 24 * 60 * 60 * 1000),
        timestamp: new Date()
      });
      
      videos.push(video);
    }
    
    return videos;
  }
}
