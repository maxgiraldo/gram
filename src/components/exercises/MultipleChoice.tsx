/**
 * Multiple Choice Exercise Component
 *
 * Interactive multiple choice question component with accessibility support,
 * keyboard navigation, and immediate feedback.
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "../ui/Card";
import type {
  MultipleChoiceProps,
  ExerciseState,
  FeedbackMessage,
} from "./types";
import {
  createInitialExerciseState,
  updateExerciseState,
  useHint,
  validateAnswer,
  createExerciseAnswer,
  createFeedbackMessage,
  shuffleOptions,
  getAriaLabel,
  getKeyboardInstructions,
  isEmptyAnswer,
  validateQuestionData,
} from "./utils";

/**
 * Multiple Choice Exercise Component
 */
export function MultipleChoice({
  question,
  onAnswer,
  onHintRequest,
  disabled = false,
  showFeedback = true,
  timeLimit,
  className = "",
}: MultipleChoiceProps) {
  // State management
  const [state, setState] = useState<ExerciseState>(createInitialExerciseState);
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<FeedbackMessage | null>(null);
  const [focusedOptionIndex, setFocusedOptionIndex] = useState<number>(-1);

  // Validate question data on mount
  useEffect(() => {
    const errors = validateQuestionData(question);
    if (errors.length > 0) {
      console.error("Multiple Choice question validation errors:", errors);
    }

    // Initialize shuffled options
    const options = question.questionData.options || [];
    const shuffled = shuffleOptions(
      options,
      question.questionData.shuffleOptions
    );
    setShuffledOptions(shuffled);
  }, [question]);

  // Handle option selection
  const handleOptionSelect = useCallback(
    (option: string) => {
      if (disabled || state.isAnswered) return;

      setSelectedOption(option);
      setFocusedOptionIndex(shuffledOptions.indexOf(option));
    },
    [disabled, state.isAnswered, shuffledOptions]
  );

  // Handle answer submission
  const handleSubmit = useCallback(() => {
    if (disabled || state.isAnswered || isEmptyAnswer(selectedOption)) return;

    const validation = validateAnswer(
      question,
      selectedOption,
      state.hintsUsed,
      state.timeSpent
    );
    const newState = updateExerciseState(
      state,
      selectedOption,
      validation.isCorrect
    );

    setState(newState);

    // Create and show feedback
    if (showFeedback) {
      const feedbackType = validation.isCorrect ? "correct" : "incorrect";
      const feedbackMessage = createFeedbackMessage(
        feedbackType,
        validation,
        state.hintsUsed
      );
      setFeedback(feedbackMessage);
    }

    // Create answer object and notify parent
    const answer = createExerciseAnswer(
      question.id,
      selectedOption,
      validation,
      newState.timeSpent,
      newState.hintsUsed
    );

    onAnswer(answer);
  }, [disabled, state, selectedOption, question, showFeedback, onAnswer]);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!onHintRequest || disabled) return;

    setState(useHint);
    onHintRequest();
  }, [onHintRequest, disabled]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (disabled || state.isAnswered) return;

      switch (event.key) {
        case "ArrowUp":
          event.preventDefault();
          setFocusedOptionIndex((prev) =>
            prev <= 0 ? shuffledOptions.length - 1 : prev - 1
          );
          break;
        case "ArrowDown":
          event.preventDefault();
          setFocusedOptionIndex((prev) =>
            prev >= shuffledOptions.length - 1 ? 0 : prev + 1
          );
          break;
        case " ":
        case "Space":
          event.preventDefault();
          if (focusedOptionIndex >= 0) {
            handleOptionSelect(shuffledOptions[focusedOptionIndex]);
          }
          break;
        case "Enter":
          event.preventDefault();
          if (selectedOption) {
            handleSubmit();
          }
          break;
        case "h":
        case "H":
          if (event.ctrlKey || event.metaKey) {
            event.preventDefault();
            handleHintRequest();
          }
          break;
      }
    },
    [
      disabled,
      state.isAnswered,
      shuffledOptions,
      focusedOptionIndex,
      selectedOption,
      handleOptionSelect,
      handleSubmit,
      handleHintRequest,
    ]
  );

  // Auto-focus management
  useEffect(() => {
    if (focusedOptionIndex === -1 && shuffledOptions.length > 0) {
      setFocusedOptionIndex(0);
    }
  }, [shuffledOptions, focusedOptionIndex]);

  return (
    <Card className={`multiple-choice-exercise ${className}`}>
      <CardHeader>
        <h3 className="text-lg font-semibold mb-2">{question.questionText}</h3>
        {question.description && (
          <p className="text-sm text-gray-600 mb-4">{question.description}</p>
        )}
      </CardHeader>

      <CardBody>
        <div
          className="space-y-3"
          role="radiogroup"
          aria-label={getAriaLabel(question)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {shuffledOptions.map((option, index) => {
            const isSelected = selectedOption === option;
            const isFocused = focusedOptionIndex === index;
            const isCorrect =
              state.isAnswered && option === question.correctAnswer;
            const isIncorrect = state.isAnswered && isSelected && !isCorrect;

            return (
              <div
                key={`option-${index}`}
                className={`
                  option-item p-4 border-2 rounded-lg cursor-pointer transition-all duration-200
                  ${isFocused ? "ring-2 ring-blue-500 ring-offset-2" : ""}
                  ${
                    isSelected
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }
                  ${state.isAnswered ? "cursor-default" : ""}
                  ${isCorrect ? "border-green-500 bg-green-50" : ""}
                  ${isIncorrect ? "border-red-500 bg-red-50" : ""}
                  ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                `}
                onClick={() => handleOptionSelect(option)}
                role="radio"
                aria-checked={isSelected}
                aria-label={`Option ${index + 1}: ${option}`}
                tabIndex={-1}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`
                      w-5 h-5 rounded-full border-2 flex items-center justify-center
                      ${isSelected ? "border-blue-500" : "border-gray-400"}
                      ${isCorrect ? "border-green-500 bg-green-500" : ""}
                      ${isIncorrect ? "border-red-500 bg-red-500" : ""}
                    `}
                  >
                    {isSelected && !state.isAnswered && (
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                    )}
                    {isCorrect && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                    {isIncorrect && (
                      <svg
                        className="w-3 h-3 text-white"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>

                  <span
                    className={`
                      text-base
                      ${isCorrect ? "text-green-800 font-medium" : ""}
                      ${isIncorrect ? "text-red-800" : ""}
                    `}
                  >
                    {option}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Keyboard instructions */}
        <div className="mt-4 text-xs text-gray-500">
          {getKeyboardInstructions("multiple_choice")}
        </div>

        {/* Feedback display */}
        {feedback && feedback.isVisible && (
          <div
            className={`
              mt-4 p-4 rounded-lg border-l-4
              ${
                feedback.type === "correct"
                  ? "bg-green-50 border-green-500 text-green-800"
                  : ""
              }
              ${
                feedback.type === "incorrect"
                  ? "bg-red-50 border-red-500 text-red-800"
                  : ""
              }
              ${
                feedback.type === "partial"
                  ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                  : ""
              }
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
                Points earned: {feedback.points} / {question.points}
              </div>
            )}
          </div>
        )}
      </CardBody>

      <CardFooter>
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
            disabled={disabled || state.isAnswered || !selectedOption}
            className="submit-button"
            aria-label="Submit answer"
          >
            {state.isAnswered ? "Submitted" : "Submit Answer"}
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
      </CardFooter>
    </Card>
  );
}

// Default export
export default MultipleChoice;
