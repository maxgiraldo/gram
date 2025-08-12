import React from 'react';
import { Navigation } from './Navigation';
import { Sidebar } from './Sidebar';

export interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
  sidebarCollapsed?: boolean;
  onSidebarToggle?: () => void;
  className?: string;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  showSidebar = false,
  sidebarCollapsed = false,
  onSidebarToggle,
  className = '',
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Navigation */}
      <Navigation 
        onSidebarToggle={onSidebarToggle}
        showSidebarToggle={showSidebar}
      />

      <div className="flex">
        {/* Sidebar */}
        {showSidebar && (
          <Sidebar 
            isCollapsed={sidebarCollapsed}
            onToggle={onSidebarToggle}
          />
        )}

        {/* Main Content */}
        <main 
          className={`
            flex-1 transition-all duration-300 ease-in-out
            ${showSidebar ? (sidebarCollapsed ? 'ml-16' : 'ml-64') : ''}
          `}
        >
          <div className="container mx-auto px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};