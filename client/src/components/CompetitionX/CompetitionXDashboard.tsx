import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';

interface CompetitorMetric {
  id: string;
  name: string;
  marketShare: number;
  growthRate: number;
  threatLevel: 'low' | 'medium' | 'high';
  lastUpdated: string;
}

interface AlertItem {
  id: string;
  type: 'price_change' | 'new_product' | 'marketing_campaign' | 'social_mention' | 'ranking_change';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  competitor: string;
  timestamp: string;
  actionRequired: boolean;
}

const CompetitionXDashboard: React.FC = () => {
  const [competitors, setCompetitors] = useState<CompetitorMetric[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mock data for demonstration
  useEffect(() => {
    const mockCompetitors: CompetitorMetric[] = [
      {
        id: '1',
        name: 'Herman Miller',
        marketShare: 28.5,
        growthRate: 12.3,
        threatLevel: 'high',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Steelcase',
        marketShare: 24.2,
        growthRate: 8.7,
        threatLevel: 'high',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Haworth',
        marketShare: 15.8,
        growthRate: 5.2,
        threatLevel: 'medium',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Humanscale',
        marketShare: 12.1,
        growthRate: 15.6,
        threatLevel: 'medium',
        lastUpdated: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Knoll',
        marketShare: 9.4,
        growthRate: 3.1,
        threatLevel: 'low',
        lastUpdated: new Date().toISOString()
      }
    ];

    const mockAlerts: AlertItem[] = [
      {
        id: '1',
        type: 'price_change',
        severity: 'warning',
        message: 'Herman Miller reduced Aeron chair price by 15%',
        competitor: 'Herman Miller',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        actionRequired: true
      },
      {
        id: '2',
        type: 'new_product',
        severity: 'critical',
        message: 'Steelcase launched new ergonomic series targeting remote workers',
        competitor: 'Steelcase',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        actionRequired: true
      },
      {
        id: '3',
        type: 'social_mention',
        severity: 'info',
        message: 'Positive sentiment spike for Humanscale on LinkedIn',
        competitor: 'Humanscale',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        actionRequired: false
      }
    ];

    setTimeout(() => {
      setCompetitors(mockCompetitors);
      setAlerts(mockAlerts);
      setLoading(false);
    }, 1000);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competition X Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time competitive intelligence for ergonomic seating industry</p>
        </div>
        <div className="flex space-x-4">
          <Button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center space-x-2"
          >
            <span className={refreshing ? 'animate-spin' : ''}>🔄</span>
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </Button>
          <Button variant="outline">
            📊 Export Report
          </Button>
        </div>
      </div>

      {/* Competitor Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {competitors.map((competitor) => (
          <Card key={competitor.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-semibold text-gray-900">{competitor.name}</h3>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getThreatLevelColor(competitor.threatLevel)}`}>
                {competitor.threatLevel.toUpperCase()}
              </span>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Market Share</p>
                <p className="text-2xl font-bold text-gray-900">{competitor.marketShare}%</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Growth Rate</p>
                <p className={`text-lg font-semibold ${competitor.growthRate > 10 ? 'text-green-600' : competitor.growthRate > 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {competitor.growthRate > 0 ? '+' : ''}{competitor.growthRate}%
                </p>
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Updated {formatTimestamp(competitor.lastUpdated)}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Alerts Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Alerts</h2>
          <div className="flex space-x-2">
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
              {alerts.filter(a => a.severity === 'critical').length} Critical
            </span>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {alerts.filter(a => a.severity === 'warning').length} Warning
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium">{alert.competitor}</span>
                    <span className="text-xs text-gray-500">•</span>
                    <span className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                    {alert.actionRequired && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        Action Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-900">{alert.message}</p>
                </div>
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>

        {alerts.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>No recent alerts</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default CompetitionXDashboard;
