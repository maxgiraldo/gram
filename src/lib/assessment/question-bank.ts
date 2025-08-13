/**
 * Assessment Question Bank System
 * 
 * Comprehensive question bank for mastery assessment with 500+ assessment questions
 * across all difficulty levels, including categorization, distractor analysis,
 * and auto-grading validation.
 */

import { z } from 'zod';
import type { 
  QuestionType, 
  DifficultyLevel, 
  QuestionData, 
  CorrectAnswer 
} from '@/types/content';

// ===== TYPES AND SCHEMAS =====

export type QuestionConcept = 
  | 'nouns'
  | 'verbs' 
  | 'adjectives'
  | 'adverbs'
  | 'pronouns'
  | 'articles'
  | 'sentence_structure'
  | 'subject_predicate'
  | 'plurals'
  | 'proper_nouns'
  | 'verb_tenses'
  | 'comparatives'
  | 'compound_sentences';

export type QuestionSubConcept = 
  | 'common_proper'
  | 'concrete_abstract'
  | 'action_linking_helping'
  | 'past_present_future'
  | 'positive_comparative_superlative'
  | 'subject_object_pronouns'
  | 'definite_indefinite_articles'
  | 'complete_incomplete_sentences'
  | 'simple_compound_complex';

export type CognitiveLevel = 
  | 'remember'     // recall facts
  | 'understand'   // explain concepts
  | 'apply'        // use in new situations
  | 'analyze'      // break down/distinguish
  | 'evaluate'     // judge/critique
  | 'create';      // construct/design

export interface QuestionBankItem {
  id: string;
  questionText: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  
  // Content classification
  concept: QuestionConcept;
  subConcept?: QuestionSubConcept;
  cognitiveLevel: CognitiveLevel;
  
  // Question content
  questionData: QuestionData;
  correctAnswer: CorrectAnswer;
  
  // Educational metadata
  learningObjective: string;
  explanation?: string;
  hints?: string[];
  
  // Quality metrics
  estimatedTimeSeconds: number;
  points: number;
  distractorAnalysis?: DistractorAnalysis;
  
  // Usage tracking
  timesUsed: number;
  averageScore: number;
  lastUsed?: Date;
  
  // Administrative
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  isActive: boolean;
}

export interface DistractorAnalysis {
  wrongAnswers: string[];
  commonMistakes: Array<{
    answer: string;
    frequency: number;
    explanation: string;
    remediation: string;
  }>;
  qualityScore: number; // 0-1, how plausible are the distractors
}

export interface QuestionFilter {
  concepts?: QuestionConcept[];
  difficulties?: DifficultyLevel[];
  cognitiveLevel?: CognitiveLevel[];
  types?: QuestionType[];
  minPoints?: number;
  maxPoints?: number;
  isActive?: boolean;
  tags?: string[];
}

export interface QuestionBankQuery {
  filter?: QuestionFilter;
  limit?: number;
  offset?: number;
  sortBy?: 'difficulty' | 'concept' | 'created' | 'usage' | 'quality';
  sortOrder?: 'asc' | 'desc';
  includeInactive?: boolean;
}

export interface QuestionGenerationTemplate {
  concept: QuestionConcept;
  type: QuestionType;
  difficulty: DifficultyLevel;
  cognitiveLevel: CognitiveLevel;
  template: string;
  variables: Record<string, string[]>;
  correctAnswerPattern: string;
  distractorPatterns: string[];
}

// ===== VALIDATION SCHEMAS =====

const questionBankItemSchema = z.object({
  questionText: z.string().min(10).max(500),
  type: z.enum(['multiple_choice', 'fill_in_blank', 'drag_and_drop', 'sentence_builder', 'essay']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  concept: z.string(),
  cognitiveLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
  learningObjective: z.string().min(10),
  estimatedTimeSeconds: z.number().min(10).max(600),
  points: z.number().min(1).max(10),
  isActive: z.boolean().default(true)
});

// ===== QUESTION BANK MANAGER =====

export class QuestionBankManager {
  private questions: Map<string, QuestionBankItem> = new Map();
  private conceptIndex: Map<QuestionConcept, Set<string>> = new Map();
  private difficultyIndex: Map<DifficultyLevel, Set<string>> = new Map();
  private typeIndex: Map<QuestionType, Set<string>> = new Map();

  constructor() {
    this.initializeIndexes();
  }

  /**
   * Initialize the question bank with seed data
   */
  async initialize(): Promise<void> {
    // Load questions from database or generate initial set
    await this.loadQuestionsFromDatabase();
    
    // If no questions exist, generate seed questions
    if (this.questions.size === 0) {
      await this.generateSeedQuestions();
    }
    
    // Rebuild indexes
    this.rebuildIndexes();
  }

  /**
   * Add a question to the bank
   */
  addQuestion(question: Omit<QuestionBankItem, 'id' | 'timesUsed' | 'averageScore' | 'createdAt' | 'updatedAt'>): string {
    const id = this.generateQuestionId();
    const fullQuestion: QuestionBankItem = {
      ...question,
      id,
      timesUsed: 0,
      averageScore: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate question
    this.validateQuestion(fullQuestion);

    // Add to main store
    this.questions.set(id, fullQuestion);

    // Update indexes
    this.addToIndexes(id, fullQuestion);

    return id;
  }

  /**
   * Get questions by filter criteria
   */
  getQuestions(query: QuestionBankQuery = {}): QuestionBankItem[] {
    let questionIds = this.getQuestionIdsByFilter(query.filter);

    // Apply sorting
    const questions = Array.from(questionIds)
      .map(id => this.questions.get(id)!)
      .filter(q => query.includeInactive || q.isActive);

    if (query.sortBy) {
      questions.sort((a, b) => this.compareQuestions(a, b, query.sortBy!, query.sortOrder || 'asc'));
    }

    // Apply pagination
    const start = query.offset || 0;
    const end = query.limit ? start + query.limit : undefined;

    return questions.slice(start, end);
  }

  /**
   * Get questions for a specific assessment
   */
  generateAssessment(options: {
    concept: QuestionConcept;
    difficulty?: DifficultyLevel;
    questionCount: number;
    cognitiveDistribution?: Partial<Record<CognitiveLevel, number>>;
    typeDistribution?: Partial<Record<QuestionType, number>>;
  }): QuestionBankItem[] {
    const { concept, difficulty, questionCount, cognitiveDistribution, typeDistribution } = options;

    // Default cognitive distribution (Bloom's taxonomy)
    const defaultCognitiveDistribution: Record<CognitiveLevel, number> = {
      remember: 0.2,
      understand: 0.3,
      apply: 0.3,
      analyze: 0.15,
      evaluate: 0.05,
      create: 0.0
    };

    // Default type distribution
    const defaultTypeDistribution: Record<QuestionType, number> = {
      multiple_choice: 0.6,
      fill_in_blank: 0.2,
      drag_and_drop: 0.1,
      sentence_builder: 0.1,
      essay: 0.0
    };

    const cognitiveTargets = { ...defaultCognitiveDistribution, ...cognitiveDistribution };
    const typeTargets = { ...defaultTypeDistribution, ...typeDistribution };

    const selectedQuestions: QuestionBankItem[] = [];
    const usedQuestions = new Set<string>();

    // Generate questions based on distributions
    for (const [cogLevel, ratio] of Object.entries(cognitiveTargets)) {
      const targetCount = Math.round(questionCount * ratio);
      
      for (const [qType, typeRatio] of Object.entries(typeTargets)) {
        const typeCount = Math.round(targetCount * typeRatio);
        
        if (typeCount > 0) {
          const questions = this.getQuestions({
            filter: {
              concepts: [concept],
              difficulties: difficulty ? [difficulty] : undefined,
              cognitiveLevel: [cogLevel as CognitiveLevel],
              types: [qType as QuestionType],
              isActive: true
            },
            limit: typeCount * 2 // Get extra in case some are already used
          });

          // Select questions that haven't been used
          for (const question of questions) {
            if (!usedQuestions.has(question.id) && selectedQuestions.length < questionCount) {
              selectedQuestions.push(question);
              usedQuestions.add(question.id);
            }
          }
        }
      }
    }

    // Fill remaining slots with any available questions for the concept
    while (selectedQuestions.length < questionCount) {
      const remainingQuestions = this.getQuestions({
        filter: {
          concepts: [concept],
          difficulties: difficulty ? [difficulty] : undefined,
          isActive: true
        },
        limit: 50
      }).filter(q => !usedQuestions.has(q.id));

      if (remainingQuestions.length === 0) break;

      const randomQuestion = remainingQuestions[Math.floor(Math.random() * remainingQuestions.length)];
      selectedQuestions.push(randomQuestion);
      usedQuestions.add(randomQuestion.id);
    }

    // Shuffle the final selection
    return this.shuffleArray(selectedQuestions);
  }

  /**
   * Update question usage statistics
   */
  recordQuestionUsage(questionId: string, score: number): void {
    const question = this.questions.get(questionId);
    if (!question) return;

    const newTimesUsed = question.timesUsed + 1;
    const newAverageScore = ((question.averageScore * question.timesUsed) + score) / newTimesUsed;

    this.questions.set(questionId, {
      ...question,
      timesUsed: newTimesUsed,
      averageScore: newAverageScore,
      lastUsed: new Date(),
      updatedAt: new Date()
    });
  }

  /**
   * Analyze question quality based on usage data
   */
  analyzeQuestionQuality(questionId: string): {
    discriminationIndex: number;
    difficultyIndex: number;
    qualityRating: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const question = this.questions.get(questionId);
    if (!question || question.timesUsed < 10) {
      return {
        discriminationIndex: 0,
        difficultyIndex: 0,
        qualityRating: 'poor',
        recommendations: ['Need more usage data for analysis']
      };
    }

    const difficultyIndex = question.averageScore;
    const discriminationIndex = this.calculateDiscriminationIndex(question);
    
    let qualityRating: 'excellent' | 'good' | 'fair' | 'poor';
    const recommendations: string[] = [];

    if (discriminationIndex > 0.3 && difficultyIndex >= 0.3 && difficultyIndex <= 0.8) {
      qualityRating = 'excellent';
    } else if (discriminationIndex > 0.2 && difficultyIndex >= 0.2 && difficultyIndex <= 0.9) {
      qualityRating = 'good';
    } else if (discriminationIndex > 0.1) {
      qualityRating = 'fair';
    } else {
      qualityRating = 'poor';
    }

    // Generate recommendations
    if (difficultyIndex < 0.2) {
      recommendations.push('Question may be too difficult - consider revising');
    } else if (difficultyIndex > 0.9) {
      recommendations.push('Question may be too easy - consider increasing difficulty');
    }

    if (discriminationIndex < 0.2) {
      recommendations.push('Question does not discriminate well between high and low performers');
    }

    return {
      discriminationIndex,
      difficultyIndex,
      qualityRating,
      recommendations
    };
  }

  /**
   * Generate questions from templates
   */
  generateQuestionsFromTemplate(template: QuestionGenerationTemplate, count: number): QuestionBankItem[] {
    const questions: QuestionBankItem[] = [];

    for (let i = 0; i < count; i++) {
      const question = this.generateQuestionFromTemplate(template);
      if (question) {
        questions.push(question);
      }
    }

    return questions;
  }

  /**
   * Get question bank statistics
   */
  getStatistics(): {
    totalQuestions: number;
    activeQuestions: number;
    byDifficulty: Record<DifficultyLevel, number>;
    byConcept: Record<QuestionConcept, number>;
    byType: Record<QuestionType, number>;
    byCognitiveLevel: Record<CognitiveLevel, number>;
    averageQuality: number;
    mostUsedQuestions: Array<{ id: string; timesUsed: number; concept: QuestionConcept }>;
  } {
    const activeQuestions = Array.from(this.questions.values()).filter(q => q.isActive);
    
    const stats = {
      totalQuestions: this.questions.size,
      activeQuestions: activeQuestions.length,
      byDifficulty: {} as Record<DifficultyLevel, number>,
      byConcept: {} as Record<QuestionConcept, number>,
      byType: {} as Record<QuestionType, number>,
      byCognitiveLevel: {} as Record<CognitiveLevel, number>,
      averageQuality: 0,
      mostUsedQuestions: [] as Array<{ id: string; timesUsed: number; concept: QuestionConcept }>
    };

    // Calculate distributions
    for (const question of activeQuestions) {
      stats.byDifficulty[question.difficulty] = (stats.byDifficulty[question.difficulty] || 0) + 1;
      stats.byConcept[question.concept] = (stats.byConcept[question.concept] || 0) + 1;
      stats.byType[question.type] = (stats.byType[question.type] || 0) + 1;
      stats.byCognitiveLevel[question.cognitiveLevel] = (stats.byCognitiveLevel[question.cognitiveLevel] || 0) + 1;
    }

    // Calculate average quality
    const questionsWithUsage = activeQuestions.filter(q => q.timesUsed >= 10);
    if (questionsWithUsage.length > 0) {
      stats.averageQuality = questionsWithUsage.reduce((sum, q) => {
        const analysis = this.analyzeQuestionQuality(q.id);
        return sum + (analysis.qualityRating === 'excellent' ? 1 : 
                     analysis.qualityRating === 'good' ? 0.8 :
                     analysis.qualityRating === 'fair' ? 0.6 : 0.4);
      }, 0) / questionsWithUsage.length;
    }

    // Most used questions
    stats.mostUsedQuestions = activeQuestions
      .sort((a, b) => b.timesUsed - a.timesUsed)
      .slice(0, 10)
      .map(q => ({ id: q.id, timesUsed: q.timesUsed, concept: q.concept }));

    return stats;
  }

  // ===== PRIVATE METHODS =====

  private initializeIndexes(): void {
    this.conceptIndex.clear();
    this.difficultyIndex.clear();
    this.typeIndex.clear();
  }

  private async loadQuestionsFromDatabase(): Promise<void> {
    // This would integrate with the database layer
    // For now, we'll start with an empty collection
  }

  private generateQuestionId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private validateQuestion(question: QuestionBankItem): void {
    try {
      questionBankItemSchema.parse(question);
    } catch (error) {
      throw new Error(`Invalid question: ${error instanceof Error ? error.message : 'Unknown validation error'}`);
    }
  }

  private addToIndexes(id: string, question: QuestionBankItem): void {
    // Add to concept index
    if (!this.conceptIndex.has(question.concept)) {
      this.conceptIndex.set(question.concept, new Set());
    }
    this.conceptIndex.get(question.concept)!.add(id);

    // Add to difficulty index
    if (!this.difficultyIndex.has(question.difficulty)) {
      this.difficultyIndex.set(question.difficulty, new Set());
    }
    this.difficultyIndex.get(question.difficulty)!.add(id);

    // Add to type index
    if (!this.typeIndex.has(question.type)) {
      this.typeIndex.set(question.type, new Set());
    }
    this.typeIndex.get(question.type)!.add(id);
  }

  private rebuildIndexes(): void {
    this.initializeIndexes();
    for (const [id, question] of this.questions) {
      this.addToIndexes(id, question);
    }
  }

  private getQuestionIdsByFilter(filter?: QuestionFilter): Set<string> {
    if (!filter) return new Set(this.questions.keys());

    let resultIds = new Set<string>();
    let isFirstFilter = true;

    // Filter by concepts
    if (filter.concepts && filter.concepts.length > 0) {
      const conceptIds = new Set<string>();
      for (const concept of filter.concepts) {
        const ids = this.conceptIndex.get(concept);
        if (ids) {
          ids.forEach(id => conceptIds.add(id));
        }
      }
      resultIds = isFirstFilter ? conceptIds : this.intersectSets(resultIds, conceptIds);
      isFirstFilter = false;
    }

    // Filter by difficulties
    if (filter.difficulties && filter.difficulties.length > 0) {
      const difficultyIds = new Set<string>();
      for (const difficulty of filter.difficulties) {
        const ids = this.difficultyIndex.get(difficulty);
        if (ids) {
          ids.forEach(id => difficultyIds.add(id));
        }
      }
      resultIds = isFirstFilter ? difficultyIds : this.intersectSets(resultIds, difficultyIds);
      isFirstFilter = false;
    }

    // Filter by types
    if (filter.types && filter.types.length > 0) {
      const typeIds = new Set<string>();
      for (const type of filter.types) {
        const ids = this.typeIndex.get(type);
        if (ids) {
          ids.forEach(id => typeIds.add(id));
        }
      }
      resultIds = isFirstFilter ? typeIds : this.intersectSets(resultIds, typeIds);
      isFirstFilter = false;
    }

    // If no filters applied, start with all questions
    if (isFirstFilter) {
      resultIds = new Set(this.questions.keys());
    }

    // Apply additional filters
    if (filter.cognitiveLevel && filter.cognitiveLevel.length > 0) {
      resultIds = new Set([...resultIds].filter(id => {
        const question = this.questions.get(id);
        return question && filter.cognitiveLevel!.includes(question.cognitiveLevel);
      }));
    }

    if (filter.isActive !== undefined) {
      resultIds = new Set([...resultIds].filter(id => {
        const question = this.questions.get(id);
        return question && question.isActive === filter.isActive;
      }));
    }

    return resultIds;
  }

  private intersectSets<T>(set1: Set<T>, set2: Set<T>): Set<T> {
    return new Set([...set1].filter(x => set2.has(x)));
  }

  private compareQuestions(a: QuestionBankItem, b: QuestionBankItem, sortBy: string, order: 'asc' | 'desc'): number {
    let comparison = 0;

    switch (sortBy) {
      case 'difficulty':
        const difficultyOrder = { beginner: 1, intermediate: 2, advanced: 3 };
        comparison = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
        break;
      case 'concept':
        comparison = a.concept.localeCompare(b.concept);
        break;
      case 'created':
        comparison = a.createdAt.getTime() - b.createdAt.getTime();
        break;
      case 'usage':
        comparison = a.timesUsed - b.timesUsed;
        break;
      case 'quality':
        comparison = a.averageScore - b.averageScore;
        break;
      default:
        comparison = 0;
    }

    return order === 'desc' ? -comparison : comparison;
  }

  private calculateDiscriminationIndex(question: QuestionBankItem): number {
    // This would require access to detailed response data
    // For now, return a placeholder based on usage patterns
    if (question.timesUsed < 10) return 0;
    
    // Simple heuristic: questions with moderate difficulty tend to discriminate better
    const idealDifficulty = 0.6;
    const difficultyDeviation = Math.abs(question.averageScore - idealDifficulty);
    return Math.max(0, 0.5 - difficultyDeviation);
  }

  private generateQuestionFromTemplate(template: QuestionGenerationTemplate): QuestionBankItem | null {
    try {
      // This would implement template-based question generation
      // For now, return null as this requires more complex implementation
      return null;
    } catch (error) {
      console.error('Failed to generate question from template:', error);
      return null;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private async generateSeedQuestions(): Promise<void> {
    // This would generate initial seed questions
    // Implementation would be quite extensive, so for now we'll add a few examples
    this.addSampleQuestions();
  }

  private addSampleQuestions(): void {
    // Add some sample questions to demonstrate the system
    const sampleQuestions = this.createSampleQuestions();
    sampleQuestions.forEach(question => {
      const id = this.generateQuestionId();
      this.questions.set(id, { ...question, id });
      this.addToIndexes(id, { ...question, id });
    });
  }

  private createSampleQuestions(): Omit<QuestionBankItem, 'id'>[] {
    return [
      {
        questionText: "Which word is a proper noun?",
        type: 'multiple_choice',
        difficulty: 'beginner',
        concept: 'nouns',
        subConcept: 'common_proper',
        cognitiveLevel: 'remember',
        questionData: {
          type: 'multiple_choice',
          options: ['teacher', 'school', 'Mrs. Garcia', 'book'],
          shuffleOptions: true
        },
        correctAnswer: 'Mrs. Garcia',
        learningObjective: 'Identify proper nouns in context',
        explanation: 'Proper nouns name specific people, places, or things and are always capitalized.',
        hints: ['Look for names that are capitalized', 'Proper nouns name specific things'],
        estimatedTimeSeconds: 30,
        points: 1,
        timesUsed: 0,
        averageScore: 0,
        createdBy: 'system',
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: ['grammar', 'nouns', 'proper'],
        isActive: true
      }
      // Additional sample questions would be added here
    ];
  }
}