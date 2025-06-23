import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Competitor data interfaces
interface Competitor {
  id: string;
  name: string;
  marketShare: number;
  priceRange: { min: number; max: number };
  recentChanges: string[];
  strengths: string[];
  weaknesses: string[];
  threat: 'high' | 'medium' | 'low';
  logo: string;
}

interface PriceAlert {
  id: string;
  competitor: string;
  product: string;
  oldPrice: number;
  newPrice: number;
  change: number;
  timestamp: string;
  impact: 'high' | 'medium' | 'low';
}

interface FeatureComparison {
  feature: string;
  sleepCompany: boolean;
  competitors: { [key: string]: boolean };
  importance: 'high' | 'medium' | 'low';
}

const CompetitiveIntelligenceDashboard: React.FC = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState('all');
  const [timeframe, setTimeframe] = useState('30d');

  // Mock competitor data
  const competitors: Competitor[] = [
    {
      id: 'purple',
      name: 'Purple',
      marketShare: 18.5,
      priceRange: { min: 599, max: 2999 },
      recentChanges: ['15% price reduction on premium models', 'New cooling technology launch'],
      strengths: ['Innovative gel grid technology', 'Strong online presence', 'Celebrity endorsements'],
      weaknesses: ['Limited physical stores', 'Higher price point', 'Niche appeal'],
      threat: 'high',
      logo: '🟣'
    },
    {
      id: 'casper',
      name: 'Casper',
      marketShare: 22.3,
      priceRange: { min: 395, max: 2395 },
      recentChanges: ['Expanded retail partnerships', 'Launched sleep accessories line'],
      strengths: ['Brand recognition', 'Retail presence', 'Sleep ecosystem'],
      weaknesses: ['Profitability challenges', 'Increased competition', 'Generic positioning'],
      threat: 'high',
      logo: '💤'
    },
    {
      id: 'tempur',
      name: 'Tempur-Pedic',
      marketShare: 15.7,
      priceRange: { min: 1199, max: 4999 },
      recentChanges: ['Premium positioning reinforcement', 'Smart bed technology integration'],
      strengths: ['Premium brand', 'Memory foam expertise', 'Medical endorsements'],
      weaknesses: ['High prices', 'Slow innovation', 'Limited online presence'],
      threat: 'medium',
      logo: '🛏️'
    },
    {
      id: 'tuft',
      name: 'Tuft & Needle',
      marketShare: 8.9,
      priceRange: { min: 350, max: 1195 },
      recentChanges: ['Acquired by Serta Simmons', 'Simplified product line'],
      strengths: ['Simple messaging', 'Value positioning', 'Quality materials'],
      weaknesses: ['Limited differentiation', 'Acquisition uncertainty', 'Small scale'],
      threat: 'low',
      logo: '🌿'
    }
  ];

  const priceAlerts: PriceAlert[] = [
    {
      id: '1',
      competitor: 'Purple',
      product: 'Purple Hybrid Premier 3',
      oldPrice: 2199,
      newPrice: 1869,
      change: -15.0,
      timestamp: '2 hours ago',
      impact: 'high'
    },
    {
      id: '2',
      competitor: 'Casper',
      product: 'Wave Hybrid',
      oldPrice: 1695,
      newPrice: 1525,
      change: -10.0,
      timestamp: '5 hours ago',
      impact: 'medium'
    },
    {
      id: '3',
      competitor: 'Tuft & Needle',
      product: 'Original Mattress',
      oldPrice: 575,
      newPrice: 632,
      change: 9.9,
      timestamp: '1 day ago',
      impact: 'low'
    }
  ];

  const featureComparison: FeatureComparison[] = [
    {
      feature: 'Cooling Technology',
      sleepCompany: true,
      competitors: { Purple: true, Casper: false, 'Tempur-Pedic': true, 'Tuft & Needle': false },
      importance: 'high'
    },
    {
      feature: 'Zoned Support',
      sleepCompany: true,
      competitors: { Purple: true, Casper: true, 'Tempur-Pedic': true, 'Tuft & Needle': false },
      importance: 'high'
    },
    {
      feature: 'Organic Materials',
      sleepCompany: false,
      competitors: { Purple: false, Casper: false, 'Tempur-Pedic': false, 'Tuft & Needle': true },
      importance: 'medium'
    },
    {
      feature: 'Smart Technology',
      sleepCompany: false,
      competitors: { Purple: false, Casper: false, 'Tempur-Pedic': true, 'Tuft & Needle': false },
      importance: 'medium'
    },
    {
      feature: 'Trial Period (Days)',
      sleepCompany: true,
      competitors: { Purple: true, Casper: true, 'Tempur-Pedic': true, 'Tuft & Needle': true },
      importance: 'high'
    }
  ];

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case 'high': return productXColors.alert[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.secondary[500];
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

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return productXColors.alert[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.neutral[400];
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
              🎯 Competitive Intelligence
            </h1>
            <p className="text-gray-600">
              Real-time competitor monitoring and analysis for strategic advantage
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedCompetitor}
              onChange={(e) => setSelectedCompetitor(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="all">All Competitors</option>
              {competitors.map(comp => (
                <option key={comp.id} value={comp.id}>{comp.name}</option>
              ))}
            </select>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tracked Competitors</p>
              <p className="text-2xl font-bold text-gray-900">{competitors.length}</p>
              <p className="text-sm text-blue-600">→ Active monitoring</p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Price Changes</p>
              <p className="text-2xl font-bold text-gray-900">{priceAlerts.length}</p>
              <p className="text-sm text-red-600">↓ Last 24h</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Threat Level</p>
              <p className="text-2xl font-bold text-gray-900">
                {competitors.filter(c => c.threat === 'high').length}
              </p>
              <p className="text-sm text-red-600">⚠ Requires attention</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Market Coverage</p>
              <p className="text-2xl font-bold text-gray-900">65.4%</p>
              <p className="text-sm text-green-600">↗ Combined share</p>
            </div>
            <div className="text-3xl">📊</div>
          </div>
        </div>
      </div>

      {/* Price Alerts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">🚨 Recent Price Changes</h3>
        <div className="space-y-4">
          {priceAlerts.map((alert) => (
            <div key={alert.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-4">
                <div>
                  <h4 className="font-medium text-gray-900">{alert.competitor} - {alert.product}</h4>
                  <p className="text-sm text-gray-500">{alert.timestamp}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">
                    ${alert.oldPrice} → ${alert.newPrice}
                  </div>
                  <div className={`font-medium ${alert.change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {alert.change > 0 ? '+' : ''}{alert.change.toFixed(1)}%
                  </div>
                </div>
                <span 
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getImpactColor(alert.impact) }}
                >
                  {alert.impact.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Competitor Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitor Overview</h3>
          <div className="space-y-4">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{competitor.logo}</span>
                    <div>
                      <h4 className="font-medium text-gray-900">{competitor.name}</h4>
                      <p className="text-sm text-gray-500">Market Share: {competitor.marketShare}%</p>
                    </div>
                  </div>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getThreatColor(competitor.threat) }}
                  >
                    {competitor.threat.toUpperCase()} THREAT
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Price Range</p>
                    <p className="font-medium">${competitor.priceRange.min} - ${competitor.priceRange.max}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Recent Changes</p>
                    <p className="font-medium">{competitor.recentChanges.length} updates</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Feature Comparison Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 font-medium">Feature</th>
                  <th className="text-center py-2 font-medium">Sleep Co.</th>
                  <th className="text-center py-2 font-medium">Purple</th>
                  <th className="text-center py-2 font-medium">Casper</th>
                  <th className="text-center py-2 font-medium">Tempur</th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((feature, index) => (
                  <tr key={index} className="border-b border-gray-100">
                    <td className="py-2 font-medium">
                      <div className="flex items-center space-x-2">
                        <span>{feature.feature}</span>
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: getImportanceColor(feature.importance) }}
                        ></div>
                      </div>
                    </td>
                    <td className="text-center py-2">
                      {feature.sleepCompany ? '✅' : '❌'}
                    </td>
                    <td className="text-center py-2">
                      {feature.competitors.Purple ? '✅' : '❌'}
                    </td>
                    <td className="text-center py-2">
                      {feature.competitors.Casper ? '✅' : '❌'}
                    </td>
                    <td className="text-center py-2">
                      {feature.competitors['Tempur-Pedic'] ? '✅' : '❌'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SWOT Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitive SWOT Analysis</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {competitors.map((competitor) => (
            <div key={competitor.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <span className="text-xl">{competitor.logo}</span>
                <h4 className="font-medium text-gray-900">{competitor.name}</h4>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">STRENGTHS</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {competitor.strengths.slice(0, 2).map((strength, idx) => (
                      <li key={idx}>• {strength}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">WEAKNESSES</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {competitor.weaknesses.slice(0, 2).map((weakness, idx) => (
                      <li key={idx}>• {weakness}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompetitiveIntelligenceDashboard;
