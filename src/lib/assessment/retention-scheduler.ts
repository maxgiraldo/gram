/**
 * Retention Check Scheduler
 * 
 * Implements spaced repetition algorithms for scheduling retention assessments
 * to ensure learners maintain mastery over time and identify areas that need review.
 */

import type { 
  Assessment, 
  LearningObjective, 
  Lesson,
  ProgressStatus 
} from '../../types/content';
import type { 
  AssessmentAttemptResponse,
  ObjectiveProgressResponse,
  ProgressResponse 
} from '../../types/api';

// ===== SPACED REPETITION ALGORITHM TYPES =====

export interface SpacedRepetitionCard {
  objectiveId: string;
  userId: string;
  interval: number; // days until next review
  repetition: number; // number of successful reviews
  easeFactor: number; // 1.3 to 2.5, determines how easy the item is
  dueDate: Date;
  lastReviewDate?: Date;
  lastScore?: number;
  totalReviews: number;
  successfulReviews: number;
}

export interface RetentionSchedule {
  userId: string;
  objectiveId: string;
  lessonId?: string;
  scheduleType: 'initial' | 'review' | 'remediation' | 'reinforcement';
  dueDate: Date;
  priority: number; // 1-5, higher = more urgent
  estimatedDuration: number; // minutes
  assessmentType: 'diagnostic' | 'formative' | 'summative' | 'retention_check';
  metadata?: {
    previousScores?: number[];
    difficultyAdjustment?: number;
    personalizedHints?: string[];
  };
}

export interface SchedulingOptions {
  minInterval?: number; // minimum days between reviews (default: 1)
  maxInterval?: number; // maximum days between reviews (default: 365)
  initialInterval?: number; // first review interval (default: 1)
  easeFactor?: number; // default ease factor (default: 2.5)
  intervalModifier?: number; // multiplier for interval calculation (default: 1.0)
  performanceThreshold?: number; // score threshold for successful review (default: 0.8)
  urgencyBoost?: number; // boost factor for struggling objectives (default: 1.5)
}

export interface RetentionMetrics {
  totalScheduled: number;
  completedToday: number;
  dueToday: number;
  overdue: number;
  upcomingWeek: number;
  averageRetentionRate: number;
  streakDays: number;
  totalReviewTime: number; // minutes
}

// ===== SPACED REPETITION IMPLEMENTATION =====

export class SpacedRepetitionAlgorithm {
  private options: Required<SchedulingOptions>;

  constructor(options: SchedulingOptions = {}) {
    this.options = {
      minInterval: options.minInterval ?? 1,
      maxInterval: options.maxInterval ?? 365,
      initialInterval: options.initialInterval ?? 1,
      easeFactor: options.easeFactor ?? 2.5,
      intervalModifier: options.intervalModifier ?? 1.0,
      performanceThreshold: options.performanceThreshold ?? 0.8,
      urgencyBoost: options.urgencyBoost ?? 1.5
    };
  }

  /**
   * Calculate next review interval using SM-2 algorithm
   * Based on SuperMemo spaced repetition research
   */
  calculateNextInterval(
    card: SpacedRepetitionCard, 
    score: number, // 0.0 to 1.0
    responseTime?: number // seconds
  ): SpacedRepetitionCard {
    const isSuccessful = score >= this.options.performanceThreshold;
    let newInterval = card.interval;
    let newRepetition = card.repetition;
    let newEaseFactor = card.easeFactor;

    if (isSuccessful) {
      // Successful review
      if (newRepetition === 0) {
        newInterval = this.options.initialInterval;
      } else if (newRepetition === 1) {
        newInterval = 6;
      } else {
        newInterval = Math.round(card.interval * newEaseFactor);
      }
      newRepetition += 1;
    } else {
      // Failed review - reset repetition but keep some interval
      newRepetition = 0;
      newInterval = Math.max(1, Math.round(card.interval * 0.2));
    }

    // Adjust ease factor based on performance
    const quality = this.scoreToQuality(score, responseTime);
    newEaseFactor = Math.max(
      1.3,
      newEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    );

    // Apply constraints
    newInterval = Math.max(
      this.options.minInterval,
      Math.min(this.options.maxInterval, newInterval * this.options.intervalModifier)
    );

    const now = new Date();
    const dueDate = new Date(now.getTime() + newInterval * 24 * 60 * 60 * 1000);

    return {
      ...card,
      interval: newInterval,
      repetition: newRepetition,
      easeFactor: newEaseFactor,
      dueDate,
      lastReviewDate: now,
      lastScore: score,
      totalReviews: card.totalReviews + 1,
      successfulReviews: card.successfulReviews + (isSuccessful ? 1 : 0)
    };
  }

  /**
   * Convert score and response time to quality rating (0-5)
   */
  private scoreToQuality(score: number, responseTime?: number): number {
    let quality = Math.floor(score * 5); // 0-5 based on score

    // Adjust for response time if available
    if (responseTime !== undefined) {
      const timeBonus = responseTime < 10 ? 0.5 : responseTime < 30 ? 0 : -0.5;
      quality = Math.max(0, Math.min(5, quality + timeBonus));
    }

    return quality;
  }

  /**
   * Create initial spaced repetition card for new objective
   */
  createCard(objectiveId: string, userId: string): SpacedRepetitionCard {
    const now = new Date();
    const dueDate = new Date(now.getTime() + this.options.initialInterval * 24 * 60 * 60 * 1000);

    return {
      objectiveId,
      userId,
      interval: this.options.initialInterval,
      repetition: 0,
      easeFactor: this.options.easeFactor,
      dueDate,
      totalReviews: 0,
      successfulReviews: 0
    };
  }
}

// ===== RETENTION SCHEDULER =====

export class RetentionScheduler {
  private algorithm: SpacedRepetitionAlgorithm;
  private cards: Map<string, SpacedRepetitionCard> = new Map();

  constructor(options: SchedulingOptions = {}) {
    this.algorithm = new SpacedRepetitionAlgorithm(options);
  }

  /**
   * Schedule initial retention check after lesson completion
   */
  scheduleInitialRetention(
    userId: string,
    lessonId: string,
    objectives: LearningObjective[],
    completionDate: Date = new Date()
  ): RetentionSchedule[] {
    const schedules: RetentionSchedule[] = [];

    for (const objective of objectives) {
      const cardKey = `${userId}:${objective.id}`;
      
      // Create or update spaced repetition card
      if (!this.cards.has(cardKey)) {
        this.cards.set(cardKey, this.algorithm.createCard(objective.id, userId));
      }

      const card = this.cards.get(cardKey)!;
      
      // Calculate priority based on objective difficulty and importance
      const priority = this.calculatePriority(objective, card);

      schedules.push({
        userId,
        objectiveId: objective.id,
        lessonId,
        scheduleType: 'initial',
        dueDate: card.dueDate,
        priority,
        estimatedDuration: this.estimateDuration(objective),
        assessmentType: 'retention_check',
        metadata: {
          previousScores: [],
          difficultyAdjustment: 0
        }
      });
    }

    return schedules;
  }

  /**
   * Update schedule based on retention check performance
   */
  updateScheduleFromPerformance(
    userId: string,
    objectiveId: string,
    score: number,
    responseTime?: number,
    completedAt: Date = new Date()
  ): RetentionSchedule | null {
    const cardKey = `${userId}:${objectiveId}`;
    const currentCard = this.cards.get(cardKey);

    if (!currentCard) {
      // Create new card if none exists
      const newCard = this.algorithm.createCard(objectiveId, userId);
      this.cards.set(cardKey, newCard);
      return null;
    }

    // Calculate next interval
    const updatedCard = this.algorithm.calculateNextInterval(currentCard, score, responseTime);
    this.cards.set(cardKey, updatedCard);

    // Determine schedule type based on performance
    let scheduleType: RetentionSchedule['scheduleType'] = 'review';
    if (score < 0.6) {
      scheduleType = 'remediation';
    } else if (score > 0.9 && updatedCard.successfulReviews >= 3) {
      scheduleType = 'reinforcement';
    }

    const priority = this.calculatePriority({ id: objectiveId } as LearningObjective, updatedCard);

    return {
      userId,
      objectiveId,
      scheduleType,
      dueDate: updatedCard.dueDate,
      priority,
      estimatedDuration: this.estimateDuration({ id: objectiveId } as LearningObjective),
      assessmentType: 'retention_check',
      metadata: {
        previousScores: [...(currentCard.lastScore ? [currentCard.lastScore] : []), score],
        difficultyAdjustment: this.calculateDifficultyAdjustment(updatedCard)
      }
    };
  }

  /**
   * Get due retention checks for a user
   */
  getDueRetentionChecks(
    userId: string,
    date: Date = new Date(),
    includeOverdue: boolean = true
  ): RetentionSchedule[] {
    const dueSchedules: RetentionSchedule[] = [];
    const targetTime = date.getTime();

    for (const [cardKey, card] of this.cards.entries()) {
      if (!cardKey.startsWith(`${userId}:`)) continue;

      const isDue = card.dueDate.getTime() <= targetTime;
      const isOverdue = card.dueDate.getTime() < targetTime - 24 * 60 * 60 * 1000; // 1 day

      if (isDue && (includeOverdue || !isOverdue)) {
        const priority = this.calculatePriority({ id: card.objectiveId } as LearningObjective, card);
        
        dueSchedules.push({
          userId,
          objectiveId: card.objectiveId,
          scheduleType: isOverdue ? 'remediation' : 'review',
          dueDate: card.dueDate,
          priority: isOverdue ? Math.min(5, priority + 1) : priority,
          estimatedDuration: this.estimateDuration({ id: card.objectiveId } as LearningObjective),
          assessmentType: 'retention_check',
          metadata: {
            previousScores: card.lastScore ? [card.lastScore] : [],
            difficultyAdjustment: this.calculateDifficultyAdjustment(card)
          }
        });
      }
    }

    // Sort by priority (descending) then by due date (ascending)
    return dueSchedules.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority;
      }
      return a.dueDate.getTime() - b.dueDate.getTime();
    });
  }

  /**
   * Generate retention metrics for a user
   */
  generateRetentionMetrics(userId: string, date: Date = new Date()): RetentionMetrics {
    const userCards = Array.from(this.cards.entries())
      .filter(([key]) => key.startsWith(`${userId}:`))
      .map(([, card]) => card);

    const now = date.getTime();
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;
    const weekEnd = todayEnd + 7 * 24 * 60 * 60 * 1000;

    const totalScheduled = userCards.length;
    const dueToday = userCards.filter(card => 
      card.dueDate.getTime() >= todayStart && card.dueDate.getTime() < todayEnd
    ).length;
    const overdue = userCards.filter(card => card.dueDate.getTime() < todayStart).length;
    const upcomingWeek = userCards.filter(card => 
      card.dueDate.getTime() >= todayEnd && card.dueDate.getTime() < weekEnd
    ).length;

    // Calculate average retention rate
    const totalReviews = userCards.reduce((sum, card) => sum + card.totalReviews, 0);
    const successfulReviews = userCards.reduce((sum, card) => sum + card.successfulReviews, 0);
    const averageRetentionRate = totalReviews > 0 ? successfulReviews / totalReviews : 0;

    // Calculate streak (simplified - would need actual completion data)
    const streakDays = this.calculateStreakDays(userCards, date);

    // Estimate total review time
    const totalReviewTime = userCards.reduce((sum, card) => {
      return sum + (card.totalReviews * 3); // Assume 3 minutes per review
    }, 0);

    return {
      totalScheduled,
      completedToday: 0, // Would need actual completion data
      dueToday,
      overdue,
      upcomingWeek,
      averageRetentionRate,
      streakDays,
      totalReviewTime
    };
  }

  /**
   * Optimize schedule based on user performance patterns
   */
  optimizeSchedule(
    userId: string,
    performanceHistory: { objectiveId: string; score: number; date: Date }[]
  ): void {
    // Group performance by objective
    const objectivePerformance = new Map<string, number[]>();
    
    for (const record of performanceHistory) {
      if (!objectivePerformance.has(record.objectiveId)) {
        objectivePerformance.set(record.objectiveId, []);
      }
      objectivePerformance.get(record.objectiveId)!.push(record.score);
    }

    // Adjust cards based on performance patterns
    for (const [objectiveId, scores] of objectivePerformance.entries()) {
      const cardKey = `${userId}:${objectiveId}`;
      const card = this.cards.get(cardKey);
      
      if (!card || scores.length < 2) continue;

      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const isImproving = scores[scores.length - 1] > scores[0];
      const isConsistent = this.calculateVariance(scores) < 0.1;

      // Adjust ease factor based on performance patterns
      let adjustment = 0;
      if (avgScore > 0.9 && isConsistent) {
        adjustment = 0.1; // Make easier (longer intervals)
      } else if (avgScore < 0.7 || !isConsistent) {
        adjustment = -0.1; // Make harder (shorter intervals)
      }

      if (adjustment !== 0) {
        const adjustedCard = {
          ...card,
          easeFactor: Math.max(1.3, Math.min(2.5, card.easeFactor + adjustment))
        };
        this.cards.set(cardKey, adjustedCard);
      }
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  private calculatePriority(objective: LearningObjective, card: SpacedRepetitionCard): number {
    let priority = 3; // Base priority

    // Increase priority for overdue items
    const daysPastDue = Math.floor((Date.now() - card.dueDate.getTime()) / (24 * 60 * 60 * 1000));
    if (daysPastDue > 0) {
      priority += Math.min(2, daysPastDue);
    }

    // Increase priority for struggling objectives
    if (card.successfulReviews === 0 && card.totalReviews > 0) {
      priority += 1;
    } else if (card.totalReviews > 0) {
      const successRate = card.successfulReviews / card.totalReviews;
      if (successRate < 0.7) {
        priority += 1;
      }
    }

    // Adjust for objective category (some categories might be more important)
    if (objective.category === 'application' || objective.category === 'analysis') {
      priority += 1;
    }

    return Math.max(1, Math.min(5, priority));
  }

  private estimateDuration(objective: LearningObjective): number {
    // Base duration in minutes
    let duration = 5;

    // Adjust based on objective category
    switch (objective.category) {
      case 'knowledge':
        duration = 3;
        break;
      case 'comprehension':
        duration = 4;
        break;
      case 'application':
        duration = 6;
        break;
      case 'analysis':
      case 'synthesis':
      case 'evaluation':
        duration = 8;
        break;
    }

    return duration;
  }

  private calculateDifficultyAdjustment(card: SpacedRepetitionCard): number {
    if (card.totalReviews === 0) return 0;

    const successRate = card.successfulReviews / card.totalReviews;
    
    if (successRate > 0.9) {
      return 0.2; // Make slightly harder
    } else if (successRate < 0.6) {
      return -0.3; // Make easier
    } else if (successRate < 0.8) {
      return -0.1; // Make slightly easier
    }

    return 0; // No adjustment
  }

  private calculateStreakDays(cards: SpacedRepetitionCard[], currentDate: Date): number {
    // Simplified streak calculation
    // In a real implementation, this would check actual completion records
    const recentlyActiveCards = cards.filter(card => 
      card.lastReviewDate && 
      card.lastReviewDate.getTime() > currentDate.getTime() - 7 * 24 * 60 * 60 * 1000
    );

    return Math.min(7, recentlyActiveCards.length);
  }

  private calculateVariance(scores: number[]): number {
    if (scores.length < 2) return 0;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    
    return variance;
  }

  /**
   * Export cards for persistence
   */
  exportCards(): SpacedRepetitionCard[] {
    return Array.from(this.cards.values());
  }

  /**
   * Import cards from persistence
   */
  importCards(cards: SpacedRepetitionCard[]): void {
    this.cards.clear();
    for (const card of cards) {
      const key = `${card.userId}:${card.objectiveId}`;
      this.cards.set(key, {
        ...card,
        dueDate: new Date(card.dueDate),
        lastReviewDate: card.lastReviewDate ? new Date(card.lastReviewDate) : undefined
      });
    }
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create retention scheduler with default configuration
 */
export function createRetentionScheduler(options: SchedulingOptions = {}): RetentionScheduler {
  return new RetentionScheduler(options);
}

/**
 * Create retention scheduler optimized for specific learning contexts
 */
export function createContextualScheduler(
  context: 'beginner' | 'intermediate' | 'advanced',
  options: SchedulingOptions = {}
): RetentionScheduler {
  const contextualOptions: SchedulingOptions = { ...options };

  switch (context) {
    case 'beginner':
      contextualOptions.initialInterval = 1;
      contextualOptions.performanceThreshold = 0.7;
      contextualOptions.urgencyBoost = 2.0;
      break;
    case 'intermediate':
      contextualOptions.initialInterval = 2;
      contextualOptions.performanceThreshold = 0.8;
      contextualOptions.urgencyBoost = 1.5;
      break;
    case 'advanced':
      contextualOptions.initialInterval = 3;
      contextualOptions.performanceThreshold = 0.85;
      contextualOptions.urgencyBoost = 1.2;
      break;
  }

  return new RetentionScheduler(contextualOptions);
}