/**
 * Mastery Calculator Logic
 * 
 * Implements core mastery learning algorithms including:
 * - 80% threshold for lesson progression 
 * - 90% threshold for unit completion
 * - Scoring algorithms for different exercise types
 * - Performance tracking utilities
 */

export interface ScoreCalculationInput {
  correctAnswers: number;
  totalQuestions: number;
  points?: number;
  timeSpent?: number;
  hintsUsed?: number;
  questionWeights?: number[];
}

export interface MasteryResult {
  scorePercentage: number;
  achievedMastery: boolean;
  masteryLevel: 'none' | 'approaching' | 'proficient' | 'advanced';
  needsRemediation: boolean;
  eligibleForEnrichment: boolean;
  recommendations: string[];
}

export interface PerformanceMetrics {
  accuracy: number;
  efficiency: number; // score per time ratio
  consistency: number; // variance in performance
  improvement: number; // trend over time
  retentionRate: number;
}

/**
 * Core mastery thresholds based on learning type
 */
export const MASTERY_THRESHOLDS = {
  LESSON_PROGRESSION: 0.8, // 80% for lesson progression
  UNIT_COMPLETION: 0.9,    // 90% for unit completion  
  OBJECTIVE_MASTERY: 0.8,  // 80% for individual objectives
  RETENTION_CHECK: 0.75,   // 75% for retention verification
  ENRICHMENT_ELIGIBLE: 0.9, // 90% to access enrichment activities
} as const;

/**
 * Performance level thresholds
 */
export const PERFORMANCE_LEVELS = {
  ADVANCED: 0.95,
  PROFICIENT: 0.8,
  APPROACHING: 0.6,
  BELOW: 0.0,
} as const;

/**
 * Calculate basic score percentage from correct/total answers
 */
export function calculateBasicScore(input: ScoreCalculationInput): number {
  if (input.totalQuestions === 0) {
    return 0;
  }
  
  return Math.min(100, (input.correctAnswers / input.totalQuestions) * 100);
}

/**
 * Calculate weighted score when questions have different point values
 */
export function calculateWeightedScore(input: ScoreCalculationInput): number {
  if (!input.questionWeights || input.questionWeights.length !== input.totalQuestions) {
    return calculateBasicScore(input);
  }
  
  const totalPossiblePoints = input.questionWeights.reduce((sum, weight) => sum + weight, 0);
  const earnedPoints = input.points || 0;
  
  if (totalPossiblePoints === 0) {
    return 0;
  }
  
  return Math.min(100, (earnedPoints / totalPossiblePoints) * 100);
}

/**
 * Apply penalties for hints used and time overruns
 */
export function applyPerformancePenalties(
  baseScore: number,
  hintsUsed: number = 0,
  timeSpent?: number,
  timeLimit?: number
): number {
  let adjustedScore = baseScore;
  
  // Hint penalty: 5% per hint used
  const hintPenalty = hintsUsed * 5;
  adjustedScore = Math.max(0, adjustedScore - hintPenalty);
  
  // Time penalty: if over time limit, reduce score proportionally
  if (timeSpent && timeLimit && timeSpent > timeLimit) {
    const timeOverrun = (timeSpent - timeLimit) / timeLimit;
    const timePenalty = Math.min(20, timeOverrun * 10); // Max 20% penalty
    adjustedScore = Math.max(0, adjustedScore - timePenalty);
  }
  
  return Math.round(adjustedScore * 100) / 100; // Round to 2 decimal places
}

/**
 * Determine mastery status based on score and thresholds
 */
export function calculateMasteryStatus(
  score: number,
  type: 'lesson' | 'unit' | 'objective' | 'retention' = 'lesson'
): MasteryResult {
  const thresholds = {
    lesson: MASTERY_THRESHOLDS.LESSON_PROGRESSION,
    unit: MASTERY_THRESHOLDS.UNIT_COMPLETION,
    objective: MASTERY_THRESHOLDS.OBJECTIVE_MASTERY,
    retention: MASTERY_THRESHOLDS.RETENTION_CHECK,
  };
  
  const threshold = thresholds[type];
  const scorePercentage = score / 100;
  
  // Determine mastery level
  let masteryLevel: MasteryResult['masteryLevel'];
  if (scorePercentage >= PERFORMANCE_LEVELS.ADVANCED) {
    masteryLevel = 'advanced';
  } else if (scorePercentage >= PERFORMANCE_LEVELS.PROFICIENT) {
    masteryLevel = 'proficient';
  } else if (scorePercentage >= PERFORMANCE_LEVELS.APPROACHING) {
    masteryLevel = 'approaching';
  } else {
    masteryLevel = 'none';
  }
  
  const achievedMastery = scorePercentage >= threshold;
  const needsRemediation = scorePercentage < 0.6; // Below 60% needs help
  const eligibleForEnrichment = scorePercentage >= MASTERY_THRESHOLDS.ENRICHMENT_ELIGIBLE;
  
  // Generate recommendations
  const recommendations: string[] = [];
  
  if (needsRemediation) {
    recommendations.push('Review prerequisite concepts');
    recommendations.push('Complete additional practice exercises');
    recommendations.push('Access corrective instruction materials');
  } else if (!achievedMastery) {
    recommendations.push('Practice similar problems');
    recommendations.push('Review areas of difficulty');
  } else if (eligibleForEnrichment) {
    recommendations.push('Explore enrichment activities');
    recommendations.push('Try advanced challenges');
    recommendations.push('Help other learners');
  }
  
  return {
    scorePercentage: score,
    achievedMastery,
    masteryLevel,
    needsRemediation,
    eligibleForEnrichment,
    recommendations,
  };
}

/**
 * Calculate comprehensive performance metrics over time
 */
export function calculatePerformanceMetrics(
  scores: number[],
  times: number[],
  dates: Date[]
): PerformanceMetrics {
  if (scores.length === 0) {
    return {
      accuracy: 0,
      efficiency: 0,
      consistency: 0,
      improvement: 0,
      retentionRate: 0,
    };
  }
  
  // Calculate accuracy (average score)
  const accuracy = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  
  // Calculate efficiency (score per minute)
  const efficiency = times.length > 0 
    ? scores.reduce((sum, score, i) => sum + (score / (times[i] / 60)), 0) / scores.length
    : accuracy;
  
  // Calculate consistency (inverse of coefficient of variation)
  const mean = accuracy;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  const consistency = mean > 0 ? Math.max(0, 100 - (standardDeviation / mean) * 100) : 0;
  
  // Calculate improvement trend (linear regression slope)
  let improvement = 0;
  if (scores.length > 1) {
    const n = scores.length;
    const sumX = scores.reduce((sum, _, i) => sum + i, 0);
    const sumY = scores.reduce((sum, score) => sum + score, 0);
    const sumXY = scores.reduce((sum, score, i) => sum + (i * score), 0);
    const sumXX = scores.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    improvement = slope * 10; // Scale for percentage interpretation
  }
  
  // Calculate retention rate (performance on recent vs older assessments)
  const retentionRate = scores.length > 2
    ? scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3
    : accuracy;
  
  return {
    accuracy: Math.round(accuracy * 100) / 100,
    efficiency: Math.round(efficiency * 100) / 100,
    consistency: Math.round(consistency * 100) / 100,
    improvement: Math.round(improvement * 100) / 100,
    retentionRate: Math.round(retentionRate * 100) / 100,
  };
}

/**
 * Exercise-type specific scoring algorithms
 */
export const ExerciseScoring = {
  /**
   * Multiple choice scoring - binary correct/incorrect
   */
  multipleChoice(userAnswer: string, correctAnswer: string): { isCorrect: boolean; points: number } {
    const isCorrect = userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    return { isCorrect, points: isCorrect ? 1 : 0 };
  },

  /**
   * Fill in the blank scoring - supports partial credit and fuzzy matching
   */
  fillInBlank(
    userAnswer: string, 
    correctAnswers: string[], 
    allowPartialCredit: boolean = true
  ): { isCorrect: boolean; points: number } {
    const userInput = userAnswer.toLowerCase().trim();
    
    // Check for exact matches first
    for (const correct of correctAnswers) {
      if (userInput === correct.toLowerCase().trim()) {
        return { isCorrect: true, points: 1 };
      }
    }
    
    if (!allowPartialCredit) {
      return { isCorrect: false, points: 0 };
    }
    
    // Check for fuzzy matches (accounting for minor typos)
    for (const correct of correctAnswers) {
      const similarity = calculateStringSimilarity(userInput, correct.toLowerCase());
      if (similarity >= 0.8) { // 80% similarity threshold
        return { isCorrect: true, points: similarity };
      }
    }
    
    return { isCorrect: false, points: 0 };
  },

  /**
   * Drag and drop scoring - order and placement matter
   */
  dragAndDrop(
    userOrder: string[], 
    correctOrder: string[]
  ): { isCorrect: boolean; points: number } {
    if (userOrder.length !== correctOrder.length) {
      return { isCorrect: false, points: 0 };
    }
    
    let correctPlacements = 0;
    for (let i = 0; i < userOrder.length; i++) {
      if (userOrder[i] === correctOrder[i]) {
        correctPlacements++;
      }
    }
    
    const points = correctPlacements / correctOrder.length;
    const isCorrect = points >= 0.8; // 80% correct placement required
    
    return { isCorrect, points };
  },

  /**
   * Sentence building scoring - checks grammar and word order
   */
  sentenceBuilder(
    userSentence: string, 
    correctSentences: string[]
  ): { isCorrect: boolean; points: number } {
    const userWords = userSentence.toLowerCase().trim().split(/\s+/);
    
    let bestMatch = 0;
    for (const correct of correctSentences) {
      const correctWords = correct.toLowerCase().trim().split(/\s+/);
      
      // Check for exact match
      if (userWords.join(' ') === correctWords.join(' ')) {
        return { isCorrect: true, points: 1 };
      }
      
      // Calculate partial credit based on word order and grammar
      const wordOrderScore = calculateWordOrderScore(userWords, correctWords);
      const grammarScore = calculateGrammarScore(userSentence, correct);
      const overallScore = (wordOrderScore + grammarScore) / 2;
      
      bestMatch = Math.max(bestMatch, overallScore);
    }
    
    const isCorrect = bestMatch >= 0.8;
    return { isCorrect, points: bestMatch };
  },
};

/**
 * Helper function to calculate string similarity (Levenshtein distance based)
 */
function calculateStringSimilarity(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return maxLength === 0 ? 1 : (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

/**
 * Helper function to calculate word order score
 */
function calculateWordOrderScore(userWords: string[], correctWords: string[]): number {
  if (userWords.length === 0 || correctWords.length === 0) return 0;
  
  let matches = 0;
  const used = new Set<number>();
  
  for (let i = 0; i < userWords.length; i++) {
    for (let j = 0; j < correctWords.length; j++) {
      if (!used.has(j) && userWords[i] === correctWords[j]) {
        matches++;
        used.add(j);
        break;
      }
    }
  }
  
  return matches / Math.max(userWords.length, correctWords.length);
}

/**
 * Helper function to calculate basic grammar score
 */
function calculateGrammarScore(userSentence: string, correctSentence: string): number {
  // Basic grammar checks - could be enhanced with NLP libraries
  const userPunctuation = (userSentence.match(/[.!?]/g) || []).length;
  const correctPunctuation = (correctSentence.match(/[.!?]/g) || []).length;
  
  const punctuationScore = userPunctuation === correctPunctuation ? 1 : 0.5;
  
  // Check capitalization
  const userCapitalized = /^[A-Z]/.test(userSentence.trim());
  const correctCapitalized = /^[A-Z]/.test(correctSentence.trim());
  const capitalizationScore = userCapitalized === correctCapitalized ? 1 : 0.5;
  
  return (punctuationScore + capitalizationScore) / 2;
}

/**
 * Progress evaluation utilities
 */
export const ProgressEvaluator = {
  /**
   * Determine if learner is ready to progress to next lesson
   */
  canProgressToNextLesson(
    currentScore: number,
    masteryAchieved: boolean,
    attemptsCount: number,
    maxAttempts: number = 3
  ): { canProgress: boolean; reason: string } {
    if (masteryAchieved) {
      return { canProgress: true, reason: 'Mastery threshold achieved' };
    }
    
    if (attemptsCount >= maxAttempts) {
      if (currentScore >= 60) {
        return { canProgress: true, reason: 'Minimum score reached after maximum attempts' };
      } else {
        return { canProgress: false, reason: 'Additional remediation required' };
      }
    }
    
    return { canProgress: false, reason: 'Mastery threshold not yet achieved' };
  },

  /**
   * Calculate overall unit progress
   */
  calculateUnitProgress(lessonProgresses: Array<{ masteryAchieved: boolean; score: number }>): {
    overallScore: number;
    lessonsCompleted: number;
    unitMasteryAchieved: boolean;
  } {
    const totalLessons = lessonProgresses.length;
    const completedLessons = lessonProgresses.filter(p => p.masteryAchieved).length;
    const overallScore = lessonProgresses.reduce((sum, p) => sum + p.score, 0) / totalLessons;
    
    const unitMasteryAchieved = overallScore >= (MASTERY_THRESHOLDS.UNIT_COMPLETION * 100);
    
    return {
      overallScore: Math.round(overallScore * 100) / 100,
      lessonsCompleted: completedLessons,
      unitMasteryAchieved,
    };
  },
};