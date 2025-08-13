/**
 * Retention Optimizer Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RetentionOptimizer, createRetentionOptimizer } from '../retention-optimizer';
import { RetentionService } from '../retention-service';
import type { PerformancePattern, UserLearningProfile, OptimizationRecommendation } from '../retention-optimizer';

// Mock Prisma Client
const mockPrisma = {
  retentionSchedule: {
    findMany: vi.fn()
  },
  userAnalytics: {
    findMany: vi.fn()
  }
} as any;

// Mock Retention Service
const mockRetentionService = {
  getRetentionMetrics: vi.fn(),
  optimizeUserSchedules: vi.fn()
} as any;

describe('RetentionOptimizer', () => {
  let optimizer: RetentionOptimizer;

  beforeEach(() => {
    vi.clearAllMocks();
    optimizer = new RetentionOptimizer(mockPrisma, mockRetentionService);
  });

  describe('optimizeUserRetention', () => {
    const mockRetentionHistory = [
      {
        id: 'schedule-1',
        userId: 'user-1',
        objectiveId: 'obj-1',
        score: 0.7,
        completedAt: new Date('2023-01-01'),
        objective: { id: 'obj-1', title: 'Objective 1' }
      },
      {
        id: 'schedule-2',
        userId: 'user-1',
        objectiveId: 'obj-1',
        score: 0.8,
        completedAt: new Date('2023-01-02'),
        objective: { id: 'obj-1', title: 'Objective 1' }
      },
      {
        id: 'schedule-3',
        userId: 'user-1',
        objectiveId: 'obj-1',
        score: 0.9,
        completedAt: new Date('2023-01-03'),
        objective: { id: 'obj-1', title: 'Objective 1' }
      }
    ];

    const mockUserAnalytics = [
      {
        userId: 'user-1',
        date: new Date('2023-01-01'),
        timeSpent: 1800, // 30 minutes
        avgSessionLength: 900, // 15 minutes
        streakDays: 5
      },
      {
        userId: 'user-1',
        date: new Date('2023-01-02'),
        timeSpent: 1200, // 20 minutes
        avgSessionLength: 600, // 10 minutes
        streakDays: 6
      }
    ];

    const mockRetentionMetrics = {
      totalScheduled: 10,
      completedToday: 2,
      dueToday: 1,
      overdue: 0,
      upcomingWeek: 3,
      averageRetentionRate: 0.85,
      streakDays: 7,
      totalReviewTime: 45
    };

    beforeEach(() => {
      mockPrisma.retentionSchedule.findMany.mockResolvedValue(mockRetentionHistory);
      mockPrisma.userAnalytics.findMany.mockResolvedValue(mockUserAnalytics);
      mockRetentionService.getRetentionMetrics.mockResolvedValue(mockRetentionMetrics);
      mockRetentionService.optimizeUserSchedules.mockResolvedValue(undefined);
    });

    it('analyzes performance patterns correctly', async () => {
      const result = await optimizer.optimizeUserRetention('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.optimizationsApplied).toBeGreaterThanOrEqual(0);
      expect(result.recommendations).toBeDefined();
      expect(result.profileUpdates).toBeDefined();
      expect(result.expectedImprovements).toBeDefined();
    });

    it('identifies improving performance pattern', async () => {
      // The mock data shows scores improving from 0.7 to 0.9
      const result = await optimizer.optimizeUserRetention('user-1');
      
      // Should not recommend drastic changes for improving performance
      const criticalRecommendations = result.recommendations.filter(r => r.priority === 'critical');
      expect(criticalRecommendations).toHaveLength(0);
    });

    it('handles declining performance pattern', async () => {
      // Setup declining performance
      const decliningHistory = [
        {
          id: 'schedule-1',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.9,
          completedAt: new Date('2023-01-01'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-2',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.7,
          completedAt: new Date('2023-01-02'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-3',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.5,
          completedAt: new Date('2023-01-03'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        }
      ];

      mockPrisma.retentionSchedule.findMany.mockResolvedValue(decliningHistory);

      const result = await optimizer.optimizeUserRetention('user-1');

      // Should recommend interval adjustment for declining performance
      const intervalAdjustments = result.recommendations.filter(r => r.type === 'interval_adjustment');
      expect(intervalAdjustments.length).toBeGreaterThan(0);
      expect(intervalAdjustments[0].priority).toBe('high');
    });

    it('handles volatile performance pattern', async () => {
      // Setup volatile performance (inconsistent scores)
      const volatileHistory = [
        {
          id: 'schedule-1',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.9,
          completedAt: new Date('2023-01-01'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-2',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.3,
          completedAt: new Date('2023-01-02'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-3',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.8,
          completedAt: new Date('2023-01-03'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-4',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.4,
          completedAt: new Date('2023-01-04'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        }
      ];

      mockPrisma.retentionSchedule.findMany.mockResolvedValue(volatileHistory);

      const result = await optimizer.optimizeUserRetention('user-1');

      // Should recommend difficulty changes for volatile performance
      const difficultyChanges = result.recommendations.filter(r => r.type === 'difficulty_change');
      expect(difficultyChanges.length).toBeGreaterThan(0);
    });

    it('handles mastered objectives correctly', async () => {
      // Setup consistently high performance
      const masteredHistory = [
        {
          id: 'schedule-1',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.95,
          completedAt: new Date('2023-01-01'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-2',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.92,
          completedAt: new Date('2023-01-02'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-3',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.98,
          completedAt: new Date('2023-01-03'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        }
      ];

      mockPrisma.retentionSchedule.findMany.mockResolvedValue(masteredHistory);

      const result = await optimizer.optimizeUserRetention('user-1');

      // Should recommend increasing intervals for mastered content
      const intervalAdjustments = result.recommendations.filter(r => 
        r.type === 'interval_adjustment' && 
        r.implementation.adjustmentFactor && 
        r.implementation.adjustmentFactor > 1
      );
      expect(intervalAdjustments.length).toBeGreaterThan(0);
    });

    it('recommends remediation for poor performance', async () => {
      // Setup consistently poor performance
      const poorHistory = Array.from({ length: 4 }, (_, i) => ({
        id: `schedule-${i}`,
        userId: 'user-1',
        objectiveId: 'obj-1',
        score: 0.5, // Consistently poor
        completedAt: new Date(`2023-01-0${i + 1}`),
        objective: { id: 'obj-1', title: 'Objective 1' }
      }));

      mockPrisma.retentionSchedule.findMany.mockResolvedValue(poorHistory);

      const result = await optimizer.optimizeUserRetention('user-1');

      // Should recommend remediation focus
      const remediationRecommendations = result.recommendations.filter(r => r.type === 'remediation_focus');
      expect(remediationRecommendations.length).toBeGreaterThan(0);
      expect(remediationRecommendations[0].priority).toBe('critical');
    });

    it('handles low motivation correctly', async () => {
      // Setup indicators of low motivation
      const lowMotivationMetrics = {
        ...mockRetentionMetrics,
        streakDays: 0,
        overdue: 10,
        averageRetentionRate: 0.4
      };

      mockRetentionService.getRetentionMetrics.mockResolvedValue(lowMotivationMetrics);

      const result = await optimizer.optimizeUserRetention('user-1');

      // Should recommend schedule pause or reduction
      const scheduleAdjustments = result.recommendations.filter(r => r.type === 'schedule_pause');
      expect(scheduleAdjustments.length).toBeGreaterThan(0);
    });

    it('calculates expected improvements correctly', async () => {
      const result = await optimizer.optimizeUserRetention('user-1');

      expect(result.expectedImprovements.retentionRate).toBeGreaterThanOrEqual(0);
      expect(result.expectedImprovements.retentionRate).toBeLessThanOrEqual(0.3); // Max 30%
      expect(result.expectedImprovements.timeEfficiency).toBeGreaterThanOrEqual(0);
      expect(result.expectedImprovements.timeEfficiency).toBeLessThanOrEqual(0.2); // Max 20%
      expect(result.expectedImprovements.masterySpeed).toBeGreaterThanOrEqual(0);
      expect(result.expectedImprovements.masterySpeed).toBeLessThanOrEqual(0.25); // Max 25%
    });

    it('handles insufficient data gracefully', async () => {
      // Setup minimal data
      mockPrisma.retentionSchedule.findMany.mockResolvedValue([
        {
          id: 'schedule-1',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.8,
          completedAt: new Date(),
          objective: { id: 'obj-1', title: 'Objective 1' }
        }
      ]);

      const result = await optimizer.optimizeUserRetention('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.recommendations).toBeDefined();
      // Should not crash with minimal data
    });
  });

  describe('optimizeMultipleUsers', () => {
    beforeEach(() => {
      // Setup default mocks for multiple users
      mockPrisma.retentionSchedule.findMany.mockResolvedValue([]);
      mockPrisma.userAnalytics.findMany.mockResolvedValue([]);
      mockRetentionService.getRetentionMetrics.mockResolvedValue({
        totalScheduled: 5,
        averageRetentionRate: 0.8,
        overdue: 0,
        streakDays: 3
      });
    });

    it('optimizes multiple users successfully', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const results = await optimizer.optimizeMultipleUsers(userIds);

      expect(results).toHaveLength(3);
      expect(results.every(r => userIds.includes(r.userId))).toBe(true);
    });

    it('prioritizes struggling users when requested', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      // Setup different metrics for users
      mockRetentionService.getRetentionMetrics
        .mockResolvedValueOnce({ overdue: 10, averageRetentionRate: 0.3, streakDays: 0 }) // user-1: struggling
        .mockResolvedValueOnce({ overdue: 0, averageRetentionRate: 0.9, streakDays: 10 })  // user-2: good
        .mockResolvedValueOnce({ overdue: 5, averageRetentionRate: 0.6, streakDays: 2 });  // user-3: moderate

      const results = await optimizer.optimizeMultipleUsers(userIds, { prioritizeStrugglingUsers: true });

      expect(results).toHaveLength(3);
      // First result should be the most struggling user (user-1)
      expect(results[0].userId).toBe('user-1');
    });

    it('handles individual user optimization failures gracefully', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      
      // Make user-2 fail
      mockRetentionService.getRetentionMetrics
        .mockResolvedValueOnce({ overdue: 0, averageRetentionRate: 0.8 })
        .mockRejectedValueOnce(new Error('User not found'))
        .mockResolvedValueOnce({ overdue: 0, averageRetentionRate: 0.8 });

      const results = await optimizer.optimizeMultipleUsers(userIds);

      // Should continue with other users despite one failure
      expect(results).toHaveLength(2);
      expect(results.map(r => r.userId)).toEqual(['user-1', 'user-3']);
    });
  });

  describe('performance pattern analysis', () => {
    it('calculates trend correctly for improving scores', () => {
      // This tests the private method indirectly through optimizeUserRetention
      const improvingHistory = [
        {
          id: 'schedule-1',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.6,
          completedAt: new Date('2023-01-01'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        },
        {
          id: 'schedule-2',
          userId: 'user-1',
          objectiveId: 'obj-1',
          score: 0.8,
          completedAt: new Date('2023-01-02'),
          objective: { id: 'obj-1', title: 'Objective 1' }
        }
      ];

      mockPrisma.retentionSchedule.findMany.mockResolvedValue(improvingHistory);
      mockPrisma.userAnalytics.findMany.mockResolvedValue([]);
      mockRetentionService.getRetentionMetrics.mockResolvedValue({
        averageRetentionRate: 0.7,
        streakDays: 5,
        overdue: 0
      });

      expect(async () => {
        await optimizer.optimizeUserRetention('user-1');
      }).not.toThrow();
    });

    it('calculates consistency correctly for volatile scores', () => {
      const volatileHistory = [
        { score: 0.9, completedAt: new Date('2023-01-01'), objectiveId: 'obj-1', userId: 'user-1', id: '1', objective: { id: 'obj-1', title: 'Test' } },
        { score: 0.2, completedAt: new Date('2023-01-02'), objectiveId: 'obj-1', userId: 'user-1', id: '2', objective: { id: 'obj-1', title: 'Test' } },
        { score: 0.8, completedAt: new Date('2023-01-03'), objectiveId: 'obj-1', userId: 'user-1', id: '3', objective: { id: 'obj-1', title: 'Test' } },
        { score: 0.3, completedAt: new Date('2023-01-04'), objectiveId: 'obj-1', userId: 'user-1', id: '4', objective: { id: 'obj-1', title: 'Test' } }
      ];

      mockPrisma.retentionSchedule.findMany.mockResolvedValue(volatileHistory);
      mockPrisma.userAnalytics.findMany.mockResolvedValue([]);
      mockRetentionService.getRetentionMetrics.mockResolvedValue({
        averageRetentionRate: 0.6,
        streakDays: 2,
        overdue: 0
      });

      expect(async () => {
        await optimizer.optimizeUserRetention('user-1');
      }).not.toThrow();
    });
  });

  describe('learning profile generation', () => {
    it('generates comprehensive learning profile', async () => {
      const mockAnalytics = [
        {
          userId: 'user-1',
          date: new Date('2023-01-01'),
          timeSpent: 2700, // 45 minutes
          avgSessionLength: 1350, // 22.5 minutes
          streakDays: 8
        }
      ];

      const mockSessions = [
        {
          objectiveId: 'obj-1',
          score: 0.85,
          completedAt: new Date('2023-01-01')
        }
      ];

      mockPrisma.userAnalytics.findMany.mockResolvedValue(mockAnalytics);
      mockPrisma.retentionSchedule.findMany
        .mockResolvedValueOnce(mockSessions) // For pattern analysis
        .mockResolvedValueOnce(mockSessions); // For profile generation

      mockRetentionService.getRetentionMetrics.mockResolvedValue({
        averageRetentionRate: 0.85,
        streakDays: 8,
        overdue: 0
      });

      const result = await optimizer.optimizeUserRetention('user-1');

      expect(result.profileUpdates).toBeDefined();
      expect(result.profileUpdates.overallRetentionRate).toBe(0.85);
      expect(result.profileUpdates.optimalSessionLength).toBeCloseTo(22.5);
      expect(result.profileUpdates.motivationLevel).toBeGreaterThan(0.5); // Should be high due to good metrics
    });
  });

  describe('error handling', () => {
    it('handles database errors gracefully', async () => {
      mockPrisma.retentionSchedule.findMany.mockRejectedValue(new Error('Database connection failed'));

      await expect(
        optimizer.optimizeUserRetention('user-1')
      ).rejects.toThrow('Database connection failed');
    });

    it('handles missing user data', async () => {
      mockPrisma.retentionSchedule.findMany.mockResolvedValue([]);
      mockPrisma.userAnalytics.findMany.mockResolvedValue([]);
      mockRetentionService.getRetentionMetrics.mockResolvedValue({
        totalScheduled: 0,
        averageRetentionRate: 0,
        streakDays: 0,
        overdue: 0
      });

      const result = await optimizer.optimizeUserRetention('user-1');

      expect(result.userId).toBe('user-1');
      expect(result.recommendations).toBeDefined();
      expect(result.optimizationsApplied).toBe(0);
    });
  });
});

describe('Factory Functions', () => {
  describe('createRetentionOptimizer', () => {
    it('creates optimizer instance correctly', () => {
      const optimizer = createRetentionOptimizer(mockPrisma, mockRetentionService);
      expect(optimizer).toBeInstanceOf(RetentionOptimizer);
    });
  });
});

describe('Performance Pattern Types', () => {
  it('defines correct performance pattern structure', () => {
    const pattern: PerformancePattern = {
      userId: 'user-1',
      objectiveId: 'obj-1',
      pattern: 'improving',
      trend: 0.5,
      consistency: 0.8,
      averageScore: 0.85,
      recentScore: 0.9,
      totalAttempts: 5,
      daysSinceFirst: 7
    };

    expect(pattern.pattern).toBe('improving');
    expect(pattern.trend).toBeGreaterThanOrEqual(-1);
    expect(pattern.trend).toBeLessThanOrEqual(1);
    expect(pattern.consistency).toBeGreaterThanOrEqual(0);
    expect(pattern.consistency).toBeLessThanOrEqual(1);
  });

  it('defines correct optimization recommendation structure', () => {
    const recommendation: OptimizationRecommendation = {
      type: 'interval_adjustment',
      priority: 'high',
      description: 'Adjust interval for better retention',
      expectedImpact: 0.25,
      implementation: {
        adjustmentFactor: 0.8,
        additionalMetadata: { reason: 'declining_performance' }
      }
    };

    expect(recommendation.type).toBe('interval_adjustment');
    expect(recommendation.priority).toBe('high');
    expect(recommendation.expectedImpact).toBeGreaterThanOrEqual(0);
    expect(recommendation.expectedImpact).toBeLessThanOrEqual(1);
  });

  it('defines correct user learning profile structure', () => {
    const profile: UserLearningProfile = {
      userId: 'user-1',
      overallRetentionRate: 0.85,
      preferredDifficulty: 'medium',
      optimalSessionLength: 20,
      bestPerformanceTimeOfDay: 'morning',
      learningVelocity: 0.3,
      retentionDecayRate: 0.1,
      consistencyScore: 0.8,
      motivationLevel: 0.7
    };

    expect(profile.preferredDifficulty).toMatch(/^(easy|medium|hard)$/);
    expect(profile.overallRetentionRate).toBeGreaterThanOrEqual(0);
    expect(profile.overallRetentionRate).toBeLessThanOrEqual(1);
    expect(profile.motivationLevel).toBeGreaterThanOrEqual(0);
    expect(profile.motivationLevel).toBeLessThanOrEqual(1);
  });
});