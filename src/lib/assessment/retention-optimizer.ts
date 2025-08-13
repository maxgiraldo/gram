/**
 * Retention Schedule Optimizer
 * 
 * Analyzes performance patterns and optimizes retention schedules
 * to maximize learning efficiency and retention rates.
 */

import { PrismaClient } from '@prisma/client';
import type { RetentionSchedule, RetentionMetrics, SpacedRepetitionCard } from './retention-scheduler';
import { RetentionService } from './retention-service';

// ===== OPTIMIZATION TYPES =====

export interface PerformancePattern {
  userId: string;
  objectiveId: string;
  pattern: 'improving' | 'declining' | 'stable' | 'volatile' | 'mastered';
  trend: number; // -1 to 1, negative = declining, positive = improving
  consistency: number; // 0 to 1, how consistent the performance is
  averageScore: number;
  recentScore: number;
  totalAttempts: number;
  daysSinceFirst: number;
}

export interface OptimizationRecommendation {
  type: 'interval_adjustment' | 'difficulty_change' | 'content_variation' | 'schedule_pause' | 'remediation_focus';
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  expectedImpact: number; // 0 to 1, expected improvement in retention
  implementation: {
    adjustmentFactor?: number;
    newInterval?: number;
    scheduleDelay?: number;
    additionalMetadata?: any;
  };
}

export interface UserLearningProfile {
  userId: string;
  overallRetentionRate: number;
  preferredDifficulty: 'easy' | 'medium' | 'hard';
  optimalSessionLength: number; // minutes
  bestPerformanceTimeOfDay: string;
  learningVelocity: number; // how quickly they master new concepts
  retentionDecayRate: number; // how quickly they forget without review
  consistencyScore: number; // how consistent their performance is
  motivationLevel: number; // inferred from engagement patterns
}

export interface OptimizationResult {
  userId: string;
  optimizationsApplied: number;
  recommendations: OptimizationRecommendation[];
  profileUpdates: Partial<UserLearningProfile>;
  expectedImprovements: {
    retentionRate: number;
    timeEfficiency: number;
    masterySpeed: number;
  };
}

// ===== RETENTION OPTIMIZER =====

export class RetentionOptimizer {
  private prisma: PrismaClient;
  private retentionService: RetentionService;

  constructor(prisma: PrismaClient, retentionService: RetentionService) {
    this.prisma = prisma;
    this.retentionService = retentionService;
  }

  /**
   * Analyze and optimize retention schedules for a user
   */
  async optimizeUserRetention(userId: string): Promise<OptimizationResult> {
    try {
      // Analyze performance patterns
      const patterns = await this.analyzePerformancePatterns(userId);
      
      // Generate user learning profile
      const profile = await this.generateLearningProfile(userId);
      
      // Generate optimization recommendations
      const recommendations = await this.generateOptimizationRecommendations(
        userId, 
        patterns, 
        profile
      );
      
      // Apply high-priority optimizations
      const appliedOptimizations = await this.applyOptimizations(userId, recommendations);
      
      // Calculate expected improvements
      const expectedImprovements = this.calculateExpectedImprovements(recommendations, profile);
      
      return {
        userId,
        optimizationsApplied: appliedOptimizations,
        recommendations,
        profileUpdates: profile,
        expectedImprovements
      };

    } catch (error) {
      console.error('Error optimizing user retention:', error);
      throw error;
    }
  }

  /**
   * Batch optimization for multiple users
   */
  async optimizeMultipleUsers(
    userIds: string[],
    options: { prioritizeStrugglingUsers?: boolean } = {}
  ): Promise<OptimizationResult[]> {
    const results: OptimizationResult[] = [];

    // Sort users by priority if requested
    let sortedUserIds = userIds;
    if (options.prioritizeStrugglingUsers) {
      sortedUserIds = await this.sortUsersByOptimizationNeed(userIds);
    }

    for (const userId of sortedUserIds) {
      try {
        const result = await this.optimizeUserRetention(userId);
        results.push(result);
      } catch (error) {
        console.error(`Failed to optimize retention for user ${userId}:`, error);
      }
    }

    return results;
  }

  // ===== PRIVATE ANALYSIS METHODS =====

  private async analyzePerformancePatterns(userId: string): Promise<PerformancePattern[]> {
    // Get retention performance history
    const retentionHistory = await this.prisma.retentionSchedule.findMany({
      where: {
        userId,
        isCompleted: true,
        score: { not: null }
      },
      orderBy: { completedAt: 'asc' },
      include: {
        objective: true
      }
    });

    // Group by objective
    const objectivePerformance = new Map<string, any[]>();
    for (const record of retentionHistory) {
      if (!objectivePerformance.has(record.objectiveId)) {
        objectivePerformance.set(record.objectiveId, []);
      }
      objectivePerformance.get(record.objectiveId)!.push(record);
    }

    const patterns: PerformancePattern[] = [];

    for (const [objectiveId, records] of objectivePerformance.entries()) {
      if (records.length < 2) continue; // Need at least 2 attempts to analyze

      const scores = records.map(r => r.score!);
      const dates = records.map(r => r.completedAt!);
      
      const pattern = this.analyzeScorePattern(scores);
      const trend = this.calculateTrend(scores);
      const consistency = this.calculateConsistency(scores);
      const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      const recentScore = scores[scores.length - 1];
      const daysSinceFirst = (dates[dates.length - 1].getTime() - dates[0].getTime()) / (24 * 60 * 60 * 1000);

      patterns.push({
        userId,
        objectiveId,
        pattern,
        trend,
        consistency,
        averageScore,
        recentScore,
        totalAttempts: records.length,
        daysSinceFirst
      });
    }

    return patterns;
  }

  private analyzeScorePattern(scores: number[]): PerformancePattern['pattern'] {
    if (scores.length < 2) return 'stable';

    const trend = this.calculateTrend(scores);
    const consistency = this.calculateConsistency(scores);
    const recentAverage = scores.slice(-3).reduce((sum, score) => sum + score, 0) / Math.min(3, scores.length);

    if (recentAverage >= 0.9 && consistency > 0.8) {
      return 'mastered';
    } else if (trend > 0.1 && consistency > 0.6) {
      return 'improving';
    } else if (trend < -0.1 && consistency > 0.6) {
      return 'declining';
    } else if (consistency < 0.4) {
      return 'volatile';
    } else {
      return 'stable';
    }
  }

  private calculateTrend(scores: number[]): number {
    if (scores.length < 2) return 0;

    // Simple linear trend calculation
    const n = scores.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = scores;

    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Normalize slope to -1 to 1 range
    return Math.max(-1, Math.min(1, slope * 2));
  }

  private calculateConsistency(scores: number[]): number {
    if (scores.length < 2) return 1;

    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Convert to consistency score (lower variance = higher consistency)
    return Math.max(0, 1 - (standardDeviation / 0.5)); // Assuming max meaningful std dev of 0.5
  }

  private async generateLearningProfile(userId: string): Promise<UserLearningProfile> {
    // Get comprehensive user performance data
    const [retentionMetrics, userAnalytics, recentSessions] = await Promise.all([
      this.retentionService.getRetentionMetrics(userId),
      this.prisma.userAnalytics.findMany({
        where: { userId },
        orderBy: { date: 'desc' },
        take: 30 // Last 30 days
      }),
      this.prisma.retentionSchedule.findMany({
        where: {
          userId,
          isCompleted: true,
          completedAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          objective: true
        }
      })
    ]);

    // Calculate profile metrics
    const overallRetentionRate = retentionMetrics.averageRetentionRate;
    
    // Infer preferred difficulty from performance
    const difficultyPerformance = this.analyzeDifficultyPreference(recentSessions);
    const preferredDifficulty = difficultyPerformance.best;

    // Calculate optimal session length
    const sessionLengths = userAnalytics.map(a => a.avgSessionLength).filter(l => l > 0);
    const optimalSessionLength = sessionLengths.length > 0
      ? sessionLengths.reduce((sum, length) => sum + length, 0) / sessionLengths.length / 60 // Convert to minutes
      : 15; // Default 15 minutes

    // Determine best performance time
    const bestPerformanceTimeOfDay = this.determineBestPerformanceTime(userAnalytics);

    // Calculate learning velocity (concepts mastered per day)
    const masteryDates = recentSessions
      .filter(s => s.score && s.score >= 0.8)
      .map(s => s.completedAt!)
      .sort((a, b) => a.getTime() - b.getTime());
    
    const learningVelocity = masteryDates.length > 1
      ? masteryDates.length / ((masteryDates[masteryDates.length - 1].getTime() - masteryDates[0].getTime()) / (24 * 60 * 60 * 1000))
      : 0.1; // Default low velocity

    // Estimate retention decay rate
    const retentionDecayRate = this.calculateRetentionDecayRate(recentSessions);

    // Calculate consistency score
    const consistencyScore = this.calculateOverallConsistency(recentSessions);

    // Infer motivation level from engagement patterns
    const motivationLevel = this.inferMotivationLevel(userAnalytics, retentionMetrics);

    return {
      userId,
      overallRetentionRate,
      preferredDifficulty,
      optimalSessionLength,
      bestPerformanceTimeOfDay,
      learningVelocity,
      retentionDecayRate,
      consistencyScore,
      motivationLevel
    };
  }

  private analyzeDifficultyPreference(sessions: any[]): { best: 'easy' | 'medium' | 'hard'; performance: { easy: number; medium: number; hard: number } } {
    const difficultyStats = { easy: [], medium: [], hard: [] } as Record<string, number[]>;

    for (const session of sessions) {
      // This would need to be enhanced with actual difficulty data from questions
      // For now, we'll simulate based on score patterns
      const score = session.score;
      if (score >= 0.9) {
        difficultyStats.easy.push(score);
      } else if (score >= 0.7) {
        difficultyStats.medium.push(score);
      } else {
        difficultyStats.hard.push(score);
      }
    }

    const performance = {
      easy: difficultyStats.easy.length > 0 ? difficultyStats.easy.reduce((sum, s) => sum + s, 0) / difficultyStats.easy.length : 0,
      medium: difficultyStats.medium.length > 0 ? difficultyStats.medium.reduce((sum, s) => sum + s, 0) / difficultyStats.medium.length : 0,
      hard: difficultyStats.hard.length > 0 ? difficultyStats.hard.reduce((sum, s) => sum + s, 0) / difficultyStats.hard.length : 0
    };

    let best: 'easy' | 'medium' | 'hard' = 'medium';
    if (performance.hard > performance.medium && performance.hard > performance.easy) {
      best = 'hard';
    } else if (performance.easy > performance.medium) {
      best = 'easy';
    }

    return { best, performance };
  }

  private determineBestPerformanceTime(analytics: any[]): string {
    // This would analyze time-of-day performance patterns
    // For now, return a default
    return 'morning';
  }

  private calculateRetentionDecayRate(sessions: any[]): number {
    // Analyze how quickly performance degrades over time without practice
    // This is a simplified calculation
    return 0.1; // 10% decay per week without practice
  }

  private calculateOverallConsistency(sessions: any[]): number {
    if (sessions.length < 2) return 1;

    const scores = sessions.map(s => s.score).filter(s => s !== null);
    return this.calculateConsistency(scores);
  }

  private inferMotivationLevel(analytics: any[], metrics: RetentionMetrics): number {
    // Analyze engagement patterns to infer motivation
    const recentEngagement = analytics.slice(0, 7); // Last 7 days
    const avgDailyTime = recentEngagement.reduce((sum, a) => sum + a.timeSpent, 0) / recentEngagement.length / 60; // minutes
    
    let motivationScore = 0.5; // Base motivation

    // High daily engagement indicates high motivation
    if (avgDailyTime > 30) motivationScore += 0.3;
    else if (avgDailyTime > 15) motivationScore += 0.1;

    // Streak days indicate consistency and motivation
    if (metrics.streakDays > 7) motivationScore += 0.2;
    else if (metrics.streakDays > 3) motivationScore += 0.1;

    // Overdue items indicate lower motivation
    if (metrics.overdue > 5) motivationScore -= 0.2;
    else if (metrics.overdue > 0) motivationScore -= 0.1;

    return Math.max(0, Math.min(1, motivationScore));
  }

  // ===== OPTIMIZATION GENERATION =====

  private async generateOptimizationRecommendations(
    userId: string,
    patterns: PerformancePattern[],
    profile: UserLearningProfile
  ): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    for (const pattern of patterns) {
      // Analyze each objective's performance pattern
      switch (pattern.pattern) {
        case 'declining':
          recommendations.push({
            type: 'interval_adjustment',
            priority: 'high',
            description: `Reduce review interval for ${pattern.objectiveId} due to declining performance`,
            expectedImpact: 0.3,
            implementation: {
              adjustmentFactor: 0.5, // Halve the interval
              additionalMetadata: { reason: 'declining_performance' }
            }
          });
          break;

        case 'volatile':
          recommendations.push({
            type: 'difficulty_change',
            priority: 'medium',
            description: `Adjust difficulty for ${pattern.objectiveId} due to inconsistent performance`,
            expectedImpact: 0.2,
            implementation: {
              adjustmentFactor: -0.2, // Make easier
              additionalMetadata: { reason: 'volatile_performance' }
            }
          });
          break;

        case 'mastered':
          recommendations.push({
            type: 'interval_adjustment',
            priority: 'low',
            description: `Increase review interval for ${pattern.objectiveId} due to mastery`,
            expectedImpact: 0.1,
            implementation: {
              adjustmentFactor: 1.5, // Increase interval
              additionalMetadata: { reason: 'mastered' }
            }
          });
          break;

        case 'improving':
          // No immediate changes needed, continue current schedule
          break;
      }

      // Add remediation focus for consistently struggling objectives
      if (pattern.averageScore < 0.6 && pattern.totalAttempts >= 3) {
        recommendations.push({
          type: 'remediation_focus',
          priority: 'critical',
          description: `Focus on remediation for ${pattern.objectiveId} due to poor performance`,
          expectedImpact: 0.4,
          implementation: {
            scheduleDelay: 1, // Schedule for tomorrow
            additionalMetadata: { 
              reason: 'poor_performance',
              targetScore: 0.8
            }
          }
        });
      }
    }

    // Profile-based recommendations
    if (profile.motivationLevel < 0.4) {
      recommendations.push({
        type: 'schedule_pause',
        priority: 'medium',
        description: 'Consider reducing schedule intensity due to low motivation',
        expectedImpact: 0.15,
        implementation: {
          adjustmentFactor: 0.7, // Reduce frequency
          additionalMetadata: { reason: 'low_motivation' }
        }
      });
    }

    return recommendations;
  }

  private async applyOptimizations(
    userId: string,
    recommendations: OptimizationRecommendation[]
  ): Promise<number> {
    let appliedCount = 0;

    for (const recommendation of recommendations) {
      if (recommendation.priority === 'critical' || recommendation.priority === 'high') {
        try {
          await this.applyOptimization(userId, recommendation);
          appliedCount++;
        } catch (error) {
          console.error('Failed to apply optimization:', error);
        }
      }
    }

    return appliedCount;
  }

  private async applyOptimization(
    userId: string,
    recommendation: OptimizationRecommendation
  ): Promise<void> {
    switch (recommendation.type) {
      case 'interval_adjustment':
        await this.retentionService.optimizeUserSchedules(userId);
        break;

      case 'remediation_focus':
        // This would trigger creation of additional remediation assessments
        console.log(`Would create remediation focus for user ${userId}`);
        break;

      case 'schedule_pause':
        // This would adjust future scheduling frequency
        console.log(`Would adjust schedule frequency for user ${userId}`);
        break;

      default:
        console.log(`Optimization type ${recommendation.type} not implemented yet`);
    }
  }

  private calculateExpectedImprovements(
    recommendations: OptimizationRecommendation[],
    profile: UserLearningProfile
  ): { retentionRate: number; timeEfficiency: number; masterySpeed: number } {
    const totalImpact = recommendations.reduce((sum, rec) => sum + rec.expectedImpact, 0);
    
    return {
      retentionRate: Math.min(0.3, totalImpact * 0.5), // Max 30% improvement
      timeEfficiency: Math.min(0.2, totalImpact * 0.3), // Max 20% improvement
      masterySpeed: Math.min(0.25, totalImpact * 0.4) // Max 25% improvement
    };
  }

  private async sortUsersByOptimizationNeed(userIds: string[]): Promise<string[]> {
    const userPriorities: { userId: string; priority: number }[] = [];

    for (const userId of userIds) {
      try {
        const metrics = await this.retentionService.getRetentionMetrics(userId);
        
        // Calculate priority score (higher = more urgent)
        let priority = 0;
        if (metrics.overdue > 0) priority += metrics.overdue * 2;
        if (metrics.averageRetentionRate < 0.6) priority += 10;
        if (metrics.streakDays === 0) priority += 5;

        userPriorities.push({ userId, priority });
      } catch (error) {
        console.error(`Error calculating priority for user ${userId}:`, error);
        userPriorities.push({ userId, priority: 0 });
      }
    }

    return userPriorities
      .sort((a, b) => b.priority - a.priority)
      .map(item => item.userId);
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create retention optimizer
 */
export function createRetentionOptimizer(
  prisma: PrismaClient,
  retentionService: RetentionService
): RetentionOptimizer {
  return new RetentionOptimizer(prisma, retentionService);
}