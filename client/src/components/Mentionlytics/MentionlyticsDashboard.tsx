import React, { useState } from 'react';
import { MentionlyticsSearch, MentionlyticsSearchData } from './MentionlyticsSearch';
import { MentionlyticsResults, MentionlyticsSearchResults } from './MentionlyticsResults';
import Card from '../ui/Card';
import { Button } from '../ui/Button';

interface MentionlyticsDashboardProps {
  className?: string;
}

export const MentionlyticsDashboard: React.FC<MentionlyticsDashboardProps> = ({
  className = ''
}) => {
  const [searchResults, setSearchResults] = useState<MentionlyticsSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async (searchData: MentionlyticsSearchData) => {
    setLoading(true);
    setError(null);

    try {
      // Call the backend API
      const response = await fetch('/api/mentionlytics/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success) {
        setSearchResults(result.data);
        
        // Add to search history
        if (!searchHistory.includes(searchData.keyword)) {
          setSearchHistory(prev => [searchData.keyword, ...prev.slice(0, 4)]);
        }
      } else {
        throw new Error(result.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSearch = (keyword: string) => {
    const quickSearchData: MentionlyticsSearchData = {
      keyword,
      platforms: ['twitter', 'facebook', 'instagram'],
      languages: ['en'],
      countries: ['US'],
      limit: 100,
      includeInfluencers: true
    };
    handleSearch(quickSearchData);
  };

  const clearResults = () => {
    setSearchResults(null);
    setError(null);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">
          🎯 Mentionlytics Social Listening
        </h1>
        <p className="text-blue-100">
          Monitor your brand, track competitors, and analyze social media conversations in real-time
        </p>
      </div>

      {/* Quick Actions */}
      {searchHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((keyword, index) => (
              <Button
                key={index}
                onClick={() => handleQuickSearch(keyword)}
                className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full"
                disabled={loading}
              >
                {keyword}
              </Button>
            ))}
            <Button
              onClick={() => setSearchHistory([])}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear History
            </Button>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <span className="text-red-500 text-lg">⚠️</span>
            <div>
              <h4 className="font-medium text-red-800">Search Error</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <Button
              onClick={clearResults}
              className="ml-auto text-red-600 hover:text-red-700 text-sm"
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Search Form */}
      <MentionlyticsSearch onSearch={handleSearch} loading={loading} />

      {/* Results */}
      <MentionlyticsResults results={searchResults} loading={loading} />

      {/* Features Overview */}
      {!searchResults && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold text-gray-900 mb-2">Real-time Monitoring</h3>
              <p className="text-gray-600 text-sm">
                Track mentions across Twitter, Facebook, Instagram, LinkedIn, and more platforms in real-time
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">Sentiment Analysis</h3>
              <p className="text-gray-600 text-sm">
                Understand public perception with AI-powered sentiment analysis and emotion detection
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="font-bold text-gray-900 mb-2">Influencer Tracking</h3>
              <p className="text-gray-600 text-sm">
                Identify key influencers and track their engagement with your brand or competitors
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🌍</div>
              <h3 className="font-bold text-gray-900 mb-2">Global Coverage</h3>
              <p className="text-gray-600 text-sm">
                Monitor mentions across multiple languages and countries for comprehensive coverage
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="font-bold text-gray-900 mb-2">Real-time Alerts</h3>
              <p className="text-gray-600 text-sm">
                Get instant notifications for mention spikes, sentiment changes, and viral content
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="font-bold text-gray-900 mb-2">Analytics & Reports</h3>
              <p className="text-gray-600 text-sm">
                Generate detailed reports with engagement metrics, reach analysis, and trend insights
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* API Status */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Mentionlytics API Connected</span>
          </div>
          <div className="text-xs text-gray-500">
            Powered by Mentionlytics Social Listening Platform
          </div>
        </div>
      </Card>
    </div>
  );
};
