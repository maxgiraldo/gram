import { useEffect, useCallback, useRef } from 'react';
import { KEYS, FocusManager } from '../utils/accessibility';

export interface KeyboardNavigationOptions {
  enabled?: boolean;
  trapFocus?: boolean;
  restoreFocus?: boolean;
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowKey?: (direction: 'up' | 'down' | 'left' | 'right') => void;
}

/**
 * Hook for managing keyboard navigation within a container
 */
export const useKeyboardNavigation = (
  options: KeyboardNavigationOptions = {}
) => {
  const {
    enabled = true,
    trapFocus = false,
    restoreFocus = false,
    onEscape,
    onEnter,
    onArrowKey,
  } = options;

  const containerRef = useRef<HTMLElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Store previously focused element when container gets focus
  useEffect(() => {
    if (restoreFocus && containerRef.current) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled || !containerRef.current) return;

      switch (event.key) {
        case KEYS.ESCAPE:
          if (onEscape) {
            event.preventDefault();
            onEscape();
          }
          break;

        case KEYS.ENTER:
          if (onEnter) {
            event.preventDefault();
            onEnter();
          }
          break;

        case KEYS.ARROW_UP:
          if (onArrowKey) {
            event.preventDefault();
            onArrowKey('up');
          }
          break;

        case KEYS.ARROW_DOWN:
          if (onArrowKey) {
            event.preventDefault();
            onArrowKey('down');
          }
          break;

        case KEYS.ARROW_LEFT:
          if (onArrowKey) {
            event.preventDefault();
            onArrowKey('left');
          }
          break;

        case KEYS.ARROW_RIGHT:
          if (onArrowKey) {
            event.preventDefault();
            onArrowKey('right');
          }
          break;

        case KEYS.TAB:
          if (trapFocus && containerRef.current) {
            FocusManager.trapFocus(containerRef.current, event);
          }
          break;
      }
    },
    [enabled, onEscape, onEnter, onArrowKey, trapFocus]
  );

  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [enabled, handleKeyDown]);

  const restorePreviousFocus = useCallback(() => {
    if (restoreFocus && previouslyFocusedElement.current) {
      FocusManager.restoreFocus(previouslyFocusedElement.current);
    }
  }, [restoreFocus]);

  return {
    containerRef,
    restorePreviousFocus,
  };
};

/**
 * Hook for managing roving tabindex navigation (e.g., for menus, toolbars)
 */
export const useRovingTabIndex = (itemsSelector: string = '[role="menuitem"]') => {
  const containerRef = useRef<HTMLElement>(null);
  const currentIndex = useRef<number>(0);

  const updateTabIndices = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll(itemsSelector)
    ) as HTMLElement[];

    items.forEach((item, index) => {
      item.tabIndex = index === currentIndex.current ? 0 : -1;
    });
  }, [itemsSelector]);

  const moveToIndex = useCallback(
    (newIndex: number) => {
      if (!containerRef.current) return;

      const items = Array.from(
        containerRef.current.querySelectorAll(itemsSelector)
      ) as HTMLElement[];

      if (newIndex >= 0 && newIndex < items.length) {
        currentIndex.current = newIndex;
        updateTabIndices();
        items[newIndex].focus();
      }
    },
    [itemsSelector, updateTabIndices]
  );

  const moveNext = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll(itemsSelector)
    ) as HTMLElement[];

    const nextIndex = (currentIndex.current + 1) % items.length;
    moveToIndex(nextIndex);
  }, [itemsSelector, moveToIndex]);

  const movePrevious = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll(itemsSelector)
    ) as HTMLElement[];

    const prevIndex = 
      currentIndex.current === 0 ? items.length - 1 : currentIndex.current - 1;
    moveToIndex(prevIndex);
  }, [itemsSelector, moveToIndex]);

  const moveFirst = useCallback(() => {
    moveToIndex(0);
  }, [moveToIndex]);

  const moveLast = useCallback(() => {
    if (!containerRef.current) return;

    const items = Array.from(
      containerRef.current.querySelectorAll(itemsSelector)
    ) as HTMLElement[];

    moveToIndex(items.length - 1);
  }, [itemsSelector, moveToIndex]);

  useEffect(() => {
    updateTabIndices();
  }, [updateTabIndices]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) return;

      switch (event.key) {
        case KEYS.ARROW_DOWN:
        case KEYS.ARROW_RIGHT:
          event.preventDefault();
          moveNext();
          break;

        case KEYS.ARROW_UP:
        case KEYS.ARROW_LEFT:
          event.preventDefault();
          movePrevious();
          break;

        case KEYS.HOME:
          event.preventDefault();
          moveFirst();
          break;

        case KEYS.END:
          event.preventDefault();
          moveLast();
          break;
      }
    },
    [moveNext, movePrevious, moveFirst, moveLast]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    containerRef,
    currentIndex: currentIndex.current,
    moveToIndex,
    moveNext,
    movePrevious,
    moveFirst,
    moveLast,
  };
};