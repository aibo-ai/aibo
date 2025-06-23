import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// User profile interfaces
interface UserPersona {
  id: string;
  name: string;
  age: string;
  income: string;
  lifestyle: string;
  sleepChallenges: string[];
  preferences: string[];
  purchaseDrivers: string[];
  marketSize: number;
  growthRate: number;
  avatar: string;
  description: string;
}

interface JourneyStage {
  stage: string;
  touchpoints: string[];
  painPoints: string[];
  opportunities: string[];
  duration: string;
  conversionRate: number;
}

interface BehavioralInsight {
  insight: string;
  segment: string;
  prevalence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  recommendation: string;
}

interface Segment {
  name: string;
  size: number;
  growth: number;
  value: number;
  characteristics: string[];
  color: string;
}

const UserProfileDashboard: React.FC = () => {
  const [selectedPersona, setSelectedPersona] = useState('all');
  const [viewMode, setViewMode] = useState('personas');

  // Mock user personas
  const userPersonas: UserPersona[] = [
    {
      id: 'health-conscious-professional',
      name: 'Health-Conscious Professional',
      age: '28-42',
      income: '$75K-$150K',
      lifestyle: 'Busy, health-focused, tech-savvy',
      sleepChallenges: ['Stress-related insomnia', 'Back pain', 'Temperature regulation'],
      preferences: ['Organic materials', 'Smart features', 'Firm support'],
      purchaseDrivers: ['Health benefits', 'Quality', 'Technology integration'],
      marketSize: 2.8,
      growthRate: 15.2,
      avatar: '👩‍💼',
      description: 'Urban professionals prioritizing health and wellness through quality sleep'
    },
    {
      id: 'young-family',
      name: 'Young Family',
      age: '25-38',
      income: '$50K-$100K',
      lifestyle: 'Family-oriented, budget-conscious, practical',
      sleepChallenges: ['Partner disturbance', 'Space constraints', 'Durability concerns'],
      preferences: ['Motion isolation', 'Value for money', 'Easy maintenance'],
      purchaseDrivers: ['Price', 'Durability', 'Family needs'],
      marketSize: 3.2,
      growthRate: 8.7,
      avatar: '👨‍👩‍👧‍👦',
      description: 'Growing families seeking practical sleep solutions within budget'
    },
    {
      id: 'active-seniors',
      name: 'Active Seniors',
      age: '55-70',
      income: '$60K-$120K',
      lifestyle: 'Health-conscious, active, quality-focused',
      sleepChallenges: ['Joint pain', 'Sleep quality decline', 'Medical conditions'],
      preferences: ['Orthopedic support', 'Easy access', 'Medical recommendations'],
      purchaseDrivers: ['Health benefits', 'Comfort', 'Doctor recommendations'],
      marketSize: 2.1,
      growthRate: 12.4,
      avatar: '👴',
      description: 'Health-focused seniors investing in quality sleep for active aging'
    },
    {
      id: 'luxury-seekers',
      name: 'Luxury Seekers',
      age: '35-55',
      income: '$150K+',
      lifestyle: 'Affluent, quality-focused, brand-conscious',
      sleepChallenges: ['High expectations', 'Customization needs', 'Premium experience'],
      preferences: ['Premium materials', 'Customization', 'Exclusive features'],
      purchaseDrivers: ['Luxury', 'Exclusivity', 'Premium experience'],
      marketSize: 1.5,
      growthRate: 18.9,
      avatar: '💎',
      description: 'Affluent consumers seeking premium, customized sleep experiences'
    },
    {
      id: 'eco-conscious',
      name: 'Eco-Conscious Consumer',
      age: '22-40',
      income: '$45K-$90K',
      lifestyle: 'Environmentally aware, value-driven, research-oriented',
      sleepChallenges: ['Chemical sensitivity', 'Environmental impact', 'Sustainability'],
      preferences: ['Organic materials', 'Sustainable production', 'Certifications'],
      purchaseDrivers: ['Sustainability', 'Health', 'Environmental impact'],
      marketSize: 1.9,
      growthRate: 22.1,
      avatar: '🌱',
      description: 'Environmentally conscious consumers prioritizing sustainable sleep products'
    },
    {
      id: 'tech-enthusiasts',
      name: 'Tech Enthusiasts',
      age: '25-45',
      income: '$70K-$140K',
      lifestyle: 'Tech-savvy, early adopters, data-driven',
      sleepChallenges: ['Sleep optimization', 'Data tracking', 'Integration needs'],
      preferences: ['Smart features', 'Data analytics', 'App integration'],
      purchaseDrivers: ['Technology', 'Innovation', 'Data insights'],
      marketSize: 1.3,
      growthRate: 28.5,
      avatar: '📱',
      description: 'Technology enthusiasts seeking smart, data-driven sleep solutions'
    }
  ];

  const journeyStages: JourneyStage[] = [
    {
      stage: 'Awareness',
      touchpoints: ['Social media ads', 'Search results', 'Word of mouth', 'Content marketing'],
      painPoints: ['Information overload', 'Conflicting reviews', 'Brand confusion'],
      opportunities: ['Educational content', 'Clear differentiation', 'Trusted reviews'],
      duration: '2-4 weeks',
      conversionRate: 15
    },
    {
      stage: 'Consideration',
      touchpoints: ['Website visits', 'Comparison sites', 'Reviews', 'Store visits'],
      painPoints: ['Too many options', 'Price comparison', 'Feature confusion'],
      opportunities: ['Comparison tools', 'Expert guidance', 'Clear value prop'],
      duration: '3-6 weeks',
      conversionRate: 35
    },
    {
      stage: 'Trial',
      touchpoints: ['Trial period', 'Customer service', 'Sleep tracking', 'Feedback'],
      painPoints: ['Adjustment period', 'Expectations vs reality', 'Support needs'],
      opportunities: ['Sleep coaching', 'Proactive support', 'Adjustment guidance'],
      duration: '30-100 days',
      conversionRate: 78
    },
    {
      stage: 'Purchase',
      touchpoints: ['Final decision', 'Payment', 'Delivery', 'Setup'],
      painPoints: ['Delivery logistics', 'Setup complexity', 'Final doubts'],
      opportunities: ['White glove service', 'Easy setup', 'Reassurance'],
      duration: '1-2 weeks',
      conversionRate: 92
    },
    {
      stage: 'Advocacy',
      touchpoints: ['Reviews', 'Referrals', 'Social sharing', 'Repeat purchase'],
      painPoints: ['Satisfaction decline', 'Competitor offers', 'Changing needs'],
      opportunities: ['Loyalty programs', 'Upgrade paths', 'Community building'],
      duration: 'Ongoing',
      conversionRate: 25
    }
  ];

  const behavioralInsights: BehavioralInsight[] = [
    {
      insight: 'Online research duration increased by 40%',
      segment: 'All segments',
      prevalence: 87,
      impact: 'high',
      actionable: true,
      recommendation: 'Enhance educational content and comparison tools'
    },
    {
      insight: 'Mobile research now dominates desktop',
      segment: 'Young Family, Tech Enthusiasts',
      prevalence: 72,
      impact: 'high',
      actionable: true,
      recommendation: 'Optimize mobile experience and mobile-first design'
    },
    {
      insight: 'Sustainability concerns drive 30% of decisions',
      segment: 'Eco-Conscious, Young Family',
      prevalence: 64,
      impact: 'medium',
      actionable: true,
      recommendation: 'Highlight sustainability credentials and certifications'
    },
    {
      insight: 'Trial period length expectations increased',
      segment: 'Health-Conscious Professional, Luxury Seekers',
      prevalence: 58,
      impact: 'medium',
      actionable: true,
      recommendation: 'Consider extending trial periods for premium segments'
    }
  ];

  const segments: Segment[] = [
    { name: 'Health-Conscious Professional', size: 28, growth: 15.2, value: 1850, characteristics: ['High income', 'Quality focused'], color: productXColors.primary[500] },
    { name: 'Young Family', size: 32, growth: 8.7, value: 950, characteristics: ['Budget conscious', 'Practical'], color: productXColors.secondary[500] },
    { name: 'Active Seniors', size: 21, growth: 12.4, value: 1650, characteristics: ['Health focused', 'Quality seeking'], color: productXColors.accent[500] },
    { name: 'Luxury Seekers', size: 15, growth: 18.9, value: 3200, characteristics: ['Premium focused', 'Customization'], color: productXColors.alert[400] },
    { name: 'Eco-Conscious', size: 19, growth: 22.1, value: 1200, characteristics: ['Sustainability focused'], color: '#10B981' },
    { name: 'Tech Enthusiasts', size: 13, growth: 28.5, value: 2100, characteristics: ['Innovation focused'], color: '#8B5CF6' }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return productXColors.alert[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.secondary[500];
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
              👥 User Profile Intelligence
            </h1>
            <p className="text-gray-600">
              Deep insights into customer personas, behaviors, and journey optimization
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="personas">Personas</option>
              <option value="journey">Journey Mapping</option>
              <option value="segments">Segmentation</option>
              <option value="insights">Behavioral Insights</option>
            </select>
            <select 
              value={selectedPersona}
              onChange={(e) => setSelectedPersona(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Personas</option>
              {userPersonas.map(persona => (
                <option key={persona.id} value={persona.id}>{persona.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Personas</p>
              <p className="text-2xl font-bold text-gray-900">{userPersonas.length}</p>
              <p className="text-sm text-green-600">↗ Comprehensive coverage</p>
            </div>
            <div className="text-3xl">🎭</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Market Size</p>
              <p className="text-2xl font-bold text-gray-900">12.8M</p>
              <p className="text-sm text-green-600">↗ Addressable users</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">17.6%</p>
              <p className="text-sm text-green-600">↗ Across segments</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Journey Stages</p>
              <p className="text-2xl font-bold text-gray-900">{journeyStages.length}</p>
              <p className="text-sm text-blue-600">→ Mapped touchpoints</p>
            </div>
            <div className="text-3xl">🗺️</div>
          </div>
        </div>
      </div>

      {/* User Personas */}
      {viewMode === 'personas' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
          {userPersonas.map((persona) => (
            <div key={persona.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <span className="text-3xl">{persona.avatar}</span>
                <div>
                  <h3 className="font-semibold text-gray-900">{persona.name}</h3>
                  <p className="text-sm text-gray-500">{persona.age} • {persona.income}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">{persona.description}</p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Market Size</p>
                  <p className="font-medium">{persona.marketSize}M users</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Growth Rate</p>
                  <p className="font-medium text-green-600">+{persona.growthRate}%</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Sleep Challenges</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.sleepChallenges.slice(0, 2).map((challenge, idx) => (
                      <span key={idx} className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">
                        {challenge}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Preferences</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.preferences.slice(0, 2).map((pref, idx) => (
                      <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {pref}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Purchase Drivers</p>
                  <div className="flex flex-wrap gap-1">
                    {persona.purchaseDrivers.slice(0, 2).map((driver, idx) => (
                      <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {driver}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journey Mapping */}
      {viewMode === 'journey' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🗺️ Customer Journey Mapping</h3>
          <div className="space-y-6">
            {journeyStages.map((stage, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{stage.stage}</h4>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-500">Duration: {stage.duration}</span>
                    <span className="font-medium text-green-600">
                      {stage.conversionRate}% conversion
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs font-medium text-blue-600 mb-2">TOUCHPOINTS</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {stage.touchpoints.map((touchpoint, idx) => (
                        <li key={idx}>• {touchpoint}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-red-600 mb-2">PAIN POINTS</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {stage.painPoints.map((pain, idx) => (
                        <li key={idx}>• {pain}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <p className="text-xs font-medium text-green-600 mb-2">OPPORTUNITIES</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {stage.opportunities.map((opp, idx) => (
                        <li key={idx}>• {opp}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Segmentation */}
      {viewMode === 'segments' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Market Segmentation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <h4 className="font-medium text-gray-900">{segment.name}</h4>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-500">Size</p>
                    <p className="font-medium">{segment.size}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Growth</p>
                    <p className="font-medium text-green-600">+{segment.growth}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Avg Value</p>
                    <p className="font-medium">${segment.value}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Traits</p>
                    <p className="font-medium">{segment.characteristics.length}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1">Key Characteristics</p>
                  <div className="flex flex-wrap gap-1">
                    {segment.characteristics.map((char, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {char}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Behavioral Insights */}
      {viewMode === 'insights' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🧠 Behavioral Insights</h3>
          <div className="space-y-4">
            {behavioralInsights.map((insight, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 mb-1">{insight.insight}</h4>
                    <p className="text-sm text-gray-600">Segment: {insight.segment}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getImpactColor(insight.impact) }}
                    >
                      {insight.impact.toUpperCase()}
                    </span>
                    {insight.actionable && (
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        ACTIONABLE
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Prevalence:</span>
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${insight.prevalence}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-medium">{insight.prevalence}%</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>Recommendation:</strong> {insight.recommendation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDashboard;
