'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: number | string;
  change?: number;
  previousValue?: number;
  format?: (value: number) => string;
}

export function StatsCard({ title, value, change, previousValue, format }: StatsCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-4 h-4 text-gray-500" />;
    return change > 0 ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-gray-500';
    return change > 0 ? 'text-green-500' : 'text-red-500';
  };

  const formatValue = (val: number): string => {
    if (format) return format(val);
    return val.toLocaleString();
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
      <h3 className="text-sm font-medium text-gray-600 mb-2">{title}</h3>
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(typeof value === 'number' ? value : parseFloat(value as string))}
        </div>
        {change !== undefined && (
          <div className="flex items-center space-x-1">
            {getTrendIcon()}
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {Math.abs(change).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      {previousValue !== undefined && (
        <div className="text-xs text-gray-500 mt-2">
          Previous: {formatValue(previousValue)}
        </div>
      )}
    </div>
  );
}