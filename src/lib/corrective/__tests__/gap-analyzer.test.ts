/**
 * Learning Gap Analyzer Test Suite
 * 
 * Comprehensive tests for the learning gap analysis system including
 * error pattern recognition, gap detection, and recommendation generation.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  LearningGapAnalyzer,
  LearningGap,
  GapType,
  GapSeverity,
  ErrorPattern,
  DiagnosticRecommendation,
  calculateGapPriority,
  filterGapsByPriority,
  getProgressionBlockingGaps
} from '../gap-analyzer';
import type {
  ObjectiveProgress,
  LessonProgress,
  UnitProgress,
  ExerciseResult,
  AssessmentResult
} from '../../assessment/progress-evaluator';
import type { GradingResult } from '../../assessment/auto-grader';

describe('LearningGapAnalyzer', () => {
  let analyzer: LearningGapAnalyzer;
  let sampleProgressData: any;
  let sampleGradingResults: GradingResult[];

  beforeEach(() => {
    analyzer = new LearningGapAnalyzer();
    
    // Create sample progress data
    sampleProgressData = {
      unitProgresses: createSampleUnitProgresses(),
      lessonProgresses: createSampleLessonProgresses(),
      objectiveProgresses: createSampleObjectiveProgresses(),
      recentResults: createSampleExerciseResults(),
      assessmentResults: createSampleAssessmentResults(),
      gradingResults: createSampleGradingResults()
    };
    
    sampleGradingResults = createSampleGradingResults();
  });

  describe('Gap Analysis', () => {
    test('should analyze student gaps and return comprehensive results', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(result.studentId).toBe('student123');
      expect(result.analysisDate).toBeInstanceOf(Date);
      expect(result.identifiedGaps).toBeDefined();
      expect(result.criticalGaps).toBeDefined();
      expect(result.gapsByType).toBeDefined();
      expect(result.gapsByObjective).toBeDefined();
      expect(result.overallGapSeverity).toBeDefined();
      expect(result.readinessForProgression).toBeGreaterThanOrEqual(0);
      expect(result.readinessForProgression).toBeLessThanOrEqual(1);
      expect(result.recommendations).toBeDefined();
      expect(result.prioritizedActions).toBeDefined();
      expect(result.estimatedRemediationTime).toBeGreaterThanOrEqual(0);
    });

    test('should identify different types of learning gaps', () => {
      // Create data with specific gap patterns
      const problemData = {
        ...sampleProgressData,
        objectiveProgresses: [
          createObjectiveProgress('obj1', 0.4, 5, false), // Low performance, many attempts
          createObjectiveProgress('obj2', 0.3, 3, false), // Very low performance
        ]
      };

      const result = analyzer.analyzeStudentGaps('student123', problemData);
      
      expect(result.identifiedGaps.length).toBeGreaterThan(0);
      
      // Should identify conceptual understanding gaps
      const conceptualGaps = result.identifiedGaps.filter(
        gap => gap.type === 'conceptual_understanding'
      );
      expect(conceptualGaps.length).toBeGreaterThan(0);
    });

    test('should prioritize critical gaps correctly', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      const criticalGaps = result.criticalGaps;
      const allCritical = result.identifiedGaps.filter(gap => gap.severity === 'critical');
      
      expect(criticalGaps).toEqual(allCritical);
      expect(criticalGaps.every(gap => gap.severity === 'critical')).toBe(true);
    });

    test('should group gaps by type correctly', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      const gapsByType = result.gapsByType;
      
      for (const [type, gaps] of Object.entries(gapsByType)) {
        expect(gaps.every(gap => gap.type === type)).toBe(true);
      }
    });

    test('should calculate readiness for progression', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(typeof result.readinessForProgression).toBe('number');
      expect(result.readinessForProgression).toBeGreaterThanOrEqual(0);
      expect(result.readinessForProgression).toBeLessThanOrEqual(1);
      
      // More critical gaps should reduce readiness
      if (result.criticalGaps.length > 0) {
        expect(result.readinessForProgression).toBeLessThan(1);
      }
    });
  });

  describe('Error Pattern Recognition', () => {
    test('should identify error patterns from grading results', () => {
      const patterns = analyzer.identifyErrorPatterns(sampleGradingResults);
      
      expect(Array.isArray(patterns)).toBe(true);
      
      for (const pattern of patterns) {
        expect(pattern.pattern).toBeDefined();
        expect(pattern.frequency).toBeGreaterThan(0);
        expect(pattern.consistency).toBeGreaterThanOrEqual(0);
        expect(pattern.consistency).toBeLessThanOrEqual(1);
        expect(Array.isArray(pattern.examples)).toBe(true);
        expect(Array.isArray(pattern.suggestedCauses)).toBe(true);
      }
    });

    test('should calculate pattern consistency correctly', () => {
      const gradingWithConsistentErrors = [
        createGradingResult(false, [{ type: 'spelling_grammar', description: 'Spelling error', suggestion: 'Check spelling' }]),
        createGradingResult(false, [{ type: 'spelling_grammar', description: 'Grammar error', suggestion: 'Review grammar' }]),
        createGradingResult(false, [{ type: 'spelling_grammar', description: 'Spelling error', suggestion: 'Check spelling' }])
      ];

      const patterns = analyzer.identifyErrorPatterns(gradingWithConsistentErrors);
      
      expect(patterns.length).toBeGreaterThan(0);
      
      const spellingPattern = patterns.find(p => 
        p.examples.some(ex => ex.context === 'spelling_grammar')
      );
      
      if (spellingPattern) {
        expect(spellingPattern.frequency).toBe(3);
        expect(spellingPattern.consistency).toBeGreaterThan(0);
      }
    });

    test('should suggest appropriate causes for error patterns', () => {
      const patterns = analyzer.identifyErrorPatterns(sampleGradingResults);
      
      for (const pattern of patterns) {
        expect(pattern.suggestedCauses.length).toBeGreaterThan(0);
        expect(pattern.suggestedCauses.every(cause => typeof cause === 'string')).toBe(true);
      }
    });
  });

  describe('Gap Detection Methods', () => {
    test('should detect conceptual understanding gaps', () => {
      // Create data showing poor conceptual understanding
      const poorConceptualData = {
        ...sampleProgressData,
        objectiveProgresses: [
          createObjectiveProgress('noun_basics', 0.4, 6, false),
          createObjectiveProgress('verb_tenses', 0.3, 4, false)
        ]
      };

      const result = analyzer.analyzeStudentGaps('student123', poorConceptualData);
      
      const conceptualGaps = result.identifiedGaps.filter(
        gap => gap.type === 'conceptual_understanding'
      );
      
      expect(conceptualGaps.length).toBeGreaterThan(0);
      
      for (const gap of conceptualGaps) {
        expect(gap.severity).toBeDefined();
        expect(gap.description).toContain('conceptual understanding');
        expect(gap.affectedConcepts.length).toBeGreaterThan(0);
      }
    });

    test('should detect prerequisite knowledge gaps', () => {
      // Create data showing missing prerequisites
      const prerequisiteGapData = {
        ...sampleProgressData,
        objectiveProgresses: [
          createObjectiveProgress('advanced_grammar', 0.3, 5, false),
          createObjectiveProgress('basic_grammar', 0.4, 3, false) // Missing prerequisite
        ]
      };

      const result = analyzer.analyzeStudentGaps('student123', prerequisiteGapData);
      
      // Should identify gaps related to missing prerequisites
      expect(result.identifiedGaps.length).toBeGreaterThan(0);
      
      const prerequisiteGaps = result.identifiedGaps.filter(
        gap => gap.type === 'prerequisite_knowledge'
      );
      
      // Should have high impact on progression
      for (const gap of prerequisiteGaps) {
        expect(gap.impactOnProgression).toBeGreaterThan(0.8);
      }
    });

    test('should detect application skill gaps', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      const applicationGaps = result.identifiedGaps.filter(
        gap => gap.type === 'application_skills'
      );
      
      for (const gap of applicationGaps) {
        expect(gap.description).toContain('apply');
        expect(gap.impactOnProgression).toBeGreaterThan(0.5);
      }
    });

    test('should detect metacognitive awareness gaps', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      const metacognitiveGaps = result.identifiedGaps.filter(
        gap => gap.type === 'metacognitive_awareness'
      );
      
      for (const gap of metacognitiveGaps) {
        expect(gap.description).toMatch(/self-monitoring|strategy/i);
        expect(gap.performanceIndicators.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Recommendation Generation', () => {
    test('should generate appropriate recommendations for different gap types', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(result.recommendations.length).toBeGreaterThan(0);
      
      for (const recommendation of result.recommendations) {
        expect(recommendation.priority).toBeDefined();
        expect(['immediate', 'high', 'medium', 'low']).toContain(recommendation.priority);
        expect(recommendation.type).toBeDefined();
        expect(['remediation', 'review', 'practice', 'instruction']).toContain(recommendation.type);
        expect(recommendation.description).toBeDefined();
        expect(recommendation.interventions.length).toBeGreaterThan(0);
        expect(recommendation.estimatedEffort).toBeGreaterThan(0);
        expect(recommendation.targetedGaps.length).toBeGreaterThan(0);
        expect(recommendation.successCriteria.length).toBeGreaterThan(0);
      }
    });

    test('should prioritize recommendations correctly', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      const recommendations = result.recommendations;
      const priorityOrder = ['immediate', 'high', 'medium', 'low'];
      
      for (let i = 0; i < recommendations.length - 1; i++) {
        const currentPriority = priorityOrder.indexOf(recommendations[i].priority);
        const nextPriority = priorityOrder.indexOf(recommendations[i + 1].priority);
        expect(currentPriority).toBeLessThanOrEqual(nextPriority);
      }
    });

    test('should select appropriate interventions for each gap type', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      for (const recommendation of result.recommendations) {
        for (const intervention of recommendation.interventions) {
          expect(intervention.id).toBeDefined();
          expect(intervention.type).toBeDefined();
          expect(['content_review', 'guided_practice', 'peer_collaboration', 'adaptive_exercises', 'conceptual_instruction']).toContain(intervention.type);
          expect(intervention.duration).toBeGreaterThan(0);
          expect(intervention.description).toBeDefined();
          expect(Array.isArray(intervention.adaptationRules)).toBe(true);
        }
      }
    });

    test('should estimate remediation time accurately', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(result.estimatedRemediationTime).toBeGreaterThanOrEqual(0);
      
      // Time should correlate with number and severity of gaps
      if (result.criticalGaps.length > 0) {
        expect(result.estimatedRemediationTime).toBeGreaterThan(0);
      }
    });
  });

  describe('Risk Assessment', () => {
    test('should identify risk factors correctly', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(Array.isArray(result.riskFactors)).toBe(true);
      
      for (const factor of result.riskFactors) {
        expect(typeof factor).toBe('string');
        expect(factor.length).toBeGreaterThan(0);
      }
    });

    test('should identify student strengths', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(Array.isArray(result.strengths)).toBe(true);
      
      for (const strength of result.strengths) {
        expect(typeof strength).toBe('string');
        expect(strength.length).toBeGreaterThan(0);
      }
    });

    test('should assess overall gap severity appropriately', () => {
      const result = analyzer.analyzeStudentGaps('student123', sampleProgressData);
      
      expect(['critical', 'major', 'moderate', 'minor']).toContain(result.overallGapSeverity);
      
      // Severity should reflect the presence of critical/major gaps
      if (result.criticalGaps.length > 0) {
        expect(result.overallGapSeverity).toBe('critical');
      }
    });
  });
});

describe('Utility Functions', () => {
  let sampleGaps: LearningGap[];

  beforeEach(() => {
    sampleGaps = [
      createSampleGap('gap1', 'conceptual_understanding', 'critical', 0.9, 0.8, 0.7),
      createSampleGap('gap2', 'procedural_knowledge', 'major', 0.8, 0.6, 0.5),
      createSampleGap('gap3', 'application_skills', 'moderate', 0.6, 0.4, 0.3),
      createSampleGap('gap4', 'factual_recall', 'minor', 0.4, 0.2, 0.1)
    ];
  });

  describe('calculateGapPriority', () => {
    test('should calculate priority scores correctly', () => {
      for (const gap of sampleGaps) {
        const priority = calculateGapPriority(gap);
        
        expect(priority).toBeGreaterThanOrEqual(0);
        expect(priority).toBeLessThanOrEqual(1);
      }
      
      // Critical gaps should have higher priority than minor gaps
      const criticalPriority = calculateGapPriority(sampleGaps[0]);
      const minorPriority = calculateGapPriority(sampleGaps[3]);
      
      expect(criticalPriority).toBeGreaterThan(minorPriority);
    });

    test('should weight severity appropriately', () => {
      const criticalGap = sampleGaps.find(g => g.severity === 'critical')!;
      const moderateGap = sampleGaps.find(g => g.severity === 'moderate')!;
      
      const criticalPriority = calculateGapPriority(criticalGap);
      const moderatePriority = calculateGapPriority(moderateGap);
      
      expect(criticalPriority).toBeGreaterThan(moderatePriority);
    });
  });

  describe('filterGapsByPriority', () => {
    test('should filter gaps by minimum priority threshold', () => {
      const filtered = filterGapsByPriority(sampleGaps, 0.5);
      
      for (const gap of filtered) {
        const priority = calculateGapPriority(gap);
        expect(priority).toBeGreaterThanOrEqual(0.5);
      }
      
      expect(filtered.length).toBeLessThanOrEqual(sampleGaps.length);
    });

    test('should return all gaps when threshold is 0', () => {
      const filtered = filterGapsByPriority(sampleGaps, 0);
      expect(filtered.length).toBe(sampleGaps.length);
    });

    test('should return empty array when threshold is too high', () => {
      const filtered = filterGapsByPriority(sampleGaps, 1.1);
      expect(filtered.length).toBe(0);
    });
  });

  describe('getProgressionBlockingGaps', () => {
    test('should identify gaps that block progression', () => {
      const blockingGaps = getProgressionBlockingGaps(sampleGaps);
      
      for (const gap of blockingGaps) {
        expect(gap.impactOnProgression).toBeGreaterThan(0.7);
        expect(['critical', 'major']).toContain(gap.severity);
      }
    });

    test('should not include minor gaps in blocking gaps', () => {
      const blockingGaps = getProgressionBlockingGaps(sampleGaps);
      
      const minorGaps = blockingGaps.filter(gap => gap.severity === 'minor');
      expect(minorGaps.length).toBe(0);
    });
  });
});

// ===== HELPER FUNCTIONS FOR TESTS =====

function createSampleUnitProgresses(): UnitProgress[] {
  return [
    {
      unitId: 'unit1',
      status: 'in_progress' as any,
      overallScore: 0.7,
      timeSpent: 1800,
      masteryAchieved: false,
      lessonProgresses: [],
      prerequisitesSatisfied: true
    }
  ];
}

function createSampleLessonProgresses(): LessonProgress[] {
  return [
    {
      lessonId: 'lesson1',
      status: 'in_progress' as any,
      overallScore: 0.6,
      timeSpent: 900,
      masteryAchieved: false,
      objectiveProgresses: [],
      exerciseResults: [],
      assessmentResults: []
    }
  ];
}

function createSampleObjectiveProgresses(): ObjectiveProgress[] {
  return [
    createObjectiveProgress('obj1', 0.8, 3, true),
    createObjectiveProgress('obj2', 0.6, 5, false),
    createObjectiveProgress('obj3', 0.4, 7, false)
  ];
}

function createObjectiveProgress(
  id: string,
  score: number,
  attempts: number,
  mastery: boolean
): ObjectiveProgress {
  return {
    objectiveId: id,
    status: mastery ? 'completed' : 'in_progress' as any,
    currentScore: score,
    attempts,
    timeSpent: attempts * 180,
    masteryAchieved: mastery,
    lastActivity: new Date(),
    completedExercises: [],
    completedAssessments: []
  };
}

function createSampleExerciseResults(): ExerciseResult[] {
  return [
    {
      exerciseId: 'ex1',
      score: 0.8,
      attempts: 2,
      timeSpent: 300,
      completedAt: new Date(),
      masteryAchieved: true
    },
    {
      exerciseId: 'ex2',
      score: 0.5,
      attempts: 4,
      timeSpent: 600,
      completedAt: new Date(),
      masteryAchieved: false
    }
  ];
}

function createSampleAssessmentResults(): AssessmentResult[] {
  return [
    {
      assessmentId: 'assess1',
      score: 0.75,
      attempts: 1,
      timeSpent: 1200,
      completedAt: new Date(),
      masteryAchieved: true
    }
  ];
}

function createSampleGradingResults(): GradingResult[] {
  return [
    createGradingResult(true, []),
    createGradingResult(false, [
      { type: 'spelling_grammar', description: 'Spelling error in response', suggestion: 'Check spelling' }
    ]),
    createGradingResult(false, [
      { type: 'sentence_structure', description: 'Incorrect sentence structure', suggestion: 'Review grammar rules' }
    ]),
    createGradingResult(false, [
      { type: 'incorrect_choice', description: 'Selected wrong answer', suggestion: 'Review the concept' }
    ])
  ];
}

function createGradingResult(isCorrect: boolean, mistakes: any[]): GradingResult {
  return {
    isCorrect,
    score: isCorrect ? 1 : 0,
    maxPoints: 1,
    earnedPoints: isCorrect ? 1 : 0,
    feedback: isCorrect ? 'Correct!' : 'Incorrect',
    mistakes
  };
}

function createSampleGap(
  id: string,
  type: GapType,
  severity: GapSeverity,
  impactOnProgression: number,
  evidenceStrength: number,
  persistenceLevel: number
): LearningGap {
  return {
    id,
    type,
    severity,
    description: `Sample ${type} gap`,
    affectedConcepts: ['concept1'],
    affectedObjectives: ['obj1'],
    prerequisiteGaps: [],
    errorPatterns: [],
    performanceIndicators: [],
    evidenceStrength,
    impactOnProgression,
    frequency: 3,
    persistenceLevel,
    identifiedAt: new Date(),
    lastObserved: new Date(),
    relatedGaps: []
  };
}