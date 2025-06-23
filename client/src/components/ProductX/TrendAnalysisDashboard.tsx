import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Trend data interfaces
interface Trend {
  id: string;
  name: string;
  strength: number;
  confidence: number;
  growth: number;
  category: 'technology' | 'consumer' | 'market' | 'regulatory';
  timeline: 'emerging' | 'growing' | 'mature' | 'declining';
  impact: 'high' | 'medium' | 'low';
  description: string;
  keyDrivers: string[];
}

interface TechnologyAdoption {
  technology: string;
  adoptionRate: number;
  marketPenetration: number;
  growthRate: number;
  maturityStage: 'innovation' | 'early-adoption' | 'early-majority' | 'late-majority' | 'laggards';
}

interface ConsumerBehavior {
  behavior: string;
  prevalence: number;
  change: number;
  demographic: string;
  impact: 'high' | 'medium' | 'low';
  timeframe: string;
}

interface Prediction {
  id: string;
  title: string;
  probability: number;
  timeframe: string;
  impact: 'high' | 'medium' | 'low';
  category: string;
  description: string;
  confidence: number;
}

const TrendAnalysisDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [timeHorizon, setTimeHorizon] = useState('12m');

  // Mock trend data
  const trends: Trend[] = [
    {
      id: '1',
      name: 'Smart Sleep Technology',
      strength: 85,
      confidence: 92,
      growth: 45.2,
      category: 'technology',
      timeline: 'growing',
      impact: 'high',
      description: 'IoT-enabled mattresses with sleep tracking and environmental control',
      keyDrivers: ['Health consciousness', 'IoT adoption', 'Data-driven wellness']
    },
    {
      id: '2',
      name: 'Sustainable Materials',
      strength: 78,
      confidence: 88,
      growth: 32.1,
      category: 'consumer',
      timeline: 'growing',
      impact: 'high',
      description: 'Eco-friendly, organic, and recyclable mattress materials',
      keyDrivers: ['Environmental awareness', 'Millennial preferences', 'Regulatory pressure']
    },
    {
      id: '3',
      name: 'Personalized Sleep Solutions',
      strength: 72,
      confidence: 85,
      growth: 28.7,
      category: 'consumer',
      timeline: 'emerging',
      impact: 'medium',
      description: 'Customized mattresses based on individual sleep patterns and preferences',
      keyDrivers: ['Data analytics', 'Consumer demand', 'Manufacturing flexibility']
    },
    {
      id: '4',
      name: 'Direct-to-Consumer Sales',
      strength: 90,
      confidence: 95,
      growth: 15.3,
      category: 'market',
      timeline: 'mature',
      impact: 'high',
      description: 'Online-first sales model with home delivery and trial periods',
      keyDrivers: ['E-commerce growth', 'Cost efficiency', 'Consumer convenience']
    }
  ];

  const technologyAdoption: TechnologyAdoption[] = [
    {
      technology: 'Sleep Tracking Sensors',
      adoptionRate: 23,
      marketPenetration: 12,
      growthRate: 67,
      maturityStage: 'early-adoption'
    },
    {
      technology: 'Temperature Regulation',
      adoptionRate: 45,
      marketPenetration: 28,
      growthRate: 34,
      maturityStage: 'early-majority'
    },
    {
      technology: 'Smart Adjustability',
      adoptionRate: 18,
      marketPenetration: 8,
      growthRate: 89,
      maturityStage: 'innovation'
    },
    {
      technology: 'Air Quality Control',
      adoptionRate: 12,
      marketPenetration: 5,
      growthRate: 156,
      maturityStage: 'innovation'
    }
  ];

  const consumerBehaviors: ConsumerBehavior[] = [
    {
      behavior: 'Online Mattress Research',
      prevalence: 87,
      change: 23,
      demographic: 'All ages',
      impact: 'high',
      timeframe: 'Last 2 years'
    },
    {
      behavior: 'Extended Trial Periods',
      prevalence: 72,
      change: 45,
      demographic: 'Millennials',
      impact: 'high',
      timeframe: 'Last 3 years'
    },
    {
      behavior: 'Sustainability Focus',
      prevalence: 64,
      change: 38,
      demographic: 'Gen Z, Millennials',
      impact: 'medium',
      timeframe: 'Last 2 years'
    },
    {
      behavior: 'Health-Driven Purchases',
      prevalence: 58,
      change: 29,
      demographic: 'All ages',
      impact: 'medium',
      timeframe: 'Last 18 months'
    }
  ];

  const predictions: Prediction[] = [
    {
      id: '1',
      title: 'Smart Mattresses Mainstream Adoption',
      probability: 78,
      timeframe: '18-24 months',
      impact: 'high',
      category: 'Technology',
      description: 'Smart mattresses with integrated sensors will reach 25% market penetration',
      confidence: 85
    },
    {
      id: '2',
      title: 'Subscription Sleep Services',
      probability: 65,
      timeframe: '12-18 months',
      impact: 'medium',
      category: 'Business Model',
      description: 'Monthly subscription services for sleep optimization will emerge',
      confidence: 72
    },
    {
      id: '3',
      title: 'Regulatory Changes for Materials',
      probability: 82,
      timeframe: '6-12 months',
      impact: 'high',
      category: 'Regulatory',
      description: 'New regulations will mandate disclosure of all mattress materials',
      confidence: 90
    }
  ];

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technology': return productXColors.primary[500];
      case 'consumer': return productXColors.secondary[500];
      case 'market': return productXColors.accent[500];
      case 'regulatory': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getTimelineColor = (timeline: string) => {
    switch (timeline) {
      case 'emerging': return productXColors.secondary[500];
      case 'growing': return productXColors.accent[500];
      case 'mature': return productXColors.primary[500];
      case 'declining': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return productXColors.alert[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.secondary[500];
      default: return productXColors.neutral[400];
    }
  };

  const getMaturityColor = (stage: string) => {
    switch (stage) {
      case 'innovation': return '#EF4444';
      case 'early-adoption': return '#F59E0B';
      case 'early-majority': return '#10B981';
      case 'late-majority': return '#3B82F6';
      case 'laggards': return '#6B7280';
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
              📈 Trend Analysis & Predictions
            </h1>
            <p className="text-gray-600">
              Advanced forecasting and trend identification for strategic planning
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Categories</option>
              <option value="technology">Technology</option>
              <option value="consumer">Consumer</option>
              <option value="market">Market</option>
              <option value="regulatory">Regulatory</option>
            </select>
            <select 
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="6m">6 Months</option>
              <option value="12m">12 Months</option>
              <option value="24m">24 Months</option>
              <option value="36m">36 Months</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Trends</p>
              <p className="text-2xl font-bold text-gray-900">{trends.length}</p>
              <p className="text-sm text-green-600">↗ 3 new this month</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">87.5%</p>
              <p className="text-sm text-blue-600">→ High accuracy</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Impact Trends</p>
              <p className="text-2xl font-bold text-gray-900">
                {trends.filter(t => t.impact === 'high').length}
              </p>
              <p className="text-sm text-red-600">⚠ Strategic focus</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Predictions</p>
              <p className="text-2xl font-bold text-gray-900">{predictions.length}</p>
              <p className="text-sm text-green-600">↗ Next 24 months</p>
            </div>
            <div className="text-3xl">🔮</div>
          </div>
        </div>
      </div>

      {/* Trend Strength Indicators */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🌟 Trend Strength & Confidence</h3>
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{trend.name}</h4>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getCategoryColor(trend.category) }}
                    >
                      {trend.category.toUpperCase()}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getTimelineColor(trend.timeline) }}
                    >
                      {trend.timeline.toUpperCase()}
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getImpactColor(trend.impact) }}
                    >
                      {trend.impact.toUpperCase()} IMPACT
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{trend.description}</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Strength</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${trend.strength}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{trend.strength}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Confidence</p>
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${trend.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium">{trend.confidence}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Growth</p>
                      <span className="text-sm font-medium text-green-600">+{trend.growth}%</span>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">Key Drivers:</p>
                <div className="flex flex-wrap gap-1">
                  {trend.keyDrivers.map((driver, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs">
                      {driver}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Technology Adoption Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Technology Adoption Curve</h3>
          <div className="space-y-4">
            {technologyAdoption.map((tech, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{tech.technology}</h4>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getMaturityColor(tech.maturityStage) }}
                  >
                    {tech.maturityStage.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Adoption</p>
                    <p className="font-medium">{tech.adoptionRate}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Penetration</p>
                    <p className="font-medium">{tech.marketPenetration}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Growth</p>
                    <p className="font-medium text-green-600">+{tech.growthRate}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">👥 Consumer Behavior Shifts</h3>
          <div className="space-y-4">
            {consumerBehaviors.map((behavior, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{behavior.behavior}</h4>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getImpactColor(behavior.impact) }}
                  >
                    {behavior.impact.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Prevalence</p>
                    <div className="flex items-center space-x-2">
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${behavior.prevalence}%` }}
                        ></div>
                      </div>
                      <span className="font-medium">{behavior.prevalence}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-500">Change</p>
                    <p className="font-medium text-green-600">+{behavior.change}%</p>
                  </div>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  {behavior.demographic} • {behavior.timeframe}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Future Predictions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🔮 Future Predictions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {predictions.map((prediction) => (
            <div key={prediction.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-medium text-gray-900">{prediction.title}</h4>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getImpactColor(prediction.impact) }}
                >
                  {prediction.impact.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3">{prediction.description}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Probability</span>
                  <span className="font-medium">{prediction.probability}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Timeframe</span>
                  <span className="font-medium">{prediction.timeframe}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Confidence</span>
                  <span className="font-medium">{prediction.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysisDashboard;
