import React, { useEffect } from 'react';
import { ScreenReader } from '../../utils/accessibility';

export interface ScreenReaderTextProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Text that is only visible to screen readers
 */
export const ScreenReaderText: React.FC<ScreenReaderTextProps> = ({
  children,
  className = '',
}) => {
  return (
    <span className={`sr-only ${className}`}>
      {children}
    </span>
  );
};

export interface LiveAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive';
  clearAfter?: number;
}

/**
 * Component for making live announcements to screen readers
 */
export const LiveAnnouncement: React.FC<LiveAnnouncementProps> = ({
  message,
  priority = 'polite',
  clearAfter = 1000,
}) => {
  useEffect(() => {
    if (message) {
      ScreenReader.announce(message, priority);
    }
  }, [message, priority]);

  return null; // This component doesn't render anything visible
};

export interface ProgressAnnouncementProps {
  current: number;
  total: number;
  label?: string;
  includePercentage?: boolean;
}

/**
 * Announces progress updates to screen readers
 */
export const ProgressAnnouncement: React.FC<ProgressAnnouncementProps> = ({
  current,
  total,
  label = 'Progress',
  includePercentage = true,
}) => {
  const percentage = Math.round((current / total) * 100);
  
  const message = includePercentage
    ? `${label}: ${current} of ${total}, ${percentage}% complete`
    : `${label}: ${current} of ${total}`;

  return <LiveAnnouncement message={message} priority="polite" />;
};

export interface SkipLinksProps {
  links: Array<{
    href: string;
    text: string;
  }>;
  className?: string;
}

/**
 * Skip navigation links for keyboard users
 */
export const SkipLinks: React.FC<SkipLinksProps> = ({
  links,
  className = '',
}) => {
  return (
    <nav aria-label="Skip navigation" className={`skip-links ${className}`}>
      {links.map((link, index) => (
        <a
          key={index}
          href={link.href}
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            const target = document.querySelector(link.href);
            if (target) {
              (target as HTMLElement).focus();
              target.scrollIntoView({ behavior: 'smooth' });
            }
          }}
        >
          {link.text}
        </a>
      ))}
    </nav>
  );
};

export interface LandmarksProps {
  children: React.ReactNode;
  role?: 'banner' | 'main' | 'navigation' | 'complementary' | 'contentinfo' | 'search' | 'form';
  ariaLabel?: string;
  ariaLabelledBy?: string;
  className?: string;
}

/**
 * Semantic landmark wrapper for better screen reader navigation
 */
export const Landmark: React.FC<LandmarksProps> = ({
  children,
  role,
  ariaLabel,
  ariaLabelledBy,
  className = '',
}) => {
  const props: React.HTMLAttributes<HTMLElement> = {
    role,
    className,
  };

  if (ariaLabel) {
    props['aria-label'] = ariaLabel;
  }

  if (ariaLabelledBy) {
    props['aria-labelledby'] = ariaLabelledBy;
  }

  // Use semantic HTML elements when possible
  if (role === 'banner') {
    return <header {...props}>{children}</header>;
  }
  
  if (role === 'main') {
    return <main {...props}>{children}</main>;
  }
  
  if (role === 'navigation') {
    return <nav {...props}>{children}</nav>;
  }
  
  if (role === 'contentinfo') {
    return <footer {...props}>{children}</footer>;
  }

  return <section {...props}>{children}</section>;
};

export interface FocusIndicatorProps {
  children: React.ReactNode;
  visible?: boolean;
  className?: string;
}

/**
 * Enhanced focus indicator for better visibility
 */
export const FocusIndicator: React.FC<FocusIndicatorProps> = ({
  children,
  visible = true,
  className = '',
}) => {
  return (
    <div 
      className={`
        ${visible ? 'focus-within:ring-2 focus-within:ring-blue-600 focus-within:ring-offset-2' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export interface StatusMessageProps {
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  live?: boolean;
  className?: string;
}

/**
 * Status message with proper ARIA attributes
 */
export const StatusMessage: React.FC<StatusMessageProps> = ({
  message,
  type = 'info',
  live = false,
  className = '',
}) => {
  const ariaProps: React.HTMLAttributes<HTMLDivElement> = {
    role: type === 'error' ? 'alert' : 'status',
  };

  if (live) {
    ariaProps['aria-live'] = type === 'error' ? 'assertive' : 'polite';
    ariaProps['aria-atomic'] = true;
  }

  const typeClasses = {
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    success: 'bg-green-50 text-green-800 border-green-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    error: 'bg-red-50 text-red-800 border-red-200',
  };

  return (
    <div
      {...ariaProps}
      className={`
        p-4 border rounded-md ${typeClasses[type]} ${className}
      `}
    >
      <ScreenReaderText>
        {type === 'error' ? 'Error: ' : type === 'warning' ? 'Warning: ' : ''}
      </ScreenReaderText>
      {message}
    </div>
  );
};

export interface DescriptiveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  description?: string;
  expandsLabel?: boolean;
  controlsId?: string;
  pressed?: boolean;
}

/**
 * Button with enhanced accessibility attributes
 */
export const DescriptiveButton: React.FC<DescriptiveButtonProps> = ({
  children,
  description,
  expandsLabel = false,
  controlsId,
  pressed,
  className = '',
  ...props
}) => {
  const ariaProps: React.ButtonHTMLAttributes<HTMLButtonElement> = {};

  if (description) {
    ariaProps['aria-describedby'] = `${props.id}-description`;
  }

  if (controlsId) {
    ariaProps['aria-controls'] = controlsId;
  }

  if (pressed !== undefined) {
    ariaProps['aria-pressed'] = pressed;
  }

  if (expandsLabel) {
    ariaProps['aria-expanded'] = pressed;
  }

  return (
    <>
      <button
        {...props}
        {...ariaProps}
        className={`btn ${className}`}
      >
        {children}
      </button>
      {description && (
        <div id={`${props.id}-description`} className="sr-only">
          {description}
        </div>
      )}
    </>
  );
};

export interface LoadingIndicatorProps {
  isLoading: boolean;
  label?: string;
  children?: React.ReactNode;
}

/**
 * Loading indicator with screen reader support
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  isLoading,
  label = 'Loading',
  children,
}) => {
  if (!isLoading) {
    return <>{children}</>;
  }

  return (
    <div role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true">
        {/* Visual spinner */}
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      <ScreenReaderText>{label}...</ScreenReaderText>
    </div>
  );
};