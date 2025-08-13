/**
 * Type Adapters
 * 
 * Utility functions to adapt between different but similar types
 */

import type { 
  AssessmentQuestion,
  ExerciseQuestion 
} from '@prisma/client';
import type {
  AssessmentQuestionResponse,
  ExerciseQuestionResponse
} from '@/types/api';

/**
 * Convert AssessmentQuestion to format compatible with ExerciseQuestion
 */
export function assessmentToExerciseQuestion(
  assessment: AssessmentQuestion | AssessmentQuestionResponse,
  exerciseId?: string
): ExerciseQuestion {
  return {
    ...assessment,
    exerciseId: exerciseId || 'assessment-context',
    objectiveId: assessment.objectiveId || undefined,
    timeLimit: typeof assessment.timeLimit === 'number' ? assessment.timeLimit : undefined,
    correctFeedback: assessment.feedback || null,
    incorrectFeedback: assessment.feedback || null,
    hints: assessment.distractors || null,
  } as ExerciseQuestion;
}

/**
 * Normalize null values to undefined for TypeScript compatibility
 */
export function normalizeNullToUndefined<T extends Record<string, any>>(obj: T): T {
  const result = { ...obj };
  for (const key in result) {
    if (result[key] === null) {
      result[key] = undefined as any;
    }
  }
  return result;
}

/**
 * Convert database null values to undefined for API responses
 */
export function sanitizeForApi<T extends Record<string, any>>(data: T): T {
  return JSON.parse(JSON.stringify(data, (key, value) => 
    value === null ? undefined : value
  ));
}