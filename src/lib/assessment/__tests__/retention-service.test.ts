/**
 * Retention Service Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetentionService, createRetentionService } from '../retention-service';
import type { AssessmentAttemptResponse } from '../../../types/api';

// Mock Prisma Client
const mockPrisma = {
  lesson: {
    findUnique: vi.fn()
  },
  retentionSchedule: {
    create: vi.fn(),
    update: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn()
  },
  assessment: {
    create: vi.fn()
  },
  assessmentQuestion: {
    create: vi.fn()
  },
  exerciseResponse: {
    findMany: vi.fn()
  },
  spacedRepetitionCard: {
    findMany: vi.fn()
  }
} as any;

describe('RetentionService', () => {
  let service: RetentionService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new RetentionService(mockPrisma);
  });

  describe('scheduleRetentionChecks', () => {
    const mockLesson = {
      id: 'lesson-1',
      title: 'Test Lesson',
      objectives: [
        {
          id: 'obj-1',
          title: 'Objective 1',
          category: 'knowledge',
          masteryThreshold: 0.8
        },
        {
          id: 'obj-2',
          title: 'Objective 2',
          category: 'application',
          masteryThreshold: 0.8
        }
      ],
      unit: {
        id: 'unit-1',
        title: 'Test Unit'
      }
    };

    beforeEach(() => {
      mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
      mockPrisma.assessment.create.mockResolvedValue({
        id: 'assessment-1',
        title: 'Retention Check',
        description: 'Test assessment',
        type: 'retention_check',
        timeLimit: 300,
        maxAttempts: 1,
        masteryThreshold: 80,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockPrisma.retentionSchedule.create.mockResolvedValue({
        id: 'schedule-1',
        userId: 'user-1',
        objectiveId: 'obj-1',
        lessonId: 'lesson-1',
        assessmentId: 'assessment-1',
        scheduleType: 'initial',
        dueDate: new Date(),
        priority: 3,
        estimatedDuration: 5,
        isCompleted: false,
        metadata: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('creates retention schedules for all objectives', async () => {
      const schedules = await service.scheduleRetentionChecks('user-1', 'lesson-1');

      expect(mockPrisma.lesson.findUnique).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        include: {
          objectives: true,
          unit: true
        }
      });

      expect(schedules).toHaveLength(2);
      expect(mockPrisma.assessment.create).toHaveBeenCalledTimes(2);
      expect(mockPrisma.retentionSchedule.create).toHaveBeenCalledTimes(2);
    });

    it('handles lesson not found', async () => {
      mockPrisma.lesson.findUnique.mockResolvedValue(null);

      await expect(
        service.scheduleRetentionChecks('user-1', 'nonexistent-lesson')
      ).rejects.toThrow('Lesson not found: nonexistent-lesson');
    });

    it('handles database errors gracefully', async () => {
      mockPrisma.lesson.findUnique.mockRejectedValue(new Error('Database error'));

      await expect(
        service.scheduleRetentionChecks('user-1', 'lesson-1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('processRetentionCompletion', () => {
    const mockAttemptResult: AssessmentAttemptResponse = {
      id: 'attempt-1',
      userId: 'user-1',
      assessmentId: 'assessment-1',
      startedAt: '2023-01-01T00:00:00Z',
      completedAt: '2023-01-01T00:05:00Z',
      timeSpent: 300,
      totalQuestions: 5,
      correctAnswers: 4,
      scorePercentage: 80,
      achievedMastery: true
    };

    const mockCompletedSchedule = {
      id: 'schedule-1',
      userId: 'user-1',
      objectiveId: 'obj-1',
      lessonId: 'lesson-1',
      scheduleType: 'initial',
      dueDate: new Date(),
      priority: 3,
      estimatedDuration: 5,
      isCompleted: true,
      completedAt: new Date(),
      score: 0.8,
      metadata: {
        totalQuestions: 5,
        correctAnswers: 4,
        timeSpent: 300,
        achievedMastery: true
      }
    };

    beforeEach(() => {
      mockPrisma.retentionSchedule.update.mockResolvedValue(mockCompletedSchedule);
      mockPrisma.retentionSchedule.findUnique.mockResolvedValue(mockCompletedSchedule);
      mockPrisma.assessment.create.mockResolvedValue({
        id: 'next-assessment-1',
        title: 'Next Retention Check',
        type: 'retention_check',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      mockPrisma.retentionSchedule.create.mockResolvedValue({
        id: 'next-schedule-1',
        userId: 'user-1',
        objectiveId: 'obj-1',
        scheduleType: 'review',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    it('marks schedule as completed and creates next schedule', async () => {
      const nextSchedule = await service.processRetentionCompletion(
        'user-1',
        'schedule-1',
        mockAttemptResult
      );

      expect(mockPrisma.retentionSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-1' },
        data: {
          isCompleted: true,
          completedAt: expect.any(Date),
          score: 0.8,
          metadata: {
            totalQuestions: 5,
            correctAnswers: 4,
            timeSpent: 300,
            achievedMastery: true
          }
        }
      });

      expect(nextSchedule).toBeTruthy();
      expect(nextSchedule?.scheduleType).toBe('review');
    });

    it('handles poor performance by creating remediation schedule', async () => {
      const poorAttemptResult = {
        ...mockAttemptResult,
        scorePercentage: 50,
        correctAnswers: 2,
        achievedMastery: false
      };

      await service.processRetentionCompletion(
        'user-1',
        'schedule-1',
        poorAttemptResult
      );

      // Should create next schedule for remediation
      expect(mockPrisma.assessment.create).toHaveBeenCalled();
      expect(mockPrisma.retentionSchedule.create).toHaveBeenCalled();
    });

    it('handles schedule not found', async () => {
      mockPrisma.retentionSchedule.findUnique.mockResolvedValue(null);

      const result = await service.processRetentionCompletion(
        'user-1',
        'nonexistent-schedule',
        mockAttemptResult
      );

      expect(result).toBeNull();
    });
  });

  describe('getDueRetentionChecks', () => {
    const mockDueSchedules = [
      {
        id: 'schedule-1',
        userId: 'user-1',
        objectiveId: 'obj-1',
        isCompleted: false,
        dueDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        priority: 5,
        assessment: { id: 'assessment-1', questions: [] },
        objective: { id: 'obj-1', title: 'Objective 1' },
        lesson: { id: 'lesson-1', title: 'Lesson 1' }
      },
      {
        id: 'schedule-2',
        userId: 'user-1',
        objectiveId: 'obj-2',
        isCompleted: false,
        dueDate: new Date(), // Today
        priority: 3,
        assessment: { id: 'assessment-2', questions: [] },
        objective: { id: 'obj-2', title: 'Objective 2' },
        lesson: { id: 'lesson-1', title: 'Lesson 1' }
      }
    ];

    beforeEach(() => {
      mockPrisma.retentionSchedule.findMany.mockResolvedValue(mockDueSchedules);
    });

    it('returns due schedules sorted by priority', async () => {
      const schedules = await service.getDueRetentionChecks('user-1');

      expect(mockPrisma.retentionSchedule.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          isCompleted: false,
          dueDate: {
            lte: expect.any(Date)
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
      });

      expect(schedules).toHaveLength(2);
      expect(schedules[0].priority).toBeGreaterThanOrEqual(schedules[1].priority);
    });

    it('respects limit parameter', async () => {
      await service.getDueRetentionChecks('user-1', new Date(), 1);

      expect(mockPrisma.retentionSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1
        })
      );
    });

    it('filters by specific date', async () => {
      const specificDate = new Date('2023-01-01');
      await service.getDueRetentionChecks('user-1', specificDate);

      expect(mockPrisma.retentionSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dueDate: {
              lte: specificDate
            }
          })
        })
      );
    });
  });

  describe('getRetentionMetrics', () => {
    beforeEach(() => {
      mockPrisma.retentionSchedule.count
        .mockResolvedValueOnce(10) // totalScheduled
        .mockResolvedValueOnce(2)  // completedToday
        .mockResolvedValueOnce(3)  // dueToday
        .mockResolvedValueOnce(1)  // overdue
        .mockResolvedValueOnce(5); // upcomingWeek

      mockPrisma.retentionSchedule.findMany
        .mockResolvedValueOnce([   // completed schedules for retention rate
          { score: 0.8 },
          { score: 0.9 },
          { score: 0.7 }
        ])
        .mockResolvedValueOnce([   // time records
          { metadata: { timeSpent: 300 } },
          { metadata: { timeSpent: 600 } }
        ]);
    });

    it('calculates comprehensive retention metrics', async () => {
      const metrics = await service.getRetentionMetrics('user-1');

      expect(metrics.totalScheduled).toBe(10);
      expect(metrics.completedToday).toBe(2);
      expect(metrics.dueToday).toBe(3);
      expect(metrics.overdue).toBe(1);
      expect(metrics.upcomingWeek).toBe(5);
      expect(metrics.averageRetentionRate).toBeCloseTo(0.8); // (0.8 + 0.9 + 0.7) / 3
      expect(metrics.totalReviewTime).toBe(15); // (300 + 600) / 60 minutes
    });

    it('handles empty data gracefully', async () => {
      mockPrisma.retentionSchedule.count.mockResolvedValue(0);
      mockPrisma.retentionSchedule.findMany.mockResolvedValue([]);

      const metrics = await service.getRetentionMetrics('user-1');

      expect(metrics.totalScheduled).toBe(0);
      expect(metrics.averageRetentionRate).toBe(0);
      expect(metrics.totalReviewTime).toBe(0);
    });
  });

  describe('optimizeUserSchedules', () => {
    const mockPerformanceHistory = [
      {
        objectiveId: 'obj-1',
        score: 0.8,
        completedAt: new Date('2023-01-01')
      },
      {
        objectiveId: 'obj-1',
        score: 0.9,
        completedAt: new Date('2023-01-02')
      }
    ];

    beforeEach(() => {
      mockPrisma.retentionSchedule.findMany.mockResolvedValue(mockPerformanceHistory);
    });

    it('loads performance history and optimizes schedules', async () => {
      await service.optimizeUserSchedules('user-1');

      expect(mockPrisma.retentionSchedule.findMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
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
    });

    it('handles database errors during optimization', async () => {
      mockPrisma.retentionSchedule.findMany.mockRejectedValue(new Error('Database error'));

      await expect(
        service.optimizeUserSchedules('user-1')
      ).rejects.toThrow('Database error');
    });
  });

  describe('processOverdueRetentionChecks', () => {
    const mockOverdueSchedules = [
      {
        id: 'schedule-1',
        isCompleted: false,
        dueDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        priority: 3
      },
      {
        id: 'schedule-2',
        isCompleted: false,
        dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        priority: 2
      }
    ];

    beforeEach(() => {
      mockPrisma.retentionSchedule.findMany.mockResolvedValue(mockOverdueSchedules);
      mockPrisma.retentionSchedule.update.mockResolvedValue({});
    });

    it('processes overdue schedules and increases priority', async () => {
      const processedCount = await service.processOverdueRetentionChecks(7); // 7 days max age

      expect(mockPrisma.retentionSchedule.findMany).toHaveBeenCalledWith({
        where: {
          isCompleted: false,
          dueDate: {
            lt: expect.any(Date)
          }
        },
        take: 50 // Default batch size
      });

      expect(mockPrisma.retentionSchedule.update).toHaveBeenCalledTimes(2);
      expect(processedCount).toBe(2);

      // Verify priority increases
      expect(mockPrisma.retentionSchedule.update).toHaveBeenCalledWith({
        where: { id: 'schedule-1' },
        data: {
          dueDate: expect.any(Date),
          priority: 4, // 3 + 1
          scheduleType: 'remediation'
        }
      });
    });

    it('respects batch size limit', async () => {
      const service = new RetentionService(mockPrisma, { batchSize: 1 });
      
      await service.processOverdueRetentionChecks();

      expect(mockPrisma.retentionSchedule.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 1
        })
      );
    });

    it('handles no overdue schedules', async () => {
      mockPrisma.retentionSchedule.findMany.mockResolvedValue([]);

      const processedCount = await service.processOverdueRetentionChecks();

      expect(processedCount).toBe(0);
      expect(mockPrisma.retentionSchedule.update).not.toHaveBeenCalled();
    });
  });
});

describe('Factory Functions', () => {
  describe('createRetentionService', () => {
    it('creates service with default options', () => {
      const service = createRetentionService(mockPrisma);
      expect(service).toBeInstanceOf(RetentionService);
    });

    it('creates service with custom options', () => {
      const options = {
        context: 'beginner' as const,
        autoSchedule: false,
        batchSize: 25
      };

      const service = createRetentionService(mockPrisma, options);
      expect(service).toBeInstanceOf(RetentionService);
    });
  });
});

describe('Integration Scenarios', () => {
  let service: RetentionService;

  beforeEach(() => {
    service = new RetentionService(mockPrisma);
  });

  it('handles complete retention workflow', async () => {
    // Setup lesson with objectives
    const mockLesson = {
      id: 'lesson-1',
      objectives: [{ id: 'obj-1', category: 'knowledge', masteryThreshold: 0.8 }],
      unit: { id: 'unit-1' }
    };

    mockPrisma.lesson.findUnique.mockResolvedValue(mockLesson);
    mockPrisma.assessment.create.mockResolvedValue({ id: 'assessment-1', createdAt: new Date(), updatedAt: new Date() });
    mockPrisma.retentionSchedule.create.mockResolvedValue({
      id: 'schedule-1',
      userId: 'user-1',
      objectiveId: 'obj-1',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Step 1: Schedule initial retention checks
    const schedules = await service.scheduleRetentionChecks('user-1', 'lesson-1');
    expect(schedules).toHaveLength(1);

    // Step 2: Process completion
    mockPrisma.retentionSchedule.update.mockResolvedValue({});
    mockPrisma.retentionSchedule.findUnique.mockResolvedValue({
      id: 'schedule-1',
      objectiveId: 'obj-1',
      userId: 'user-1'
    });

    const attemptResult: AssessmentAttemptResponse = {
      id: 'attempt-1',
      userId: 'user-1',
      assessmentId: 'assessment-1',
      startedAt: '2023-01-01T00:00:00Z',
      completedAt: '2023-01-01T00:05:00Z',
      timeSpent: 300,
      totalQuestions: 5,
      correctAnswers: 4,
      scorePercentage: 80,
      achievedMastery: true
    };

    const nextSchedule = await service.processRetentionCompletion(
      'user-1',
      'schedule-1',
      attemptResult
    );

    expect(nextSchedule).toBeTruthy();
  });

  it('handles user with no retention history', async () => {
    mockPrisma.retentionSchedule.count.mockResolvedValue(0);
    mockPrisma.retentionSchedule.findMany.mockResolvedValue([]);

    const metrics = await service.getRetentionMetrics('user-1');

    expect(metrics.totalScheduled).toBe(0);
    expect(metrics.averageRetentionRate).toBe(0);
  });
});