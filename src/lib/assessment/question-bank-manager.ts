/**
 * Question Bank Management System
 * 
 * Provides comprehensive management interface for the assessment question bank
 * including search, filtering, import/export, and administrative functions.
 */

import { QuestionBankManager, QuestionBankItem, QuestionFilter, QuestionConcept, CognitiveLevel } from './question-bank';
import { QuestionSeedGenerator } from './question-seed-generator';
import { AutoGrader, GradingResult, StudentResponse } from './auto-grader';
import type { DifficultyLevel, QuestionType } from '@/types/content';

// ===== MANAGEMENT INTERFACE TYPES =====

export interface QuestionBankStats {
  total: number;
  active: number;
  inactive: number;
  byDifficulty: Record<DifficultyLevel, number>;
  byConcept: Record<string, number>;
  byType: Record<QuestionType, number>;
  byCognitiveLevel: Record<CognitiveLevel, number>;
  qualityDistribution: {
    excellent: number;
    good: number;
    fair: number;
    poor: number;
  };
  usageStats: {
    mostUsed: Array<{ id: string; title: string; timesUsed: number }>;
    leastUsed: Array<{ id: string; title: string; timesUsed: number }>;
    neverUsed: number;
  };
}

export interface SearchQuery {
  text?: string;
  filters?: QuestionFilter;
  sortBy?: 'relevance' | 'difficulty' | 'created' | 'usage' | 'quality';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  questions: QuestionBankItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  facets: {
    concepts: Array<{ value: string; count: number }>;
    difficulties: Array<{ value: string; count: number }>;
    types: Array<{ value: string; count: number }>;
    cognitiveLevel: Array<{ value: string; count: number }>;
  };
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ line: number; error: string }>;
  warnings: Array<{ line: number; warning: string }>;
}

export interface ExportOptions {
  format: 'json' | 'csv' | 'xml' | 'qti';
  includeStats: boolean;
  includeInactive: boolean;
  filter?: QuestionFilter;
}

// ===== QUESTION BANK MANAGEMENT SYSTEM =====

export class QuestionBankManagementSystem {
  private questionBank: QuestionBankManager;
  private seedGenerator: QuestionSeedGenerator;
  private autoGrader: AutoGrader;
  private searchIndex: Map<string, Set<string>> = new Map();

  constructor() {
    this.questionBank = new QuestionBankManager();
    this.seedGenerator = new QuestionSeedGenerator(this.questionBank);
    this.autoGrader = new AutoGrader();
  }

  /**
   * Initialize the management system
   */
  async initialize(): Promise<void> {
    await this.questionBank.initialize();
    await this.buildSearchIndex();
  }

  /**
   * Get comprehensive statistics about the question bank
   */
  getStatistics(): QuestionBankStats {
    const basicStats = this.questionBank.getStatistics();
    const allQuestions = this.questionBank.getQuestions({ includeInactive: true });

    // Calculate quality distribution
    const qualityDistribution = { excellent: 0, good: 0, fair: 0, poor: 0 };
    const usageStats = {
      mostUsed: [] as Array<{ id: string; title: string; timesUsed: number }>,
      leastUsed: [] as Array<{ id: string; title: string; timesUsed: number }>,
      neverUsed: 0
    };

    // Analyze questions with sufficient usage data
    const questionsWithUsage = allQuestions.filter(q => q.timesUsed >= 10);
    questionsWithUsage.forEach(question => {
      const analysis = this.questionBank.analyzeQuestionQuality(question.id);
      qualityDistribution[analysis.qualityRating]++;
    });

    // Usage statistics
    const sortedByUsage = allQuestions.sort((a, b) => b.timesUsed - a.timesUsed);
    usageStats.mostUsed = sortedByUsage.slice(0, 10).map(q => ({
      id: q.id,
      title: q.questionText.substring(0, 50) + '...',
      timesUsed: q.timesUsed
    }));

    usageStats.leastUsed = sortedByUsage.slice(-10).map(q => ({
      id: q.id,
      title: q.questionText.substring(0, 50) + '...',
      timesUsed: q.timesUsed
    }));

    usageStats.neverUsed = allQuestions.filter(q => q.timesUsed === 0).length;

    return {
      total: basicStats.totalQuestions,
      active: basicStats.activeQuestions,
      inactive: basicStats.totalQuestions - basicStats.activeQuestions,
      byDifficulty: basicStats.byDifficulty,
      byConcept: basicStats.byConcept,
      byType: basicStats.byType,
      byCognitiveLevel: basicStats.byCognitiveLevel,
      qualityDistribution,
      usageStats
    };
  }

  /**
   * Search questions with advanced filtering and faceting
   */
  searchQuestions(query: SearchQuery): SearchResult {
    const pageSize = query.pageSize || 20;
    const page = query.page || 1;

    // Get base question set
    let questions = this.questionBank.getQuestions({
      filter: query.filters,
      includeInactive: false
    });

    // Apply text search if provided
    if (query.text) {
      questions = this.performTextSearch(questions, query.text);
    }

    // Sort results
    if (query.sortBy && query.sortBy !== 'relevance') {
      questions = this.sortQuestions(questions, query.sortBy, query.sortOrder || 'asc');
    }

    // Calculate facets before pagination
    const facets = this.calculateFacets(questions);

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const paginatedQuestions = questions.slice(startIndex, startIndex + pageSize);

    return {
      questions: paginatedQuestions,
      total: questions.length,
      page,
      pageSize,
      totalPages: Math.ceil(questions.length / pageSize),
      facets
    };
  }

  /**
   * Create a new assessment from question bank
   */
  createAssessment(options: {
    name: string;
    concept: QuestionConcept;
    difficulty?: DifficultyLevel;
    questionCount: number;
    timeLimit?: number;
    randomize: boolean;
    cognitiveDistribution?: Partial<Record<CognitiveLevel, number>>;
    typeDistribution?: Partial<Record<QuestionType, number>>;
  }): {
    assessmentId: string;
    questions: QuestionBankItem[];
    estimatedTime: number;
    maxPoints: number;
  } {
    const questions = this.questionBank.generateAssessment({
      concept: options.concept,
      difficulty: options.difficulty,
      questionCount: options.questionCount,
      cognitiveDistribution: options.cognitiveDistribution,
      typeDistribution: options.typeDistribution
    });

    if (options.randomize) {
      this.shuffleArray(questions);
    }

    const assessmentId = `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const estimatedTime = questions.reduce((sum, q) => sum + q.estimatedTimeSeconds, 0);
    const maxPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return {
      assessmentId,
      questions,
      estimatedTime,
      maxPoints
    };
  }

  /**
   * Grade an assessment submission
   */
  gradeAssessment(
    assessmentId: string,
    questions: QuestionBankItem[],
    responses: StudentResponse[]
  ): {
    assessmentId: string;
    results: GradingResult[];
    summary: {
      totalPoints: number;
      earnedPoints: number;
      percentage: number;
      passingScore: boolean;
      breakdown: { correct: number; incorrect: number; partialCredit: number };
    };
    feedback: string;
    recommendations: string[];
  } {
    // Grade all responses
    const results = this.autoGrader.batchGrade(questions, responses);

    // Calculate summary
    const summary = this.autoGrader.calculateAssessmentScore(results);

    // Generate feedback and recommendations
    const feedback = this.generateAssessmentFeedback(summary, results);
    const recommendations = this.generateRecommendations(results, questions);

    // Update question usage statistics
    responses.forEach((response, index) => {
      const result = results[index];
      if (result) {
        this.questionBank.recordQuestionUsage(response.questionId, result.score);
      }
    });

    return {
      assessmentId,
      results,
      summary,
      feedback,
      recommendations
    };
  }

  /**
   * Add a new question to the bank
   */
  addQuestion(question: Omit<QuestionBankItem, 'id' | 'timesUsed' | 'averageScore' | 'createdAt' | 'updatedAt'>): string {
    const questionId = this.questionBank.addQuestion(question);
    this.updateSearchIndex(questionId, question);
    return questionId;
  }

  /**
   * Update an existing question
   */
  updateQuestion(questionId: string, updates: Partial<QuestionBankItem>): boolean {
    // This would integrate with the database layer to update questions
    // For now, return true as placeholder
    return true;
  }

  /**
   * Deactivate a question (soft delete)
   */
  deactivateQuestion(questionId: string): boolean {
    return this.updateQuestion(questionId, { isActive: false });
  }

  /**
   * Generate seed questions
   */
  async generateSeedQuestions(): Promise<{ total: number; byCategory: Record<string, number> }> {
    const result = await this.seedGenerator.generateAllSeedQuestions();
    await this.buildSearchIndex(); // Rebuild search index
    return result;
  }

  /**
   * Import questions from external format
   */
  async importQuestions(data: string, format: 'json' | 'csv' | 'qti'): Promise<ImportResult> {
    const result: ImportResult = {
      success: false,
      imported: 0,
      skipped: 0,
      errors: [],
      warnings: []
    };

    try {
      let questions: any[];

      switch (format) {
        case 'json':
          questions = JSON.parse(data);
          break;
        case 'csv':
          questions = this.parseCSV(data);
          break;
        case 'qti':
          questions = this.parseQTI(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      // Validate and import each question
      for (let i = 0; i < questions.length; i++) {
        try {
          const question = this.validateImportedQuestion(questions[i]);
          this.addQuestion(question);
          result.imported++;
        } catch (error) {
          result.errors.push({
            line: i + 1,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      result.success = result.errors.length === 0;
      return result;

    } catch (error) {
      result.errors.push({
        line: 0,
        error: `Failed to parse ${format}: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return result;
    }
  }

  /**
   * Export questions to external format
   */
  async exportQuestions(options: ExportOptions): Promise<string> {
    const questions = this.questionBank.getQuestions({
      filter: options.filter,
      includeInactive: options.includeInactive
    });

    switch (options.format) {
      case 'json':
        return this.exportToJSON(questions, options.includeStats);
      case 'csv':
        return this.exportToCSV(questions);
      case 'xml':
        return this.exportToXML(questions);
      case 'qti':
        return this.exportToQTI(questions);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }

  /**
   * Analyze question bank quality and provide recommendations
   */
  analyzeQuestionBankQuality(): {
    overallScore: number;
    issues: Array<{ type: string; description: string; severity: 'low' | 'medium' | 'high'; recommendation: string }>;
    strengths: string[];
    recommendations: string[];
  } {
    const stats = this.getStatistics();
    const issues = [];
    const strengths = [];
    const recommendations = [];

    // Check coverage
    const concepts = Object.keys(stats.byConcept);
    if (concepts.length < 7) {
      issues.push({
        type: 'coverage',
        description: 'Some grammar concepts are missing questions',
        severity: 'high' as const,
        recommendation: 'Add questions for missing concepts to ensure complete coverage'
      });
    } else {
      strengths.push('Comprehensive coverage of grammar concepts');
    }

    // Check difficulty distribution
    const difficultyTotal = Object.values(stats.byDifficulty).reduce((sum, count) => sum + count, 0);
    const beginnerPercentage = (stats.byDifficulty.beginner || 0) / difficultyTotal;
    
    if (beginnerPercentage < 0.4) {
      issues.push({
        type: 'difficulty_distribution',
        description: 'Not enough beginner-level questions',
        severity: 'medium' as const,
        recommendation: 'Add more beginner-level questions for scaffolding'
      });
    }

    // Check question quality
    const qualityTotal = Object.values(stats.qualityDistribution).reduce((sum, count) => sum + count, 0);
    const poorPercentage = stats.qualityDistribution.poor / qualityTotal;
    
    if (poorPercentage > 0.2) {
      issues.push({
        type: 'quality',
        description: 'Too many poor-quality questions',
        severity: 'high' as const,
        recommendation: 'Review and improve questions with poor performance metrics'
      });
    }

    // Check usage patterns
    if (stats.usageStats.neverUsed > stats.total * 0.3) {
      issues.push({
        type: 'usage',
        description: 'Many questions are never used',
        severity: 'low' as const,
        recommendation: 'Review unused questions and consider removing or improving them'
      });
    }

    // Calculate overall score
    const maxScore = 100;
    let score = maxScore;
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high': score -= 20; break;
        case 'medium': score -= 10; break;
        case 'low': score -= 5; break;
      }
    });

    return {
      overallScore: Math.max(0, score),
      issues,
      strengths,
      recommendations
    };
  }

  // ===== PRIVATE HELPER METHODS =====

  private async buildSearchIndex(): Promise<void> {
    this.searchIndex.clear();
    
    const questions = this.questionBank.getQuestions({ includeInactive: true });
    
    questions.forEach(question => {
      this.updateSearchIndex(question.id, question);
    });
  }

  private updateSearchIndex(questionId: string, question: Partial<QuestionBankItem>): void {
    // Create searchable text from question
    const searchableText = [
      question.questionText,
      question.learningObjective,
      question.explanation,
      ...(question.tags || []),
      question.concept,
      question.subConcept
    ].filter(Boolean).join(' ').toLowerCase();

    // Tokenize and add to index
    const words = searchableText.split(/\s+/).filter(word => word.length > 2);
    
    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, new Set());
      }
      this.searchIndex.get(word)!.add(questionId);
    });
  }

  private performTextSearch(questions: QuestionBankItem[], query: string): QuestionBankItem[] {
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
    const questionIds = new Set<string>();

    // Find questions matching search terms
    searchTerms.forEach(term => {
      const matchingIds = this.searchIndex.get(term);
      if (matchingIds) {
        matchingIds.forEach(id => questionIds.add(id));
      }
    });

    // Filter questions by matching IDs and sort by relevance
    return questions
      .filter(q => questionIds.has(q.id))
      .sort((a, b) => this.calculateRelevanceScore(b, query) - this.calculateRelevanceScore(a, query));
  }

  private calculateRelevanceScore(question: QuestionBankItem, query: string): number {
    const queryLower = query.toLowerCase();
    let score = 0;

    // Exact match in question text gets highest score
    if (question.questionText.toLowerCase().includes(queryLower)) {
      score += 100;
    }

    // Match in learning objective
    if (question.learningObjective?.toLowerCase().includes(queryLower)) {
      score += 50;
    }

    // Match in tags
    question.tags?.forEach(tag => {
      if (tag.toLowerCase().includes(queryLower)) {
        score += 25;
      }
    });

    // Boost for frequently used questions
    score += Math.min(question.timesUsed * 2, 20);

    return score;
  }

  private sortQuestions(questions: QuestionBankItem[], sortBy: string, order: 'asc' | 'desc'): QuestionBankItem[] {
    return questions.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'difficulty':
          const diffOrder = { beginner: 1, intermediate: 2, advanced: 3 };
          comparison = diffOrder[a.difficulty] - diffOrder[b.difficulty];
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
      }

      return order === 'desc' ? -comparison : comparison;
    });
  }

  private calculateFacets(questions: QuestionBankItem[]): SearchResult['facets'] {
    const facets = {
      concepts: [] as Array<{ value: string; count: number }>,
      difficulties: [] as Array<{ value: string; count: number }>,
      types: [] as Array<{ value: string; count: number }>,
      cognitiveLevel: [] as Array<{ value: string; count: number }>
    };

    // Count occurrences
    const conceptCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};
    const cognitiveCounts: Record<string, number> = {};

    questions.forEach(q => {
      conceptCounts[q.concept] = (conceptCounts[q.concept] || 0) + 1;
      difficultyCounts[q.difficulty] = (difficultyCounts[q.difficulty] || 0) + 1;
      typeCounts[q.type] = (typeCounts[q.type] || 0) + 1;
      cognitiveCounts[q.cognitiveLevel] = (cognitiveCounts[q.cognitiveLevel] || 0) + 1;
    });

    // Convert to arrays and sort by count
    facets.concepts = Object.entries(conceptCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    facets.difficulties = Object.entries(difficultyCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    facets.types = Object.entries(typeCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    facets.cognitiveLevel = Object.entries(cognitiveCounts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count);

    return facets;
  }

  private generateAssessmentFeedback(summary: any, results: GradingResult[]): string {
    const { percentage, passingScore } = summary;

    if (percentage >= 90) {
      return "Outstanding performance! You've demonstrated excellent mastery of the material.";
    } else if (percentage >= 80) {
      return "Great work! You've met the mastery threshold and can move forward.";
    } else if (percentage >= 70) {
      return "Good effort! With a little more practice, you'll reach mastery.";
    } else if (percentage >= 60) {
      return "You're making progress, but this material needs more attention.";
    } else {
      return "This topic needs significant work. Don't worry - targeted practice will help!";
    }
  }

  private generateRecommendations(results: GradingResult[], questions: QuestionBankItem[]): string[] {
    const recommendations = [];
    const mistakePatterns = new Map<string, number>();

    // Analyze mistake patterns
    results.forEach(result => {
      if (result.mistakes) {
        result.mistakes.forEach(mistake => {
          mistakePatterns.set(mistake.type, (mistakePatterns.get(mistake.type) || 0) + 1);
        });
      }
    });

    // Generate targeted recommendations
    for (const [mistakeType, count] of mistakePatterns) {
      if (count >= 2) {
        switch (mistakeType) {
          case 'spelling_grammar':
            recommendations.push('Focus on spelling and grammar practice');
            break;
          case 'sentence_structure':
            recommendations.push('Review sentence structure and practice building complete sentences');
            break;
          case 'incorrect_choice':
            recommendations.push('Review the concepts covered in this assessment');
            break;
        }
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('Continue practicing to maintain your skill level');
    }

    return recommendations;
  }

  private shuffleArray<T>(array: T[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Import/Export helper methods (simplified implementations)
  private parseCSV(data: string): any[] {
    // Simplified CSV parsing - would need robust implementation
    return [];
  }

  private parseQTI(data: string): any[] {
    // QTI XML parsing - would need robust implementation
    return [];
  }

  private validateImportedQuestion(data: any): Omit<QuestionBankItem, 'id' | 'timesUsed' | 'averageScore' | 'createdAt' | 'updatedAt'> {
    // Question validation logic
    throw new Error('Validation not implemented');
  }

  private exportToJSON(questions: QuestionBankItem[], includeStats: boolean): string {
    const exportData = {
      questions,
      exportDate: new Date().toISOString(),
      stats: includeStats ? this.getStatistics() : undefined
    };
    return JSON.stringify(exportData, null, 2);
  }

  private exportToCSV(questions: QuestionBankItem[]): string {
    // CSV export implementation
    return '';
  }

  private exportToXML(questions: QuestionBankItem[]): string {
    // XML export implementation
    return '';
  }

  private exportToQTI(questions: QuestionBankItem[]): string {
    // QTI export implementation
    return '';
  }
}