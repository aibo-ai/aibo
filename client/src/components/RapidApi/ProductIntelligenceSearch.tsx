import React, { useState } from 'react';
import Card from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface ProductIntelligenceSearchProps {
  onSearch: (searchData: ProductSearchData) => void;
  loading?: boolean;
}

export interface ProductSearchData {
  productName: string;
  category?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  brand?: string;
  country?: string;
  lookBackPeriod?: number;
}

const PRODUCT_CATEGORIES = [
  'Electronics',
  'Fashion',
  'Home & Garden',
  'Sports & Outdoors',
  'Health & Beauty',
  'Books',
  'Toys & Games',
  'Automotive',
  'Grocery',
  'Baby Products',
  'Pet Supplies',
  'Office Products'
];

const COUNTRIES = [
  { value: 'IN', label: 'India' },
  { value: 'US', label: 'United States' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'CA', label: 'Canada' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
  { value: 'CN', label: 'China' },
  { value: 'BR', label: 'Brazil' }
];

export const ProductIntelligenceSearch: React.FC<ProductIntelligenceSearchProps> = ({
  onSearch,
  loading = false
}) => {
  const [searchData, setSearchData] = useState<ProductSearchData>({
    productName: '',
    category: '',
    priceRange: { min: 0, max: 10000 },
    brand: '',
    country: 'IN',
    lookBackPeriod: 30
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchData.productName.trim()) {
      onSearch(searchData);
    }
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🛍️ Product Intelligence Search
        </h2>
        <p className="text-gray-600">
          Search and analyze product data with comprehensive market intelligence powered by Rapid API
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <Input
              type="text"
              value={searchData.productName}
              onChange={(e) => setSearchData(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="iPhone 15, Samsung Galaxy, Nike Shoes..."
              className="w-full"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={searchData.category}
              onChange={(e) => setSearchData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Categories</option>
              {PRODUCT_CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Min Price (₹)
            </label>
            <Input
              type="number"
              value={searchData.priceRange?.min || 0}
              onChange={(e) => setSearchData(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange!, min: parseInt(e.target.value) || 0 }
              }))}
              placeholder="0"
              className="w-full"
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Price (₹)
            </label>
            <Input
              type="number"
              value={searchData.priceRange?.max || 10000}
              onChange={(e) => setSearchData(prev => ({
                ...prev,
                priceRange: { ...prev.priceRange!, max: parseInt(e.target.value) || 10000 }
              }))}
              placeholder="10000"
              className="w-full"
              min="0"
            />
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div>
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            {showAdvanced ? '▼ Hide Advanced Options' : '▶ Show Advanced Options'}
          </button>
        </div>

        {/* Advanced Options */}
        {showAdvanced && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand
                </label>
                <Input
                  type="text"
                  value={searchData.brand}
                  onChange={(e) => setSearchData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Apple, Samsung, Nike..."
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Country
                </label>
                <select
                  value={searchData.country}
                  onChange={(e) => setSearchData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {COUNTRIES.map(country => (
                    <option key={country.value} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Look Back Period (Days)
              </label>
              <select
                value={searchData.lookBackPeriod}
                onChange={(e) => setSearchData(prev => ({ ...prev, lookBackPeriod: parseInt(e.target.value) }))}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 3 months</option>
                <option value={180}>Last 6 months</option>
                <option value={365}>Last year</option>
              </select>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={loading || !searchData.productName.trim()}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Searching...</span>
              </div>
            ) : (
              '🔍 Search Products'
            )}
          </Button>
        </div>
      </form>

      {/* Quick Search Examples */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Search Examples</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">📱</div>
              <h4 className="font-medium text-gray-900">Smartphones</h4>
              <p className="text-sm text-gray-600 mt-1">Latest mobile devices</p>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">👟</div>
              <h4 className="font-medium text-gray-900">Footwear</h4>
              <p className="text-sm text-gray-600 mt-1">Sports and casual shoes</p>
            </div>
          </Card>
          <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
            <div className="text-center">
              <div className="text-2xl mb-2">💻</div>
              <h4 className="font-medium text-gray-900">Electronics</h4>
              <p className="text-sm text-gray-600 mt-1">Laptops and gadgets</p>
            </div>
          </Card>
        </div>
      </div>
    </Card>
  );
};
