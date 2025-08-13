/**
 * Exercise Database Queries
 * 
 * Database operations for exercises, exercise questions, attempts, and responses.
 * Handles exercise lifecycle, submission, validation, and performance tracking.
 */

import { prisma, executeQuery, executeTransaction, ValidationError, NotFoundError } from '../client';
import type { 
  Exercise, 
  ExerciseQuestion, 
  ExerciseAttempt, 
  ExerciseResponse,
  QuestionData,
  CorrectAnswer
} from '../../types/content';

// ===== EXERCISE CRUD OPERATIONS =====

/**
 * Data for creating a new exercise
 */
export interface CreateExerciseData {
  lessonId: string;
  title: string;
  description?: string;
  type: 'practice' | 'reinforcement' | 'challenge' | 'enrichment';
  orderIndex: number;
  timeLimit?: number;
  maxAttempts?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Data for updating an exercise
 */
export interface UpdateExerciseData {
  title?: string;
  description?: string;
  type?: 'practice' | 'reinforcement' | 'challenge' | 'enrichment';
  orderIndex?: number;
  timeLimit?: number;
  maxAttempts?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Exercise with related data
 */
export interface ExerciseWithRelations extends Exercise {
  lesson?: {
    id: string;
    title: string;
    unitId: string;
  };
  questions: ExerciseQuestion[];
}

/**
 * Create a new exercise
 */
export async function createExercise(data: CreateExerciseData): Promise<Exercise> {
  return executeQuery('createExercise', async () => {
    // Validate lesson exists
    const lesson = await prisma.lesson.findUnique({
      where: { id: data.lessonId }
    });

    if (!lesson) {
      throw new NotFoundError('Lesson', data.lessonId, 'createExercise');
    }

    // Check if order index is already taken
    const existingExercise = await prisma.exercise.findFirst({
      where: {
        lessonId: data.lessonId,
        orderIndex: data.orderIndex
      }
    });

    if (existingExercise) {
      throw new ValidationError('Order index already exists for this lesson', 'createExercise', 'orderIndex');
    }

    return prisma.exercise.create({
      data: {
        lessonId: data.lessonId,
        title: data.title,
        description: data.description,
        type: data.type,
        orderIndex: data.orderIndex,
        timeLimit: data.timeLimit,
        maxAttempts: data.maxAttempts || 3,
        difficulty: data.difficulty || 'beginner'
      }
    });
  });
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(id: string): Promise<ExerciseWithRelations | null> {
  return executeQuery('getExerciseById', async () => {
    return prisma.exercise.findUnique({
      where: { id },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            unitId: true
          }
        },
        questions: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });
  });
}

/**
 * Get exercises by lesson ID
 */
export async function getExercisesByLesson(lessonId: string): Promise<ExerciseWithRelations[]> {
  return executeQuery('getExercisesByLesson', async () => {
    return prisma.exercise.findMany({
      where: { lessonId },
      include: {
        lesson: {
          select: {
            id: true,
            title: true,
            unitId: true
          }
        },
        questions: {
          orderBy: { orderIndex: 'asc' }
        }
      },
      orderBy: { orderIndex: 'asc' }
    });
  });
}

/**
 * Update exercise
 */
export async function updateExercise(id: string, data: UpdateExerciseData): Promise<Exercise> {
  return executeQuery('updateExercise', async () => {
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw new NotFoundError('Exercise', id, 'updateExercise');
    }

    // Check order index conflict if being updated
    if (data.orderIndex !== undefined && data.orderIndex !== exercise.orderIndex) {
      const existingExercise = await prisma.exercise.findFirst({
        where: {
          lessonId: exercise.lessonId,
          orderIndex: data.orderIndex,
          id: { not: id }
        }
      });

      if (existingExercise) {
        throw new ValidationError('Order index already exists for this lesson', 'updateExercise', 'orderIndex');
      }
    }

    return prisma.exercise.update({
      where: { id },
      data
    });
  });
}

/**
 * Delete exercise
 */
export async function deleteExercise(id: string): Promise<void> {
  return executeQuery('deleteExercise', async () => {
    const exercise = await prisma.exercise.findUnique({ where: { id } });
    if (!exercise) {
      throw new NotFoundError('Exercise', id, 'deleteExercise');
    }

    await prisma.exercise.delete({ where: { id } });
  });
}

// ===== EXERCISE QUESTION OPERATIONS =====

/**
 * Data for creating an exercise question
 */
export interface CreateExerciseQuestionData {
  exerciseId: string;
  objectiveId?: string;
  questionText: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder';
  orderIndex: number;
  points?: number;
  timeLimit?: number;
  questionData: QuestionData;
  correctAnswer: CorrectAnswer;
  hints?: string[];
  correctFeedback?: string;
  incorrectFeedback?: string;
}

/**
 * Data for updating an exercise question
 */
export interface UpdateExerciseQuestionData {
  objectiveId?: string;
  questionText?: string;
  type?: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder';
  orderIndex?: number;
  points?: number;
  timeLimit?: number;
  questionData?: QuestionData;
  correctAnswer?: CorrectAnswer;
  hints?: string[];
  correctFeedback?: string;
  incorrectFeedback?: string;
}

/**
 * Create exercise question
 */
export async function createExerciseQuestion(data: CreateExerciseQuestionData): Promise<ExerciseQuestion> {
  return executeQuery('createExerciseQuestion', async () => {
    // Validate exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: data.exerciseId }
    });

    if (!exercise) {
      throw new NotFoundError('Exercise', data.exerciseId, 'createExerciseQuestion');
    }

    // Check order index conflict
    const existingQuestion = await prisma.exerciseQuestion.findFirst({
      where: {
        exerciseId: data.exerciseId,
        orderIndex: data.orderIndex
      }
    });

    if (existingQuestion) {
      throw new ValidationError('Order index already exists for this exercise', 'createExerciseQuestion', 'orderIndex');
    }

    return prisma.exerciseQuestion.create({
      data: {
        exerciseId: data.exerciseId,
        objectiveId: data.objectiveId,
        questionText: data.questionText,
        type: data.type,
        orderIndex: data.orderIndex,
        points: data.points || 1,
        timeLimit: data.timeLimit,
        questionData: JSON.stringify(data.questionData),
        correctAnswer: JSON.stringify(data.correctAnswer),
        hints: data.hints ? JSON.stringify(data.hints) : null,
        correctFeedback: data.correctFeedback,
        incorrectFeedback: data.incorrectFeedback
      }
    });
  });
}

/**
 * Update exercise question
 */
export async function updateExerciseQuestion(id: string, data: UpdateExerciseQuestionData): Promise<ExerciseQuestion> {
  return executeQuery('updateExerciseQuestion', async () => {
    const question = await prisma.exerciseQuestion.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundError('Exercise Question', id, 'updateExerciseQuestion');
    }

    // Check order index conflict if being updated
    if (data.orderIndex !== undefined && data.orderIndex !== question.orderIndex) {
      const existingQuestion = await prisma.exerciseQuestion.findFirst({
        where: {
          exerciseId: question.exerciseId,
          orderIndex: data.orderIndex,
          id: { not: id }
        }
      });

      if (existingQuestion) {
        throw new ValidationError('Order index already exists for this exercise', 'updateExerciseQuestion', 'orderIndex');
      }
    }

    const updateData: any = { ...data };
    
    // Convert objects to JSON strings for database storage
    if (data.questionData) {
      updateData.questionData = JSON.stringify(data.questionData);
    }
    if (data.correctAnswer) {
      updateData.correctAnswer = JSON.stringify(data.correctAnswer);
    }
    if (data.hints) {
      updateData.hints = JSON.stringify(data.hints);
    }

    return prisma.exerciseQuestion.update({
      where: { id },
      data: updateData
    });
  });
}

/**
 * Delete exercise question
 */
export async function deleteExerciseQuestion(id: string): Promise<void> {
  return executeQuery('deleteExerciseQuestion', async () => {
    const question = await prisma.exerciseQuestion.findUnique({ where: { id } });
    if (!question) {
      throw new NotFoundError('Exercise Question', id, 'deleteExerciseQuestion');
    }

    await prisma.exerciseQuestion.delete({ where: { id } });
  });
}

// ===== EXERCISE ATTEMPT OPERATIONS =====

/**
 * Data for creating an exercise attempt
 */
export interface CreateExerciseAttemptData {
  userId: string;
  exerciseId: string;
}

/**
 * Data for updating an exercise attempt
 */
export interface UpdateExerciseAttemptData {
  completedAt?: Date;
  timeSpent?: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  isPassed: boolean;
}

/**
 * Exercise attempt with relations
 */
export interface ExerciseAttemptWithRelations extends ExerciseAttempt {
  exercise: {
    id: string;
    title: string;
    masteryThreshold: number;
    lesson: {
      id: string;
      title: string;
    };
  };
  responses: ExerciseResponse[];
}

/**
 * Create exercise attempt
 */
export async function createExerciseAttempt(data: CreateExerciseAttemptData): Promise<ExerciseAttempt> {
  return executeQuery('createExerciseAttempt', async () => {
    // Validate exercise exists
    const exercise = await prisma.exercise.findUnique({
      where: { id: data.exerciseId },
      include: { questions: true }
    });

    if (!exercise) {
      throw new NotFoundError('Exercise', data.exerciseId, 'createExerciseAttempt');
    }

    // Check if user has exceeded max attempts
    const previousAttempts = await prisma.exerciseAttempt.count({
      where: {
        userId: data.userId,
        exerciseId: data.exerciseId
      }
    });

    if (previousAttempts >= exercise.maxAttempts) {
      throw new ValidationError('Maximum attempts exceeded for this exercise', 'createExerciseAttempt', 'maxAttempts');
    }

    return prisma.exerciseAttempt.create({
      data: {
        userId: data.userId,
        exerciseId: data.exerciseId,
        startedAt: new Date(),
        totalQuestions: exercise.questions.length,
        correctAnswers: 0,
        scorePercentage: 0,
        isPassed: false
      }
    });
  });
}

/**
 * Get exercise attempt by ID
 */
export async function getExerciseAttemptById(id: string): Promise<ExerciseAttemptWithRelations | null> {
  return executeQuery('getExerciseAttemptById', async () => {
    return prisma.exerciseAttempt.findUnique({
      where: { id },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                id: true,
                title: true,
                masteryThreshold: true
              }
            }
          }
        },
        responses: {
          include: {
            question: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });
  });
}

/**
 * Get user's exercise attempts
 */
export async function getUserExerciseAttempts(userId: string, exerciseId?: string): Promise<ExerciseAttemptWithRelations[]> {
  return executeQuery('getUserExerciseAttempts', async () => {
    return prisma.exerciseAttempt.findMany({
      where: {
        userId,
        ...(exerciseId && { exerciseId })
      },
      include: {
        exercise: {
          select: {
            id: true,
            title: true,
            lesson: {
              select: {
                id: true,
                title: true,
                masteryThreshold: true
              }
            }
          }
        },
        responses: {
          include: {
            question: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { startedAt: 'desc' }
    });
  });
}

/**
 * Update exercise attempt
 */
export async function updateExerciseAttempt(id: string, data: UpdateExerciseAttemptData): Promise<ExerciseAttempt> {
  return executeQuery('updateExerciseAttempt', async () => {
    const attempt = await prisma.exerciseAttempt.findUnique({ where: { id } });
    if (!attempt) {
      throw new NotFoundError('Exercise Attempt', id, 'updateExerciseAttempt');
    }

    return prisma.exerciseAttempt.update({
      where: { id },
      data
    });
  });
}

// ===== EXERCISE RESPONSE OPERATIONS =====

/**
 * Data for creating an exercise response
 */
export interface CreateExerciseResponseData {
  attemptId: string;
  questionId: string;
  response: any;
  isCorrect: boolean;
  points: number;
  timeSpent?: number;
  hintsUsed?: number;
  feedback?: string;
}

/**
 * Create exercise response
 */
export async function createExerciseResponse(data: CreateExerciseResponseData): Promise<ExerciseResponse> {
  return executeQuery('createExerciseResponse', async () => {
    // Validate attempt and question exist
    const [attempt, question] = await Promise.all([
      prisma.exerciseAttempt.findUnique({ where: { id: data.attemptId } }),
      prisma.exerciseQuestion.findUnique({ where: { id: data.questionId } })
    ]);

    if (!attempt) {
      throw new NotFoundError('Exercise Attempt', data.attemptId, 'createExerciseResponse');
    }
    if (!question) {
      throw new NotFoundError('Exercise Question', data.questionId, 'createExerciseResponse');
    }

    // Check if response already exists for this question in this attempt
    const existingResponse = await prisma.exerciseResponse.findFirst({
      where: {
        attemptId: data.attemptId,
        questionId: data.questionId
      }
    });

    if (existingResponse) {
      throw new ValidationError('Response already exists for this question in this attempt', 'createExerciseResponse', 'duplicate');
    }

    return prisma.exerciseResponse.create({
      data: {
        attemptId: data.attemptId,
        questionId: data.questionId,
        response: JSON.stringify(data.response),
        isCorrect: data.isCorrect,
        points: data.points,
        timeSpent: data.timeSpent,
        hintsUsed: data.hintsUsed || 0,
        feedback: data.feedback
      }
    });
  });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate exercise attempt score
 */
export async function calculateExerciseScore(attemptId: string): Promise<{ totalQuestions: number; correctAnswers: number; scorePercentage: number; isPassed: boolean }> {
  return executeQuery('calculateExerciseScore', async () => {
    const attempt = await prisma.exerciseAttempt.findUnique({
      where: { id: attemptId },
      include: {
        exercise: true,
        responses: true
      }
    });

    if (!attempt) {
      throw new NotFoundError('Exercise Attempt', attemptId, 'calculateExerciseScore');
    }

    const totalQuestions = attempt.responses.length;
    const correctAnswers = attempt.responses.filter(r => r.isCorrect).length;
    const scorePercentage = totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const isPassed = scorePercentage >= 80; // Default passing threshold

    return {
      totalQuestions,
      correctAnswers,
      scorePercentage,
      isPassed
    };
  });
}

/**
 * Complete exercise attempt with final scoring
 */
export async function completeExerciseAttempt(attemptId: string): Promise<ExerciseAttempt> {
  return executeTransaction(async (tx) => {
    const scoreData = await calculateExerciseScore(attemptId);
    
    return tx.exerciseAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        totalQuestions: scoreData.totalQuestions,
        correctAnswers: scoreData.correctAnswers,
        scorePercentage: scoreData.scorePercentage,
        isPassed: scoreData.isPassed
      }
    });
  });
}

/**
 * Get exercise statistics
 */
export async function getExerciseStats(exerciseId: string): Promise<{
  totalAttempts: number;
  completedAttempts: number;
  averageScore: number;
  passRate: number;
}> {
  return executeQuery('getExerciseStats', async () => {
    const attempts = await prisma.exerciseAttempt.findMany({
      where: { exerciseId }
    });

    const totalAttempts = attempts.length;
    const completedAttempts = attempts.filter(a => a.completedAt).length;
    const passedAttempts = attempts.filter(a => a.isPassed).length;
    const totalScore = attempts.reduce((sum, a) => sum + a.scorePercentage, 0);

    return {
      totalAttempts,
      completedAttempts,
      averageScore: completedAttempts > 0 ? totalScore / completedAttempts : 0,
      passRate: completedAttempts > 0 ? (passedAttempts / completedAttempts) * 100 : 0
    };
  });
}