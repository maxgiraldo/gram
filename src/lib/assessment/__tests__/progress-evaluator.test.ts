/**
 * Progress Evaluator Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ProgressEvaluator,
  calculatePerformanceMetrics,
  checkPrerequisites,
  type ObjectiveProgress,
  type LessonProgress,
  type UnitProgress,
  type ExerciseResult,
  type AssessmentResult,
} from '../progress-evaluator';
import type { Unit, Lesson, LearningObjective } from '../../../types/content';

describe('ProgressEvaluator', () => {
  let progressEvaluator: ProgressEvaluator;
  let mockObjective: LearningObjective;
  let mockLesson: Lesson;
  let mockUnit: Unit;
  let mockExerciseResults: ExerciseResult[];
  let mockAssessmentResults: AssessmentResult[];

  beforeEach(() => {
    progressEvaluator = new ProgressEvaluator();

    mockObjective = {
      id: 'obj-1',
      title: 'Test Objective',
      description: 'Test objective description',
      category: 'knowledge',
      masteryThreshold: 0.8,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    mockLesson = {
      id: 'lesson-1',
      unitId: 'unit-1',
      title: 'Test Lesson',
      description: 'Test lesson description',
      content: 'Test content',
      orderIndex: 0,
      isPublished: true,
      masteryThreshold: 0.8,
      estimatedMinutes: 30,
      difficulty: 'beginner',
      objectives: [mockObjective],
      exercises: [],
      assessments: [],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    mockUnit = {
      id: 'unit-1',
      title: 'Test Unit',
      description: 'Test unit description',
      orderIndex: 0,
      isPublished: true,
      masteryThreshold: 0.9,
      lessons: [mockLesson],
      objectives: [mockObjective],
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
    };

    mockExerciseResults = [
      {
        exerciseId: 'ex-1',
        score: 85,
        attempts: 2,
        timeSpent: 300,
        completedAt: new Date('2023-01-02'),
        masteryAchieved: true,
      },
      {
        exerciseId: 'ex-2',
        score: 75,
        attempts: 3,
        timeSpent: 450,
        completedAt: new Date('2023-01-03'),
        masteryAchieved: false,
      },
    ];

    mockAssessmentResults = [
      {
        assessmentId: 'assess-1',
        score: 90,
        attempts: 1,
        timeSpent: 600,
        completedAt: new Date('2023-01-04'),
        masteryAchieved: true,
      },
    ];
  });

  describe('evaluateObjectiveProgress', () => {
    it('returns not_started status when no results available', () => {
      const progress = progressEvaluator.evaluateObjectiveProgress(
        mockObjective,
        [],
        []
      );

      expect(progress.status).toBe('not_started');
      expect(progress.currentScore).toBe(0);
      expect(progress.masteryAchieved).toBe(false);
      expect(progress.attempts).toBe(0);
      expect(progress.timeSpent).toBe(0);
    });

    it('calculates progress correctly with mixed results', () => {
      const progress = progressEvaluator.evaluateObjectiveProgress(
        mockObjective,
        mockExerciseResults,
        mockAssessmentResults
      );

      // Average of 85, 75, 90 = 83.33
      expect(progress.currentScore).toBeCloseTo(83.33, 1);
      expect(progress.masteryAchieved).toBe(true); // 83.33 > 80
      expect(progress.status).toBe('mastered');
      expect(progress.attempts).toBe(6); // 2 + 3 + 1
      expect(progress.timeSpent).toBe(1350); // 300 + 450 + 600
    });

    it('sets status to in_progress when not mastered but has attempts', () => {
      const lowScoreResults = [
        {
          exerciseId: 'ex-1',
          score: 60,
          attempts: 1,
          timeSpent: 300,
          completedAt: new Date('2023-01-02'),
          masteryAchieved: false,
        },
      ];

      const progress = progressEvaluator.evaluateObjectiveProgress(
        mockObjective,
        lowScoreResults,
        []
      );

      expect(progress.status).toBe('in_progress');
      expect(progress.masteryAchieved).toBe(false);
      expect(progress.currentScore).toBe(60);
    });

    it('tracks completed exercises and assessments', () => {
      const progress = progressEvaluator.evaluateObjectiveProgress(
        mockObjective,
        mockExerciseResults,
        mockAssessmentResults
      );

      expect(progress.completedExercises).toEqual(['ex-1', 'ex-2']);
      expect(progress.completedAssessments).toEqual(['assess-1']);
    });
  });

  describe('evaluateLessonProgress', () => {
    it('evaluates lesson progress with objectives and activities', () => {
      const progress = progressEvaluator.evaluateLessonProgress(
        mockLesson,
        mockExerciseResults,
        mockAssessmentResults
      );

      expect(progress.lessonId).toBe('lesson-1');
      expect(progress.objectiveProgresses).toHaveLength(1);
      expect(progress.overallScore).toBeGreaterThan(0);
      expect(progress.timeSpent).toBeGreaterThan(0);
    });

    it('determines mastery status correctly', () => {
      // Create a lesson with high mastery threshold
      const strictLesson = {
        ...mockLesson,
        masteryThreshold: 0.95,
      };

      const progress = progressEvaluator.evaluateLessonProgress(
        strictLesson,
        mockExerciseResults,
        mockAssessmentResults
      );

      // With average score of ~83, should not achieve 95% mastery
      expect(progress.masteryAchieved).toBe(false);
      expect(progress.status).toBe('in_progress');
    });

    it('sets completed date when mastered', () => {
      // Use high-scoring results to ensure mastery
      const highScoreResults = [
        {
          exerciseId: 'ex-1',
          score: 95,
          attempts: 1,
          timeSpent: 300,
          completedAt: new Date('2023-01-02'),
          masteryAchieved: true,
        },
      ];

      const progress = progressEvaluator.evaluateLessonProgress(
        mockLesson,
        highScoreResults,
        []
      );

      expect(progress.masteryAchieved).toBe(true);
      expect(progress.status).toBe('mastered');
      expect(progress.completedAt).toBeDefined();
    });

    it('handles lessons with no activities gracefully', () => {
      const emptyLesson = {
        ...mockLesson,
        objectives: [],
      };

      const progress = progressEvaluator.evaluateLessonProgress(
        emptyLesson,
        [],
        []
      );

      expect(progress.status).toBe('not_started');
      expect(progress.overallScore).toBe(0);
    });
  });

  describe('evaluateUnitProgress', () => {
    it('evaluates unit progress from lesson progresses', () => {
      const progress = progressEvaluator.evaluateUnitProgress(
        mockUnit,
        mockExerciseResults,
        mockAssessmentResults
      );

      expect(progress.unitId).toBe('unit-1');
      expect(progress.lessonProgresses).toHaveLength(1);
      expect(progress.overallScore).toBeGreaterThan(0);
      expect(progress.timeSpent).toBeGreaterThan(0);
    });

    it('determines unit mastery based on threshold', () => {
      // Create unit with very high threshold
      const strictUnit = {
        ...mockUnit,
        masteryThreshold: 0.99,
      };

      const progress = progressEvaluator.evaluateUnitProgress(
        strictUnit,
        mockExerciseResults,
        mockAssessmentResults
      );

      expect(progress.masteryAchieved).toBe(false);
      expect(progress.status).toBe('in_progress');
    });

    it('requires all lessons to be mastered for unit completion', () => {
      // Add another lesson to the unit
      const secondLesson = {
        ...mockLesson,
        id: 'lesson-2',
        title: 'Second Lesson',
      };

      const multiLessonUnit = {
        ...mockUnit,
        lessons: [mockLesson, secondLesson],
      };

      const progress = progressEvaluator.evaluateUnitProgress(
        multiLessonUnit,
        mockExerciseResults, // Only has results for first lesson
        mockAssessmentResults
      );

      // Even if average score is high, not all lessons are completed
      expect(progress.status).toBe('in_progress');
    });

    it('sets completion date when unit is mastered', () => {
      // Use high scores to ensure mastery
      const highScoreResults = mockExerciseResults.map(result => ({
        ...result,
        score: 95,
        masteryAchieved: true,
      }));

      const progress = progressEvaluator.evaluateUnitProgress(
        mockUnit,
        highScoreResults,
        mockAssessmentResults
      );

      if (progress.masteryAchieved) {
        expect(progress.completedAt).toBeDefined();
      }
    });
  });

  describe('generateCompetencyMap', () => {
    it('creates competency map from objective progresses', () => {
      const objectiveProgress: ObjectiveProgress = {
        objectiveId: 'obj-1',
        status: 'mastered',
        currentScore: 85,
        attempts: 3,
        timeSpent: 600,
        masteryAchieved: true,
        lastActivity: new Date(),
        completedExercises: ['ex-1'],
        completedAssessments: ['assess-1'],
      };

      const competencyMap = progressEvaluator.generateCompetencyMap(
        [mockObjective],
        [objectiveProgress]
      );

      expect(competencyMap['obj-1']).toBeDefined();
      expect(competencyMap['obj-1'].level).toBe('proficient'); // 85 score
      expect(competencyMap['obj-1'].score).toBe(85);
      expect(competencyMap['obj-1'].confidence).toBeGreaterThan(0);
      expect(competencyMap['obj-1'].evidenceCount).toBe(2); // 1 exercise + 1 assessment
    });

    it('assigns correct competency levels based on scores', () => {
      const testCases = [
        { score: 98, expectedLevel: 'expert' },
        { score: 92, expectedLevel: 'advanced' },
        { score: 85, expectedLevel: 'proficient' },
        { score: 65, expectedLevel: 'developing' },
        { score: 45, expectedLevel: 'novice' },
      ];

      testCases.forEach(({ score, expectedLevel }) => {
        const objectiveProgress: ObjectiveProgress = {
          objectiveId: 'obj-test',
          status: 'in_progress',
          currentScore: score,
          attempts: 1,
          timeSpent: 300,
          masteryAchieved: score >= 80,
          lastActivity: new Date(),
          completedExercises: [],
          completedAssessments: [],
        };

        const competencyMap = progressEvaluator.generateCompetencyMap(
          [{ ...mockObjective, id: 'obj-test' }],
          [objectiveProgress]
        );

        expect(competencyMap['obj-test'].level).toBe(expectedLevel);
      });
    });

    it('handles objectives with no progress data', () => {
      const competencyMap = progressEvaluator.generateCompetencyMap(
        [mockObjective],
        []
      );

      expect(competencyMap['obj-1']).toBeDefined();
      expect(competencyMap['obj-1'].level).toBe('novice');
      expect(competencyMap['obj-1'].score).toBe(0);
      expect(competencyMap['obj-1'].confidence).toBe(0);
    });
  });

  describe('makeLearningPathDecision', () => {
    it('allows progression when unit is mastered', () => {
      const masteredUnitProgress: UnitProgress = {
        unitId: 'unit-1',
        status: 'mastered',
        overallScore: 95,
        timeSpent: 1800,
        masteryAchieved: true,
        completedAt: new Date(),
        lessonProgresses: [],
        prerequisitesSatisfied: true,
      };

      const decision = progressEvaluator.makeLearningPathDecision(
        mockUnit,
        masteredUnitProgress,
        {}
      );

      expect(decision.canProgress).toBe(true);
      expect(decision.remediationRequired).toBe(false);
      expect(decision.enrichmentAvailable).toBe(true);
      expect(decision.confidence).toBeGreaterThan(0.9);
    });

    it('requires remediation for struggling lessons', () => {
      const strugglingObjectiveProgress: ObjectiveProgress = {
        objectiveId: 'obj-1',
        status: 'in_progress',
        currentScore: 45,
        attempts: 3,
        timeSpent: 600,
        masteryAchieved: false,
        lastActivity: new Date(),
        completedExercises: [],
        completedAssessments: [],
      };

      const strugglingLessonProgress: LessonProgress = {
        lessonId: 'lesson-1',
        status: 'in_progress',
        overallScore: 45, // Below 60%
        timeSpent: 900,
        masteryAchieved: false,
        objectiveProgresses: [strugglingObjectiveProgress],
        exerciseResults: [],
        assessmentResults: [],
      };

      const unitProgress: UnitProgress = {
        unitId: 'unit-1',
        status: 'in_progress',
        overallScore: 45,
        timeSpent: 900,
        masteryAchieved: false,
        lessonProgresses: [strugglingLessonProgress],
        prerequisitesSatisfied: true,
      };

      const decision = progressEvaluator.makeLearningPathDecision(
        mockUnit,
        unitProgress,
        {}
      );

      expect(decision.canProgress).toBe(false);
      expect(decision.remediationRequired).toBe(true);
      expect(decision.remediationContent.length).toBeGreaterThan(0);
      expect(decision.reason).toContain('Remediation needed');
    });

    it('recommends next lesson for incomplete units', () => {
      const incompleteLessonProgress: LessonProgress = {
        lessonId: 'lesson-1',
        lesson: mockLesson,
        status: 'not_started',
        overallScore: 0,
        timeSpent: 0,
        masteryAchieved: false,
        objectiveProgresses: [],
        exerciseResults: [],
        assessmentResults: [],
      };

      const unitProgress: UnitProgress = {
        unitId: 'unit-1',
        status: 'in_progress',
        overallScore: 70,
        timeSpent: 600,
        masteryAchieved: false,
        lessonProgresses: [incompleteLessonProgress],
        prerequisitesSatisfied: true,
      };

      const decision = progressEvaluator.makeLearningPathDecision(
        mockUnit,
        unitProgress,
        {}
      );

      expect(decision.canProgress).toBe(true);
      expect(decision.nextRecommendedContent).toContain('lesson-1');
      expect(decision.reason).toContain('Continue with next lesson');
    });

    it('enables enrichment for high-performing students', () => {
      const incompleteLessonProgress: LessonProgress = {
        lessonId: 'lesson-1',
        lesson: mockLesson,
        status: 'in_progress',
        overallScore: 92,
        timeSpent: 600,
        masteryAchieved: false, // Not yet mastered
        objectiveProgresses: [],
        exerciseResults: [],
        assessmentResults: [],
      };

      const highPerformingProgress: UnitProgress = {
        unitId: 'unit-1',
        status: 'in_progress',
        overallScore: 92, // Above 90%
        timeSpent: 600,
        masteryAchieved: false,
        lessonProgresses: [incompleteLessonProgress],
        prerequisitesSatisfied: true,
      };

      const decision = progressEvaluator.makeLearningPathDecision(
        mockUnit,
        highPerformingProgress,
        {}
      );

      expect(decision.enrichmentAvailable).toBe(true);
      expect(decision.enrichmentContent.length).toBeGreaterThan(0);
    });
  });

  describe('generateProgressVisualizationData', () => {
    it('generates comprehensive visualization data', () => {
      const unitProgress: UnitProgress = {
        unitId: 'unit-1',
        status: 'in_progress',
        overallScore: 75,
        timeSpent: 1200,
        masteryAchieved: false,
        lessonProgresses: [{
          lessonId: 'lesson-1',
          status: 'in_progress',
          overallScore: 75,
          timeSpent: 1200,
          masteryAchieved: false,
          objectiveProgresses: [{
            objectiveId: 'obj-1',
            status: 'in_progress',
            currentScore: 75,
            attempts: 2,
            timeSpent: 600,
            masteryAchieved: false,
            lastActivity: new Date(),
            completedExercises: [],
            completedAssessments: [],
          }],
          exerciseResults: [],
          assessmentResults: [],
        }],
        prerequisitesSatisfied: true,
      };

      const vizData = progressEvaluator.generateProgressVisualizationData(
        [mockUnit],
        [unitProgress]
      );

      expect(vizData.overallProgress).toBe(75);
      expect(vizData.unitProgress).toHaveLength(1);
      expect(vizData.unitProgress[0].unitId).toBe('unit-1');
      expect(vizData.objectiveMap).toHaveLength(1);
      expect(vizData.competencyRadar).toHaveLength(6); // 6 categories
    });

    it('handles empty progress data', () => {
      const vizData = progressEvaluator.generateProgressVisualizationData(
        [mockUnit],
        []
      );

      expect(vizData.overallProgress).toBe(0);
      expect(vizData.unitProgress).toHaveLength(1);
      expect(vizData.unitProgress[0].progress).toBe(0);
      expect(vizData.unitProgress[0].status).toBe('not_started');
    });

    it('generates performance trends correctly', () => {
      const unitProgress: UnitProgress = {
        unitId: 'unit-1',
        status: 'completed',
        overallScore: 85,
        timeSpent: 1800,
        masteryAchieved: true,
        lessonProgresses: [{
          lessonId: 'lesson-1',
          lesson: mockLesson,
          status: 'completed',
          overallScore: 85,
          timeSpent: 1800,
          masteryAchieved: true,
          completedAt: new Date('2023-01-05'),
          objectiveProgresses: [],
          exerciseResults: [],
          assessmentResults: [],
        }],
        prerequisitesSatisfied: true,
      };

      const vizData = progressEvaluator.generateProgressVisualizationData(
        [mockUnit],
        [unitProgress]
      );

      expect(vizData.performanceTrends).toHaveLength(1);
      expect(vizData.performanceTrends[0].score).toBe(85);
      expect(vizData.performanceTrends[0].difficulty).toBe('beginner');
    });
  });
});

describe('calculatePerformanceMetrics', () => {
  const sampleExerciseResults: ExerciseResult[] = [
    {
      exerciseId: 'ex-1',
      score: 80,
      attempts: 1,
      timeSpent: 300,
      completedAt: new Date('2023-01-01'),
      masteryAchieved: true,
    },
    {
      exerciseId: 'ex-2',
      score: 90,
      attempts: 1,
      timeSpent: 240,
      completedAt: new Date('2023-01-02'),
      masteryAchieved: true,
    },
    {
      exerciseId: 'ex-3',
      score: 85,
      attempts: 2,
      timeSpent: 360,
      completedAt: new Date('2023-01-03'),
      masteryAchieved: true,
    },
  ];

  const sampleAssessmentResults: AssessmentResult[] = [
    {
      assessmentId: 'assess-1',
      score: 88,
      attempts: 1,
      timeSpent: 600,
      completedAt: new Date('2023-01-04'),
      masteryAchieved: true,
    },
  ];

  it('calculates accuracy correctly', () => {
    const metrics = calculatePerformanceMetrics(
      sampleExerciseResults,
      sampleAssessmentResults
    );

    // Average of 80, 90, 85, 88 = 85.75
    expect(metrics.accuracy).toBeCloseTo(85.75, 1);
  });

  it('calculates efficiency (score per minute)', () => {
    const metrics = calculatePerformanceMetrics(
      sampleExerciseResults,
      sampleAssessmentResults
    );

    // Total time: 300 + 240 + 360 + 600 = 1500 seconds = 25 minutes
    // Efficiency = 85.75 / 25 = 3.43
    expect(metrics.efficiency).toBeCloseTo(3.43, 1);
  });

  it('calculates consistency based on score variance', () => {
    const metrics = calculatePerformanceMetrics(
      sampleExerciseResults,
      sampleAssessmentResults
    );

    expect(metrics.consistency).toBeGreaterThan(0);
    expect(metrics.consistency).toBeLessThanOrEqual(100);
  });

  it('calculates improvement trend', () => {
    const metrics = calculatePerformanceMetrics(
      sampleExerciseResults,
      sampleAssessmentResults
    );

    // With scores generally increasing (80, 90, 85, 88), should show some improvement
    expect(metrics.improvement).toBeGreaterThanOrEqual(0);
  });

  it('handles empty results gracefully', () => {
    const metrics = calculatePerformanceMetrics([], []);

    expect(metrics.accuracy).toBe(0);
    expect(metrics.efficiency).toBe(0);
    expect(metrics.consistency).toBe(0);
    expect(metrics.improvement).toBe(0);
    expect(metrics.retentionRate).toBe(0);
  });

  it('handles single result', () => {
    const singleResult = [sampleExerciseResults[0]];
    const metrics = calculatePerformanceMetrics(singleResult, []);

    expect(metrics.accuracy).toBe(80);
    expect(metrics.efficiency).toBeGreaterThan(0);
  });
});

describe('checkPrerequisites', () => {
  const mockUnitWithPrereqs: Unit = {
    id: 'unit-2',
    title: 'Advanced Unit',
    description: 'Requires basic units',
    orderIndex: 1,
    isPublished: true,
    masteryThreshold: 0.9,
    prerequisiteUnits: ['unit-1', 'unit-basics'],
    lessons: [],
    objectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUnitWithoutPrereqs: Unit = {
    id: 'unit-1',
    title: 'Basic Unit',
    description: 'No prerequisites',
    orderIndex: 0,
    isPublished: true,
    masteryThreshold: 0.8,
    lessons: [],
    objectives: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns satisfied when no prerequisites required', () => {
    const result = checkPrerequisites(mockUnitWithoutPrereqs, []);

    expect(result.satisfied).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('returns satisfied when all prerequisites are completed', () => {
    const completedUnits = ['unit-1', 'unit-basics', 'extra-unit'];
    const result = checkPrerequisites(mockUnitWithPrereqs, completedUnits);

    expect(result.satisfied).toBe(true);
    expect(result.missing).toHaveLength(0);
  });

  it('returns missing prerequisites when not satisfied', () => {
    const completedUnits = ['unit-1']; // Missing 'unit-basics'
    const result = checkPrerequisites(mockUnitWithPrereqs, completedUnits);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toEqual(['unit-basics']);
  });

  it('identifies all missing prerequisites', () => {
    const completedUnits: string[] = []; // No completed units
    const result = checkPrerequisites(mockUnitWithPrereqs, completedUnits);

    expect(result.satisfied).toBe(false);
    expect(result.missing).toEqual(['unit-1', 'unit-basics']);
  });

  it('handles undefined prerequisite array', () => {
    const unitWithUndefinedPrereqs = {
      ...mockUnitWithoutPrereqs,
      prerequisiteUnits: undefined,
    };

    const result = checkPrerequisites(unitWithUndefinedPrereqs, []);

    expect(result.satisfied).toBe(true);
    expect(result.missing).toHaveLength(0);
  });
});
