/**
 * Progress Tracking Database Queries
 * 
 * Database operations for learner progress and objective progress tracking.
 * Supports mastery learning with comprehensive progress analytics.
 */

import { prisma } from '../client';
import { DatabaseError, ValidationError, NotFoundError } from '../client';

// ===== TYPES =====

export interface CreateLearnerProgressData {
  userId: string;
  lessonId: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: Date;
  totalTimeSpent?: number;
  sessionsCount?: number;
  needsRemediation?: boolean;
  remediationPath?: string; // JSON
  eligibleForEnrichment?: boolean;
  enrichmentActivities?: string; // JSON
}

export interface UpdateLearnerProgressData {
  status?: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: Date;
  totalTimeSpent?: number;
  sessionsCount?: number;
  lastAccessedAt?: Date;
  needsRemediation?: boolean;
  remediationPath?: string;
  eligibleForEnrichment?: boolean;
  enrichmentActivities?: string;
}

export interface CreateObjectiveProgressData {
  userId: string;
  objectiveId: string;
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: Date;
  totalAttempts?: number;
  correctAttempts?: number;
}

export interface UpdateObjectiveProgressData {
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: Date;
  totalAttempts?: number;
  correctAttempts?: number;
  lastAttemptAt?: Date;
}

export interface ProgressSummary {
  userId: string;
  totalLessons: number;
  completedLessons: number;
  masteredLessons: number;
  totalObjectives: number;
  masteredObjectives: number;
  overallProgress: number;
  masteryRate: number;
  totalTimeSpent: number;
  averageScore: number;
  needsRemediationCount: number;
  eligibleForEnrichmentCount: number;
}

// ===== LEARNER PROGRESS OPERATIONS =====

/**
 * Create or update learner progress for a lesson
 */
export async function upsertLearnerProgress(data: CreateLearnerProgressData) {
  try {
    const progress = await prisma.learnerProgress.upsert({
      where: {
        userId_lessonId: {
          userId: data.userId,
          lessonId: data.lessonId
        }
      },
      update: {
        status: data.status,
        currentScore: data.currentScore,
        bestScore: data.bestScore,
        masteryAchieved: data.masteryAchieved,
        masteryDate: data.masteryDate,
        totalTimeSpent: data.totalTimeSpent,
        sessionsCount: data.sessionsCount,
        lastAccessedAt: new Date(),
        needsRemediation: data.needsRemediation,
        remediationPath: data.remediationPath,
        eligibleForEnrichment: data.eligibleForEnrichment,
        enrichmentActivities: data.enrichmentActivities
      },
      create: {
        ...data,
        status: data.status || 'not_started',
        currentScore: data.currentScore || 0,
        bestScore: data.bestScore || 0,
        masteryAchieved: data.masteryAchieved || false,
        totalTimeSpent: data.totalTimeSpent || 0,
        sessionsCount: data.sessionsCount || 0,
        needsRemediation: data.needsRemediation || false,
        eligibleForEnrichment: data.eligibleForEnrichment || false
      },
      include: {
        user: true,
        lesson: {
          include: {
            unit: true
          }
        }
      }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to upsert learner progress', 'upsertLearnerProgress', error);
  }
}

/**
 * Get learner progress by user and lesson
 */
export async function getLearnerProgress(userId: string, lessonId: string) {
  try {
    const progress = await prisma.learnerProgress.findUnique({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      include: {
        user: true,
        lesson: {
          include: {
            unit: true,
            objectives: true
          }
        }
      }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get learner progress', 'getLearnerProgress', error);
  }
}

/**
 * Get all progress for a user
 */
export async function getUserProgress(userId: string) {
  try {
    const progress = await prisma.learnerProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          include: {
            unit: true
          }
        }
      },
      orderBy: [
        { lesson: { unit: { orderIndex: 'asc' } } },
        { lesson: { orderIndex: 'asc' } }
      ]
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get user progress', 'getUserProgress', error);
  }
}

/**
 * Get progress for a specific lesson (all users)
 */
export async function getLessonProgress(lessonId: string) {
  try {
    const progress = await prisma.learnerProgress.findMany({
      where: { lessonId },
      include: {
        user: true
      },
      orderBy: { updatedAt: 'desc' }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get lesson progress', 'getLessonProgress', error);
  }
}

/**
 * Update learner progress
 */
export async function updateLearnerProgress(
  userId: string,
  lessonId: string,
  data: UpdateLearnerProgressData
) {
  try {
    const progress = await prisma.learnerProgress.update({
      where: {
        userId_lessonId: {
          userId,
          lessonId
        }
      },
      data: {
        ...data,
        lastAccessedAt: new Date()
      },
      include: {
        user: true,
        lesson: {
          include: {
            unit: true
          }
        }
      }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to update learner progress', 'updateLearnerProgress', error);
  }
}

// ===== OBJECTIVE PROGRESS OPERATIONS =====

/**
 * Create or update objective progress
 */
export async function upsertObjectiveProgress(data: CreateObjectiveProgressData) {
  try {
    const progress = await prisma.objectiveProgress.upsert({
      where: {
        userId_objectiveId: {
          userId: data.userId,
          objectiveId: data.objectiveId
        }
      },
      update: {
        currentScore: data.currentScore,
        bestScore: data.bestScore,
        masteryAchieved: data.masteryAchieved,
        masteryDate: data.masteryDate,
        totalAttempts: data.totalAttempts,
        correctAttempts: data.correctAttempts,
        lastAttemptAt: new Date()
      },
      create: {
        ...data,
        currentScore: data.currentScore || 0,
        bestScore: data.bestScore || 0,
        masteryAchieved: data.masteryAchieved || false,
        totalAttempts: data.totalAttempts || 0,
        correctAttempts: data.correctAttempts || 0
      },
      include: {
        objective: {
          include: {
            lesson: true,
            unit: true
          }
        }
      }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to upsert objective progress', 'upsertObjectiveProgress', error);
  }
}

/**
 * Get objective progress by user and objective
 */
export async function getObjectiveProgress(userId: string, objectiveId: string) {
  try {
    const progress = await prisma.objectiveProgress.findUnique({
      where: {
        userId_objectiveId: {
          userId,
          objectiveId
        }
      },
      include: {
        objective: {
          include: {
            lesson: true,
            unit: true
          }
        }
      }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get objective progress', 'getObjectiveProgress', error);
  }
}

/**
 * Get all objective progress for a user
 */
export async function getUserObjectiveProgress(userId: string) {
  try {
    const progress = await prisma.objectiveProgress.findMany({
      where: { userId },
      include: {
        objective: {
          include: {
            lesson: {
              include: {
                unit: true
              }
            }
          }
        }
      },
      orderBy: [
        { objective: { lesson: { unit: { orderIndex: 'asc' } } } },
        { objective: { lesson: { orderIndex: 'asc' } } }
      ]
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get user objective progress', 'getUserObjectiveProgress', error);
  }
}

/**
 * Update objective progress
 */
export async function updateObjectiveProgress(
  userId: string,
  objectiveId: string,
  data: UpdateObjectiveProgressData
) {
  try {
    const progress = await prisma.objectiveProgress.update({
      where: {
        userId_objectiveId: {
          userId,
          objectiveId
        }
      },
      data: {
        ...data,
        lastAttemptAt: new Date()
      },
      include: {
        objective: {
          include: {
            lesson: true,
            unit: true
          }
        }
      }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to update objective progress', 'updateObjectiveProgress', error);
  }
}

// ===== PROGRESS ANALYTICS =====

/**
 * Get comprehensive progress summary for a user
 */
export async function getProgressSummary(userId: string): Promise<ProgressSummary> {
  try {
    const [
      learnerProgress,
      objectiveProgress,
      totalLessons,
      totalObjectives
    ] = await Promise.all([
      prisma.learnerProgress.findMany({
        where: { userId },
        include: { lesson: true }
      }),
      prisma.objectiveProgress.findMany({
        where: { userId }
      }),
      prisma.lesson.count({
        where: { isPublished: true }
      }),
      prisma.learningObjective.count()
    ]);

    const completedLessons = learnerProgress.filter(p => 
      p.status === 'completed' || p.status === 'mastered'
    ).length;
    
    const masteredLessons = learnerProgress.filter(p => 
      p.masteryAchieved
    ).length;

    const masteredObjectives = objectiveProgress.filter(p => 
      p.masteryAchieved
    ).length;

    const totalTimeSpent = learnerProgress.reduce((sum, p) => 
      sum + p.totalTimeSpent, 0
    );

    const totalScores = learnerProgress.filter(p => p.bestScore > 0);
    const averageScore = totalScores.length > 0 
      ? totalScores.reduce((sum, p) => sum + p.bestScore, 0) / totalScores.length
      : 0;

    const needsRemediationCount = learnerProgress.filter(p => 
      p.needsRemediation
    ).length;

    const eligibleForEnrichmentCount = learnerProgress.filter(p => 
      p.eligibleForEnrichment
    ).length;

    const overallProgress = totalLessons > 0 ? completedLessons / totalLessons : 0;
    const masteryRate = completedLessons > 0 ? masteredLessons / completedLessons : 0;

    return {
      userId,
      totalLessons,
      completedLessons,
      masteredLessons,
      totalObjectives,
      masteredObjectives,
      overallProgress,
      masteryRate,
      totalTimeSpent,
      averageScore,
      needsRemediationCount,
      eligibleForEnrichmentCount
    };
  } catch (error) {
    throw new DatabaseError('Failed to get progress summary', 'getProgressSummary', error);
  }
}

/**
 * Get progress statistics for a lesson
 */
export async function getLessonProgressStats(lessonId: string) {
  try {
    const stats = await prisma.learnerProgress.aggregate({
      where: { lessonId },
      _count: true,
      _avg: {
        currentScore: true,
        bestScore: true,
        totalTimeSpent: true
      }
    });

    const statusCounts = await prisma.learnerProgress.groupBy({
      by: ['status'],
      where: { lessonId },
      _count: true
    });

    const masteryCount = await prisma.learnerProgress.count({
      where: {
        lessonId,
        masteryAchieved: true
      }
    });

    const remediationCount = await prisma.learnerProgress.count({
      where: {
        lessonId,
        needsRemediation: true
      }
    });

    const enrichmentCount = await prisma.learnerProgress.count({
      where: {
        lessonId,
        eligibleForEnrichment: true
      }
    });

    const totalProgress = stats._count || 0;
    const masteryRate = totalProgress > 0 ? masteryCount / totalProgress : 0;

    return {
      totalProgress,
      masteryCount,
      masteryRate,
      remediationCount,
      enrichmentCount,
      averageCurrentScore: stats._avg.currentScore || 0,
      averageBestScore: stats._avg.bestScore || 0,
      averageTimeSpent: stats._avg.totalTimeSpent || 0,
      statusDistribution: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };
  } catch (error) {
    throw new DatabaseError('Failed to get lesson progress stats', 'getLessonProgressStats', error);
  }
}

/**
 * Get users who need remediation for a specific lesson
 */
export async function getUsersNeedingRemediation(lessonId?: string) {
  try {
    const whereClause = lessonId ? { lessonId, needsRemediation: true } : { needsRemediation: true };
    
    const progress = await prisma.learnerProgress.findMany({
      where: whereClause,
      include: {
        user: true,
        lesson: {
          include: {
            unit: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get users needing remediation', 'getUsersNeedingRemediation', error);
  }
}

/**
 * Get users eligible for enrichment for a specific lesson
 */
export async function getUsersEligibleForEnrichment(lessonId?: string) {
  try {
    const whereClause = lessonId ? { lessonId, eligibleForEnrichment: true } : { eligibleForEnrichment: true };
    
    const progress = await prisma.learnerProgress.findMany({
      where: whereClause,
      include: {
        user: true,
        lesson: {
          include: {
            unit: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return progress;
  } catch (error) {
    throw new DatabaseError('Failed to get users eligible for enrichment', 'getUsersEligibleForEnrichment', error);
  }
}