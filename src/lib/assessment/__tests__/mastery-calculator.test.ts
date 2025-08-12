/**
 * Unit tests for mastery calculator logic
 * Tests all scoring algorithms, mastery thresholds, and performance tracking
 */

import { describe, test, expect } from 'vitest';
import {
  calculateBasicScore,
  calculateWeightedScore,
  applyPerformancePenalties,
  calculateMasteryStatus,
  calculatePerformanceMetrics,
  ExerciseScoring,
  ProgressEvaluator,
  MASTERY_THRESHOLDS,
  PERFORMANCE_LEVELS,
  type ScoreCalculationInput,
  type MasteryResult,
  type PerformanceMetrics,
} from '../mastery-calculator';

describe('Basic Score Calculation', () => {
  test('calculates correct percentage for perfect score', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 10,
      totalQuestions: 10,
    };
    expect(calculateBasicScore(input)).toBe(100);
  });

  test('calculates correct percentage for partial score', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 8,
      totalQuestions: 10,
    };
    expect(calculateBasicScore(input)).toBe(80);
  });

  test('handles zero questions gracefully', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 0,
      totalQuestions: 0,
    };
    expect(calculateBasicScore(input)).toBe(0);
  });

  test('caps score at 100%', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 15,
      totalQuestions: 10,
    };
    expect(calculateBasicScore(input)).toBe(100);
  });
});

describe('Weighted Score Calculation', () => {
  test('calculates weighted score correctly', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 2,
      totalQuestions: 3,
      points: 7,
      questionWeights: [2, 3, 5], // Total: 10 points
    };
    expect(calculateWeightedScore(input)).toBe(70);
  });

  test('falls back to basic score when no weights provided', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 8,
      totalQuestions: 10,
      points: 8,
    };
    expect(calculateWeightedScore(input)).toBe(80);
  });

  test('handles mismatched weights array length', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 8,
      totalQuestions: 10,
      points: 8,
      questionWeights: [1, 1, 1], // Only 3 weights for 10 questions
    };
    expect(calculateWeightedScore(input)).toBe(80); // Falls back to basic score
  });
});

describe('Performance Penalties', () => {
  test('applies hint penalty correctly', () => {
    const baseScore = 100;
    const hintsUsed = 2;
    const result = applyPerformancePenalties(baseScore, hintsUsed);
    expect(result).toBe(90); // 100 - (2 * 5) = 90
  });

  test('applies time penalty for overrun', () => {
    const baseScore = 100;
    const hintsUsed = 0;
    const timeSpent = 120; // 2 minutes
    const timeLimit = 60;  // 1 minute limit
    const result = applyPerformancePenalties(baseScore, hintsUsed, timeSpent, timeLimit);
    expect(result).toBe(90); // 100% overrun = 10% penalty
  });

  test('caps time penalty at 20%', () => {
    const baseScore = 100;
    const hintsUsed = 0;
    const timeSpent = 300; // 5 minutes
    const timeLimit = 60;  // 1 minute limit (400% overrun)
    const result = applyPerformancePenalties(baseScore, hintsUsed, timeSpent, timeLimit);
    expect(result).toBe(80); // Max 20% time penalty
  });

  test('prevents negative scores', () => {
    const baseScore = 20;
    const hintsUsed = 10; // Would be 50% penalty
    const result = applyPerformancePenalties(baseScore, hintsUsed);
    expect(result).toBe(0); // Cannot go below 0
  });

  test('rounds to 2 decimal places', () => {
    const baseScore = 83.333;
    const hintsUsed = 1;
    const result = applyPerformancePenalties(baseScore, hintsUsed);
    expect(result).toBe(78.33);
  });
});

describe('Mastery Status Calculation', () => {
  test('determines mastery for lesson progression (80% threshold)', () => {
    const result = calculateMasteryStatus(85, 'lesson');
    expect(result.achievedMastery).toBe(true);
    expect(result.masteryLevel).toBe('proficient');
    expect(result.needsRemediation).toBe(false);
  });

  test('determines mastery for unit completion (90% threshold)', () => {
    const result = calculateMasteryStatus(85, 'unit');
    expect(result.achievedMastery).toBe(false); // Below 90% threshold
    expect(result.masteryLevel).toBe('proficient');
  });

  test('identifies need for remediation', () => {
    const result = calculateMasteryStatus(50, 'lesson');
    expect(result.needsRemediation).toBe(true);
    expect(result.masteryLevel).toBe('none');
    expect(result.recommendations).toContain('Review prerequisite concepts');
  });

  test('identifies eligibility for enrichment', () => {
    const result = calculateMasteryStatus(95, 'lesson');
    expect(result.eligibleForEnrichment).toBe(true);
    expect(result.masteryLevel).toBe('advanced');
    expect(result.recommendations).toContain('Explore enrichment activities');
  });

  test('provides appropriate recommendations for approaching mastery', () => {
    const result = calculateMasteryStatus(75, 'lesson');
    expect(result.achievedMastery).toBe(false);
    expect(result.masteryLevel).toBe('approaching');
    expect(result.recommendations).toContain('Practice similar problems');
  });
});

describe('Performance Metrics Calculation', () => {
  test('calculates metrics for single score', () => {
    const metrics = calculatePerformanceMetrics([85], [60], [new Date()]);
    expect(metrics.accuracy).toBe(85);
    expect(metrics.consistency).toBe(100); // Perfect consistency with one score
    expect(metrics.improvement).toBe(0); // No trend with one score
  });

  test('calculates metrics for multiple scores', () => {
    const scores = [70, 80, 90];
    const times = [60, 50, 40]; // Improving speed
    const dates = [new Date('2024-01-01'), new Date('2024-01-02'), new Date('2024-01-03')];
    
    const metrics = calculatePerformanceMetrics(scores, times, dates);
    expect(metrics.accuracy).toBe(80); // Average of 70, 80, 90
    expect(metrics.improvement).toBeGreaterThan(0); // Positive trend
  });

  test('handles empty input gracefully', () => {
    const metrics = calculatePerformanceMetrics([], [], []);
    expect(metrics.accuracy).toBe(0);
    expect(metrics.efficiency).toBe(0);
    expect(metrics.consistency).toBe(0);
    expect(metrics.improvement).toBe(0);
    expect(metrics.retentionRate).toBe(0);
  });

  test('calculates retention rate from recent scores', () => {
    const scores = [60, 70, 80, 90, 95]; // Improving trend
    const times = [60, 60, 60, 60, 60];
    const dates = Array.from({length: 5}, (_, i) => new Date(`2024-01-0${i+1}`));
    
    const metrics = calculatePerformanceMetrics(scores, times, dates);
    expect(metrics.retentionRate).toBe(88.33); // Average of last 3: (80+90+95)/3
  });
});

describe('Exercise Scoring - Multiple Choice', () => {
  test('scores correct answer as 1 point', () => {
    const result = ExerciseScoring.multipleChoice('B', 'B');
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });

  test('scores incorrect answer as 0 points', () => {
    const result = ExerciseScoring.multipleChoice('A', 'B');
    expect(result.isCorrect).toBe(false);
    expect(result.points).toBe(0);
  });

  test('handles case-insensitive matching', () => {
    const result = ExerciseScoring.multipleChoice('b', 'B');
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });

  test('trims whitespace in answers', () => {
    const result = ExerciseScoring.multipleChoice(' B ', 'B');
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });
});

describe('Exercise Scoring - Fill in the Blank', () => {
  test('scores exact match as correct', () => {
    const result = ExerciseScoring.fillInBlank('cat', ['cat', 'feline']);
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });

  test('scores fuzzy match with partial credit', () => {
    const result = ExerciseScoring.fillInBlank('runing', ['running'], true);
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBeGreaterThan(0.8); // High similarity
  });

  test('rejects fuzzy match when partial credit disabled', () => {
    const result = ExerciseScoring.fillInBlank('runing', ['running'], false);
    expect(result.isCorrect).toBe(false);
    expect(result.points).toBe(0);
  });

  test('handles multiple acceptable answers', () => {
    const result = ExerciseScoring.fillInBlank('happy', ['glad', 'happy', 'joyful']);
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });
});

describe('Exercise Scoring - Drag and Drop', () => {
  test('scores perfect order as correct', () => {
    const result = ExerciseScoring.dragAndDrop(['A', 'B', 'C'], ['A', 'B', 'C']);
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });

  test('scores partial order with partial credit', () => {
    const result = ExerciseScoring.dragAndDrop(['A', 'C', 'B'], ['A', 'B', 'C']);
    expect(result.isCorrect).toBe(false); // Below 80% threshold
    expect(result.points).toBeCloseTo(0.33, 2); // 1 out of 3 correct
  });

  test('handles length mismatch', () => {
    const result = ExerciseScoring.dragAndDrop(['A', 'B'], ['A', 'B', 'C']);
    expect(result.isCorrect).toBe(false);
    expect(result.points).toBe(0);
  });

  test('achieves mastery with 80% correct placement', () => {
    const result = ExerciseScoring.dragAndDrop(['A', 'B', 'C', 'D', 'F'], ['A', 'B', 'C', 'D', 'E']);
    expect(result.isCorrect).toBe(true); // 4/5 = 80%
    expect(result.points).toBe(0.8);
  });
});

describe('Exercise Scoring - Sentence Builder', () => {
  test('scores perfect sentence as correct', () => {
    const result = ExerciseScoring.sentenceBuilder(
      'The cat sat on the mat.',
      ['The cat sat on the mat.']
    );
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });

  test('handles multiple acceptable sentences', () => {
    const result = ExerciseScoring.sentenceBuilder(
      'I am happy.',
      ['I am happy.', 'I am glad.', 'I feel happy.']
    );
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });

  test('gives partial credit for good word order with grammar issues', () => {
    const result = ExerciseScoring.sentenceBuilder(
      'the cat sat on the mat', // Missing capitalization and period
      ['The cat sat on the mat.']
    );
    expect(result.isCorrect).toBe(false); // Below 80% threshold
    expect(result.points).toBeGreaterThan(0); // Some partial credit
  });

  test('handles case sensitivity gracefully', () => {
    const result = ExerciseScoring.sentenceBuilder(
      'THE CAT SAT ON THE MAT.',
      ['The cat sat on the mat.']
    );
    expect(result.isCorrect).toBe(true);
    expect(result.points).toBe(1);
  });
});

describe('Progress Evaluator', () => {
  test('allows progression when mastery achieved', () => {
    const result = ProgressEvaluator.canProgressToNextLesson(85, true, 1);
    expect(result.canProgress).toBe(true);
    expect(result.reason).toBe('Mastery threshold achieved');
  });

  test('allows progression with minimum score after max attempts', () => {
    const result = ProgressEvaluator.canProgressToNextLesson(65, false, 3, 3);
    expect(result.canProgress).toBe(true);
    expect(result.reason).toBe('Minimum score reached after maximum attempts');
  });

  test('requires remediation for low score after max attempts', () => {
    const result = ProgressEvaluator.canProgressToNextLesson(45, false, 3, 3);
    expect(result.canProgress).toBe(false);
    expect(result.reason).toBe('Additional remediation required');
  });

  test('waits for more attempts when threshold not met', () => {
    const result = ProgressEvaluator.canProgressToNextLesson(75, false, 2, 3);
    expect(result.canProgress).toBe(false);
    expect(result.reason).toBe('Mastery threshold not yet achieved');
  });
});

describe('Unit Progress Calculation', () => {
  test('calculates unit progress correctly', () => {
    const lessonProgresses = [
      { masteryAchieved: true, score: 90 },
      { masteryAchieved: true, score: 85 },
      { masteryAchieved: false, score: 70 },
    ];
    
    const result = ProgressEvaluator.calculateUnitProgress(lessonProgresses);
    expect(result.overallScore).toBe(81.67); // (90+85+70)/3 rounded
    expect(result.lessonsCompleted).toBe(2);
    expect(result.unitMasteryAchieved).toBe(false); // Below 90% threshold
  });

  test('achieves unit mastery with 90% overall score', () => {
    const lessonProgresses = [
      { masteryAchieved: true, score: 95 },
      { masteryAchieved: true, score: 90 },
      { masteryAchieved: true, score: 85 },
    ];
    
    const result = ProgressEvaluator.calculateUnitProgress(lessonProgresses);
    expect(result.overallScore).toBe(90);
    expect(result.lessonsCompleted).toBe(3);
    expect(result.unitMasteryAchieved).toBe(true);
  });

  test('handles single lesson unit', () => {
    const lessonProgresses = [
      { masteryAchieved: true, score: 95 },
    ];
    
    const result = ProgressEvaluator.calculateUnitProgress(lessonProgresses);
    expect(result.overallScore).toBe(95);
    expect(result.lessonsCompleted).toBe(1);
    expect(result.unitMasteryAchieved).toBe(true);
  });
});

describe('Constants and Thresholds', () => {
  test('mastery thresholds are defined correctly', () => {
    expect(MASTERY_THRESHOLDS.LESSON_PROGRESSION).toBe(0.8);
    expect(MASTERY_THRESHOLDS.UNIT_COMPLETION).toBe(0.9);
    expect(MASTERY_THRESHOLDS.OBJECTIVE_MASTERY).toBe(0.8);
    expect(MASTERY_THRESHOLDS.RETENTION_CHECK).toBe(0.75);
    expect(MASTERY_THRESHOLDS.ENRICHMENT_ELIGIBLE).toBe(0.9);
  });

  test('performance levels are defined correctly', () => {
    expect(PERFORMANCE_LEVELS.ADVANCED).toBe(0.95);
    expect(PERFORMANCE_LEVELS.PROFICIENT).toBe(0.8);
    expect(PERFORMANCE_LEVELS.APPROACHING).toBe(0.6);
    expect(PERFORMANCE_LEVELS.BELOW).toBe(0.0);
  });
});

describe('Edge Cases and Error Handling', () => {
  test('handles division by zero in performance calculations', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 0,
      totalQuestions: 0,
    };
    expect(() => calculateBasicScore(input)).not.toThrow();
    expect(calculateBasicScore(input)).toBe(0);
  });

  test('handles negative inputs gracefully', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: -1,
      totalQuestions: 5,
    };
    const score = calculateBasicScore(input);
    expect(score).toBeLessThanOrEqual(0);
  });

  test('handles very large numbers', () => {
    const input: ScoreCalculationInput = {
      correctAnswers: 1000000,
      totalQuestions: 1000000,
    };
    expect(calculateBasicScore(input)).toBe(100);
  });

  test('handles null and undefined values in scoring', () => {
    expect(() => ExerciseScoring.multipleChoice('', '')).not.toThrow();
    expect(() => ExerciseScoring.fillInBlank('', [])).not.toThrow();
    expect(() => ExerciseScoring.dragAndDrop([], [])).not.toThrow();
  });
});