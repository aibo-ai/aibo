import React, { useState, useCallback } from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Interactive feature interfaces
interface TimeRangeSelectorProps {
  selectedRange: string;
  onRangeChange: (range: string) => void;
  ranges: Array<{ value: string; label: string }>;
}

interface FilterControlsProps {
  filters: Array<{
    key: string;
    label: string;
    options: Array<{ value: string; label: string }>;
    selected: string;
  }>;
  onFilterChange: (key: string, value: string) => void;
}

interface DrillDownProps {
  data: any[];
  onDrillDown: (item: any) => void;
  breadcrumbs: string[];
  onBreadcrumbClick: (index: number) => void;
}

interface ExportOptionsProps {
  onExport: (format: string) => void;
  formats: string[];
  isExporting?: boolean;
}

interface TooltipProps {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
}

interface ZoomControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  minZoom?: number;
  maxZoom?: number;
}

// Time Range Selector Component
export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  ranges
}) => {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600">Time Range:</span>
      <div className="flex bg-gray-100 rounded-lg p-1">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => onRangeChange(range.value)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedRange === range.value
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// Filter Controls Component
export const FilterControls: React.FC<FilterControlsProps> = ({
  filters,
  onFilterChange
}) => {
  return (
    <div className="flex items-center space-x-4">
      {filters.map((filter) => (
        <div key={filter.key} className="flex items-center space-x-2">
          <label className="text-sm text-gray-600">{filter.label}:</label>
          <select
            value={filter.selected}
            onChange={(e) => onFilterChange(filter.key, e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
};

// Drill Down Component
export const DrillDown: React.FC<DrillDownProps> = ({
  data,
  onDrillDown,
  breadcrumbs,
  onBreadcrumbClick
}) => {
  return (
    <div className="space-y-4">
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={index}>
              <button
                onClick={() => onBreadcrumbClick(index)}
                className={`hover:text-blue-600 ${
                  index === breadcrumbs.length - 1
                    ? 'text-gray-900 font-medium'
                    : 'text-blue-600'
                }`}
              >
                {crumb}
              </button>
              {index < breadcrumbs.length - 1 && (
                <span className="text-gray-400">/</span>
              )}
            </React.Fragment>
          ))}
        </nav>
      )}

      {/* Drillable Data Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((item, index) => (
          <div
            key={index}
            onClick={() => onDrillDown(item)}
            className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md cursor-pointer transition-all"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">{item.name}</h4>
              <span className="text-gray-400">→</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            {item.value && (
              <p className="text-lg font-semibold text-blue-600 mt-2">
                {item.value}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Export Options Component
export const ExportOptions: React.FC<ExportOptionsProps> = ({
  onExport,
  formats,
  isExporting = false
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleExport = (format: string) => {
    onExport(format);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
      >
        <span>📊</span>
        <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        <span className="text-gray-400">▼</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format}
                onClick={() => handleExport(format)}
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
              >
                Export as {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Tooltip Component
export const Tooltip: React.FC<TooltipProps> = ({
  visible,
  x,
  y,
  content
}) => {
  if (!visible) return null;

  return (
    <div
      className="absolute z-50 bg-gray-900 text-white text-xs rounded-md px-2 py-1 pointer-events-none"
      style={{
        left: x + 10,
        top: y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      {content}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
    </div>
  );
};

// Zoom Controls Component
export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onReset,
  minZoom = 0.5,
  maxZoom = 3
}) => {
  return (
    <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg p-1">
      <button
        onClick={onZoomOut}
        disabled={zoomLevel <= minZoom}
        className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        title="Zoom Out"
      >
        <span className="text-lg">−</span>
      </button>
      
      <span className="text-sm text-gray-600 min-w-[60px] text-center">
        {Math.round(zoomLevel * 100)}%
      </span>
      
      <button
        onClick={onZoomIn}
        disabled={zoomLevel >= maxZoom}
        className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
        title="Zoom In"
      >
        <span className="text-lg">+</span>
      </button>
      
      <div className="w-px h-6 bg-gray-300"></div>
      
      <button
        onClick={onReset}
        className="px-2 py-1 text-xs hover:bg-gray-100 rounded"
        title="Reset Zoom"
      >
        Reset
      </button>
    </div>
  );
};

// Custom Hook for Chart Interactions
export const useChartInteractions = () => {
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    content: null as React.ReactNode
  });

  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [filters, setFilters] = useState<Record<string, string>>({});

  const showTooltip = useCallback((x: number, y: number, content: React.ReactNode) => {
    setTooltip({ visible: true, x, y, content });
  }, []);

  const hideTooltip = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoomLevel(prev => Math.min(prev * 1.2, 3));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoomLevel(prev => Math.max(prev / 1.2, 0.5));
  }, []);

  const resetZoom = useCallback(() => {
    setZoomLevel(1);
  }, []);

  const updateFilter = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const exportData = useCallback((format: string) => {
    // Implementation would depend on the specific chart data and format
    console.log(`Exporting data as ${format}`);
    
    // Example implementation for CSV
    if (format === 'csv') {
      // Generate CSV data and trigger download
      const csvContent = "data:text/csv;charset=utf-8,";
      // Add CSV generation logic here
    }
    
    // Example implementation for PNG
    if (format === 'png') {
      // Use html2canvas or similar library to capture chart as image
    }
  }, []);

  return {
    tooltip,
    showTooltip,
    hideTooltip,
    zoomLevel,
    handleZoomIn,
    handleZoomOut,
    resetZoom,
    selectedTimeRange,
    setSelectedTimeRange,
    filters,
    updateFilter,
    exportData
  };
};

// Real-time Update Hook
export const useRealTimeUpdates = (updateInterval: number = 30000) => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
      // Simulate connection status
      setIsConnected(Math.random() > 0.1); // 90% uptime simulation
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval]);

  const formatLastUpdate = () => {
    const now = new Date();
    const diff = now.getTime() - lastUpdate.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes === 1) return '1 minute ago';
    return `${minutes} minutes ago`;
  };

  return {
    lastUpdate,
    isConnected,
    formatLastUpdate
  };
};

// Export all components and hooks
export default {
  TimeRangeSelector,
  FilterControls,
  DrillDown,
  ExportOptions,
  Tooltip,
  ZoomControls,
  useChartInteractions,
  useRealTimeUpdates
};
