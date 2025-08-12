import React, { useState } from 'react';
import { Button } from './Button';

export interface NavigationProps {
  onSidebarToggle?: () => void;
  showSidebarToggle?: boolean;
  className?: string;
}

export interface NavItem {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
  active?: boolean;
}

export const Navigation: React.FC<NavigationProps> = ({
  onSidebarToggle,
  showSidebarToggle = false,
  className = '',
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'home', label: 'Home', href: '/' },
    { id: 'lessons', label: 'Lessons', href: '/lessons' },
    { id: 'practice', label: 'Practice', href: '/practice' },
    { id: 'progress', label: 'Progress', href: '/progress' },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Sidebar Toggle (Desktop) */}
            {showSidebarToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSidebarToggle}
                className="mr-4 hidden lg:flex"
                aria-label="Toggle sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </Button>
            )}

            {/* Logo */}
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600">Gram</h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              {navItems.map((item) => (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={item.onClick}
                  className={`
                    inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200
                    ${item.active 
                      ? 'border-blue-500 text-gray-900' 
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }
                  `}
                >
                  {item.icon && <span className="mr-2">{item.icon}</span>}
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* User Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMobileMenu}
                aria-label="Toggle mobile menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1 bg-gray-50 border-t border-gray-200">
          {/* Sidebar toggle for mobile */}
          {showSidebarToggle && (
            <button
              onClick={onSidebarToggle}
              className="flex items-center w-full px-4 py-2 text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Menu
            </button>
          )}

          {/* Mobile navigation items */}
          {navItems.map((item) => (
            <a
              key={item.id}
              href={item.href}
              onClick={item.onClick}
              className={`
                block px-4 py-2 text-base font-medium transition-colors duration-200
                ${item.active 
                  ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <div className="flex items-center">
                {item.icon && <span className="mr-3">{item.icon}</span>}
                {item.label}
              </div>
            </a>
          ))}

          {/* Mobile user actions */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-4 space-y-2">
              <Button variant="outline" className="w-full">
                Sign In
              </Button>
              <Button variant="primary" className="w-full">
                Sign Up
              </Button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};