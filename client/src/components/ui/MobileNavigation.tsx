import React, { useState } from 'react';
// Temporary icon replacements
const Menu = ({ className }: { className?: string }) => <span className={className}>☰</span>;
const X = ({ className }: { className?: string }) => <span className={className}>✕</span>;
const Home = ({ className }: { className?: string }) => <span className={className}>🏠</span>;
const BarChart3 = ({ className }: { className?: string }) => <span className={className}>📊</span>;
const Brain = ({ className }: { className?: string }) => <span className={className}>🧠</span>;
const Monitor = ({ className }: { className?: string }) => <span className={className}>🖥️</span>;
const Settings = ({ className }: { className?: string }) => <span className={className}>⚙️</span>;
const User = ({ className }: { className?: string }) => <span className={className}>👤</span>;

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  badge?: number;
}

interface MobileNavigationProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  notifications?: number;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentPath,
  onNavigate,
  notifications = 0
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems: NavigationItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <Home className="w-5 h-5" />,
      path: '/dashboard'
    },
    {
      id: 'competition',
      label: 'Competition X',
      icon: <BarChart3 className="w-5 h-5" />,
      path: '/competition-x'
    },
    {
      id: 'ai-analysis',
      label: 'AI Analysis',
      icon: <Brain className="w-5 h-5" />,
      path: '/ai-analysis'
    },
    {
      id: 'monitoring',
      label: 'Monitoring',
      icon: <Monitor className="w-5 h-5" />,
      path: '/monitoring',
      badge: notifications
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5" />,
      path: '/settings'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <User className="w-5 h-5" />,
      path: '/profile'
    }
  ];

  const handleNavigate = (path: string) => {
    onNavigate(path);
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h1 className="text-lg font-semibold text-gray-900">Content Architect</h1>
        </div>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        >
          {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50" onClick={() => setIsMenuOpen(false)}>
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            {/* Menu Header */}
            <div className="px-4 py-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Items */}
            <nav className="px-2 py-4 space-y-1">
              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.path)}
                  className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-colors ${
                    currentPath === item.path
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* User Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">John Doe</p>
                  <p className="text-xs text-gray-500 truncate">john@example.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Navigation (Alternative Mobile Navigation) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-1">
        <div className="flex items-center justify-around">
          {navigationItems.slice(0, 4).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.path)}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                currentPath === item.path
                  ? 'text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {item.badge > 9 ? '9+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-xs mt-1 font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MobileNavigation;
