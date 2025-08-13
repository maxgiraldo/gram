/**
 * Exercise API Tests
 * 
 * Comprehensive test suite for exercise API endpoints, validation logic,
 * and database operations.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { 
  createExercise,
  getExerciseById,
  getExercisesByLesson,
  updateExercise,
  deleteExercise,
  createExerciseQuestion,
  createExerciseAttempt,
  createExerciseResponse,
  completeExerciseAttempt,
  getExerciseStats,
  type CreateExerciseData,
  type CreateExerciseQuestionData,
  type CreateExerciseAttemptData,
  type CreateExerciseResponseData
} from '../../db/queries/exercises';
import { 
  validateExerciseResponse,
  generateHint,
  needsRemediation,
  isEligibleForEnrichment
} from '../validation';
import { prisma } from '../../db/client';

// Test data
const mockUnitData = {
  title: 'Test Unit',
  description: 'Test unit for exercises',
  orderIndex: 1,
  masteryThreshold: 0.9
};

const mockLessonData = {
  title: 'Test Lesson',
  description: 'Test lesson for exercises',
  content: 'Test content',
  orderIndex: 1,
  masteryThreshold: 0.8,
  estimatedMinutes: 30,
  difficulty: 'beginner' as const
};

const mockExerciseData: Omit<CreateExerciseData, 'lessonId'> = {
  title: 'Test Exercise',
  description: 'Test exercise description',
  type: 'practice',
  orderIndex: 1,
  timeLimit: 300,
  maxAttempts: 3,
  difficulty: 'beginner'
};

let testUnitId: string;
let testLessonId: string;
let testExerciseId: string;
let testQuestionId: string;

describe('Exercise Database Operations', () => {
  beforeEach(async () => {
    // Create test unit
    const unit = await prisma.unit.create({ data: mockUnitData });
    testUnitId = unit.id;
    
    // Create test lesson
    const lesson = await prisma.lesson.create({ 
      data: { ...mockLessonData, unitId: testUnitId }
    });
    testLessonId = lesson.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.exerciseResponse.deleteMany();
    await prisma.exerciseAttempt.deleteMany();
    await prisma.exerciseQuestion.deleteMany();
    await prisma.exercise.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.unit.deleteMany();
  });

  describe('Exercise CRUD Operations', () => {
    test('should create exercise successfully', async () => {
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };

      const exercise = await createExercise(exerciseData);

      expect(exercise).toBeDefined();
      expect(exercise.title).toBe(exerciseData.title);
      expect(exercise.lessonId).toBe(testLessonId);
      expect(exercise.type).toBe('practice');
      expect(exercise.maxAttempts).toBe(3);
      
      testExerciseId = exercise.id;
    });

    test('should get exercise by ID with relations', async () => {
      // Create exercise first
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };
      const createdExercise = await createExercise(exerciseData);
      
      const exercise = await getExerciseById(createdExercise.id);
      
      expect(exercise).toBeDefined();
      expect(exercise!.id).toBe(createdExercise.id);
      expect(exercise!.lesson).toBeDefined();
      expect(exercise!.lesson!.title).toBe(mockLessonData.title);
      expect(exercise!.questions).toEqual([]);
    });

    test('should get exercises by lesson', async () => {
      // Create multiple exercises
      const exercise1Data: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId,
        orderIndex: 1
      };
      const exercise2Data: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId,
        title: 'Second Exercise',
        orderIndex: 2
      };

      await createExercise(exercise1Data);
      await createExercise(exercise2Data);

      const exercises = await getExercisesByLesson(testLessonId);

      expect(exercises).toHaveLength(2);
      expect(exercises[0].orderIndex).toBe(1);
      expect(exercises[1].orderIndex).toBe(2);
      expect(exercises[1].title).toBe('Second Exercise');
    });

    test('should update exercise', async () => {
      // Create exercise first
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };
      const createdExercise = await createExercise(exerciseData);

      const updatedExercise = await updateExercise(createdExercise.id, {
        title: 'Updated Title',
        difficulty: 'intermediate',
        maxAttempts: 5
      });

      expect(updatedExercise.title).toBe('Updated Title');
      expect(updatedExercise.difficulty).toBe('intermediate');
      expect(updatedExercise.maxAttempts).toBe(5);
    });

    test('should delete exercise', async () => {
      // Create exercise first
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };
      const createdExercise = await createExercise(exerciseData);

      await deleteExercise(createdExercise.id);

      const deletedExercise = await getExerciseById(createdExercise.id);
      expect(deletedExercise).toBeNull();
    });

    test('should prevent duplicate order indexes', async () => {
      // Create first exercise
      const exercise1Data: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId,
        orderIndex: 1
      };
      await createExercise(exercise1Data);

      // Try to create second exercise with same order index
      const exercise2Data: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId,
        title: 'Second Exercise',
        orderIndex: 1
      };

      await expect(createExercise(exercise2Data)).rejects.toThrow();
    });
  });

  describe('Exercise Question Operations', () => {
    beforeEach(async () => {
      // Create test exercise
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };
      const exercise = await createExercise(exerciseData);
      testExerciseId = exercise.id;
    });

    test('should create multiple choice question', async () => {
      const questionData: CreateExerciseQuestionData = {
        exerciseId: testExerciseId,
        questionText: 'What is a noun?',
        type: 'multiple_choice',
        orderIndex: 1,
        points: 1,
        questionData: {
          type: 'multiple_choice',
          options: ['A word that describes action', 'A word that names a person, place, or thing', 'A word that describes a noun', 'A connecting word'],
          shuffleOptions: true
        },
        correctAnswer: 'A word that names a person, place, or thing',
        hints: ['Think about naming words'],
        correctFeedback: 'Correct! A noun names a person, place, or thing.',
        incorrectFeedback: 'Not quite. Think about what nouns name.'
      };

      const question = await createExerciseQuestion(questionData);

      expect(question).toBeDefined();
      expect(question.questionText).toBe(questionData.questionText);
      expect(question.type).toBe('multiple_choice');
      expect(question.points).toBe(1);
      
      testQuestionId = question.id;
    });

    test('should create fill in blank question', async () => {
      const questionData: CreateExerciseQuestionData = {
        exerciseId: testExerciseId,
        questionText: 'Complete the sentence with the correct noun.',
        type: 'fill_in_blank',
        orderIndex: 1,
        questionData: {
          type: 'fill_in_blank',
          template: 'The {blank1} ran through the {blank2}.',
          blanks: [
            {
              id: 'blank1',
              position: 1,
              acceptableAnswers: ['dog', 'cat', 'animal'],
              caseSensitive: false
            },
            {
              id: 'blank2',
              position: 2,
              acceptableAnswers: ['park', 'yard', 'garden'],
              caseSensitive: false
            }
          ]
        },
        correctAnswer: { blank1: ['dog', 'cat', 'animal'], blank2: ['park', 'yard', 'garden'] }
      };

      const question = await createExerciseQuestion(questionData);

      expect(question).toBeDefined();
      expect(question.type).toBe('fill_in_blank');
      
      const parsedQuestionData = JSON.parse(question.questionData);
      expect(parsedQuestionData.blanks).toHaveLength(2);
    });
  });

  describe('Exercise Attempt Operations', () => {
    const mockUserId = 'test-user-123';

    beforeEach(async () => {
      // Create test exercise with question
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };
      const exercise = await createExercise(exerciseData);
      testExerciseId = exercise.id;

      const questionData: CreateExerciseQuestionData = {
        exerciseId: testExerciseId,
        questionText: 'Test question',
        type: 'multiple_choice',
        orderIndex: 1,
        questionData: {
          type: 'multiple_choice',
          options: ['A', 'B', 'C', 'D']
        },
        correctAnswer: 'B'
      };
      const question = await createExerciseQuestion(questionData);
      testQuestionId = question.id;
    });

    test('should create exercise attempt', async () => {
      const attemptData: CreateExerciseAttemptData = {
        userId: mockUserId,
        exerciseId: testExerciseId
      };

      const attempt = await createExerciseAttempt(attemptData);

      expect(attempt).toBeDefined();
      expect(attempt.userId).toBe(mockUserId);
      expect(attempt.exerciseId).toBe(testExerciseId);
      expect(attempt.totalQuestions).toBe(1);
      expect(attempt.correctAnswers).toBe(0);
      expect(attempt.isPassed).toBe(false);
    });

    test('should create exercise response', async () => {
      // Create attempt first
      const attemptData: CreateExerciseAttemptData = {
        userId: mockUserId,
        exerciseId: testExerciseId
      };
      const attempt = await createExerciseAttempt(attemptData);

      const responseData: CreateExerciseResponseData = {
        attemptId: attempt.id,
        questionId: testQuestionId,
        response: 'B',
        isCorrect: true,
        points: 1,
        timeSpent: 15000,
        hintsUsed: 0,
        feedback: 'Correct!'
      };

      const response = await createExerciseResponse(responseData);

      expect(response).toBeDefined();
      expect(response.response).toBe('"B"'); // JSON stringified
      expect(response.isCorrect).toBe(true);
      expect(response.points).toBe(1);
    });

    test('should complete exercise attempt with scoring', async () => {
      // Create attempt and response
      const attemptData: CreateExerciseAttemptData = {
        userId: mockUserId,
        exerciseId: testExerciseId
      };
      const attempt = await createExerciseAttempt(attemptData);

      const responseData: CreateExerciseResponseData = {
        attemptId: attempt.id,
        questionId: testQuestionId,
        response: 'B',
        isCorrect: true,
        points: 1,
        timeSpent: 15000,
        hintsUsed: 0
      };
      await createExerciseResponse(responseData);

      const completedAttempt = await completeExerciseAttempt(attempt.id);

      expect(completedAttempt.completedAt).toBeDefined();
      expect(completedAttempt.totalQuestions).toBe(1);
      expect(completedAttempt.correctAnswers).toBe(1);
      expect(completedAttempt.scorePercentage).toBe(100);
      expect(completedAttempt.isPassed).toBe(true);
    });

    test('should enforce max attempts limit', async () => {
      // Create attempts up to the limit
      for (let i = 0; i < 3; i++) {
        const attemptData: CreateExerciseAttemptData = {
          userId: mockUserId,
          exerciseId: testExerciseId
        };
        await createExerciseAttempt(attemptData);
      }

      // Try to create one more attempt (should fail)
      const attemptData: CreateExerciseAttemptData = {
        userId: mockUserId,
        exerciseId: testExerciseId
      };

      await expect(createExerciseAttempt(attemptData)).rejects.toThrow();
    });
  });

  describe('Exercise Statistics', () => {
    const mockUserId = 'test-user-123';

    beforeEach(async () => {
      // Create test exercise with question
      const exerciseData: CreateExerciseData = {
        ...mockExerciseData,
        lessonId: testLessonId
      };
      const exercise = await createExercise(exerciseData);
      testExerciseId = exercise.id;

      const questionData: CreateExerciseQuestionData = {
        exerciseId: testExerciseId,
        questionText: 'Test question',
        type: 'multiple_choice',
        orderIndex: 1,
        questionData: {
          type: 'multiple_choice',
          options: ['A', 'B', 'C', 'D']
        },
        correctAnswer: 'B'
      };
      await createExerciseQuestion(questionData);
    });

    test('should calculate exercise statistics', async () => {
      // Create multiple attempts with different outcomes
      const attempts = [];
      for (let i = 0; i < 3; i++) {
        const attemptData: CreateExerciseAttemptData = {
          userId: `${mockUserId}-${i}`,
          exerciseId: testExerciseId
        };
        const attempt = await createExerciseAttempt(attemptData);
        attempts.push(attempt);
      }

      // Complete attempts with different scores
      await prisma.exerciseAttempt.update({
        where: { id: attempts[0].id },
        data: { completedAt: new Date(), scorePercentage: 100, isPassed: true }
      });
      await prisma.exerciseAttempt.update({
        where: { id: attempts[1].id },
        data: { completedAt: new Date(), scorePercentage: 75, isPassed: false }
      });
      // Leave third attempt incomplete

      const stats = await getExerciseStats(testExerciseId);

      expect(stats.totalAttempts).toBe(3);
      expect(stats.completedAttempts).toBe(2);
      expect(stats.averageScore).toBe(87.5); // (100 + 75) / 2
      expect(stats.passRate).toBe(50); // 1 passed out of 2 completed
    });
  });
});

describe('Exercise Validation Logic', () => {
  const mockQuestion = {
    id: 'test-question',
    exerciseId: 'test-exercise',
    questionText: 'Test question',
    type: 'multiple_choice' as const,
    orderIndex: 1,
    points: 1,
    questionData: {
      type: 'multiple_choice' as const,
      options: ['Option A', 'Option B', 'Option C', 'Option D']
    },
    correctAnswer: 'Option B',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('Multiple Choice Validation', () => {
    test('should validate correct answer', () => {
      const result = validateExerciseResponse(mockQuestion, 'Option B');

      expect(result.isCorrect).toBe(true);
      expect(result.points).toBe(1);
      expect(result.feedback).toContain('Correct');
    });

    test('should validate incorrect answer', () => {
      const result = validateExerciseResponse(mockQuestion, 'Option A');

      expect(result.isCorrect).toBe(false);
      expect(result.points).toBe(0);
      expect(result.feedback).toContain('not quite right');
    });

    test('should handle case insensitive validation', () => {
      const result = validateExerciseResponse(mockQuestion, 'option b', {
        caseSensitive: false
      });

      expect(result.isCorrect).toBe(true);
    });
  });

  describe('Fill in Blank Validation', () => {
    const fillInBlankQuestion = {
      ...mockQuestion,
      type: 'fill_in_blank' as const,
      questionData: {
        type: 'fill_in_blank' as const,
        template: 'The {blank1} is {blank2}.',
        blanks: [
          {
            id: 'blank1',
            position: 1,
            acceptableAnswers: ['dog', 'cat'],
            caseSensitive: false
          },
          {
            id: 'blank2',
            position: 2,
            acceptableAnswers: ['running', 'sleeping'],
            caseSensitive: false
          }
        ]
      },
      correctAnswer: { blank1: ['dog', 'cat'], blank2: ['running', 'sleeping'] }
    };

    test('should validate all correct blanks', () => {
      const userResponse = {
        blank1: 'dog',
        blank2: 'running'
      };

      const result = validateExerciseResponse(fillInBlankQuestion, userResponse);

      expect(result.isCorrect).toBe(true);
      expect(result.points).toBe(2);
      expect(result.feedback).toContain('Perfect');
    });

    test('should handle partial credit', () => {
      const userResponse = {
        blank1: 'dog',
        blank2: 'wrong'
      };

      const result = validateExerciseResponse(fillInBlankQuestion, userResponse, {
        allowPartialCredit: true
      });

      expect(result.isCorrect).toBe(false);
      expect(result.points).toBe(1); // 50% of 2 points
      expect(result.partialCredit).toBe(0.5);
    });

    test('should provide error details', () => {
      const userResponse = {
        blank1: 'wrong1',
        blank2: 'wrong2'
      };

      const result = validateExerciseResponse(fillInBlankQuestion, userResponse);

      expect(result.isCorrect).toBe(false);
      expect(result.errorDetails).toBeDefined();
      expect(result.errorDetails!.length).toBe(2);
    });
  });

  describe('Sentence Builder Validation', () => {
    const sentenceBuilderQuestion = {
      ...mockQuestion,
      type: 'sentence_builder' as const,
      questionData: {
        type: 'sentence_builder' as const,
        words: ['The', 'dog', 'is', 'running'],
        shuffleWords: true
      },
      correctAnswer: 'The dog is running'
    };

    test('should validate correct sentence order', () => {
      const userResponse = ['The', 'dog', 'is', 'running'];

      const result = validateExerciseResponse(sentenceBuilderQuestion, userResponse);

      expect(result.isCorrect).toBe(true);
      expect(result.points).toBe(1);
    });

    test('should handle flexible word order', () => {
      const userResponse = ['Running', 'is', 'the', 'dog']; // Different but uses same words

      const result = validateExerciseResponse(sentenceBuilderQuestion, userResponse, {
        strictMatching: false
      });

      expect(result.isCorrect).toBe(true);
    });

    test('should enforce strict matching when required', () => {
      const userResponse = ['Running', 'is', 'the', 'dog'];

      const result = validateExerciseResponse(sentenceBuilderQuestion, userResponse, {
        strictMatching: true
      });

      expect(result.isCorrect).toBe(false);
    });
  });

  describe('Hint Generation', () => {
    test('should use predefined hints', () => {
      const questionWithHints = {
        ...mockQuestion,
        hints: ['Think about grammar rules', 'Consider the lesson content']
      };

      const hint = generateHint(questionWithHints, 'wrong answer', 1);

      expect(hint).toBe('Think about grammar rules');
    });

    test('should generate generic hints for multiple choice', () => {
      const hint = generateHint(mockQuestion, 'wrong answer', 1);

      expect(hint).toContain('Look carefully at each option');
    });

    test('should return second hint when requested', () => {
      const questionWithHints = {
        ...mockQuestion,
        hints: ['First hint', 'Second hint']
      };

      const hint = generateHint(questionWithHints, 'wrong answer', 2);

      expect(hint).toBe('Second hint');
    });
  });

  describe('Performance Analysis', () => {
    test('should identify need for remediation', () => {
      const poorResults = [
        { isCorrect: false, points: 0, maxPoints: 1, feedback: '' },
        { isCorrect: false, points: 0, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: false, points: 0, maxPoints: 1, feedback: '' },
        { isCorrect: false, points: 0, maxPoints: 1, feedback: '' }
      ];

      const needsHelp = needsRemediation(poorResults);

      expect(needsHelp).toBe(true);
    });

    test('should identify eligibility for enrichment', () => {
      const excellentResults = [
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' }
      ];

      const eligible = isEligibleForEnrichment(excellentResults);

      expect(eligible).toBe(true);
    });

    test('should handle average performance', () => {
      const averageResults = [
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: false, points: 0, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: true, points: 1, maxPoints: 1, feedback: '' },
        { isCorrect: false, points: 0, maxPoints: 1, feedback: '' }
      ];

      const needsHelp = needsRemediation(averageResults);
      const eligible = isEligibleForEnrichment(averageResults);

      expect(needsHelp).toBe(false);
      expect(eligible).toBe(false);
    });
  });
});