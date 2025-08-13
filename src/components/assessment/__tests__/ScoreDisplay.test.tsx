/**
 * Score Display Component Tests
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScoreDisplay } from '../ScoreDisplay';
import type { AssessmentAttemptResponse } from '../../../types/api';

const mockAttempt: AssessmentAttemptResponse = {
  id: 'attempt-1',
  userId: 'user-1',
  assessmentId: 'assessment-1',
  startedAt: '2023-01-01T00:00:00Z',
  completedAt: '2023-01-01T01:00:00Z',
  timeSpent: 3600, // 1 hour in seconds
  totalQuestions: 10,
  correctAnswers: 8,
  scorePercentage: 80,
  achievedMastery: true,
  assessment: {
    id: 'assessment-1',
    title: 'Test Assessment',
    type: 'formative',
    masteryThreshold: 75,
    maxAttempts: 3,
    isPublished: true
  }
};

describe('ScoreDisplay', () => {
  it('renders main score percentage', () => {
    render(<ScoreDisplay attempt={mockAttempt} />);
    
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('shows points breakdown', () => {
    render(<ScoreDisplay attempt={mockAttempt} />);
    
    expect(screen.getByText(/80 out of 100 points/)).toBeInTheDocument();
  });

  it('displays mastery achievement status', () => {
    render(<ScoreDisplay attempt={mockAttempt} />);
    
    expect(screen.getByText('Mastery Achieved!')).toBeInTheDocument();
  });

  it('shows detailed breakdown when enabled', () => {
    render(<ScoreDisplay attempt={mockAttempt} showDetailedBreakdown={true} />);
    
    expect(screen.getByText('8')).toBeInTheDocument(); // Correct answers
    expect(screen.getByText('2')).toBeInTheDocument(); // Incorrect answers
    expect(screen.getByText('80.0%')).toBeInTheDocument(); // Accuracy
  });

  it('displays time metrics when enabled', () => {
    render(<ScoreDisplay attempt={mockAttempt} showTimeMetrics={true} />);
    
    expect(screen.getByText('Time Performance')).toBeInTheDocument();
    expect(screen.getByText('1h 0m 0s')).toBeInTheDocument(); // Total time
    expect(screen.getByText('6m 0s')).toBeInTheDocument(); // Avg per question
  });

  it('shows appropriate color for high score', () => {
    render(<ScoreDisplay attempt={mockAttempt} />);
    
    const scoreElement = screen.getByText('80%');
    expect(scoreElement).toHaveClass('text-blue-600');
  });

  it('shows appropriate color for excellent score', () => {
    const excellentAttempt = { ...mockAttempt, scorePercentage: 95 };
    render(<ScoreDisplay attempt={excellentAttempt} />);
    
    const scoreElement = screen.getByText('95%');
    expect(scoreElement).toHaveClass('text-green-600');
  });

  it('shows appropriate color for low score', () => {
    const lowScoreAttempt = { ...mockAttempt, scorePercentage: 45, achievedMastery: false };
    render(<ScoreDisplay attempt={lowScoreAttempt} />);
    
    const scoreElement = screen.getByText('45%');
    expect(scoreElement).toHaveClass('text-red-600');
  });

  it('handles mastery not achieved', () => {
    const noMasteryAttempt = { 
      ...mockAttempt, 
      scorePercentage: 60, 
      achievedMastery: false 
    };
    render(<ScoreDisplay attempt={noMasteryAttempt} />);
    
    expect(screen.getByText('Mastery Not Yet Achieved')).toBeInTheDocument();
  });

  it('shows correct performance message for mastery achieved', () => {
    render(<ScoreDisplay attempt={mockAttempt} />);
    
    expect(screen.getByText(/Excellent work! You have demonstrated mastery/)).toBeInTheDocument();
  });

  it('shows encouraging message for near mastery', () => {
    const nearMasteryAttempt = { 
      ...mockAttempt, 
      scorePercentage: 78, 
      achievedMastery: false 
    };
    render(<ScoreDisplay attempt={nearMasteryAttempt} />);
    
    expect(screen.getByText(/Great job! You're very close to mastery/)).toBeInTheDocument();
  });

  it('shows helpful message for low scores', () => {
    const lowScoreAttempt = { 
      ...mockAttempt, 
      scorePercentage: 40, 
      achievedMastery: false 
    };
    render(<ScoreDisplay attempt={lowScoreAttempt} />);
    
    expect(screen.getByText(/Keep practicing!/)).toBeInTheDocument();
  });

  it('handles missing time data gracefully', () => {
    const noTimeAttempt = { ...mockAttempt, timeSpent: undefined };
    render(<ScoreDisplay attempt={noTimeAttempt} showTimeMetrics={true} />);
    
    expect(screen.queryByText('Time Performance')).not.toBeInTheDocument();
  });

  it('calculates time efficiency correctly', () => {
    // Fast completion (15 seconds per question)
    const fastAttempt = { ...mockAttempt, timeSpent: 150 };
    render(<ScoreDisplay attempt={fastAttempt} showTimeMetrics={true} />);
    
    expect(screen.getByText('Quick')).toBeInTheDocument();
  });

  it('handles zero questions gracefully', () => {
    const zeroQuestionsAttempt = { 
      ...mockAttempt, 
      totalQuestions: 0, 
      correctAnswers: 0 
    };
    render(<ScoreDisplay attempt={zeroQuestionsAttempt} />);
    
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  it('shows mastery threshold information', () => {
    render(<ScoreDisplay attempt={mockAttempt} showMasteryStatus={true} />);
    
    // Mastery threshold should be shown in screen reader text
    expect(document.body).toHaveTextContent('75%'); // threshold from mock data
  });

  it('hides sections when props are false', () => {
    render(
      <ScoreDisplay 
        attempt={mockAttempt} 
        showDetailedBreakdown={false}
        showTimeMetrics={false}
        showMasteryStatus={false}
      />
    );
    
    expect(screen.queryByText('Time Performance')).not.toBeInTheDocument();
    expect(screen.queryByText('Mastery Achieved!')).not.toBeInTheDocument();
    expect(screen.queryByText('Correct')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <ScoreDisplay attempt={mockAttempt} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});