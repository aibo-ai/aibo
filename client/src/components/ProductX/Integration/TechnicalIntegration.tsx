import React, { useState, useEffect, createContext, useContext } from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Technical integration interfaces
interface APIContextType {
  isConnected: boolean;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  lastSync: Date | null;
  apiHealth: Record<string, 'healthy' | 'degraded' | 'down'>;
  retryConnection: () => void;
  syncData: (endpoint: string) => Promise<any>;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'analyst' | 'viewer';
  avatar?: string;
  lastLogin: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface PerformanceMetrics {
  apiResponseTime: number;
  dataFreshness: number;
  cacheHitRate: number;
  errorRate: number;
  uptime: number;
}

interface CacheConfig {
  ttl: number;
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}

// API Context
const APIContext = createContext<APIContextType | null>(null);

export const APIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'error'>('disconnected');
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [apiHealth, setApiHealth] = useState<Record<string, 'healthy' | 'degraded' | 'down'>>({});

  useEffect(() => {
    // Initialize API connection
    initializeConnection();
    
    // Set up health check interval
    const healthCheckInterval = setInterval(checkAPIHealth, 30000);
    
    return () => clearInterval(healthCheckInterval);
  }, []);

  const initializeConnection = async () => {
    setConnectionStatus('connecting');
    
    try {
      // Simulate API connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsConnected(true);
      setConnectionStatus('connected');
      setLastSync(new Date());
      
      // Initialize API health status
      setApiHealth({
        'market-research': 'healthy',
        'competitive-intelligence': 'healthy',
        'trend-analysis': 'healthy',
        'user-profiles': 'healthy',
        'audience-expansion': 'healthy',
        'media-intelligence': 'healthy',
        'strategic-recommendations': 'healthy'
      });
    } catch (error) {
      setIsConnected(false);
      setConnectionStatus('error');
      console.error('API connection failed:', error);
    }
  };

  const checkAPIHealth = async () => {
    try {
      // Simulate health check for each service
      const services = Object.keys(apiHealth);
      const healthChecks = await Promise.all(
        services.map(async (service) => {
          // Simulate random health status
          const random = Math.random();
          let status: 'healthy' | 'degraded' | 'down';
          
          if (random > 0.9) status = 'down';
          else if (random > 0.8) status = 'degraded';
          else status = 'healthy';
          
          return { service, status };
        })
      );

      const newHealthStatus = healthChecks.reduce((acc, { service, status }) => {
        acc[service] = status;
        return acc;
      }, {} as Record<string, 'healthy' | 'degraded' | 'down'>);

      setApiHealth(newHealthStatus);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  };

  const retryConnection = () => {
    initializeConnection();
  };

  const syncData = async (endpoint: string) => {
    try {
      setLastSync(new Date());
      // Simulate API call
      const response = await fetch(`/api/${endpoint}`);
      return await response.json();
    } catch (error) {
      console.error(`Sync failed for ${endpoint}:`, error);
      throw error;
    }
  };

  return (
    <APIContext.Provider value={{
      isConnected,
      connectionStatus,
      lastSync,
      apiHealth,
      retryConnection,
      syncData
    }}>
      {children}
    </APIContext.Provider>
  );
};

export const useAPI = () => {
  const context = useContext(APIContext);
  if (!context) {
    throw new Error('useAPI must be used within APIProvider');
  }
  return context;
};

// Auth Context
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      setIsAuthenticated(true);
      setPermissions(getRolePermissions(userData.role));
    }
  }, []);

  const getRolePermissions = (role: string): string[] => {
    switch (role) {
      case 'admin':
        return ['read', 'write', 'delete', 'admin', 'export', 'configure'];
      case 'analyst':
        return ['read', 'write', 'export'];
      case 'viewer':
        return ['read'];
      default:
        return [];
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      // Simulate authentication
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userData: User = {
        id: '1',
        name: 'John Analyst',
        email: credentials.email,
        role: 'analyst',
        lastLogin: new Date()
      };

      setUser(userData);
      setIsAuthenticated(true);
      setPermissions(getRolePermissions(userData.role));
      
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    setPermissions([]);
    localStorage.removeItem('user');
  };

  const hasPermission = (permission: string): boolean => {
    return permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      permissions,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Performance Monitor Component
export const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    apiResponseTime: 0,
    dataFreshness: 0,
    cacheHitRate: 0,
    errorRate: 0,
    uptime: 0
  });

  const { apiHealth } = useAPI();

  useEffect(() => {
    const updateMetrics = () => {
      // Simulate performance metrics
      setMetrics({
        apiResponseTime: Math.random() * 500 + 100, // 100-600ms
        dataFreshness: Math.random() * 20 + 80, // 80-100%
        cacheHitRate: Math.random() * 30 + 70, // 70-100%
        errorRate: Math.random() * 2, // 0-2%
        uptime: Math.random() * 5 + 95 // 95-100%
      });
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getMetricColor = (value: number, threshold: { good: number; warning: number }) => {
    if (value >= threshold.good) return 'text-green-600';
    if (value >= threshold.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">System Performance</h3>
      
      {/* Performance Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500">Response Time</p>
          <p className={`text-lg font-semibold ${getMetricColor(metrics.apiResponseTime, { good: 200, warning: 400 })}`}>
            {Math.round(metrics.apiResponseTime)}ms
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Data Freshness</p>
          <p className={`text-lg font-semibold ${getMetricColor(metrics.dataFreshness, { good: 90, warning: 80 })}`}>
            {Math.round(metrics.dataFreshness)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Cache Hit Rate</p>
          <p className={`text-lg font-semibold ${getMetricColor(metrics.cacheHitRate, { good: 80, warning: 60 })}`}>
            {Math.round(metrics.cacheHitRate)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Error Rate</p>
          <p className={`text-lg font-semibold ${getMetricColor(5 - metrics.errorRate, { good: 4, warning: 3 })}`}>
            {metrics.errorRate.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500">Uptime</p>
          <p className={`text-lg font-semibold ${getMetricColor(metrics.uptime, { good: 99, warning: 95 })}`}>
            {metrics.uptime.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Service Health */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Service Health</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(apiHealth).map(([service, status]) => (
            <div key={service} className="flex items-center justify-between p-3 border border-gray-200 rounded-md">
              <span className="text-sm text-gray-700 capitalize">
                {service.replace('-', ' ')}
              </span>
              <span className={`text-sm font-medium ${getHealthColor(status)}`}>
                {status.toUpperCase()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Cache Manager Hook
export const useCacheManager = (config: CacheConfig) => {
  const [cache, setCache] = useState<Map<string, { data: any; timestamp: number; hits: number }>>(new Map());

  const get = (key: string) => {
    const item = cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > config.ttl) {
      cache.delete(key);
      return null;
    }

    // Update hit count
    item.hits++;
    return item.data;
  };

  const set = (key: string, data: any) => {
    const now = Date.now();
    
    // Check cache size and evict if necessary
    if (cache.size >= config.maxSize) {
      evictItems();
    }

    cache.set(key, { data, timestamp: now, hits: 0 });
    setCache(new Map(cache));
  };

  const evictItems = () => {
    const entries = Array.from(cache.entries());
    
    switch (config.strategy) {
      case 'lru':
        // Remove least recently used (oldest timestamp)
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        break;
      case 'lfu':
        // Remove least frequently used (lowest hits)
        entries.sort((a, b) => a[1].hits - b[1].hits);
        break;
      case 'fifo':
      default:
        // Remove first in (oldest)
        break;
    }

    // Remove oldest/least used item
    if (entries.length > 0) {
      cache.delete(entries[0][0]);
    }
  };

  const clear = () => {
    cache.clear();
    setCache(new Map());
  };

  const getStats = () => {
    const entries = Array.from(cache.values());
    return {
      size: cache.size,
      totalHits: entries.reduce((sum, item) => sum + item.hits, 0),
      averageAge: entries.length > 0 
        ? (Date.now() - entries.reduce((sum, item) => sum + item.timestamp, 0) / entries.length) / 1000
        : 0
    };
  };

  return { get, set, clear, getStats };
};

// WebSocket Hook
export const useWebSocketConnection = (url: string) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);

  useEffect(() => {
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setIsConnected(true);
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLastMessage(data);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('WebSocket disconnected');
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [url]);

  const sendMessage = (message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  };

  return { isConnected, lastMessage, sendMessage };
};

// Error Boundary Component
export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Log error to monitoring service
    this.logErrorToService(error, errorInfo);
  }

  logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // Implement error logging to external service
    console.log('Logging error to monitoring service:', { error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      return <FallbackComponent error={this.state.error!} />;
    }

    return this.props.children;
  }
}

const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <div className="text-red-500 text-2xl mr-3">⚠️</div>
        <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
      </div>
      <p className="text-gray-600 mb-4">
        We encountered an unexpected error. Please try refreshing the page.
      </p>
      <details className="mb-4">
        <summary className="text-sm text-gray-500 cursor-pointer">Error details</summary>
        <pre className="text-xs text-gray-400 mt-2 overflow-auto">
          {error.message}
        </pre>
      </details>
      <button
        onClick={() => window.location.reload()}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Refresh Page
      </button>
    </div>
  </div>
);

// Export all components and hooks
export default {
  APIProvider,
  AuthProvider,
  PerformanceMonitor,
  ErrorBoundary,
  useAPI,
  useAuth,
  useCacheManager,
  useWebSocketConnection
};
