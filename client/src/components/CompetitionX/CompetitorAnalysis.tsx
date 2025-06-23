import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';
import RealTimeMonitoring from './RealTimeMonitoring';
import AIAnalysis from './AIAnalysis';

interface CompetitorData {
  id: string;
  name: string;
  logo: string;
  marketShare: number;
  revenue: number;
  employees: number;
  founded: number;
  headquarters: string;
  strengths: string[];
  weaknesses: string[];
  recentNews: NewsItem[];
  products: Product[];
  socialMetrics: SocialMetrics;
}

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  date: string;
  source: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
}

interface SocialMetrics {
  linkedin: number;
  twitter: number;
  instagram: number;
  facebook: number;
  engagement: number;
}

interface CustomCompetitor {
  id: string;
  name: string;
  website: string;
  industry: string;
  description: string;
  addedDate: string;
  isActive: boolean;
}

const CompetitorAnalysis: React.FC = () => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('herman-miller');
  const [analysisType, setAnalysisType] = useState<'overview' | 'products' | 'social' | 'news' | 'manage' | 'monitoring' | 'ai-analysis'>('overview');
  const [customCompetitors, setCustomCompetitors] = useState<CustomCompetitor[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newCompetitor, setNewCompetitor] = useState<Partial<CustomCompetitor>>({
    name: '',
    website: '',
    industry: '',
    description: ''
  });

  // Mock competitor data
  const competitorData: Record<string, CompetitorData> = {
    'herman-miller': {
      id: 'herman-miller',
      name: 'Herman Miller',
      logo: '🪑',
      marketShare: 28.5,
      revenue: 2800000000,
      employees: 8500,
      founded: 1905,
      headquarters: 'Zeeland, Michigan, USA',
      strengths: [
        'Strong brand recognition and premium positioning',
        'Innovative design and ergonomic research',
        'Sustainable manufacturing practices',
        'Global distribution network',
        'High-quality materials and craftsmanship'
      ],
      weaknesses: [
        'Premium pricing limits market reach',
        'Limited presence in budget segment',
        'Dependence on office furniture market',
        'Competition from emerging brands'
      ],
      recentNews: [
        {
          id: '1',
          title: 'Herman Miller Reports Strong Q3 Earnings',
          summary: 'Company exceeds revenue expectations with 15% growth in ergonomic seating division',
          date: '2024-01-15',
          source: 'Business Wire',
          sentiment: 'positive'
        },
        {
          id: '2',
          title: 'New Sustainability Initiative Launched',
          summary: 'Herman Miller commits to carbon neutrality by 2030 with new green manufacturing processes',
          date: '2024-01-10',
          source: 'GreenBiz',
          sentiment: 'positive'
        }
      ],
      products: [
        {
          id: '1',
          name: 'Aeron Chair',
          category: 'Task Chair',
          price: 1395,
          rating: 4.8,
          reviews: 2847
        },
        {
          id: '2',
          name: 'Embody Chair',
          category: 'Task Chair',
          price: 1795,
          rating: 4.7,
          reviews: 1923
        }
      ],
      socialMetrics: {
        linkedin: 245000,
        twitter: 89000,
        instagram: 156000,
        facebook: 312000,
        engagement: 4.2
      }
    },
    'steelcase': {
      id: 'steelcase',
      name: 'Steelcase',
      logo: '🏢',
      marketShare: 24.2,
      revenue: 3200000000,
      employees: 12000,
      founded: 1912,
      headquarters: 'Grand Rapids, Michigan, USA',
      strengths: [
        'Comprehensive workplace solutions',
        'Strong research and development',
        'Global presence and scale',
        'Technology integration capabilities',
        'Diverse product portfolio'
      ],
      weaknesses: [
        'Complex product lines can confuse customers',
        'Higher operational costs',
        'Slower innovation cycles',
        'Limited direct-to-consumer presence'
      ],
      recentNews: [
        {
          id: '1',
          title: 'Steelcase Unveils New Remote Work Solutions',
          summary: 'Company launches comprehensive home office furniture line targeting remote workers',
          date: '2024-01-12',
          source: 'Furniture Today',
          sentiment: 'positive'
        }
      ],
      products: [
        {
          id: '1',
          name: 'Leap Chair',
          category: 'Task Chair',
          price: 1086,
          rating: 4.6,
          reviews: 1654
        }
      ],
      socialMetrics: {
        linkedin: 198000,
        twitter: 67000,
        instagram: 134000,
        facebook: 278000,
        engagement: 3.8
      }
    }
  };

  // Load custom competitors from localStorage on component mount
  useEffect(() => {
    const savedCompetitors = localStorage.getItem('customCompetitors');
    if (savedCompetitors) {
      try {
        setCustomCompetitors(JSON.parse(savedCompetitors));
      } catch (error) {
        console.error('Error loading custom competitors:', error);
      }
    }
  }, []);

  // Save custom competitors to localStorage whenever the list changes
  useEffect(() => {
    localStorage.setItem('customCompetitors', JSON.stringify(customCompetitors));
  }, [customCompetitors]);

  const competitors = Object.keys(competitorData);
  const currentData = competitorData[selectedCompetitor];

  // Competitor management functions
  const addCustomCompetitor = () => {
    if (!newCompetitor.name || !newCompetitor.website) {
      alert('Please fill in at least the name and website fields.');
      return;
    }

    const competitor: CustomCompetitor = {
      id: `custom-${Date.now()}`,
      name: newCompetitor.name!,
      website: newCompetitor.website!,
      industry: newCompetitor.industry || 'Unknown',
      description: newCompetitor.description || '',
      addedDate: new Date().toISOString(),
      isActive: true
    };

    setCustomCompetitors(prev => [...prev, competitor]);
    setNewCompetitor({ name: '', website: '', industry: '', description: '' });
    setShowAddForm(false);
  };

  const removeCustomCompetitor = (id: string) => {
    if (window.confirm('Are you sure you want to remove this competitor from your tracking list?')) {
      setCustomCompetitors(prev => prev.filter(comp => comp.id !== id));
    }
  };

  const toggleCompetitorStatus = (id: string) => {
    setCustomCompetitors(prev =>
      prev.map(comp =>
        comp.id === id ? { ...comp, isActive: !comp.isActive } : comp
      )
    );
  };

  const exportCompetitorList = () => {
    const dataStr = JSON.stringify(customCompetitors, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `competitor-list-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importCompetitorList = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedCompetitors = JSON.parse(e.target?.result as string);
        if (Array.isArray(importedCompetitors)) {
          setCustomCompetitors(prev => [...prev, ...importedCompetitors]);
        }
      } catch (error) {
        alert('Error importing competitor list. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Company Overview</h3>
        <div className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Founded</span>
            <span className="font-medium">{currentData.founded}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Headquarters</span>
            <span className="font-medium">{currentData.headquarters}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Employees</span>
            <span className="font-medium">{formatNumber(currentData.employees)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Annual Revenue</span>
            <span className="font-medium">{formatCurrency(currentData.revenue)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Market Share</span>
            <span className="font-medium">{currentData.marketShare}%</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">SWOT Analysis</h3>
        <div className="space-y-4">
          <div>
            <h4 className="font-medium text-green-600 mb-2">Strengths</h4>
            <ul className="text-sm space-y-1">
              {currentData.strengths.slice(0, 3).map((strength, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-red-600 mb-2">Weaknesses</h4>
            <ul className="text-sm space-y-1">
              {currentData.weaknesses.slice(0, 3).map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-red-500 mr-2">•</span>
                  {weakness}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderProducts = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Product Portfolio</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentData.products.map((product) => (
          <div key={product.id} className="border rounded-lg p-4">
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-gray-600">{product.category}</p>
            <div className="mt-2 flex justify-between items-center">
              <span className="font-semibold">{formatCurrency(product.price)}</span>
              <div className="flex items-center space-x-1">
                <span className="text-yellow-500">⭐</span>
                <span className="text-sm">{product.rating}</span>
                <span className="text-xs text-gray-500">({formatNumber(product.reviews)})</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderSocial = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Social Media Presence</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl mb-2">💼</div>
          <div className="font-semibold">{formatNumber(currentData.socialMetrics.linkedin)}</div>
          <div className="text-sm text-gray-600">LinkedIn</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-2">🐦</div>
          <div className="font-semibold">{formatNumber(currentData.socialMetrics.twitter)}</div>
          <div className="text-sm text-gray-600">Twitter</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-2">📷</div>
          <div className="font-semibold">{formatNumber(currentData.socialMetrics.instagram)}</div>
          <div className="text-sm text-gray-600">Instagram</div>
        </div>
        <div className="text-center">
          <div className="text-2xl mb-2">📘</div>
          <div className="font-semibold">{formatNumber(currentData.socialMetrics.facebook)}</div>
          <div className="text-sm text-gray-600">Facebook</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-lg font-semibold">{currentData.socialMetrics.engagement}%</div>
        <div className="text-sm text-gray-600">Average Engagement Rate</div>
      </div>
    </Card>
  );

  const renderNews = () => (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent News & Updates</h3>
      <div className="space-y-4">
        {currentData.recentNews.map((news) => (
          <div key={news.id} className="border-l-4 border-blue-500 pl-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-medium">{news.title}</h4>
              <span className={`px-2 py-1 rounded text-xs ${getSentimentColor(news.sentiment)}`}>
                {news.sentiment}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{news.summary}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{news.source}</span>
              <span>{new Date(news.date).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  const renderCompetitorManagement = () => (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold">Competitor List Management</h3>
            <p className="text-gray-600">Create and manage your custom competitor tracking list</p>
          </div>
          <div className="flex space-x-3">
            <Button
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center space-x-2"
            >
              <span>➕</span>
              <span>Add Competitor</span>
            </Button>
            <Button
              onClick={exportCompetitorList}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <span>📤</span>
              <span>Export List</span>
            </Button>
            <label className="cursor-pointer">
              <div className="inline-flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <span>📥</span>
                <span>Import List</span>
              </div>
              <input
                type="file"
                accept=".json"
                onChange={importCompetitorList}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Add Competitor Form */}
        {showAddForm && (
          <div className="border rounded-lg p-4 mb-6 bg-gray-50">
            <h4 className="font-medium mb-4">Add New Competitor</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  value={newCompetitor.name || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website *
                </label>
                <input
                  type="url"
                  value={newCompetitor.website || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, website: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <input
                  type="text"
                  value={newCompetitor.industry || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, industry: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Office Furniture, SaaS, E-commerce"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newCompetitor.description || ''}
                  onChange={(e) => setNewCompetitor(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the company"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                onClick={() => setShowAddForm(false)}
                variant="outline"
              >
                Cancel
              </Button>
              <Button
                onClick={addCustomCompetitor}
              >
                Add Competitor
              </Button>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{customCompetitors.length}</div>
            <div className="text-sm text-blue-600">Total Competitors</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {customCompetitors.filter(c => c.isActive).length}
            </div>
            <div className="text-sm text-green-600">Active Tracking</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {new Set(customCompetitors.map(c => c.industry)).size}
            </div>
            <div className="text-sm text-purple-600">Industries</div>
          </div>
        </div>
      </Card>

      {/* Competitor List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Your Competitor List</h3>
        {customCompetitors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-4">🏢</div>
            <p>No competitors added yet.</p>
            <p className="text-sm">Click "Add Competitor" to start building your tracking list.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {customCompetitors.map((competitor) => (
              <div
                key={competitor.id}
                className={`border rounded-lg p-4 ${competitor.isActive ? 'bg-white' : 'bg-gray-50'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-medium text-lg">{competitor.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        competitor.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {competitor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Website:</span>
                        <a
                          href={competitor.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:underline"
                        >
                          {competitor.website}
                        </a>
                      </div>
                      <div>
                        <span className="text-gray-600">Industry:</span>
                        <span className="ml-2">{competitor.industry}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Added:</span>
                        <span className="ml-2">
                          {new Date(competitor.addedDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {competitor.description && (
                      <p className="text-sm text-gray-600 mt-2">{competitor.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <Button
                      onClick={() => toggleCompetitorStatus(competitor.id)}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <span>{competitor.isActive ? '⏸️' : '▶️'}</span>
                      <span>{competitor.isActive ? 'Pause' : 'Resume'}</span>
                    </Button>
                    <Button
                      onClick={() => removeCustomCompetitor(competitor.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:bg-red-50"
                    >
                      🗑️ Remove
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Competitor Analysis</h1>
          <p className="text-gray-600 mt-2">Deep dive into competitive landscape and market positioning</p>
        </div>
      </div>

      {/* Competitor Selection */}
      <div className="mb-6">
        <div className="flex space-x-2 mb-4">
          {competitors.map((competitorId) => (
            <Button
              key={competitorId}
              variant={selectedCompetitor === competitorId ? 'primary' : 'outline'}
              onClick={() => setSelectedCompetitor(competitorId)}
              className="flex items-center space-x-2"
            >
              <span>{competitorData[competitorId].logo}</span>
              <span>{competitorData[competitorId].name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Analysis Type Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'products', label: 'Products' },
            { key: 'social', label: 'Social Media' },
            { key: 'news', label: 'News & Updates' },
            { key: 'monitoring', label: 'Real-time Monitoring' },
            { key: 'ai-analysis', label: 'AI Analysis' },
            { key: 'manage', label: 'Manage Competitors' }
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={analysisType === tab.key ? 'primary' : 'ghost'}
              onClick={() => setAnalysisType(tab.key as any)}
              className="flex-1"
            >
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {analysisType === 'overview' && renderOverview()}
        {analysisType === 'products' && renderProducts()}
        {analysisType === 'social' && renderSocial()}
        {analysisType === 'news' && renderNews()}
        {analysisType === 'monitoring' && <RealTimeMonitoring />}
        {analysisType === 'ai-analysis' && <AIAnalysis />}
        {analysisType === 'manage' && renderCompetitorManagement()}
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
