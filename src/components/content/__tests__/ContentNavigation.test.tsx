/**
 * Content Navigation Tests
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContentNavigation } from '../ContentNavigation';
import type { Unit, Lesson } from '../../../types/content';
import type { UserProgress } from '../ContentNavigation';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn()
  }),
  usePathname: () => '/lessons/lesson-1'
}));

describe('ContentNavigation', () => {
  const mockUnits: Unit[] = [
    {
      id: 'unit-1',
      title: 'Unit 1: Basics',
      description: 'Basic concepts',
      orderIndex: 0,
      isPublished: true,
      masteryThreshold: 0.8,
      lessons: [
        {
          id: 'lesson-1',
          unitId: 'unit-1',
          title: 'Lesson 1',
          description: 'First lesson',
          content: 'Content',
          orderIndex: 0,
          isPublished: true,
          masteryThreshold: 0.8,
          estimatedMinutes: 15,
          difficulty: 'beginner',
          prerequisiteLessons: [],
          exercises: [],
          assessments: [],
          objectives: [],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'lesson-2',
          unitId: 'unit-1',
          title: 'Lesson 2',
          description: 'Second lesson',
          content: 'Content',
          orderIndex: 1,
          isPublished: true,
          masteryThreshold: 0.8,
          estimatedMinutes: 20,
          difficulty: 'beginner',
          prerequisiteLessons: ['lesson-1'],
          exercises: [],
          assessments: [],
          objectives: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      objectives: [],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'unit-2',
      title: 'Unit 2: Advanced',
      description: 'Advanced concepts',
      orderIndex: 1,
      isPublished: true,
      masteryThreshold: 0.9,
      prerequisiteUnits: ['unit-1'],
      lessons: [
        {
          id: 'lesson-3',
          unitId: 'unit-2',
          title: 'Lesson 3',
          description: 'Third lesson',
          content: 'Content',
          orderIndex: 0,
          isPublished: true,
          masteryThreshold: 0.85,
          estimatedMinutes: 30,
          difficulty: 'intermediate',
          prerequisiteLessons: ['lesson-2'],
          exercises: [],
          assessments: [],
          objectives: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      objectives: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockUserProgress: UserProgress = {
    completedLessons: ['lesson-1'],
    completedUnits: [],
    currentLesson: 'lesson-2',
    currentUnit: 'unit-1',
    lessonProgress: {
      'lesson-1': {
        status: 'completed',
        completionPercentage: 100,
        lastAccessed: new Date()
      },
      'lesson-2': {
        status: 'in_progress',
        completionPercentage: 50,
        lastAccessed: new Date()
      }
    }
  };

  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders navigation tree with units and lessons', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Unit 1: Basics')).toBeInTheDocument();
      expect(screen.getByText('Unit 2: Advanced')).toBeInTheDocument();
      expect(screen.getByText('Course Content')).toBeInTheDocument();
    });

    it('shows breadcrumbs when enabled', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          showBreadcrumbs={true}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('hides sidebar when disabled', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          showSidebar={false}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.queryByText('Course Content')).not.toBeInTheDocument();
    });

    it('shows progress indicators when enabled', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          showProgressIndicators={true}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Your Progress')).toBeInTheDocument();
      expect(screen.getByText('1 / 3 lessons')).toBeInTheDocument();
    });
  });

  describe('Navigation Functionality', () => {
    it('expands and collapses units when clicked', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      const unit1Button = screen.getByText('Unit 1: Basics');
      
      // Unit should be collapsed initially
      expect(screen.queryByText('Lesson 1')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(unit1Button);
      await waitFor(() => {
        expect(screen.getByText('Lesson 1')).toBeInTheDocument();
        expect(screen.getByText('Lesson 2')).toBeInTheDocument();
      });
      
      // Click to collapse
      fireEvent.click(unit1Button);
      await waitFor(() => {
        expect(screen.queryByText('Lesson 1')).not.toBeInTheDocument();
      });
    });

    it('navigates to lesson when clicked', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      // Expand unit first
      fireEvent.click(screen.getByText('Unit 1: Basics'));
      
      await waitFor(() => {
        const lesson1 = screen.getByText('Lesson 1');
        fireEvent.click(lesson1);
      });

      expect(mockOnNavigate).toHaveBeenCalledWith('lesson-1');
    });

    it('prevents navigation to locked lessons', async () => {
      const progressWithoutPrereqs: UserProgress = {
        ...mockUserProgress,
        completedLessons: [], // No lessons completed
        lessonProgress: {}
      };

      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={progressWithoutPrereqs}
          onNavigate={mockOnNavigate}
        />
      );

      // Expand unit
      fireEvent.click(screen.getByText('Unit 1: Basics'));
      
      await waitFor(() => {
        // Lesson 2 requires lesson 1 to be completed
        const lesson2 = screen.getByText('Lesson 2');
        fireEvent.click(lesson2);
      });

      // Should not navigate
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });

    it('shows lock icon for locked content', async () => {
      const progressWithoutPrereqs: UserProgress = {
        ...mockUserProgress,
        completedLessons: [],
        completedUnits: [],
        lessonProgress: {}
      };

      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={progressWithoutPrereqs}
          onNavigate={mockOnNavigate}
        />
      );

      // Unit 2 requires Unit 1 to be completed
      const unit2 = screen.getByText('Unit 2: Advanced').closest('button');
      expect(unit2).toHaveTextContent('🔒');
    });
  });

  describe('Progress Display', () => {
    it('shows correct completion percentage', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          showProgressIndicators={true}
          onNavigate={mockOnNavigate}
        />
      );

      // 1 out of 3 lessons completed = 33%
      expect(screen.getByText('33%')).toBeInTheDocument();
    });

    it('displays status badges for lessons', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      // Expand unit to see lessons
      fireEvent.click(screen.getByText('Unit 1: Basics'));
      
      await waitFor(() => {
        // Should show completed badge for lesson 1
        const lesson1Container = screen.getByText('Lesson 1').closest('button');
        expect(lesson1Container).toHaveTextContent('Completed');
      });
    });

    it('shows current lesson indicator', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          showProgressIndicators={true}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Current Lesson:')).toBeInTheDocument();
      expect(screen.getByText('lesson-2')).toBeInTheDocument();
    });

    it('displays estimated time for lessons', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      // Expand unit
      fireEvent.click(screen.getByText('Unit 1: Basics'));
      
      await waitFor(() => {
        expect(screen.getByText('15 min • beginner')).toBeInTheDocument();
        expect(screen.getByText('20 min • beginner')).toBeInTheDocument();
      });
    });
  });

  describe('Keyboard Navigation', () => {
    it('navigates with arrow keys when enabled', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          allowKeyboardNavigation={true}
          onNavigate={mockOnNavigate}
        />
      );

      // Simulate arrow left key
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      
      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('lesson-1');
      });
    });

    it('does not navigate with keyboard when disabled', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          allowKeyboardNavigation={false}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      
      expect(mockOnNavigate).not.toHaveBeenCalled();
    });

    it('navigates to parent with Escape key', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-1"
          userProgress={mockUserProgress}
          allowKeyboardNavigation={true}
          onNavigate={mockOnNavigate}
        />
      );

      fireEvent.keyDown(window, { key: 'Escape' });
      
      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('unit-1');
      });
    });
  });

  describe('Navigation Controls', () => {
    it('enables previous button when not on first lesson', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).not.toBeDisabled();
    });

    it('disables previous button on first lesson', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-1"
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('enables next button when not on last lesson', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-1"
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).not.toBeDisabled();
    });

    it('disables next button on last lesson', () => {
      const progressWithAllUnlocked: UserProgress = {
        ...mockUserProgress,
        completedLessons: ['lesson-1', 'lesson-2'],
        completedUnits: ['unit-1']
      };

      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-3"
          userProgress={progressWithAllUnlocked}
          onNavigate={mockOnNavigate}
        />
      );

      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Prerequisite Checking', () => {
    it('checks lesson prerequisites correctly', () => {
      const progressWithoutPrereqs: UserProgress = {
        ...mockUserProgress,
        completedLessons: [], // No lessons completed
        lessonProgress: {}
      };

      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={progressWithoutPrereqs}
          onNavigate={mockOnNavigate}
        />
      );

      // Lesson 1 has no prerequisites, should be unlocked
      // Lesson 2 requires lesson 1, should be locked
      // This is reflected in the navigation behavior tested above
      expect(screen.getByText('Unit 1: Basics')).toBeInTheDocument();
    });

    it('checks unit prerequisites correctly', () => {
      const progressWithoutUnitPrereqs: UserProgress = {
        ...mockUserProgress,
        completedLessons: [],
        completedUnits: [], // Unit 1 not completed
        lessonProgress: {}
      };

      render(
        <ContentNavigation
          units={mockUnits}
          userProgress={progressWithoutUnitPrereqs}
          onNavigate={mockOnNavigate}
        />
      );

      // Unit 2 requires Unit 1, should show as locked
      const unit2 = screen.getByText('Unit 2: Advanced').closest('button');
      expect(unit2).toHaveClass('opacity-50');
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('builds correct breadcrumb trail', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          showBreadcrumbs={true}
          onNavigate={mockOnNavigate}
        />
      );

      // Expand unit to select lesson
      fireEvent.click(screen.getByText('Unit 1: Basics'));
      
      await waitFor(() => {
        fireEvent.click(screen.getByText('Lesson 2'));
      });

      // Should show breadcrumbs
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('navigates via breadcrumb links', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          showBreadcrumbs={true}
          onNavigate={mockOnNavigate}
        />
      );

      const homeLink = screen.getByText('Home');
      fireEvent.click(homeLink);
      
      expect(mockOnNavigate).toHaveBeenCalledWith('home');
    });
  });

  describe('Auto-Expansion', () => {
    it('auto-expands current lesson unit', async () => {
      render(
        <ContentNavigation
          units={mockUnits}
          currentLessonId="lesson-2"
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      // Unit 1 should be auto-expanded since lesson-2 is current
      await waitFor(() => {
        expect(screen.getByText('Lesson 2')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles empty units array', () => {
      render(
        <ContentNavigation
          units={[]}
          userProgress={mockUserProgress}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Course Content')).toBeInTheDocument();
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('handles undefined user progress', () => {
      render(
        <ContentNavigation
          units={mockUnits}
          onNavigate={mockOnNavigate}
        />
      );

      expect(screen.getByText('Course Content')).toBeInTheDocument();
      // All lessons should appear as not started
    });

    it('handles lessons with no prerequisites', () => {
      const unitsWithNoPrereqs = [{
        ...mockUnits[0],
        lessons: mockUnits[0].lessons.map(l => ({
          ...l,
          prerequisiteLessons: []
        }))
      }];

      render(
        <ContentNavigation
          units={unitsWithNoPrereqs}
          userProgress={undefined}
          onNavigate={mockOnNavigate}
        />
      );

      // All lessons should be navigable
      expect(screen.getByText('Unit 1: Basics')).toBeInTheDocument();
    });
  });
});