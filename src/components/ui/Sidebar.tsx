import React from 'react';
import { Button } from './Button';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  className?: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  badge?: string | number;
  children?: SidebarItem[];
}

export interface SidebarSection {
  id: string;
  title?: string;
  items: SidebarItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggle,
  className = '',
}) => {
  const sidebarSections: SidebarSection[] = [
    {
      id: 'main',
      items: [
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v4H8V5z" />
            </svg>
          ),
          href: '/dashboard',
          active: true,
        },
        {
          id: 'lessons',
          label: 'Lessons',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          ),
          href: '/lessons',
          badge: '12',
        },
      ],
    },
    {
      id: 'practice',
      title: 'Practice',
      items: [
        {
          id: 'exercises',
          label: 'Exercises',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          ),
          href: '/exercises',
        },
        {
          id: 'quizzes',
          label: 'Quizzes',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
          href: '/quizzes',
          badge: 'New',
        },
      ],
    },
    {
      id: 'progress',
      title: 'Progress',
      items: [
        {
          id: 'analytics',
          label: 'Analytics',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          ),
          href: '/analytics',
        },
        {
          id: 'achievements',
          label: 'Achievements',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          ),
          href: '/achievements',
        },
      ],
    },
  ];

  return (
    <div
      className={`
        fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white border-r border-gray-200 
        transition-all duration-300 ease-in-out z-30 overflow-y-auto
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${className}
      `}
    >
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-200">
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
              Navigation
            </h2>
            {onToggle && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="p-1"
                aria-label="Collapse sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Button>
            )}
          </div>
        )}
        {isCollapsed && onToggle && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="p-1 w-full"
            aria-label="Expand sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        )}
      </div>

      {/* Sidebar Content */}
      <div className="py-4">
        {sidebarSections.map((section) => (
          <div key={section.id} className="mb-6">
            {/* Section Title */}
            {section.title && !isCollapsed && (
              <div className="px-4 mb-2">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              </div>
            )}

            {/* Section Items */}
            <div className="space-y-1">
              {section.items.map((item) => (
                <div key={item.id}>
                  <a
                    href={item.href}
                    onClick={item.onClick}
                    className={`
                      group flex items-center px-4 py-2 text-sm font-medium rounded-none transition-colors duration-200
                      ${item.active
                        ? 'text-blue-600 bg-blue-50 border-r-4 border-blue-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className="flex-shrink-0">
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="ml-3 flex-1">{item.label}</span>
                        {item.badge && (
                          <span className={`
                            ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${typeof item.badge === 'number' 
                              ? 'bg-gray-100 text-gray-800' 
                              : 'bg-green-100 text-green-800'
                            }
                          `}>
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </a>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
        {!isCollapsed ? (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">U</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                User Name
              </p>
              <p className="text-xs text-gray-500 truncate">
                Learning Progress
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-blue-600">U</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};