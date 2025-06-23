import React, { useState, useEffect } from 'react';
// Temporary icon replacements
const BarChart3 = ({ className }: { className?: string }) => <span className={className}>📊</span>;
const TrendingUp = ({ className }: { className?: string }) => <span className={className}>📈</span>;
const Users = ({ className }: { className?: string }) => <span className={className}>👥</span>;
const AlertTriangle = ({ className }: { className?: string }) => <span className={className}>⚠️</span>;
const Brain = ({ className }: { className?: string }) => <span className={className}>🧠</span>;
const Monitor = ({ className }: { className?: string }) => <span className={className}>🖥️</span>;
const RefreshCw = ({ className }: { className?: string }) => <span className={className}>🔄</span>;
import MobileCard from '../ui/MobileCard';

interface DashboardMetric {
  id: string;
  title: string;
  value: string | number;
  trend: 'up' | 'down' | 'stable';
  trendValue: string;
  icon: React.ReactNode;
  category: 'performance' | 'business' | 'monitoring' | 'ai';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: number;
}

const MobileDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetric[]>([]);
  const [quickActions, setQuickActions] = useState<QuickAction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'performance' | 'business' | 'monitoring' | 'ai'>('all');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const mockMetrics: DashboardMetric[] = [
      {
        id: '1',
        title: 'Content Generated',
        value: '1,247',
        trend: 'up',
        trendValue: '+12%',
        icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
        category: 'business'
      },
      {
        id: '2',
        title: 'API Response Time',
        value: '245ms',
        trend: 'down',
        trendValue: '-8%',
        icon: <TrendingUp className="w-5 h-5 text-green-600" />,
        category: 'performance'
      },
      {
        id: '3',
        title: 'Active Users',
        value: '892',
        trend: 'up',
        trendValue: '+5%',
        icon: <Users className="w-5 h-5 text-purple-600" />,
        category: 'business'
      },
      {
        id: '4',
        title: 'System Alerts',
        value: '3',
        trend: 'stable',
        trendValue: '0',
        icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
        category: 'monitoring'
      },
      {
        id: '5',
        title: 'AI Insights',
        value: '156',
        trend: 'up',
        trendValue: '+23%',
        icon: <Brain className="w-5 h-5 text-indigo-600" />,
        category: 'ai'
      },
      {
        id: '6',
        title: 'Competitor Updates',
        value: '12',
        trend: 'up',
        trendValue: '+4',
        icon: <Monitor className="w-5 h-5 text-orange-600" />,
        category: 'monitoring'
      }
    ];

    const mockQuickActions: QuickAction[] = [
      {
        id: '1',
        title: 'Generate Content',
        description: 'Create new AI-powered content',
        icon: <BarChart3 className="w-5 h-5 text-blue-600" />,
        action: () => console.log('Generate content')
      },
      {
        id: '2',
        title: 'View Competitors',
        description: 'Check latest competitor analysis',
        icon: <Users className="w-5 h-5 text-purple-600" />,
        action: () => console.log('View competitors'),
        badge: 3
      },
      {
        id: '3',
        title: 'AI Analysis',
        description: 'Run new AI insights',
        icon: <Brain className="w-5 h-5 text-indigo-600" />,
        action: () => console.log('AI analysis')
      },
      {
        id: '4',
        title: 'System Health',
        description: 'Monitor system performance',
        icon: <Monitor className="w-5 h-5 text-green-600" />,
        action: () => console.log('System health')
      }
    ];

    setMetrics(mockMetrics);
    setQuickActions(mockQuickActions);
    setIsRefreshing(false);
  };

  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(metric => metric.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'business', label: 'Business' },
    { id: 'performance', label: 'Performance' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'ai', label: 'AI' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20"> {/* pb-20 for bottom navigation */}
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, John!</p>
          </div>
          <button
            onClick={loadDashboardData}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-4 py-3 bg-white border-b border-gray-200">
        <div className="flex space-x-2 overflow-x-auto">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id as any)}
              className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredMetrics.map((metric) => (
            <MobileCard
              key={metric.id}
              title={metric.title}
              value={metric.value}
              trend={metric.trend}
              trendValue={metric.trendValue}
              icon={metric.icon}
              variant="default"
              onClick={() => console.log(`View details for ${metric.title}`)}
            />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="space-y-3">
          {quickActions.map((action) => (
            <MobileCard
              key={action.id}
              title={action.title}
              subtitle={action.description}
              icon={action.icon}
              badge={action.badge}
              variant="compact"
              onClick={action.action}
            />
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
        <div className="space-y-3">
          <MobileCard
            title="Content Generation Completed"
            subtitle="Blog post about AI trends"
            icon={<BarChart3 className="w-5 h-5 text-green-600" />}
            badge="2m ago"
            variant="compact"
          />
          <MobileCard
            title="Competitor Analysis Updated"
            subtitle="Herman Miller pricing changes detected"
            icon={<AlertTriangle className="w-5 h-5 text-orange-600" />}
            badge="15m ago"
            variant="compact"
          />
          <MobileCard
            title="AI Insight Generated"
            subtitle="Market opportunity identified"
            icon={<Brain className="w-5 h-5 text-purple-600" />}
            badge="1h ago"
            variant="compact"
          />
        </div>
      </div>

      {/* System Status */}
      <div className="px-4 py-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">System Status</h2>
        <MobileCard
          title="All Systems Operational"
          subtitle="Last updated: 2 minutes ago"
          icon={<Monitor className="w-5 h-5 text-green-600" />}
          variant="compact"
        >
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm font-medium text-gray-900">API</div>
              <div className="text-xs text-green-600">✓ Online</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">Database</div>
              <div className="text-xs text-green-600">✓ Online</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900">AI Services</div>
              <div className="text-xs text-green-600">✓ Online</div>
            </div>
          </div>
        </MobileCard>
      </div>
    </div>
  );
};

export default MobileDashboard;
