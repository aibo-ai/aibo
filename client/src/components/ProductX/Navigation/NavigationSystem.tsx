import React, { useState, useEffect, createContext, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productXColors } from '../../../styles/productXTheme';

// Navigation context interfaces
interface NavigationContextType {
  currentPath: string;
  breadcrumbs: BreadcrumbItem[];
  navigationHistory: string[];
  addToBreadcrumbs: (item: BreadcrumbItem) => void;
  navigateWithContext: (path: string, context?: any) => void;
  goBack: () => void;
  clearHistory: () => void;
}

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: string;
  context?: any;
}

interface QuickNavigationProps {
  recentPages: Array<{
    path: string;
    label: string;
    icon: string;
    timestamp: Date;
  }>;
  favoritePages: Array<{
    path: string;
    label: string;
    icon: string;
  }>;
  onAddToFavorites: (path: string) => void;
  onRemoveFromFavorites: (path: string) => void;
}

interface SearchNavigationProps {
  onSearch: (query: string) => void;
  searchResults: Array<{
    path: string;
    label: string;
    description: string;
    category: string;
    relevance: number;
  }>;
  isSearching: boolean;
}

interface ContextualMenuProps {
  currentPage: string;
  relatedPages: Array<{
    path: string;
    label: string;
    description: string;
    relevance: number;
  }>;
  quickActions: Array<{
    label: string;
    action: () => void;
    icon: string;
  }>;
}

// Navigation Context
const NavigationContext = createContext<NavigationContextType | null>(null);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);

  useEffect(() => {
    setNavigationHistory(prev => [...prev, location.pathname].slice(-10)); // Keep last 10 pages
  }, [location.pathname]);

  const addToBreadcrumbs = (item: BreadcrumbItem) => {
    setBreadcrumbs(prev => {
      const existing = prev.findIndex(b => b.path === item.path);
      if (existing >= 0) {
        return prev.slice(0, existing + 1);
      }
      return [...prev, item];
    });
  };

  const navigateWithContext = (path: string, context?: any) => {
    navigate(path, { state: context });
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const previousPage = navigationHistory[navigationHistory.length - 2];
      navigate(previousPage);
    }
  };

  const clearHistory = () => {
    setNavigationHistory([location.pathname]);
    setBreadcrumbs([]);
  };

  return (
    <NavigationContext.Provider value={{
      currentPath: location.pathname,
      breadcrumbs,
      navigationHistory,
      addToBreadcrumbs,
      navigateWithContext,
      goBack,
      clearHistory
    }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

// Breadcrumb Navigation Component
export const BreadcrumbNavigation: React.FC = () => {
  const { breadcrumbs, navigateWithContext } = useNavigation();

  if (breadcrumbs.length === 0) return null;

  return (
    <nav className="flex items-center space-x-2 text-sm mb-6">
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.path}>
          <button
            onClick={() => navigateWithContext(crumb.path, crumb.context)}
            className={`flex items-center space-x-1 hover:text-blue-600 ${
              index === breadcrumbs.length - 1
                ? 'text-gray-900 font-medium'
                : 'text-blue-600'
            }`}
          >
            {crumb.icon && <span>{crumb.icon}</span>}
            <span>{crumb.label}</span>
          </button>
          {index < breadcrumbs.length - 1 && (
            <span className="text-gray-400">/</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// Quick Navigation Component
export const QuickNavigation: React.FC<QuickNavigationProps> = ({
  recentPages,
  favoritePages,
  onAddToFavorites,
  onRemoveFromFavorites
}) => {
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites'>('recent');
  const { navigateWithContext, currentPath } = useNavigation();

  const isFavorite = (path: string) => favoritePages.some(fav => fav.path === path);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-900">Quick Navigation</h3>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeTab === 'recent'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Recent
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              activeTab === 'favorites'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Favorites
          </button>
        </div>
      </div>

      <div className="space-y-2">
        {activeTab === 'recent' && (
          <>
            {recentPages.slice(0, 5).map((page, index) => (
              <div
                key={page.path}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => navigateWithContext(page.path)}
              >
                <div className="flex items-center space-x-2">
                  <span>{page.icon}</span>
                  <span className="text-sm text-gray-700">{page.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">
                    {page.timestamp.toLocaleTimeString()}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isFavorite(page.path)) {
                        onRemoveFromFavorites(page.path);
                      } else {
                        onAddToFavorites(page.path);
                      }
                    }}
                    className={`text-xs ${
                      isFavorite(page.path) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'
                    }`}
                  >
                    ⭐
                  </button>
                </div>
              </div>
            ))}
          </>
        )}

        {activeTab === 'favorites' && (
          <>
            {favoritePages.map((page) => (
              <div
                key={page.path}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md cursor-pointer"
                onClick={() => navigateWithContext(page.path)}
              >
                <div className="flex items-center space-x-2">
                  <span>{page.icon}</span>
                  <span className="text-sm text-gray-700">{page.label}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveFromFavorites(page.path);
                  }}
                  className="text-xs text-yellow-500 hover:text-gray-400"
                >
                  ⭐
                </button>
              </div>
            ))}
            {favoritePages.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No favorites yet. Click ⭐ to add pages to favorites.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// Search Navigation Component
export const SearchNavigation: React.FC<SearchNavigationProps> = ({
  onSearch,
  searchResults,
  isSearching
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { navigateWithContext } = useNavigation();

  const handleSearch = (value: string) => {
    setQuery(value);
    if (value.length > 2) {
      onSearch(value);
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  const handleResultClick = (result: any) => {
    navigateWithContext(result.path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder="Search dashboards, reports, insights..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="absolute left-3 top-2.5">
          <span className="text-gray-400">🔍</span>
        </div>
        {isSearching && (
          <div className="absolute right-3 top-2.5">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{result.label}</h4>
                      <p className="text-xs text-gray-600 mt-1">{result.description}</p>
                      <span className="inline-block px-2 py-1 bg-gray-100 text-xs text-gray-600 rounded mt-2">
                        {result.category}
                      </span>
                    </div>
                    <div className="ml-2">
                      <div className="w-16 bg-gray-200 rounded-full h-1">
                        <div 
                          className="bg-blue-500 h-1 rounded-full"
                          style={{ width: `${result.relevance}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{result.relevance}% match</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query.length > 2 && !isSearching ? (
            <div className="py-8 text-center text-gray-500">
              <span className="text-2xl">🔍</span>
              <p className="text-sm mt-2">No results found for "{query}"</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

// Contextual Menu Component
export const ContextualMenu: React.FC<ContextualMenuProps> = ({
  currentPage,
  relatedPages,
  quickActions
}) => {
  const { navigateWithContext } = useNavigation();

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-4">Related & Actions</h3>
      
      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="mb-4">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                className="flex items-center space-x-2 p-2 text-sm border border-gray-200 rounded-md hover:bg-gray-50"
              >
                <span>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Related Pages */}
      {relatedPages.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-gray-700 mb-2">Related Pages</h4>
          <div className="space-y-2">
            {relatedPages.slice(0, 4).map((page, index) => (
              <button
                key={index}
                onClick={() => navigateWithContext(page.path)}
                className="w-full text-left p-2 hover:bg-gray-50 rounded-md"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{page.label}</p>
                    <p className="text-xs text-gray-600">{page.description}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {page.relevance}% related
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Navigation Analytics Hook
export const useNavigationAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    pageViews: {} as Record<string, number>,
    timeSpent: {} as Record<string, number>,
    navigationPaths: [] as string[][],
    popularPages: [] as Array<{ path: string; views: number; avgTime: number }>
  });

  const trackPageView = (path: string) => {
    setAnalytics(prev => ({
      ...prev,
      pageViews: {
        ...prev.pageViews,
        [path]: (prev.pageViews[path] || 0) + 1
      }
    }));
  };

  const trackTimeSpent = (path: string, timeMs: number) => {
    setAnalytics(prev => ({
      ...prev,
      timeSpent: {
        ...prev.timeSpent,
        [path]: (prev.timeSpent[path] || 0) + timeMs
      }
    }));
  };

  const getPopularPages = () => {
    return Object.entries(analytics.pageViews)
      .map(([path, views]) => ({
        path,
        views,
        avgTime: analytics.timeSpent[path] || 0
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  return {
    analytics,
    trackPageView,
    trackTimeSpent,
    getPopularPages
  };
};

// Export all components
export default {
  NavigationProvider,
  BreadcrumbNavigation,
  QuickNavigation,
  SearchNavigation,
  ContextualMenu,
  useNavigation,
  useNavigationAnalytics
};
