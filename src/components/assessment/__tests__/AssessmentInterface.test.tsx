/**
 * Assessment Interface Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AssessmentInterface } from '../AssessmentInterface';
import type { AssessmentResponse, AssessmentAttemptResponse } from '../../../types/api';

// Mock exercise components
vi.mock('../../exercises', () => ({
  MultipleChoice: ({ onAnswer }: any) => (
    <div data-testid="multiple-choice">
      <div>What is 2 + 2?</div>
      <button onClick={() => onAnswer({ response: '4', isCorrect: true, points: 10, timeSpent: 1000, hintsUsed: 0 })}>4</button>
      <div>3</div>
      <div>5</div>
    </div>
  ),
  FillInTheBlank: ({ onAnswer }: any) => (
    <div data-testid="fill-in-blank">
      <button onClick={() => onAnswer({ response: 'test', isCorrect: true, points: 10, timeSpent: 1000, hintsUsed: 0 })}>Submit</button>
    </div>
  ),
  DragAndDrop: ({ onAnswer }: any) => (
    <div data-testid="drag-and-drop">
      <button onClick={() => onAnswer({ response: {}, isCorrect: true, points: 10, timeSpent: 1000, hintsUsed: 0 })}>Submit</button>
    </div>
  ),
  SentenceBuilder: ({ onAnswer }: any) => (
    <div data-testid="sentence-builder">
      <button onClick={() => onAnswer({ response: [], isCorrect: true, points: 10, timeSpent: 1000, hintsUsed: 0 })}>Submit</button>
    </div>
  ),
  isMultipleChoiceQuestion: () => true,
  isFillInBlankQuestion: () => false,
  isDragAndDropQuestion: () => false,
  isSentenceBuilderQuestion: () => false
}));

// Mock fetch
global.fetch = vi.fn();

const mockAssessment: AssessmentResponse = {
  id: 'assessment-1',
  title: 'Test Assessment',
  description: 'A test assessment',
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
  assessment: mockAssessment,
  attempt: mockAttempt,
  userId: 'user-1',
  onComplete: vi.fn(),
  onExit: vi.fn()
};

describe('AssessmentInterface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: {} })
    });
  });

  it('renders assessment title and description', () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    expect(screen.getByText('Test Assessment')).toBeInTheDocument();
    expect(screen.getByText('A test assessment')).toBeInTheDocument();
  });

  it('displays progress indicator', () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    expect(screen.getByText('Question 1 of 1')).toBeInTheDocument();
    expect(screen.getByText('0 answered')).toBeInTheDocument();
  });

  it('shows time remaining when time limit is set', () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    expect(screen.getByText('Time Remaining')).toBeInTheDocument();
    expect(screen.getByText(/\d+:\d+/)).toBeInTheDocument(); // Time format
  });

  it('renders current question', () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('disables previous button on first question', () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('shows next button when question is answered', async () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    // Answer the question
    const option = screen.getByText('4');
    fireEvent.click(option);

    await waitFor(() => {
      const nextButton = screen.getByText('Submit Assessment');
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('calls onAnswer when question is answered', async () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    const option = screen.getByText('4');
    fireEvent.click(option);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/assessments/attempts/attempt-1/responses',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });
  });

  it('submits assessment when all questions answered', async () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    // Answer the question
    const option = screen.getByText('4');
    fireEvent.click(option);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit Assessment');
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/assessments/attempts/attempt-1',
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });
  });

  it('calls onExit when exit button clicked', () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    const exitButton = screen.getByText('Exit Assessment');
    fireEvent.click(exitButton);

    expect(defaultProps.onExit).toHaveBeenCalled();
  });

  it('handles multiple questions navigation', () => {
    const multiQuestionAssessment = {
      ...mockAssessment,
      questions: [
        ...mockAssessment.questions!,
        {
          id: 'question-2',
          assessmentId: 'assessment-1',
          questionText: 'What is 3 + 3?',
          type: 'multiple_choice' as const,
          orderIndex: 1,
          points: 10,
          difficulty: 'easy' as const,
          questionData: {
            options: [
              { id: '1', text: '5', isCorrect: false },
              { id: '2', text: '6', isCorrect: true },
              { id: '3', text: '7', isCorrect: false }
            ]
          },
          correctAnswer: { optionId: '2' },
          feedback: 'Excellent!',
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z'
        }
      ]
    };

    render(<AssessmentInterface {...defaultProps} assessment={multiQuestionAssessment} />);
    
    expect(screen.getByText('Question 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('shows error for unsupported question type', () => {
    const unsupportedQuestionAssessment = {
      ...mockAssessment,
      questions: [{
        ...mockAssessment.questions![0],
        type: 'essay' as any
      }]
    };

    render(<AssessmentInterface {...defaultProps} assessment={unsupportedQuestionAssessment} />);
    
    expect(screen.getByText(/Unsupported question type: essay/)).toBeInTheDocument();
  });

  it('handles empty questions array', () => {
    const emptyAssessment = {
      ...mockAssessment,
      questions: []
    };

    render(<AssessmentInterface {...defaultProps} assessment={emptyAssessment} />);
    
    expect(screen.getByText('No questions available for this assessment.')).toBeInTheDocument();
  });

  it('shows loading state when submitting', async () => {
    render(<AssessmentInterface {...defaultProps} />);
    
    // Answer the question
    const option = screen.getByText('4');
    fireEvent.click(option);

    await waitFor(() => {
      const submitButton = screen.getByText('Submit Assessment');
      fireEvent.click(submitButton);
    });

    expect(screen.getByText('Submitting...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (fetch as any).mockRejectedValueOnce(new Error('API Error'));

    render(<AssessmentInterface {...defaultProps} />);
    
    const option = screen.getByText('4');
    fireEvent.click(option);

    await waitFor(() => {
      // Should continue to work despite API error
      expect(screen.getByText('Submit Assessment')).toBeInTheDocument();
    });
  });
});