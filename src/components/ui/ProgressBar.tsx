/**
 * ProgressBar Component
 * 
 * A visual progress indicator component that shows completion or loading status.
 */

import React from 'react';

export interface ProgressBarProps {
  value: number;
  max?: number;
  min?: number;
  className?: string;
  barClassName?: string;
  showLabel?: boolean;
  label?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  striped?: boolean;
}

/**
 * ProgressBar component for displaying progress visually
 */
export function ProgressBar({
  value,
  max = 100,
  min = 0,
  className = '',
  barClassName = '',
  showLabel = false,
  label,
  variant = 'default',
  size = 'md',
  animated = false,
  striped = false,
}: ProgressBarProps) {
  // Calculate percentage
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);
  
  // Base styles for container
  const containerBaseStyles = 'w-full bg-gray-200 rounded-full overflow-hidden';
  
  // Size styles for container
  const containerSizeStyles = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };
  
  // Base styles for bar
  const barBaseStyles = 'h-full transition-all duration-300 ease-out';
  
  // Variant styles for bar
  const barVariantStyles = {
    default: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-500',
    danger: 'bg-red-600',
    info: 'bg-purple-600',
  };
  
  // Striped styles
  const stripedStyles = striped ? `
    bg-gradient-to-r from-transparent via-white/20 to-transparent
    bg-[length:20px_100%]
  ` : '';
  
  // Animated styles
  const animatedStyles = animated && striped ? 'animate-progress-stripes' : '';
  
  // Combine container styles
  const combinedContainerStyles = `
    ${containerBaseStyles}
    ${containerSizeStyles[size]}
    ${className}
  `.trim();
  
  // Combine bar styles
  const combinedBarStyles = `
    ${barBaseStyles}
    ${barVariantStyles[variant]}
    ${stripedStyles}
    ${animatedStyles}
    ${barClassName}
  `.trim();
  
  // Format label
  const displayLabel = label || `${Math.round(percentage)}%`;
  
  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between mb-1">
          <span className="text-sm font-medium text-gray-700">
            {displayLabel}
          </span>
          <span className="text-sm text-gray-600">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className={combinedContainerStyles}>
        <div
          className={combinedBarStyles}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={min}
          aria-valuemax={max}
        >
          {/* Accessibility text */}
          <span className="sr-only">{displayLabel}</span>
        </div>
      </div>
    </div>
  );
}

// Add animation keyframes if not already present
if (typeof document !== 'undefined' && !document.getElementById('progress-bar-styles')) {
  const style = document.createElement('style');
  style.id = 'progress-bar-styles';
  style.textContent = `
    @keyframes progress-stripes {
      0% {
        background-position: 0 0;
      }
      100% {
        background-position: 20px 0;
      }
    }
    
    .animate-progress-stripes {
      animation: progress-stripes 1s linear infinite;
    }
  `;
  document.head.appendChild(style);
}

// Export default as well for convenience
export default ProgressBar;