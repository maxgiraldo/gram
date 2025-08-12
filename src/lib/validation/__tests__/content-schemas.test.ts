/**
 * Tests for content validation schemas
 */

import { describe, test, expect } from 'vitest';
import {
  validateUnit,
  validateLesson,
  validateLearningObjective,
  validateExercise,
  validateAssessment,
  validateQuestionData,
  validateLessonComplete,
  validateContentHierarchy,
} from '../content-schemas';
import {
  type Unit,
  type Lesson,
  type LearningObjective,
  type Exercise,
  type Assessment,
  type MultipleChoiceData,
  type FillInBlankData,
  type DragAndDropData,
  type SentenceBuilderData,
} from '../../../types/content';

describe('Unit Validation', () => {
  test('validates valid unit', () => {
    const unit: Partial<Unit> = {
      title: 'Basic Grammar',
      description: 'Introduction to grammar fundamentals',
      orderIndex: 1,
      masteryThreshold: 0.9,
      prerequisiteUnits: [],
    };

    const result = validateUnit(unit);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('requires title and description', () => {
    const unit: Partial<Unit> = {
      orderIndex: 1,
      masteryThreshold: 0.9,
    };

    const result = validateUnit(unit);
    expect(result.isValid).toBe(false);
    expect(result.errors).toHaveLength(2);
    expect(result.errors.some(e => e.field === 'title')).toBe(true);
    expect(result.errors.some(e => e.field === 'description')).toBe(true);
  });

  test('validates mastery threshold range', () => {
    const unit: Partial<Unit> = {
      title: 'Test',
      description: 'Test',
      orderIndex: 1,
      masteryThreshold: 1.5, // Invalid: > 1
    };

    const result = validateUnit(unit);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'masteryThreshold' && e.code === 'INVALID_RANGE')).toBe(true);
  });

  test('warns about low mastery threshold', () => {
    const unit: Partial<Unit> = {
      title: 'Test',
      description: 'Test',
      orderIndex: 1,
      masteryThreshold: 0.5, // Low threshold
    };

    const result = validateUnit(unit);
    expect(result.isValid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe('LOW_THRESHOLD');
  });
});

describe('Lesson Validation', () => {
  test('validates valid lesson', () => {
    const lesson: Partial<Lesson> = {
      title: 'Introduction to Nouns',
      description: 'Learn about nouns',
      content: 'Detailed lesson content...',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('requires essential fields', () => {
    const lesson: Partial<Lesson> = {
      estimatedMinutes: 30,
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    
    const requiredFields = ['title', 'description', 'content', 'unitId'];
    requiredFields.forEach(field => {
      expect(result.errors.some(e => e.field === field && e.code === 'REQUIRED_FIELD')).toBe(true);
    });
  });

  test('validates difficulty enum', () => {
    const lesson: Partial<Lesson> = {
      title: 'Test',
      description: 'Test',
      content: 'Test content',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'invalid' as any,
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'difficulty' && e.code === 'INVALID_ENUM')).toBe(true);
  });

  test('warns about long lessons', () => {
    const lesson: Partial<Lesson> = {
      title: 'Test',
      description: 'Test',
      content: 'Test content',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 150, // Over 2 hours
      difficulty: 'beginner',
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LONG_LESSON')).toBe(true);
  });
});

describe('Learning Objective Validation', () => {
  test('validates valid objective', () => {
    const objective: Partial<LearningObjective> = {
      title: 'Identify Nouns',
      description: 'Students will identify nouns in sentences',
      category: 'knowledge',
      masteryThreshold: 0.8,
      lessonId: 'lesson-1',
    };

    const result = validateLearningObjective(objective);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates category enum', () => {
    const objective: Partial<LearningObjective> = {
      title: 'Test',
      description: 'Test',
      category: 'invalid' as any,
      masteryThreshold: 0.8,
    };

    const result = validateLearningObjective(objective);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'category' && e.code === 'INVALID_ENUM')).toBe(true);
  });

  test('warns about missing relationships', () => {
    const objective: Partial<LearningObjective> = {
      title: 'Test',
      description: 'Test',
      category: 'knowledge',
      masteryThreshold: 0.8,
      // No unitId or lessonId
    };

    const result = validateLearningObjective(objective);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'MISSING_RELATIONSHIP')).toBe(true);
  });
});

describe('Exercise Validation', () => {
  test('validates valid exercise', () => {
    const exercise: Partial<Exercise> = {
      title: 'Noun Practice',
      lessonId: 'lesson-1',
      type: 'practice',
      orderIndex: 1,
      maxAttempts: 3,
      difficulty: 'beginner',
    };

    const result = validateExercise(exercise);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates exercise type enum', () => {
    const exercise: Partial<Exercise> = {
      title: 'Test',
      lessonId: 'lesson-1',
      type: 'invalid' as any,
      orderIndex: 1,
      maxAttempts: 3,
      difficulty: 'beginner',
    };

    const result = validateExercise(exercise);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'type' && e.code === 'INVALID_ENUM')).toBe(true);
  });

  test('warns about high attempt count', () => {
    const exercise: Partial<Exercise> = {
      title: 'Test',
      lessonId: 'lesson-1',
      type: 'practice',
      orderIndex: 1,
      maxAttempts: 15, // Very high
      difficulty: 'beginner',
    };

    const result = validateExercise(exercise);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'HIGH_ATTEMPTS')).toBe(true);
  });
});

describe('Assessment Validation', () => {
  test('validates valid assessment', () => {
    const assessment: Partial<Assessment> = {
      title: 'Nouns Quiz',
      type: 'formative',
      maxAttempts: 2,
      masteryThreshold: 0.8,
    };

    const result = validateAssessment(assessment);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates assessment type enum', () => {
    const assessment: Partial<Assessment> = {
      title: 'Test',
      type: 'invalid' as any,
      maxAttempts: 2,
      masteryThreshold: 0.8,
    };

    const result = validateAssessment(assessment);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'type' && e.code === 'INVALID_ENUM')).toBe(true);
  });

  test('validates retention check delay', () => {
    const assessment: Partial<Assessment> = {
      title: 'Retention Check',
      type: 'retention_check',
      maxAttempts: 2,
      masteryThreshold: 0.8,
      scheduledDelay: 400, // Over a year
    };

    const result = validateAssessment(assessment);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'LONG_DELAY')).toBe(true);
  });
});

describe('Question Data Validation', () => {
  test('validates multiple choice data', () => {
    const data: MultipleChoiceData = {
      type: 'multiple_choice',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      shuffleOptions: true,
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('requires minimum options for multiple choice', () => {
    const data: MultipleChoiceData = {
      type: 'multiple_choice',
      options: ['Only one option'],
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INSUFFICIENT_OPTIONS')).toBe(true);
  });

  test('warns about too many options', () => {
    const data: MultipleChoiceData = {
      type: 'multiple_choice',
      options: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], // 8 options
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'TOO_MANY_OPTIONS')).toBe(true);
  });

  test('validates fill in blank data', () => {
    const data: FillInBlankData = {
      type: 'fill_in_blank',
      template: 'The {blank1} is {blank2}.',
      blanks: [
        {
          id: 'blank1',
          position: 1,
          acceptableAnswers: ['cat', 'dog'],
          caseSensitive: false,
        },
        {
          id: 'blank2',
          position: 2,
          acceptableAnswers: ['running', 'sleeping'],
          caseSensitive: false,
        },
      ],
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('requires blanks for fill in blank', () => {
    const data: FillInBlankData = {
      type: 'fill_in_blank',
      template: 'No blanks here.',
      blanks: [],
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'NO_BLANKS')).toBe(true);
  });

  test('validates drag and drop data', () => {
    const data: DragAndDropData = {
      type: 'drag_and_drop',
      items: [
        { id: 'item1', content: 'Cat', category: 'animal' },
        { id: 'item2', content: 'Car', category: 'vehicle' },
      ],
      targets: [
        { id: 'target1', label: 'Animals', acceptsCategory: 'animal' },
        { id: 'target2', label: 'Vehicles', acceptsCategory: 'vehicle' },
      ],
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('validates sentence builder data', () => {
    const data: SentenceBuilderData = {
      type: 'sentence_builder',
      words: ['The', 'cat', 'is', 'sleeping', '.'],
      shuffleWords: true,
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('requires minimum words for sentence builder', () => {
    const data: SentenceBuilderData = {
      type: 'sentence_builder',
      words: ['Cat', '.'], // Only 2 words
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'INSUFFICIENT_WORDS')).toBe(true);
  });

  test('warns about too many words', () => {
    const data: SentenceBuilderData = {
      type: 'sentence_builder',
      words: Array.from({length: 20}, (_, i) => `word${i}`), // 20 words
    };

    const result = validateQuestionData(data);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'TOO_MANY_WORDS')).toBe(true);
  });
});

describe('Composite Validation', () => {
  test('validates complete lesson structure', () => {
    const lesson: Partial<Lesson> = {
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
    };

    const objectives: Partial<LearningObjective>[] = [
      {
        title: 'Objective 1',
        description: 'Test objective',
        category: 'knowledge',
        masteryThreshold: 0.8,
      },
    ];

    const exercises: Partial<Exercise>[] = [
      {
        title: 'Exercise 1',
        lessonId: 'lesson-1',
        type: 'practice',
        orderIndex: 1,
        maxAttempts: 3,
        difficulty: 'beginner',
      },
    ];

    const result = validateLessonComplete(lesson, objectives, exercises);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('warns about lessons without objectives or exercises', () => {
    const lesson: Partial<Lesson> = {
      title: 'Test Lesson',
      description: 'Test Description',
      content: 'Test Content',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
    };

    const result = validateLessonComplete(lesson, [], []);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'NO_OBJECTIVES')).toBe(true);
    expect(result.warnings.some(w => w.code === 'NO_EXERCISES')).toBe(true);
  });

  test('validates content hierarchy', () => {
    const unit: Partial<Unit> = {
      id: 'unit-1',
      title: 'Test Unit',
      description: 'Test Description',
      orderIndex: 1,
      masteryThreshold: 0.9,
    };

    const lessons: Partial<Lesson>[] = [
      {
        unitId: 'unit-1',
        title: 'Lesson 1',
        description: 'Test Lesson',
        content: 'Content',
        orderIndex: 1,
        masteryThreshold: 0.8,
        estimatedMinutes: 30,
        difficulty: 'beginner',
      },
      {
        unitId: 'unit-1',
        title: 'Lesson 2',
        description: 'Test Lesson 2',
        content: 'Content 2',
        orderIndex: 2,
        masteryThreshold: 0.8,
        estimatedMinutes: 30,
        difficulty: 'beginner',
      },
    ];

    const result = validateContentHierarchy(unit, lessons);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  test('detects mismatched unit relationships', () => {
    const unit: Partial<Unit> = {
      id: 'unit-1',
      title: 'Test Unit',
      description: 'Test Description',
      orderIndex: 1,
      masteryThreshold: 0.9,
    };

    const lessons: Partial<Lesson>[] = [
      {
        unitId: 'unit-2', // Wrong unit ID
        title: 'Lesson 1',
        description: 'Test Lesson',
        content: 'Content',
        orderIndex: 1,
        masteryThreshold: 0.8,
        estimatedMinutes: 30,
        difficulty: 'beginner',
      },
    ];

    const result = validateContentHierarchy(unit, lessons);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.code === 'MISMATCHED_UNIT')).toBe(true);
  });

  test('warns about non-sequential order indices', () => {
    const unit: Partial<Unit> = {
      id: 'unit-1',
      title: 'Test Unit',
      description: 'Test Description',
      orderIndex: 1,
      masteryThreshold: 0.9,
    };

    const lessons: Partial<Lesson>[] = [
      {
        unitId: 'unit-1',
        title: 'Lesson 1',
        description: 'Test Lesson',
        content: 'Content',
        orderIndex: 1,
        masteryThreshold: 0.8,
        estimatedMinutes: 30,
        difficulty: 'beginner',
      },
      {
        unitId: 'unit-1',
        title: 'Lesson 2',
        description: 'Test Lesson 2',
        content: 'Content 2',
        orderIndex: 5, // Gap in sequence
        masteryThreshold: 0.8,
        estimatedMinutes: 30,
        difficulty: 'beginner',
      },
    ];

    const result = validateContentHierarchy(unit, lessons);
    expect(result.isValid).toBe(true);
    expect(result.warnings.some(w => w.code === 'NON_SEQUENTIAL_ORDER')).toBe(true);
  });
});

describe('Edge Cases', () => {
  test('handles empty strings as invalid', () => {
    const lesson: Partial<Lesson> = {
      title: '',
      description: '   ', // Whitespace only
      content: 'Valid content',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'title')).toBe(true);
    expect(result.errors.some(e => e.field === 'description')).toBe(true);
  });

  test('handles null and undefined values', () => {
    const lesson: Partial<Lesson> = {
      title: null as any,
      description: undefined as any,
      content: 'Valid content',
      unitId: 'unit-1',
      orderIndex: 1,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  test('handles invalid numeric values', () => {
    const lesson: Partial<Lesson> = {
      title: 'Valid Title',
      description: 'Valid Description',
      content: 'Valid content',
      unitId: 'unit-1',
      orderIndex: -1, // Negative
      masteryThreshold: 0.8,
      estimatedMinutes: -5, // Negative
      difficulty: 'beginner',
    };

    const result = validateLesson(lesson);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.field === 'orderIndex')).toBe(true);
    expect(result.errors.some(e => e.field === 'estimatedMinutes')).toBe(true);
  });
});