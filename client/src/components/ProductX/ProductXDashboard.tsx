import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Agent status interface
interface AgentStatus {
  id: string;
  name: string;
  status: 'active' | 'processing' | 'idle' | 'error';
  lastUpdate: string;
  keyMetrics: {
    label: string;
    value: string;
    trend: 'up' | 'down' | 'stable';
  }[];
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  path: string;
  icon: string;
}

// Mock data for the seven agents
const agentStatuses: AgentStatus[] = [
  {
    id: 'market-research',
    name: 'Market Research Intelligence',
    status: 'active',
    lastUpdate: '2 minutes ago',
    keyMetrics: [
      { label: 'Market Size', value: '$2.4B', trend: 'up' },
      { label: 'Growth Rate', value: '12.5%', trend: 'up' },
      { label: 'Segments', value: '8', trend: 'stable' }
    ],
    colorScheme: agentColorSchemes.marketResearch,
    path: '/product-x/market-research',
    icon: '📊'
  },
  {
    id: 'competitive-intelligence',
    name: 'Competitive Intelligence',
    status: 'processing',
    lastUpdate: '5 minutes ago',
    keyMetrics: [
      { label: 'Competitors', value: '15', trend: 'up' },
      { label: 'Price Changes', value: '3', trend: 'down' },
      { label: 'New Products', value: '2', trend: 'up' }
    ],
    colorScheme: agentColorSchemes.competitiveIntelligence,
    path: '/product-x/competitive-intelligence',
    icon: '🎯'
  },
  {
    id: 'trend-analysis',
    name: 'Trend Analysis',
    status: 'active',
    lastUpdate: '1 minute ago',
    keyMetrics: [
      { label: 'Trending Topics', value: '12', trend: 'up' },
      { label: 'Confidence', value: '94%', trend: 'stable' },
      { label: 'Predictions', value: '8', trend: 'up' }
    ],
    colorScheme: agentColorSchemes.trendAnalysis,
    path: '/product-x/trend-analysis',
    icon: '📈'
  },
  {
    id: 'user-profiles',
    name: 'User Profile Intelligence',
    status: 'active',
    lastUpdate: '3 minutes ago',
    keyMetrics: [
      { label: 'Personas', value: '6', trend: 'stable' },
      { label: 'Segments', value: '4', trend: 'up' },
      { label: 'Insights', value: '24', trend: 'up' }
    ],
    colorScheme: agentColorSchemes.userProfiles,
    path: '/product-x/user-profiles',
    icon: '👥'
  },
  {
    id: 'audience-expansion',
    name: 'Audience Expansion',
    status: 'idle',
    lastUpdate: '15 minutes ago',
    keyMetrics: [
      { label: 'Opportunities', value: '7', trend: 'up' },
      { label: 'ROI Potential', value: '156%', trend: 'up' },
      { label: 'Markets', value: '3', trend: 'stable' }
    ],
    colorScheme: agentColorSchemes.audienceExpansion,
    path: '/product-x/audience-expansion',
    icon: '🌐'
  },
  {
    id: 'media-intelligence',
    name: 'Media Intelligence',
    status: 'active',
    lastUpdate: '4 minutes ago',
    keyMetrics: [
      { label: 'Mentions', value: '142', trend: 'up' },
      { label: 'Sentiment', value: '78%', trend: 'up' },
      { label: 'Reach', value: '2.1M', trend: 'up' }
    ],
    colorScheme: agentColorSchemes.mediaIntelligence,
    path: '/product-x/media-intelligence',
    icon: '📺'
  },
  {
    id: 'strategic-recommendations',
    name: 'Strategic Recommendations',
    status: 'processing',
    lastUpdate: '8 minutes ago',
    keyMetrics: [
      { label: 'Recommendations', value: '5', trend: 'up' },
      { label: 'Priority High', value: '2', trend: 'stable' },
      { label: 'Implementation', value: '3', trend: 'up' }
    ],
    colorScheme: agentColorSchemes.strategicRecommendations,
    path: '/product-x/strategic-recommendations',
    icon: '💡'
  }
];

// Critical alerts mock data
const criticalAlerts = [
  {
    id: 1,
    type: 'high',
    title: 'Competitor Price Drop Detected',
    message: 'Purple Mattress reduced prices by 15% across premium segment',
    timestamp: '5 minutes ago',
    agent: 'Competitive Intelligence'
  },
  {
    id: 2,
    type: 'medium',
    title: 'Emerging Trend: Smart Sleep Technology',
    message: 'IoT-enabled sleep tracking showing 45% growth in consumer interest',
    timestamp: '12 minutes ago',
    agent: 'Trend Analysis'
  },
  {
    id: 3,
    type: 'low',
    title: 'New Market Opportunity Identified',
    message: 'Corporate wellness programs showing increased demand for ergonomic solutions',
    timestamp: '1 hour ago',
    agent: 'Audience Expansion'
  }
];

const ProductXDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState({
    overall: 'healthy',
    dataFreshness: '98%',
    apiStatus: 'operational',
    lastSync: '2 minutes ago'
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return productXColors.secondary[500];
      case 'processing': return productXColors.accent[500];
      case 'idle': return productXColors.neutral[400];
      case 'error': return productXColors.alert[500];
      default: return productXColors.neutral[400];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '🟢';
      case 'processing': return '🟡';
      case 'idle': return '⚪';
      case 'error': return '🔴';
      default: return '⚪';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      case 'stable': return '➡️';
      default: return '➡️';
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
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
              Product X - Sleep Company Research & Analysis
            </h1>
            <p className="text-gray-600">
              Comprehensive market intelligence dashboard for The Sleep Company
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">System Health</div>
              <div className="flex items-center space-x-2">
                <span className="text-green-500">●</span>
                <span className="font-medium">Operational</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Data Freshness</div>
              <div className="font-medium">{systemHealth.dataFreshness}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Critical Alerts Panel */}
      <div className="mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">🚨 Critical Alerts</h2>
            <span className="text-sm text-gray-500">Last updated: 2 minutes ago</span>
          </div>
          <div className="space-y-3">
            {criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start space-x-3 p-3 rounded-lg border-l-4"
                style={{ borderLeftColor: getAlertColor(alert.type) }}
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <span className="text-xs text-gray-500">{alert.timestamp}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                  <span className="text-xs text-gray-500">Source: {alert.agent}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agent Status Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Intelligence Agents Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {agentStatuses.map((agent) => (
            <Link
              key={agent.id}
              to={agent.path}
              className="block bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{agent.icon}</span>
                  <span className="text-lg">{getStatusIcon(agent.status)}</span>
                </div>
                <div
                  className="px-2 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: getStatusColor(agent.status) }}
                >
                  {agent.status}
                </div>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2">{agent.name}</h3>
              <p className="text-sm text-gray-500 mb-4">Updated {agent.lastUpdate}</p>
              
              <div className="space-y-2">
                {agent.keyMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{metric.label}</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-medium">{metric.value}</span>
                      <span className="text-xs">{getTrendIcon(metric.trend)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📊 System Performance</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">API Response Time</span>
              <span className="font-medium">142ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Data Processing</span>
              <span className="font-medium">98.7%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Uptime</span>
              <span className="font-medium">99.9%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🎯 Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm">
              📈 Generate Market Report
            </button>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm">
              🔍 Run Competitor Analysis
            </button>
            <button className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-50 text-sm">
              📊 Export Dashboard Data
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📅 Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-green-500">●</span>
              <div>
                <div className="font-medium">Market analysis completed</div>
                <div className="text-gray-500">5 minutes ago</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500">●</span>
              <div>
                <div className="font-medium">New competitor detected</div>
                <div className="text-gray-500">12 minutes ago</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-amber-500">●</span>
              <div>
                <div className="font-medium">Trend alert triggered</div>
                <div className="text-gray-500">1 hour ago</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductXDashboard;
