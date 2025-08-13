/**
 * Database Queries Index
 * 
 * Centralized exports for all database query modules.
 * Provides a single import point for database operations throughout the application.
 */

// Core database client and utilities
export {
  prisma,
  checkDatabaseConnection,
  disconnectDatabase,
  initializeDatabase,
  executeTransaction,
  executeWithRetry,
  executeQuery,
  executePaginatedQuery,
  DatabaseError,
  ValidationError,
  NotFoundError,
  type PaginationOptions,
  type PaginatedResult
} from '../client';

// Unit operations
export {
  createUnit,
  getUnitById,
  getUnitByOrderIndex,
  getUnits,
  getPublishedUnits,
  getAccessibleUnits,
  updateUnit,
  reorderUnits,
  deleteUnit,
  getUnitStats,
  validateUnitPrerequisites,
  type CreateUnitData,
  type UpdateUnitData,
  type UnitFilters,
  type UnitWithRelations
} from './units';

// Lesson operations
export {
  createLesson,
  getLessonById,
  getLessons,
  getLessonsByUnit,
  getPublishedLessons,
  getNextLessonForUser,
  updateLesson,
  reorderLessons,
  deleteLesson,
  getLessonProgress as getUserLessonProgress,
  getAllLessonProgress,
  getLessonStats,
  searchLessons,
  type CreateLessonData,
  type UpdateLessonData,
  type LessonFilters,
  type LessonWithRelations,
  type LessonProgress
} from './lessons';

// Exercise operations
export {
  createExercise,
  getExerciseById,
  getExercisesByLesson,
  updateExercise,
  deleteExercise,
  createExerciseQuestion,
  updateExerciseQuestion,
  deleteExerciseQuestion,
  createExerciseAttempt,
  getExerciseAttemptById,
  getUserExerciseAttempts,
  updateExerciseAttempt,
  completeExerciseAttempt,
  createExerciseResponse,
  calculateExerciseScore,
  getExerciseStats,
  type CreateExerciseData,
  type UpdateExerciseData,
  type ExerciseWithRelations,
  type CreateExerciseQuestionData,
  type UpdateExerciseQuestionData,
  type CreateExerciseAttemptData,
  type UpdateExerciseAttemptData,
  type CreateExerciseResponseData,
  type ExerciseAttemptWithRelations
} from './exercises';

// Assessment operations
export {
  createAssessment,
  getAssessmentById,
  getAssessmentsByLesson,
  updateAssessment,
  deleteAssessment,
  createAssessmentQuestion,
  updateAssessmentQuestion,
  deleteAssessmentQuestion,
  getQuestionsByAssessment,
  createAssessmentAttempt,
  updateAssessmentAttempt,
  completeAssessmentAttempt,
  getUserAssessmentAttempts,
  createAssessmentResponse,
  getResponsesByAttempt,
  getAssessmentStats,
  getQuestionPerformance,
  type CreateAssessmentData,
  type UpdateAssessmentData,
  type CreateAssessmentQuestionData,
  type UpdateAssessmentQuestionData,
  type CreateAssessmentAttemptData,
  type UpdateAssessmentAttemptData,
  type CreateAssessmentResponseData
} from './assessments';

// Progress tracking operations
export {
  upsertLearnerProgress,
  getLearnerProgress,
  getUserProgress,
  getLessonProgress as getLessonProgressByLesson,
  updateLearnerProgress,
  upsertObjectiveProgress,
  getObjectiveProgress,
  getUserObjectiveProgress,
  updateObjectiveProgress,
  getProgressSummary,
  getLessonProgressStats,
  getUsersNeedingRemediation,
  getUsersEligibleForEnrichment,
  type CreateLearnerProgressData,
  type UpdateLearnerProgressData,
  type CreateObjectiveProgressData,
  type UpdateObjectiveProgressData,
  type ProgressSummary
} from './progress';

// User operations (to be implemented)
// export {
//   createUser,
//   getUserById,
//   getUserByEmail,
//   updateUser,
//   deleteUser,
//   createUserProfile,
//   updateUserProfile,
//   getUserPreferences,
//   updateUserPreferences,
//   type CreateUserData,
//   type UpdateUserData,
//   type UserWithRelations
// } from './users';

// Analytics operations (to be implemented)
// export {
//   getUserAnalytics,
//   createAnalyticsEntry,
//   getSystemAnalytics,
//   getLearningInsights,
//   createLearningInsight,
//   type AnalyticsData,
//   type InsightData
// } from './analytics';

// ===== QUERY UTILITIES =====

/**
 * Batch operations for efficient data loading
 */
export const batchOperations = {
  /**
   * Get multiple units by IDs
   */
  async getUnitsByIds(ids: string[]) {
    const { getUnitById } = await import('./units');
    return Promise.all(ids.map(id => getUnitById(id)));
  },

  /**
   * Get multiple lessons by IDs
   */
  async getLessonsByIds(ids: string[]) {
    const { getLessonById } = await import('./lessons');
    return Promise.all(ids.map(id => getLessonById(id)));
  }
};

/**
 * Common query patterns for application use
 */
export const queryPatterns = {
  /**
   * Get complete learning path for a unit
   */
  async getLearningPath(unitId: string) {
    const { getUnitById } = await import('./units');
    const { getLessonsByUnit } = await import('./lessons');
    
    const [unit, lessons] = await Promise.all([
      getUnitById(unitId),
      getLessonsByUnit(unitId)
    ]);

    return { unit, lessons };
  },

  /**
   * Get user's current learning state
   */
  async getUserLearningState(userId: string) {
    const { getAllLessonProgress, getNextLessonForUser } = await import('./lessons');
    
    const [progress, nextLesson] = await Promise.all([
      getAllLessonProgress(userId),
      getNextLessonForUser(userId)
    ]);

    return { progress, nextLesson };
  }
};

/**
 * Database health and maintenance utilities
 */
export const maintenance = {
  /**
   * Check database health
   */
  async checkHealth() {
    return checkDatabaseConnection();
  },

  /**
   * Get database statistics
   */
  async getStats() {
    const stats = await executeQuery('getDatabaseStats', async () => {
      const [
        unitsCount,
        lessonsCount,
        publishedUnitsCount,
        publishedLessonsCount
      ] = await Promise.all([
        prisma.unit.count(),
        prisma.lesson.count(),
        prisma.unit.count({ where: { isPublished: true } }),
        prisma.lesson.count({ where: { isPublished: true } })
      ]);

      return {
        units: {
          total: unitsCount,
          published: publishedUnitsCount
        },
        lessons: {
          total: lessonsCount,
          published: publishedLessonsCount
        }
      };
    });

    return stats;
  }
};
