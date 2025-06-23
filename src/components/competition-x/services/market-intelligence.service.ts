import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface MarketIntelligenceData {
  marketSize: number;
  growthRate: number;
  keyPlayers: string[];
  trends: string[];
  opportunities: string[];
  threats: string[];
}

export interface CompetitorIntelligence {
  competitorId: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  strategies: string[];
  recentMoves: string[];
}

@Injectable()
export class MarketIntelligenceService {
  private readonly logger = new Logger(MarketIntelligenceService.name);

  constructor(private configService: ConfigService) {}

  async getMarketIntelligence(industry: string): Promise<MarketIntelligenceData> {
    try {
      this.logger.log(`Getting market intelligence for industry: ${industry}`);

      // Mock market intelligence data
      return {
        marketSize: 50000000000, // $50B
        growthRate: 0.15, // 15% annual growth
        keyPlayers: [
          'Market Leader Corp',
          'Innovation Inc',
          'Global Solutions Ltd',
          'Tech Pioneer Co',
          'Industry Giant LLC'
        ],
        trends: [
          'Digital transformation acceleration',
          'AI and automation adoption',
          'Sustainability focus',
          'Remote work solutions',
          'Customer experience enhancement'
        ],
        opportunities: [
          'Emerging markets expansion',
          'New technology integration',
          'Strategic partnerships',
          'Product innovation',
          'Market consolidation'
        ],
        threats: [
          'Economic uncertainty',
          'Regulatory changes',
          'New market entrants',
          'Technology disruption',
          'Supply chain challenges'
        ]
      };
    } catch (error) {
      this.logger.error('Error getting market intelligence:', error);
      throw error;
    }
  }

  async getCompetitorIntelligence(competitorId: string): Promise<CompetitorIntelligence> {
    try {
      this.logger.log(`Getting competitor intelligence for: ${competitorId}`);

      // Mock competitor intelligence data
      return {
        competitorId,
        marketShare: Math.random() * 0.3, // Random market share up to 30%
        strengths: [
          'Strong brand recognition',
          'Advanced technology stack',
          'Excellent customer service',
          'Global presence',
          'Innovation capabilities'
        ],
        weaknesses: [
          'High pricing strategy',
          'Limited market presence in emerging regions',
          'Slow product development cycle',
          'Customer acquisition costs',
          'Dependency on key partnerships'
        ],
        strategies: [
          'Market expansion strategy',
          'Product diversification',
          'Digital transformation',
          'Customer retention focus',
          'Cost optimization'
        ],
        recentMoves: [
          'Launched new product line',
          'Acquired smaller competitor',
          'Expanded to new geographic market',
          'Formed strategic partnership',
          'Invested in R&D capabilities'
        ]
      };
    } catch (error) {
      this.logger.error('Error getting competitor intelligence:', error);
      throw error;
    }
  }

  async analyzeMarketPosition(competitorId: string, industry: string): Promise<any> {
    try {
      const marketData = await this.getMarketIntelligence(industry);
      const competitorData = await this.getCompetitorIntelligence(competitorId);

      return {
        competitorId,
        industry,
        marketPosition: {
          rank: Math.floor(Math.random() * 10) + 1,
          marketShare: competitorData.marketShare,
          competitiveAdvantage: this.calculateCompetitiveAdvantage(competitorData),
          threatLevel: this.assessThreatLevel(competitorData, marketData)
        },
        recommendations: this.generateRecommendations(competitorData, marketData)
      };
    } catch (error) {
      this.logger.error('Error analyzing market position:', error);
      throw error;
    }
  }

  private calculateCompetitiveAdvantage(competitor: CompetitorIntelligence): string {
    const strengthScore = competitor.strengths.length;
    const weaknessScore = competitor.weaknesses.length;
    
    if (strengthScore > weaknessScore * 1.5) {
      return 'Strong';
    } else if (strengthScore > weaknessScore) {
      return 'Moderate';
    } else {
      return 'Weak';
    }
  }

  private assessThreatLevel(competitor: CompetitorIntelligence, market: MarketIntelligenceData): string {
    const marketShareThreshold = 0.15; // 15%
    const hasRecentActivity = competitor.recentMoves.length > 3;
    
    if (competitor.marketShare > marketShareThreshold && hasRecentActivity) {
      return 'High';
    } else if (competitor.marketShare > marketShareThreshold || hasRecentActivity) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  private generateRecommendations(competitor: CompetitorIntelligence, market: MarketIntelligenceData): string[] {
    const recommendations = [];

    if (competitor.marketShare > 0.2) {
      recommendations.push('Monitor pricing strategies closely');
      recommendations.push('Analyze their customer acquisition tactics');
    }

    if (competitor.strengths.includes('Advanced technology stack')) {
      recommendations.push('Invest in technology innovation');
      recommendations.push('Consider strategic technology partnerships');
    }

    if (market.growthRate > 0.1) {
      recommendations.push('Accelerate market expansion efforts');
      recommendations.push('Focus on customer retention strategies');
    }

    recommendations.push('Conduct regular competitive analysis');
    recommendations.push('Monitor their product development pipeline');

    return recommendations;
  }
}
