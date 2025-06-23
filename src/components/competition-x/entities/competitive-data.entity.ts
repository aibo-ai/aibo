import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Competitor } from './competitor.entity';

@Entity('competitive_data')
@Index(['competitor', 'dataType', 'timestamp'])
@Index(['dataType', 'timestamp'])
export class CompetitiveData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  competitorId: string;

  @Column({ type: 'varchar', length: 100 })
  dataType: string; // 'pricing', 'product', 'marketing', 'social', 'seo', 'traffic', 'news'

  @Column({ type: 'varchar', length: 100 })
  source: string; // 'twitter', 'linkedin', 'website', 'google', 'amazon', 'manual'

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceUrl: string;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  data: any; // Flexible JSON structure for different data types

  @Column({ type: 'json', nullable: true })
  metadata: {
    confidence?: number;
    relevance?: number;
    sentiment?: number;
    language?: string;
    location?: string;
    author?: string;
    engagement?: {
      likes?: number;
      shares?: number;
      comments?: number;
      views?: number;
    };
    seo?: {
      keywords?: string[];
      ranking?: number;
      searchVolume?: number;
    };
    pricing?: {
      currency?: string;
      originalPrice?: number;
      discountedPrice?: number;
      discount?: number;
    };
  };

  @Column({ type: 'varchar', length: 50, default: 'raw' })
  processingStatus: string; // 'raw', 'processing', 'processed', 'analyzed', 'archived'

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  relevanceScore: number; // 0.00 to 1.00

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  impactScore: number; // 0.00 to 1.00

  @Column({ type: 'varchar', length: 50, nullable: true })
  priority: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'boolean', default: false })
  isAlert: boolean;

  @Column({ type: 'varchar', length: 50, nullable: true })
  alertType: string; // 'price_change', 'new_product', 'campaign_launch', 'ranking_change'

  @Column({ type: 'timestamp', nullable: true })
  alertTriggeredAt: Date;

  @Column({ type: 'boolean', default: false })
  isProcessed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date;

  @Column({ type: 'json', nullable: true })
  analysisResults: {
    sentiment?: {
      score: number;
      label: string;
      confidence: number;
    };
    keywords?: Array<{
      keyword: string;
      relevance: number;
      frequency: number;
    }>;
    entities?: Array<{
      entity: string;
      type: string;
      confidence: number;
    }>;
    trends?: Array<{
      metric: string;
      direction: 'up' | 'down' | 'stable';
      magnitude: number;
    }>;
    insights?: Array<{
      insight: string;
      confidence: number;
      actionable: boolean;
    }>;
  };

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Competitor, competitor => competitor.competitiveData)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;
}
