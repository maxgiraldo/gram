import clsx from 'clsx';
import React from 'react';

const colors = {
  primary: 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400',
  success: 'bg-green-500/15 text-green-700 dark:bg-green-500/10 dark:text-green-400',
  warning: 'bg-yellow-400/20 text-yellow-700 dark:bg-yellow-400/10 dark:text-yellow-300',
  danger: 'bg-red-500/15 text-red-700 dark:bg-red-500/10 dark:text-red-400',
  info: 'bg-purple-500/15 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400',
  default: 'bg-zinc-600/10 text-zinc-700 dark:bg-white/5 dark:text-zinc-400',
  zinc: 'bg-zinc-600/10 text-zinc-700 dark:bg-white/5 dark:text-zinc-400',
};

type BadgeProps = { 
  color?: keyof typeof colors;
  variant?: keyof typeof colors; // For backward compatibility
  size?: 'sm' | 'md' | 'lg';
} & React.ComponentPropsWithoutRef<'span'>;

export function CatalystBadge({ 
  color, 
  variant, 
  size = 'md',
  className, 
  children,
  ...props 
}: BadgeProps) {
  // Use variant for backward compatibility, but prefer color
  const badgeColor = color || variant || 'default';
  
  const sizeClasses = {
    sm: 'px-1 py-0.5 text-xs/4 font-medium',
    md: 'px-1.5 py-0.5 text-sm/5 font-medium',
    lg: 'px-2 py-1 text-base/6 font-medium',
  };

  return (
    <span
      {...props}
      className={clsx(
        className,
        'inline-flex items-center gap-x-1.5 rounded-md forced-colors:outline',
        sizeClasses[size],
        colors[badgeColor]
      )}
    >
      {children}
    </span>
  );
}

// Keep backward compatibility
export const Badge = CatalystBadge;