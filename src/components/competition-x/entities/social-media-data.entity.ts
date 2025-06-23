import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Competitor } from './competitor.entity';

@Entity('social_media_data')
@Index(['competitor', 'platform', 'timestamp'])
@Index(['platform', 'postType', 'timestamp'])
export class SocialMediaData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  competitorId: string;

  @Column({ type: 'varchar', length: 50 })
  platform: string; // 'twitter', 'linkedin', 'facebook', 'instagram', 'youtube', 'tiktok'

  @Column({ type: 'varchar', length: 255 })
  postId: string;

  @Column({ type: 'varchar', length: 100 })
  postType: string; // 'post', 'story', 'video', 'live', 'poll', 'event', 'ad'

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  postUrl: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorHandle: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  authorName: string;

  @Column({ type: 'json', nullable: true })
  media: Array<{
    type: string; // 'image', 'video', 'gif', 'document'
    url: string;
    thumbnail?: string;
    duration?: number; // for videos
    size?: number;
  }>;

  @Column({ type: 'json' })
  engagement: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
    reactions?: {
      like?: number;
      love?: number;
      laugh?: number;
      angry?: number;
      sad?: number;
      wow?: number;
    };
    saves?: number;
    clicks?: number;
    impressions?: number;
    reach?: number;
  };

  @Column({ type: 'json', nullable: true })
  hashtags: string[];

  @Column({ type: 'json', nullable: true })
  mentions: Array<{
    handle: string;
    name?: string;
    type: string; // 'user', 'brand', 'competitor'
  }>;

  @Column({ type: 'json', nullable: true })
  links: Array<{
    url: string;
    domain: string;
    title?: string;
    description?: string;
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  sentimentScore: number; // -1.00 to 1.00

  @Column({ type: 'varchar', length: 50, nullable: true })
  sentimentLabel: string; // 'positive', 'negative', 'neutral'

  @Column({ type: 'json', nullable: true })
  topics: Array<{
    topic: string;
    confidence: number;
    category: string;
  }>;

  @Column({ type: 'json', nullable: true })
  keywords: Array<{
    keyword: string;
    relevance: number;
    frequency: number;
  }>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  language: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'json', nullable: true })
  audienceInsights: {
    demographics?: {
      ageGroups?: { [key: string]: number };
      gender?: { [key: string]: number };
      locations?: { [key: string]: number };
    };
    interests?: string[];
    engagementPatterns?: {
      peakHours?: number[];
      peakDays?: string[];
      averageEngagementTime?: number;
    };
  };

  @Column({ type: 'boolean', default: false })
  isPromoted: boolean;

  @Column({ type: 'boolean', default: false })
  isSponsored: boolean;

  @Column({ type: 'json', nullable: true })
  campaignInfo: {
    campaignName?: string;
    campaignType?: string;
    targetAudience?: string[];
    budget?: number;
    duration?: {
      start: string;
      end: string;
    };
    objectives?: string[];
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  engagementRate: number; // Percentage

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  viralityScore: number; // 0.00 to 100.00

  @Column({ type: 'integer', default: 0 })
  shareVelocity: number; // Shares per hour

  @Column({ type: 'json', nullable: true })
  competitorMentions: Array<{
    competitorId: string;
    competitorName: string;
    context: string; // 'comparison', 'mention', 'criticism', 'praise'
    sentiment: number;
  }>;

  @Column({ type: 'json', nullable: true })
  trendingStatus: {
    isTrending: boolean;
    trendingRank?: number;
    trendingCategory?: string;
    trendingDuration?: number; // minutes
  };

  @Column({ type: 'timestamp' })
  publishedAt: Date;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Competitor, competitor => competitor.socialMediaData)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;
}
