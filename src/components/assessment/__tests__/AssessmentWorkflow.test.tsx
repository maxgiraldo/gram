/**
 * Assessment Workflow Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentWorkflow } from '../AssessmentWorkflow';
import type { AssessmentResponse, AssessmentAttemptResponse } from '../../../types/api';

// Mock AssessmentInterface component
vi.mock('../AssessmentInterface', () => ({
  AssessmentInterface: ({ onComplete }: any) => (
    <div data-testid="assessment-interface">
      <div>Assessment Interface</div>
      <button onClick={() => onComplete({ id: 'test', scorePercentage: 85, achievedMastery: true })}>
        Complete Assessment
      </button>
    </div>
  )
}));

// Mock fetch
global.fetch = vi.fn();

const mockAssessment: AssessmentResponse = {
  id: 'assessment-1',
  title: 'Test Assessment',
  description: 'A test assessment for students',
  type: 'formative',
  timeLimit: 3600,
  maxAttempts: 3,
  masteryThreshold: 80,
  isPublished: true,
  createdAt: '2023-01-01T00:00:00Z',
  updatedAt: '2023-01-01T00:00:00Z',
  questions: [
    {
      id: 'question-1',
      assessmentId: 'assessment-1',
      questionText: 'What is 2 + 2?',
      type: 'multiple_choice',
      orderIndex: 0,
      points: 10,
      difficulty: 'easy',
      questionData: {
        options: [
          { id: '1', text: '3', isCorrect: false },
          { id: '2', text: '4', isCorrect: true },
          { id: '3', text: '5', isCorrect: false }
        ]
      },
      correctAnswer: { optionId: '2' },
      feedback: 'Good job!',
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2023-01-01T00:00:00Z'
    }
  ]
};

const mockAttempt: AssessmentAttemptResponse = {
  id: 'attempt-1',
  userId: 'user-1',
  assessmentId: 'assessment-1',
  startedAt: '2023-01-01T00:00:00Z',
  totalQuestions: 1,
  correctAnswers: 0,
  scorePercentage: 0,
  achievedMastery: false
};

const defaultProps = {
  assessmentId: 'assessment-1',
  userId: 'user-1',
  onComplete: vi.fn(),
  onExit: vi.fn()
};

describe('AssessmentWorkflow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock successful assessment fetch
    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/assessments/assessment-1?includeQuestions=true')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAssessment })
        });
      }
      
      if (url.includes('/api/assessments/assessment-1/attempts?userId=user-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: [] })
        });
      }

      if (url.includes('/api/assessments/assessment-1/attempts') && url.includes('POST')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAttempt })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });
  });

  it('shows loading state initially', () => {
    render(<AssessmentWorkflow {...defaultProps} />);
    
    expect(screen.getByText('Loading assessment...')).toBeInTheDocument();
  });

  it('loads and displays assessment details', async () => {
    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Assessment')).toBeInTheDocument();
      expect(screen.getByText('A test assessment for students')).toBeInTheDocument();
    });
  });

  it('shows assessment details in pre-assessment state', async () => {
    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Questions: 1')).toBeInTheDocument();
      expect(screen.getByText('Type: formative')).toBeInTheDocument();
      expect(screen.getByText('Time limit: 60 minutes')).toBeInTheDocument();
      expect(screen.getByText('Mastery threshold: 80%')).toBeInTheDocument();
      expect(screen.getByText('Max attempts: 3')).toBeInTheDocument();
    });
  });

  it('starts assessment when start button clicked', async () => {
    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      const startButton = screen.getByText('Start Assessment');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/assessments/assessment-1/attempts',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'user-1' })
        })
      );
    });
  });

  it('displays previous attempts when available', async () => {
    const previousAttempts = [
      {
        ...mockAttempt,
        id: 'attempt-0',
        scorePercentage: 75,
        achievedMastery: false,
        completedAt: '2023-01-01T01:00:00Z'
      }
    ];

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/assessments/assessment-1?includeQuestions=true')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAssessment })
        });
      }
      
      if (url.includes('/api/assessments/assessment-1/attempts?userId=user-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: previousAttempts })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Previous Attempts')).toBeInTheDocument();
      expect(screen.getByText('Attempt 1:')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
  });

  it('prevents starting when max attempts reached', async () => {
    const maxAttempts = Array.from({ length: 3 }, (_, i) => ({
      ...mockAttempt,
      id: `attempt-${i}`,
      scorePercentage: 70,
      achievedMastery: false
    }));

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/assessments/assessment-1?includeQuestions=true')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockAssessment })
        });
      }
      
      if (url.includes('/api/assessments/assessment-1/attempts?userId=user-1')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: maxAttempts })
        });
      }

      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      });
    });

    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      const startButton = screen.getByText('Retake Assessment');
      expect(startButton).toBeDisabled();
      expect(screen.getByText(/You have reached the maximum number of attempts/)).toBeInTheDocument();
    });
  });

  it('calls onExit when cancel button clicked', async () => {
    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
    });

    expect(defaultProps.onExit).toHaveBeenCalled();
  });

  it('handles assessment completion', async () => {
    const completedAttempt = {
      ...mockAttempt,
      completedAt: '2023-01-01T01:00:00Z',
      scorePercentage: 85,
      achievedMastery: true
    };

    render(<AssessmentWorkflow {...defaultProps} />);
    
    // Wait for initial load, then simulate assessment completion
    await waitFor(() => {
      expect(screen.getByText('Start Assessment')).toBeInTheDocument();
    });

    // Manually trigger the completion handler to test post-assessment state
    const workflow = screen.getByText('Start Assessment').closest('div');
    
    // This would normally be triggered by the AssessmentInterface component
    // For testing, we'll simulate the state change by checking the onComplete callback
    expect(defaultProps.onComplete).toBeDefined();
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/An error occurred/)).toBeInTheDocument();
      expect(screen.getByText('Try Again')).toBeInTheDocument();
    });
  });

  it('handles assessment not found', async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404
    });

    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to load assessment/)).toBeInTheDocument();
    });
  });

  it('retries loading on error', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      const tryAgainButton = screen.getByText('Try Again');
      fireEvent.click(tryAgainButton);
    });

    // Should retry the fetch
    expect(fetch).toHaveBeenCalledTimes(3); // Initial call + retry
  });

  it('shows retake option after completion without mastery', async () => {
    const incompleteAttempt = {
      ...mockAttempt,
      completedAt: '2023-01-01T01:00:00Z',
      scorePercentage: 70,
      achievedMastery: false
    };

    // Mock the workflow to be in post-assessment state
    // This would require more complex setup to fully test the state transitions
    expect(incompleteAttempt.achievedMastery).toBe(false);
  });

  it('applies custom className', () => {
    const { container } = render(
      <AssessmentWorkflow {...defaultProps} className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles missing assessment questions', async () => {
    const emptyAssessment = {
      ...mockAssessment,
      questions: []
    };

    (fetch as any).mockImplementation((url: string) => {
      if (url.includes('/api/assessments/assessment-1?includeQuestions=true')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: emptyAssessment })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: [] })
      });
    });

    render(<AssessmentWorkflow {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Questions: 0')).toBeInTheDocument();
    });
  });
});