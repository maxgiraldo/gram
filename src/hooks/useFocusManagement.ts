import { useEffect, useRef, useCallback } from 'react';
import { FocusManager } from '../utils/accessibility';

export interface FocusManagementOptions {
  autoFocus?: boolean;
  restoreFocus?: boolean;
  focusFirstOnMount?: boolean;
  focusOnOpen?: boolean;
}

/**
 * Hook for managing focus within components
 */
export const useFocusManagement = (options: FocusManagementOptions = {}) => {
  const {
    autoFocus = false,
    restoreFocus = false,
    focusFirstOnMount = false,
    focusOnOpen = false,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const isOpenRef = useRef(false);

  // Store previously focused element
  const storePreviousFocus = useCallback(() => {
    if (restoreFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus]);

  // Restore focus to previously focused element
  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previouslyFocusedElement.current) {
      FocusManager.restoreFocus(previouslyFocusedElement.current);
      previouslyFocusedElement.current = null;
    }
  }, [restoreFocus]);

  // Focus first focusable element in container
  const focusFirst = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = FocusManager.getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, []);

  // Focus last focusable element in container
  const focusLast = useCallback(() => {
    if (!containerRef.current) return;

    const focusableElements = FocusManager.getFocusableElements(containerRef.current);
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, []);

  // Handle opening (e.g., for modals, dropdowns)
  const handleOpen = useCallback(() => {
    storePreviousFocus();
    isOpenRef.current = true;

    if (focusOnOpen) {
      // Focus after DOM update
      setTimeout(() => {
        focusFirst();
      }, 0);
    }
  }, [storePreviousFocus, focusOnOpen, focusFirst]);

  // Handle closing
  const handleClose = useCallback(() => {
    isOpenRef.current = false;
    restorePreviousFocus();
  }, [restorePreviousFocus]);

  // Auto-focus on mount if requested
  useEffect(() => {
    if (focusFirstOnMount || autoFocus) {
      focusFirst();
    }
  }, [focusFirstOnMount, autoFocus, focusFirst]);

  return {
    containerRef,
    focusFirst,
    focusLast,
    storePreviousFocus,
    restorePreviousFocus,
    handleOpen,
    handleClose,
    isOpen: isOpenRef.current,
  };
};

/**
 * Hook for managing focus trap (useful for modals, dialogs)
 */
export const useFocusTrap = (isActive: boolean = true) => {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = FocusManager.getFocusableElements(container);

    if (focusableElements.length === 0) return;

    // Focus first element
    focusableElements[0].focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        FocusManager.trapFocus(container, event);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return { containerRef };
};

/**
 * Hook for managing focus within form fields
 */
export const useFormFocus = () => {
  const formRef = useRef<HTMLFormElement>(null);

  const focusFirstError = useCallback(() => {
    if (!formRef.current) return;

    // Look for elements with aria-invalid="true" or .error class
    const errorElements = formRef.current.querySelectorAll(
      '[aria-invalid="true"], .error input, .error select, .error textarea'
    ) as NodeListOf<HTMLElement>;

    if (errorElements.length > 0) {
      errorElements[0].focus();
      return true;
    }

    return false;
  }, []);

  const focusField = useCallback((fieldName: string) => {
    if (!formRef.current) return;

    const field = formRef.current.querySelector(`[name="${fieldName}"]`) as HTMLElement;
    if (field && FocusManager.isFocusable(field)) {
      field.focus();
    }
  }, []);

  const validateAndFocus = useCallback((errors: Record<string, string>) => {
    const errorFields = Object.keys(errors);
    if (errorFields.length > 0) {
      focusField(errorFields[0]);
      return false;
    }
    return true;
  }, [focusField]);

  return {
    formRef,
    focusFirstError,
    focusField,
    validateAndFocus,
  };
};