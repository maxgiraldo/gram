/**
 * Accessibility utilities and constants for WCAG 2.1 AA compliance
 */

// WCAG 2.1 AA Color Contrast Standards
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Common ARIA roles and properties
export const ARIA_ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  MENUBAR: 'menubar',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
  DIALOG: 'dialog',
  ALERTDIALOG: 'alertdialog',
  ALERT: 'alert',
  STATUS: 'status',
  PROGRESSBAR: 'progressbar',
  SLIDER: 'slider',
  SPINBUTTON: 'spinbutton',
  TEXTBOX: 'textbox',
  COMBOBOX: 'combobox',
  LISTBOX: 'listbox',
  OPTION: 'option',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  RADIOGROUP: 'radiogroup',
  SWITCH: 'switch',
  BANNER: 'banner',
  MAIN: 'main',
  NAVIGATION: 'navigation',
  COMPLEMENTARY: 'complementary',
  CONTENTINFO: 'contentinfo',
  REGION: 'region',
  SEARCH: 'search',
  FORM: 'form',
  ARTICLE: 'article',
  SECTION: 'section',
} as const;

// Keyboard navigation keys
export const KEYS = {
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  ENTER: 'Enter',
  SPACE: ' ',
  TAB: 'Tab',
  ESCAPE: 'Escape',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
} as const;

// Focus management utilities
export class FocusManager {
  private static focusableSelectors = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
    'audio[controls]',
    'video[controls]',
    'summary',
    'iframe',
  ].join(', ');

  /**
   * Get all focusable elements within a container
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
      container.querySelectorAll(this.focusableSelectors)
    ) as HTMLElement[];
  }

  /**
   * Trap focus within a container (useful for modals)
   */
  static trapFocus(container: HTMLElement, event: KeyboardEvent): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.key === KEYS.TAB) {
      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }

  /**
   * Move focus to next/previous focusable element
   */
  static moveFocus(
    container: HTMLElement,
    direction: 'next' | 'previous'
  ): void {
    const focusableElements = this.getFocusableElements(container);
    const currentIndex = focusableElements.findIndex(
      el => el === document.activeElement
    );

    if (currentIndex === -1) return;

    let nextIndex: number;
    if (direction === 'next') {
      nextIndex = (currentIndex + 1) % focusableElements.length;
    } else {
      nextIndex = currentIndex === 0 
        ? focusableElements.length - 1 
        : currentIndex - 1;
    }

    focusableElements[nextIndex].focus();
  }

  /**
   * Restore focus to previously focused element
   */
  static restoreFocus(element: HTMLElement | null): void {
    if (element && this.isFocusable(element)) {
      element.focus();
    }
  }

  /**
   * Check if element is focusable
   */
  static isFocusable(element: HTMLElement): boolean {
    return element.matches(this.focusableSelectors);
  }
}

// Screen reader utilities
export class ScreenReader {
  /**
   * Announce content to screen readers
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  /**
   * Create screen reader only text
   */
  static createSROnlyText(text: string): HTMLSpanElement {
    const span = document.createElement('span');
    span.className = 'sr-only';
    span.textContent = text;
    return span;
  }
}

// Color contrast utilities
export class ColorContrast {
  /**
   * Convert hex color to RGB
   */
  static hexToRgb(hex: string): [number, number, number] | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
          parseInt(result[1], 16),
          parseInt(result[2], 16),
          parseInt(result[3], 16),
        ]
      : null;
  }

  /**
   * Get relative luminance of a color
   */
  static getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  }

  /**
   * Calculate contrast ratio between two colors
   */
  static getContrastRatio(color1: string, color2: string): number | null {
    const rgb1 = this.hexToRgb(color1);
    const rgb2 = this.hexToRgb(color2);

    if (!rgb1 || !rgb2) return null;

    const lum1 = this.getLuminance(...rgb1);
    const lum2 = this.getLuminance(...rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
  }

  /**
   * Check if color combination meets WCAG contrast requirements
   */
  static meetsContrastRequirement(
    foreground: string,
    background: string,
    level: 'AA' | 'AAA' = 'AA',
    size: 'normal' | 'large' = 'normal'
  ): boolean {
    const ratio = this.getContrastRatio(foreground, background);
    if (!ratio) return false;

    const requirement = level === 'AA'
      ? (size === 'large' ? CONTRAST_RATIOS.AA_LARGE : CONTRAST_RATIOS.AA_NORMAL)
      : (size === 'large' ? CONTRAST_RATIOS.AAA_LARGE : CONTRAST_RATIOS.AAA_NORMAL);

    return ratio >= requirement;
  }
}

// Skip link utilities
export const createSkipLink = (targetId: string, text: string = 'Skip to main content'): HTMLAnchorElement => {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = text;
  skipLink.className = 'skip-link';
  
  // Position off-screen until focused
  skipLink.style.position = 'absolute';
  skipLink.style.left = '-10000px';
  skipLink.style.top = 'auto';
  skipLink.style.width = '1px';
  skipLink.style.height = '1px';
  skipLink.style.overflow = 'hidden';

  // Show when focused
  skipLink.addEventListener('focus', () => {
    skipLink.style.position = 'fixed';
    skipLink.style.left = '6px';
    skipLink.style.top = '7px';
    skipLink.style.width = 'auto';
    skipLink.style.height = 'auto';
    skipLink.style.padding = '8px 16px';
    skipLink.style.background = '#000';
    skipLink.style.color = '#fff';
    skipLink.style.textDecoration = 'none';
    skipLink.style.zIndex = '1000';
  });

  skipLink.addEventListener('blur', () => {
    skipLink.style.position = 'absolute';
    skipLink.style.left = '-10000px';
    skipLink.style.top = 'auto';
    skipLink.style.width = '1px';
    skipLink.style.height = '1px';
    skipLink.style.padding = '0';
  });

  return skipLink;
};