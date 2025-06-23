import React, { useState, useCallback } from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Export functionality interfaces
interface ExportConfig {
  format: 'csv' | 'xlsx' | 'pdf' | 'png' | 'svg' | 'json';
  filename?: string;
  includeMetadata?: boolean;
  dateRange?: { start: Date; end: Date };
  filters?: Record<string, any>;
}

interface ExportButtonProps {
  data: any[];
  config: ExportConfig;
  onExportStart?: () => void;
  onExportComplete?: (success: boolean) => void;
  disabled?: boolean;
  className?: string;
}

interface BulkExportProps {
  dashboards: Array<{
    id: string;
    name: string;
    data: any[];
    selected: boolean;
  }>;
  onSelectionChange: (id: string, selected: boolean) => void;
  onBulkExport: (selectedIds: string[], format: string) => void;
}

interface ExportHistoryProps {
  exports: Array<{
    id: string;
    filename: string;
    format: string;
    timestamp: Date;
    size: number;
    status: 'completed' | 'failed' | 'processing';
  }>;
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

interface ScheduledExportProps {
  schedules: Array<{
    id: string;
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    format: string;
    nextRun: Date;
    enabled: boolean;
  }>;
  onToggleSchedule: (id: string, enabled: boolean) => void;
  onCreateSchedule: (schedule: any) => void;
}

// Export utilities
export const exportToCSV = (data: any[], filename: string = 'export.csv') => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportToJSON = (data: any[], filename: string = 'export.json') => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

export const exportToPDF = async (elementId: string, filename: string = 'export.pdf') => {
  // This would require a library like jsPDF or html2pdf
  console.log('PDF export would be implemented with jsPDF library');
  
  // Example implementation:
  // const element = document.getElementById(elementId);
  // const pdf = new jsPDF();
  // const canvas = await html2canvas(element);
  // const imgData = canvas.toDataURL('image/png');
  // pdf.addImage(imgData, 'PNG', 0, 0);
  // pdf.save(filename);
};

export const exportToPNG = async (elementId: string, filename: string = 'export.png') => {
  // This would require html2canvas library
  console.log('PNG export would be implemented with html2canvas library');
  
  // Example implementation:
  // const element = document.getElementById(elementId);
  // const canvas = await html2canvas(element);
  // const link = document.createElement('a');
  // link.download = filename;
  // link.href = canvas.toDataURL();
  // link.click();
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// Export Button Component
export const ExportButton: React.FC<ExportButtonProps> = ({
  data,
  config,
  onExportStart,
  onExportComplete,
  disabled = false,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (disabled || isExporting) return;

    setIsExporting(true);
    onExportStart?.();

    try {
      const filename = config.filename || `export_${Date.now()}.${config.format}`;
      
      switch (config.format) {
        case 'csv':
          exportToCSV(data, filename);
          break;
        case 'json':
          exportToJSON(data, filename);
          break;
        case 'pdf':
          await exportToPDF('chart-container', filename);
          break;
        case 'png':
          await exportToPNG('chart-container', filename);
          break;
        default:
          throw new Error(`Unsupported format: ${config.format}`);
      }

      onExportComplete?.(true);
    } catch (error) {
      console.error('Export failed:', error);
      onExportComplete?.(false);
    } finally {
      setIsExporting(false);
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv': return '📊';
      case 'xlsx': return '📈';
      case 'pdf': return '📄';
      case 'png': return '🖼️';
      case 'svg': return '🎨';
      case 'json': return '📋';
      default: return '💾';
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={disabled || isExporting}
      className={`flex items-center space-x-2 px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      <span>{getFormatIcon(config.format)}</span>
      <span>
        {isExporting ? 'Exporting...' : `Export ${config.format.toUpperCase()}`}
      </span>
      {isExporting && (
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      )}
    </button>
  );
};

// Bulk Export Component
export const BulkExport: React.FC<BulkExportProps> = ({
  dashboards,
  onSelectionChange,
  onBulkExport
}) => {
  const [selectedFormat, setSelectedFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);

  const selectedDashboards = dashboards.filter(d => d.selected);
  const allSelected = dashboards.length > 0 && selectedDashboards.length === dashboards.length;
  const someSelected = selectedDashboards.length > 0 && selectedDashboards.length < dashboards.length;

  const handleSelectAll = () => {
    const newSelection = !allSelected;
    dashboards.forEach(dashboard => {
      onSelectionChange(dashboard.id, newSelection);
    });
  };

  const handleBulkExport = async () => {
    if (selectedDashboards.length === 0) return;

    setIsExporting(true);
    try {
      await onBulkExport(selectedDashboards.map(d => d.id), selectedFormat);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Bulk Export</h3>
      
      {/* Select All Checkbox */}
      <div className="flex items-center space-x-3 mb-4">
        <input
          type="checkbox"
          checked={allSelected}
          ref={input => {
            if (input) input.indeterminate = someSelected;
          }}
          onChange={handleSelectAll}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label className="text-sm font-medium text-gray-700">
          Select All Dashboards ({selectedDashboards.length}/{dashboards.length})
        </label>
      </div>

      {/* Dashboard List */}
      <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
        {dashboards.map(dashboard => (
          <div key={dashboard.id} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={dashboard.selected}
              onChange={(e) => onSelectionChange(dashboard.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{dashboard.name}</span>
            <span className="text-xs text-gray-500">
              ({dashboard.data.length} records)
            </span>
          </div>
        ))}
      </div>

      {/* Export Options */}
      <div className="flex items-center space-x-4">
        <select
          value={selectedFormat}
          onChange={(e) => setSelectedFormat(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="csv">CSV</option>
          <option value="xlsx">Excel</option>
          <option value="json">JSON</option>
          <option value="pdf">PDF</option>
        </select>

        <button
          onClick={handleBulkExport}
          disabled={selectedDashboards.length === 0 || isExporting}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>📦</span>
          <span>
            {isExporting ? 'Exporting...' : `Export ${selectedDashboards.length} Dashboard${selectedDashboards.length !== 1 ? 's' : ''}`}
          </span>
        </button>
      </div>
    </div>
  );
};

// Export History Component
export const ExportHistory: React.FC<ExportHistoryProps> = ({
  exports,
  onDownload,
  onDelete
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'failed': return 'text-red-600 bg-red-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Export History</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-900">Filename</th>
              <th className="text-left py-2 font-medium text-gray-900">Format</th>
              <th className="text-left py-2 font-medium text-gray-900">Date</th>
              <th className="text-left py-2 font-medium text-gray-900">Size</th>
              <th className="text-left py-2 font-medium text-gray-900">Status</th>
              <th className="text-left py-2 font-medium text-gray-900">Actions</th>
            </tr>
          </thead>
          <tbody>
            {exports.map(exportItem => (
              <tr key={exportItem.id} className="border-b border-gray-100">
                <td className="py-2">{exportItem.filename}</td>
                <td className="py-2">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                    {exportItem.format.toUpperCase()}
                  </span>
                </td>
                <td className="py-2 text-gray-600">
                  {exportItem.timestamp.toLocaleDateString()}
                </td>
                <td className="py-2 text-gray-600">
                  {formatFileSize(exportItem.size)}
                </td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exportItem.status)}`}>
                    {exportItem.status}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center space-x-2">
                    {exportItem.status === 'completed' && (
                      <button
                        onClick={() => onDownload(exportItem.id)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Download"
                      >
                        ⬇️
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(exportItem.id)}
                      className="text-red-600 hover:text-red-800"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Scheduled Export Component
export const ScheduledExport: React.FC<ScheduledExportProps> = ({
  schedules,
  onToggleSchedule,
  onCreateSchedule
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({
    name: '',
    frequency: 'weekly' as const,
    format: 'csv',
    dashboards: [] as string[]
  });

  const handleCreateSchedule = () => {
    onCreateSchedule({
      ...newSchedule,
      id: Date.now().toString(),
      nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      enabled: true
    });
    setNewSchedule({ name: '', frequency: 'weekly', format: 'csv', dashboards: [] });
    setShowCreateForm(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Scheduled Exports</h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + New Schedule
        </button>
      </div>

      {/* Create Schedule Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Create New Schedule</h4>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Schedule name"
              value={newSchedule.name}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, name: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={newSchedule.frequency}
              onChange={(e) => setNewSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="flex items-center space-x-4 mt-3">
            <button
              onClick={handleCreateSchedule}
              disabled={!newSchedule.name}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Schedules List */}
      <div className="space-y-3">
        {schedules.map(schedule => (
          <div key={schedule.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={(e) => onToggleSchedule(schedule.id, e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <div>
                <p className="font-medium text-gray-900">{schedule.name}</p>
                <p className="text-sm text-gray-600">
                  {schedule.frequency} • {schedule.format.toUpperCase()} • 
                  Next: {schedule.nextRun.toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                schedule.enabled 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {schedule.enabled ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Export all components
export default {
  ExportButton,
  BulkExport,
  ExportHistory,
  ScheduledExport,
  exportToCSV,
  exportToJSON,
  exportToPDF,
  exportToPNG
};
