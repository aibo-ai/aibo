import React from 'react';
import { productXColors } from '../../../styles/productXTheme';

// Chart component interfaces
interface LineChartProps {
  data: Array<{ name: string; value: number; trend?: number }>;
  title: string;
  color?: string;
  height?: number;
  showTrend?: boolean;
}

interface BarChartProps {
  data: Array<{ name: string; value: number; color?: string }>;
  title: string;
  horizontal?: boolean;
  height?: number;
}

interface PieChartProps {
  data: Array<{ name: string; value: number; color: string }>;
  title: string;
  size?: number;
  showLabels?: boolean;
}

interface RadarChartProps {
  data: Array<{ category: string; value: number; maxValue?: number }>;
  title: string;
  color?: string;
  size?: number;
}

interface HeatMapProps {
  data: Array<Array<{ value: number; label?: string }>>;
  title: string;
  xLabels: string[];
  yLabels: string[];
  colorScale?: string[];
}

interface GaugeChartProps {
  value: number;
  maxValue: number;
  title: string;
  color?: string;
  size?: number;
  unit?: string;
}

// Line Chart Component
export const LineChart: React.FC<LineChartProps> = ({ 
  data, 
  title, 
  color = productXColors.primary[500], 
  height = 200,
  showTrend = false 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue;

  const getY = (value: number) => {
    return height - 40 - ((value - minValue) / range) * (height - 80);
  };

  const getX = (index: number) => {
    return 40 + (index / (data.length - 1)) * (400 - 80);
  };

  const pathData = data.map((point, index) => {
    const x = getX(index);
    const y = getY(point.value);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
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
        
        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Data points */}
        {data.map((point, index) => (
          <circle
            key={index}
            cx={getX(index)}
            cy={getY(point.value)}
            r="4"
            fill={color}
            className="hover:r-6 transition-all cursor-pointer"
          />
        ))}
        
        {/* X-axis labels */}
        {data.map((point, index) => (
          <text
            key={index}
            x={getX(index)}
            y={height - 10}
            textAnchor="middle"
            className="text-xs fill-gray-500"
          >
            {point.name}
          </text>
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
      
      {showTrend && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Trend Analysis</span>
          <span className="text-green-600">↗ +12.5%</span>
        </div>
      )}
    </div>
  );
};

// Bar Chart Component
export const BarChart: React.FC<BarChartProps> = ({ 
  data, 
  title, 
  horizontal = false, 
  height = 200 
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      <svg width="400" height={height} className="w-full">
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * (height - 80);
          const barWidth = (400 - 80) / data.length - 10;
          const x = 40 + index * ((400 - 80) / data.length);
          const y = height - 40 - barHeight;
          
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={item.color || productXColors.primary[500]}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                rx="2"
              />
              <text
                x={x + barWidth / 2}
                y={height - 20}
                textAnchor="middle"
                className="text-xs fill-gray-500"
              >
                {item.name}
              </text>
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                className="text-xs fill-gray-700 font-medium"
              >
                {item.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// Pie Chart Component
export const PieChart: React.FC<PieChartProps> = ({ 
  data, 
  title, 
  size = 200, 
  showLabels = true 
}) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  
  let currentAngle = 0;
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      <div className="flex items-center space-x-4">
        <svg width={size} height={size}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;
            
            const x1 = centerX + radius * Math.cos(startAngle);
            const y1 = centerY + radius * Math.sin(startAngle);
            const x2 = centerX + radius * Math.cos(endAngle);
            const y2 = centerY + radius * Math.sin(endAngle);
            
            const largeArcFlag = angle > Math.PI ? 1 : 0;
            
            const pathData = [
              `M ${centerX} ${centerY}`,
              `L ${x1} ${y1}`,
              `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
              'Z'
            ].join(' ');
            
            currentAngle += angle;
            
            return (
              <path
                key={index}
                d={pathData}
                fill={item.color}
                className="hover:opacity-80 transition-opacity cursor-pointer"
                stroke="white"
                strokeWidth="2"
              />
            );
          })}
        </svg>
        
        {showLabels && (
          <div className="space-y-2">
            {data.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600">{item.name}</span>
                <span className="text-xs font-medium">{item.value}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Gauge Chart Component
export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  value, 
  maxValue, 
  title, 
  color = productXColors.primary[500], 
  size = 200,
  unit = '%'
}) => {
  const radius = size / 2 - 20;
  const centerX = size / 2;
  const centerY = size / 2;
  const percentage = (value / maxValue) * 100;
  const angle = (percentage / 100) * Math.PI; // Half circle
  
  const endX = centerX + radius * Math.cos(Math.PI - angle);
  const endY = centerY - radius * Math.sin(Math.PI - angle);
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      <div className="flex flex-col items-center">
        <svg width={size} height={size / 2 + 40}>
          {/* Background arc */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}`}
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Value arc */}
          <path
            d={`M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${endX} ${endY}`}
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
          />
          
          {/* Center text */}
          <text
            x={centerX}
            y={centerY + 10}
            textAnchor="middle"
            className="text-2xl font-bold fill-gray-900"
          >
            {value}{unit}
          </text>
        </svg>
        
        <div className="mt-2 flex justify-between w-full text-xs text-gray-500">
          <span>0{unit}</span>
          <span>{maxValue}{unit}</span>
        </div>
      </div>
    </div>
  );
};

// Heat Map Component
export const HeatMap: React.FC<HeatMapProps> = ({ 
  data, 
  title, 
  xLabels, 
  yLabels,
  colorScale = ['#f3f4f6', '#dbeafe', '#93c5fd', '#3b82f6', '#1d4ed8']
}) => {
  const cellWidth = 30;
  const cellHeight = 30;
  const maxValue = Math.max(...data.flat().map(cell => cell.value));
  
  const getColor = (value: number) => {
    const intensity = value / maxValue;
    const colorIndex = Math.floor(intensity * (colorScale.length - 1));
    return colorScale[colorIndex];
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">{title}</h3>
      <svg 
        width={xLabels.length * cellWidth + 100} 
        height={yLabels.length * cellHeight + 60}
        className="overflow-visible"
      >
        {/* Y-axis labels */}
        {yLabels.map((label, yIndex) => (
          <text
            key={yIndex}
            x="80"
            y={30 + yIndex * cellHeight + cellHeight / 2 + 4}
            textAnchor="end"
            className="text-xs fill-gray-600"
          >
            {label}
          </text>
        ))}
        
        {/* X-axis labels */}
        {xLabels.map((label, xIndex) => (
          <text
            key={xIndex}
            x={90 + xIndex * cellWidth + cellWidth / 2}
            y={20}
            textAnchor="middle"
            className="text-xs fill-gray-600"
          >
            {label}
          </text>
        ))}
        
        {/* Heat map cells */}
        {data.map((row, yIndex) =>
          row.map((cell, xIndex) => (
            <rect
              key={`${xIndex}-${yIndex}`}
              x={90 + xIndex * cellWidth}
              y={30 + yIndex * cellHeight}
              width={cellWidth - 1}
              height={cellHeight - 1}
              fill={getColor(cell.value)}
              className="hover:stroke-gray-400 hover:stroke-2 cursor-pointer"
              rx="2"
            />
          ))
        )}
      </svg>
    </div>
  );
};

// Export all components
export default {
  LineChart,
  BarChart,
  PieChart,
  GaugeChart,
  HeatMap
};
