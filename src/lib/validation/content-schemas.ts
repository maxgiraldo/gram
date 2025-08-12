/**
 * Content Validation Schemas
 * 
 * Validation functions and schemas for lesson content, exercises, assessments,
 * and learning objectives. Ensures data integrity and type safety.
 */

import {
  type Unit,
  type Lesson,
  type LearningObjective,
  type Exercise,
  type ExerciseQuestion,
  type Assessment,
  type AssessmentQuestion,
  type QuestionData,
  type MultipleChoiceData,
  type FillInBlankData,
  type DragAndDropData,
  type SentenceBuilderData,
  type EssayData,
  type ContentValidationResult,
  type ValidationError,
  type ValidationWarning,
  type DifficultyLevel,
  type ObjectiveCategory,
  type QuestionType,
  type ExerciseType,
  type AssessmentType,
  type ProgressStatus,
} from '../../types/content';

// ===== VALIDATION UTILITIES =====

/**
 * Creates a validation error
 */
function createError(field: string, message: string, code: string): ValidationError {
  return { field, message, code };
}

/**
 * Creates a validation warning
 */
function createWarning(field: string, message: string, code: string): ValidationWarning {
  return { field, message, code };
}

/**
 * Validates if a string is not empty
 */
function isNonEmptyString(value: any): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates if a number is positive
 */
function isPositiveNumber(value: any): value is number {
  return typeof value === 'number' && value > 0;
}

/**
 * Validates if a number is within range
 */
function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validates if value is one of allowed options
 */
function isValidEnum<T extends string>(value: any, allowedValues: readonly T[]): value is T {
  return typeof value === 'string' && allowedValues.includes(value as T);
}

// ===== ENUM VALIDATORS =====

const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
const OBJECTIVE_CATEGORIES: readonly ObjectiveCategory[] = [
  'knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation'
];
const QUESTION_TYPES: readonly QuestionType[] = [
  'multiple_choice', 'fill_in_blank', 'drag_and_drop', 'sentence_builder', 'essay'
];
const EXERCISE_TYPES: readonly ExerciseType[] = ['practice', 'reinforcement', 'challenge', 'enrichment'];
const ASSESSMENT_TYPES: readonly AssessmentType[] = ['diagnostic', 'formative', 'summative', 'retention_check'];
const PROGRESS_STATUSES: readonly ProgressStatus[] = ['not_started', 'in_progress', 'completed', 'mastered'];

// ===== CORE CONTENT VALIDATORS =====

/**
 * Validates a Unit object
 */
export function validateUnit(unit: Partial<Unit>): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!isNonEmptyString(unit.title)) {
    errors.push(createError('title', 'Title is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isNonEmptyString(unit.description)) {
    errors.push(createError('description', 'Description is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (typeof unit.orderIndex !== 'number') {
    errors.push(createError('orderIndex', 'Order index must be a number', 'INVALID_TYPE'));
  } else if (unit.orderIndex < 0) {
    errors.push(createError('orderIndex', 'Order index must be non-negative', 'INVALID_VALUE'));
  }

  // Mastery threshold validation
  if (typeof unit.masteryThreshold !== 'number') {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be a number', 'INVALID_TYPE'));
  } else if (!isInRange(unit.masteryThreshold, 0, 1)) {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be between 0 and 1', 'INVALID_RANGE'));
  } else if (unit.masteryThreshold < 0.8) {
    warnings.push(createWarning('masteryThreshold', 'Mastery threshold below 0.8 may not align with mastery learning principles', 'LOW_THRESHOLD'));
  }

  // Prerequisites validation
  if (unit.prerequisiteUnits && !Array.isArray(unit.prerequisiteUnits)) {
    errors.push(createError('prerequisiteUnits', 'Prerequisite units must be an array', 'INVALID_TYPE'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a Lesson object
 */
export function validateLesson(lesson: Partial<Lesson>): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!isNonEmptyString(lesson.title)) {
    errors.push(createError('title', 'Title is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isNonEmptyString(lesson.description)) {
    errors.push(createError('description', 'Description is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isNonEmptyString(lesson.content)) {
    errors.push(createError('content', 'Content is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isNonEmptyString(lesson.unitId)) {
    errors.push(createError('unitId', 'Unit ID is required', 'REQUIRED_FIELD'));
  }

  if (typeof lesson.orderIndex !== 'number') {
    errors.push(createError('orderIndex', 'Order index must be a number', 'INVALID_TYPE'));
  } else if (lesson.orderIndex < 0) {
    errors.push(createError('orderIndex', 'Order index must be non-negative', 'INVALID_VALUE'));
  }

  // Mastery threshold validation
  if (typeof lesson.masteryThreshold !== 'number') {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be a number', 'INVALID_TYPE'));
  } else if (!isInRange(lesson.masteryThreshold, 0, 1)) {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be between 0 and 1', 'INVALID_RANGE'));
  }

  // Estimated minutes validation
  if (typeof lesson.estimatedMinutes !== 'number') {
    errors.push(createError('estimatedMinutes', 'Estimated minutes must be a number', 'INVALID_TYPE'));
  } else if (!isPositiveNumber(lesson.estimatedMinutes)) {
    errors.push(createError('estimatedMinutes', 'Estimated minutes must be positive', 'INVALID_VALUE'));
  } else if (lesson.estimatedMinutes > 120) {
    warnings.push(createWarning('estimatedMinutes', 'Lesson longer than 2 hours may be too long for effective learning', 'LONG_LESSON'));
  }

  // Difficulty validation
  if (!isValidEnum(lesson.difficulty, DIFFICULTY_LEVELS)) {
    errors.push(createError('difficulty', 'Difficulty must be one of: beginner, intermediate, advanced', 'INVALID_ENUM'));
  }

  // Tags validation
  if (lesson.tags && !Array.isArray(lesson.tags)) {
    errors.push(createError('tags', 'Tags must be an array', 'INVALID_TYPE'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a Learning Objective object
 */
export function validateLearningObjective(objective: Partial<LearningObjective>): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!isNonEmptyString(objective.title)) {
    errors.push(createError('title', 'Title is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isNonEmptyString(objective.description)) {
    errors.push(createError('description', 'Description is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  // Category validation
  if (!isValidEnum(objective.category, OBJECTIVE_CATEGORIES)) {
    errors.push(createError('category', 'Category must be a valid Bloom\'s taxonomy level', 'INVALID_ENUM'));
  }

  // Mastery threshold validation
  if (typeof objective.masteryThreshold !== 'number') {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be a number', 'INVALID_TYPE'));
  } else if (!isInRange(objective.masteryThreshold, 0, 1)) {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be between 0 and 1', 'INVALID_RANGE'));
  }

  // Relationship validation
  if (!objective.unitId && !objective.lessonId) {
    warnings.push(createWarning('relationships', 'Objective should be associated with either a unit or lesson', 'MISSING_RELATIONSHIP'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates an Exercise object
 */
export function validateExercise(exercise: Partial<Exercise>): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!isNonEmptyString(exercise.title)) {
    errors.push(createError('title', 'Title is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isNonEmptyString(exercise.lessonId)) {
    errors.push(createError('lessonId', 'Lesson ID is required', 'REQUIRED_FIELD'));
  }

  if (!isValidEnum(exercise.type, EXERCISE_TYPES)) {
    errors.push(createError('type', 'Exercise type must be one of: practice, reinforcement, challenge, enrichment', 'INVALID_ENUM'));
  }

  if (!isValidEnum(exercise.difficulty, DIFFICULTY_LEVELS)) {
    errors.push(createError('difficulty', 'Difficulty must be one of: beginner, intermediate, advanced', 'INVALID_ENUM'));
  }

  if (typeof exercise.orderIndex !== 'number') {
    errors.push(createError('orderIndex', 'Order index must be a number', 'INVALID_TYPE'));
  } else if (exercise.orderIndex < 0) {
    errors.push(createError('orderIndex', 'Order index must be non-negative', 'INVALID_VALUE'));
  }

  // Max attempts validation
  if (typeof exercise.maxAttempts !== 'number') {
    errors.push(createError('maxAttempts', 'Max attempts must be a number', 'INVALID_TYPE'));
  } else if (!isPositiveNumber(exercise.maxAttempts)) {
    errors.push(createError('maxAttempts', 'Max attempts must be positive', 'INVALID_VALUE'));
  } else if (exercise.maxAttempts > 10) {
    warnings.push(createWarning('maxAttempts', 'More than 10 attempts may indicate exercise is too difficult', 'HIGH_ATTEMPTS'));
  }

  // Time limit validation
  if (exercise.timeLimit !== undefined) {
    if (!isPositiveNumber(exercise.timeLimit)) {
      errors.push(createError('timeLimit', 'Time limit must be positive', 'INVALID_VALUE'));
    } else if (exercise.timeLimit > 3600) {
      warnings.push(createWarning('timeLimit', 'Time limit over 1 hour may be too long', 'LONG_TIME_LIMIT'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates an Assessment object
 */
export function validateAssessment(assessment: Partial<Assessment>): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Required fields
  if (!isNonEmptyString(assessment.title)) {
    errors.push(createError('title', 'Title is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!isValidEnum(assessment.type, ASSESSMENT_TYPES)) {
    errors.push(createError('type', 'Assessment type must be one of: diagnostic, formative, summative, retention_check', 'INVALID_ENUM'));
  }

  // Max attempts validation
  if (typeof assessment.maxAttempts !== 'number') {
    errors.push(createError('maxAttempts', 'Max attempts must be a number', 'INVALID_TYPE'));
  } else if (!isPositiveNumber(assessment.maxAttempts)) {
    errors.push(createError('maxAttempts', 'Max attempts must be positive', 'INVALID_VALUE'));
  }

  // Mastery threshold validation
  if (typeof assessment.masteryThreshold !== 'number') {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be a number', 'INVALID_TYPE'));
  } else if (!isInRange(assessment.masteryThreshold, 0, 1)) {
    errors.push(createError('masteryThreshold', 'Mastery threshold must be between 0 and 1', 'INVALID_RANGE'));
  }

  // Scheduled delay validation (for retention checks)
  if (assessment.type === 'retention_check' && assessment.scheduledDelay !== undefined) {
    if (!isPositiveNumber(assessment.scheduledDelay)) {
      errors.push(createError('scheduledDelay', 'Scheduled delay must be positive', 'INVALID_VALUE'));
    } else if (assessment.scheduledDelay > 365) {
      warnings.push(createWarning('scheduledDelay', 'Retention check scheduled over a year later may be too late', 'LONG_DELAY'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===== QUESTION VALIDATORS =====

/**
 * Validates question data based on question type
 */
export function validateQuestionData(data: QuestionData): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  switch (data.type) {
    case 'multiple_choice':
      return validateMultipleChoiceData(data);
    case 'fill_in_blank':
      return validateFillInBlankData(data);
    case 'drag_and_drop':
      return validateDragAndDropData(data);
    case 'sentence_builder':
      return validateSentenceBuilderData(data);
    case 'essay':
      return validateEssayData(data);
    default:
      errors.push(createError('type', 'Invalid question type', 'INVALID_TYPE'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates multiple choice question data
 */
function validateMultipleChoiceData(data: MultipleChoiceData): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data.options)) {
    errors.push(createError('options', 'Options must be an array', 'INVALID_TYPE'));
  } else {
    if (data.options.length < 2) {
      errors.push(createError('options', 'Must have at least 2 options', 'INSUFFICIENT_OPTIONS'));
    } else if (data.options.length > 6) {
      warnings.push(createWarning('options', 'More than 6 options may confuse learners', 'TOO_MANY_OPTIONS'));
    }

    // Check for empty options
    const emptyOptions = data.options.filter(option => !isNonEmptyString(option));
    if (emptyOptions.length > 0) {
      errors.push(createError('options', 'All options must be non-empty strings', 'EMPTY_OPTION'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates fill in the blank question data
 */
function validateFillInBlankData(data: FillInBlankData): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isNonEmptyString(data.template)) {
    errors.push(createError('template', 'Template is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (!Array.isArray(data.blanks)) {
    errors.push(createError('blanks', 'Blanks must be an array', 'INVALID_TYPE'));
  } else {
    if (data.blanks.length === 0) {
      errors.push(createError('blanks', 'Must have at least one blank', 'NO_BLANKS'));
    }

    data.blanks.forEach((blank, index) => {
      if (!isNonEmptyString(blank.id)) {
        errors.push(createError(`blanks[${index}].id`, 'Blank ID is required', 'REQUIRED_FIELD'));
      }

      if (typeof blank.position !== 'number') {
        errors.push(createError(`blanks[${index}].position`, 'Position must be a number', 'INVALID_TYPE'));
      }

      if (!Array.isArray(blank.acceptableAnswers) || blank.acceptableAnswers.length === 0) {
        errors.push(createError(`blanks[${index}].acceptableAnswers`, 'Must have at least one acceptable answer', 'NO_ANSWERS'));
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates drag and drop question data
 */
function validateDragAndDropData(data: DragAndDropData): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data.items)) {
    errors.push(createError('items', 'Items must be an array', 'INVALID_TYPE'));
  } else if (data.items.length === 0) {
    errors.push(createError('items', 'Must have at least one item', 'NO_ITEMS'));
  }

  if (!Array.isArray(data.targets)) {
    errors.push(createError('targets', 'Targets must be an array', 'INVALID_TYPE'));
  } else if (data.targets.length === 0) {
    errors.push(createError('targets', 'Must have at least one target', 'NO_TARGETS'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates sentence builder question data
 */
function validateSentenceBuilderData(data: SentenceBuilderData): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!Array.isArray(data.words)) {
    errors.push(createError('words', 'Words must be an array', 'INVALID_TYPE'));
  } else {
    if (data.words.length < 3) {
      errors.push(createError('words', 'Must have at least 3 words', 'INSUFFICIENT_WORDS'));
    } else if (data.words.length > 15) {
      warnings.push(createWarning('words', 'More than 15 words may be too complex', 'TOO_MANY_WORDS'));
    }

    const emptyWords = data.words.filter(word => !isNonEmptyString(word));
    if (emptyWords.length > 0) {
      errors.push(createError('words', 'All words must be non-empty strings', 'EMPTY_WORD'));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates essay question data
 */
function validateEssayData(data: EssayData): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (!isNonEmptyString(data.prompt)) {
    errors.push(createError('prompt', 'Prompt is required and must be non-empty', 'REQUIRED_FIELD'));
  }

  if (data.minWords !== undefined && !isPositiveNumber(data.minWords)) {
    errors.push(createError('minWords', 'Minimum words must be positive', 'INVALID_VALUE'));
  }

  if (data.maxWords !== undefined && !isPositiveNumber(data.maxWords)) {
    errors.push(createError('maxWords', 'Maximum words must be positive', 'INVALID_VALUE'));
  }

  if (data.minWords && data.maxWords && data.minWords > data.maxWords) {
    errors.push(createError('wordLimits', 'Minimum words cannot exceed maximum words', 'INVALID_RANGE'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ===== COMPOSITE VALIDATORS =====

/**
 * Validates a complete lesson with all its components
 */
export function validateLessonComplete(
  lesson: Partial<Lesson>,
  objectives: Partial<LearningObjective>[],
  exercises: Partial<Exercise>[]
): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate the lesson itself
  const lessonValidation = validateLesson(lesson);
  errors.push(...lessonValidation.errors);
  warnings.push(...lessonValidation.warnings);

  // Validate objectives
  objectives.forEach((objective, index) => {
    const validation = validateLearningObjective(objective);
    validation.errors.forEach(error => 
      errors.push(createError(`objectives[${index}].${error.field}`, error.message, error.code))
    );
    validation.warnings.forEach(warning => 
      warnings.push(createWarning(`objectives[${index}].${warning.field}`, warning.message, warning.code))
    );
  });

  // Validate exercises
  exercises.forEach((exercise, index) => {
    const validation = validateExercise(exercise);
    validation.errors.forEach(error => 
      errors.push(createError(`exercises[${index}].${error.field}`, error.message, error.code))
    );
    validation.warnings.forEach(warning => 
      warnings.push(createWarning(`exercises[${index}].${warning.field}`, warning.message, warning.code))
    );
  });

  // Check relationships
  if (objectives.length === 0) {
    warnings.push(createWarning('content', 'Lesson should have at least one learning objective', 'NO_OBJECTIVES'));
  }

  if (exercises.length === 0) {
    warnings.push(createWarning('content', 'Lesson should have at least one exercise', 'NO_EXERCISES'));
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates content hierarchy (unit -> lessons -> objectives)
 */
export function validateContentHierarchy(
  unit: Partial<Unit>,
  lessons: Partial<Lesson>[]
): ContentValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate unit
  const unitValidation = validateUnit(unit);
  errors.push(...unitValidation.errors);
  warnings.push(...unitValidation.warnings);

  // Validate lessons
  lessons.forEach((lesson, index) => {
    const validation = validateLesson(lesson);
    validation.errors.forEach(error => 
      errors.push(createError(`lessons[${index}].${error.field}`, error.message, error.code))
    );
    validation.warnings.forEach(warning => 
      warnings.push(createWarning(`lessons[${index}].${warning.field}`, warning.message, warning.code))
    );

    // Check lesson belongs to unit
    if (lesson.unitId !== unit.id) {
      errors.push(createError(`lessons[${index}].unitId`, 'Lesson must belong to the unit', 'MISMATCHED_UNIT'));
    }
  });

  // Check unit has lessons
  if (lessons.length === 0) {
    warnings.push(createWarning('content', 'Unit should have at least one lesson', 'NO_LESSONS'));
  }

  // Check order indices are sequential
  const orderIndices = lessons.map(l => l.orderIndex).filter(i => typeof i === 'number').sort((a, b) => a - b);
  for (let i = 0; i < orderIndices.length - 1; i++) {
    if (orderIndices[i + 1] - orderIndices[i] > 1) {
      warnings.push(createWarning('lessons', 'Lesson order indices should be sequential', 'NON_SEQUENTIAL_ORDER'));
      break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}