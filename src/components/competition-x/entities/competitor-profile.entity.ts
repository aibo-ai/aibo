import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Competitor } from './competitor.entity';

@Entity('competitor_profiles')
@Index(['competitor', 'profileType'])
export class CompetitorProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  competitorId: string;

  @Column({ type: 'varchar', length: 100 })
  profileType: string; // 'company', 'product', 'executive', 'brand'

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json' })
  profileData: {
    // Company Profile
    companyInfo?: {
      legalName?: string;
      tradingName?: string;
      registrationNumber?: string;
      taxId?: string;
      incorporationDate?: string;
      legalStructure?: string;
      parentCompany?: string;
      subsidiaries?: string[];
    };
    
    // Product Profile
    productInfo?: {
      category?: string;
      subcategory?: string;
      features?: string[];
      pricing?: {
        model: string;
        tiers?: Array<{
          name: string;
          price: number;
          currency: string;
          features: string[];
        }>;
      };
      targetAudience?: string[];
      launchDate?: string;
      lifecycle?: string; // 'development', 'launch', 'growth', 'maturity', 'decline'
    };
    
    // Executive Profile
    executiveInfo?: {
      position?: string;
      department?: string;
      tenure?: string;
      previousRoles?: Array<{
        company: string;
        position: string;
        duration: string;
      }>;
      education?: Array<{
        institution: string;
        degree: string;
        year: string;
      }>;
      achievements?: string[];
      publicStatements?: Array<{
        statement: string;
        date: string;
        source: string;
      }>;
    };
    
    // Brand Profile
    brandInfo?: {
      brandValues?: string[];
      positioning?: string;
      targetDemographics?: {
        ageRange?: string;
        income?: string;
        geography?: string[];
        interests?: string[];
      };
      brandPersonality?: string[];
      visualIdentity?: {
        colors?: string[];
        fonts?: string[];
        logoDescription?: string;
      };
      messaging?: {
        tagline?: string;
        keyMessages?: string[];
        toneOfVoice?: string;
      };
    };
  };

  @Column({ type: 'json', nullable: true })
  metrics: {
    // Company Metrics
    revenue?: number;
    employees?: number;
    marketCap?: number;
    valuation?: number;
    
    // Product Metrics
    marketShare?: number;
    userBase?: number;
    downloads?: number;
    reviews?: {
      average: number;
      count: number;
      distribution: number[];
    };
    
    // Executive Metrics
    influence?: number;
    mediaPresence?: number;
    networkSize?: number;
    
    // Brand Metrics
    brandAwareness?: number;
    brandSentiment?: number;
    brandEquity?: number;
    socialMentions?: number;
  };

  @Column({ type: 'json', nullable: true })
  socialPresence: {
    platforms?: Array<{
      platform: string;
      handle: string;
      url: string;
      followers: number;
      engagement: number;
      verified: boolean;
    }>;
    totalFollowers?: number;
    totalEngagement?: number;
    averageEngagementRate?: number;
  };

  @Column({ type: 'json', nullable: true })
  digitalFootprint: {
    websites?: Array<{
      url: string;
      type: string; // 'main', 'blog', 'support', 'careers'
      traffic?: number;
      ranking?: number;
    }>;
    mobileApps?: Array<{
      platform: string;
      name: string;
      downloads: number;
      rating: number;
      reviews: number;
    }>;
    onlinePresence?: {
      searchVisibility: number;
      domainAuthority: number;
      backlinks: number;
      organicKeywords: number;
    };
  };

  @Column({ type: 'json', nullable: true })
  competitivePosition: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    differentiators?: string[];
    competitiveAdvantages?: string[];
  };

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  completenessScore: number; // 0.00 to 1.00

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  accuracyScore: number; // 0.00 to 1.00

  @Column({ type: 'timestamp', nullable: true })
  lastVerified: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  verifiedBy: string;

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

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Competitor, competitor => competitor.profiles)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;
}
