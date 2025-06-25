import React, { useState } from 'react';
import { ProductIntelligenceSearch, ProductSearchData } from './ProductIntelligenceSearch';
import { ProductIntelligenceResults, ProductSearchResults } from './ProductIntelligenceResults';
import Card from '../ui/Card';
import { Button } from '../ui/Button';

interface ProductIntelligenceDashboardProps {
  className?: string;
}

export const ProductIntelligenceDashboard: React.FC<ProductIntelligenceDashboardProps> = ({
  className = ''
}) => {
  const [searchResults, setSearchResults] = useState<ProductSearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const handleSearch = async (searchData: ProductSearchData) => {
    setLoading(true);
    setError(null);

    try {
      // Call the backend API
      const response = await fetch('/api/rapid-api/product-search', {
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
        if (!searchHistory.includes(searchData.productName)) {
          setSearchHistory(prev => [searchData.productName, ...prev.slice(0, 4)]);
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

  const handleQuickSearch = (productName: string) => {
    const quickSearchData: ProductSearchData = {
      productName,
      category: '',
      priceRange: { min: 0, max: 50000 },
      country: 'IN'
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-lg">
        <h1 className="text-3xl font-bold mb-2">
          🛍️ Product Intelligence Platform
        </h1>
        <p className="text-purple-100">
          Comprehensive product search and market intelligence powered by Rapid API. Analyze products, track prices, and discover market trends.
        </p>
      </div>

      {/* Quick Actions */}
      {searchHistory.length > 0 && (
        <Card className="p-4">
          <h3 className="font-medium text-gray-900 mb-3">Recent Searches</h3>
          <div className="flex flex-wrap gap-2">
            {searchHistory.map((query, index) => (
              <Button
                key={index}
                onClick={() => handleQuickSearch(query)}
                className="text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded-full"
                disabled={loading}
              >
                {query}
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
      <ProductIntelligenceSearch onSearch={handleSearch} loading={loading} />

      {/* Results */}
      <ProductIntelligenceResults results={searchResults} loading={loading} />

      {/* Features Overview */}
      {!searchResults && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="font-bold text-gray-900 mb-2">Product Search</h3>
              <p className="text-gray-600 text-sm">
                Search millions of products across categories with advanced filtering and sorting options
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="font-bold text-gray-900 mb-2">Market Analytics</h3>
              <p className="text-gray-600 text-sm">
                Get comprehensive market insights including price trends, popularity scores, and demand analysis
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">💰</div>
              <h3 className="font-bold text-gray-900 mb-2">Price Intelligence</h3>
              <p className="text-gray-600 text-sm">
                Track price history, compare costs across sellers, and identify the best deals and discounts
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">⭐</div>
              <h3 className="font-bold text-gray-900 mb-2">Rating Analysis</h3>
              <p className="text-gray-600 text-sm">
                Analyze product ratings, review counts, and customer satisfaction metrics
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">📈</div>
              <h3 className="font-bold text-gray-900 mb-2">Trend Tracking</h3>
              <p className="text-gray-600 text-sm">
                Monitor product popularity trends and demand patterns over time
              </p>
            </div>
          </Card>

          <Card className="p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">🏪</div>
              <h3 className="font-bold text-gray-900 mb-2">Seller Insights</h3>
              <p className="text-gray-600 text-sm">
                Compare sellers, check ratings, and find the most reliable product sources
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* API Information */}
      <Card className="p-6 bg-gray-50">
        <h3 className="font-bold text-gray-900 mb-4">Platform Capabilities</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Flipkart Product Catalog</li>
              <li>• Real-time Price Updates</li>
              <li>• Customer Reviews & Ratings</li>
              <li>• Seller Information</li>
              <li>• Stock Availability</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Analytics Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Price History Tracking</li>
              <li>• Market Trend Analysis</li>
              <li>• Competitive Intelligence</li>
              <li>• Demand Forecasting</li>
              <li>• Product Recommendations</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* API Status */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">Rapid API Connected</span>
          </div>
          <div className="text-xs text-gray-500">
            Powered by Flipkart Product Intelligence API
          </div>
        </div>
      </Card>
    </div>
  );
};
