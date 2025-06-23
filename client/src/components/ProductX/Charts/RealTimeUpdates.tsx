import React, { useState, useEffect, useCallback, useRef } from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Real-time update interfaces
interface RealTimeDataPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
}

interface RealTimeChartProps {
  data: RealTimeDataPoint[];
  maxDataPoints: number;
  updateInterval: number;
  title: string;
  color?: string;
  height?: number;
}

interface ConnectionStatusProps {
  isConnected: boolean;
  lastUpdate: Date;
  reconnectAttempts: number;
  onReconnect: () => void;
}

interface DataStreamProps {
  streamId: string;
  onDataReceived: (data: any) => void;
  isActive: boolean;
}

// Real-time Chart Component
export const RealTimeChart: React.FC<RealTimeChartProps> = ({
  data,
  maxDataPoints,
  updateInterval,
  title,
  color = productXColors.primary[500],
  height = 200
}) => {
  const [animatedData, setAnimatedData] = useState(data);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (data.length !== animatedData.length) {
      setIsAnimating(true);
      
      // Smooth transition animation
      const timer = setTimeout(() => {
        setAnimatedData(data);
        setIsAnimating(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [data, animatedData.length]);

  const maxValue = Math.max(...animatedData.map(d => d.value));
  const minValue = Math.min(...animatedData.map(d => d.value));
  const range = maxValue - minValue || 1;

  const getY = (value: number) => {
    return height - 40 - ((value - minValue) / range) * (height - 80);
  };

  const getX = (index: number) => {
    return 40 + (index / (animatedData.length - 1)) * (400 - 80);
  };

  const pathData = animatedData.map((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAnimating ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
          <span className="text-xs text-gray-500">
            {isAnimating ? 'Updating...' : 'Live'}
          </span>
        </div>
      </div>
      
      <svg width="400" height={height} className="w-full">
        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            x1="40"
            y1={40 + ratio * (height - 80)}
            x2="360"
            y2={40 + ratio * (height - 80)}
            stroke="#f3f4f6"
            strokeWidth="1"
          />
        ))}
        
        {/* Animated line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-all duration-300 ${isAnimating ? 'opacity-70' : 'opacity-100'}`}
        />
        
        {/* Gradient fill */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        <path
          d={`${pathData} L ${getX(animatedData.length - 1)} ${height - 40} L 40 ${height - 40} Z`}
          fill="url(#gradient)"
          className={`transition-all duration-300 ${isAnimating ? 'opacity-50' : 'opacity-70'}`}
        />
        
        {/* Data points */}
        {animatedData.map((point, index) => (
          <circle
            key={`${point.timestamp}-${index}`}
            cx={getX(index)}
            cy={getY(point.value)}
            r="3"
            fill={color}
            className={`transition-all duration-300 hover:r-5 cursor-pointer ${
              index === animatedData.length - 1 ? 'animate-pulse' : ''
            }`}
          />
        ))}
        
        {/* Y-axis labels */}
        {[0, 0.5, 1].map((ratio) => (
          <text
            key={ratio}
            x="30"
            y={40 + ratio * (height - 80) + 4}
            textAnchor="end"
            className="text-xs fill-gray-500"
          >
            {Math.round(minValue + ratio * range)}
          </text>
        ))}
      </svg>
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Last {animatedData.length} data points</span>
        <span>Updates every {updateInterval / 1000}s</span>
      </div>
    </div>
  );
};

// Connection Status Component
export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isConnected,
  lastUpdate,
  reconnectAttempts,
  onReconnect
}) => {
  const formatLastUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (seconds < 60) return `${seconds}s ago`;
    return `${minutes}m ago`;
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${
      isConnected 
        ? 'bg-green-50 border-green-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-center space-x-3">
        <div className={`w-3 h-3 rounded-full ${
          isConnected ? 'bg-green-400' : 'bg-red-400'
        }`}></div>
        <div>
          <p className={`text-sm font-medium ${
            isConnected ? 'text-green-800' : 'text-red-800'
          }`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </p>
          <p className={`text-xs ${
            isConnected ? 'text-green-600' : 'text-red-600'
          }`}>
            Last update: {formatLastUpdate()}
          </p>
        </div>
      </div>
      
      {!isConnected && (
        <div className="flex items-center space-x-2">
          {reconnectAttempts > 0 && (
            <span className="text-xs text-red-600">
              Attempts: {reconnectAttempts}
            </span>
          )}
          <button
            onClick={onReconnect}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reconnect
          </button>
        </div>
      )}
    </div>
  );
};

// Data Stream Component
export const DataStream: React.FC<DataStreamProps> = ({
  streamId,
  onDataReceived,
  isActive
}) => {
  const [buffer, setBuffer] = useState<any[]>([]);
  const [throughput, setThroughput] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isActive) {
      // Simulate real-time data stream
      intervalRef.current = setInterval(() => {
        const newData = {
          timestamp: Date.now(),
          value: Math.random() * 100,
          streamId,
          metadata: {
            source: 'real-time-stream',
            quality: Math.random() > 0.1 ? 'good' : 'poor'
          }
        };
        
        setBuffer(prev => [...prev, newData]);
        setThroughput(prev => prev + 1);
        onDataReceived(newData);
      }, 1000);

      // Reset throughput counter every minute
      const throughputReset = setInterval(() => {
        setThroughput(0);
      }, 60000);

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        clearInterval(throughputReset);
      };
    }
  }, [isActive, streamId, onDataReceived]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          Data Stream: {streamId}
        </h3>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
          }`}></div>
          <span className="text-xs text-gray-500">
            {isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-lg font-semibold text-gray-900">{buffer.length}</p>
          <p className="text-xs text-gray-500">Total Records</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-blue-600">{throughput}</p>
          <p className="text-xs text-gray-500">Per Minute</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-green-600">
            {buffer.filter(d => d.metadata?.quality === 'good').length}
          </p>
          <p className="text-xs text-gray-500">Good Quality</p>
        </div>
      </div>
      
      {buffer.length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <p className="text-gray-600">Latest:</p>
          <p className="font-mono text-gray-800">
            {JSON.stringify(buffer[buffer.length - 1], null, 2).substring(0, 100)}...
          </p>
        </div>
      )}
    </div>
  );
};

// WebSocket Hook
export const useWebSocket = (config: WebSocketConfig) => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(config.url);
      
      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        setLastUpdate(new Date());
        console.log('WebSocket connected');
      };
      
      ws.onmessage = (event) => {
        setLastUpdate(new Date());
        // Handle incoming data
      };
      
      ws.onclose = () => {
        setIsConnected(false);
        setSocket(null);
        
        // Auto-reconnect logic
        if (reconnectAttempts < config.maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, config.reconnectInterval);
        }
      };
      
      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
      
      setSocket(ws);
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
    }
  }, [config, reconnectAttempts]);

  const disconnect = useCallback(() => {
    if (socket) {
      socket.close();
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, [socket]);

  const sendMessage = useCallback((message: any) => {
    if (socket && isConnected) {
      socket.send(JSON.stringify(message));
    }
  }, [socket, isConnected]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  return {
    isConnected,
    reconnectAttempts,
    lastUpdate,
    sendMessage,
    reconnect: connect
  };
};

// Real-time Data Manager Hook
export const useRealTimeData = (maxDataPoints: number = 50) => {
  const [dataStreams, setDataStreams] = useState<Record<string, RealTimeDataPoint[]>>({});
  const [isActive, setIsActive] = useState(true);

  const addDataPoint = useCallback((streamId: string, dataPoint: RealTimeDataPoint) => {
    setDataStreams(prev => {
      const currentStream = prev[streamId] || [];
      const newStream = [...currentStream, dataPoint].slice(-maxDataPoints);
      return { ...prev, [streamId]: newStream };
    });
  }, [maxDataPoints]);

  const clearStream = useCallback((streamId: string) => {
    setDataStreams(prev => {
      const { [streamId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  const pauseUpdates = useCallback(() => {
    setIsActive(false);
  }, []);

  const resumeUpdates = useCallback(() => {
    setIsActive(true);
  }, []);

  return {
    dataStreams,
    isActive,
    addDataPoint,
    clearStream,
    pauseUpdates,
    resumeUpdates
  };
};

// Export all components and hooks
export default {
  RealTimeChart,
  ConnectionStatus,
  DataStream,
  useWebSocket,
  useRealTimeData
};
