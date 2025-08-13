/**
 * Learning Gap Analyzer
 * 
 * AI system to identify specific learning gaps from assessment data with
 * error pattern recognition algorithms and diagnostic recommendation engine.
 */

import type {
  ObjectiveProgress,
  LessonProgress,
  UnitProgress,
  ExerciseResult,
  AssessmentResult,
  CompetencyLevel
} from '../assessment/progress-evaluator';
import type { PerformanceMetrics } from '../assessment/mastery-calculator';
import type { QuestionBankItem } from '../assessment/question-bank';
import type { GradingResult } from '../assessment/auto-grader';

// ===== LEARNING GAP TYPES =====

export type GapType = 
  | 'conceptual_understanding'
  | 'procedural_knowledge'
  | 'factual_recall'
  | 'application_skills'
  | 'pattern_recognition'
  | 'metacognitive_awareness'
  | 'prerequisite_knowledge'
  | 'transfer_skills';

export type GapSeverity = 'critical' | 'major' | 'moderate' | 'minor';

export type ErrorPattern = 
  | 'consistent_misconception'
  | 'incomplete_understanding'
  | 'procedural_error'
  | 'computational_mistake'
  | 'reading_comprehension'
  | 'attention_to_detail'
  | 'problem_interpretation'
  | 'strategy_selection';

export interface LearningGap {
  id: string;
  type: GapType;
  severity: GapSeverity;
  description: string;
  
  // Affected areas
  affectedConcepts: string[];
  affectedObjectives: string[];
  prerequisiteGaps: string[];
  
  // Evidence
  errorPatterns: ErrorPatternAnalysis[];
  performanceIndicators: PerformanceIndicator[];
  evidenceStrength: number; // 0-1 confidence score
  
  // Impact assessment
  impactOnProgression: number; // 0-1 score
  frequency: number; // how often this gap appears
  persistenceLevel: number; // how long the gap has existed
  
  // Contextual information
  identifiedAt: Date;
  lastObserved: Date;
  relatedGaps: string[];
}

export interface ErrorPatternAnalysis {
  pattern: ErrorPattern;
  frequency: number;
  consistency: number;
  examples: ErrorInstance[];
  suggestedCauses: string[];
}

export interface ErrorInstance {
  exerciseId: string;
  questionId: string;
  studentResponse: any;
  correctAnswer: any;
  timestamp: Date;
  context: string;
}

export interface PerformanceIndicator {
  metric: string;
  value: number;
  threshold: number;
  significance: 'high' | 'medium' | 'low';
  trend: 'improving' | 'stable' | 'declining';
}

export interface DiagnosticRecommendation {
  priority: 'immediate' | 'high' | 'medium' | 'low';
  type: 'remediation' | 'review' | 'practice' | 'instruction';
  description: string;
  
  // Specific interventions
  interventions: Intervention[];
  estimatedEffort: number; // hours
  expectedOutcome: string;
  
  // Targeting
  targetedGaps: string[];
  prerequisiteActions: string[];
  successCriteria: string[];
}

export interface Intervention {
  id: string;
  type: 'content_review' | 'guided_practice' | 'peer_collaboration' | 'adaptive_exercises' | 'conceptual_instruction';
  contentId?: string;
  duration: number; // minutes
  description: string;
  adaptationRules: AdaptationRule[];
}

export interface AdaptationRule {
  condition: string;
  action: string;
  parameters: Record<string, any>;
}

export interface GapAnalysisResult {
  studentId: string;
  analysisDate: Date;
  
  // Identified gaps
  identifiedGaps: LearningGap[];
  criticalGaps: LearningGap[];
  gapsByType: Record<GapType, LearningGap[]>;
  gapsByObjective: Record<string, LearningGap[]>;
  
  // Overall assessment
  overallGapSeverity: GapSeverity;
  readinessForProgression: number; // 0-1 score
  riskFactors: string[];
  strengths: string[];
  
  // Recommendations
  recommendations: DiagnosticRecommendation[];
  prioritizedActions: string[];
  estimatedRemediationTime: number; // hours
}

// ===== LEARNING GAP ANALYZER CLASS =====

export class LearningGapAnalyzer {
  private gapDatabase: Map<string, LearningGap> = new Map();
  private patternDetectors: Map<ErrorPattern, PatternDetector> = new Map();
  
  constructor() {
    this.initializePatternDetectors();
  }

  /**
   * Analyze learning gaps for a student based on their progress data
   */
  analyzeStudentGaps(
    studentId: string,
    progressData: {
      unitProgresses: UnitProgress[];
      lessonProgresses: LessonProgress[];
      objectiveProgresses: ObjectiveProgress[];
      recentResults: ExerciseResult[];
      assessmentResults: AssessmentResult[];
      gradingResults?: GradingResult[];
    }
  ): GapAnalysisResult {
    // Collect all performance data
    const performanceData = this.aggregatePerformanceData(progressData);
    
    // Identify error patterns
    const errorPatterns = this.identifyErrorPatterns(progressData.gradingResults || []);
    
    // Detect learning gaps
    const identifiedGaps = this.detectLearningGaps(performanceData, errorPatterns);
    
    // Analyze gap relationships and dependencies
    const analyzedGaps = this.analyzeGapRelationships(identifiedGaps);
    
    // Generate diagnostic recommendations
    const recommendations = this.generateRecommendations(analyzedGaps);
    
    // Calculate overall metrics
    const overallAssessment = this.calculateOverallAssessment(analyzedGaps);
    
    return {
      studentId,
      analysisDate: new Date(),
      identifiedGaps: analyzedGaps,
      criticalGaps: analyzedGaps.filter(gap => gap.severity === 'critical'),
      gapsByType: this.groupGapsByType(analyzedGaps),
      gapsByObjective: this.groupGapsByObjective(analyzedGaps),
      overallGapSeverity: overallAssessment.severity,
      readinessForProgression: overallAssessment.readiness,
      riskFactors: overallAssessment.riskFactors,
      strengths: overallAssessment.strengths,
      recommendations,
      prioritizedActions: this.prioritizeActions(recommendations),
      estimatedRemediationTime: this.estimateRemediationTime(recommendations)
    };
  }

  /**
   * Identify specific error patterns from grading results
   */
  identifyErrorPatterns(gradingResults: GradingResult[]): ErrorPatternAnalysis[] {
    const patterns: Map<ErrorPattern, ErrorPatternAnalysis> = new Map();
    
    for (const result of gradingResults) {
      if (result.mistakes && result.mistakes.length > 0) {
        for (const mistake of result.mistakes) {
          const pattern = this.classifyErrorPattern(mistake);
          
          if (!patterns.has(pattern)) {
            patterns.set(pattern, {
              pattern,
              frequency: 0,
              consistency: 0,
              examples: [],
              suggestedCauses: []
            });
          }
          
          const analysis = patterns.get(pattern)!;
          analysis.frequency++;
          analysis.examples.push({
            exerciseId: 'unknown', // Would be passed in real implementation
            questionId: 'unknown',
            studentResponse: mistake.description,
            correctAnswer: 'unknown',
            timestamp: new Date(),
            context: mistake.type
          });
          
          // Add suggested causes based on mistake type
          analysis.suggestedCauses = this.inferCauses(mistake.type);
        }
      }
    }
    
    // Calculate consistency scores
    for (const analysis of patterns.values()) {
      analysis.consistency = this.calculatePatternConsistency(analysis);
    }
    
    return Array.from(patterns.values());
  }

  /**
   * Detect learning gaps based on performance data and error patterns
   */
  private detectLearningGaps(
    performanceData: PerformanceData,
    errorPatterns: ErrorPatternAnalysis[]
  ): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    // Analyze conceptual understanding gaps
    gaps.push(...this.detectConceptualGaps(performanceData));
    
    // Analyze procedural knowledge gaps
    gaps.push(...this.detectProceduralGaps(performanceData));
    
    // Analyze prerequisite knowledge gaps
    gaps.push(...this.detectPrerequisiteGaps(performanceData));
    
    // Analyze application skill gaps
    gaps.push(...this.detectApplicationGaps(performanceData));
    
    // Pattern-based gap detection
    gaps.push(...this.detectPatternBasedGaps(errorPatterns));
    
    // Metacognitive awareness gaps
    gaps.push(...this.detectMetacognitiveGaps(performanceData));
    
    return gaps.filter(gap => gap.evidenceStrength >= 0.3); // Filter low-confidence gaps
  }

  /**
   * Detect conceptual understanding gaps
   */
  private detectConceptualGaps(data: PerformanceData): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    for (const [concept, performance] of Object.entries(data.conceptPerformance)) {
      if (performance.accuracy < 0.6 && performance.consistency < 0.5) {
        gaps.push({
          id: `conceptual_${concept}_${Date.now()}`,
          type: 'conceptual_understanding',
          severity: this.determineSeverity(performance.accuracy, 0.6),
          description: `Student shows poor conceptual understanding of ${concept}`,
          affectedConcepts: [concept],
          affectedObjectives: data.conceptToObjectives[concept] || [],
          prerequisiteGaps: [],
          errorPatterns: [],
          performanceIndicators: [
            {
              metric: 'accuracy',
              value: performance.accuracy,
              threshold: 0.6,
              significance: 'high',
              trend: performance.improvement > 0 ? 'improving' : 'declining'
            }
          ],
          evidenceStrength: this.calculateEvidenceStrength(performance),
          impactOnProgression: this.calculateProgressionImpact(concept, data),
          frequency: performance.attempts,
          persistenceLevel: this.calculatePersistence(performance),
          identifiedAt: new Date(),
          lastObserved: new Date(),
          relatedGaps: []
        });
      }
    }
    
    return gaps;
  }

  /**
   * Detect procedural knowledge gaps
   */
  private detectProceduralGaps(data: PerformanceData): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    // Look for patterns in exercise completion and accuracy
    for (const [exerciseType, performance] of Object.entries(data.exerciseTypePerformance)) {
      if (performance.efficiency < 0.5 && performance.accuracy < 0.7) {
        gaps.push({
          id: `procedural_${exerciseType}_${Date.now()}`,
          type: 'procedural_knowledge',
          severity: this.determineSeverity(performance.efficiency, 0.5),
          description: `Student struggles with procedural knowledge in ${exerciseType} exercises`,
          affectedConcepts: [exerciseType],
          affectedObjectives: [],
          prerequisiteGaps: [],
          errorPatterns: [],
          performanceIndicators: [
            {
              metric: 'efficiency',
              value: performance.efficiency,
              threshold: 0.5,
              significance: 'high',
              trend: performance.improvement > 0 ? 'improving' : 'declining'
            }
          ],
          evidenceStrength: this.calculateEvidenceStrength(performance),
          impactOnProgression: 0.7,
          frequency: performance.attempts,
          persistenceLevel: this.calculatePersistence(performance),
          identifiedAt: new Date(),
          lastObserved: new Date(),
          relatedGaps: []
        });
      }
    }
    
    return gaps;
  }

  /**
   * Detect prerequisite knowledge gaps
   */
  private detectPrerequisiteGaps(data: PerformanceData): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    // Analyze objective dependencies
    for (const [objectiveId, progress] of Object.entries(data.objectiveProgress)) {
      if (!progress.masteryAchieved && progress.attempts > 3) {
        const prerequisites = this.getPrerequisites(objectiveId);
        
        for (const prereq of prerequisites) {
          const prereqProgress = data.objectiveProgress[prereq];
          if (!prereqProgress?.masteryAchieved) {
            gaps.push({
              id: `prerequisite_${prereq}_${Date.now()}`,
              type: 'prerequisite_knowledge',
              severity: 'major',
              description: `Missing prerequisite knowledge: ${prereq}`,
              affectedConcepts: [prereq],
              affectedObjectives: [objectiveId],
              prerequisiteGaps: [],
              errorPatterns: [],
              performanceIndicators: [
                {
                  metric: 'mastery',
                  value: prereqProgress?.currentScore || 0,
                  threshold: 0.8,
                  significance: 'high',
                  trend: 'stable'
                }
              ],
              evidenceStrength: 0.9,
              impactOnProgression: 0.95,
              frequency: progress.attempts,
              persistenceLevel: 0.8,
              identifiedAt: new Date(),
              lastObserved: new Date(),
              relatedGaps: []
            });
          }
        }
      }
    }
    
    return gaps;
  }

  /**
   * Detect application skill gaps
   */
  private detectApplicationGaps(data: PerformanceData): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    // Analyze performance on application-type questions
    const applicationPerformance = data.cognitiveLevel?.apply;
    if (applicationPerformance && applicationPerformance.accuracy < 0.65) {
      gaps.push({
        id: `application_skills_${Date.now()}`,
        type: 'application_skills',
        severity: this.determineSeverity(applicationPerformance.accuracy, 0.65),
        description: 'Student struggles to apply knowledge to new situations',
        affectedConcepts: Object.keys(data.conceptPerformance),
        affectedObjectives: [],
        prerequisiteGaps: [],
        errorPatterns: [],
        performanceIndicators: [
          {
            metric: 'application_accuracy',
            value: applicationPerformance.accuracy,
            threshold: 0.65,
            significance: 'high',
            trend: applicationPerformance.improvement > 0 ? 'improving' : 'declining'
          }
        ],
        evidenceStrength: this.calculateEvidenceStrength(applicationPerformance),
        impactOnProgression: 0.8,
        frequency: applicationPerformance.attempts,
        persistenceLevel: this.calculatePersistence(applicationPerformance),
        identifiedAt: new Date(),
        lastObserved: new Date(),
        relatedGaps: []
      });
    }
    
    return gaps;
  }

  /**
   * Detect gaps based on error patterns
   */
  private detectPatternBasedGaps(errorPatterns: ErrorPatternAnalysis[]): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    for (const pattern of errorPatterns) {
      if (pattern.frequency >= 3 && pattern.consistency > 0.6) {
        const gapType = this.mapPatternToGapType(pattern.pattern);
        
        gaps.push({
          id: `pattern_${pattern.pattern}_${Date.now()}`,
          type: gapType,
          severity: this.determineSeverityFromPattern(pattern),
          description: `Consistent ${pattern.pattern} errors detected`,
          affectedConcepts: this.extractConceptsFromPattern(pattern),
          affectedObjectives: [],
          prerequisiteGaps: [],
          errorPatterns: [pattern],
          performanceIndicators: [
            {
              metric: 'error_frequency',
              value: pattern.frequency,
              threshold: 3,
              significance: 'high',
              trend: 'stable'
            }
          ],
          evidenceStrength: pattern.consistency,
          impactOnProgression: this.calculatePatternImpact(pattern),
          frequency: pattern.frequency,
          persistenceLevel: pattern.consistency,
          identifiedAt: new Date(),
          lastObserved: new Date(),
          relatedGaps: []
        });
      }
    }
    
    return gaps;
  }

  /**
   * Detect metacognitive awareness gaps
   */
  private detectMetacognitiveGaps(data: PerformanceData): LearningGap[] {
    const gaps: LearningGap[] = [];
    
    // Analyze hint usage patterns and self-assessment accuracy
    const overallPerformance = data.overall;
    if (overallPerformance) {
      const hintsPerQuestion = data.hintsUsed / Math.max(data.totalQuestions, 1);
      
      if (hintsPerQuestion > 2 && overallPerformance.accuracy < 0.7) {
        gaps.push({
          id: `metacognitive_${Date.now()}`,
          type: 'metacognitive_awareness',
          severity: 'moderate',
          description: 'Student shows poor self-monitoring and strategy selection',
          affectedConcepts: [],
          affectedObjectives: [],
          prerequisiteGaps: [],
          errorPatterns: [],
          performanceIndicators: [
            {
              metric: 'hint_dependency',
              value: hintsPerQuestion,
              threshold: 2,
              significance: 'medium',
              trend: 'stable'
            }
          ],
          evidenceStrength: 0.6,
          impactOnProgression: 0.5,
          frequency: data.totalQuestions,
          persistenceLevel: 0.7,
          identifiedAt: new Date(),
          lastObserved: new Date(),
          relatedGaps: []
        });
      }
    }
    
    return gaps;
  }

  /**
   * Generate diagnostic recommendations based on identified gaps
   */
  private generateRecommendations(gaps: LearningGap[]): DiagnosticRecommendation[] {
    const recommendations: DiagnosticRecommendation[] = [];
    
    // Group gaps by type and severity
    const criticalGaps = gaps.filter(gap => gap.severity === 'critical');
    const majorGaps = gaps.filter(gap => gap.severity === 'major');
    
    // Handle critical gaps first
    for (const gap of criticalGaps) {
      recommendations.push(this.createRecommendation(gap, 'immediate'));
    }
    
    // Handle major gaps
    for (const gap of majorGaps) {
      recommendations.push(this.createRecommendation(gap, 'high'));
    }
    
    // Handle remaining gaps
    const otherGaps = gaps.filter(gap => !['critical', 'major'].includes(gap.severity));
    for (const gap of otherGaps) {
      recommendations.push(this.createRecommendation(gap, 'medium'));
    }
    
    return recommendations;
  }

  /**
   * Create a specific recommendation for a learning gap
   */
  private createRecommendation(gap: LearningGap, priority: 'immediate' | 'high' | 'medium' | 'low'): DiagnosticRecommendation {
    const interventions = this.selectInterventions(gap);
    
    return {
      priority,
      type: this.determineRecommendationType(gap),
      description: this.generateRecommendationDescription(gap),
      interventions,
      estimatedEffort: this.calculateEstimatedEffort(interventions),
      expectedOutcome: this.generateExpectedOutcome(gap),
      targetedGaps: [gap.id],
      prerequisiteActions: this.identifyPrerequisiteActions(gap),
      successCriteria: this.defineSuccessCriteria(gap)
    };
  }

  /**
   * Select appropriate interventions for a gap
   */
  private selectInterventions(gap: LearningGap): Intervention[] {
    const interventions: Intervention[] = [];
    
    switch (gap.type) {
      case 'conceptual_understanding':
        interventions.push({
          id: `conceptual_instruction_${gap.id}`,
          type: 'conceptual_instruction',
          duration: 30,
          description: `Targeted conceptual instruction for ${gap.affectedConcepts.join(', ')}`,
          adaptationRules: [
            {
              condition: 'accuracy < 0.7',
              action: 'provide_additional_examples',
              parameters: { exampleCount: 3 }
            }
          ]
        });
        break;
        
      case 'procedural_knowledge':
        interventions.push({
          id: `guided_practice_${gap.id}`,
          type: 'guided_practice',
          duration: 45,
          description: 'Step-by-step guided practice with immediate feedback',
          adaptationRules: [
            {
              condition: 'errors > 2',
              action: 'break_into_smaller_steps',
              parameters: { stepSize: 'minimal' }
            }
          ]
        });
        break;
        
      case 'prerequisite_knowledge':
        interventions.push({
          id: `content_review_${gap.id}`,
          type: 'content_review',
          duration: 60,
          description: `Review prerequisite concepts: ${gap.affectedConcepts.join(', ')}`,
          adaptationRules: [
            {
              condition: 'mastery_achieved',
              action: 'progress_to_main_topic',
              parameters: {}
            }
          ]
        });
        break;
        
      default:
        interventions.push({
          id: `adaptive_practice_${gap.id}`,
          type: 'adaptive_exercises',
          duration: 30,
          description: 'Adaptive practice exercises targeting identified gaps',
          adaptationRules: [
            {
              condition: 'accuracy_improving',
              action: 'increase_difficulty',
              parameters: { increment: 0.1 }
            }
          ]
        });
    }
    
    return interventions;
  }

  // ===== HELPER METHODS =====

  private initializePatternDetectors(): void {
    // Initialize pattern detection algorithms
    // This would contain specific algorithms for each error pattern type
  }

  private aggregatePerformanceData(progressData: any): PerformanceData {
    // Aggregate all performance metrics into a comprehensive data structure
    const conceptPerformance: Record<string, PerformanceMetrics & { attempts: number }> = {};
    const exerciseTypePerformance: Record<string, PerformanceMetrics & { attempts: number }> = {};
    const objectiveProgress: Record<string, ObjectiveProgress> = {};
    const conceptToObjectives: Record<string, string[]> = {};
    
    // Process objective progresses
    for (const progress of progressData.objectiveProgresses || []) {
      objectiveProgress[progress.objectiveId] = progress;
      
      // Map concepts to objectives (simplified mapping)
      const concept = this.extractConceptFromObjective(progress.objectiveId);
      if (!conceptToObjectives[concept]) {
        conceptToObjectives[concept] = [];
      }
      conceptToObjectives[concept].push(progress.objectiveId);
      
      // Aggregate concept performance
      if (!conceptPerformance[concept]) {
        conceptPerformance[concept] = {
          accuracy: progress.currentScore,
          efficiency: 0.7, // Simplified calculation
          consistency: progress.masteryAchieved ? 0.8 : 0.4,
          improvement: 0.1,
          retentionRate: 0.75,
          attempts: progress.attempts
        };
      }
    }
    
    // Process exercise results
    for (const result of progressData.recentResults || []) {
      const exerciseType = this.extractExerciseType(result.exerciseId);
      if (!exerciseTypePerformance[exerciseType]) {
        exerciseTypePerformance[exerciseType] = {
          accuracy: result.score,
          efficiency: result.score / Math.max(result.timeSpent / 300, 1), // Simple efficiency calculation
          consistency: 0.6,
          improvement: 0.1,
          retentionRate: 0.7,
          attempts: result.attempts
        };
      }
    }
    
    // Calculate overall performance
    const allScores = Object.values(objectiveProgress).map(p => p.currentScore);
    const overall = {
      accuracy: allScores.length > 0 ? allScores.reduce((sum, score) => sum + score, 0) / allScores.length : 0.5,
      efficiency: 0.65,
      consistency: 0.8,
      improvement: 0.1,
      retentionRate: 0.75,
      attempts: Object.values(objectiveProgress).reduce((sum, p) => sum + p.attempts, 0)
    };
    
    return {
      overall,
      conceptPerformance,
      exerciseTypePerformance,
      objectiveProgress,
      conceptToObjectives,
      cognitiveLevel: {
        apply: {
          accuracy: 0.6,
          efficiency: 0.5,
          consistency: 0.7,
          improvement: 0.1,
          retentionRate: 0.7,
          attempts: 5
        }
      },
      hintsUsed: 5,
      totalQuestions: 20
    };
  }

  private classifyErrorPattern(mistake: any): ErrorPattern {
    // Classify error patterns based on mistake types
    const mistakeType = mistake.type?.toLowerCase() || '';
    
    if (mistakeType.includes('spelling') || mistakeType.includes('grammar')) {
      return 'attention_to_detail';
    } else if (mistakeType.includes('structure')) {
      return 'procedural_error';
    } else if (mistakeType.includes('choice')) {
      return 'consistent_misconception';
    }
    
    return 'computational_mistake';
  }

  private inferCauses(mistakeType: string): string[] {
    const causes: Record<string, string[]> = {
      'spelling_grammar': ['Insufficient practice with spelling rules', 'Lack of attention to detail'],
      'sentence_structure': ['Incomplete understanding of grammar rules', 'Need more structured practice'],
      'incorrect_choice': ['Conceptual misconception', 'Need to review core concepts']
    };
    
    return causes[mistakeType] || ['General need for review and practice'];
  }

  private calculatePatternConsistency(analysis: ErrorPatternAnalysis): number {
    // Calculate how consistently this pattern appears
    return Math.min(1, analysis.frequency / 5);
  }

  private determineSeverity(score: number, threshold: number): GapSeverity {
    const ratio = score / threshold;
    if (ratio < 0.3) return 'critical';
    if (ratio < 0.6) return 'major';
    if (ratio < 0.8) return 'moderate';
    return 'minor';
  }

  private determineSeverityFromPattern(pattern: ErrorPatternAnalysis): GapSeverity {
    if (pattern.frequency >= 5 && pattern.consistency > 0.8) return 'critical';
    if (pattern.frequency >= 3 && pattern.consistency > 0.6) return 'major';
    if (pattern.frequency >= 2) return 'moderate';
    return 'minor';
  }

  private calculateEvidenceStrength(performance: any): number {
    // Calculate confidence in the gap identification
    const attemptWeight = Math.min(1, performance.attempts / 5);
    const consistencyWeight = performance.consistency || 0.5;
    return (attemptWeight + consistencyWeight) / 2;
  }

  private calculateProgressionImpact(concept: string, data: PerformanceData): number {
    // Calculate how much this gap impacts progression
    const relatedObjectives = data.conceptToObjectives[concept] || [];
    return Math.min(1, relatedObjectives.length / 3);
  }

  private calculatePersistence(performance: any): number {
    // Calculate how long this gap has persisted
    return Math.min(1, performance.attempts / 10);
  }

  private getPrerequisites(objectiveId: string): string[] {
    // Get prerequisite objectives for a given objective
    // This would typically come from curriculum data
    return [];
  }

  private mapPatternToGapType(pattern: ErrorPattern): GapType {
    const mapping: Record<ErrorPattern, GapType> = {
      'consistent_misconception': 'conceptual_understanding',
      'incomplete_understanding': 'conceptual_understanding',
      'procedural_error': 'procedural_knowledge',
      'computational_mistake': 'procedural_knowledge',
      'reading_comprehension': 'factual_recall',
      'attention_to_detail': 'metacognitive_awareness',
      'problem_interpretation': 'application_skills',
      'strategy_selection': 'metacognitive_awareness'
    };
    
    return mapping[pattern] || 'application_skills';
  }

  private extractConceptsFromPattern(pattern: ErrorPatternAnalysis): string[] {
    // Extract affected concepts from error pattern
    return pattern.examples.map(ex => ex.context).filter(Boolean);
  }

  private calculatePatternImpact(pattern: ErrorPatternAnalysis): number {
    return Math.min(1, pattern.frequency * pattern.consistency / 5);
  }

  private analyzeGapRelationships(gaps: LearningGap[]): LearningGap[] {
    // Analyze relationships between gaps and update related gaps
    return gaps;
  }

  private calculateOverallAssessment(gaps: LearningGap[]): {
    severity: GapSeverity;
    readiness: number;
    riskFactors: string[];
    strengths: string[];
  } {
    const criticalCount = gaps.filter(g => g.severity === 'critical').length;
    const majorCount = gaps.filter(g => g.severity === 'major').length;
    
    let severity: GapSeverity = 'minor';
    if (criticalCount > 0) severity = 'critical';
    else if (majorCount > 2) severity = 'major';
    else if (majorCount > 0) severity = 'moderate';
    
    const readiness = Math.max(0, 1 - (criticalCount * 0.3 + majorCount * 0.2));
    
    return {
      severity,
      readiness,
      riskFactors: this.identifyRiskFactors(gaps),
      strengths: this.identifyStrengths(gaps)
    };
  }

  private identifyRiskFactors(gaps: LearningGap[]): string[] {
    const factors = [];
    
    if (gaps.some(g => g.type === 'prerequisite_knowledge')) {
      factors.push('Missing foundational knowledge');
    }
    
    if (gaps.filter(g => g.severity === 'critical').length > 1) {
      factors.push('Multiple critical gaps');
    }
    
    return factors;
  }

  private identifyStrengths(gaps: LearningGap[]): string[] {
    // Identify areas where student is performing well
    return ['Good attempt frequency', 'Shows persistence'];
  }

  private groupGapsByType(gaps: LearningGap[]): Record<GapType, LearningGap[]> {
    return gaps.reduce((acc, gap) => {
      if (!acc[gap.type]) acc[gap.type] = [];
      acc[gap.type].push(gap);
      return acc;
    }, {} as Record<GapType, LearningGap[]>);
  }

  private groupGapsByObjective(gaps: LearningGap[]): Record<string, LearningGap[]> {
    const result: Record<string, LearningGap[]> = {};
    
    for (const gap of gaps) {
      for (const objective of gap.affectedObjectives) {
        if (!result[objective]) result[objective] = [];
        result[objective].push(gap);
      }
    }
    
    return result;
  }

  private prioritizeActions(recommendations: DiagnosticRecommendation[]): string[] {
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { immediate: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      })
      .map(rec => rec.description);
  }

  private estimateRemediationTime(recommendations: DiagnosticRecommendation[]): number {
    return recommendations.reduce((total, rec) => total + rec.estimatedEffort, 0);
  }

  private determineRecommendationType(gap: LearningGap): 'remediation' | 'review' | 'practice' | 'instruction' {
    if (gap.severity === 'critical') return 'remediation';
    if (gap.type === 'conceptual_understanding') return 'instruction';
    if (gap.type === 'procedural_knowledge') return 'practice';
    return 'review';
  }

  private generateRecommendationDescription(gap: LearningGap): string {
    return `Address ${gap.type.replace('_', ' ')} gap: ${gap.description}`;
  }

  private calculateEstimatedEffort(interventions: Intervention[]): number {
    return interventions.reduce((total, int) => total + (int.duration / 60), 0);
  }

  private generateExpectedOutcome(gap: LearningGap): string {
    return `Improve performance in ${gap.affectedConcepts.join(', ')} by addressing ${gap.type.replace('_', ' ')}`;
  }

  private identifyPrerequisiteActions(gap: LearningGap): string[] {
    if (gap.type === 'prerequisite_knowledge') {
      return ['Complete prerequisite review before attempting main content'];
    }
    return [];
  }

  private defineSuccessCriteria(gap: LearningGap): string[] {
    return [
      'Achieve 80% accuracy on related exercises',
      'Demonstrate consistent performance over 3 attempts',
      'Show improvement in error pattern frequency'
    ];
  }
  
  private extractConceptFromObjective(objectiveId: string): string {
    // Extract concept from objective ID (simplified)
    if (objectiveId.includes('noun')) return 'nouns';
    if (objectiveId.includes('verb')) return 'verbs';
    if (objectiveId.includes('adj')) return 'adjectives';
    if (objectiveId.includes('grammar')) return 'grammar';
    return 'general';
  }
  
  private extractExerciseType(exerciseId: string): string {
    // Extract exercise type from exercise ID (simplified)
    if (exerciseId.includes('multiple')) return 'multiple_choice';
    if (exerciseId.includes('fill')) return 'fill_in_blank';
    if (exerciseId.includes('drag')) return 'drag_and_drop';
    return 'general';
  }
}

// ===== SUPPORTING TYPES =====

interface PerformanceData {
  overall: PerformanceMetrics & { attempts: number };
  conceptPerformance: Record<string, PerformanceMetrics & { attempts: number }>;
  exerciseTypePerformance: Record<string, PerformanceMetrics & { attempts: number }>;
  objectiveProgress: Record<string, ObjectiveProgress>;
  conceptToObjectives: Record<string, string[]>;
  cognitiveLevel: Record<string, PerformanceMetrics & { attempts: number }>;
  hintsUsed: number;
  totalQuestions: number;
}

interface PatternDetector {
  detect(data: any[]): ErrorPatternAnalysis[];
  confidence: number;
}

// ===== UTILITY FUNCTIONS =====

/**
 * Calculate gap remediation priority score
 */
export function calculateGapPriority(gap: LearningGap): number {
  const severityWeight = {
    critical: 1.0,
    major: 0.8,
    moderate: 0.6,
    minor: 0.4
  };
  
  return (
    severityWeight[gap.severity] * 0.4 +
    gap.impactOnProgression * 0.3 +
    gap.evidenceStrength * 0.2 +
    gap.persistenceLevel * 0.1
  );
}

/**
 * Filter gaps by minimum priority threshold
 */
export function filterGapsByPriority(gaps: LearningGap[], minPriority: number = 0.5): LearningGap[] {
  return gaps.filter(gap => calculateGapPriority(gap) >= minPriority);
}

/**
 * Get gaps that are blocking progression
 */
export function getProgressionBlockingGaps(gaps: LearningGap[]): LearningGap[] {
  return gaps.filter(gap => 
    gap.impactOnProgression > 0.7 && 
    ['critical', 'major'].includes(gap.severity)
  );
}