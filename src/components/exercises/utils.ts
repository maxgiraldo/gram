/**
 * Shared Exercise Utilities
 * 
 * Common utility functions for exercise components
 */

import { ExerciseScoring } from '../../lib/assessment/mastery-calculator';
import type {
  ExerciseAnswer,
  ExerciseState,
  ValidationResult,
  TimerState,
  HintInfo,
  FeedbackMessage,
} from './types';
import type {
  ExerciseQuestion,
  MultipleChoiceData,
  FillInBlankData,
  DragAndDropData,
  SentenceBuilderData,
} from '../../types/content';

// ===== ANSWER VALIDATION =====

/**
 * Validates user answer based on question type
 */
export function validateAnswer(
  question: ExerciseQuestion,
  userAnswer: any,
  hintsUsed: number = 0,
  timeSpent: number = 0
): ValidationResult {
  let result: { isCorrect: boolean; points: number };

  switch (question.type) {
    case 'multiple_choice':
      result = ExerciseScoring.multipleChoice(
        userAnswer,
        question.correctAnswer as string
      );
      break;

    case 'fill_in_blank':
      const correctAnswers = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : [question.correctAnswer as string];
      result = ExerciseScoring.fillInBlank(userAnswer, correctAnswers, true);
      break;

    case 'drag_and_drop':
      const userOrder = Array.isArray(userAnswer) ? userAnswer : [];
      const correctOrder = Array.isArray(question.correctAnswer) 
        ? question.correctAnswer 
        : Object.values(question.correctAnswer as Record<string, string>);
      result = ExerciseScoring.dragAndDrop(userOrder, correctOrder);
      break;

    case 'sentence_builder':
      const userSentence = Array.isArray(userAnswer) 
        ? userAnswer.join(' ')
        : userAnswer.toString();
      const correctSentences = Array.isArray(question.correctAnswer)
        ? question.correctAnswer.map(ans => ans.toString())
        : [question.correctAnswer.toString()];
      result = ExerciseScoring.sentenceBuilder(userSentence, correctSentences);
      break;

    default:
      result = { isCorrect: false, points: 0 };
  }

  // Apply penalties for hints and time
  const adjustedPoints = Math.max(0, result.points - (hintsUsed * 0.1));

  return {
    isCorrect: result.isCorrect,
    points: adjustedPoints,
    feedback: result.isCorrect 
      ? question.correctFeedback || 'Correct!'
      : question.incorrectFeedback || 'Not quite right. Try again!',
    partialCredit: result.points < 1 ? result.points : undefined,
  };
}

/**
 * Creates an exercise answer object
 */
export function createExerciseAnswer(
  questionId: string,
  response: any,
  validation: ValidationResult,
  timeSpent: number,
  hintsUsed: number,
  confidence?: number
): ExerciseAnswer {
  return {
    questionId,
    response,
    isCorrect: validation.isCorrect,
    points: validation.points,
    timeSpent,
    hintsUsed,
    confidence,
  };
}

// ===== STATE MANAGEMENT =====

/**
 * Creates initial exercise state
 */
export function createInitialExerciseState(): ExerciseState {
  return {
    isAnswered: false,
    hintsUsed: 0,
    timeSpent: 0,
    startTime: Date.now(),
    showFeedback: false,
  };
}

/**
 * Updates exercise state with new answer
 */
export function updateExerciseState(
  state: ExerciseState,
  answer: any,
  isCorrect: boolean
): ExerciseState {
  return {
    ...state,
    currentAnswer: answer,
    isAnswered: true,
    isCorrect,
    timeSpent: Date.now() - state.startTime,
    showFeedback: true,
  };
}

/**
 * Increments hint usage in state
 */
export function useHint(state: ExerciseState): ExerciseState {
  return {
    ...state,
    hintsUsed: state.hintsUsed + 1,
  };
}

// ===== TIMER UTILITIES =====

/**
 * Creates initial timer state
 */
export function createInitialTimerState(timeLimit: number): TimerState {
  return {
    timeLimit,
    timeRemaining: timeLimit,
    isRunning: false,
    isExpired: false,
    startTime: Date.now(),
  };
}

/**
 * Updates timer state
 */
export function updateTimerState(
  state: TimerState,
  currentTime: number
): TimerState {
  if (!state.isRunning || state.isExpired) {
    return state;
  }

  const elapsed = Math.floor((currentTime - state.startTime) / 1000);
  const remaining = Math.max(0, state.timeLimit - elapsed);
  const isExpired = remaining === 0;

  return {
    ...state,
    timeRemaining: remaining,
    isExpired,
    isRunning: !isExpired,
  };
}

/**
 * Starts the timer
 */
export function startTimer(state: TimerState): TimerState {
  return {
    ...state,
    isRunning: true,
    startTime: Date.now(),
  };
}

/**
 * Stops the timer
 */
export function stopTimer(state: TimerState): TimerState {
  return {
    ...state,
    isRunning: false,
  };
}

/**
 * Formats time for display (MM:SS)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// ===== HINT MANAGEMENT =====

/**
 * Gets available hints for a question
 */
export function getAvailableHints(
  question: ExerciseQuestion,
  hintsUsed: number
): HintInfo[] {
  const hints = question.hints || [];
  
  return hints.map((hint, index) => ({
    text: hint,
    level: index + 1,
    isUsed: index < hintsUsed,
  }));
}

/**
 * Gets the next hint to show
 */
export function getNextHint(
  question: ExerciseQuestion,
  hintsUsed: number
): string | null {
  const hints = question.hints || [];
  return hints[hintsUsed] || null;
}

/**
 * Checks if more hints are available
 */
export function hasMoreHints(
  question: ExerciseQuestion,
  hintsUsed: number
): boolean {
  const hints = question.hints || [];
  return hintsUsed < hints.length;
}

// ===== FEEDBACK UTILITIES =====

/**
 * Creates feedback message
 */
export function createFeedbackMessage(
  type: FeedbackMessage['type'],
  validation: ValidationResult,
  hintsUsed: number = 0
): FeedbackMessage {
  let title: string;
  let message: string;

  switch (type) {
    case 'correct':
      title = hintsUsed > 0 ? 'Correct!' : 'Excellent!';
      message = validation.feedback || 'Well done!';
      break;
    case 'incorrect':
      title = 'Not quite right';
      message = validation.feedback || 'Try again!';
      break;
    case 'partial':
      title = 'Partially correct';
      message = validation.feedback || 'You\'re on the right track!';
      break;
    case 'hint':
      title = 'Hint';
      message = validation.feedback || '';
      break;
    default:
      title = 'Feedback';
      message = validation.feedback || '';
  }

  return {
    type,
    title,
    message,
    details: validation.errorDetails?.join(', '),
    points: validation.points,
    isVisible: true,
  };
}

// ===== SHUFFLE UTILITIES =====

/**
 * Shuffles an array using Fisher-Yates algorithm
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Shuffles multiple choice options if enabled
 */
export function shuffleOptions(
  options: string[],
  shouldShuffle: boolean = true
): string[] {
  return shouldShuffle ? shuffleArray(options) : [...options];
}

/**
 * Shuffles sentence builder words if enabled
 */
export function shuffleWords(
  words: string[],
  shouldShuffle: boolean = true
): string[] {
  return shouldShuffle ? shuffleArray(words) : [...words];
}

// ===== ACCESSIBILITY UTILITIES =====

/**
 * Gets ARIA label for exercise component
 */
export function getAriaLabel(question: ExerciseQuestion): string {
  const typeLabel = {
    multiple_choice: 'Multiple choice question',
    fill_in_blank: 'Fill in the blank question',
    drag_and_drop: 'Drag and drop question',
    sentence_builder: 'Sentence building question',
  }[question.type] || 'Exercise question';

  return `${typeLabel}: ${question.questionText}`;
}

/**
 * Gets keyboard navigation instructions
 */
export function getKeyboardInstructions(questionType: string): string {
  switch (questionType) {
    case 'multiple_choice':
      return 'Use arrow keys to navigate options, space to select, enter to submit';
    case 'fill_in_blank':
      return 'Type your answer in the text field, press enter to submit';
    case 'drag_and_drop':
      return 'Use arrow keys to navigate items, space to pick up/drop, tab to move between targets';
    case 'sentence_builder':
      return 'Use arrow keys to navigate words, space to select, enter to build sentence';
    default:
      return 'Follow the instructions for this exercise type';
  }
}

// ===== VALIDATION HELPERS =====

/**
 * Checks if answer is empty
 */
export function isEmptyAnswer(answer: any): boolean {
  if (answer === null || answer === undefined) return true;
  if (typeof answer === 'string') return answer.trim() === '';
  if (Array.isArray(answer)) return answer.length === 0;
  if (typeof answer === 'object') return Object.keys(answer).length === 0;
  return false;
}

/**
 * Normalizes answer for comparison
 */
export function normalizeAnswer(answer: any): any {
  if (typeof answer === 'string') {
    return answer.trim().toLowerCase();
  }
  if (Array.isArray(answer)) {
    return answer.map(item => 
      typeof item === 'string' ? item.trim().toLowerCase() : item
    );
  }
  return answer;
}

// ===== SCORING UTILITIES =====

/**
 * Calculates partial credit percentage
 */
export function calculatePartialCredit(
  correctItems: number,
  totalItems: number
): number {
  if (totalItems === 0) return 0;
  return Math.round((correctItems / totalItems) * 100) / 100;
}

/**
 * Applies time bonus to score
 */
export function applyTimeBonus(
  baseScore: number,
  timeSpent: number,
  timeLimit: number,
  bonusMultiplier: number = 0.1
): number {
  if (timeLimit <= 0) return baseScore;
  
  const timeRatio = timeSpent / (timeLimit * 1000); // Convert to milliseconds
  const bonus = timeRatio < 0.5 ? bonusMultiplier : 0; // Bonus for fast completion
  
  return Math.min(1, baseScore + bonus);
}

// ===== ERROR HANDLING =====

/**
 * Creates error message for invalid question data
 */
export function createErrorMessage(questionType: string, error: string): string {
  return `Error in ${questionType} question: ${error}`;
}

/**
 * Validates question data structure
 */
export function validateQuestionData(question: ExerciseQuestion): string[] {
  const errors: string[] = [];

  if (!question.questionText?.trim()) {
    errors.push('Question text is required');
  }

  if (!question.correctAnswer) {
    errors.push('Correct answer is required');
  }

  // Type-specific validation
  switch (question.type) {
    case 'multiple_choice':
      const mcData = question.questionData as MultipleChoiceData;
      if (!mcData.options || mcData.options.length < 2) {
        errors.push('Multiple choice questions need at least 2 options');
      }
      break;

    case 'fill_in_blank':
      const fibData = question.questionData as FillInBlankData;
      if (!fibData.template?.includes('{blank')) {
        errors.push('Fill in blank questions need a template with blanks');
      }
      break;

    case 'drag_and_drop':
      const dadData = question.questionData as DragAndDropData;
      if (!dadData.items?.length || !dadData.targets?.length) {
        errors.push('Drag and drop questions need items and targets');
      }
      break;

    case 'sentence_builder':
      const sbData = question.questionData as SentenceBuilderData;
      if (!sbData.words?.length || sbData.words.length < 3) {
        errors.push('Sentence builder questions need at least 3 words');
      }
      break;
  }

  return errors;
}