import * as Headless from '@headlessui/react';
import clsx from 'clsx';
import React, { forwardRef } from 'react';
import Link from 'next/link';

const styles = {
  base: [
    // Base
    'relative isolate inline-flex items-baseline justify-center gap-x-2 rounded-lg border text-base/6 font-semibold',
    // Sizing
    'px-[calc(theme(spacing.3.5)-1px)] py-[calc(theme(spacing.2.5)-1px)] sm:px-[calc(theme(spacing.3)-1px)] sm:py-[calc(theme(spacing.1.5)-1px)] sm:text-sm/6',
    // Focus
    'focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500',
    // Disabled
    'disabled:opacity-50',
    // Icon
    '*:data-[slot=icon]:-mx-0.5 *:data-[slot=icon]:my-0.5 *:data-[slot=icon]:size-5 *:data-[slot=icon]:shrink-0 *:data-[slot=icon]:self-center sm:*:data-[slot=icon]:my-1 sm:*:data-[slot=icon]:size-4',
  ],
  solid: [
    // Optical border, implemented as the button background
    'border-transparent',
    // Button background with shadow
    'shadow-sm',
    // Background color variations handled by color classes
  ],
  outline: [
    // Base
    'border-zinc-950/10 text-zinc-950 hover:bg-zinc-950/2.5 active:bg-zinc-950/2.5',
    // Dark mode
    'dark:border-white/15 dark:text-white dark:hover:bg-white/5 dark:active:bg-white/5',
  ],
  plain: [
    // Base
    'border-transparent text-zinc-950 hover:bg-zinc-950/5 active:bg-zinc-950/5',
    // Dark mode
    'dark:text-white dark:hover:bg-white/10 dark:active:bg-white/10',
  ],
  colors: {
    primary: [
      'text-white bg-blue-600 border-blue-700/90 hover:bg-blue-500 active:bg-blue-700',
      'dark:bg-blue-500 dark:border-blue-600/90 dark:hover:bg-blue-400 dark:active:bg-blue-600',
    ],
    success: [
      'text-white bg-green-600 border-green-700/90 hover:bg-green-500 active:bg-green-700',
      'dark:bg-green-500 dark:border-green-600/90 dark:hover:bg-green-400 dark:active:bg-green-600',
    ],
    danger: [
      'text-white bg-red-600 border-red-700/90 hover:bg-red-500 active:bg-red-700',
      'dark:bg-red-500 dark:border-red-600/90 dark:hover:bg-red-400 dark:active:bg-red-600',
    ],
    warning: [
      'text-yellow-950 bg-yellow-400 border-yellow-500/80 hover:bg-yellow-300 active:bg-yellow-500',
      'dark:text-yellow-900 dark:bg-yellow-300 dark:border-yellow-400/80 dark:hover:bg-yellow-200 dark:active:bg-yellow-400',
    ],
    default: [
      'text-white bg-zinc-900 border-zinc-950/90 hover:bg-zinc-800 active:bg-zinc-950',
      'dark:bg-zinc-600 dark:border-zinc-700/90 dark:hover:bg-zinc-500 dark:active:bg-zinc-700',
    ],
    light: [
      'text-zinc-950 bg-white border-zinc-950/10 hover:bg-zinc-50 active:bg-zinc-100',
      'dark:text-white dark:bg-zinc-800 dark:border-white/15 dark:hover:bg-zinc-700 dark:active:bg-zinc-800',
    ],
  },
};

type ButtonProps = (
  | { color?: keyof typeof styles.colors; outline?: never; plain?: never }
  | { color?: never; outline: true; plain?: never }
  | { color?: never; outline?: never; plain: true }
) & { 
  className?: string; 
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
} & (
  | (Omit<Headless.ButtonProps, 'as' | 'className'> & { href?: never })
  | (Omit<React.ComponentPropsWithoutRef<typeof Link>, 'className'> & { href: string })
);

export const CatalystButton = forwardRef(function CatalystButton(
  { color = 'default', outline, plain, size = 'md', className, children, ...props }: ButtonProps,
  ref: React.ForwardedRef<HTMLElement>
) {
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-sm',
    md: 'px-3.5 py-2.5 text-base',
    lg: 'px-4 py-3 text-lg',
  };

  let classes = clsx(
    className,
    styles.base,
    sizeClasses[size],
    outline 
      ? styles.outline 
      : plain 
      ? styles.plain 
      : clsx(styles.solid, styles.colors[color])
  );

  return 'href' in props && props.href ? (
    <Link {...props} className={classes} ref={ref as React.ForwardedRef<HTMLAnchorElement>}>
      <TouchTarget>{children}</TouchTarget>
    </Link>
  ) : (
    <Headless.Button {...props} className={clsx(classes, 'cursor-default')} ref={ref}>
      <TouchTarget>{children}</TouchTarget>
    </Headless.Button>
  );
});

/**
 * Expand the hit area to at least 44×44px on touch devices
 */
export function TouchTarget({ children }: { children: React.ReactNode }) {
  return (
    <>
      <span
        className="absolute top-1/2 left-1/2 size-[max(100%,2.75rem)] -translate-x-1/2 -translate-y-1/2 [@media(pointer:fine)]:hidden"
        aria-hidden="true"
      />
      {children}
    </>
  );
}

// Keep backward compatibility
export const Button = CatalystButton;