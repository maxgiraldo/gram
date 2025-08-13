/**
 * Fill in the Blank Exercise Component
 * 
 * Interactive fill-in-the-blank question component with multiple blanks support,
 * partial credit, and fuzzy matching.
 */

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { FillInTheBlankProps, ExerciseState, FeedbackMessage } from './types';
import type { FillInBlankData } from '../../types/content';
import {
  createInitialExerciseState,
  updateExerciseState,
  useHint,
  validateAnswer,
  createExerciseAnswer,
  createFeedbackMessage,
  getAriaLabel,
  getKeyboardInstructions,
  isEmptyAnswer,
  validateQuestionData,
} from './utils';

interface BlankInput {
  id: string;
  value: string;
  isCorrect?: boolean;
  feedback?: string;
}

/**
 * Fill in the Blank Exercise Component
 */
export function FillInTheBlank({
  question,
  onAnswer,
  onHintRequest,
  disabled = false,
  showFeedback = true,
  timeLimit,
  className = '',
}: FillInTheBlankProps) {
  // State management
  const [state, setState] = useState<ExerciseState>(createInitialExerciseState);
  const [blankInputs, setBlankInputs] = useState<BlankInput[]>([]);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [currentFocusIndex, setCurrentFocusIndex] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize blank inputs
  useEffect(() => {
    const errors = validateQuestionData(question);
    if (errors.length > 0) {
      console.error('Fill in the Blank question validation errors:', errors);
    }

    const data = question.questionData as FillInBlankData;
    const initialBlanks: BlankInput[] = data.blanks.map(blank => ({
      id: blank.id,
      value: '',
      isCorrect: undefined,
      feedback: undefined,
    }));
    setBlankInputs(initialBlanks);
  }, [question]);

  // Handle input change for a specific blank
  const handleInputChange = useCallback((blankId: string, value: string) => {
    if (disabled || state.isAnswered) return;

    setBlankInputs(prev => prev.map(input => 
      input.id === blankId ? { ...input, value } : input
    ));
  }, [disabled, state.isAnswered]);

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (disabled || state.isAnswered) return;

    // Check if all blanks are filled
    const hasEmptyBlanks = blankInputs.some(input => isEmptyAnswer(input.value));
    if (hasEmptyBlanks) {
      setFeedback({
        type: 'incorrect',
        title: 'Incomplete',
        message: 'Please fill in all blanks before submitting.',
        isVisible: true,
        points: 0,
      });
      return;
    }

    // Collect answers in order
    const userAnswers = blankInputs.map(input => input.value);
    
    // Validate answer
    const validation = validateAnswer(question, userAnswers, state.hintsUsed, state.timeSpent);
    const newState = updateExerciseState(state, userAnswers, validation.isCorrect);
    
    setState(newState);

    // Check individual blanks for feedback
    const data = question.questionData as FillInBlankData;
    const updatedBlanks = blankInputs.map((input, index) => {
      const blank = data.blanks[index];
      const isCorrect = blank.acceptableAnswers.some(answer => 
        blank.caseSensitive 
          ? input.value === answer 
          : input.value.toLowerCase() === answer.toLowerCase()
      );

      return {
        ...input,
        isCorrect,
        feedback: isCorrect 
          ? 'Correct!' 
          : `Expected: ${blank.acceptableAnswers[0]}`,
      };
    });

    setBlankInputs(updatedBlanks);

    // Create and show overall feedback
    if (showFeedback) {
      const feedbackType = validation.isCorrect 
        ? 'correct' 
        : validation.partialCredit 
          ? 'partial' 
          : 'incorrect';
      const feedbackMessage = createFeedbackMessage(feedbackType, validation, state.hintsUsed);
      setFeedback(feedbackMessage);
    }

    // Create answer object and notify parent
    const answer = createExerciseAnswer(
      question.id,
      userAnswers,
      validation,
      newState.timeSpent,
      newState.hintsUsed
    );

    onAnswer(answer);
  }, [disabled, state, blankInputs, question, showFeedback, onAnswer]);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!onHintRequest || disabled) return;
    
    setState(useHint);
    onHintRequest();
  }, [onHintRequest, disabled]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent, blankIndex: number) => {
    if (disabled || state.isAnswered) return;

    switch (event.key) {
      case 'Tab':
        // Let default tab behavior work
        break;
      case 'Enter':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleSubmit();
        }
        break;
      case 'ArrowRight':
        if (event.ctrlKey) {
          event.preventDefault();
          const nextIndex = Math.min(blankIndex + 1, blankInputs.length - 1);
          inputRefs.current[nextIndex]?.focus();
          setCurrentFocusIndex(nextIndex);
        }
        break;
      case 'ArrowLeft':
        if (event.ctrlKey) {
          event.preventDefault();
          const prevIndex = Math.max(blankIndex - 1, 0);
          inputRefs.current[prevIndex]?.focus();
          setCurrentFocusIndex(prevIndex);
        }
        break;
      case 'h':
      case 'H':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          handleHintRequest();
        }
        break;
    }
  }, [disabled, state.isAnswered, blankInputs.length, handleSubmit, handleHintRequest]);

  // Render the template with input fields
  const renderTemplate = () => {
    const data = question.questionData as FillInBlankData;
    const template = data.template;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;

    // Find all blank placeholders and replace with input fields
    data.blanks.forEach((blank, index) => {
      const placeholder = `{${blank.id}}`;
      const placeholderIndex = template.indexOf(placeholder, lastIndex);
      
      if (placeholderIndex !== -1) {
        // Add text before the blank
        if (placeholderIndex > lastIndex) {
          parts.push(
            <span key={`text-${index}`}>
              {template.substring(lastIndex, placeholderIndex)}
            </span>
          );
        }

        // Add the input field
        const blankInput = blankInputs.find(input => input.id === blank.id);
        const isCorrect = state.isAnswered && blankInput?.isCorrect;
        const isIncorrect = state.isAnswered && blankInput?.isCorrect === false;

        parts.push(
          <span key={`blank-${blank.id}`} className="inline-block mx-1">
            <input
              ref={el => inputRefs.current[index] = el}
              type="text"
              value={blankInput?.value || ''}
              onChange={(e) => handleInputChange(blank.id, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={disabled || state.isAnswered}
              placeholder={`Blank ${index + 1}`}
              aria-label={`Blank ${index + 1} of ${data.blanks.length}`}
              className={`
                inline-block px-3 py-1 border-b-2 bg-transparent
                transition-colors duration-200 text-center
                ${currentFocusIndex === index ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
                ${isCorrect ? 'border-green-500 text-green-700 bg-green-50' : ''}
                ${isIncorrect ? 'border-red-500 text-red-700 bg-red-50' : ''}
                ${!state.isAnswered ? 'border-gray-400 focus:border-blue-500' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              style={{ width: `${Math.max(100, (blank.acceptableAnswers[0]?.length || 10) * 10)}px` }}
            />
            {state.isAnswered && blankInput?.feedback && (
              <div className={`
                text-xs mt-1 
                ${isCorrect ? 'text-green-600' : 'text-red-600'}
              `}>
                {blankInput.feedback}
              </div>
            )}
          </span>
        );

        lastIndex = placeholderIndex + placeholder.length;
      }
    });

    // Add any remaining text after the last blank
    if (lastIndex < template.length) {
      parts.push(
        <span key="text-final">
          {template.substring(lastIndex)}
        </span>
      );
    }

    return parts;
  };

  return (
    <Card className={`fill-in-blank-exercise ${className}`}>
      <Card.Header>
        <h3 className="text-lg font-semibold mb-2">
          {question.questionText}
        </h3>
        {question.description && (
          <p className="text-sm text-gray-600 mb-4">
            {question.description}
          </p>
        )}
      </Card.Header>

      <Card.Body>
        <div
          className="fill-in-blank-template text-lg leading-relaxed"
          role="group"
          aria-label={getAriaLabel(question)}
        >
          {renderTemplate()}
        </div>

        {/* Keyboard instructions */}
        <div className="mt-4 text-xs text-gray-500">
          {getKeyboardInstructions('fill_in_blank')}
          <br />
          Tip: Use Ctrl+Arrow keys to navigate between blanks
        </div>

        {/* Feedback display */}
        {feedback && feedback.isVisible && (
          <div
            className={`
              mt-4 p-4 rounded-lg border-l-4
              ${feedback.type === 'correct' ? 'bg-green-50 border-green-500 text-green-800' : ''}
              ${feedback.type === 'incorrect' ? 'bg-red-50 border-red-500 text-red-800' : ''}
              ${feedback.type === 'partial' ? 'bg-yellow-50 border-yellow-500 text-yellow-800' : ''}
            `}
            role="alert"
            aria-live="polite"
          >
            <div className="font-semibold">{feedback.title}</div>
            <div className="mt-1">{feedback.message}</div>
            {feedback.details && (
              <div className="mt-2 text-sm">{feedback.details}</div>
            )}
            {feedback.points !== undefined && (
              <div className="mt-2 text-sm font-medium">
                Points earned: {feedback.points.toFixed(2)} / {question.points}
              </div>
            )}
          </div>
        )}
      </Card.Body>

      <Card.Footer>
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {/* Hint button */}
            {onHintRequest && !state.isAnswered && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleHintRequest}
                disabled={disabled}
                className="hint-button"
                aria-label="Request hint"
              >
                💡 Hint ({state.hintsUsed})
              </Button>
            )}
          </div>

          {/* Submit button */}
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={disabled || state.isAnswered}
            className="submit-button"
            aria-label="Submit answer"
          >
            {state.isAnswered ? 'Submitted' : 'Submit Answer'}
          </Button>
        </div>

        {/* Progress indicators */}
        {timeLimit && (
          <div className="mt-3 text-sm text-gray-600">
            Time limit: {timeLimit} seconds
          </div>
        )}
        
        {state.hintsUsed > 0 && (
          <div className="mt-1 text-sm text-gray-600">
            Hints used: {state.hintsUsed}
          </div>
        )}

        {/* Blank count indicator */}
        <div className="mt-1 text-sm text-gray-600">
          {blankInputs.filter(b => b.value).length} of {blankInputs.length} blanks filled
        </div>
      </Card.Footer>
    </Card>
  );
}

// Default export
export default FillInTheBlank;