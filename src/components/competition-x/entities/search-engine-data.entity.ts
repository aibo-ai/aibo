import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Competitor } from './competitor.entity';

@Entity('search_engine_data')
@Index(['competitor', 'searchEngine', 'timestamp'])
@Index(['keyword', 'searchEngine', 'timestamp'])
export class SearchEngineData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  competitorId: string;

  @Column({ type: 'varchar', length: 50 })
  searchEngine: string; // 'google', 'bing', 'yahoo', 'duckduckgo'

  @Column({ type: 'varchar', length: 100 })
  dataType: string; // 'ranking', 'serp_feature', 'ad', 'knowledge_panel', 'local_listing'

  @Column({ type: 'varchar', length: 255 })
  keyword: string;

  @Column({ type: 'integer', nullable: true })
  position: number;

  @Column({ type: 'integer', nullable: true })
  previousPosition: number;

  @Column({ type: 'integer', nullable: true })
  positionChange: number;

  @Column({ type: 'varchar', length: 255 })
  url: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resultType: string; // 'organic', 'paid', 'featured_snippet', 'local', 'image', 'video', 'news'

  @Column({ type: 'json', nullable: true })
  serpFeatures: Array<{
    feature: string; // 'featured_snippet', 'people_also_ask', 'local_pack', 'image_pack', 'video_carousel'
    position: number;
    content?: string;
  }>;

  @Column({ type: 'integer', nullable: true })
  searchVolume: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  keywordDifficulty: number; // 0.00 to 100.00

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cpc: number; // Cost per click

  @Column({ type: 'varchar', length: 100, nullable: true })
  intent: string; // 'informational', 'navigational', 'transactional', 'commercial'

  @Column({ type: 'json', nullable: true })
  adData: {
    isAd?: boolean;
    adPosition?: number;
    adType?: string; // 'text', 'shopping', 'display'
    headline?: string;
    description?: string;
    displayUrl?: string;
    extensions?: Array<{
      type: string;
      content: string;
    }>;
    estimatedCpc?: number;
    adRank?: number;
  };

  @Column({ type: 'json', nullable: true })
  localData: {
    businessName?: string;
    address?: string;
    phone?: string;
    rating?: number;
    reviewCount?: number;
    category?: string;
    hours?: string;
    website?: string;
    localRank?: number;
  };

  @Column({ type: 'json', nullable: true })
  richSnippets: {
    type?: string; // 'review', 'recipe', 'product', 'event', 'faq'
    rating?: number;
    reviewCount?: number;
    price?: string;
    availability?: string;
    brand?: string;
    model?: string;
  };

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  language: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  device: string; // 'desktop', 'mobile', 'tablet'

  @Column({ type: 'varchar', length: 100, nullable: true })
  location: string;

  @Column({ type: 'json', nullable: true })
  competitorAnalysis: {
    competitorsInTop10?: Array<{
      competitorId: string;
      competitorName: string;
      position: number;
      url: string;
    }>;
    marketShare?: number;
    visibilityScore?: number;
  };

  @Column({ type: 'json', nullable: true })
  trendData: {
    trend?: 'up' | 'down' | 'stable';
    trendStrength?: number; // 1-5
    historicalPositions?: Array<{
      date: string;
      position: number;
    }>;
    seasonality?: {
      isseasonal: boolean;
      peakMonths?: string[];
      lowMonths?: string[];
    };
  };

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  clickThroughRate: number; // Estimated CTR based on position

  @Column({ type: 'integer', nullable: true })
  estimatedTraffic: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  estimatedValue: number; // Estimated traffic value

  @Column({ type: 'json', nullable: true })
  relatedKeywords: Array<{
    keyword: string;
    relevance: number;
    searchVolume: number;
    difficulty: number;
  }>;

  @Column({ type: 'json', nullable: true })
  contentAnalysis: {
    wordCount?: number;
    readabilityScore?: number;
    topicRelevance?: number;
    keywordDensity?: number;
    semanticKeywords?: string[];
  };

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Competitor, competitor => competitor.searchEngineData)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;
}
