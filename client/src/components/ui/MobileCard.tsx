import React from 'react';
// Temporary icon replacements
const ChevronRight = ({ className }: { className?: string }) => <span className={className}>▶️</span>;
const MoreVertical = ({ className }: { className?: string }) => <span className={className}>⋮</span>;

interface MobileCardProps {
  title: string;
  subtitle?: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  onClick?: () => void;
  onMenuClick?: () => void;
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'compact' | 'detailed';
}

const MobileCard: React.FC<MobileCardProps> = ({
  title,
  subtitle,
  value,
  trend,
  trendValue,
  icon,
  badge,
  onClick,
  onMenuClick,
  children,
  className = '',
  variant = 'default'
}) => {
  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '→';
    }
  };

  if (variant === 'compact') {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-3 ${
          onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''
        } ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {icon && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
              {subtitle && (
                <p className="text-xs text-gray-500 truncate">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {value && (
              <span className="text-sm font-semibold text-gray-900">{value}</span>
            )}
            {badge && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {badge}
              </span>
            )}
            {onClick && <ChevronRight className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={`bg-white rounded-lg border border-gray-200 p-4 ${
          onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''
        } ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                {icon}
              </div>
            )}
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
              {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {badge && (
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {badge}
              </span>
            )}
            {onMenuClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMenuClick();
                }}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600"
              >
                <MoreVertical className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {value && (
          <div className="mb-3">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-gray-900">{value}</span>
              {trend && trendValue && (
                <span className={`text-sm font-medium ${getTrendColor(trend)}`}>
                  {getTrendIcon(trend)} {trendValue}
                </span>
              )}
            </div>
          </div>
        )}

        {children && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {children}
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${
        onClick ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate">{title}</h3>
            {subtitle && (
              <p className="text-xs text-gray-500 truncate mt-1">{subtitle}</p>
            )}
            {value && (
              <div className="flex items-baseline space-x-2 mt-2">
                <span className="text-lg font-semibold text-gray-900">{value}</span>
                {trend && trendValue && (
                  <span className={`text-xs font-medium ${getTrendColor(trend)}`}>
                    {getTrendIcon(trend)} {trendValue}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {badge && (
            <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
              {badge}
            </span>
          )}
          {onMenuClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMenuClick();
              }}
              className="p-1 rounded-md text-gray-400 hover:text-gray-600"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
          {onClick && <ChevronRight className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {children && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

export default MobileCard;
