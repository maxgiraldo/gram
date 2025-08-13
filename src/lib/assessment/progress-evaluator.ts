/**
 * Progress Evaluation System
 * 
 * Evaluates learner progress against specific learning objectives and 
 * makes decisions about learning path progression.
 */

import type { 
  Unit, 
  Lesson, 
  LearningObjective, 
  Exercise, 
  Assessment,
  ProgressStatus,
  ObjectiveCategory 
} from '../../types/content';
import { MASTERY_THRESHOLDS, type PerformanceMetrics } from './mastery-calculator';

// ===== PROGRESS TRACKING TYPES =====

export interface ObjectiveProgress {
  objectiveId: string;
  objective?: LearningObjective;
  status: ProgressStatus;
  currentScore: number;
  attempts: number;
  timeSpent: number; // in seconds
  masteryAchieved: boolean;
  lastActivity: Date;
  completedExercises: string[];
  completedAssessments: string[];
}

export interface LessonProgress {
  lessonId: string;
  lesson?: Lesson;
  status: ProgressStatus;
  overallScore: number;
  timeSpent: number;
  masteryAchieved: boolean;
  completedAt?: Date;
  objectiveProgresses: ObjectiveProgress[];
  exerciseResults: ExerciseResult[];
  assessmentResults: AssessmentResult[];
}

export interface UnitProgress {
  unitId: string;
  unit?: Unit;
  status: ProgressStatus;
  overallScore: number;
  timeSpent: number;
  masteryAchieved: boolean;
  completedAt?: Date;
  lessonProgresses: LessonProgress[];
  prerequisitesSatisfied: boolean;
}

export interface ExerciseResult {
  exerciseId: string;
  score: number;
  attempts: number;
  timeSpent: number;
  completedAt: Date;
  masteryAchieved: boolean;
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  attempts: number;
  timeSpent: number;
  completedAt: Date;
  masteryAchieved: boolean;
}

// ===== COMPETENCY MAPPING TYPES =====

export interface CompetencyMap {
  [objectiveId: string]: CompetencyLevel;
}

export interface CompetencyLevel {
  level: 'novice' | 'developing' | 'proficient' | 'advanced' | 'expert';
  score: number;
  confidence: number;
  lastAssessed: Date;
  evidenceCount: number;
}

export interface LearningPathDecision {
  canProgress: boolean;
  nextRecommendedContent: string[];
  remediationRequired: boolean;
  remediationContent: string[];
  enrichmentAvailable: boolean;
  enrichmentContent: string[];
  reason: string;
  confidence: number;
}

// ===== PROGRESS VISUALIZATION DATA =====

export interface ProgressVisualizationData {
  overallProgress: number;
  unitProgress: Array<{
    unitId: string;
    title: string;
    progress: number;
    status: ProgressStatus;
  }>;
  objectiveMap: Array<{
    objectiveId: string;
    title: string;
    category: ObjectiveCategory;
    masteryLevel: number;
    status: ProgressStatus;
  }>;
  performanceTrends: Array<{
    date: Date;
    score: number;
    timeSpent: number;
    difficulty: string;
  }>;
  competencyRadar: Array<{
    category: ObjectiveCategory;
    level: number;
    maxLevel: number;
  }>;
}

// ===== CORE PROGRESS EVALUATOR =====

export class ProgressEvaluator {

  /**
   * Evaluate progress for a specific learning objective
   */
  evaluateObjectiveProgress(
    objective: LearningObjective,
    exerciseResults: ExerciseResult[],
    assessmentResults: AssessmentResult[]
  ): ObjectiveProgress {
    const relevantExercises = exerciseResults.filter(result => 
      // In a real implementation, we'd have exercise-to-objective mapping
      true
    );
    
    const relevantAssessments = assessmentResults.filter(result =>
      // In a real implementation, we'd have assessment-to-objective mapping  
      true
    );

    const allResults = [...relevantExercises, ...relevantAssessments];
    
    if (allResults.length === 0) {
      return {
        objectiveId: objective.id,
        objective,
        status: 'not_started',
        currentScore: 0,
        attempts: 0,
        timeSpent: 0,
        masteryAchieved: false,
        lastActivity: new Date(),
        completedExercises: [],
        completedAssessments: [],
      };
    }

    const averageScore = allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length;
    const totalAttempts = allResults.reduce((sum, result) => sum + result.attempts, 0);
    const totalTimeSpent = allResults.reduce((sum, result) => sum + result.timeSpent, 0);
    const masteryAchieved = averageScore >= (objective.masteryThreshold * 100);
    const lastActivity = new Date(Math.max(...allResults.map(r => r.completedAt.getTime())));

    let status: ProgressStatus = 'not_started';
    if (masteryAchieved) {
      status = 'mastered';
    } else if (allResults.some(r => r.score > 0)) {
      status = 'in_progress';
    }

    return {
      objectiveId: objective.id,
      objective,
      status,
      currentScore: averageScore,
      attempts: totalAttempts,
      timeSpent: totalTimeSpent,
      masteryAchieved,
      lastActivity,
      completedExercises: relevantExercises.map(e => e.exerciseId),
      completedAssessments: relevantAssessments.map(a => a.assessmentId),
    };
  }

  /**
   * Evaluate progress for an entire lesson
   */
  evaluateLessonProgress(
    lesson: Lesson,
    exerciseResults: ExerciseResult[],
    assessmentResults: AssessmentResult[]
  ): LessonProgress {
    const objectiveProgresses = lesson.objectives.map(objective =>
      this.evaluateObjectiveProgress(objective, exerciseResults, assessmentResults)
    );

    const lessonExerciseResults = exerciseResults.filter(result =>
      lesson.exercises?.some(exercise => exercise.id === result.exerciseId)
    );

    const lessonAssessmentResults = assessmentResults.filter(result =>
      lesson.assessments?.some(assessment => assessment.id === result.assessmentId)
    );

    const allScores = [
      ...objectiveProgresses.map(op => op.currentScore),
      ...lessonExerciseResults.map(er => er.score),
      ...lessonAssessmentResults.map(ar => ar.score),
    ];

    const overallScore = allScores.length > 0 
      ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length
      : 0;

    const totalTimeSpent = 
      objectiveProgresses.reduce((sum, op) => sum + op.timeSpent, 0) +
      lessonExerciseResults.reduce((sum, er) => sum + er.timeSpent, 0) +
      lessonAssessmentResults.reduce((sum, ar) => sum + ar.timeSpent, 0);

    const masteryAchieved = overallScore >= (lesson.masteryThreshold * 100);
    
    const requiredObjectivesMastered = objectiveProgresses.filter(op => op.masteryAchieved).length;
    const totalRequiredObjectives = objectiveProgresses.length;

    let status: ProgressStatus = 'not_started';
    if (masteryAchieved && requiredObjectivesMastered === totalRequiredObjectives) {
      status = 'mastered';
    } else if (allScores.some(score => score > 0)) {
      status = 'in_progress';
    }

    const completedAt = status === 'mastered' 
      ? new Date(Math.max(...[
          ...objectiveProgresses.map(op => op.lastActivity.getTime()),
          ...lessonExerciseResults.map(er => er.completedAt.getTime()),
          ...lessonAssessmentResults.map(ar => ar.completedAt.getTime()),
        ]))
      : undefined;

    return {
      lessonId: lesson.id,
      lesson,
      status,
      overallScore,
      timeSpent: totalTimeSpent,
      masteryAchieved,
      completedAt,
      objectiveProgresses,
      exerciseResults: lessonExerciseResults,
      assessmentResults: lessonAssessmentResults,
    };
  }

  /**
   * Evaluate progress for an entire unit
   */
  evaluateUnitProgress(
    unit: Unit,
    allExerciseResults: ExerciseResult[],
    allAssessmentResults: AssessmentResult[]
  ): UnitProgress {
    const lessonProgresses = unit.lessons.map(lesson =>
      this.evaluateLessonProgress(lesson, allExerciseResults, allAssessmentResults)
    );

    const overallScore = lessonProgresses.length > 0
      ? lessonProgresses.reduce((sum, lp) => sum + lp.overallScore, 0) / lessonProgresses.length
      : 0;

    const totalTimeSpent = lessonProgresses.reduce((sum, lp) => sum + lp.timeSpent, 0);
    const masteryAchieved = overallScore >= (unit.masteryThreshold * 100);
    
    const masteredLessons = lessonProgresses.filter(lp => lp.masteryAchieved).length;
    const totalLessons = lessonProgresses.length;

    let status: ProgressStatus = 'not_started';
    if (masteryAchieved && masteredLessons === totalLessons) {
      status = 'mastered';
    } else if (lessonProgresses.some(lp => lp.status !== 'not_started')) {
      status = 'in_progress';
    }

    const completedAt = status === 'mastered'
      ? new Date(Math.max(...lessonProgresses
          .filter(lp => lp.completedAt)
          .map(lp => lp.completedAt!.getTime())))
      : undefined;

    return {
      unitId: unit.id,
      unit,
      status,
      overallScore,
      timeSpent: totalTimeSpent,
      masteryAchieved,
      completedAt,
      lessonProgresses,
      prerequisitesSatisfied: true, // TODO: Implement prerequisite checking
    };
  }

  /**
   * Generate competency map from progress data
   */
  generateCompetencyMap(
    objectives: LearningObjective[],
    objectiveProgresses: ObjectiveProgress[]
  ): CompetencyMap {
    const competencyMap: CompetencyMap = {};

    for (const objective of objectives) {
      const progress = objectiveProgresses.find(op => op.objectiveId === objective.id);
      
      if (!progress) {
        competencyMap[objective.id] = {
          level: 'novice',
          score: 0,
          confidence: 0,
          lastAssessed: new Date(),
          evidenceCount: 0,
        };
        continue;
      }

      let level: CompetencyLevel['level'] = 'novice';
      if (progress.currentScore >= 95) level = 'expert';
      else if (progress.currentScore >= 90) level = 'advanced';
      else if (progress.currentScore >= 80) level = 'proficient';
      else if (progress.currentScore >= 60) level = 'developing';

      const evidenceCount = progress.completedExercises.length + progress.completedAssessments.length;
      const confidence = Math.min(1, evidenceCount / 5) * (progress.currentScore / 100);

      competencyMap[objective.id] = {
        level,
        score: progress.currentScore,
        confidence,
        lastAssessed: progress.lastActivity,
        evidenceCount,
      };
    }

    return competencyMap;
  }

  /**
   * Make learning path progression decisions
   */
  makeLearningPathDecision(
    currentUnit: Unit,
    unitProgress: UnitProgress,
    competencyMap: CompetencyMap
  ): LearningPathDecision {
    const { lessonProgresses } = unitProgress;
    
    // Check if unit is completed
    if (unitProgress.masteryAchieved) {
      return {
        canProgress: true,
        nextRecommendedContent: [], // Next unit would be determined externally
        remediationRequired: false,
        remediationContent: [],
        enrichmentAvailable: true,
        enrichmentContent: this.getEnrichmentContent(currentUnit, competencyMap),
        reason: 'Unit mastery achieved - ready for next unit',
        confidence: 0.95,
      };
    }

    // Find lessons that need attention
    const incompleteLessons = lessonProgresses.filter(lp => !lp.masteryAchieved);
    const strugglingLessons = lessonProgresses.filter(lp => 
      lp.overallScore < 60 && lp.status !== 'not_started'
    );

    if (strugglingLessons.length > 0) {
      return {
        canProgress: false,
        nextRecommendedContent: [],
        remediationRequired: true,
        remediationContent: this.getRemediationContent(strugglingLessons),
        enrichmentAvailable: false,
        enrichmentContent: [],
        reason: `Remediation needed for ${strugglingLessons.length} lesson(s)`,
        confidence: 0.8,
      };
    }

    if (incompleteLessons.length > 0) {
      const nextLesson = incompleteLessons
        .sort((a, b) => a.lesson!.orderIndex - b.lesson!.orderIndex)[0];
        
      return {
        canProgress: true,
        nextRecommendedContent: [nextLesson.lessonId],
        remediationRequired: false,
        remediationContent: [],
        enrichmentAvailable: unitProgress.overallScore >= 90,
        enrichmentContent: unitProgress.overallScore >= 90 
          ? this.getEnrichmentContent(currentUnit, competencyMap) 
          : [],
        reason: `Continue with next lesson: ${nextLesson.lesson?.title}`,
        confidence: 0.85,
      };
    }

    return {
      canProgress: false,
      nextRecommendedContent: [],
      remediationRequired: true,
      remediationContent: this.getRemediationContent(lessonProgresses),
      enrichmentAvailable: false,
      enrichmentContent: [],
      reason: 'Additional practice needed to achieve mastery',
      confidence: 0.7,
    };
  }

  /**
   * Generate progress visualization data
   */
  generateProgressVisualizationData(
    units: Unit[],
    unitProgresses: UnitProgress[]
  ): ProgressVisualizationData {
    const overallProgress = unitProgresses.length > 0
      ? unitProgresses.reduce((sum, up) => sum + up.overallScore, 0) / unitProgresses.length
      : 0;

    const unitProgress = units.map(unit => {
      const progress = unitProgresses.find(up => up.unitId === unit.id);
      return {
        unitId: unit.id,
        title: unit.title,
        progress: progress?.overallScore ?? 0,
        status: progress?.status ?? 'not_started' as ProgressStatus,
      };
    });

    const allObjectives = units.flatMap(unit => unit.objectives);
    const allObjectiveProgresses = unitProgresses.flatMap(up =>
      up.lessonProgresses.flatMap(lp => lp.objectiveProgresses)
    );

    const objectiveMap = allObjectives.map(objective => {
      const progress = allObjectiveProgresses.find(op => op.objectiveId === objective.id);
      return {
        objectiveId: objective.id,
        title: objective.title,
        category: objective.category,
        masteryLevel: progress?.currentScore ?? 0,
        status: progress?.status ?? 'not_started' as ProgressStatus,
      };
    });

    // Generate performance trends (simplified)
    const performanceTrends = unitProgresses.flatMap(up =>
      up.lessonProgresses.map(lp => ({
        date: lp.completedAt ?? new Date(),
        score: lp.overallScore,
        timeSpent: lp.timeSpent,
        difficulty: lp.lesson?.difficulty ?? 'beginner',
      }))
    ).sort((a, b) => a.date.getTime() - b.date.getTime());

    // Generate competency radar data
    const competencyRadar = (['knowledge', 'comprehension', 'application', 'analysis', 'synthesis', 'evaluation'] as ObjectiveCategory[])
      .map(category => {
        const categoryObjectives = objectiveMap.filter(om => om.category === category);
        const avgLevel = categoryObjectives.length > 0
          ? categoryObjectives.reduce((sum, om) => sum + om.masteryLevel, 0) / categoryObjectives.length
          : 0;
        
        return {
          category,
          level: avgLevel,
          maxLevel: 100,
        };
      });

    return {
      overallProgress,
      unitProgress,
      objectiveMap,
      performanceTrends,
      competencyRadar,
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private getEnrichmentContent(unit: Unit, competencyMap: CompetencyMap): string[] {
    // Find objectives where learner is performing exceptionally well
    const strongObjectives = Object.entries(competencyMap)
      .filter(([_, competency]) => competency.level === 'expert' || competency.level === 'advanced')
      .map(([objectiveId]) => objectiveId);

    // TODO: In a real implementation, we'd have enrichment content mapped to objectives
    return ['enrichment-activities', 'advanced-challenges', 'cross-curricular-projects'];
  }

  private getRemediationContent(lessonProgresses: LessonProgress[]): string[] {
    // Identify specific areas that need remediation
    const remediationContent: string[] = [];
    
    for (const lessonProgress of lessonProgresses) {
      const strugglingObjectives = lessonProgress.objectiveProgresses
        .filter(op => op.currentScore < 60);
      
      for (const objective of strugglingObjectives) {
        // TODO: In a real implementation, we'd have remediation content mapped to objectives
        remediationContent.push(`remediation-${objective.objectiveId}`);
      }
    }

    return [...new Set(remediationContent)]; // Remove duplicates
  }
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate performance metrics for a learner across multiple activities
 */
export function calculatePerformanceMetrics(
  exerciseResults: ExerciseResult[],
  assessmentResults: AssessmentResult[]
): PerformanceMetrics {
  const allResults = [...exerciseResults, ...assessmentResults];
  
  if (allResults.length === 0) {
    return {
      accuracy: 0,
      efficiency: 0,
      consistency: 0,
      improvement: 0,
      retentionRate: 0,
    };
  }

  // Calculate accuracy (average score)
  const accuracy = allResults.reduce((sum, result) => sum + result.score, 0) / allResults.length;

  // Calculate efficiency (score per minute)
  const totalTimeMinutes = allResults.reduce((sum, result) => sum + result.timeSpent, 0) / 60;
  const efficiency = totalTimeMinutes > 0 ? accuracy / totalTimeMinutes : 0;

  // Calculate consistency (inverse of standard deviation of scores)
  const scores = allResults.map(result => result.score);
  const mean = accuracy;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  const consistency = Math.max(0, 100 - standardDeviation);

  // Calculate improvement trend (difference between recent and early performance)
  const sortedResults = allResults.sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime());
  const earlyResults = sortedResults.slice(0, Math.ceil(sortedResults.length * 0.3));
  const recentResults = sortedResults.slice(-Math.ceil(sortedResults.length * 0.3));
  
  const earlyAvg = earlyResults.reduce((sum, r) => sum + r.score, 0) / earlyResults.length;
  const recentAvg = recentResults.reduce((sum, r) => sum + r.score, 0) / recentResults.length;
  const improvement = recentAvg - earlyAvg;

  // Calculate retention rate (performance on repeated content)
  // For now, use a simple approximation based on consistency
  const retentionRate = Math.min(100, consistency + (accuracy * 0.3));

  return {
    accuracy,
    efficiency,
    consistency,
    improvement,
    retentionRate,
  };
}

/**
 * Determine if prerequisites are satisfied for a given unit
 */
export function checkPrerequisites(
  unit: Unit,
  completedUnits: string[]
): { satisfied: boolean; missing: string[] } {
  if (!unit.prerequisiteUnits || unit.prerequisiteUnits.length === 0) {
    return { satisfied: true, missing: [] };
  }

  const missing = unit.prerequisiteUnits.filter(prereqId => !completedUnits.includes(prereqId));
  
  return {
    satisfied: missing.length === 0,
    missing,
  };
}

// Export default instance
export default new ProgressEvaluator();
