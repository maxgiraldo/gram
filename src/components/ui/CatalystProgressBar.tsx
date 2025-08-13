import clsx from 'clsx';
import React from 'react';

export interface CatalystProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  label?: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const colorClasses = {
  primary: 'bg-blue-600 dark:bg-blue-500',
  success: 'bg-green-600 dark:bg-green-500',
  warning: 'bg-yellow-500 dark:bg-yellow-400',
  danger: 'bg-red-600 dark:bg-red-500',
  info: 'bg-purple-600 dark:bg-purple-500',
  default: 'bg-zinc-600 dark:bg-zinc-400',
};

const sizeClasses = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function CatalystProgressBar({
  value,
  max = 100,
  min = 0,
  className = '',
  barClassName = '',
  showLabel = false,
  label,
  color = 'primary',
  size = 'md',
  animated = false,
}: CatalystProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  // Format label
  const displayLabel = label || `${Math.round(percentage)}%`;
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-2">
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {displayLabel}
          </span>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div 
        className={clsx(
          'w-full bg-zinc-200 rounded-full overflow-hidden',
          'dark:bg-zinc-800',
          sizeClasses[size],
          className
        )}
      >
        <div
          className={clsx(
            'h-full transition-all duration-500 ease-out rounded-full',
            colorClasses[color],
            animated && 'animate-pulse',
            barClassName
          )}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
          aria-label={displayLabel}
        >
          {/* Shine effect */}
          <div className="h-full w-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] opacity-50" />
        </div>
      </div>
    </div>
  );
}

// Backward compatibility
export const ProgressBar = CatalystProgressBar;