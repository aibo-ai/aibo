import React, { useState } from 'react';
import Card from '../ui/Card';

interface ProductIntelligenceResultsProps {
  results: ProductSearchResults | null;
  loading?: boolean;
}

export interface ProductDetails {
  pid: string;
  name: string;
  brand: string;
  category: string;
  price: {
    current: number;
    original: number;
    discount: number;
    currency: string;
  };
  rating: {
    average: number;
    count: number;
  };
  availability: {
    inStock: boolean;
    quantity?: number;
  };
  images: string[];
  description: string;
  seller: {
    name: string;
    rating: number;
  };
  reviews: {
    positive: number;
    negative: number;
    total: number;
  };
  url: string;
}

export interface ProductSearchResults {
  products: ProductDetails[];
  totalResults: number;
  searchQuery: string;
  filters: {
    categories: string[];
    brands: string[];
    priceRanges: Array<{
      min: number;
      max: number;
      count: number;
    }>;
  };
  trends: {
    priceHistory: Array<{
      date: string;
      averagePrice: number;
    }>;
    popularityScore: number;
    demandTrend: 'increasing' | 'decreasing' | 'stable';
  };
}

const formatPrice = (price: number, currency: string = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const getRatingColor = (rating: number): string => {
  if (rating >= 4.5) return 'text-green-600 bg-green-50';
  if (rating >= 4.0) return 'text-blue-600 bg-blue-50';
  if (rating >= 3.5) return 'text-yellow-600 bg-yellow-50';
  if (rating >= 3.0) return 'text-orange-600 bg-orange-50';
  return 'text-red-600 bg-red-50';
};

const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'increasing': return '📈';
    case 'decreasing': return '📉';
    default: return '➡️';
  }
};

export const ProductIntelligenceResults: React.FC<ProductIntelligenceResultsProps> = ({
  results,
  loading = false
}) => {
  const [sortBy, setSortBy] = useState<'relevance' | 'price' | 'rating' | 'discount'>('relevance');
  const [filterBy, setFilterBy] = useState<'all' | 'inStock' | 'highRated'>('all');

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching products with Rapid API...</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!results) {
    return (
      <Card className="p-6">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🛍️</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Ready for Product Search
          </h3>
          <p className="text-gray-600">
            Enter product details above to get comprehensive market intelligence and product data
          </p>
        </div>
      </Card>
    );
  }

  // Filter and sort products
  let filteredProducts = results.products;
  
  if (filterBy === 'inStock') {
    filteredProducts = filteredProducts.filter(p => p.availability.inStock);
  } else if (filterBy === 'highRated') {
    filteredProducts = filteredProducts.filter(p => p.rating.average >= 4.0);
  }

  if (sortBy === 'price') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price.current - b.price.current);
  } else if (sortBy === 'rating') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.rating.average - a.rating.average);
  } else if (sortBy === 'discount') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price.discount - a.price.discount);
  }

  return (
    <div className="space-y-6">
      {/* Search Summary */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              🛍️ Search Results for "{results.searchQuery}"
            </h3>
            <p className="text-gray-600">
              Found {results.totalResults} products • Showing {filteredProducts.length} results
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getTrendIcon(results.trends.demandTrend)}</span>
            <div className="text-sm text-gray-600">
              <div>Popularity: {Math.round(results.trends.popularityScore)}/100</div>
              <div>Trend: {results.trends.demandTrend}</div>
            </div>
          </div>
        </div>

        {/* Filters and Sorting */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="relevance">Relevance</option>
              <option value="price">Price (Low to High)</option>
              <option value="rating">Rating (High to Low)</option>
              <option value="discount">Discount (High to Low)</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mr-2">Filter:</label>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="all">All Products</option>
              <option value="inStock">In Stock Only</option>
              <option value="highRated">High Rated (4.0+)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Products Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map((product) => (
          <Card key={product.pid} className="p-4 hover:shadow-lg transition-shadow">
            {/* Product Image */}
            <div className="aspect-square bg-gray-100 rounded-lg mb-4 overflow-hidden">
              {product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgNzBDMTA4LjI4NCA3MCA5NS4yODQgNzAgMTAwIDcwWk0xMDAgMTMwQzEwOC4yODQgMTMwIDkxLjcxNiAxMzAgMTAwIDEzMFoiIHN0cm9rZT0iIzlDQTNBRiIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <span className="text-4xl">📦</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-3">
              <div>
                <h4 className="font-medium text-gray-900 line-clamp-2 text-sm">
                  {product.name}
                </h4>
                <p className="text-xs text-gray-500">{product.brand} • {product.category}</p>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold text-gray-900">
                  {formatPrice(product.price.current, product.price.currency)}
                </span>
                {product.price.discount > 0 && (
                  <>
                    <span className="text-sm text-gray-500 line-through">
                      {formatPrice(product.price.original, product.price.currency)}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {product.price.discount}% off
                    </span>
                  </>
                )}
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${getRatingColor(product.rating.average)}`}>
                  ⭐ {product.rating.average.toFixed(1)}
                </span>
                <span className="text-xs text-gray-500">
                  ({product.rating.count.toLocaleString()} reviews)
                </span>
              </div>

              {/* Availability */}
              <div className="flex items-center justify-between">
                <span className={`text-xs px-2 py-1 rounded ${
                  product.availability.inStock 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {product.availability.inStock ? '✅ In Stock' : '❌ Out of Stock'}
                </span>
                <span className="text-xs text-gray-500">
                  {product.seller.name}
                </span>
              </div>

              {/* Action Button */}
              <button
                onClick={() => product.url && window.open(product.url, '_blank')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={!product.url}
              >
                {product.url ? 'View Product' : 'Product Link Unavailable'}
              </button>
            </div>
          </Card>
        ))}
      </div>

      {/* Market Insights */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">📊 Market Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Top Categories</h4>
            <div className="space-y-1">
              {results.filters.categories.slice(0, 5).map((category, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {category}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Popular Brands</h4>
            <div className="space-y-1">
              {results.filters.brands.slice(0, 5).map((brand, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {brand}
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Price Distribution</h4>
            <div className="space-y-1">
              {results.filters.priceRanges.map((range, index) => (
                <div key={index} className="text-sm text-gray-600">
                  {formatPrice(range.min)} - {formatPrice(range.max)}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
