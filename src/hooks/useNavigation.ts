import { useState, useCallback, useEffect } from 'react';

export interface NavigationState {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  activeNavItem: string | null;
}

export interface NavigationActions {
  toggleSidebar: () => void;
  collapseSidebar: () => void;
  expandSidebar: () => void;
  toggleMobileMenu: () => void;
  setActiveNavItem: (itemId: string | null) => void;
  closeMobileMenu: () => void;
}

export const useNavigation = (initialState?: Partial<NavigationState>) => {
  const [state, setState] = useState<NavigationState>({
    sidebarOpen: false,
    sidebarCollapsed: false,
    mobileMenuOpen: false,
    activeNavItem: null,
    ...initialState,
  });

  // Close mobile menu on window resize if screen gets larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && state.mobileMenuOpen) {
        setState(prev => ({ ...prev, mobileMenuOpen: false }));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [state.mobileMenuOpen]);

  // Close mobile menu when clicking outside (ESC key)
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && state.mobileMenuOpen) {
        setState(prev => ({ ...prev, mobileMenuOpen: false }));
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [state.mobileMenuOpen]);

  const actions: NavigationActions = {
    toggleSidebar: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        sidebarOpen: !prev.sidebarOpen,
        // If opening sidebar, expand it by default
        sidebarCollapsed: prev.sidebarOpen ? prev.sidebarCollapsed : false
      }));
    }, []),

    collapseSidebar: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        sidebarCollapsed: true 
      }));
    }, []),

    expandSidebar: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        sidebarCollapsed: false 
      }));
    }, []),

    toggleMobileMenu: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        mobileMenuOpen: !prev.mobileMenuOpen 
      }));
    }, []),

    setActiveNavItem: useCallback((itemId: string | null) => {
      setState(prev => ({ 
        ...prev, 
        activeNavItem: itemId 
      }));
    }, []),

    closeMobileMenu: useCallback(() => {
      setState(prev => ({ 
        ...prev, 
        mobileMenuOpen: false 
      }));
    }, []),
  };

  return {
    state,
    actions,
  };
};