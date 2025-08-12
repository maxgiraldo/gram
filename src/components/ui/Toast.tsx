import React, { useEffect, useState } from 'react';

export interface ToastProps {
  id?: string;
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 means no auto-dismiss
  onDismiss?: (id?: string) => void;
  showCloseButton?: boolean;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  variant = 'info',
  title,
  message,
  duration = 5000,
  onDismiss,
  showCloseButton = true,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = React.useCallback(() => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.(id);
    }, 300); // Allow for exit animation
  }, [onDismiss, id]);

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, handleDismiss]);


  const variantStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-400',
      text: 'text-green-800',
      iconPath: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-400',
      text: 'text-red-800',
      iconPath: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-400',
      text: 'text-yellow-800',
      iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      text: 'text-blue-800',
      iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  };

  const styles = variantStyles[variant];

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        max-w-sm w-full ${styles.bg} ${styles.border} border rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5
        ${className}
      `}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg
              className={`h-6 w-6 ${styles.icon}`}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d={styles.iconPath}
              />
            </svg>
          </div>
          <div className="ml-3 w-0 flex-1">
            {title && (
              <p className={`text-sm font-medium ${styles.text}`}>
                {title}
              </p>
            )}
            <p className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
              {message}
            </p>
          </div>
          {showCloseButton && (
            <div className="ml-4 flex-shrink-0 flex">
              <button
                className={`inline-flex ${styles.text} hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150`}
                onClick={handleDismiss}
                aria-label="Dismiss notification"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Toast Container Component for managing multiple toasts
export interface ToastContainerProps {
  toasts: (ToastProps & { id: string })[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
  position = 'top-right',
}) => {
  const positionStyles = {
    'top-right': 'top-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2',
  };

  return (
    <div
      className={`fixed z-50 p-6 space-y-4 ${positionStyles[position]}`}
      aria-live="assertive"
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={() => onDismiss(toast.id)}
        />
      ))}
    </div>
  );
};