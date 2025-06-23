import React, { useState } from 'react';
import { productXColors, agentColorSchemes } from '../../styles/productXTheme';

// Strategic recommendations interfaces
interface Recommendation {
  id: string;
  title: string;
  category: 'product' | 'marketing' | 'pricing' | 'expansion' | 'operations';
  priority: 'critical' | 'high' | 'medium' | 'low';
  impact: number;
  effort: number;
  timeline: string;
  description: string;
  rationale: string[];
  expectedOutcomes: string[];
  risks: string[];
  dependencies: string[];
  kpis: string[];
  status: 'new' | 'in-review' | 'approved' | 'in-progress' | 'completed';
  confidence: number;
}

interface ImplementationPlan {
  recommendationId: string;
  phases: {
    phase: string;
    duration: string;
    tasks: string[];
    resources: string[];
    milestones: string[];
  }[];
  totalDuration: string;
  totalInvestment: number;
  expectedROI: number;
}

interface PerformanceMetric {
  metric: string;
  current: number;
  target: number;
  timeline: string;
  category: string;
  trend: 'up' | 'down' | 'stable';
}

interface SuccessStory {
  title: string;
  category: string;
  implementation: string;
  results: string[];
  impact: string;
  timeline: string;
}

const StrategicRecommendationsDashboard: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [viewMode, setViewMode] = useState('recommendations');

  // Mock recommendations data
  const recommendations: Recommendation[] = [
    {
      id: '1',
      title: 'Launch Smart Sleep Technology Line',
      category: 'product',
      priority: 'critical',
      impact: 9,
      effort: 8,
      timeline: '12-18 months',
      description: 'Develop IoT-enabled mattresses with sleep tracking and environmental control',
      rationale: ['Growing smart home market', 'Consumer demand for health tech', 'Competitive differentiation'],
      expectedOutcomes: ['25% market share in smart mattress segment', '$50M additional revenue', 'Premium positioning'],
      risks: ['Technology complexity', 'Higher production costs', 'Consumer adoption rate'],
      dependencies: ['R&D investment', 'Technology partnerships', 'Manufacturing capabilities'],
      kpis: ['Smart mattress sales', 'App engagement', 'Customer satisfaction'],
      status: 'in-review',
      confidence: 85
    },
    {
      id: '2',
      title: 'Expand Corporate Wellness Program',
      category: 'expansion',
      priority: 'high',
      impact: 7,
      effort: 5,
      timeline: '6-9 months',
      description: 'Target B2B market with employee wellness programs and bulk sales',
      rationale: ['Untapped B2B market', 'Growing corporate wellness trend', 'Higher margins'],
      expectedOutcomes: ['$15M new revenue stream', '50 corporate partnerships', 'B2B market entry'],
      risks: ['Long sales cycles', 'Procurement complexity', 'Economic sensitivity'],
      dependencies: ['B2B sales team', 'Corporate partnerships', 'Bulk pricing strategy'],
      kpis: ['Corporate accounts', 'B2B revenue', 'Employee satisfaction'],
      status: 'approved',
      confidence: 78
    },
    {
      id: '3',
      title: 'Implement Dynamic Pricing Strategy',
      category: 'pricing',
      priority: 'high',
      impact: 6,
      effort: 4,
      timeline: '3-6 months',
      description: 'Deploy AI-driven pricing optimization based on demand and competition',
      rationale: ['Competitor price changes', 'Demand fluctuations', 'Margin optimization'],
      expectedOutcomes: ['8% margin improvement', 'Competitive pricing', 'Revenue optimization'],
      risks: ['Customer perception', 'Implementation complexity', 'Market reaction'],
      dependencies: ['Pricing technology', 'Market data', 'Team training'],
      kpis: ['Gross margin', 'Price competitiveness', 'Revenue per unit'],
      status: 'in-progress',
      confidence: 82
    },
    {
      id: '4',
      title: 'Launch Sustainability Initiative',
      category: 'marketing',
      priority: 'medium',
      impact: 5,
      effort: 6,
      timeline: '9-12 months',
      description: 'Develop eco-friendly product line and sustainability marketing campaign',
      rationale: ['Consumer environmental concerns', 'Regulatory trends', 'Brand differentiation'],
      expectedOutcomes: ['Eco-conscious market capture', 'Brand reputation improvement', 'Regulatory compliance'],
      risks: ['Higher production costs', 'Supply chain complexity', 'Certification requirements'],
      dependencies: ['Sustainable materials', 'Certifications', 'Marketing campaign'],
      kpis: ['Eco-product sales', 'Brand perception', 'Sustainability metrics'],
      status: 'new',
      confidence: 72
    },
    {
      id: '5',
      title: 'Optimize Supply Chain Efficiency',
      category: 'operations',
      priority: 'medium',
      impact: 4,
      effort: 7,
      timeline: '6-12 months',
      description: 'Implement advanced supply chain management and automation',
      rationale: ['Cost reduction opportunities', 'Delivery time improvement', 'Scalability needs'],
      expectedOutcomes: ['15% cost reduction', 'Faster delivery', 'Improved scalability'],
      risks: ['Implementation disruption', 'Technology integration', 'Staff training'],
      dependencies: ['Technology investment', 'Process redesign', 'Staff training'],
      kpis: ['Cost per unit', 'Delivery time', 'Inventory turnover'],
      status: 'new',
      confidence: 68
    }
  ];

  const implementationPlans: ImplementationPlan[] = [
    {
      recommendationId: '1',
      phases: [
        {
          phase: 'Research & Development',
          duration: '4 months',
          tasks: ['Technology research', 'Prototype development', 'Testing'],
          resources: ['R&D team', 'Technology partners', 'Testing facilities'],
          milestones: ['Technology selection', 'Prototype completion', 'Initial testing']
        },
        {
          phase: 'Product Development',
          duration: '6 months',
          tasks: ['Product design', 'Manufacturing setup', 'Quality testing'],
          resources: ['Product team', 'Manufacturing', 'Quality assurance'],
          milestones: ['Design finalization', 'Production setup', 'Quality approval']
        },
        {
          phase: 'Market Launch',
          duration: '4 months',
          tasks: ['Marketing campaign', 'Sales training', 'Customer onboarding'],
          resources: ['Marketing team', 'Sales team', 'Customer support'],
          milestones: ['Campaign launch', 'Sales readiness', 'First sales']
        }
      ],
      totalDuration: '14 months',
      totalInvestment: 8500000,
      expectedROI: 285
    }
  ];

  const performanceMetrics: PerformanceMetric[] = [
    { metric: 'Market Share', current: 12.5, target: 18.0, timeline: '12 months', category: 'Market', trend: 'up' },
    { metric: 'Revenue Growth', current: 15.2, target: 25.0, timeline: '12 months', category: 'Financial', trend: 'up' },
    { metric: 'Customer Satisfaction', current: 4.2, target: 4.6, timeline: '6 months', category: 'Customer', trend: 'up' },
    { metric: 'Gross Margin', current: 42.8, target: 48.0, timeline: '9 months', category: 'Financial', trend: 'stable' },
    { metric: 'Brand Awareness', current: 28.5, target: 40.0, timeline: '18 months', category: 'Marketing', trend: 'up' },
    { metric: 'Operational Efficiency', current: 78.2, target: 85.0, timeline: '12 months', category: 'Operations', trend: 'up' }
  ];

  const successStories: SuccessStory[] = [
    {
      title: 'Premium Positioning Strategy',
      category: 'Marketing',
      implementation: 'Repositioned brand as premium wellness solution with medical endorsements',
      results: ['35% increase in average selling price', '28% improvement in brand perception', '15% market share growth'],
      impact: '$12M additional revenue',
      timeline: '8 months'
    },
    {
      title: 'Direct-to-Consumer Expansion',
      category: 'Sales',
      implementation: 'Launched online-first sales model with home trial program',
      results: ['60% of sales now online', '40% reduction in customer acquisition cost', '25% increase in customer lifetime value'],
      impact: '$18M revenue increase',
      timeline: '12 months'
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return productXColors.alert[500];
      case 'high': return productXColors.accent[500];
      case 'medium': return productXColors.secondary[500];
      case 'low': return productXColors.neutral[400];
      default: return productXColors.neutral[400];
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'product': return productXColors.primary[500];
      case 'marketing': return productXColors.secondary[500];
      case 'pricing': return productXColors.accent[500];
      case 'expansion': return '#8B5CF6';
      case 'operations': return '#06B6D4';
      default: return productXColors.neutral[400];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return productXColors.neutral[400];
      case 'in-review': return productXColors.accent[500];
      case 'approved': return productXColors.secondary[500];
      case 'in-progress': return productXColors.primary[500];
      case 'completed': return productXColors.secondary[600];
      default: return productXColors.neutral[400];
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              💡 Strategic Recommendations
            </h1>
            <p className="text-gray-600">
              AI-powered strategic insights and implementation guidance for business growth
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="recommendations">Recommendations</option>
              <option value="implementation">Implementation</option>
              <option value="performance">Performance</option>
              <option value="success">Success Stories</option>
            </select>
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="all">All Categories</option>
              <option value="product">Product</option>
              <option value="marketing">Marketing</option>
              <option value="pricing">Pricing</option>
              <option value="expansion">Expansion</option>
              <option value="operations">Operations</option>
            </select>
            <select 
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-lime-500"
            >
              <option value="all">All Priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Recommendations</p>
              <p className="text-2xl font-bold text-gray-900">{recommendations.length}</p>
              <p className="text-sm text-green-600">↗ Strategic initiatives</p>
            </div>
            <div className="text-3xl">📋</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-gray-900">
                {recommendations.filter(r => r.priority === 'critical' || r.priority === 'high').length}
              </p>
              <p className="text-sm text-red-600">⚠ Immediate focus</p>
            </div>
            <div className="text-3xl">🚨</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {recommendations.filter(r => r.status === 'in-progress' || r.status === 'approved').length}
              </p>
              <p className="text-sm text-blue-600">→ Active implementation</p>
            </div>
            <div className="text-3xl">⚡</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Confidence</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round(recommendations.reduce((acc, r) => acc + r.confidence, 0) / recommendations.length)}%
              </p>
              <p className="text-sm text-green-600">↗ High accuracy</p>
            </div>
            <div className="text-3xl">🎯</div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {viewMode === 'recommendations' && (
        <div className="space-y-6">
          {recommendations.map((rec) => (
            <div key={rec.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{rec.title}</h3>
                  <p className="text-gray-600 mb-3">{rec.description}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getPriorityColor(rec.priority) }}
                  >
                    {rec.priority.toUpperCase()}
                  </span>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getCategoryColor(rec.category) }}
                  >
                    {rec.category.toUpperCase()}
                  </span>
                  <span 
                    className="px-2 py-1 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: getStatusColor(rec.status) }}
                  >
                    {rec.status.replace('-', ' ').toUpperCase()}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Impact Score</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${rec.impact * 10}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{rec.impact}/10</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Effort Required</p>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full"
                        style={{ width: `${rec.effort * 10}%` }}
                      ></div>
                    </div>
                    <span className="font-medium">{rec.effort}/10</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Timeline</p>
                  <p className="font-medium">{rec.timeline}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="font-medium">{rec.confidence}%</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-600 mb-2">RATIONALE</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.rationale.slice(0, 2).map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">EXPECTED OUTCOMES</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.expectedOutcomes.slice(0, 2).map((outcome, idx) => (
                      <li key={idx}>• {outcome}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-red-600 mb-2">RISKS</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.risks.slice(0, 2).map((risk, idx) => (
                      <li key={idx}>• {risk}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium text-purple-600 mb-2">KEY KPIS</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {rec.kpis.slice(0, 2).map((kpi, idx) => (
                      <li key={idx}>• {kpi}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Metrics */}
      {viewMode === 'performance' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Performance Tracking</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {performanceMetrics.map((metric, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">{metric.metric}</h4>
                  <span className="text-lg">{getTrendIcon(metric.trend)}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Current</span>
                    <span className="font-medium">{metric.current}{metric.category === 'Financial' ? '%' : metric.metric === 'Customer Satisfaction' ? '/5' : '%'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Target</span>
                    <span className="font-medium text-green-600">{metric.target}{metric.category === 'Financial' ? '%' : metric.metric === 'Customer Satisfaction' ? '/5' : '%'}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(metric.current / metric.target) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{metric.category}</span>
                    <span>{metric.timeline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Success Stories */}
      {viewMode === 'success' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {successStories.map((story, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{story.title}</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  {story.category}
                </span>
              </div>
              
              <p className="text-gray-600 mb-4">{story.implementation}</p>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-green-600 mb-2">RESULTS ACHIEVED</p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {story.results.map((result, idx) => (
                      <li key={idx}>• {result}</li>
                    ))}
                  </ul>
                </div>
                
                <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs text-gray-500">Business Impact</p>
                    <p className="font-medium text-green-600">{story.impact}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Timeline</p>
                    <p className="font-medium">{story.timeline}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StrategicRecommendationsDashboard;
