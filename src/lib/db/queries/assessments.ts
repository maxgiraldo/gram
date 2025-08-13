/**
 * Assessment Database Queries
 * 
 * Database operations for assessments, assessment questions, attempts, and responses.
 * Supports mastery learning with 80/90% thresholds and comprehensive progress tracking.
 */

import { prisma } from '../client';
import { DatabaseError, ValidationError, NotFoundError } from '../client';

// ===== TYPES =====

export interface CreateAssessmentData {
  lessonId?: string;
  title: string;
  description?: string;
  type: 'diagnostic' | 'formative' | 'summative' | 'retention_check';
  timeLimit?: number;
  maxAttempts?: number;
  masteryThreshold?: number;
  scheduledDelay?: number;
  isPublished?: boolean;
}

export interface UpdateAssessmentData {
  title?: string;
  description?: string;
  type?: 'diagnostic' | 'formative' | 'summative' | 'retention_check';
  timeLimit?: number;
  maxAttempts?: number;
  masteryThreshold?: number;
  scheduledDelay?: number;
  isPublished?: boolean;
}

export interface CreateAssessmentQuestionData {
  assessmentId: string;
  objectiveId?: string;
  questionText: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder' | 'essay';
  orderIndex: number;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionData: string; // JSON
  correctAnswer: string; // JSON
  distractors?: string; // JSON
  feedback?: string;
}

export interface UpdateAssessmentQuestionData {
  objectiveId?: string;
  questionText?: string;
  type?: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder' | 'essay';
  orderIndex?: number;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionData?: string;
  correctAnswer?: string;
  distractors?: string;
  feedback?: string;
}

export interface CreateAssessmentAttemptData {
  userId: string;
  assessmentId: string;
  totalQuestions: number;
}

export interface UpdateAssessmentAttemptData {
  completedAt?: Date;
  timeSpent?: number;
  correctAnswers?: number;
  scorePercentage?: number;
  achievedMastery?: boolean;
}

export interface CreateAssessmentResponseData {
  attemptId: string;
  questionId: string;
  response: string; // JSON
  isCorrect: boolean;
  points: number;
  timeSpent?: number;
  errorType?: string;
  confidence?: number;
}

// ===== ASSESSMENT CRUD OPERATIONS =====

/**
 * Create a new assessment
 */
export async function createAssessment(data: CreateAssessmentData) {
  try {
    const assessment = await prisma.assessment.create({
      data: {
        ...data,
        masteryThreshold: data.masteryThreshold || 0.8,
        maxAttempts: data.maxAttempts || 2,
        isPublished: data.isPublished || false
      },
      include: {
        lesson: true,
        questions: {
          orderBy: { orderIndex: 'asc' }
        },
        attempts: true
      }
    });

    return assessment;
  } catch (error) {
    throw new DatabaseError('Failed to create assessment', 'createAssessment', error);
  }
}

/**
 * Get assessment by ID with optional includes
 */
export async function getAssessmentById(
  id: string,
  options: {
    includeQuestions?: boolean;
    includeAttempts?: boolean;
    includeLesson?: boolean;
  } = {}
) {
  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        lesson: options.includeLesson,
        questions: options.includeQuestions ? {
          orderBy: { orderIndex: 'asc' },
          include: {
            objective: true,
            responses: false
          }
        } : false,
        attempts: options.includeAttempts ? {
          include: {
            user: true,
            responses: true
          }
        } : false
      }
    });

    if (!assessment) {
      throw new NotFoundError('Assessment', id);
    }

    return assessment;
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Failed to get assessment', 'getAssessmentById', error);
  }
}

/**
 * Get assessments by lesson
 */
export async function getAssessmentsByLesson(lessonId: string) {
  try {
    const assessments = await prisma.assessment.findMany({
      where: {
        lessonId,
        isPublished: true
      },
      include: {
        questions: {
          orderBy: { orderIndex: 'asc' }
        },
        _count: {
          select: {
            attempts: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return assessments;
  } catch (error) {
    throw new DatabaseError('Failed to get assessments by lesson', 'getAssessmentsByLesson', error);
  }
}

/**
 * Update assessment
 */
export async function updateAssessment(id: string, data: UpdateAssessmentData) {
  try {
    const assessment = await prisma.assessment.update({
      where: { id },
      data,
      include: {
        lesson: true,
        questions: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return assessment;
  } catch (error) {
    throw new DatabaseError('Failed to update assessment', 'updateAssessment', error);
  }
}

/**
 * Delete assessment
 */
export async function deleteAssessment(id: string) {
  try {
    // Check if assessment has attempts
    const attemptCount = await prisma.assessmentAttempt.count({
      where: { assessmentId: id }
    });

    if (attemptCount > 0) {
      // Soft delete by unpublishing
      await prisma.assessment.update({
        where: { id },
        data: { isPublished: false }
      });
    } else {
      // Hard delete if no attempts
      await prisma.assessment.delete({
        where: { id }
      });
    }
  } catch (error) {
    throw new DatabaseError('Failed to delete assessment', 'deleteAssessment', error);
  }
}

// ===== ASSESSMENT QUESTION OPERATIONS =====

/**
 * Create assessment question
 */
export async function createAssessmentQuestion(data: CreateAssessmentQuestionData) {
  try {
    // Validate question data
    validateQuestionData(data.type, data.questionData, data.correctAnswer);

    const question = await prisma.assessmentQuestion.create({
      data: {
        ...data,
        points: data.points || 1,
        difficulty: data.difficulty || 'medium'
      },
      include: {
        assessment: true,
        objective: true
      }
    });

    return question;
  } catch (error) {
    throw new DatabaseError('Failed to create assessment question', 'createAssessmentQuestion', error);
  }
}

/**
 * Update assessment question
 */
export async function updateAssessmentQuestion(id: string, data: UpdateAssessmentQuestionData) {
  try {
    if (data.type && data.questionData && data.correctAnswer) {
      validateQuestionData(data.type, data.questionData, data.correctAnswer);
    }

    const question = await prisma.assessmentQuestion.update({
      where: { id },
      data,
      include: {
        assessment: true,
        objective: true
      }
    });

    return question;
  } catch (error) {
    throw new DatabaseError('Failed to update assessment question', 'updateAssessmentQuestion', error);
  }
}

/**
 * Delete assessment question
 */
export async function deleteAssessmentQuestion(id: string) {
  try {
    await prisma.assessmentQuestion.delete({
      where: { id }
    });
  } catch (error) {
    throw new DatabaseError('Failed to delete assessment question', 'deleteAssessmentQuestion', error);
  }
}

/**
 * Get questions by assessment
 */
export async function getQuestionsByAssessment(assessmentId: string) {
  try {
    const questions = await prisma.assessmentQuestion.findMany({
      where: { assessmentId },
      include: {
        objective: true
      },
      orderBy: { orderIndex: 'asc' }
    });

    return questions;
  } catch (error) {
    throw new DatabaseError('Failed to get questions by assessment', 'getQuestionsByAssessment', error);
  }
}

// ===== ASSESSMENT ATTEMPT OPERATIONS =====

/**
 * Create assessment attempt
 */
export async function createAssessmentAttempt(data: CreateAssessmentAttemptData) {
  try {
    // Check if user has exceeded max attempts
    const assessment = await prisma.assessment.findUnique({
      where: { id: data.assessmentId }
    });

    if (!assessment) {
      throw new NotFoundError('Assessment', data.assessmentId);
    }

    const existingAttempts = await prisma.assessmentAttempt.count({
      where: {
        userId: data.userId,
        assessmentId: data.assessmentId
      }
    });

    if (existingAttempts >= assessment.maxAttempts) {
      throw new ValidationError('Maximum attempts exceeded', 'createAssessmentAttempt', 'maxAttempts');
    }

    const attempt = await prisma.assessmentAttempt.create({
      data: {
        ...data,
        scorePercentage: 0,
        correctAnswers: 0
      },
      include: {
        assessment: true,
        user: true
      }
    });

    return attempt;
  } catch (error) {
    if (error instanceof NotFoundError || error instanceof ValidationError) throw error;
    throw new DatabaseError('Failed to create assessment attempt', 'createAssessmentAttempt', error);
  }
}

/**
 * Update assessment attempt
 */
export async function updateAssessmentAttempt(id: string, data: UpdateAssessmentAttemptData) {
  try {
    const attempt = await prisma.assessmentAttempt.update({
      where: { id },
      data,
      include: {
        assessment: true,
        user: true,
        responses: true
      }
    });

    return attempt;
  } catch (error) {
    throw new DatabaseError('Failed to update assessment attempt', 'updateAssessmentAttempt', error);
  }
}

/**
 * Complete assessment attempt with scoring
 */
export async function completeAssessmentAttempt(attemptId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      // Get attempt with responses
      const attempt = await tx.assessmentAttempt.findUnique({
        where: { id: attemptId },
        include: {
          assessment: true,
          responses: true
        }
      });

      if (!attempt) {
        throw new NotFoundError('Assessment attempt', attemptId);
      }

      // Calculate score
      const totalPoints = attempt.responses.reduce((sum, response) => sum + response.points, 0);
      const maxPoints = attempt.totalQuestions; // Assuming 1 point per question
      const scorePercentage = maxPoints > 0 ? totalPoints / maxPoints : 0;
      const correctAnswers = attempt.responses.filter(r => r.isCorrect).length;
      const achievedMastery = scorePercentage >= attempt.assessment.masteryThreshold;

      // Update attempt
      const updatedAttempt = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: {
          completedAt: new Date(),
          correctAnswers,
          scorePercentage,
          achievedMastery
        },
        include: {
          assessment: true,
          user: true,
          responses: true
        }
      });

      return updatedAttempt;
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    throw new DatabaseError('Failed to complete assessment attempt', 'completeAssessmentAttempt', error);
  }
}

/**
 * Get user's attempts for an assessment
 */
export async function getUserAssessmentAttempts(userId: string, assessmentId: string) {
  try {
    const attempts = await prisma.assessmentAttempt.findMany({
      where: {
        userId,
        assessmentId
      },
      include: {
        responses: true
      },
      orderBy: { startedAt: 'desc' }
    });

    return attempts;
  } catch (error) {
    throw new DatabaseError('Failed to get user assessment attempts', 'getUserAssessmentAttempts', error);
  }
}

// ===== ASSESSMENT RESPONSE OPERATIONS =====

/**
 * Create assessment response
 */
export async function createAssessmentResponse(data: CreateAssessmentResponseData) {
  try {
    const response = await prisma.assessmentResponse.create({
      data,
      include: {
        attempt: true,
        question: true
      }
    });

    return response;
  } catch (error) {
    throw new DatabaseError('Failed to create assessment response', 'createAssessmentResponse', error);
  }
}

/**
 * Get responses by attempt
 */
export async function getResponsesByAttempt(attemptId: string) {
  try {
    const responses = await prisma.assessmentResponse.findMany({
      where: { attemptId },
      include: {
        question: true
      },
      orderBy: { createdAt: 'asc' }
    });

    return responses;
  } catch (error) {
    throw new DatabaseError('Failed to get responses by attempt', 'getResponsesByAttempt', error);
  }
}

// ===== ASSESSMENT ANALYTICS =====

/**
 * Get assessment statistics
 */
export async function getAssessmentStats(assessmentId: string) {
  try {
    const stats = await prisma.assessmentAttempt.aggregate({
      where: { assessmentId },
      _count: true,
      _avg: {
        scorePercentage: true,
        timeSpent: true
      }
    });

    const masteryCount = await prisma.assessmentAttempt.count({
      where: {
        assessmentId,
        achievedMastery: true
      }
    });

    const totalAttempts = stats._count || 0;
    const masteryRate = totalAttempts > 0 ? masteryCount / totalAttempts : 0;

    return {
      totalAttempts,
      masteryCount,
      masteryRate,
      averageScore: stats._avg.scorePercentage || 0,
      averageTime: stats._avg.timeSpent || 0
    };
  } catch (error) {
    throw new DatabaseError('Failed to get assessment statistics', 'getAssessmentStats', error);
  }
}

/**
 * Get question performance analytics
 */
export async function getQuestionPerformance(questionId: string) {
  try {
    const responses = await prisma.assessmentResponse.findMany({
      where: { questionId },
      include: {
        question: true
      }
    });

    const totalResponses = responses.length;
    const correctResponses = responses.filter(r => r.isCorrect).length;
    const averageTime = totalResponses > 0 
      ? responses.reduce((sum, r) => sum + (r.timeSpent || 0), 0) / totalResponses 
      : 0;

    // Analyze common errors
    const errorTypes = responses
      .filter(r => r.errorType)
      .reduce((acc, r) => {
        acc[r.errorType!] = (acc[r.errorType!] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    return {
      totalResponses,
      correctResponses,
      accuracy: totalResponses > 0 ? correctResponses / totalResponses : 0,
      averageTime,
      errorTypes
    };
  } catch (error) {
    throw new DatabaseError('Failed to get question performance', 'getQuestionPerformance', error);
  }
}

// ===== VALIDATION HELPERS =====

/**
 * Validate question data format
 */
function validateQuestionData(type: string, questionData: string, correctAnswer: string) {
  try {
    const parsedData = JSON.parse(questionData);
    const parsedAnswer = JSON.parse(correctAnswer);

    switch (type) {
      case 'multiple_choice':
        if (!parsedData.options || !Array.isArray(parsedData.options)) {
          throw new ValidationError('Multiple choice questions must have options array', 'validateQuestionData', 'questionData');
        }
        if (typeof parsedAnswer !== 'number' || parsedAnswer < 0 || parsedAnswer >= parsedData.options.length) {
          throw new ValidationError('Multiple choice answer must be valid option index', 'validateQuestionData', 'correctAnswer');
        }
        break;

      case 'fill_in_blank':
        if (!parsedAnswer || (!Array.isArray(parsedAnswer) && typeof parsedAnswer !== 'string')) {
          throw new ValidationError('Fill in blank answer must be string or array of strings', 'validateQuestionData', 'correctAnswer');
        }
        break;

      case 'drag_and_drop':
        if (!parsedData.items || !Array.isArray(parsedData.items)) {
          throw new ValidationError('Drag and drop questions must have items array', 'validateQuestionData', 'questionData');
        }
        if (!parsedAnswer || typeof parsedAnswer !== 'object') {
          throw new ValidationError('Drag and drop answer must be mapping object', 'validateQuestionData', 'correctAnswer');
        }
        break;

      case 'sentence_builder':
        if (!parsedData.words || !Array.isArray(parsedData.words)) {
          throw new ValidationError('Sentence builder questions must have words array', 'validateQuestionData', 'questionData');
        }
        if (!Array.isArray(parsedAnswer)) {
          throw new ValidationError('Sentence builder answer must be array of word indices', 'validateQuestionData', 'correctAnswer');
        }
        break;

      case 'essay':
        // Essay questions are more flexible, just validate basic structure
        if (!parsedData.prompt || typeof parsedData.prompt !== 'string') {
          throw new ValidationError('Essay questions must have prompt', 'validateQuestionData', 'questionData');
        }
        break;

      default:
        throw new ValidationError(`Unsupported question type: ${type}`, 'validateQuestionData', 'type');
    }
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    throw new ValidationError('Invalid JSON in question data or answer', 'validateQuestionData', 'format');
  }
}