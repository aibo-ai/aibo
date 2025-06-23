import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';

interface MonitoringAlert {
  id: string;
  type: 'price_change' | 'new_product' | 'social_mention' | 'news' | 'ranking_change' | 'inventory';
  severity: 'low' | 'medium' | 'high' | 'critical';
  competitor: string;
  title: string;
  description: string;
  timestamp: Date;
  data?: any;
  acknowledged: boolean;
}

interface MetricTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
}

const RealTimeMonitoring: React.FC = () => {
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [metrics, setMetrics] = useState<MetricTrend[]>([]);
  const [isConnected] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock real-time data simulation
  useEffect(() => {
    const generateMockAlert = (): MonitoringAlert => {
      const types = ['price_change', 'new_product', 'social_mention', 'news', 'ranking_change', 'inventory'] as const;
      const severities = ['low', 'medium', 'high', 'critical'] as const;
      const competitors = ['Herman Miller', 'Steelcase', 'Haworth', 'Humanscale', 'Knoll'];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const severity = severities[Math.floor(Math.random() * severities.length)];
      const competitor = competitors[Math.floor(Math.random() * competitors.length)];

      const alertTemplates = {
        price_change: {
          title: 'Price Change Detected',
          description: `${competitor} adjusted pricing on Aeron chair by ${Math.floor(Math.random() * 20 - 10)}%`
        },
        new_product: {
          title: 'New Product Launch',
          description: `${competitor} launched new ergonomic chair series targeting remote workers`
        },
        social_mention: {
          title: 'Social Media Spike',
          description: `${competitor} mentioned ${Math.floor(Math.random() * 500 + 100)} times in last hour`
        },
        news: {
          title: 'News Coverage',
          description: `${competitor} featured in major industry publication`
        },
        ranking_change: {
          title: 'Search Ranking Change',
          description: `${competitor} moved up 3 positions for "ergonomic office chair"`
        },
        inventory: {
          title: 'Inventory Alert',
          description: `${competitor} showing low stock on popular models`
        }
      };

      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        severity,
        competitor,
        title: alertTemplates[type].title,
        description: alertTemplates[type].description,
        timestamp: new Date(),
        acknowledged: false
      };
    };

    const generateMockMetrics = (): MetricTrend[] => {
      return [
        {
          metric: 'Market Share',
          current: 28.5,
          previous: 28.2,
          change: 0.3,
          trend: 'up',
          unit: '%'
        },
        {
          metric: 'Social Mentions',
          current: 1247,
          previous: 1189,
          change: 58,
          trend: 'up',
          unit: ''
        },
        {
          metric: 'Avg. Price',
          current: 1395,
          previous: 1450,
          change: -55,
          trend: 'down',
          unit: '$'
        },
        {
          metric: 'Search Ranking',
          current: 2,
          previous: 3,
          change: -1,
          trend: 'up',
          unit: ''
        }
      ];
    };

    // Initialize with some mock data
    setAlerts([
      generateMockAlert(),
      generateMockAlert(),
      generateMockAlert()
    ]);
    setMetrics(generateMockMetrics());

    // Simulate real-time updates
    const interval = setInterval(() => {
      if (autoRefresh && Math.random() > 0.7) {
        setAlerts(prev => [generateMockAlert(), ...prev.slice(0, 19)]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const clearAllAlerts = () => {
    setAlerts([]);
  };

  const filteredAlerts = alerts.filter(alert => 
    filter === 'all' || alert.severity === filter
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-white';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'price_change': return '💰';
      case 'new_product': return '🆕';
      case 'social_mention': return '📱';
      case 'news': return '📰';
      case 'ranking_change': return '📈';
      case 'inventory': return '📦';
      default: return '🔔';
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

  const formatChange = (change: number, unit: string) => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}${unit}`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Monitoring</h1>
          <p className="text-gray-600 mt-2">Live competitive intelligence and market surveillance</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <Button
            variant={autoRefresh ? 'primary' : 'outline'}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            {autoRefresh ? '⏸️ Pause' : '▶️ Resume'}
          </Button>
          <Button onClick={clearAllAlerts} variant="outline" size="sm">
            🗑️ Clear All
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index} className="p-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-medium text-gray-600">{metric.metric}</h3>
              <span className="text-lg">{getTrendIcon(metric.trend)}</span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.unit === '$' ? '$' : ''}{metric.current.toLocaleString()}{metric.unit !== '$' ? metric.unit : ''}
            </div>
            <div className={`text-sm ${metric.change > 0 ? 'text-green-600' : metric.change < 0 ? 'text-red-600' : 'text-gray-600'}`}>
              {formatChange(metric.change, metric.unit)} from previous
            </div>
          </Card>
        ))}
      </div>

      {/* Alert Filters */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex space-x-2">
          {['all', 'critical', 'high', 'medium', 'low'].map((severity) => (
            <Button
              key={severity}
              variant={filter === severity ? 'primary' : 'outline'}
              onClick={() => setFilter(severity as any)}
              size="sm"
              className="capitalize"
            >
              {severity} {severity !== 'all' && `(${alerts.filter(a => a.severity === severity).length})`}
            </Button>
          ))}
        </div>
        <div className="text-sm text-gray-600">
          {filteredAlerts.length} alerts • {alerts.filter(a => !a.acknowledged).length} unacknowledged
        </div>
      </div>

      {/* Alerts List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Live Alerts</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">🔕</div>
              <p>No alerts matching current filter</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg border-l-4 ${
                  alert.acknowledged ? 'bg-gray-50 opacity-75' : 'bg-white'
                } ${
                  alert.severity === 'critical' ? 'border-red-500' :
                  alert.severity === 'high' ? 'border-orange-500' :
                  alert.severity === 'medium' ? 'border-yellow-500' :
                  'border-blue-500'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-xl">{getTypeIcon(alert.type)}</span>
                      <div>
                        <h3 className="font-medium text-gray-900">{alert.title}</h3>
                        <p className="text-sm text-gray-600">{alert.competitor}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(alert.severity)}`}>
                        {alert.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{alert.description}</p>
                    <p className="text-xs text-gray-500">
                      {alert.timestamp.toLocaleTimeString()} • {alert.timestamp.toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!alert.acknowledged && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        ✓ Acknowledge
                      </Button>
                    )}
                    <Button size="sm" variant="outline">
                      👁️ Details
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

export default RealTimeMonitoring;
