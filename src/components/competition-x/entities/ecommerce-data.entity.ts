import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Competitor } from './competitor.entity';

@Entity('ecommerce_data')
@Index(['competitor', 'platform', 'timestamp'])
@Index(['productId', 'platform', 'timestamp'])
export class EcommerceData {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  competitorId: string;

  @Column({ type: 'varchar', length: 50 })
  platform: string; // 'amazon', 'shopify', 'ebay', 'etsy', 'walmart', 'alibaba'

  @Column({ type: 'varchar', length: 255 })
  productId: string;

  @Column({ type: 'varchar', length: 255 })
  productName: string;

  @Column({ type: 'text', nullable: true })
  productDescription: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  subcategory: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  brand: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  sku: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  originalPrice: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercentage: number;

  @Column({ type: 'varchar', length: 10 })
  currency: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  availability: string; // 'in_stock', 'out_of_stock', 'limited', 'preorder'

  @Column({ type: 'integer', nullable: true })
  stockQuantity: number;

  @Column({ type: 'decimal', precision: 3, scale: 2, nullable: true })
  rating: number; // 0.00 to 5.00

  @Column({ type: 'integer', nullable: true })
  reviewCount: number;

  @Column({ type: 'integer', nullable: true })
  salesRank: number;

  @Column({ type: 'integer', nullable: true })
  categoryRank: number;

  @Column({ type: 'json', nullable: true })
  images: Array<{
    url: string;
    alt?: string;
    isPrimary: boolean;
  }>;

  @Column({ type: 'json', nullable: true })
  specifications: { [key: string]: string };

  @Column({ type: 'json', nullable: true })
  features: string[];

  @Column({ type: 'json', nullable: true })
  variants: Array<{
    name: string;
    options: string[];
    price?: number;
    sku?: string;
    availability?: string;
  }>;

  @Column({ type: 'json', nullable: true })
  shipping: {
    cost?: number;
    freeShipping?: boolean;
    estimatedDelivery?: string;
    methods?: Array<{
      method: string;
      cost: number;
      duration: string;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  seller: {
    name: string;
    rating?: number;
    reviewCount?: number;
    isVerified?: boolean;
    location?: string;
    businessType?: string; // 'individual', 'business', 'manufacturer'
  };

  @Column({ type: 'json', nullable: true })
  promotions: Array<{
    type: string; // 'discount', 'coupon', 'bundle', 'bogo'
    description: string;
    value: number;
    validUntil?: string;
    conditions?: string[];
  }>;

  @Column({ type: 'json', nullable: true })
  competitorComparison: Array<{
    competitorId: string;
    competitorName: string;
    productName: string;
    price: number;
    rating: number;
    availability: string;
    priceAdvantage: number; // Positive if our price is better
  }>;

  @Column({ type: 'json', nullable: true })
  priceHistory: Array<{
    date: string;
    price: number;
    originalPrice?: number;
    discount?: number;
  }>;

  @Column({ type: 'json', nullable: true })
  salesMetrics: {
    estimatedMonthlySales?: number;
    estimatedRevenue?: number;
    salesVelocity?: number; // Sales per day
    inventoryTurnover?: number;
    seasonalTrends?: Array<{
      month: string;
      salesMultiplier: number;
    }>;
  };

  @Column({ type: 'json', nullable: true })
  reviewAnalysis: {
    sentimentScore?: number; // -1.00 to 1.00
    topPositiveKeywords?: string[];
    topNegativeKeywords?: string[];
    commonComplaints?: string[];
    commonPraises?: string[];
    ratingDistribution?: number[]; // [1-star, 2-star, 3-star, 4-star, 5-star]
  };

  @Column({ type: 'json', nullable: true })
  seoMetrics: {
    title?: string;
    metaDescription?: string;
    keywords?: string[];
    searchVisibility?: number;
    organicTraffic?: number;
    backlinks?: number;
  };

  @Column({ type: 'json', nullable: true })
  advertisingData: {
    isSponsored?: boolean;
    adPosition?: number;
    estimatedAdSpend?: number;
    adKeywords?: string[];
    adCopy?: string;
  };

  @Column({ type: 'boolean', default: false })
  isNewProduct: boolean;

  @Column({ type: 'boolean', default: false })
  isDiscontinued: boolean;

  @Column({ type: 'timestamp', nullable: true })
  launchDate: Date;

  @Column({ type: 'timestamp', nullable: true })
  discontinuedDate: Date;

  @Column({ type: 'json', nullable: true })
  alerts: Array<{
    type: string; // 'price_change', 'stock_change', 'new_review', 'rank_change'
    message: string;
    severity: string;
    triggeredAt: string;
  }>;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @CreateDateColumn()
  createdAt: Date;

  // Relationships
  @ManyToOne(() => Competitor, competitor => competitor.ecommerceData)
  @JoinColumn({ name: 'competitorId' })
  competitor: Competitor;
}
