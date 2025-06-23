import React, { useState, useEffect } from 'react';
// Temporary icon replacements
const BarChart3 = ({ className }: { className?: string }) => <span className={className}>📊</span>;
const TrendingUp = ({ className }: { className?: string }) => <span className={className}>📈</span>;
const TrendingDown = ({ className }: { className?: string }) => <span className={className}>📉</span>;
const Calendar = ({ className }: { className?: string }) => <span className={className}>📅</span>;
const Download = ({ className }: { className?: string }) => <span className={className}>⬇️</span>;
const Filter = ({ className }: { className?: string }) => <span className={className}>🔍</span>;

interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  previousValue: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  unit: string;
  category: 'market' | 'financial' | 'digital' | 'customer';
}

interface TimeSeriesData {
  date: string;
  metrics: Record<string, number>;
}

interface CompetitorComparison {
  competitor: string;
  metrics: Record<string, number>;
  rank: number;
}

const PerformanceAnalytics: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesData[]>([]);
  const [comparisons, setComparisons] = useState<CompetitorComparison[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'market' | 'financial' | 'digital' | 'customer'>('all');

  useEffect(() => {
    generateMockData();
  }, [selectedTimeRange]);

  const generateMockData = () => {
    // Generate performance metrics
    const mockMetrics: PerformanceMetric[] = [
      {
        id: '1',
        name: 'Market Share',
        value: 28.5,
        previousValue: 27.8,
        change: 0.7,
        trend: 'up',
        unit: '%',
        category: 'market'
      },
      {
        id: '2',
        name: 'Revenue Growth',
        value: 15.2,
        previousValue: 12.8,
        change: 2.4,
        trend: 'up',
        unit: '%',
        category: 'financial'
      },
      {
        id: '3',
        name: 'Customer Satisfaction',
        value: 4.7,
        previousValue: 4.5,
        change: 0.2,
        trend: 'up',
        unit: '/5',
        category: 'customer'
      },
      {
        id: '4',
        name: 'Digital Engagement',
        value: 89.3,
        previousValue: 91.2,
        change: -1.9,
        trend: 'down',
        unit: '%',
        category: 'digital'
      },
      {
        id: '5',
        name: 'Price Competitiveness',
        value: 76.8,
        previousValue: 78.1,
        change: -1.3,
        trend: 'down',
        unit: '%',
        category: 'market'
      },
      {
        id: '6',
        name: 'Innovation Index',
        value: 82.4,
        previousValue: 80.1,
        change: 2.3,
        trend: 'up',
        unit: '/100',
        category: 'market'
      }
    ];
    setMetrics(mockMetrics);

    // Generate time series data
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365;
    const mockTimeSeriesData: TimeSeriesData[] = [];
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      mockTimeSeriesData.push({
        date: date.toISOString().split('T')[0],
        metrics: {
          marketShare: 28.5 + (Math.random() - 0.5) * 2,
          revenue: 15.2 + (Math.random() - 0.5) * 3,
          satisfaction: 4.7 + (Math.random() - 0.5) * 0.4,
          engagement: 89.3 + (Math.random() - 0.5) * 5
        }
      });
    }
    setTimeSeriesData(mockTimeSeriesData);

    // Generate competitor comparisons
    const mockComparisons: CompetitorComparison[] = [
      {
        competitor: 'Our Company',
        metrics: {
          marketShare: 28.5,
          revenue: 15.2,
          satisfaction: 4.7,
          innovation: 82.4
        },
        rank: 1
      },
      {
        competitor: 'Herman Miller',
        metrics: {
          marketShare: 24.2,
          revenue: 12.8,
          satisfaction: 4.5,
          innovation: 85.1
        },
        rank: 2
      },
      {
        competitor: 'Steelcase',
        metrics: {
          marketShare: 22.1,
          revenue: 11.5,
          satisfaction: 4.3,
          innovation: 78.9
        },
        rank: 3
      },
      {
        competitor: 'Haworth',
        metrics: {
          marketShare: 18.7,
          revenue: 9.2,
          satisfaction: 4.1,
          innovation: 72.3
        },
        rank: 4
      }
    ];
    setComparisons(mockComparisons);
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(metric => metric.category === selectedCategory);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const exportData = () => {
    const exportData = {
      metrics: filteredMetrics,
      timeSeriesData,
      comparisons,
      generatedAt: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Performance Analytics</h2>
            <p className="text-gray-600">Comprehensive competitor performance tracking and analysis</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportData}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Download className="w-4 h-4" />
            <span>Export Data</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Category:</span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="all">All Categories</option>
            <option value="market">Market</option>
            <option value="financial">Financial</option>
            <option value="digital">Digital</option>
            <option value="customer">Customer</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMetrics.map((metric) => (
          <div key={metric.id} className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-600">{metric.name}</h3>
              {getTrendIcon(metric.trend)}
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {metric.value.toLocaleString()}{metric.unit}
            </div>
            <div className={`text-sm ${getTrendColor(metric.trend)}`}>
              {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}{metric.unit} from previous period
            </div>
          </div>
        ))}
      </div>

      {/* Competitor Comparison */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Competitor Comparison</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Competitor</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Market Share</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue Growth</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Satisfaction</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Innovation</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((comparison, index) => (
                <tr key={index} className={`border-b border-gray-100 ${comparison.competitor === 'Our Company' ? 'bg-blue-50' : ''}`}>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                      comparison.rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                      comparison.rank === 2 ? 'bg-gray-100 text-gray-800' :
                      comparison.rank === 3 ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {comparison.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{comparison.competitor}</td>
                  <td className="py-3 px-4">{comparison.metrics.marketShare.toFixed(1)}%</td>
                  <td className="py-3 px-4">{comparison.metrics.revenue.toFixed(1)}%</td>
                  <td className="py-3 px-4">{comparison.metrics.satisfaction.toFixed(1)}/5</td>
                  <td className="py-3 px-4">{comparison.metrics.innovation.toFixed(1)}/100</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trend Chart Placeholder */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Interactive charts would be rendered here</p>
            <p className="text-sm">Integration with Chart.js or D3.js recommended</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;
