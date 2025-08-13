/**
 * Content Navigation System
 * 
 * Comprehensive navigation components for lessons including prerequisite checking,
 * breadcrumb navigation, lesson tree, and progress-based restrictions.
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '../ui/Button';
import { Card, CardHeader, CardBody } from '../ui/Card';
import type { Unit, Lesson, ProgressStatus, LearningObjective } from '../../types/content';

// ===== NAVIGATION TYPES =====

export interface NavigationNode {
  id: string;
  type: 'unit' | 'lesson' | 'section';
  title: string;
  description?: string;
  path: string;
  children?: NavigationNode[];
  parent?: NavigationNode;
  
  // Progress and prerequisites
  status: ProgressStatus;
  isLocked: boolean;
  prerequisites?: string[];
  prerequisitesMet: boolean;
  
  // Metadata
  orderIndex: number;
  estimatedMinutes?: number;
  difficulty?: string;
  completionPercentage?: number;
}

export interface NavigationContext {
  currentPath: string;
  currentNode?: NavigationNode;
  breadcrumbs: NavigationNode[];
  canNavigate: (nodeId: string) => boolean;
  navigate: (path: string) => void;
}

export interface UserProgress {
  completedLessons: string[];
  completedUnits: string[];
  currentLesson?: string;
  currentUnit?: string;
  lessonProgress: Record<string, {
    status: ProgressStatus;
    completionPercentage: number;
    lastAccessed?: Date;
  }>;
}

// ===== MAIN NAVIGATION COMPONENT =====

export interface ContentNavigationProps {
  units: Unit[];
  currentLessonId?: string;
  userProgress?: UserProgress;
  onNavigate?: (lessonId: string) => void;
  showSidebar?: boolean;
  showBreadcrumbs?: boolean;
  showProgressIndicators?: boolean;
  allowKeyboardNavigation?: boolean;
  className?: string;
}

/**
 * Main Content Navigation Component
 */
export function ContentNavigation({
  units,
  currentLessonId,
  userProgress,
  onNavigate,
  showSidebar = true,
  showBreadcrumbs = true,
  showProgressIndicators = true,
  allowKeyboardNavigation = true,
  className = ''
}: ContentNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(currentLessonId || null);

  // Build navigation tree from units and lessons
  const navigationTree = useMemo(() => {
    return buildNavigationTree(units, userProgress);
  }, [units, userProgress]);

  // Find current node and breadcrumbs
  const { currentNode, breadcrumbs } = useMemo(() => {
    if (!selectedNodeId) return { currentNode: undefined, breadcrumbs: [] };
    
    const node = findNodeById(navigationTree, selectedNodeId);
    const crumbs = node ? buildBreadcrumbs(node) : [];
    
    return { currentNode: node, breadcrumbs: crumbs };
  }, [navigationTree, selectedNodeId]);

  // Check if navigation to a node is allowed
  const canNavigate = useCallback((nodeId: string): boolean => {
    const node = findNodeById(navigationTree, nodeId);
    if (!node) return false;
    
    // Check if node is locked or prerequisites not met
    if (node.isLocked || !node.prerequisitesMet) {
      return false;
    }
    
    return true;
  }, [navigationTree]);

  // Handle navigation
  const handleNavigate = useCallback((nodeId: string) => {
    if (!canNavigate(nodeId)) {
      return;
    }
    
    const node = findNodeById(navigationTree, nodeId);
    if (!node) return;
    
    setSelectedNodeId(nodeId);
    
    if (node.type === 'lesson') {
      onNavigate?.(nodeId);
      router.push(node.path);
    } else if (node.type === 'unit') {
      // Expand/collapse unit
      setExpandedUnits(prev => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          next.delete(nodeId);
        } else {
          next.add(nodeId);
        }
        return next;
      });
    }
  }, [canNavigate, navigationTree, onNavigate, router]);

  // Keyboard navigation
  useEffect(() => {
    if (!allowKeyboardNavigation) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!currentNode) return;

      switch (e.key) {
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          navigateToPrevious();
          break;
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          navigateToNext();
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          if (currentNode.type === 'lesson') {
            handleNavigate(currentNode.id);
          }
          break;
        case 'Escape':
          e.preventDefault();
          navigateToParent();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [allowKeyboardNavigation, currentNode, handleNavigate]);

  // Navigate to previous lesson
  const navigateToPrevious = useCallback(() => {
    if (!currentNode) return;
    
    const allLessons = getAllLessons(navigationTree);
    const currentIndex = allLessons.findIndex(l => l.id === currentNode.id);
    
    if (currentIndex > 0) {
      const prevLesson = allLessons[currentIndex - 1];
      if (canNavigate(prevLesson.id)) {
        handleNavigate(prevLesson.id);
      }
    }
  }, [currentNode, navigationTree, canNavigate, handleNavigate]);

  // Navigate to next lesson
  const navigateToNext = useCallback(() => {
    if (!currentNode) return;
    
    const allLessons = getAllLessons(navigationTree);
    const currentIndex = allLessons.findIndex(l => l.id === currentNode.id);
    
    if (currentIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentIndex + 1];
      if (canNavigate(nextLesson.id)) {
        handleNavigate(nextLesson.id);
      }
    }
  }, [currentNode, navigationTree, canNavigate, handleNavigate]);

  // Navigate to parent unit
  const navigateToParent = useCallback(() => {
    if (!currentNode || !currentNode.parent) return;
    handleNavigate(currentNode.parent.id);
  }, [currentNode, handleNavigate]);

  // Auto-expand current unit
  useEffect(() => {
    if (currentNode && currentNode.parent) {
      setExpandedUnits(prev => new Set([...prev, currentNode.parent!.id]));
    }
  }, [currentNode]);

  return (
    <div className={`content-navigation ${className}`}>
      {/* Breadcrumb Navigation */}
      {showBreadcrumbs && breadcrumbs.length > 0 && (
        <BreadcrumbNavigation
          breadcrumbs={breadcrumbs}
          onNavigate={handleNavigate}
          className="mb-4"
        />
      )}

      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        {showSidebar && (
          <aside className="w-80 flex-shrink-0">
            <LessonTreeNavigation
              nodes={navigationTree}
              selectedNodeId={selectedNodeId}
              expandedUnits={expandedUnits}
              onNavigate={handleNavigate}
              canNavigate={canNavigate}
              showProgressIndicators={showProgressIndicators}
              className="sticky top-4"
            />
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          {/* Progress Overview */}
          {showProgressIndicators && userProgress && (
            <ProgressOverview
              userProgress={userProgress}
              units={units}
              className="mb-6"
            />
          )}

          {/* Navigation Controls */}
          <NavigationControls
            currentNode={currentNode}
            onPrevious={navigateToPrevious}
            onNext={navigateToNext}
            canGoPrevious={!!currentNode && getAllLessons(navigationTree).findIndex(l => l.id === currentNode.id) > 0}
            canGoNext={!!currentNode && getAllLessons(navigationTree).findIndex(l => l.id === currentNode.id) < getAllLessons(navigationTree).length - 1}
            className="mb-4"
          />
        </main>
      </div>
    </div>
  );
}

// ===== BREADCRUMB NAVIGATION =====

interface BreadcrumbNavigationProps {
  breadcrumbs: NavigationNode[];
  onNavigate: (nodeId: string) => void;
  className?: string;
}

function BreadcrumbNavigation({ breadcrumbs, onNavigate, className = '' }: BreadcrumbNavigationProps) {
  return (
    <nav aria-label="Breadcrumb" className={`breadcrumb-navigation ${className}`}>
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <button
            onClick={() => onNavigate('home')}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Home
          </button>
        </li>
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.id}>
            <li className="text-gray-400">/</li>
            <li>
              {index === breadcrumbs.length - 1 ? (
                <span className="text-gray-900 font-medium">{crumb.title}</span>
              ) : (
                <button
                  onClick={() => onNavigate(crumb.id)}
                  className="text-blue-600 hover:text-blue-700 transition-colors"
                >
                  {crumb.title}
                </button>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
}

// ===== LESSON TREE NAVIGATION =====

interface LessonTreeNavigationProps {
  nodes: NavigationNode[];
  selectedNodeId: string | null;
  expandedUnits: Set<string>;
  onNavigate: (nodeId: string) => void;
  canNavigate: (nodeId: string) => boolean;
  showProgressIndicators: boolean;
  className?: string;
}

function LessonTreeNavigation({
  nodes,
  selectedNodeId,
  expandedUnits,
  onNavigate,
  canNavigate,
  showProgressIndicators,
  className = ''
}: LessonTreeNavigationProps) {
  return (
    <Card className={`lesson-tree-navigation ${className}`}>
      <CardHeader>
        <h3 className="text-lg font-semibold">Course Content</h3>
      </CardHeader>
      <CardBody className="p-0">
        <div className="divide-y divide-gray-200">
          {nodes.map(node => (
            <TreeNode
              key={node.id}
              node={node}
              isSelected={selectedNodeId === node.id}
              isExpanded={expandedUnits.has(node.id)}
              onNavigate={onNavigate}
              canNavigate={canNavigate}
              showProgressIndicators={showProgressIndicators}
              level={0}
            />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

// ===== TREE NODE COMPONENT =====

interface TreeNodeProps {
  node: NavigationNode;
  isSelected: boolean;
  isExpanded: boolean;
  onNavigate: (nodeId: string) => void;
  canNavigate: (nodeId: string) => boolean;
  showProgressIndicators: boolean;
  level: number;
}

function TreeNode({
  node,
  isSelected,
  isExpanded,
  onNavigate,
  canNavigate,
  showProgressIndicators,
  level
}: TreeNodeProps) {
  const isNavigable = canNavigate(node.id);
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div>
      <button
        onClick={() => onNavigate(node.id)}
        className={`
          w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors
          ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''}
          ${!isNavigable ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{ paddingLeft: `${(level * 1.5) + 1}rem` }}
        disabled={!isNavigable}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {/* Expand/Collapse Icon */}
            {hasChildren && (
              <span className="text-gray-400 flex-shrink-0">
                {isExpanded ? '▼' : '▶'}
              </span>
            )}
            
            {/* Lock Icon */}
            {node.isLocked && (
              <span className="text-gray-400 flex-shrink-0">🔒</span>
            )}
            
            {/* Node Title */}
            <span className={`truncate ${isSelected ? 'font-semibold' : ''}`}>
              {node.title}
            </span>
            
            {/* Status Badge */}
            {node.status !== 'not_started' && (
              <StatusBadge status={node.status} small />
            )}
          </div>
          
          {/* Progress Indicator */}
          {showProgressIndicators && node.completionPercentage !== undefined && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              <span className="text-xs text-gray-500">
                {Math.round(node.completionPercentage)}%
              </span>
              <div className="w-12 bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${node.completionPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Additional Info */}
        {node.estimatedMinutes && (
          <div className="mt-1 text-xs text-gray-500">
            {node.estimatedMinutes} min • {node.difficulty}
          </div>
        )}
      </button>
      
      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-gray-200 ml-4">
          {node.children!.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              isSelected={isSelected}
              isExpanded={false}
              onNavigate={onNavigate}
              canNavigate={canNavigate}
              showProgressIndicators={showProgressIndicators}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== NAVIGATION CONTROLS =====

interface NavigationControlsProps {
  currentNode?: NavigationNode;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  className?: string;
}

function NavigationControls({
  currentNode,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  className = ''
}: NavigationControlsProps) {
  return (
    <div className={`navigation-controls flex justify-between items-center ${className}`}>
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={!canGoPrevious}
        className="flex items-center space-x-2"
      >
        <span>←</span>
        <span>Previous</span>
      </Button>
      
      {currentNode && (
        <div className="text-center">
          <h2 className="text-xl font-semibold">{currentNode.title}</h2>
          {currentNode.description && (
            <p className="text-sm text-gray-600 mt-1">{currentNode.description}</p>
          )}
        </div>
      )}
      
      <Button
        variant="outline"
        onClick={onNext}
        disabled={!canGoNext}
        className="flex items-center space-x-2"
      >
        <span>Next</span>
        <span>→</span>
      </Button>
    </div>
  );
}

// ===== PROGRESS OVERVIEW =====

interface ProgressOverviewProps {
  userProgress: UserProgress;
  units: Unit[];
  className?: string;
}

function ProgressOverview({ userProgress, units, className = '' }: ProgressOverviewProps) {
  const totalLessons = units.reduce((sum, unit) => sum + unit.lessons.length, 0);
  const completedLessons = userProgress.completedLessons.length;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  
  return (
    <Card className={`progress-overview ${className}`}>
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Your Progress</h3>
          <span className="text-2xl font-bold text-blue-600">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Overall Progress</span>
              <span>{completedLessons} / {totalLessons} lessons</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
          
          {userProgress.currentLesson && (
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-600">Current Lesson:</p>
              <p className="font-medium">{userProgress.currentLesson}</p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

// ===== STATUS BADGE =====

interface StatusBadgeProps {
  status: ProgressStatus;
  small?: boolean;
}

function StatusBadge({ status, small = false }: StatusBadgeProps) {
  const statusConfig = {
    not_started: { color: 'gray', label: 'Not Started' },
    in_progress: { color: 'blue', label: 'In Progress' },
    completed: { color: 'green', label: 'Completed' },
    mastered: { color: 'purple', label: 'Mastered' }
  };
  
  const config = statusConfig[status];
  const sizeClass = small ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1';
  
  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClass}
        ${config.color === 'gray' ? 'bg-gray-100 text-gray-700' : ''}
        ${config.color === 'blue' ? 'bg-blue-100 text-blue-700' : ''}
        ${config.color === 'green' ? 'bg-green-100 text-green-700' : ''}
        ${config.color === 'purple' ? 'bg-purple-100 text-purple-700' : ''}
      `}
    >
      {config.label}
    </span>
  );
}

// ===== HELPER FUNCTIONS =====

/**
 * Build navigation tree from units and lessons
 */
function buildNavigationTree(units: Unit[], userProgress?: UserProgress): NavigationNode[] {
  return units.map(unit => {
    const unitNode: NavigationNode = {
      id: unit.id,
      type: 'unit',
      title: unit.title,
      description: unit.description,
      path: `/units/${unit.id}`,
      orderIndex: unit.orderIndex,
      status: getUnitStatus(unit, userProgress),
      isLocked: !arePrerequisitesMet(unit.prerequisiteUnits || [], userProgress),
      prerequisites: unit.prerequisiteUnits,
      prerequisitesMet: arePrerequisitesMet(unit.prerequisiteUnits || [], userProgress),
      completionPercentage: calculateUnitCompletion(unit, userProgress),
      children: unit.lessons.map(lesson => ({
        id: lesson.id,
        type: 'lesson',
        title: lesson.title,
        description: lesson.description,
        path: `/lessons/${lesson.id}`,
        orderIndex: lesson.orderIndex,
        status: getLessonStatus(lesson.id, userProgress),
        isLocked: !arePrerequisitesMet(lesson.prerequisiteLessons || [], userProgress),
        prerequisites: lesson.prerequisiteLessons,
        prerequisitesMet: arePrerequisitesMet(lesson.prerequisiteLessons || [], userProgress),
        estimatedMinutes: lesson.estimatedMinutes,
        difficulty: lesson.difficulty,
        completionPercentage: userProgress?.lessonProgress[lesson.id]?.completionPercentage || 0
      }))
    };
    
    // Set parent references
    unitNode.children?.forEach(child => {
      child.parent = unitNode;
    });
    
    return unitNode;
  });
}

/**
 * Find node by ID in navigation tree
 */
function findNodeById(nodes: NavigationNode[], nodeId: string): NavigationNode | undefined {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }
    if (node.children) {
      const found = findNodeById(node.children, nodeId);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * Build breadcrumb trail for a node
 */
function buildBreadcrumbs(node: NavigationNode): NavigationNode[] {
  const breadcrumbs: NavigationNode[] = [];
  let current: NavigationNode | undefined = node;
  
  while (current) {
    breadcrumbs.unshift(current);
    current = current.parent;
  }
  
  return breadcrumbs;
}

/**
 * Get all lessons from navigation tree
 */
function getAllLessons(nodes: NavigationNode[]): NavigationNode[] {
  const lessons: NavigationNode[] = [];
  
  for (const node of nodes) {
    if (node.type === 'lesson') {
      lessons.push(node);
    }
    if (node.children) {
      lessons.push(...getAllLessons(node.children));
    }
  }
  
  return lessons;
}

/**
 * Check if prerequisites are met
 */
function arePrerequisitesMet(prerequisites: string[], userProgress?: UserProgress): boolean {
  if (!prerequisites || prerequisites.length === 0) return true;
  if (!userProgress) return false;
  
  return prerequisites.every(prereq => 
    userProgress.completedLessons.includes(prereq) || 
    userProgress.completedUnits.includes(prereq)
  );
}

/**
 * Get unit completion status
 */
function getUnitStatus(unit: Unit, userProgress?: UserProgress): ProgressStatus {
  if (!userProgress) return 'not_started';
  
  if (userProgress.completedUnits.includes(unit.id)) {
    return 'completed';
  }
  
  const lessonIds = unit.lessons.map(l => l.id);
  const completedInUnit = lessonIds.filter(id => 
    userProgress.completedLessons.includes(id)
  );
  
  if (completedInUnit.length === 0) return 'not_started';
  if (completedInUnit.length < lessonIds.length) return 'in_progress';
  
  // Check mastery threshold
  const avgCompletion = calculateUnitCompletion(unit, userProgress);
  if (avgCompletion >= unit.masteryThreshold * 100) {
    return 'mastered';
  }
  
  return 'completed';
}

/**
 * Get lesson completion status
 */
function getLessonStatus(lessonId: string, userProgress?: UserProgress): ProgressStatus {
  if (!userProgress) return 'not_started';
  
  if (userProgress.lessonProgress[lessonId]) {
    return userProgress.lessonProgress[lessonId].status;
  }
  
  if (userProgress.completedLessons.includes(lessonId)) {
    return 'completed';
  }
  
  if (userProgress.currentLesson === lessonId) {
    return 'in_progress';
  }
  
  return 'not_started';
}

/**
 * Calculate unit completion percentage
 */
function calculateUnitCompletion(unit: Unit, userProgress?: UserProgress): number {
  if (!userProgress) return 0;
  
  const lessonIds = unit.lessons.map(l => l.id);
  if (lessonIds.length === 0) return 0;
  
  const totalCompletion = lessonIds.reduce((sum, id) => {
    const progress = userProgress.lessonProgress[id];
    return sum + (progress?.completionPercentage || 0);
  }, 0);
  
  return totalCompletion / lessonIds.length;
}

// Default export
export default ContentNavigation;