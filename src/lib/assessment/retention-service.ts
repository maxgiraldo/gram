/**
 * Retention Service
 * 
 * Service layer for managing retention checks, integrating with the database
 * and providing automatic scheduling functionality.
 */

import { PrismaClient } from '@prisma/client';
import { 
  RetentionScheduler, 
  createRetentionScheduler,
  createContextualScheduler,
  type RetentionSchedule,
  type RetentionMetrics,
  type SpacedRepetitionCard,
  type SchedulingOptions 
} from './retention-scheduler';
import type { 
  AssessmentResponse,
  CreateAssessmentRequest,
  AssessmentAttemptResponse 
} from '../../types/api';

// ===== SERVICE TYPES =====

export interface RetentionScheduleRecord {
  id: string;
  userId: string;
  objectiveId: string;
  lessonId?: string;
  assessmentId?: string;
  scheduleType: 'initial' | 'review' | 'remediation' | 'reinforcement';
  dueDate: Date;
  priority: number;
  estimatedDuration: number;
  isCompleted: boolean;
  completedAt?: Date;
  score?: number;
  metadata?: any;
  createdAt: Date;
  updatedAt: Date;
}

export interface RetentionServiceOptions {
  schedulingOptions?: SchedulingOptions;
  context?: 'beginner' | 'intermediate' | 'advanced';
  autoSchedule?: boolean;
  batchSize?: number;
}

// ===== RETENTION SERVICE =====

export class RetentionService {
  private prisma: PrismaClient;
  private scheduler: RetentionScheduler;
  private options: RetentionServiceOptions;

  constructor(
    prisma: PrismaClient, 
    options: RetentionServiceOptions = {}
  ) {
    this.prisma = prisma;
    this.options = {
      autoSchedule: true,
      batchSize: 50,
      ...options
    };

    // Initialize scheduler based on context
    this.scheduler = options.context 
      ? createContextualScheduler(options.context, options.schedulingOptions)
      : createRetentionScheduler(options.schedulingOptions);
  }

  /**
   * Schedule retention checks when a lesson is completed
   */
  async scheduleRetentionChecks(
    userId: string,
    lessonId: string,
    completedAt: Date = new Date()
  ): Promise<RetentionScheduleRecord[]> {
    try {
      // Get lesson with objectives
      const lesson = await this.prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
          objectives: true,
          unit: true
        }
      });

      if (!lesson) {
        throw new Error(`Lesson not found: ${lessonId}`);
      }

      // Load existing spaced repetition cards for this user
      await this.loadUserCards(userId);

      // Generate retention schedules
      const schedules = this.scheduler.scheduleInitialRetention(
        userId,
        lessonId,
        lesson.objectives,
        completedAt
      );

      // Save schedules to database
      const savedSchedules: RetentionScheduleRecord[] = [];

      for (const schedule of schedules) {
        // Create retention assessment
        const assessment = await this.createRetentionAssessment(schedule);

        // Save schedule record
        const scheduleRecord = await this.saveScheduleRecord({
          ...schedule,
          assessmentId: assessment.id
        });

        savedSchedules.push(scheduleRecord);
      }

      // Save updated spaced repetition cards
      await this.saveUserCards(userId);

      return savedSchedules;

    } catch (error) {
      console.error('Error scheduling retention checks:', error);
      throw error;
    }
  }

  /**
   * Process completed retention check and update schedule
   */
  async processRetentionCompletion(
    userId: string,
    scheduleId: string,
    attemptResult: AssessmentAttemptResponse
  ): Promise<RetentionScheduleRecord | null> {
    try {
      // Mark current schedule as completed
      await this.prisma.retentionSchedule.update({
        where: { id: scheduleId },
        data: {
          isCompleted: true,
          completedAt: attemptResult.completedAt ? new Date(attemptResult.completedAt) : new Date(),
          score: attemptResult.scorePercentage / 100,
          metadata: {
            totalQuestions: attemptResult.totalQuestions,
            correctAnswers: attemptResult.correctAnswers,
            timeSpent: attemptResult.timeSpent,
            achievedMastery: attemptResult.achievedMastery
          }
        }
      });

      // Get the completed schedule
      const completedSchedule = await this.prisma.retentionSchedule.findUnique({
        where: { id: scheduleId }
      });

      if (!completedSchedule) return null;

      // Load user cards and update based on performance
      await this.loadUserCards(userId);

      const nextSchedule = this.scheduler.updateScheduleFromPerformance(
        userId,
        completedSchedule.objectiveId,
        attemptResult.scorePercentage / 100,
        attemptResult.timeSpent,
        attemptResult.completedAt ? new Date(attemptResult.completedAt) : new Date()
      );

      if (nextSchedule) {
        // Create next retention assessment
        const nextAssessment = await this.createRetentionAssessment(nextSchedule);

        // Save next schedule
        const nextScheduleRecord = await this.saveScheduleRecord({
          ...nextSchedule,
          assessmentId: nextAssessment.id
        });

        // Save updated cards
        await this.saveUserCards(userId);

        return nextScheduleRecord;
      }

      // Save updated cards even if no next schedule
      await this.saveUserCards(userId);
      return null;

    } catch (error) {
      console.error('Error processing retention completion:', error);
      throw error;
    }
  }

  /**
   * Get due retention checks for a user
   */
  async getDueRetentionChecks(
    userId: string,
    date: Date = new Date(),
    limit?: number
  ): Promise<RetentionScheduleRecord[]> {
    try {
      const query: any = {
        where: {
          userId,
          isCompleted: false,
          dueDate: {
            lte: date
          }
        },
        include: {
          assessment: {
            include: {
              questions: true
            }
          },
          objective: true,
          lesson: true
        },
        orderBy: [
          { priority: 'desc' },
          { dueDate: 'asc' }
        ]
      };

      if (limit) {
        query.take = limit;
      }

      const schedules = await this.prisma.retentionSchedule.findMany(query);

      return schedules.map(this.mapToScheduleRecord);

    } catch (error) {
      console.error('Error getting due retention checks:', error);
      throw error;
    }
  }

  /**
   * Get retention metrics for a user
   */
  async getRetentionMetrics(
    userId: string,
    date: Date = new Date()
  ): Promise<RetentionMetrics> {
    try {
      // Load user cards for scheduler metrics
      await this.loadUserCards(userId);
      const schedulerMetrics = this.scheduler.generateRetentionMetrics(userId, date);

      // Get database metrics
      const today = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
      const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

      const [
        totalScheduled,
        completedToday,
        dueToday,
        overdue,
        upcomingWeek
      ] = await Promise.all([
        this.prisma.retentionSchedule.count({
          where: { userId }
        }),
        this.prisma.retentionSchedule.count({
          where: {
            userId,
            completedAt: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        this.prisma.retentionSchedule.count({
          where: {
            userId,
            isCompleted: false,
            dueDate: {
              gte: today,
              lt: tomorrow
            }
          }
        }),
        this.prisma.retentionSchedule.count({
          where: {
            userId,
            isCompleted: false,
            dueDate: {
              lt: today
            }
          }
        }),
        this.prisma.retentionSchedule.count({
          where: {
            userId,
            isCompleted: false,
            dueDate: {
              gte: tomorrow,
              lt: weekFromNow
            }
          }
        })
      ]);

      // Calculate retention rate
      const completed = await this.prisma.retentionSchedule.findMany({
        where: {
          userId,
          isCompleted: true,
          score: { not: null }
        },
        select: { score: true }
      });

      const averageRetentionRate = completed.length > 0
        ? completed.reduce((sum, record) => sum + (record.score || 0), 0) / completed.length
        : 0;

      // Calculate total review time
      const timeRecords = await this.prisma.retentionSchedule.findMany({
        where: {
          userId,
          isCompleted: true,
          metadata: { not: null }
        },
        select: { metadata: true }
      });

      const totalReviewTime = timeRecords.reduce((sum, record) => {
        const timeSpent = record.metadata?.timeSpent || 0;
        return sum + Math.round(timeSpent / 60); // Convert to minutes
      }, 0);

      return {
        ...schedulerMetrics,
        totalScheduled,
        completedToday,
        dueToday,
        overdue,
        upcomingWeek,
        averageRetentionRate,
        totalReviewTime
      };

    } catch (error) {
      console.error('Error getting retention metrics:', error);
      throw error;
    }
  }

  /**
   * Optimize schedules based on performance history
   */
  async optimizeUserSchedules(userId: string): Promise<void> {
    try {
      // Get performance history
      const performanceHistory = await this.prisma.retentionSchedule.findMany({
        where: {
          userId,
          isCompleted: true,
          score: { not: null },
          completedAt: { not: null }
        },
        select: {
          objectiveId: true,
          score: true,
          completedAt: true
        },
        orderBy: { completedAt: 'asc' }
      });

      const formattedHistory = performanceHistory.map(record => ({
        objectiveId: record.objectiveId,
        score: record.score!,
        date: record.completedAt!
      }));

      // Load user cards and optimize
      await this.loadUserCards(userId);
      this.scheduler.optimizeSchedule(userId, formattedHistory);
      await this.saveUserCards(userId);

    } catch (error) {
      console.error('Error optimizing user schedules:', error);
      throw error;
    }
  }

  /**
   * Bulk process overdue retention checks
   */
  async processOverdueRetentionChecks(maxAge: number = 7): Promise<number> {
    try {
      const cutoffDate = new Date(Date.now() - maxAge * 24 * 60 * 60 * 1000);

      const overdueSchedules = await this.prisma.retentionSchedule.findMany({
        where: {
          isCompleted: false,
          dueDate: {
            lt: cutoffDate
          }
        },
        take: this.options.batchSize || 50
      });

      let processedCount = 0;

      for (const schedule of overdueSchedules) {
        // Increase priority and adjust due date
        const newDueDate = new Date();
        const newPriority = Math.min(5, schedule.priority + 1);

        await this.prisma.retentionSchedule.update({
          where: { id: schedule.id },
          data: {
            dueDate: newDueDate,
            priority: newPriority,
            scheduleType: 'remediation'
          }
        });

        processedCount++;
      }

      return processedCount;

    } catch (error) {
      console.error('Error processing overdue retention checks:', error);
      throw error;
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private async createRetentionAssessment(
    schedule: RetentionSchedule & { assessmentId?: string }
  ): Promise<AssessmentResponse> {
    // Create assessment for retention check
    const assessmentData: CreateAssessmentRequest = {
      title: `Retention Check - ${schedule.objectiveId}`,
      description: `Spaced repetition review for learning objective`,
      type: 'retention_check',
      timeLimit: schedule.estimatedDuration * 60, // Convert to seconds
      maxAttempts: 1,
      masteryThreshold: 80,
      scheduledDelay: Math.ceil((schedule.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      isPublished: true
    };

    // In a real implementation, this would create assessment questions
    // based on the objective and difficulty adjustment
    const assessment = await this.prisma.assessment.create({
      data: {
        ...assessmentData,
        type: assessmentData.type as any
      }
    });

    return {
      id: assessment.id,
      title: assessment.title,
      description: assessment.description || '',
      type: assessment.type as any,
      timeLimit: assessment.timeLimit,
      maxAttempts: assessment.maxAttempts,
      masteryThreshold: assessment.masteryThreshold,
      scheduledDelay: assessment.scheduledDelay,
      isPublished: assessment.isPublished,
      createdAt: assessment.createdAt.toISOString(),
      updatedAt: assessment.updatedAt.toISOString()
    };
  }

  private async saveScheduleRecord(
    schedule: RetentionSchedule & { assessmentId?: string }
  ): Promise<RetentionScheduleRecord> {
    const record = await this.prisma.retentionSchedule.create({
      data: {
        userId: schedule.userId,
        objectiveId: schedule.objectiveId,
        lessonId: schedule.lessonId,
        assessmentId: schedule.assessmentId,
        scheduleType: schedule.scheduleType,
        dueDate: schedule.dueDate,
        priority: schedule.priority,
        estimatedDuration: schedule.estimatedDuration,
        isCompleted: false,
        metadata: schedule.metadata
      }
    });

    return this.mapToScheduleRecord(record);
  }

  private mapToScheduleRecord(record: any): RetentionScheduleRecord {
    return {
      id: record.id,
      userId: record.userId,
      objectiveId: record.objectiveId,
      lessonId: record.lessonId,
      assessmentId: record.assessmentId,
      scheduleType: record.scheduleType,
      dueDate: record.dueDate,
      priority: record.priority,
      estimatedDuration: record.estimatedDuration,
      isCompleted: record.isCompleted,
      completedAt: record.completedAt,
      score: record.score,
      metadata: record.metadata,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }

  private async loadUserCards(userId: string): Promise<void> {
    try {
      // In a real implementation, this would load from a dedicated table
      // For now, we'll simulate with an in-memory approach
      const existingCards = await this.prisma.spacedRepetitionCard?.findMany({
        where: { userId }
      }) || [];

      if (existingCards.length > 0) {
        this.scheduler.importCards(existingCards.map(card => ({
          objectiveId: card.objectiveId,
          userId: card.userId,
          interval: card.interval,
          repetition: card.repetition,
          easeFactor: card.easeFactor,
          dueDate: card.dueDate,
          lastReviewDate: card.lastReviewDate,
          lastScore: card.lastScore,
          totalReviews: card.totalReviews,
          successfulReviews: card.successfulReviews
        })));
      }
    } catch (error) {
      // Table might not exist yet, that's OK
      console.warn('Could not load spaced repetition cards:', error);
    }
  }

  private async saveUserCards(userId: string): Promise<void> {
    try {
      const cards = this.scheduler.exportCards().filter(card => card.userId === userId);

      // In a real implementation, this would save to a dedicated table
      // For now, we'll skip persistence of cards
      console.debug(`Would save ${cards.length} spaced repetition cards for user ${userId}`);
    } catch (error) {
      console.warn('Could not save spaced repetition cards:', error);
    }
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create retention service with default configuration
 */
export function createRetentionService(
  prisma: PrismaClient,
  options: RetentionServiceOptions = {}
): RetentionService {
  return new RetentionService(prisma, options);
}

/**
 * Create retention service for specific user context
 */
export function createUserRetentionService(
  prisma: PrismaClient,
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  options: RetentionServiceOptions = {}
): RetentionService {
  return new RetentionService(prisma, {
    ...options,
    context: userLevel
  });
}