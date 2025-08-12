/**
 * Shared Exercise Component Types and Interfaces
 * 
 * Common types and utilities for all exercise components
 */

import { 
  type ExerciseQuestion,
  type QuestionData,
  type MultipleChoiceData,
  type FillInBlankData,
  type DragAndDropData,
  type SentenceBuilderData,
} from '../../types/content';

// ===== SHARED EXERCISE PROPS =====

/**
 * Base props for all exercise components
 */
export interface BaseExerciseProps {
  question: ExerciseQuestion;
  onAnswer: (answer: ExerciseAnswer) => void;
  onHintRequest?: () => void;
  disabled?: boolean;
  showFeedback?: boolean;
  timeLimit?: number;
  className?: string;
}

/**
 * Exercise answer structure
 */
export interface ExerciseAnswer {
  questionId: string;
  response: any; // Type varies by question type
  isCorrect: boolean;
  points: number;
  timeSpent: number; // in milliseconds
  hintsUsed: number;
  confidence?: number; // 0-1 scale
}

/**
 * Exercise state for tracking user interaction
 */
export interface ExerciseState {
  currentAnswer?: any;
  isAnswered: boolean;
  isCorrect?: boolean;
  hintsUsed: number;
  timeSpent: number;
  startTime: number;
  showFeedback: boolean;
  confidence?: number;
}

/**
 * Hint display information
 */
export interface HintInfo {
  text: string;
  level: number; // 1-based hint level
  isUsed: boolean;
}

// ===== COMPONENT-SPECIFIC PROPS =====

/**
 * Multiple Choice component props
 */
export interface MultipleChoiceProps extends BaseExerciseProps {
  question: ExerciseQuestion & {
    questionData: MultipleChoiceData;
  };
}

/**
 * Fill in the Blank component props
 */
export interface FillInTheBlankProps extends BaseExerciseProps {
  question: ExerciseQuestion & {
    questionData: FillInBlankData;
  };
}

/**
 * Drag and Drop component props
 */
export interface DragAndDropProps extends BaseExerciseProps {
  question: ExerciseQuestion & {
    questionData: DragAndDropData;
  };
}

/**
 * Sentence Builder component props
 */
export interface SentenceBuilderProps extends BaseExerciseProps {
  question: ExerciseQuestion & {
    questionData: SentenceBuilderData;
  };
}

// ===== DRAG AND DROP SPECIFIC TYPES =====

/**
 * Draggable item state
 */
export interface DraggableItemState {
  id: string;
  content: string;
  category?: string;
  position: { x: number; y: number };
  isDragging: boolean;
  isPlaced: boolean;
  targetId?: string;
}

/**
 * Drop target state
 */
export interface DropTargetState {
  id: string;
  label: string;
  acceptsCategory?: string;
  placedItems: string[];
  isActive: boolean;
  isHighlighted: boolean;
}

// ===== SENTENCE BUILDER SPECIFIC TYPES =====

/**
 * Word tile state for sentence builder
 */
export interface WordTileState {
  id: string;
  word: string;
  position: number;
  isSelected: boolean;
  isPlaced: boolean;
  isCorrectPosition?: boolean;
}

// ===== VALIDATION TYPES =====

/**
 * Answer validation result
 */
export interface ValidationResult {
  isCorrect: boolean;
  points: number;
  feedback?: string;
  partialCredit?: number;
  errorDetails?: string[];
}

// ===== ACCESSIBILITY TYPES =====

/**
 * Accessibility configuration for exercises
 */
export interface AccessibilityConfig {
  enableKeyboardNavigation: boolean;
  enableScreenReader: boolean;
  enableHighContrast: boolean;
  enableReducedMotion: boolean;
  fontSize: 'small' | 'medium' | 'large';
}

// ===== EXERCISE CONTAINER PROPS =====

/**
 * Props for the exercise container wrapper
 */
export interface ExerciseContainerProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  hints?: string[];
  currentHint?: number;
  onHintRequest?: () => void;
  timeLimit?: number;
  timeRemaining?: number;
  onTimeUp?: () => void;
  showProgress?: boolean;
  progress?: number;
  className?: string;
  accessibilityConfig?: AccessibilityConfig;
}

// ===== FEEDBACK TYPES =====

/**
 * Feedback display configuration
 */
export interface FeedbackConfig {
  showImmediate: boolean;
  showCorrect: boolean;
  showIncorrect: boolean;
  showHints: boolean;
  showExplanation: boolean;
  autoHide?: boolean;
  hideDelay?: number; // milliseconds
}

/**
 * Feedback message structure
 */
export interface FeedbackMessage {
  type: 'correct' | 'incorrect' | 'partial' | 'hint' | 'explanation';
  title: string;
  message: string;
  details?: string;
  points?: number;
  isVisible: boolean;
}

// ===== UTILITY TYPES =====

/**
 * Timer state for time-limited exercises
 */
export interface TimerState {
  timeLimit: number; // seconds
  timeRemaining: number; // seconds
  isRunning: boolean;
  isExpired: boolean;
  startTime: number;
}

/**
 * Progress tracking state
 */
export interface ProgressState {
  questionsAnswered: number;
  totalQuestions: number;
  correctAnswers: number;
  currentScore: number;
  timeSpent: number;
}

// ===== TYPE GUARDS =====

/**
 * Type guard for multiple choice data
 */
export function isMultipleChoiceQuestion(question: ExerciseQuestion): question is ExerciseQuestion & { questionData: MultipleChoiceData } {
  return question.type === 'multiple_choice';
}

/**
 * Type guard for fill in blank data
 */
export function isFillInBlankQuestion(question: ExerciseQuestion): question is ExerciseQuestion & { questionData: FillInBlankData } {
  return question.type === 'fill_in_blank';
}

/**
 * Type guard for drag and drop data
 */
export function isDragAndDropQuestion(question: ExerciseQuestion): question is ExerciseQuestion & { questionData: DragAndDropData } {
  return question.type === 'drag_and_drop';
}

/**
 * Type guard for sentence builder data
 */
export function isSentenceBuilderQuestion(question: ExerciseQuestion): question is ExerciseQuestion & { questionData: SentenceBuilderData } {
  return question.type === 'sentence_builder';
}