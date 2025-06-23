import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Market data interfaces
interface MarketSegment {
  name: string;
  size: number;
  growth: number;
  share: number;
  color: string;
}

interface GeographicData {
  region: string;
  penetration: number;
  growth: number;
  opportunity: 'high' | 'medium' | 'low';
}

interface RegulatoryUpdate {
  id: string;
  title: string;
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  description: string;
  status: 'active' | 'pending' | 'monitoring';
}

const MarketResearchDashboard: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('12m');
  const [selectedRegion, setSelectedRegion] = useState('global');

  // Mock market data
  const marketSegments: MarketSegment[] = [
    { name: 'Memory Foam', size: 850, growth: 8.5, share: 35.4, color: productXColors.primary[500] },
    { name: 'Innerspring', size: 720, growth: 3.2, share: 30.0, color: productXColors.secondary[500] },
    { name: 'Latex', size: 380, growth: 12.1, share: 15.8, color: productXColors.accent[500] },
    { name: 'Hybrid', size: 290, growth: 15.7, share: 12.1, color: productXColors.alert[400] },
    { name: 'Adjustable', size: 160, growth: 18.3, share: 6.7, color: '#8B5CF6' }
  ];

  const geographicData: GeographicData[] = [
    { region: 'North America', penetration: 78, growth: 5.2, opportunity: 'medium' },
    { region: 'Europe', penetration: 65, growth: 7.8, opportunity: 'high' },
    { region: 'Asia Pacific', penetration: 42, growth: 14.5, opportunity: 'high' },
    { region: 'Latin America', penetration: 28, growth: 11.2, opportunity: 'high' },
    { region: 'Middle East & Africa', penetration: 18, growth: 16.8, opportunity: 'high' }
  ];

  const regulatoryUpdates: RegulatoryUpdate[] = [
    {
      id: '1',
      title: 'New Fire Safety Standards for Mattresses',
      impact: 'high',
      timeline: 'Q2 2024',
      description: 'Updated flammability requirements affecting foam composition',
      status: 'active'
    },
    {
      id: '2',
      title: 'Chemical Disclosure Requirements',
      impact: 'medium',
      timeline: 'Q4 2024',
      description: 'Mandatory disclosure of chemical components in sleep products',
      status: 'pending'
    },
    {
      id: '3',
      title: 'Sustainability Labeling Standards',
      impact: 'medium',
      timeline: 'Q1 2025',
      description: 'New eco-friendly certification requirements',
      status: 'monitoring'
    }
  ];

  const getOpportunityColor = (opportunity: string) => {
    switch (opportunity) {
      case 'high': return productXColors.secondary[500];
      case 'medium': return productXColors.accent[500];
      case 'low': return productXColors.neutral[400];
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return productXColors.alert[500];
      case 'pending': return productXColors.accent[500];
      case 'monitoring': return productXColors.secondary[500];
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
              📊 Market Research Intelligence
            </h1>
            <p className="text-gray-600">
              Comprehensive market analysis and sizing for The Sleep Company
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="3m">Last 3 Months</option>
              <option value="6m">Last 6 Months</option>
              <option value="12m">Last 12 Months</option>
              <option value="24m">Last 24 Months</option>
            </select>
            <select 
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="global">Global</option>
              <option value="north-america">North America</option>
              <option value="europe">Europe</option>
              <option value="asia-pacific">Asia Pacific</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Market Size</p>
              <p className="text-2xl font-bold text-gray-900">$2.4B</p>
              <p className="text-sm text-green-600">↗ 12.5% YoY</p>
            </div>
            <div className="text-3xl">💰</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Growth Rate</p>
              <p className="text-2xl font-bold text-gray-900">12.5%</p>
              <p className="text-sm text-green-600">↗ 2.1% vs last year</p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Market Segments</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
              <p className="text-sm text-blue-600">→ Stable</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Opportunity Score</p>
              <p className="text-2xl font-bold text-gray-900">8.7/10</p>
              <p className="text-sm text-green-600">↗ High potential</p>
            </div>
            <div className="text-3xl">⭐</div>
          </div>
        </div>
      </div>

      {/* Market Segments Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Segments Distribution</h3>
          <div className="space-y-4">
            {marketSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  ></div>
                  <span className="font-medium">{segment.name}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold">${segment.size}M</div>
                  <div className="text-sm text-gray-500">{segment.share}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Trends by Segment</h3>
          <div className="space-y-4">
            {marketSegments.map((segment, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">{segment.name}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(segment.growth * 5, 100)}%`,
                        backgroundColor: segment.color 
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold text-green-600">+{segment.growth}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Market Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Market Penetration</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Region</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Penetration</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Growth Rate</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Opportunity</th>
              </tr>
            </thead>
            <tbody>
              {geographicData.map((region, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 px-4 font-medium">{region.region}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${region.penetration}%` }}
                        ></div>
                      </div>
                      <span>{region.penetration}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-green-600 font-medium">+{region.growth}%</td>
                  <td className="py-3 px-4">
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getOpportunityColor(region.opportunity) }}
                    >
                      {region.opportunity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regulatory Timeline */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Regulatory Timeline & Impact</h3>
        <div className="space-y-4">
          {regulatoryUpdates.map((update) => (
            <div key={update.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="font-medium text-gray-900">{update.title}</h4>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getImpactColor(update.impact) }}
                    >
                      {update.impact.toUpperCase()} IMPACT
                    </span>
                    <span 
                      className="px-2 py-1 rounded-full text-xs font-medium text-white"
                      style={{ backgroundColor: getStatusColor(update.status) }}
                    >
                      {update.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{update.description}</p>
                  <p className="text-sm text-gray-500">Timeline: {update.timeline}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MarketResearchDashboard;
