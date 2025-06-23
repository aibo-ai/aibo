import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('monitoring_alerts')
@Index(['type', 'severity', 'createdAt'])
@Index(['competitorId', 'status', 'createdAt'])
@Index(['status', 'createdAt'])
export class MonitoringAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  type: string; // 'price_change', 'new_product', 'marketing_campaign', 'social_mention', 'ranking_change', 'traffic_spike', 'news_mention'

  @Column({ type: 'varchar', length: 50 })
  severity: string; // 'info', 'warning', 'critical', 'urgent'

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'uuid' })
  competitorId: string;

  @Column({ type: 'varchar', length: 255 })
  competitorName: string;

  @Column({ type: 'varchar', length: 100 })
  source: string; // 'social_media', 'website', 'search_engine', 'news', 'ecommerce', 'manual'

  @Column({ type: 'varchar', length: 255, nullable: true })
  sourceUrl: string;

  @Column({ type: 'json' })
  alertData: {
    oldValue?: any;
    newValue?: any;
    change?: {
      absolute?: number;
      percentage?: number;
      direction?: 'increase' | 'decrease';
    };
    metrics?: any;
    context?: any;
  };

  @Column({ type: 'json', nullable: true })
  metadata: {
    confidence?: number;
    relevance?: number;
    impact?: number;
    urgency?: number;
    location?: string;
    language?: string;
    author?: string;
    platform?: string;
  };

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active', 'acknowledged', 'investigating', 'resolved', 'dismissed', 'escalated'

  @Column({ type: 'boolean', default: false })
  actionRequired: boolean;

  @Column({ type: 'json', nullable: true })
  suggestedActions: Array<{
    action: string;
    priority: string;
    description?: string;
    estimatedEffort?: string;
  }>;

  @Column({ type: 'varchar', length: 100, nullable: true })
  assignedTo: string;

  @Column({ type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  acknowledgedBy: string;

  @Column({ type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  resolvedBy: string;

  @Column({ type: 'text', nullable: true })
  resolutionNotes: string;

  @Column({ type: 'json', nullable: true })
  escalationHistory: Array<{
    escalatedTo: string;
    escalatedBy: string;
    timestamp: string;
    reason: string;
  }>;

  @Column({ type: 'json', nullable: true })
  relatedAlerts: string[]; // Array of alert IDs

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'boolean', default: false })
  isRecurring: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  recurringPattern: string; // 'daily', 'weekly', 'monthly', 'custom'

  @Column({ type: 'integer', default: 1 })
  occurrenceCount: number;

  @Column({ type: 'timestamp', nullable: true })
  lastOccurrence: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextExpectedOccurrence: Date;

  @Column({ type: 'boolean', default: true })
  isNotificationSent: boolean;

  @Column({ type: 'json', nullable: true })
  notificationHistory: Array<{
    channel: string; // 'email', 'slack', 'teams', 'webhook'
    recipient: string;
    timestamp: string;
    status: string; // 'sent', 'delivered', 'failed'
  }>;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  impactScore: number; // 0.00 to 1.00

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  urgencyScore: number; // 0.00 to 1.00

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date;

  @Column({ type: 'boolean', default: false })
  isArchived: boolean;

  @Column({ type: 'timestamp', nullable: true })
  archivedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
