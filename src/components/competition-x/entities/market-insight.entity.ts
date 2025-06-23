import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('market_insights')
@Index(['type', 'createdAt'])
@Index(['impact', 'createdAt'])
@Index(['competitorId', 'createdAt'])
export class MarketInsight {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // 'pricing', 'product', 'marketing', 'social', 'seo', 'market_trend', 'competitive_move'

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'varchar', length: 50 })
  impact: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'decimal', precision: 3, scale: 2 })
  confidence: number; // 0.00 to 1.00

  @Column({ type: 'varchar', length: 50 })
  category: string; // 'opportunity', 'threat', 'trend', 'alert', 'recommendation'

  @Column({ type: 'uuid', nullable: true })
  competitorId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  competitorName: string;

  @Column({ type: 'json', nullable: true })
  affectedCompetitors: Array<{
    id: string;
    name: string;
    impact: string;
  }>;

  @Column({ type: 'json' })
  data: {
    metrics?: any;
    trends?: any;
    comparisons?: any;
    forecasts?: any;
    recommendations?: string[];
  };

  @Column({ type: 'json', nullable: true })
  sources: Array<{
    type: string;
    url?: string;
    title?: string;
    date?: string;
    reliability: number;
  }>;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active', 'resolved', 'monitoring', 'archived'

  @Column({ type: 'boolean', default: false })
  isActionable: boolean;

  @Column({ type: 'json', nullable: true })
  actionItems: Array<{
    action: string;
    priority: string;
    assignee?: string;
    dueDate?: string;
    status: string;
  }>;

  @Column({ type: 'timestamp', nullable: true })
  relevantUntil: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  generatedBy: string; // 'ai_analysis', 'manual_input', 'automated_alert', 'trend_detection'

  @Column({ type: 'json', nullable: true })
  relatedInsights: string[]; // Array of insight IDs

  @Column({ type: 'integer', default: 0 })
  viewCount: number;

  @Column({ type: 'json', nullable: true })
  userFeedback: Array<{
    userId: string;
    rating: number;
    comment?: string;
    timestamp: string;
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  averageRating: number;

  @Column({ type: 'boolean', default: false })
  isBookmarked: boolean;

  @Column({ type: 'boolean', default: false })
  isShared: boolean;

  @Column({ type: 'json', nullable: true })
  shareHistory: Array<{
    sharedWith: string;
    sharedBy: string;
    timestamp: string;
    method: string; // 'email', 'slack', 'teams', 'export'
  }>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
