import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Audience expansion interfaces
interface MarketOpportunity {
  id: string;
  market: string;
  size: number;
  growth: number;
  penetration: number;
  difficulty: 'low' | 'medium' | 'high';
  timeToEntry: string;
  investmentRequired: number;
  roiPotential: number;
  keyFactors: string[];
  risks: string[];
  region: string;
}

interface DemographicExpansion {
  demographic: string;
  currentPenetration: number;
  potentialSize: number;
  growthRate: number;
  barriers: string[];
  opportunities: string[];
  priority: 'high' | 'medium' | 'low';
  timeline: string;
}

interface UseCaseOpportunity {
  useCase: string;
  marketSize: number;
  currentShare: number;
  potentialShare: number;
  competitiveIntensity: 'low' | 'medium' | 'high';
  requirements: string[];
  advantages: string[];
  category: string;
}

interface ExpansionStrategy {
  strategy: string;
  description: string;
  investment: number;
  timeline: string;
  expectedROI: number;
  riskLevel: 'low' | 'medium' | 'high';
  keyMilestones: string[];
  successMetrics: string[];
}

const AudienceExpansionDashboard: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [viewMode, setViewMode] = useState('opportunities');

  // Mock market opportunities
  const marketOpportunities: MarketOpportunity[] = [
    {
      id: '1',
      market: 'Corporate Wellness Programs',
      size: 450,
      growth: 23.5,
      penetration: 8,
      difficulty: 'medium',
      timeToEntry: '6-12 months',
      investmentRequired: 2.5,
      roiPotential: 185,
      keyFactors: ['B2B sales capability', 'Bulk pricing', 'Corporate partnerships'],
      risks: ['Long sales cycles', 'Procurement complexity', 'Economic sensitivity'],
      region: 'North America'
    },
    {
      id: '2',
      market: 'Senior Living Communities',
      size: 320,
      growth: 18.7,
      penetration: 12,
      difficulty: 'low',
      timeToEntry: '3-6 months',
      investmentRequired: 1.2,
      roiPotential: 156,
      keyFactors: ['Medical endorsements', 'Specialized features', 'Facility partnerships'],
      risks: ['Regulatory requirements', 'Budget constraints', 'Decision complexity'],
      region: 'North America'
    },
    {
      id: '3',
      market: 'International Markets (Europe)',
      size: 680,
      growth: 15.2,
      penetration: 3,
      difficulty: 'high',
      timeToEntry: '12-18 months',
      investmentRequired: 8.5,
      roiPotential: 245,
      keyFactors: ['Local partnerships', 'Regulatory compliance', 'Cultural adaptation'],
      risks: ['Currency fluctuation', 'Regulatory barriers', 'Local competition'],
      region: 'Europe'
    },
    {
      id: '4',
      market: 'Student Housing',
      size: 180,
      growth: 12.8,
      penetration: 5,
      difficulty: 'medium',
      timeToEntry: '4-8 months',
      investmentRequired: 1.8,
      roiPotential: 142,
      keyFactors: ['Durability focus', 'Cost efficiency', 'University partnerships'],
      risks: ['Seasonal demand', 'Price sensitivity', 'Damage concerns'],
      region: 'North America'
    },
    {
      id: '5',
      market: 'Hospitality Industry',
      size: 520,
      growth: 9.5,
      penetration: 15,
      difficulty: 'medium',
      timeToEntry: '6-10 months',
      investmentRequired: 3.2,
      roiPotential: 128,
      keyFactors: ['Commercial durability', 'Brand partnerships', 'Volume pricing'],
      risks: ['Industry volatility', 'Long replacement cycles', 'Quality expectations'],
      region: 'Global'
    }
  ];

  const demographicExpansions: DemographicExpansion[] = [
    {
      demographic: 'Gen Z (18-25)',
      currentPenetration: 12,
      potentialSize: 2.8,
      growthRate: 28.5,
      barriers: ['Price sensitivity', 'Brand awareness', 'Purchase timing'],
      opportunities: ['Digital marketing', 'Influencer partnerships', 'Flexible payment'],
      priority: 'high',
      timeline: '6-12 months'
    },
    {
      demographic: 'High-Income Millennials',
      currentPenetration: 35,
      potentialSize: 4.2,
      growthRate: 18.7,
      barriers: ['Feature expectations', 'Comparison shopping', 'Sustainability concerns'],
      opportunities: ['Premium positioning', 'Smart features', 'Eco-friendly options'],
      priority: 'high',
      timeline: '3-6 months'
    },
    {
      demographic: 'Empty Nesters (50-65)',
      currentPenetration: 28,
      potentialSize: 3.5,
      growthRate: 15.2,
      barriers: ['Brand loyalty', 'Traditional preferences', 'Change resistance'],
      opportunities: ['Health benefits', 'Comfort focus', 'Medical endorsements'],
      priority: 'medium',
      timeline: '9-15 months'
    },
    {
      demographic: 'International Students',
      currentPenetration: 8,
      potentialSize: 1.2,
      growthRate: 22.1,
      barriers: ['Budget constraints', 'Temporary housing', 'Cultural differences'],
      opportunities: ['Rental programs', 'University partnerships', 'Cultural adaptation'],
      priority: 'medium',
      timeline: '12-18 months'
    }
  ];

  const useCaseOpportunities: UseCaseOpportunity[] = [
    {
      useCase: 'Recovery & Rehabilitation',
      marketSize: 280,
      currentShare: 5,
      potentialShare: 25,
      competitiveIntensity: 'low',
      requirements: ['Medical certifications', 'Therapeutic features', 'Healthcare partnerships'],
      advantages: ['Ergonomic expertise', 'Quality reputation', 'Innovation capability'],
      category: 'Healthcare'
    },
    {
      useCase: 'Athletic Performance',
      marketSize: 150,
      currentShare: 8,
      potentialShare: 30,
      competitiveIntensity: 'medium',
      requirements: ['Sports partnerships', 'Performance validation', 'Athlete endorsements'],
      advantages: ['Recovery focus', 'Technology integration', 'Performance tracking'],
      category: 'Sports'
    },
    {
      useCase: 'Pregnancy & Maternity',
      marketSize: 95,
      currentShare: 12,
      potentialShare: 40,
      competitiveIntensity: 'low',
      requirements: ['Medical approval', 'Safety certifications', 'Specialized design'],
      advantages: ['Comfort expertise', 'Health focus', 'Customization capability'],
      category: 'Healthcare'
    },
    {
      useCase: 'Remote Work Setup',
      marketSize: 220,
      currentShare: 3,
      potentialShare: 18,
      competitiveIntensity: 'high',
      requirements: ['Ergonomic validation', 'Workspace integration', 'Corporate sales'],
      advantages: ['Ergonomic leadership', 'Health benefits', 'Professional positioning'],
      category: 'Workplace'
    }
  ];

  const expansionStrategies: ExpansionStrategy[] = [
    {
      strategy: 'B2B Corporate Wellness',
      description: 'Target corporate wellness programs with bulk sales and employee benefits',
      investment: 2.5,
      timeline: '6-12 months',
      expectedROI: 185,
      riskLevel: 'medium',
      keyMilestones: ['Sales team hiring', 'Corporate partnerships', 'Pilot programs'],
      successMetrics: ['Corporate accounts', 'Bulk order volume', 'Employee satisfaction']
    },
    {
      strategy: 'International Expansion',
      description: 'Enter European markets through local partnerships and distribution',
      investment: 8.5,
      timeline: '12-18 months',
      expectedROI: 245,
      riskLevel: 'high',
      keyMilestones: ['Market research', 'Local partnerships', 'Regulatory approval'],
      successMetrics: ['Market penetration', 'Revenue growth', 'Brand recognition']
    },
    {
      strategy: 'Healthcare Partnerships',
      description: 'Develop medical-grade products for healthcare and rehabilitation markets',
      investment: 3.8,
      timeline: '9-15 months',
      expectedROI: 165,
      riskLevel: 'medium',
      keyMilestones: ['Medical certifications', 'Healthcare partnerships', 'Product development'],
      successMetrics: ['Medical endorsements', 'Healthcare sales', 'Patient outcomes']
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'low': return productXColors.secondary[500];
      case 'medium': return productXColors.accent[500];
      case 'high': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return productXColors.alert[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.secondary[500];
      default: return productXColors.neutral[400];
    }
  };

  const getCompetitiveIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'low': return productXColors.secondary[500];
      case 'medium': return productXColors.accent[500];
      case 'high': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return productXColors.secondary[500];
      case 'medium': return productXColors.accent[500];
      case 'high': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              🌐 Audience Expansion Opportunities
            </h1>
            <p className="text-gray-600">
              Strategic market expansion and audience development analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="opportunities">Market Opportunities</option>
              <option value="demographics">Demographics</option>
              <option value="usecases">Use Cases</option>
              <option value="strategies">Strategies</option>
            </select>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Regions</option>
              <option value="north-america">North America</option>
              <option value="europe">Europe</option>
              <option value="asia-pacific">Asia Pacific</option>
              <option value="global">Global</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Market Opportunities</p>
              <p className="text-2xl font-bold text-gray-900">{marketOpportunities.length}</p>
              <p className="text-sm text-green-600">↗ High potential</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Market Size</p>
              <p className="text-2xl font-bold text-gray-900">$2.15B</p>
              <p className="text-sm text-green-600">↗ Addressable</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg ROI Potential</p>
              <p className="text-2xl font-bold text-gray-900">171%</p>
              <p className="text-sm text-green-600">↗ Strong returns</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Quick Wins</p>
              <p className="text-2xl font-bold text-gray-900">
                {marketOpportunities.filter(o => o.difficulty === 'low').length}
              </p>
              <p className="text-sm text-green-600">↗ Low difficulty</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>
      </div>

      {/* Market Opportunities */}
      {viewMode === 'opportunities' && (
        <div className="space-y-6">
          {marketOpportunities.map((opportunity) => (
            <div key={opportunity.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{opportunity.market}</h3>
                  <p className="text-sm text-gray-500">{opportunity.region}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getDifficultyColor(opportunity.difficulty) }}
                  >
                    {opportunity.difficulty.toUpperCase()} DIFFICULTY
                  </span>
                  <span className="text-sm text-gray-500">{opportunity.timeToEntry}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Market Size</p>
                  <p className="font-semibold">${opportunity.size}M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Growth Rate</p>
                  <p className="font-semibold text-green-600">+{opportunity.growth}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Penetration</p>
                  <p className="font-semibold">{opportunity.penetration}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Investment Required</p>
                  <p className="font-semibold">${opportunity.investmentRequired}M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">ROI Potential</p>
                  <p className="font-semibold text-green-600">{opportunity.roiPotential}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">KEY SUCCESS FACTORS</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {opportunity.keyFactors.map((factor, idx) => (
                      <li key={idx}>• {factor}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 mb-2">POTENTIAL RISKS</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {opportunity.risks.map((risk, idx) => (
                      <li key={idx}>• {risk}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Demographic Expansion */}
      {viewMode === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {demographicExpansions.map((demo, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{demo.demographic}</h3>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getPriorityColor(demo.priority) }}
                >
                  {demo.priority.toUpperCase()} PRIORITY
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Current Penetration</p>
                  <p className="font-semibold">{demo.currentPenetration}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Potential Size</p>
                  <p className="font-semibold">{demo.potentialSize}M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Growth Rate</p>
                  <p className="font-semibold text-green-600">+{demo.growthRate}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">BARRIERS</p>
                  <div className="flex flex-wrap gap-1">
                    {demo.barriers.map((barrier, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        {barrier}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">OPPORTUNITIES</p>
                  <div className="flex flex-wrap gap-1">
                    {demo.opportunities.map((opp, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {opp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">Timeline: {demo.timeline}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Use Case Opportunities */}
      {viewMode === 'usecases' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {useCaseOpportunities.map((useCase, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{useCase.useCase}</h3>
                  <p className="text-sm text-gray-500">{useCase.category}</p>
                </div>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getCompetitiveIntensityColor(useCase.competitiveIntensity) }}
                >
                  {useCase.competitiveIntensity.toUpperCase()} COMPETITION
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Market Size</p>
                  <p className="font-semibold">${useCase.marketSize}M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Share</p>
                  <p className="font-semibold">{useCase.currentShare}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Potential Share</p>
                  <p className="font-semibold text-green-600">{useCase.potentialShare}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-1">REQUIREMENTS</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {useCase.requirements.map((req, idx) => (
                      <li key={idx}>• {req}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">OUR ADVANTAGES</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {useCase.advantages.map((adv, idx) => (
                      <li key={idx}>• {adv}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expansion Strategies */}
      {viewMode === 'strategies' && (
        <div className="space-y-6">
          {expansionStrategies.map((strategy, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{strategy.strategy}</h3>
                  <p className="text-gray-600">{strategy.description}</p>
                </div>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getRiskColor(strategy.riskLevel) }}
                >
                  {strategy.riskLevel.toUpperCase()} RISK
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Investment</p>
                  <p className="font-semibold">${strategy.investment}M</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Timeline</p>
                  <p className="font-semibold">{strategy.timeline}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected ROI</p>
                  <p className="font-semibold text-green-600">{strategy.expectedROI}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <p className="font-semibold">{strategy.riskLevel}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-2">KEY MILESTONES</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {strategy.keyMilestones.map((milestone, idx) => (
                      <li key={idx}>• {milestone}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">SUCCESS METRICS</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {strategy.successMetrics.map((metric, idx) => (
                      <li key={idx}>• {metric}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudienceExpansionDashboard;
