/**
 * Retention Assessment Generator
 * 
 * Generates personalized retention assessments based on learning objectives,
 * previous performance, and spaced repetition principles.
 */

import { PrismaClient } from '@prisma/client';
import type { 
  LearningObjective, 
  ExerciseQuestion,
  Assessment,
  AssessmentQuestion
} from '../../types/content';
import type { 
  CreateAssessmentRequest,
  CreateAssessmentQuestionRequest,
  AssessmentResponse,
  AssessmentQuestionResponse
} from '../../types/api';
import type { RetentionSchedule } from './retention-scheduler';

// ===== GENERATOR TYPES =====

export interface RetentionAssessmentConfig {
  targetDuration: number; // minutes
  questionCount: number;
  difficultyMix: {
    easy: number;    // percentage
    medium: number;  // percentage
    hard: number;    // percentage
  };
  questionTypes: {
    multipleChoice: boolean;
    fillInBlank: boolean;
    dragAndDrop: boolean;
    sentenceBuilder: boolean;
  };
  includeVariations: boolean; // include slightly different versions of previously seen questions
  adaptiveDifficulty: boolean; // adjust difficulty based on recent performance
}

export interface QuestionPool {
  objectiveId: string;
  questions: ExerciseQuestion[];
  masteredQuestions: string[]; // IDs of questions previously answered correctly
  strugglingQuestions: string[]; // IDs of questions with poor performance
  lastSeenDates: Map<string, Date>; // Question ID -> last seen date
}

export interface GeneratedAssessment {
  assessment: AssessmentResponse;
  questions: AssessmentQuestionResponse[];
  metadata: {
    generationStrategy: string;
    difficultyBalance: { easy: number; medium: number; hard: number };
    questionSources: { fromPrevious: number; fromPool: number; generated: number };
    estimatedDuration: number;
    targetMasteryThreshold: number;
  };
}

// ===== RETENTION ASSESSMENT GENERATOR =====

export class RetentionAssessmentGenerator {
  private prisma: PrismaClient;
  private defaultConfig: RetentionAssessmentConfig;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.defaultConfig = {
      targetDuration: 5, // 5 minutes for retention checks
      questionCount: 5,
      difficultyMix: {
        easy: 40,
        medium: 50,
        hard: 10
      },
      questionTypes: {
        multipleChoice: true,
        fillInBlank: true,
        dragAndDrop: false, // Typically too complex for quick retention checks
        sentenceBuilder: false
      },
      includeVariations: true,
      adaptiveDifficulty: true
    };
  }

  /**
   * Generate retention assessment for a specific schedule
   */
  async generateRetentionAssessment(
    schedule: RetentionSchedule,
    config?: Partial<RetentionAssessmentConfig>
  ): Promise<GeneratedAssessment> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // Get learning objective and related content
      const objective = await this.prisma.learningObjective.findUnique({
        where: { id: schedule.objectiveId },
        include: {
          lesson: {
            include: {
              exercises: {
                include: {
                  questions: true
                }
              }
            }
          },
          exerciseQuestions: true,
          assessmentQuestions: true
        }
      });

      if (!objective) {
        throw new Error(`Learning objective not found: ${schedule.objectiveId}`);
      }

      // Build question pool
      const questionPool = await this.buildQuestionPool(objective, schedule.userId);

      // Adapt configuration based on user performance and schedule type
      const adaptedConfig = await this.adaptConfigForUser(
        finalConfig,
        schedule,
        questionPool
      );

      // Generate assessment
      const assessmentData = await this.createAssessmentStructure(schedule, adaptedConfig);

      // Select and generate questions
      const questions = await this.generateQuestions(
        questionPool,
        adaptedConfig,
        schedule
      );

      // Create assessment in database
      const createdAssessment = await this.saveAssessment(assessmentData, questions);

      // Build metadata
      const metadata = {
        generationStrategy: this.determineGenerationStrategy(schedule, questionPool),
        difficultyBalance: this.calculateDifficultyBalance(questions),
        questionSources: this.calculateQuestionSources(questions),
        estimatedDuration: adaptedConfig.targetDuration,
        targetMasteryThreshold: assessmentData.masteryThreshold || 80
      };

      return {
        assessment: createdAssessment.assessment,
        questions: createdAssessment.questions,
        metadata
      };

    } catch (error) {
      console.error('Error generating retention assessment:', error);
      throw error;
    }
  }

  /**
   * Generate multiple retention assessments for batch scheduling
   */
  async generateBatchRetentionAssessments(
    schedules: RetentionSchedule[],
    config?: Partial<RetentionAssessmentConfig>
  ): Promise<GeneratedAssessment[]> {
    const results: GeneratedAssessment[] = [];

    for (const schedule of schedules) {
      try {
        const assessment = await this.generateRetentionAssessment(schedule, config);
        results.push(assessment);
      } catch (error) {
        console.error(`Failed to generate assessment for schedule ${schedule.objectiveId}:`, error);
        // Continue with other schedules
      }
    }

    return results;
  }

  // ===== PRIVATE HELPER METHODS =====

  private async buildQuestionPool(
    objective: any,
    userId: string
  ): Promise<QuestionPool> {
    // Collect all questions related to this objective
    const allQuestions: ExerciseQuestion[] = [
      ...objective.exerciseQuestions,
      ...(objective.lesson?.exercises?.flatMap((ex: any) => ex.questions) || [])
    ];

    // Get user's performance history for these questions
    const performanceHistory = await this.prisma.exerciseResponse.findMany({
      where: {
        attempt: {
          userId
        },
        questionId: {
          in: allQuestions.map(q => q.id)
        }
      },
      include: {
        attempt: {
          select: {
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Categorize questions based on performance
    const masteredQuestions: string[] = [];
    const strugglingQuestions: string[] = [];
    const lastSeenDates = new Map<string, Date>();

    const questionPerformance = new Map<string, { correct: number; total: number; lastSeen: Date }>();

    for (const response of performanceHistory) {
      const questionId = response.questionId;
      const isCorrect = response.isCorrect;
      const seenDate = response.attempt.createdAt;

      if (!questionPerformance.has(questionId)) {
        questionPerformance.set(questionId, { correct: 0, total: 0, lastSeen: seenDate });
      }

      const stats = questionPerformance.get(questionId)!;
      stats.total += 1;
      if (isCorrect) stats.correct += 1;
      if (seenDate > stats.lastSeen) stats.lastSeen = seenDate;

      lastSeenDates.set(questionId, stats.lastSeen);
    }

    // Categorize based on performance
    for (const [questionId, stats] of questionPerformance.entries()) {
      const accuracy = stats.correct / stats.total;
      if (accuracy >= 0.8 && stats.total >= 2) {
        masteredQuestions.push(questionId);
      } else if (accuracy < 0.6) {
        strugglingQuestions.push(questionId);
      }
    }

    return {
      objectiveId: objective.id,
      questions: allQuestions,
      masteredQuestions,
      strugglingQuestions,
      lastSeenDates
    };
  }

  private async adaptConfigForUser(
    baseConfig: RetentionAssessmentConfig,
    schedule: RetentionSchedule,
    questionPool: QuestionPool
  ): Promise<RetentionAssessmentConfig> {
    const adaptedConfig = { ...baseConfig };

    // Adjust based on schedule type
    switch (schedule.scheduleType) {
      case 'remediation':
        // Focus on struggling areas with easier questions
        adaptedConfig.difficultyMix = { easy: 60, medium: 30, hard: 10 };
        adaptedConfig.questionCount = Math.min(7, adaptedConfig.questionCount + 2);
        break;

      case 'reinforcement':
        // Slightly harder questions for advanced learners
        adaptedConfig.difficultyMix = { easy: 20, medium: 50, hard: 30 };
        adaptedConfig.questionCount = Math.max(3, adaptedConfig.questionCount - 1);
        break;

      case 'review':
        // Balanced approach
        break;

      case 'initial':
        // Baseline assessment
        adaptedConfig.difficultyMix = { easy: 50, medium: 40, hard: 10 };
        break;
    }

    // Adjust for available question pool
    const availableQuestions = questionPool.questions.filter(q => 
      !questionPool.masteredQuestions.includes(q.id) ||
      this.shouldIncludeMasteredQuestion(q.id, questionPool.lastSeenDates)
    );

    if (availableQuestions.length < adaptedConfig.questionCount) {
      adaptedConfig.questionCount = Math.max(3, availableQuestions.length);
    }

    // Apply difficulty adjustments from metadata
    if (schedule.metadata?.difficultyAdjustment) {
      const adjustment = schedule.metadata.difficultyAdjustment;
      if (adjustment < 0) {
        // Make easier
        adaptedConfig.difficultyMix.easy += 20;
        adaptedConfig.difficultyMix.hard = Math.max(0, adaptedConfig.difficultyMix.hard - 10);
      } else if (adjustment > 0) {
        // Make harder
        adaptedConfig.difficultyMix.hard += 15;
        adaptedConfig.difficultyMix.easy = Math.max(20, adaptedConfig.difficultyMix.easy - 15);
      }
    }

    return adaptedConfig;
  }

  private shouldIncludeMasteredQuestion(
    questionId: string,
    lastSeenDates: Map<string, Date>
  ): boolean {
    const lastSeen = lastSeenDates.get(questionId);
    if (!lastSeen) return true;

    // Include mastered questions if they haven't been seen in a while
    const daysSinceLastSeen = (Date.now() - lastSeen.getTime()) / (24 * 60 * 60 * 1000);
    return daysSinceLastSeen >= 7; // Re-include after a week
  }

  private async createAssessmentStructure(
    schedule: RetentionSchedule,
    config: RetentionAssessmentConfig
  ): Promise<CreateAssessmentRequest> {
    return {
      lessonId: schedule.lessonId,
      title: `Retention Check - ${schedule.scheduleType}`,
      description: `Spaced repetition review for learning objective`,
      type: 'retention_check',
      timeLimit: config.targetDuration * 60, // Convert to seconds
      maxAttempts: 1,
      masteryThreshold: schedule.scheduleType === 'remediation' ? 70 : 80,
      isPublished: true
    };
  }

  private async generateQuestions(
    questionPool: QuestionPool,
    config: RetentionAssessmentConfig,
    schedule: RetentionSchedule
  ): Promise<CreateAssessmentQuestionRequest[]> {
    const questions: CreateAssessmentQuestionRequest[] = [];
    const usedQuestions = new Set<string>();

    // Calculate target counts for each difficulty
    const easyCount = Math.round(config.questionCount * config.difficultyMix.easy / 100);
    const mediumCount = Math.round(config.questionCount * config.difficultyMix.medium / 100);
    const hardCount = config.questionCount - easyCount - mediumCount;

    // Prioritize struggling questions for remediation
    let priorityQuestions: ExerciseQuestion[] = [];
    if (schedule.scheduleType === 'remediation' && questionPool.strugglingQuestions.length > 0) {
      priorityQuestions = questionPool.questions.filter(q => 
        questionPool.strugglingQuestions.includes(q.id)
      );
    }

    // Add priority questions first
    for (const question of priorityQuestions.slice(0, Math.min(3, config.questionCount))) {
      const assessmentQuestion = await this.convertToAssessmentQuestion(question, 0);
      if (assessmentQuestion) {
        questions.push(assessmentQuestion);
        usedQuestions.add(question.id);
      }
    }

    // Fill remaining slots with appropriate difficulty questions
    const remainingCount = config.questionCount - questions.length;
    const difficultyCounts = [
      { difficulty: 'easy', count: Math.round(remainingCount * config.difficultyMix.easy / 100) },
      { difficulty: 'medium', count: Math.round(remainingCount * config.difficultyMix.medium / 100) },
      { difficulty: 'hard', count: 0 }
    ];
    difficultyCounts[2].count = remainingCount - difficultyCounts[0].count - difficultyCounts[1].count;

    for (const { difficulty, count } of difficultyCounts) {
      const candidateQuestions = questionPool.questions.filter(q => 
        q.difficulty === difficulty && 
        !usedQuestions.has(q.id) &&
        this.isQuestionTypeAllowed(q.type, config.questionTypes)
      );

      // Sort by last seen date (prioritize older questions)
      candidateQuestions.sort((a, b) => {
        const lastSeenA = questionPool.lastSeenDates.get(a.id)?.getTime() || 0;
        const lastSeenB = questionPool.lastSeenDates.get(b.id)?.getTime() || 0;
        return lastSeenA - lastSeenB;
      });

      for (let i = 0; i < count && i < candidateQuestions.length; i++) {
        const question = candidateQuestions[i];
        const assessmentQuestion = await this.convertToAssessmentQuestion(question, questions.length);
        if (assessmentQuestion) {
          questions.push(assessmentQuestion);
          usedQuestions.add(question.id);
        }
      }
    }

    return questions;
  }

  private isQuestionTypeAllowed(
    questionType: string,
    allowedTypes: RetentionAssessmentConfig['questionTypes']
  ): boolean {
    switch (questionType) {
      case 'multiple_choice':
        return allowedTypes.multipleChoice;
      case 'fill_in_blank':
        return allowedTypes.fillInBlank;
      case 'drag_and_drop':
        return allowedTypes.dragAndDrop;
      case 'sentence_builder':
        return allowedTypes.sentenceBuilder;
      default:
        return false;
    }
  }

  private async convertToAssessmentQuestion(
    exerciseQuestion: ExerciseQuestion,
    orderIndex: number
  ): Promise<CreateAssessmentQuestionRequest | null> {
    try {
      return {
        assessmentId: '', // Will be filled when creating assessment
        objectiveId: exerciseQuestion.objectiveId,
        questionText: exerciseQuestion.questionText,
        type: exerciseQuestion.type as any,
        orderIndex,
        points: exerciseQuestion.points,
        difficulty: exerciseQuestion.difficulty as any,
        questionData: exerciseQuestion.questionData,
        correctAnswer: exerciseQuestion.correctAnswer,
        distractors: exerciseQuestion.distractors,
        feedback: exerciseQuestion.feedback
      };
    } catch (error) {
      console.error('Error converting exercise question to assessment question:', error);
      return null;
    }
  }

  private async saveAssessment(
    assessmentData: CreateAssessmentRequest,
    questionData: CreateAssessmentQuestionRequest[]
  ): Promise<{ assessment: AssessmentResponse; questions: AssessmentQuestionResponse[] }> {
    // Create assessment
    const createdAssessment = await this.prisma.assessment.create({
      data: {
        ...assessmentData,
        type: assessmentData.type as any
      }
    });

    // Create questions
    const createdQuestions = await Promise.all(
      questionData.map(async (question, index) => {
        return await this.prisma.assessmentQuestion.create({
          data: {
            ...question,
            assessmentId: createdAssessment.id,
            orderIndex: index,
            type: question.type as any,
            difficulty: question.difficulty as any
          }
        });
      })
    );

    // Format responses
    const assessmentResponse: AssessmentResponse = {
      id: createdAssessment.id,
      lessonId: createdAssessment.lessonId,
      title: createdAssessment.title,
      description: createdAssessment.description || '',
      type: createdAssessment.type as any,
      timeLimit: createdAssessment.timeLimit,
      maxAttempts: createdAssessment.maxAttempts,
      masteryThreshold: createdAssessment.masteryThreshold,
      scheduledDelay: createdAssessment.scheduledDelay,
      isPublished: createdAssessment.isPublished,
      createdAt: createdAssessment.createdAt.toISOString(),
      updatedAt: createdAssessment.updatedAt.toISOString()
    };

    const questionResponses: AssessmentQuestionResponse[] = createdQuestions.map(q => ({
      id: q.id,
      assessmentId: q.assessmentId,
      objectiveId: q.objectiveId,
      questionText: q.questionText,
      type: q.type as any,
      orderIndex: q.orderIndex,
      points: q.points,
      difficulty: q.difficulty as any,
      questionData: q.questionData,
      correctAnswer: q.correctAnswer,
      distractors: q.distractors,
      feedback: q.feedback,
      createdAt: q.createdAt.toISOString(),
      updatedAt: q.updatedAt.toISOString()
    }));

    return {
      assessment: assessmentResponse,
      questions: questionResponses
    };
  }

  // ===== METADATA HELPERS =====

  private determineGenerationStrategy(
    schedule: RetentionSchedule,
    questionPool: QuestionPool
  ): string {
    const strategies: string[] = [];

    if (schedule.scheduleType === 'remediation') {
      strategies.push('remediation-focused');
    }

    if (questionPool.strugglingQuestions.length > questionPool.masteredQuestions.length) {
      strategies.push('difficulty-adjusted');
    }

    if (schedule.metadata?.previousScores && schedule.metadata.previousScores.length > 0) {
      strategies.push('performance-adaptive');
    }

    return strategies.length > 0 ? strategies.join(', ') : 'standard';
  }

  private calculateDifficultyBalance(
    questions: CreateAssessmentQuestionRequest[]
  ): { easy: number; medium: number; hard: number } {
    const counts = { easy: 0, medium: 0, hard: 0 };
    
    for (const question of questions) {
      if (question.difficulty) {
        counts[question.difficulty as keyof typeof counts]++;
      }
    }

    const total = questions.length;
    return {
      easy: Math.round((counts.easy / total) * 100),
      medium: Math.round((counts.medium / total) * 100),
      hard: Math.round((counts.hard / total) * 100)
    };
  }

  private calculateQuestionSources(
    questions: CreateAssessmentQuestionRequest[]
  ): { fromPrevious: number; fromPool: number; generated: number } {
    // In this implementation, all questions come from the existing pool
    return {
      fromPrevious: 0,
      fromPool: questions.length,
      generated: 0
    };
  }
}

// ===== FACTORY FUNCTIONS =====

/**
 * Create retention assessment generator
 */
export function createRetentionAssessmentGenerator(
  prisma: PrismaClient
): RetentionAssessmentGenerator {
  return new RetentionAssessmentGenerator(prisma);
}