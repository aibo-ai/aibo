import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { CompetitiveData } from './competitive-data.entity';
import { CompetitorProfile } from './competitor-profile.entity';
import { SocialMediaData } from './social-media-data.entity';
import { SearchEngineData } from './search-engine-data.entity';
import { EcommerceData } from './ecommerce-data.entity';

@Entity('competitors')
export class Competitor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  website: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  industry: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  size: string; // 'startup', 'small', 'medium', 'large', 'enterprise'

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  marketShare: number;

  @Column({ type: 'varchar', length: 50, default: 'medium' })
  threatLevel: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active', 'inactive', 'monitoring', 'archived'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  socialMediaProfiles: {
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    youtube?: string;
  };

  @Column({ type: 'json', nullable: true })
  keyPersonnel: Array<{
    name: string;
    role: string;
    linkedinUrl?: string;
  }>;

  @Column({ type: 'json', nullable: true })
  productCategories: string[];

  @Column({ type: 'json', nullable: true })
  targetMarkets: string[];

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  estimatedRevenue: number;

  @Column({ type: 'integer', nullable: true })
  employeeCount: number;

  @Column({ type: 'date', nullable: true })
  foundedDate: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  headquarters: string;

  @Column({ type: 'json', nullable: true })
  fundingInfo: {
    totalFunding?: number;
    lastRound?: {
      amount: number;
      date: string;
      type: string;
    };
    investors?: string[];
  };

  @Column({ type: 'json', nullable: true })
  competitiveAdvantages: string[];

  @Column({ type: 'json', nullable: true })
  weaknesses: string[];

  @Column({ type: 'boolean', default: true })
  isMonitored: boolean;

  @Column({ type: 'json', nullable: true })
  monitoringConfig: {
    socialMedia: boolean;
    website: boolean;
    seo: boolean;
    pricing: boolean;
    products: boolean;
    news: boolean;
    patents: boolean;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastAnalyzed: Date;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  competitiveScore: number; // 0.00 to 1.00

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @OneToMany(() => CompetitiveData, competitiveData => competitiveData.competitor)
  competitiveData: CompetitiveData[];

  @OneToMany(() => CompetitorProfile, profile => profile.competitor)
  profiles: CompetitorProfile[];

  @OneToMany(() => SocialMediaData, socialData => socialData.competitor)
  socialMediaData: SocialMediaData[];

  @OneToMany(() => SearchEngineData, searchData => searchData.competitor)
  searchEngineData: SearchEngineData[];

  @OneToMany(() => EcommerceData, ecommerceData => ecommerceData.competitor)
  ecommerceData: EcommerceData[];
}
