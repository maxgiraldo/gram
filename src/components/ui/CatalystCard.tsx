import clsx from 'clsx';
import React from 'react';

// Card Container
export interface CatalystCardProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  children: React.ReactNode;
}

export function CatalystCard({ className, children, ...props }: CatalystCardProps) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        // Base styles
        'relative overflow-hidden rounded-xl border border-zinc-950/10 bg-white shadow-sm',
        // Dark mode
        'dark:border-white/10 dark:bg-zinc-900',
        // Hover effects
        'transition-all duration-200 hover:shadow-md hover:border-zinc-950/20 dark:hover:border-white/20'
      )}
    >
      {children}
    </div>
  );
}

// Card Header
export interface CatalystCardHeaderProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  children: React.ReactNode;
}

export function CatalystCardHeader({ className, children, ...props }: CatalystCardHeaderProps) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'border-b border-zinc-950/5 bg-zinc-50/50 px-6 py-4',
        'dark:border-white/5 dark:bg-white/2.5'
      )}
    >
      {children}
    </div>
  );
}

// Card Body
export interface CatalystCardBodyProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  children: React.ReactNode;
}

export function CatalystCardBody({ className, children, ...props }: CatalystCardBodyProps) {
  return (
    <div
      {...props}
      className={clsx(className, 'px-6 py-4')}
    >
      {children}
    </div>
  );
}

// Card Footer
export interface CatalystCardFooterProps extends React.ComponentPropsWithoutRef<'div'> {
  className?: string;
  children: React.ReactNode;
}

export function CatalystCardFooter({ className, children, ...props }: CatalystCardFooterProps) {
  return (
    <div
      {...props}
      className={clsx(
        className,
        'border-t border-zinc-950/5 bg-zinc-50/50 px-6 py-4',
        'dark:border-white/5 dark:bg-white/2.5'
      )}
    >
      {children}
    </div>
  );
}

// Backward compatibility exports
export const Card = CatalystCard;
export const CardHeader = CatalystCardHeader;
export const CardBody = CatalystCardBody;
export const CardFooter = CatalystCardFooter;