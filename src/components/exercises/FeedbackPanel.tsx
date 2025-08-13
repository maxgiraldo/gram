/**
 * Feedback Panel Component
 *
 * Real-time feedback display component with adaptive hints,
 * visual indicators, and progressive hint revealing.
 */

"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../ui/button";
import { Card, CardBody } from "../ui/Card";
import type {
  GeneratedFeedback,
  HintSequence,
  HintData,
  FeedbackContext,
  FeedbackOptions,
} from "../../lib/exercises/feedback-engine";
import {
  generateFeedback,
  generateHintSequence,
  getNextHint,
} from "../../lib/exercises/feedback-engine";
import type { ExerciseQuestion } from "../../types/content";
import type { ValidationResult } from "./types";

// ===== TYPES =====

export interface FeedbackPanelProps {
  question: ExerciseQuestion;
  validation?: ValidationResult | null;
  userAnswer?: string | string[] | Record<string, string>;
  correctAnswer?: string | string[] | Record<string, string>;
  attemptNumber?: number;
  hintsUsed?: number;
  timeSpent?: number;
  onHintRequest?: () => void;
  onFeedbackDismiss?: () => void;
  className?: string;
  autoHide?: boolean;
  hideDelay?: number;
  enableAdaptive?: boolean;
  enableAnimation?: boolean;
  position?: "inline" | "floating" | "sidebar";
  showHintButton?: boolean;
  maxHints?: number;
}

interface FeedbackState {
  currentFeedback: GeneratedFeedback | null;
  hintSequence: HintSequence | null;
  currentHint: HintData | null;
  isVisible: boolean;
  isAnimating: boolean;
  hintsRevealed: number;
}

// ===== COMPONENT =====

/**
 * Feedback Panel Component
 */
export function FeedbackPanel({
  question,
  validation,
  userAnswer,
  correctAnswer,
  attemptNumber = 1,
  hintsUsed = 0,
  timeSpent = 0,
  onHintRequest,
  onFeedbackDismiss,
  className = "",
  autoHide = false,
  hideDelay = 5000,
  enableAdaptive = true,
  enableAnimation = true,
  position = "inline",
  showHintButton = true,
  maxHints = 3,
}: FeedbackPanelProps) {
  const [state, setState] = useState<FeedbackState>({
    currentFeedback: null,
    hintSequence: null,
    currentHint: null,
    isVisible: false,
    isAnimating: false,
    hintsRevealed: 0,
  });

  const hideTimeoutRef = useRef<NodeJS.Timeout>();
  const panelRef = useRef<HTMLDivElement>(null);

  // Initialize hint sequence when question changes
  useEffect(() => {
    const options: FeedbackOptions = {
      enableAdaptive,
      enableEncouragement: true,
      tone: "encouraging",
    };

    const sequence = generateHintSequence(question, options);
    sequence.maxHints = Math.min(sequence.maxHints, maxHints);

    setState((prev) => ({
      ...prev,
      hintSequence: sequence,
      hintsRevealed: 0,
      currentHint: null,
    }));
  }, [question, enableAdaptive, maxHints]);

  // Generate feedback when validation changes
  useEffect(() => {
    if (!validation || !userAnswer || !correctAnswer) {
      return;
    }

    const context: FeedbackContext = {
      question,
      userAnswer,
      correctAnswer,
      attemptNumber,
      hintsUsed,
      timeSpent,
    };

    const options: FeedbackOptions = {
      enableAdaptive,
      enableEncouragement: true,
      enableVisualAids: true,
      tone: "encouraging",
    };

    const feedback = generateFeedback(context, options);

    setState((prev) => ({
      ...prev,
      currentFeedback: feedback,
      isVisible: true,
      isAnimating: enableAnimation,
    }));

    // Auto-hide logic
    if (autoHide && feedback.type === "correct") {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }

      hideTimeoutRef.current = setTimeout(() => {
        handleDismiss();
      }, hideDelay);
    }
  }, [
    validation,
    userAnswer,
    correctAnswer,
    question,
    attemptNumber,
    hintsUsed,
    timeSpent,
    enableAdaptive,
    enableAnimation,
    autoHide,
    hideDelay,
  ]);

  // Handle hint request
  const handleHintRequest = useCallback(() => {
    if (!state.hintSequence) return;

    const context: FeedbackContext = {
      question,
      userAnswer: userAnswer || "",
      correctAnswer: correctAnswer || "",
      attemptNumber,
      hintsUsed: state.hintsRevealed,
      timeSpent,
    };

    const nextHint = getNextHint(state.hintSequence, context);

    if (nextHint) {
      setState((prev) => ({
        ...prev,
        currentHint: nextHint,
        hintsRevealed: prev.hintsRevealed + 1,
        isVisible: true,
        isAnimating: enableAnimation,
      }));

      onHintRequest?.();

      // Clear auto-hide timeout when showing hint
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    }
  }, [
    state.hintSequence,
    state.hintsRevealed,
    question,
    userAnswer,
    correctAnswer,
    attemptNumber,
    timeSpent,
    enableAnimation,
    onHintRequest,
  ]);

  // Handle dismiss
  const handleDismiss = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isAnimating: false,
    }));

    setTimeout(
      () => {
        setState((prev) => ({
          ...prev,
          isVisible: false,
          currentFeedback: null,
        }));
        onFeedbackDismiss?.();
      },
      enableAnimation ? 300 : 0
    );
  }, [enableAnimation, onFeedbackDismiss]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  // Don't render if nothing to show
  if (!state.isVisible && !state.currentFeedback && !state.currentHint) {
    return null;
  }

  // Determine position classes
  const positionClasses = {
    inline: "",
    floating: "fixed bottom-4 right-4 z-50 max-w-md",
    sidebar: "sticky top-4",
  };

  // Determine feedback type styling
  const getFeedbackStyle = (type: GeneratedFeedback["type"]) => {
    switch (type) {
      case "correct":
        return "bg-green-50 border-green-200 text-green-800";
      case "incorrect":
        return "bg-red-50 border-red-200 text-red-800";
      case "partial":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "hint":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "explanation":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  // Render hint
  const renderHint = (hint: HintData) => {
    const hintIcons = {
      text: "💡",
      visual: "👁️",
      example: "📝",
      structural: "🏗️",
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span
            className="text-2xl"
            role="img"
            aria-label={`${hint.type} hint`}
          >
            {hintIcons[hint.type]}
          </span>
          <span className="font-semibold">
            Hint {state.hintsRevealed} of{" "}
            {state.hintSequence?.maxHints || maxHints}
          </span>
        </div>
        <p className="text-sm">{hint.content}</p>
        {hint.revealPercentage && (
          <div className="mt-2">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Reveal Progress</span>
              <span>{hint.revealPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${hint.revealPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render feedback
  const renderFeedback = (feedback: GeneratedFeedback) => {
    return (
      <div className="space-y-3">
        {/* Title and main message */}
        <div>
          <h3 className="font-semibold text-lg mb-1">{feedback.title}</h3>
          <p className="text-sm">{feedback.message}</p>
        </div>

        {/* Details */}
        {feedback.details && (
          <div className="text-sm opacity-90 border-l-2 border-current pl-3">
            {feedback.details}
          </div>
        )}

        {/* Encouragement */}
        {feedback.encouragement && (
          <div className="text-sm italic bg-white bg-opacity-50 rounded p-2">
            {feedback.encouragement}
          </div>
        )}

        {/* Next steps */}
        {feedback.nextSteps && (
          <div className="text-sm font-medium">
            <span className="inline-block mr-1">→</span>
            {feedback.nextSteps}
          </div>
        )}

        {/* Related concepts */}
        {feedback.relatedConcepts && feedback.relatedConcepts.length > 0 && (
          <div className="text-sm">
            <span className="font-medium">Related concepts:</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {feedback.relatedConcepts.map((concept, index) => (
                <span
                  key={index}
                  className="inline-block px-2 py-1 bg-white bg-opacity-60 rounded text-xs"
                >
                  {concept}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Visual aid placeholder */}
        {feedback.visualAid && (
          <div className="border-2 border-dashed border-current border-opacity-30 rounded p-3 text-center text-sm">
            <span className="opacity-60">📊 {feedback.visualAid}</span>
          </div>
        )}

        {/* Confidence indicator */}
        {feedback.confidence !== undefined && feedback.confidence < 1 && (
          <div className="text-xs opacity-60 text-right">
            Confidence: {Math.round(feedback.confidence * 100)}%
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      ref={panelRef}
      className={`
        feedback-panel
        ${positionClasses[position]}
        ${state.isAnimating ? "animate-slide-in" : ""}
        ${!state.isVisible ? "opacity-0 pointer-events-none" : "opacity-100"}
        transition-all duration-300
        ${className}
      `}
    >
      <Card
        className={`
          border-2
          ${
            state.currentFeedback
              ? getFeedbackStyle(state.currentFeedback.type)
              : ""
          }
          ${state.currentHint ? "bg-blue-50 border-blue-200 text-blue-800" : ""}
        `}
      >
        <CardBody className="relative">
          {/* Close button for floating/sidebar positions */}
          {(position === "floating" || position === "sidebar") && (
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Dismiss feedback"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}

          {/* Content */}
          {state.currentHint && renderHint(state.currentHint)}
          {state.currentFeedback &&
            !state.currentHint &&
            renderFeedback(state.currentFeedback)}

          {/* Hint button */}
          {showHintButton &&
            state.hintSequence &&
            state.hintsRevealed < state.hintSequence.maxHints &&
            !state.currentFeedback?.type.includes("correct") && (
              <div className="mt-4 pt-3 border-t border-current border-opacity-20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleHintRequest}
                  className="w-full"
                >
                  Get Hint ({state.hintSequence.maxHints - state.hintsRevealed}{" "}
                  remaining)
                </Button>
              </div>
            )}
        </CardBody>
      </Card>
    </div>
  );
}

// ===== STYLES =====

const styles = `
  @keyframes slide-in {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .animate-slide-in {
    animation: slide-in 0.3s ease-out;
  }
`;

// Add styles to document if not already present
if (
  typeof document !== "undefined" &&
  !document.getElementById("feedback-panel-styles")
) {
  const styleElement = document.createElement("style");
  styleElement.id = "feedback-panel-styles";
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}

// ===== EXPORTS =====

export default FeedbackPanel;
