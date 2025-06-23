import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  title: string;
  path: string;
  icon?: string; // Unicode emoji
}

const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    path: '/dashboard',
    icon: '📊'
  },
  {
    title: 'New Content',
    path: '/project-setup',
    icon: '✏️'
  },
  {
    title: 'Content Library',
    path: '/content-library',
    icon: '📚'
  }
];

const llmContentNavItems: NavItem[] = [
  {
    title: 'Generate LLM Content',
    path: '/llm-content/generate',
    icon: '🤖'
  },
  {
    title: 'Analyze & Optimize',
    path: '/llm-content/analyze',
    icon: '📈'
  }
];

const competitionNavItems: NavItem[] = [
  {
    title: 'Competition X Dashboard',
    path: '/competition-x',
    icon: '🎯'
  },
  {
    title: 'Competitor Analysis',
    path: '/competition-x/analysis',
    icon: '📊'
  },
  {
    title: 'Market Intelligence',
    path: '/competition-x/intelligence',
    icon: '🧠'
  },
  {
    title: 'Real-time Monitoring',
    path: '/competition-x/monitoring',
    icon: '📡'
  }
];

const productXNavItems: NavItem[] = [
  {
    title: 'Product X Dashboard',
    path: '/product-x',
    icon: '🛏️'
  },
  {
    title: 'Market Research',
    path: '/product-x/market-research',
    icon: '📊'
  },
  {
    title: 'Competitive Intelligence',
    path: '/product-x/competitive-intelligence',
    icon: '🎯'
  },
  {
    title: 'Trend Analysis',
    path: '/product-x/trend-analysis',
    icon: '📈'
  },
  {
    title: 'User Profile Intelligence',
    path: '/product-x/user-profiles',
    icon: '👥'
  },
  {
    title: 'Audience Expansion',
    path: '/product-x/audience-expansion',
    icon: '🌐'
  },
  {
    title: 'Media Intelligence',
    path: '/product-x/media-intelligence',
    icon: '📺'
  },
  {
    title: 'Strategic Recommendations',
    path: '/product-x/strategic-recommendations',
    icon: '💡'
  }
];

const SiteNavigation: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 shadow-sm">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Content Architect</h1>
          <p className="text-xs text-gray-500">LLM-Optimized Content Platform</p>
        </div>
        
        {/* Main navigation */}
        <nav className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Main</h2>
          </div>
          <ul>
            {mainNavItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${isActive(item.path) 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          
          <div className="px-4 py-2 mt-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">LLM Content Tools</h2>
          </div>
          <ul>
            {llmContentNavItems.map((item) => (
              <li key={item.path}>
                <Link 
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${isActive(item.path) 
                    ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2 mt-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Competition X</h2>
          </div>
          <ul>
            {competitionNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${isActive(item.path)
                    ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                    : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2 mt-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Product X - Sleep Company</h2>
          </div>
          <ul>
            {productXNavItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 text-sm ${isActive(item.path)
                    ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600'
                    : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="px-4 py-2 mt-6">
            <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Settings</h2>
          </div>
          <ul>
            <li>
              <Link 
                to="/settings"
                className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <span className="mr-3">⚙️</span>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold">Content Architect</h1>
          <button 
            onClick={handleDrawerToggle}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
      
      {/* Mobile Sidebar */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black bg-opacity-50">
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-lg font-bold">Content Architect</h1>
              <button 
                onClick={handleDrawerToggle}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>
            
            <nav className="overflow-y-auto h-full">
              <div className="px-4 py-2">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Main</h2>
              </div>
              <ul>
                {mainNavItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      to={item.path}
                      className={`flex items-center px-4 py-3 text-sm ${isActive(item.path) 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={handleDrawerToggle}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className="px-4 py-2 mt-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">LLM Content Tools</h2>
              </div>
              <ul>
                {llmContentNavItems.map((item) => (
                  <li key={item.path}>
                    <Link 
                      to={item.path}
                      className={`flex items-center px-4 py-3 text-sm ${isActive(item.path) 
                        ? 'bg-blue-50 text-blue-600 border-l-4 border-blue-600' 
                        : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={handleDrawerToggle}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="px-4 py-2 mt-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Competition X</h2>
              </div>
              <ul>
                {competitionNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 text-sm ${isActive(item.path)
                        ? 'bg-purple-50 text-purple-600 border-l-4 border-purple-600'
                        : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={handleDrawerToggle}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="px-4 py-2 mt-6">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider">Product X - Sleep Company</h2>
              </div>
              <ul>
                {productXNavItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 text-sm ${isActive(item.path)
                        ? 'bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600'
                        : 'text-gray-700 hover:bg-gray-50'}`}
                      onClick={handleDrawerToggle}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
};

export default SiteNavigation;
