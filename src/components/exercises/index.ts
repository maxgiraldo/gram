/**
 * Exercise Components Export
 * 
 * Central export file for all exercise components and utilities
 */

// Exercise Components
export { MultipleChoice } from './MultipleChoice';
export { FillInTheBlank } from './FillInTheBlank';
export { DragAndDrop } from './DragAndDrop';
export { SentenceBuilder } from './SentenceBuilder';
export { FeedbackPanel } from './FeedbackPanel';

// Types
export type {
  BaseExerciseProps,
  ExerciseAnswer,
  ExerciseState,
  HintInfo,
  MultipleChoiceProps,
  FillInTheBlankProps,
  DragAndDropProps,
  SentenceBuilderProps,
  DraggableItemState,
  DropTargetState,
  WordTileState,
  ValidationResult,
  AccessibilityConfig,
  ExerciseContainerProps,
  FeedbackConfig,
  FeedbackMessage,
  TimerState,
  ProgressState,
} from './types';

export type { FeedbackPanelProps } from './FeedbackPanel';

// Type Guards
export {
  isMultipleChoiceQuestion,
  isFillInBlankQuestion,
  isDragAndDropQuestion,
  isSentenceBuilderQuestion,
} from './types';

// Utilities
export {
  validateAnswer,
  createExerciseAnswer,
  createInitialExerciseState,
  updateExerciseState,
  useHint,
  createInitialTimerState,
  updateTimerState,
  startTimer,
  stopTimer,
  formatTime,
  getAvailableHints,
  getNextHint,
  hasMoreHints,
  createFeedbackMessage,
  shuffleArray,
  shuffleOptions,
  shuffleWords,
  getAriaLabel,
  getKeyboardInstructions,
  isEmptyAnswer,
  normalizeAnswer,
  calculatePartialCredit,
  applyTimeBonus,
  createErrorMessage,
  validateQuestionData,
} from './utils';