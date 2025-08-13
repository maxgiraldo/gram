/**
 * Assessment Interface Component
 * 
 * Main interface for taking assessments with integrated question display,
 * progress tracking, and navigation.
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, CardHeader, CardBody, LoadingSpinner } from '../ui';
import { 
  ScreenReaderText, 
  LiveAnnouncement, 
  ProgressAnnouncement,
  StatusMessage
} from '../ui/ScreenReaderComponents';
import {
  MultipleChoice,
  FillInTheBlank,
  DragAndDrop,
  SentenceBuilder
} from '../exercises';
import {
  isMultipleChoiceQuestion,
  isFillInBlankQuestion,
  isDragAndDropQuestion,
  isSentenceBuilderQuestion,
  type ExerciseAnswer,
  type TimerState,
  type ProgressState
} from '../exercises/types';
import {
  type AssessmentResponse,
  type AssessmentQuestionResponse,
  type AssessmentAttemptResponse,
  type CreateAssessmentResponseRequest
} from '../../types/api';

export interface AssessmentInterfaceProps {
  assessment: AssessmentResponse;
  attempt: AssessmentAttemptResponse;
  userId: string;
  onComplete: (attempt: AssessmentAttemptResponse) => void;
  onExit: () => void;
  className?: string;
}

interface QuestionState {
  questionId: string;
  response?: any;
  isAnswered: boolean;
  isCorrect?: boolean;
  points?: number;
  timeSpent: number;
  startTime: number;
}

export function AssessmentInterface({
  assessment,
  attempt,
  userId,
  onComplete,
  onExit,
  className = ''
}: AssessmentInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionStates, setQuestionStates] = useState<Record<string, QuestionState>>({});
  const [timer, setTimer] = useState<TimerState>({
    timeLimit: assessment.timeLimit || 0,
    timeRemaining: assessment.timeLimit || 0,
    isRunning: true,
    isExpired: false,
    startTime: Date.now()
  });
  const [progress, setProgress] = useState<ProgressState>({
    questionsAnswered: 0,
    totalQuestions: assessment.questions?.length || 0,
    correctAnswers: 0,
    currentScore: 0,
    timeSpent: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const questions = assessment.questions || [];
  const currentQuestion = questions[currentQuestionIndex];

  // Initialize question states
  useEffect(() => {
    const initialStates: Record<string, QuestionState> = {};
    questions.forEach(question => {
      initialStates[question.id] = {
        questionId: question.id,
        isAnswered: false,
        timeSpent: 0,
        startTime: Date.now()
      };
    });
    setQuestionStates(initialStates);
  }, [questions]);

  // Timer management
  useEffect(() => {
    if (!timer.isRunning || timer.timeLimit === 0) return;

    const interval = setInterval(() => {
      setTimer(prev => {
        const elapsed = Math.floor((Date.now() - prev.startTime) / 1000);
        const remaining = Math.max(0, prev.timeLimit - elapsed);
        
        if (remaining === 0 && !prev.isExpired) {
          handleTimeUp();
          return { ...prev, timeRemaining: 0, isExpired: true, isRunning: false };
        }
        
        return { ...prev, timeRemaining: remaining };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.timeLimit]);

  // Progress tracking
  useEffect(() => {
    const answered = Object.values(questionStates).filter(state => state.isAnswered).length;
    const correct = Object.values(questionStates).filter(state => state.isCorrect).length;
    const totalTimeSpent = Object.values(questionStates).reduce((sum, state) => sum + state.timeSpent, 0);
    const totalPoints = Object.values(questionStates).reduce((sum, state) => sum + (state.points || 0), 0);

    setProgress({
      questionsAnswered: answered,
      totalQuestions: questions.length,
      correctAnswers: correct,
      currentScore: totalPoints,
      timeSpent: totalTimeSpent
    });
  }, [questionStates, questions.length]);

  const announceToScreenReader = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    setTimeout(() => {
      setAnnouncements(prev => prev.slice(1));
    }, 1000);
  }, []);

  const handleAnswer = useCallback(async (answer: ExerciseAnswer) => {
    if (!currentQuestion) return;

    const questionState = questionStates[currentQuestion.id];
    const timeSpent = Date.now() - questionState.startTime;

    // Update question state
    const updatedState: QuestionState = {
      ...questionState,
      response: answer.response,
      isAnswered: true,
      isCorrect: answer.isCorrect,
      points: answer.points,
      timeSpent: timeSpent
    };

    setQuestionStates(prev => ({
      ...prev,
      [currentQuestion.id]: updatedState
    }));

    // Submit response to API
    try {
      const responseData: CreateAssessmentResponseRequest = {
        attemptId: attempt.id,
        questionId: currentQuestion.id,
        response: answer.response,
        isCorrect: answer.isCorrect,
        points: answer.points,
        timeSpent: timeSpent,
        confidence: answer.confidence
      };

      const response = await fetch(`/api/assessments/attempts/${attempt.id}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(responseData)
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      // Announce result to screen reader
      const resultMessage = answer.isCorrect 
        ? `Correct! You earned ${answer.points} points.`
        : `Incorrect. You earned ${answer.points} points.`;
      announceToScreenReader(resultMessage);

    } catch (error) {
      console.error('Error submitting response:', error);
      announceToScreenReader('Error submitting answer. Please try again.');
    }
  }, [currentQuestion, questionStates, attempt.id, announceToScreenReader]);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      
      // Start timer for next question
      setQuestionStates(prev => ({
        ...prev,
        [questions[nextIndex].id]: {
          ...prev[questions[nextIndex].id],
          startTime: Date.now()
        }
      }));

      announceToScreenReader(`Question ${nextIndex + 1} of ${questions.length}`);
    }
  }, [currentQuestionIndex, questions, announceToScreenReader]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      setCurrentQuestionIndex(prevIndex);
      announceToScreenReader(`Question ${prevIndex + 1} of ${questions.length}`);
    }
  }, [currentQuestionIndex, questions.length, announceToScreenReader]);

  const handleTimeUp = useCallback(() => {
    announceToScreenReader('Time is up! Submitting assessment automatically.');
    handleSubmitAssessment();
  }, [announceToScreenReader]);

  const handleSubmitAssessment = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Complete the attempt
      const response = await fetch(`/api/assessments/attempts/${attempt.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          completedAt: new Date().toISOString(),
          timeSpent: Math.floor((Date.now() - timer.startTime) / 1000)
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit assessment');
      }

      const completedAttempt = await response.json();
      announceToScreenReader('Assessment submitted successfully!');
      onComplete(completedAttempt.data);

    } catch (error) {
      console.error('Error submitting assessment:', error);
      announceToScreenReader('Error submitting assessment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [attempt.id, timer.startTime, onComplete, announceToScreenReader]);

  const canSubmit = progress.questionsAnswered === progress.totalQuestions;
  const timeDisplay = timer.timeLimit > 0 ? formatTime(timer.timeRemaining) : null;

  const renderCurrentQuestion = () => {
    if (!currentQuestion) return null;

    const questionState = questionStates[currentQuestion.id];
    const isAnswered = questionState?.isAnswered || false;

    const baseProps = {
      question: currentQuestion,
      onAnswer: handleAnswer,
      disabled: isAnswered || isSubmitting,
      showFeedback: isAnswered,
      className: 'w-full'
    };

    if (isMultipleChoiceQuestion(currentQuestion)) {
      return <MultipleChoice {...baseProps} />;
    }
    
    if (isFillInBlankQuestion(currentQuestion)) {
      return <FillInTheBlank {...baseProps} />;
    }
    
    if (isDragAndDropQuestion(currentQuestion)) {
      return <DragAndDrop {...baseProps} />;
    }
    
    if (isSentenceBuilderQuestion(currentQuestion)) {
      return <SentenceBuilder {...baseProps} />;
    }

    return (
      <div className="p-4 border border-gray-300 rounded">
        <p className="text-red-600">Unsupported question type: {currentQuestion.type}</p>
      </div>
    );
  };

  if (questions.length === 0) {
    return (
      <Card className={`max-w-2xl mx-auto ${className}`}>
        <CardBody>
          <StatusMessage type="error" message="No questions available for this assessment." />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className={`max-w-4xl mx-auto space-y-6 ${className}`}>
      {/* Screen reader announcements */}
      {announcements.map((message, index) => (
        <LiveAnnouncement key={index} message={message} priority="polite" />
      ))}

      {/* Assessment header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{assessment.title}</h1>
              {assessment.description && (
                <p className="text-gray-600 mt-1">{assessment.description}</p>
              )}
            </div>
            
            {timeDisplay && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Time Remaining</div>
                <div className={`text-lg font-mono ${
                  timer.timeRemaining < 300 ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {timeDisplay}
                </div>
              </div>
            )}
          </div>

          {/* Progress indicator */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
              <span>{progress.questionsAnswered} answered</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.questionsAnswered / progress.totalQuestions) * 100}%` }}
              />
            </div>
            <ScreenReaderText>
              Progress: {progress.questionsAnswered} of {progress.totalQuestions} questions answered
            </ScreenReaderText>
          </div>
        </CardHeader>
      </Card>

      {/* Question content */}
      <Card>
        <CardBody>
          {renderCurrentQuestion()}
        </CardBody>
      </Card>

      {/* Navigation controls */}
      <Card>
        <CardBody>
          <div className="flex justify-between items-center">
            <Button
              variant="secondary"
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0 || isSubmitting}
            >
              Previous
            </Button>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={onExit}
                disabled={isSubmitting}
              >
                Exit Assessment
              </Button>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  onClick={handleNextQuestion}
                  disabled={!questionStates[currentQuestion?.id]?.isAnswered || isSubmitting}
                >
                  Next Question
                </Button>
              ) : (
                <Button
                  onClick={handleSubmitAssessment}
                  disabled={!canSubmit || isSubmitting}
                  variant="primary"
                >
                  {isSubmitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Assessment'
                  )}
                </Button>
              )}
            </div>
          </div>

          <ProgressAnnouncement
            current={progress.questionsAnswered}
            total={progress.totalQuestions}
            type="questions"
          />
        </CardBody>
      </Card>
    </div>
  );
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}