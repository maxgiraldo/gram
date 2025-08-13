/**
 * Retention Scheduler Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  SpacedRepetitionAlgorithm, 
  RetentionScheduler,
  createRetentionScheduler,
  createContextualScheduler,
  type SpacedRepetitionCard,
  type RetentionSchedule,
  type SchedulingOptions
} from '../retention-scheduler';
import type { LearningObjective } from '../../../types/content';

describe('SpacedRepetitionAlgorithm', () => {
  let algorithm: SpacedRepetitionAlgorithm;

  beforeEach(() => {
    algorithm = new SpacedRepetitionAlgorithm();
  });

  describe('createCard', () => {
    it('creates initial card with correct defaults', () => {
      const card = algorithm.createCard('obj-1', 'user-1');

      expect(card.objectiveId).toBe('obj-1');
      expect(card.userId).toBe('user-1');
      expect(card.interval).toBe(1);
      expect(card.repetition).toBe(0);
      expect(card.easeFactor).toBe(2.5);
      expect(card.totalReviews).toBe(0);
      expect(card.successfulReviews).toBe(0);
      expect(card.dueDate).toBeInstanceOf(Date);
    });

    it('sets due date correctly for initial interval', () => {
      const beforeCreate = Date.now();
      const card = algorithm.createCard('obj-1', 'user-1');
      const afterCreate = Date.now();

      const expectedMin = beforeCreate + 24 * 60 * 60 * 1000; // 1 day
      const expectedMax = afterCreate + 24 * 60 * 60 * 1000;

      expect(card.dueDate.getTime()).toBeGreaterThanOrEqual(expectedMin);
      expect(card.dueDate.getTime()).toBeLessThanOrEqual(expectedMax);
    });
  });

  describe('calculateNextInterval', () => {
    let baseCard: SpacedRepetitionCard;

    beforeEach(() => {
      baseCard = {
        objectiveId: 'obj-1',
        userId: 'user-1',
        interval: 1,
        repetition: 0,
        easeFactor: 2.5,
        dueDate: new Date(),
        totalReviews: 0,
        successfulReviews: 0
      };
    });

    it('handles first successful review correctly', () => {
      const result = algorithm.calculateNextInterval(baseCard, 0.9);

      expect(result.repetition).toBe(1);
      expect(result.interval).toBe(1); // Initial interval
      expect(result.successfulReviews).toBe(1);
      expect(result.totalReviews).toBe(1);
      expect(result.lastScore).toBe(0.9);
      expect(result.lastReviewDate).toBeInstanceOf(Date);
    });

    it('handles second successful review correctly', () => {
      const cardAfterFirst = {
        ...baseCard,
        repetition: 1,
        interval: 1,
        totalReviews: 1,
        successfulReviews: 1
      };

      const result = algorithm.calculateNextInterval(cardAfterFirst, 0.85);

      expect(result.repetition).toBe(2);
      expect(result.interval).toBe(6); // Second interval is 6 days
      expect(result.successfulReviews).toBe(2);
      expect(result.totalReviews).toBe(2);
    });

    it('handles subsequent successful reviews with ease factor', () => {
      const cardAfterSecond = {
        ...baseCard,
        repetition: 2,
        interval: 6,
        easeFactor: 2.5,
        totalReviews: 2,
        successfulReviews: 2
      };

      const result = algorithm.calculateNextInterval(cardAfterSecond, 0.9);

      expect(result.repetition).toBe(3);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15
      expect(result.successfulReviews).toBe(3);
      expect(result.totalReviews).toBe(3);
    });

    it('handles failed review correctly', () => {
      const cardWithHistory = {
        ...baseCard,
        repetition: 3,
        interval: 15,
        totalReviews: 3,
        successfulReviews: 3
      };

      const result = algorithm.calculateNextInterval(cardWithHistory, 0.4);

      expect(result.repetition).toBe(0); // Reset on failure
      expect(result.interval).toBe(3); // 20% of previous interval (15 * 0.2 = 3)
      expect(result.successfulReviews).toBe(3); // Unchanged
      expect(result.totalReviews).toBe(4);
    });

    it('adjusts ease factor based on performance', () => {
      const result1 = algorithm.calculateNextInterval(baseCard, 1.0); // Perfect score
      expect(result1.easeFactor).toBeGreaterThan(2.5);

      const result2 = algorithm.calculateNextInterval(baseCard, 0.5); // Poor score
      expect(result2.easeFactor).toBeLessThan(2.5);
    });

    it('enforces minimum ease factor', () => {
      const cardWithLowEase = {
        ...baseCard,
        easeFactor: 1.3 // Minimum ease factor
      };

      const result = algorithm.calculateNextInterval(cardWithLowEase, 0.3);
      expect(result.easeFactor).toBeGreaterThanOrEqual(1.3);
    });

    it('respects interval constraints', () => {
      const options: SchedulingOptions = {
        minInterval: 2,
        maxInterval: 30
      };

      const constrainedAlgorithm = new SpacedRepetitionAlgorithm(options);

      // Test minimum interval
      const result1 = constrainedAlgorithm.calculateNextInterval(baseCard, 0.1);
      expect(result1.interval).toBeGreaterThanOrEqual(2);

      // Test maximum interval
      const cardWithLongInterval = {
        ...baseCard,
        repetition: 10,
        interval: 25,
        easeFactor: 3.0
      };

      const result2 = constrainedAlgorithm.calculateNextInterval(cardWithLongInterval, 1.0);
      expect(result2.interval).toBeLessThanOrEqual(30);
    });
  });
});

describe('RetentionScheduler', () => {
  let scheduler: RetentionScheduler;
  let mockObjectives: LearningObjective[];

  beforeEach(() => {
    scheduler = new RetentionScheduler();
    mockObjectives = [
      {
        id: 'obj-1',
        title: 'Basic Grammar',
        description: 'Test objective 1',
        category: 'knowledge',
        masteryThreshold: 0.8
      },
      {
        id: 'obj-2',
        title: 'Advanced Grammar',
        description: 'Test objective 2',
        category: 'application',
        masteryThreshold: 0.8
      }
    ] as LearningObjective[];
  });

  describe('scheduleInitialRetention', () => {
    it('creates schedules for all objectives', () => {
      const schedules = scheduler.scheduleInitialRetention(
        'user-1',
        'lesson-1',
        mockObjectives
      );

      expect(schedules).toHaveLength(2);
      expect(schedules[0].objectiveId).toBe('obj-1');
      expect(schedules[1].objectiveId).toBe('obj-2');
      expect(schedules[0].scheduleType).toBe('initial');
      expect(schedules[0].assessmentType).toBe('retention_check');
    });

    it('sets appropriate priorities for different objectives', () => {
      const schedules = scheduler.scheduleInitialRetention(
        'user-1',
        'lesson-1',
        mockObjectives
      );

      // Application objectives should have higher priority than knowledge
      const knowledgeSchedule = schedules.find(s => s.objectiveId === 'obj-1');
      const applicationSchedule = schedules.find(s => s.objectiveId === 'obj-2');

      expect(applicationSchedule?.priority).toBeGreaterThanOrEqual(knowledgeSchedule?.priority || 0);
    });

    it('estimates duration based on objective category', () => {
      const schedules = scheduler.scheduleInitialRetention(
        'user-1',
        'lesson-1',
        mockObjectives
      );

      const knowledgeSchedule = schedules.find(s => s.objectiveId === 'obj-1');
      const applicationSchedule = schedules.find(s => s.objectiveId === 'obj-2');

      expect(applicationSchedule?.estimatedDuration).toBeGreaterThan(knowledgeSchedule?.estimatedDuration || 0);
    });
  });

  describe('updateScheduleFromPerformance', () => {
    beforeEach(() => {
      // Initialize with some schedules
      scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);
    });

    it('creates review schedule for good performance', () => {
      const nextSchedule = scheduler.updateScheduleFromPerformance(
        'user-1',
        'obj-1',
        0.85, // Good score
        10 // Fast response
      );

      expect(nextSchedule).toBeTruthy();
      expect(nextSchedule?.scheduleType).toBe('review');
      expect(nextSchedule?.priority).toBeLessThanOrEqual(4);
    });

    it('creates remediation schedule for poor performance', () => {
      const nextSchedule = scheduler.updateScheduleFromPerformance(
        'user-1',
        'obj-1',
        0.5 // Poor score
      );

      expect(nextSchedule).toBeTruthy();
      expect(nextSchedule?.scheduleType).toBe('remediation');
      expect(nextSchedule?.priority).toBeGreaterThan(3);
    });

    it('creates reinforcement schedule for excellent performance', () => {
      // First, build up successful reviews
      for (let i = 0; i < 3; i++) {
        scheduler.updateScheduleFromPerformance('user-1', 'obj-1', 0.95);
      }

      const nextSchedule = scheduler.updateScheduleFromPerformance(
        'user-1',
        'obj-1',
        0.95 // Excellent score
      );

      expect(nextSchedule?.scheduleType).toBe('reinforcement');
    });

    it('handles unknown objective gracefully', () => {
      const nextSchedule = scheduler.updateScheduleFromPerformance(
        'user-1',
        'unknown-obj',
        0.8
      );

      expect(nextSchedule).toBeNull();
    });
  });

  describe('getDueRetentionChecks', () => {
    beforeEach(() => {
      scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);
    });

    it('returns due schedules correctly', () => {
      const futureDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
      const dueSchedules = scheduler.getDueRetentionChecks('user-1', futureDate);

      expect(dueSchedules.length).toBeGreaterThan(0);
      expect(dueSchedules.every(s => s.dueDate.getTime() <= futureDate.getTime())).toBe(true);
    });

    it('sorts schedules by priority and due date', () => {
      // Create schedules with different priorities
      scheduler.updateScheduleFromPerformance('user-1', 'obj-1', 0.4); // Should create high priority
      scheduler.updateScheduleFromPerformance('user-1', 'obj-2', 0.9); // Should create lower priority

      const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const dueSchedules = scheduler.getDueRetentionChecks('user-1', futureDate);

      // Should be sorted by priority (descending)
      for (let i = 0; i < dueSchedules.length - 1; i++) {
        expect(dueSchedules[i].priority).toBeGreaterThanOrEqual(dueSchedules[i + 1].priority);
      }
    });

    it('excludes future schedules when not due', () => {
      const currentDate = new Date();
      const dueSchedules = scheduler.getDueRetentionChecks('user-1', currentDate, false);

      expect(dueSchedules.every(s => s.dueDate.getTime() <= currentDate.getTime())).toBe(true);
    });
  });

  describe('generateRetentionMetrics', () => {
    beforeEach(() => {
      scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);
      
      // Simulate some completed reviews
      scheduler.updateScheduleFromPerformance('user-1', 'obj-1', 0.8);
      scheduler.updateScheduleFromPerformance('user-1', 'obj-2', 0.9);
    });

    it('generates comprehensive metrics', () => {
      const metrics = scheduler.generateRetentionMetrics('user-1');

      expect(metrics.totalScheduled).toBeGreaterThan(0);
      expect(metrics.averageRetentionRate).toBeGreaterThanOrEqual(0);
      expect(metrics.averageRetentionRate).toBeLessThanOrEqual(1);
      expect(metrics.totalReviewTime).toBeGreaterThanOrEqual(0);
      expect(metrics.streakDays).toBeGreaterThanOrEqual(0);
    });

    it('calculates due and overdue counts correctly', () => {
      const metrics = scheduler.generateRetentionMetrics('user-1');

      expect(metrics.dueToday).toBeGreaterThanOrEqual(0);
      expect(metrics.overdue).toBeGreaterThanOrEqual(0);
      expect(metrics.upcomingWeek).toBeGreaterThanOrEqual(0);
    });
  });

  describe('optimizeSchedule', () => {
    beforeEach(() => {
      scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);
    });

    it('adjusts ease factors based on performance history', () => {
      const performanceHistory = [
        { objectiveId: 'obj-1', score: 0.9, date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
        { objectiveId: 'obj-1', score: 0.95, date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
        { objectiveId: 'obj-1', score: 0.92, date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
      ];

      const cardsBefore = scheduler.exportCards().filter(c => c.userId === 'user-1');
      scheduler.optimizeSchedule('user-1', performanceHistory);
      const cardsAfter = scheduler.exportCards().filter(c => c.userId === 'user-1');

      // Should have adjusted ease factors for good performance
      const objCard = cardsAfter.find(c => c.objectiveId === 'obj-1');
      expect(objCard?.easeFactor).toBeDefined();
    });

    it('handles insufficient data gracefully', () => {
      const performanceHistory = [
        { objectiveId: 'obj-1', score: 0.8, date: new Date() }
      ];

      expect(() => {
        scheduler.optimizeSchedule('user-1', performanceHistory);
      }).not.toThrow();
    });
  });

  describe('card import/export', () => {
    it('exports and imports cards correctly', () => {
      scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);
      
      const exportedCards = scheduler.exportCards();
      expect(exportedCards.length).toBeGreaterThan(0);

      const newScheduler = new RetentionScheduler();
      newScheduler.importCards(exportedCards);

      const reimportedCards = newScheduler.exportCards();
      expect(reimportedCards).toHaveLength(exportedCards.length);
      
      for (let i = 0; i < exportedCards.length; i++) {
        expect(reimportedCards[i].objectiveId).toBe(exportedCards[i].objectiveId);
        expect(reimportedCards[i].userId).toBe(exportedCards[i].userId);
        expect(reimportedCards[i].interval).toBe(exportedCards[i].interval);
      }
    });
  });
});

describe('Factory Functions', () => {
  describe('createRetentionScheduler', () => {
    it('creates scheduler with default options', () => {
      const scheduler = createRetentionScheduler();
      expect(scheduler).toBeInstanceOf(RetentionScheduler);
    });

    it('creates scheduler with custom options', () => {
      const options: SchedulingOptions = {
        initialInterval: 2,
        performanceThreshold: 0.85
      };

      const scheduler = createRetentionScheduler(options);
      expect(scheduler).toBeInstanceOf(RetentionScheduler);
    });
  });

  describe('createContextualScheduler', () => {
    it('creates beginner-optimized scheduler', () => {
      const scheduler = createContextualScheduler('beginner');
      expect(scheduler).toBeInstanceOf(RetentionScheduler);
    });

    it('creates intermediate-optimized scheduler', () => {
      const scheduler = createContextualScheduler('intermediate');
      expect(scheduler).toBeInstanceOf(RetentionScheduler);
    });

    it('creates advanced-optimized scheduler', () => {
      const scheduler = createContextualScheduler('advanced');
      expect(scheduler).toBeInstanceOf(RetentionScheduler);
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  let scheduler: RetentionScheduler;

  beforeEach(() => {
    scheduler = new RetentionScheduler();
  });

  it('handles empty objectives list', () => {
    const schedules = scheduler.scheduleInitialRetention('user-1', 'lesson-1', []);
    expect(schedules).toHaveLength(0);
  });

  it('handles extreme scores', () => {
    const mockObjectives = [{
      id: 'obj-1',
      title: 'Test',
      description: 'Test',
      category: 'knowledge',
      masteryThreshold: 0.8
    }] as LearningObjective[];

    scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);

    // Test with score = 0
    expect(() => {
      scheduler.updateScheduleFromPerformance('user-1', 'obj-1', 0);
    }).not.toThrow();

    // Test with score = 1
    expect(() => {
      scheduler.updateScheduleFromPerformance('user-1', 'obj-1', 1);
    }).not.toThrow();
  });

  it('handles very long response times', () => {
    const mockObjectives = [{
      id: 'obj-1',
      title: 'Test',
      description: 'Test',
      category: 'knowledge',
      masteryThreshold: 0.8
    }] as LearningObjective[];

    scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);

    expect(() => {
      scheduler.updateScheduleFromPerformance('user-1', 'obj-1', 0.8, 10000); // Very slow
    }).not.toThrow();
  });

  it('handles multiple users correctly', () => {
    const mockObjectives = [{
      id: 'obj-1',
      title: 'Test',
      description: 'Test',
      category: 'knowledge',
      masteryThreshold: 0.8
    }] as LearningObjective[];

    scheduler.scheduleInitialRetention('user-1', 'lesson-1', mockObjectives);
    scheduler.scheduleInitialRetention('user-2', 'lesson-1', mockObjectives);

    const user1Schedules = scheduler.getDueRetentionChecks('user-1');
    const user2Schedules = scheduler.getDueRetentionChecks('user-2');

    expect(user1Schedules.every(s => s.userId === 'user-1')).toBe(true);
    expect(user2Schedules.every(s => s.userId === 'user-2')).toBe(true);
  });
});