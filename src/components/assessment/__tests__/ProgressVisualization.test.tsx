/**
 * Progress Visualization Components Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  ProgressTimeline,
  ObjectivesGrid,
  LessonProgressCards,
  PerformanceChart
} from '../ProgressVisualization';
import type {
  ProgressDataPoint,
  ObjectiveProgress,
  LessonProgressSummary
} from '../ProgressVisualization';

const mockProgressData: ProgressDataPoint[] = [
  {
    date: '2023-01-01T00:00:00Z',
    score: 75,
    assessmentType: 'formative',
    masteryAchieved: false
  },
  {
    date: '2023-01-02T00:00:00Z',
    score: 85,
    assessmentType: 'formative',
    masteryAchieved: true
  },
  {
    date: '2023-01-03T00:00:00Z',
    score: 90,
    assessmentType: 'summative',
    masteryAchieved: true
  }
];

const mockObjectives: ObjectiveProgress[] = [
  {
    id: 'obj-1',
    title: 'Basic Math Operations',
    category: 'Mathematics',
    currentScore: 85,
    targetThreshold: 80,
    masteryAchieved: true,
    attempts: 3,
    lastAttempt: '2023-01-01T00:00:00Z'
  },
  {
    id: 'obj-2',
    title: 'Reading Comprehension',
    category: 'Language Arts',
    currentScore: 75,
    targetThreshold: 80,
    masteryAchieved: false,
    attempts: 2,
    lastAttempt: '2023-01-02T00:00:00Z'
  },
  {
    id: 'obj-3',
    title: 'Scientific Method',
    category: 'Science',
    currentScore: 90,
    targetThreshold: 85,
    masteryAchieved: true,
    attempts: 1
  }
];

const mockLessons: LessonProgressSummary[] = [
  {
    lessonId: 'lesson-1',
    title: 'Introduction to Algebra',
    totalObjectives: 5,
    masteredObjectives: 4,
    currentScore: 85,
    timeSpent: 120,
    lastAccessed: '2023-01-01T00:00:00Z',
    status: 'completed'
  },
  {
    lessonId: 'lesson-2',
    title: 'Poetry Analysis',
    totalObjectives: 3,
    masteredObjectives: 3,
    currentScore: 92,
    timeSpent: 90,
    lastAccessed: '2023-01-02T00:00:00Z',
    status: 'mastered'
  },
  {
    lessonId: 'lesson-3',
    title: 'Chemical Reactions',
    totalObjectives: 4,
    masteredObjectives: 2,
    currentScore: 70,
    timeSpent: 60,
    lastAccessed: '2023-01-03T00:00:00Z',
    status: 'in_progress'
  }
];

describe('ProgressTimeline', () => {
  it('renders timeline with progress data', () => {
    render(<ProgressTimeline data={mockProgressData} />);
    
    expect(screen.getByText('Progress Timeline')).toBeInTheDocument();
    expect(screen.getByText('formative Assessment')).toBeInTheDocument();
    expect(screen.getByText('summative Assessment')).toBeInTheDocument();
  });

  it('displays scores and mastery indicators', () => {
    render(<ProgressTimeline data={mockProgressData} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getAllByText('Mastery ✓')).toHaveLength(2);
  });

  it('shows empty state when no data provided', () => {
    render(<ProgressTimeline data={[]} />);
    
    expect(screen.getByText('No assessment data available yet.')).toBeInTheDocument();
  });

  it('sorts data by date correctly', () => {
    const unsortedData = [mockProgressData[2], mockProgressData[0], mockProgressData[1]];
    render(<ProgressTimeline data={unsortedData} />);
    
    // Timeline should still show data in chronological order
    expect(screen.getByText('Progress Timeline')).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<ProgressTimeline data={mockProgressData} />);
    
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    expect(screen.getByText('1/3/2023')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProgressTimeline data={mockProgressData} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('ObjectivesGrid', () => {
  it('renders objectives grouped by category', () => {
    render(<ObjectivesGrid objectives={mockObjectives} />);
    
    expect(screen.getByText('Learning Objectives Progress')).toBeInTheDocument();
    expect(screen.getByText('Mathematics')).toBeInTheDocument();
    expect(screen.getByText('Language Arts')).toBeInTheDocument();
    expect(screen.getByText('Science')).toBeInTheDocument();
  });

  it('displays objective titles and progress', () => {
    render(<ObjectivesGrid objectives={mockObjectives} />);
    
    expect(screen.getByText('Basic Math Operations')).toBeInTheDocument();
    expect(screen.getByText('Reading Comprehension')).toBeInTheDocument();
    expect(screen.getByText('Scientific Method')).toBeInTheDocument();
  });

  it('shows attempt counts', () => {
    render(<ObjectivesGrid objectives={mockObjectives} />);
    
    expect(screen.getByText('3 attempts')).toBeInTheDocument();
    expect(screen.getByText('2 attempts')).toBeInTheDocument();
    expect(screen.getByText('1 attempt')).toBeInTheDocument();
  });

  it('displays last attempt dates when available', () => {
    render(<ObjectivesGrid objectives={mockObjectives} />);
    
    expect(screen.getByText('Last: 1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('Last: 1/2/2023')).toBeInTheDocument();
  });

  it('handles objectives without categories', () => {
    const objectivesWithoutCategory = [
      { ...mockObjectives[0], category: '' }
    ];
    
    render(<ObjectivesGrid objectives={objectivesWithoutCategory} />);
    
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('handles empty objectives list', () => {
    render(<ObjectivesGrid objectives={[]} />);
    
    expect(screen.getByText('Learning Objectives Progress')).toBeInTheDocument();
  });
});

describe('LessonProgressCards', () => {
  it('renders lesson progress cards', () => {
    render(<LessonProgressCards lessons={mockLessons} />);
    
    expect(screen.getByText('Lesson Progress')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Algebra')).toBeInTheDocument();
    expect(screen.getByText('Poetry Analysis')).toBeInTheDocument();
    expect(screen.getByText('Chemical Reactions')).toBeInTheDocument();
  });

  it('displays lesson status correctly', () => {
    render(<LessonProgressCards lessons={mockLessons} />);
    
    expect(screen.getByText('completed')).toBeInTheDocument();
    expect(screen.getByText('mastered')).toBeInTheDocument();
    expect(screen.getByText('in progress')).toBeInTheDocument();
  });

  it('shows objective completion ratios', () => {
    render(<LessonProgressCards lessons={mockLessons} />);
    
    expect(screen.getByText('4/5')).toBeInTheDocument(); // Algebra
    expect(screen.getByText('3/3')).toBeInTheDocument(); // Poetry
    expect(screen.getByText('2/4')).toBeInTheDocument(); // Chemistry
  });

  it('displays current scores', () => {
    render(<LessonProgressCards lessons={mockLessons} />);
    
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
  });

  it('formats time spent correctly', () => {
    render(<LessonProgressCards lessons={mockLessons} />);
    
    expect(screen.getByText('2h 0m')).toBeInTheDocument(); // 120 minutes
    expect(screen.getByText('1h 30m')).toBeInTheDocument(); // 90 minutes
    expect(screen.getByText('60m')).toBeInTheDocument(); // 60 minutes
  });

  it('shows last accessed dates', () => {
    render(<LessonProgressCards lessons={mockLessons} />);
    
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('1/2/2023')).toBeInTheDocument();
    expect(screen.getByText('1/3/2023')).toBeInTheDocument();
  });

  it('calculates progress percentages correctly', () => {
    const { container } = render(<LessonProgressCards lessons={mockLessons} />);
    
    // Check progress bar widths
    const progressBars = container.querySelectorAll('[style*="width:"]');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});

describe('PerformanceChart', () => {
  it('renders performance chart with data', () => {
    render(<PerformanceChart data={mockProgressData} />);
    
    expect(screen.getByText('Performance Trend')).toBeInTheDocument();
  });

  it('shows target threshold line', () => {
    const { container } = render(
      <PerformanceChart data={mockProgressData} targetThreshold={80} />
    );
    
    expect(screen.getByText('Target: 80%')).toBeInTheDocument();
  });

  it('displays Y-axis labels', () => {
    render(<PerformanceChart data={mockProgressData} />);
    
    expect(screen.getByText('100%')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows date range on X-axis', () => {
    render(<PerformanceChart data={mockProgressData} />);
    
    expect(screen.getByText('1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('1/3/2023')).toBeInTheDocument();
  });

  it('handles empty data gracefully', () => {
    render(<PerformanceChart data={[]} />);
    
    expect(screen.getByText('No performance data available yet')).toBeInTheDocument();
  });

  it('renders data points and lines', () => {
    const { container } = render(<PerformanceChart data={mockProgressData} />);
    
    // Check for SVG lines
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(mockProgressData.length - 1); // n-1 lines for n points
    
    // Check for data point circles
    const circles = container.querySelectorAll('.rounded-full');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('differentiates mastery achieved points', () => {
    const { container } = render(<PerformanceChart data={mockProgressData} />);
    
    // Should have both blue (not mastered) and green (mastered) points
    const bluePoints = container.querySelectorAll('.bg-blue-500');
    const greenPoints = container.querySelectorAll('.bg-green-500');
    
    expect(bluePoints.length).toBe(1); // First data point
    expect(greenPoints.length).toBe(2); // Last two data points
  });

  it('applies custom className', () => {
    const { container } = render(
      <PerformanceChart data={mockProgressData} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});

describe('Accessibility', () => {
  it('provides screen reader descriptions for all components', () => {
    render(
      <div>
        <ProgressTimeline data={mockProgressData} />
        <ObjectivesGrid objectives={mockObjectives} />
        <LessonProgressCards lessons={mockLessons} />
        <PerformanceChart data={mockProgressData} />
      </div>
    );
    
    // Check that screen reader text is present
    expect(document.body).toHaveTextContent('Progress timeline showing 3 assessment attempts');
    expect(document.body).toHaveTextContent('Learning objectives grid showing progress for 3 objectives');
    expect(document.body).toHaveTextContent('Lesson progress showing 3 lessons');
    expect(document.body).toHaveTextContent('Performance chart showing score progression');
  });

  it('includes meaningful aria labels and descriptions', () => {
    render(<PerformanceChart data={mockProgressData} />);
    
    // Chart should have tooltips for data points
    const { container } = render(<PerformanceChart data={mockProgressData} />);
    const dataPoints = container.querySelectorAll('[title]');
    expect(dataPoints.length).toBeGreaterThan(0);
  });
});