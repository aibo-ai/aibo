import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from './cache.service';
import { AzureMonitoringService } from './azure-monitoring.service';

export interface ABTestVariant {
  id: string;
  name: string;
  description: string;
  weight: number; // Percentage of traffic (0-100)
  config: Record<string, any>;
  isControl: boolean;
}

export interface ABTest {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate: Date;
  endDate?: Date;
  variants: ABTestVariant[];
  metrics: string[];
  targetAudience?: {
    userType?: string[];
    location?: string[];
    device?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ABTestResult {
  testId: string;
  variantId: string;
  userId: string;
  sessionId: string;
  timestamp: Date;
  metrics: Record<string, number>;
  conversionEvents: string[];
}

export interface ABTestAnalytics {
  testId: string;
  variants: Array<{
    variantId: string;
    name: string;
    participants: number;
    conversions: number;
    conversionRate: number;
    metrics: Record<string, {
      average: number;
      total: number;
      count: number;
    }>;
    confidence: number;
    isWinner: boolean;
  }>;
  totalParticipants: number;
  duration: number; // days
  status: string;
  recommendations: string[];
}

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);
  private tests: Map<string, ABTest> = new Map();
  private results: Map<string, ABTestResult[]> = new Map();

  constructor(
    private configService: ConfigService,
    private cacheService: CacheService,
    private azureMonitoringService: AzureMonitoringService
  ) {
    this.initializeDefaultTests();
  }

  /**
   * Initialize default A/B tests for content optimization
   */
  private initializeDefaultTests(): void {
    const defaultTests: ABTest[] = [
      {
        id: 'content-structure-test',
        name: 'Content Structure Optimization',
        description: 'Test different content structures for better engagement',
        status: 'running',
        startDate: new Date(),
        variants: [
          {
            id: 'control',
            name: 'Standard Structure',
            description: 'Traditional blog post structure',
            weight: 50,
            config: {
              structure: 'traditional',
              headingStyle: 'h2',
              paragraphLength: 'medium',
              includeTableOfContents: false
            },
            isControl: true
          },
          {
            id: 'optimized',
            name: 'Optimized Structure',
            description: 'AI-optimized structure with better readability',
            weight: 50,
            config: {
              structure: 'optimized',
              headingStyle: 'h3',
              paragraphLength: 'short',
              includeTableOfContents: true
            },
            isControl: false
          }
        ],
        metrics: ['readTime', 'engagementRate', 'bounceRate', 'shareCount'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'cta-placement-test',
        name: 'Call-to-Action Placement',
        description: 'Test different CTA placements for better conversion',
        status: 'running',
        startDate: new Date(),
        variants: [
          {
            id: 'bottom-cta',
            name: 'Bottom CTA',
            description: 'CTA at the end of content',
            weight: 33,
            config: {
              ctaPlacement: 'bottom',
              ctaStyle: 'button',
              ctaText: 'Learn More'
            },
            isControl: true
          },
          {
            id: 'middle-cta',
            name: 'Middle CTA',
            description: 'CTA in the middle of content',
            weight: 33,
            config: {
              ctaPlacement: 'middle',
              ctaStyle: 'button',
              ctaText: 'Get Started'
            },
            isControl: false
          },
          {
            id: 'multiple-cta',
            name: 'Multiple CTAs',
            description: 'CTAs at multiple positions',
            weight: 34,
            config: {
              ctaPlacement: 'multiple',
              ctaStyle: 'button',
              ctaText: 'Take Action'
            },
            isControl: false
          }
        ],
        metrics: ['clickThroughRate', 'conversionRate', 'timeToConversion'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'tone-optimization-test',
        name: 'Content Tone Optimization',
        description: 'Test different content tones for audience engagement',
        status: 'running',
        startDate: new Date(),
        variants: [
          {
            id: 'professional',
            name: 'Professional Tone',
            description: 'Formal, business-oriented tone',
            weight: 50,
            config: {
              tone: 'professional',
              vocabulary: 'formal',
              sentenceLength: 'long'
            },
            isControl: true
          },
          {
            id: 'conversational',
            name: 'Conversational Tone',
            description: 'Friendly, approachable tone',
            weight: 50,
            config: {
              tone: 'conversational',
              vocabulary: 'casual',
              sentenceLength: 'short'
            },
            isControl: false
          }
        ],
        metrics: ['engagementRate', 'readabilityScore', 'socialShares'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    defaultTests.forEach(test => {
      this.tests.set(test.id, test);
      this.results.set(test.id, []);
    });

    this.logger.log(`Initialized ${defaultTests.length} default A/B tests`);
  }

  /**
   * Create a new A/B test
   */
  async createTest(test: Omit<ABTest, 'id' | 'createdAt' | 'updatedAt'>): Promise<ABTest> {
    try {
      const testId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      const newTest: ABTest = {
        ...test,
        id: testId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate variant weights sum to 100
      const totalWeight = newTest.variants.reduce((sum, variant) => sum + variant.weight, 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        throw new Error('Variant weights must sum to 100%');
      }

      this.tests.set(testId, newTest);
      this.results.set(testId, []);

      // Cache the test
      await this.cacheService.set(`ab-test:${testId}`, newTest, { ttl: 3600 });

      this.logger.log(`Created A/B test: ${newTest.name} (${testId})`);

      // Track test creation
      this.azureMonitoringService.trackEvent({
        name: 'ABTestCreated',
        properties: {
          testId,
          testName: newTest.name,
          variantCount: newTest.variants.length.toString(),
          metrics: newTest.metrics.join(',')
        }
      });

      return newTest;

    } catch (error) {
      this.logger.error('Failed to create A/B test:', error);
      throw error;
    }
  }

  /**
   * Get variant for a user (assignment logic)
   */
  async getVariantForUser(testId: string, userId: string, sessionId?: string): Promise<ABTestVariant | null> {
    try {
      const test = this.tests.get(testId);
      if (!test || test.status !== 'running') {
        return null;
      }

      // Check cache first
      const cacheKey = `ab-assignment:${testId}:${userId}`;
      const cachedVariant = await this.cacheService.get<ABTestVariant>(cacheKey);
      if (cachedVariant) {
        return cachedVariant;
      }

      // Assign variant based on user ID hash
      const hash = this.hashString(`${testId}:${userId}`);
      const percentage = hash % 100;
      
      let cumulativeWeight = 0;
      let selectedVariant: ABTestVariant | null = null;

      for (const variant of test.variants) {
        cumulativeWeight += variant.weight;
        if (percentage < cumulativeWeight) {
          selectedVariant = variant;
          break;
        }
      }

      if (selectedVariant) {
        // Cache assignment for consistency
        await this.cacheService.set(cacheKey, selectedVariant, { ttl: 86400 }); // 24 hours

        // Track assignment
        this.azureMonitoringService.trackEvent({
          name: 'ABTestAssignment',
          properties: {
            testId,
            variantId: selectedVariant.id,
            userId,
            sessionId: sessionId || 'unknown'
          }
        });
      }

      return selectedVariant;

    } catch (error) {
      this.logger.error(`Failed to get variant for user ${userId} in test ${testId}:`, error);
      return null;
    }
  }

  /**
   * Record test result/metric
   */
  async recordResult(result: Omit<ABTestResult, 'timestamp'>): Promise<boolean> {
    try {
      const test = this.tests.get(result.testId);
      if (!test) {
        this.logger.warn(`Test ${result.testId} not found`);
        return false;
      }

      const fullResult: ABTestResult = {
        ...result,
        timestamp: new Date()
      };

      // Add to results
      const testResults = this.results.get(result.testId) || [];
      testResults.push(fullResult);
      this.results.set(result.testId, testResults);

      // Track result
      this.azureMonitoringService.trackEvent({
        name: 'ABTestResult',
        properties: {
          testId: result.testId,
          variantId: result.variantId,
          userId: result.userId,
          conversionEvents: result.conversionEvents.join(',')
        }
      });

      // Track metrics
      Object.entries(result.metrics).forEach(([metric, value]) => {
        this.azureMonitoringService.trackMetric({
          name: `ABTest_${metric}`,
          value,
          properties: {
            testId: result.testId,
            variantId: result.variantId
          }
        });
      });

      return true;

    } catch (error) {
      this.logger.error('Failed to record A/B test result:', error);
      return false;
    }
  }

  /**
   * Get test analytics
   */
  async getTestAnalytics(testId: string): Promise<ABTestAnalytics | null> {
    try {
      const test = this.tests.get(testId);
      const results = this.results.get(testId);

      if (!test || !results) {
        return null;
      }

      const variantAnalytics = test.variants.map(variant => {
        const variantResults = results.filter(r => r.variantId === variant.id);
        const participants = new Set(variantResults.map(r => r.userId)).size;
        const conversions = variantResults.filter(r => r.conversionEvents.length > 0).length;
        const conversionRate = participants > 0 ? (conversions / participants) * 100 : 0;

        // Calculate metric averages
        const metrics: Record<string, { average: number; total: number; count: number }> = {};
        test.metrics.forEach(metric => {
          const values = variantResults
            .map(r => r.metrics[metric])
            .filter(v => v !== undefined);
          
          metrics[metric] = {
            average: values.length > 0 ? values.reduce((sum, v) => sum + v, 0) / values.length : 0,
            total: values.reduce((sum, v) => sum + v, 0),
            count: values.length
          };
        });

        return {
          variantId: variant.id,
          name: variant.name,
          participants,
          conversions,
          conversionRate,
          metrics,
          confidence: this.calculateConfidence(variantResults, test.variants.find(v => v.isControl)?.id === variant.id),
          isWinner: false // Will be determined later
        };
      });

      // Determine winner (highest conversion rate with sufficient confidence)
      const sortedVariants = variantAnalytics
        .filter(v => v.confidence >= 95)
        .sort((a, b) => b.conversionRate - a.conversionRate);
      
      if (sortedVariants.length > 0) {
        sortedVariants[0].isWinner = true;
      }

      const totalParticipants = variantAnalytics.reduce((sum, v) => sum + v.participants, 0);
      const duration = Math.ceil((Date.now() - test.startDate.getTime()) / (1000 * 60 * 60 * 24));

      const recommendations = this.generateRecommendations(variantAnalytics, test);

      return {
        testId,
        variants: variantAnalytics,
        totalParticipants,
        duration,
        status: test.status,
        recommendations
      };

    } catch (error) {
      this.logger.error(`Failed to get analytics for test ${testId}:`, error);
      return null;
    }
  }

  /**
   * Get all tests
   */
  getTests(): ABTest[] {
    return Array.from(this.tests.values());
  }

  /**
   * Get test by ID
   */
  getTest(testId: string): ABTest | undefined {
    return this.tests.get(testId);
  }

  /**
   * Update test status
   */
  async updateTestStatus(testId: string, status: ABTest['status']): Promise<boolean> {
    try {
      const test = this.tests.get(testId);
      if (!test) {
        return false;
      }

      test.status = status;
      test.updatedAt = new Date();

      if (status === 'completed') {
        test.endDate = new Date();
      }

      this.tests.set(testId, test);

      // Update cache
      await this.cacheService.set(`ab-test:${testId}`, test, { ttl: 3600 });

      this.logger.log(`Updated test ${testId} status to ${status}`);

      // Track status change
      this.azureMonitoringService.trackEvent({
        name: 'ABTestStatusChanged',
        properties: {
          testId,
          newStatus: status,
          testName: test.name
        }
      });

      return true;

    } catch (error) {
      this.logger.error(`Failed to update test ${testId} status:`, error);
      return false;
    }
  }

  /**
   * Hash string for consistent user assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Calculate statistical confidence (simplified)
   */
  private calculateConfidence(results: ABTestResult[], isControl: boolean): number {
    // Simplified confidence calculation
    // In production, you'd use proper statistical methods
    const sampleSize = new Set(results.map(r => r.userId)).size;
    
    if (sampleSize < 30) return 0;
    if (sampleSize < 100) return 70;
    if (sampleSize < 500) return 85;
    if (sampleSize < 1000) return 95;
    return 99;
  }

  /**
   * Generate recommendations based on test results
   */
  private generateRecommendations(variants: any[], test: ABTest): string[] {
    const recommendations: string[] = [];
    
    const winner = variants.find(v => v.isWinner);
    if (winner) {
      recommendations.push(`Implement variant "${winner.name}" as it shows ${winner.conversionRate.toFixed(1)}% conversion rate`);
    }

    const lowPerformers = variants.filter(v => v.conversionRate < 1);
    if (lowPerformers.length > 0) {
      recommendations.push(`Consider discontinuing variants with low conversion rates: ${lowPerformers.map(v => v.name).join(', ')}`);
    }

    if (variants.every(v => v.confidence < 95)) {
      recommendations.push('Continue test to reach statistical significance (95% confidence)');
    }

    return recommendations;
  }
}
