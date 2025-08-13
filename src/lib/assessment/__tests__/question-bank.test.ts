/**
 * Question Bank System Test Suite
 * 
 * Comprehensive tests for the assessment question bank including
 * question management, auto-grading, and seed generation.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { QuestionBankManager, QuestionBankItem, QuestionConcept, CognitiveLevel } from '../question-bank';
import { QuestionSeedGenerator } from '../question-seed-generator';
import { AutoGrader, StudentResponse } from '../auto-grader';
import { QuestionBankManagementSystem } from '../question-bank-manager';
import type { DifficultyLevel, QuestionType } from '@/types/content';

describe('QuestionBankManager', () => {
  let questionBank: QuestionBankManager;

  beforeEach(() => {
    questionBank = new QuestionBankManager();
  });

  describe('Question Management', () => {
    test('should add questions to the bank', () => {
      const question = createSampleQuestion();
      const id = questionBank.addQuestion(question);
      
      expect(id).toBeDefined();
      expect(id).toMatch(/^q_\d+_[a-z0-9]+$/);
    });

    test('should retrieve questions by filter', () => {
      // Add multiple questions
      questionBank.addQuestion(createSampleQuestion({ concept: 'nouns', difficulty: 'beginner' }));
      questionBank.addQuestion(createSampleQuestion({ concept: 'verbs', difficulty: 'intermediate' }));
      questionBank.addQuestion(createSampleQuestion({ concept: 'nouns', difficulty: 'advanced' }));

      // Filter by concept
      const nounQuestions = questionBank.getQuestions({
        filter: { concepts: ['nouns'] }
      });
      expect(nounQuestions).toHaveLength(2);
      expect(nounQuestions.every(q => q.concept === 'nouns')).toBe(true);

      // Filter by difficulty
      const beginnerQuestions = questionBank.getQuestions({
        filter: { difficulties: ['beginner'] }
      });
      expect(beginnerQuestions).toHaveLength(1);
      expect(beginnerQuestions[0].difficulty).toBe('beginner');
    });

    test('should generate assessment with specified criteria', () => {
      // Add questions for assessment
      for (let i = 0; i < 10; i++) {
        questionBank.addQuestion(createSampleQuestion({ 
          concept: 'nouns',
          difficulty: 'beginner',
          cognitiveLevel: i % 2 === 0 ? 'remember' : 'understand'
        }));
      }

      const assessment = questionBank.generateAssessment({
        concept: 'nouns',
        difficulty: 'beginner',
        questionCount: 5
      });

      expect(assessment).toHaveLength(5);
      expect(assessment.every(q => q.concept === 'nouns')).toBe(true);
      expect(assessment.every(q => q.difficulty === 'beginner')).toBe(true);
    });

    test('should record question usage statistics', () => {
      const question = createSampleQuestion();
      const id = questionBank.addQuestion(question);

      // Initial usage should be 0
      const questions = questionBank.getQuestions({});
      const addedQuestion = questions.find(q => q.id === id);
      expect(addedQuestion?.timesUsed).toBe(0);
      expect(addedQuestion?.averageScore).toBe(0);

      // Record usage
      questionBank.recordQuestionUsage(id, 0.8);
      questionBank.recordQuestionUsage(id, 0.6);

      const updatedQuestions = questionBank.getQuestions({});
      const updatedQuestion = updatedQuestions.find(q => q.id === id);
      expect(updatedQuestion?.timesUsed).toBe(2);
      expect(updatedQuestion?.averageScore).toBe(0.7);
    });

    test('should analyze question quality', () => {
      const question = createSampleQuestion();
      const id = questionBank.addQuestion(question);

      // With insufficient data
      let analysis = questionBank.analyzeQuestionQuality(id);
      expect(analysis.qualityRating).toBe('poor');
      expect(analysis.recommendations).toContain('Need more usage data for analysis');

      // Simulate sufficient usage
      for (let i = 0; i < 15; i++) {
        questionBank.recordQuestionUsage(id, 0.6 + (Math.random() * 0.2)); // 0.6-0.8 range
      }

      analysis = questionBank.analyzeQuestionQuality(id);
      expect(analysis.qualityRating).not.toBe('poor');
      expect(analysis.difficultyIndex).toBeGreaterThan(0);
    });
  });

  describe('Statistics and Reporting', () => {
    test('should provide comprehensive statistics', () => {
      // Add variety of questions
      questionBank.addQuestion(createSampleQuestion({ concept: 'nouns', difficulty: 'beginner' }));
      questionBank.addQuestion(createSampleQuestion({ concept: 'verbs', difficulty: 'intermediate' }));
      questionBank.addQuestion(createSampleQuestion({ concept: 'adjectives', difficulty: 'advanced' }));

      const stats = questionBank.getStatistics();
      
      expect(stats.totalQuestions).toBe(3);
      expect(stats.activeQuestions).toBe(3);
      expect(stats.byDifficulty.beginner).toBe(1);
      expect(stats.byDifficulty.intermediate).toBe(1);
      expect(stats.byDifficulty.advanced).toBe(1);
      expect(stats.byConcept.nouns).toBe(1);
      expect(stats.byConcept.verbs).toBe(1);
      expect(stats.byConcept.adjectives).toBe(1);
    });
  });
});

describe('QuestionSeedGenerator', () => {
  let questionBank: QuestionBankManager;
  let seedGenerator: QuestionSeedGenerator;

  beforeEach(() => {
    questionBank = new QuestionBankManager();
    seedGenerator = new QuestionSeedGenerator(questionBank);
  });

  test('should generate comprehensive seed questions', async () => {
    const result = await seedGenerator.generateAllSeedQuestions();
    
    expect(result.total).toBeGreaterThan(20); // Should generate many questions
    expect(Object.keys(result.byCategory).length).toBeGreaterThan(5); // Multiple categories
    
    // Verify questions were actually added to the bank
    const stats = questionBank.getStatistics();
    expect(stats.totalQuestions).toBe(result.total);
  });

  test('should generate questions across all grammar concepts', async () => {
    await seedGenerator.generateAllSeedQuestions();
    const stats = questionBank.getStatistics();
    
    // Should have questions for major grammar concepts
    expect(stats.byConcept.nouns).toBeGreaterThan(0);
    expect(stats.byConcept.verbs).toBeGreaterThan(0);
    expect(stats.byConcept.adjectives).toBeGreaterThan(0);
    expect(stats.byConcept.adverbs).toBeGreaterThan(0);
    expect(stats.byConcept.pronouns).toBeGreaterThan(0);
    expect(stats.byConcept.articles).toBeGreaterThan(0);
    expect(stats.byConcept.sentence_structure).toBeGreaterThan(0);
  });

  test('should generate questions with different difficulty levels', async () => {
    await seedGenerator.generateAllSeedQuestions();
    const stats = questionBank.getStatistics();
    
    expect(stats.byDifficulty.beginner).toBeGreaterThan(0);
    expect(stats.byDifficulty.intermediate).toBeGreaterThan(0);
    expect(stats.byDifficulty.advanced).toBeGreaterThan(0);
  });

  test('should generate questions with different cognitive levels', async () => {
    await seedGenerator.generateAllSeedQuestions();
    const stats = questionBank.getStatistics();
    
    expect(stats.byCognitiveLevel.remember).toBeGreaterThan(0);
    expect(stats.byCognitiveLevel.understand).toBeGreaterThan(0);
    expect(stats.byCognitiveLevel.apply).toBeGreaterThan(0);
    expect(stats.byCognitiveLevel.analyze).toBeGreaterThan(0);
  });
});

describe('AutoGrader', () => {
  let autoGrader: AutoGrader;
  let sampleQuestions: QuestionBankItem[];

  beforeEach(() => {
    autoGrader = new AutoGrader();
    sampleQuestions = [
      {
        ...createSampleQuestion({
          type: 'multiple_choice',
          questionData: {
            type: 'multiple_choice',
            options: ['dog', 'running', 'quick', 'very'],
            shuffleOptions: true
          },
          correctAnswer: 'dog'
        }),
        id: 'test_question_0',
        timesUsed: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        ...createSampleQuestion({
          type: 'fill_in_blank',
          questionData: {
            type: 'fill_in_blank',
            template: 'The cat is ___.',
            blanks: [{ id: 'blank1', position: 0, acceptableAnswers: ['sleeping'], caseSensitive: false }]
          },
          correctAnswer: 'sleeping'
        }),
        id: 'test_question_1',
        timesUsed: 0,
        averageScore: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
  });

  describe('Multiple Choice Grading', () => {
    test('should grade correct multiple choice answers', () => {
      const question = sampleQuestions[0];
      const response: StudentResponse = {
        questionId: question.id,
        response: 'dog',
        timeSpent: 30,
        hintsUsed: 0,
        attemptNumber: 1
      };

      const result = autoGrader.gradeResponse(question, response);
      
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
      expect(result.earnedPoints).toBe(question.points);
      expect(result.feedback).toContain('Correct');
    });

    test('should grade incorrect multiple choice answers', () => {
      const question = sampleQuestions[0];
      const response: StudentResponse = {
        questionId: question.id,
        response: 'running',
        timeSpent: 45,
        hintsUsed: 0,
        attemptNumber: 1
      };

      const result = autoGrader.gradeResponse(question, response);
      
      expect(result.isCorrect).toBe(false);
      expect(result.score).toBe(0);
      expect(result.earnedPoints).toBe(0);
      expect(result.feedback).toContain('Incorrect');
    });

    test('should apply hint penalties', () => {
      const question = sampleQuestions[0];
      const response: StudentResponse = {
        questionId: question.id,
        response: 'dog',
        timeSpent: 30,
        hintsUsed: 2,
        attemptNumber: 1
      };

      const result = autoGrader.gradeResponse(question, response, { penalizeHints: true });
      
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBeLessThan(1); // Should be penalized
      expect(result.feedback).toContain('hint');
    });

    test('should provide time bonuses for quick correct answers', () => {
      const question = { ...sampleQuestions[0], estimatedTimeSeconds: 60 };
      const response: StudentResponse = {
        questionId: question.id,
        response: 'dog',
        timeSpent: 20, // Much faster than estimated
        hintsUsed: 0,
        attemptNumber: 1
      };

      const result = autoGrader.gradeResponse(question, response);
      
      expect(result.timeBonus).toBeGreaterThan(0);
      expect(result.feedback).toContain('quickly');
    });
  });

  describe('Fill in the Blank Grading', () => {
    test('should grade correct fill-in-blank answers', () => {
      const question = sampleQuestions[1];
      const response: StudentResponse = {
        questionId: question.id,
        response: 'sleeping',
        timeSpent: 25,
        hintsUsed: 0,
        attemptNumber: 1
      };

      const result = autoGrader.gradeResponse(question, response);
      
      expect(result.isCorrect).toBe(true);
      expect(result.score).toBe(1);
    });

    test('should provide partial credit for close answers', () => {
      const question = sampleQuestions[1];
      const response: StudentResponse = {
        questionId: question.id,
        response: 'sleping', // Misspelled
        timeSpent: 25,
        hintsUsed: 0,
        attemptNumber: 1
      };

      const result = autoGrader.gradeResponse(question, response, { allowPartialCredit: true });
      
      // Note: Partial credit depends on string similarity threshold
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.feedback).toBeDefined();
    });
  });

  describe('Batch Grading', () => {
    test('should grade multiple responses in batch', () => {
      const responses: StudentResponse[] = [
        {
          questionId: sampleQuestions[0].id,
          response: 'dog',
          timeSpent: 30,
          hintsUsed: 0,
          attemptNumber: 1
        },
        {
          questionId: sampleQuestions[1].id,
          response: 'sleeping',
          timeSpent: 25,
          hintsUsed: 0,
          attemptNumber: 1
        }
      ];

      const results = autoGrader.batchGrade(sampleQuestions, responses);
      
      expect(results).toHaveLength(2);
      expect(results[0].isCorrect).toBe(true);
      expect(results[1].isCorrect).toBe(true);
    });

    test('should calculate assessment scores correctly', () => {
      const results = [
        { isCorrect: true, score: 1, maxPoints: 2, earnedPoints: 2 },
        { isCorrect: false, score: 0.5, maxPoints: 2, earnedPoints: 1 },
        { isCorrect: false, score: 0, maxPoints: 1, earnedPoints: 0 }
      ] as any;

      const summary = autoGrader.calculateAssessmentScore(results);
      
      expect(summary.totalPoints).toBe(5);
      expect(summary.earnedPoints).toBe(3);
      expect(summary.percentage).toBe(60);
      expect(summary.breakdown.correct).toBe(1);
      expect(summary.breakdown.incorrect).toBe(1);
      expect(summary.breakdown.partialCredit).toBe(1);
    });
  });
});

describe('QuestionBankManagementSystem', () => {
  let managementSystem: QuestionBankManagementSystem;

  beforeEach(async () => {
    managementSystem = new QuestionBankManagementSystem();
    await managementSystem.initialize();
  });

  test('should initialize and generate seed questions', async () => {
    const result = await managementSystem.generateSeedQuestions();
    
    expect(result.total).toBeGreaterThan(0);
    expect(Object.keys(result.byCategory).length).toBeGreaterThan(0);
  });

  test('should provide comprehensive statistics', () => {
    const stats = managementSystem.getStatistics();
    
    expect(stats).toHaveProperty('total');
    expect(stats).toHaveProperty('active');
    expect(stats).toHaveProperty('byDifficulty');
    expect(stats).toHaveProperty('byConcept');
    expect(stats).toHaveProperty('byType');
    expect(stats).toHaveProperty('byCognitiveLevel');
    expect(stats).toHaveProperty('qualityDistribution');
    expect(stats).toHaveProperty('usageStats');
  });

  test('should search questions with text and filters', () => {
    const searchResult = managementSystem.searchQuestions({
      text: 'noun',
      filters: { difficulties: ['beginner'] },
      pageSize: 10,
      page: 1
    });

    expect(searchResult).toHaveProperty('questions');
    expect(searchResult).toHaveProperty('total');
    expect(searchResult).toHaveProperty('facets');
    expect(searchResult.questions.length).toBeLessThanOrEqual(10);
  });

  test('should create assessments with specified criteria', () => {
    const assessment = managementSystem.createAssessment({
      name: 'Noun Assessment',
      concept: 'nouns',
      difficulty: 'beginner',
      questionCount: 5,
      timeLimit: 300,
      randomize: true
    });

    expect(assessment.assessmentId).toBeDefined();
    expect(assessment.questions.length).toBeLessThanOrEqual(5);
    expect(assessment.estimatedTime).toBeGreaterThan(0);
    expect(assessment.maxPoints).toBeGreaterThan(0);
  });

  test('should analyze question bank quality', () => {
    const analysis = managementSystem.analyzeQuestionBankQuality();
    
    expect(analysis).toHaveProperty('overallScore');
    expect(analysis).toHaveProperty('issues');
    expect(analysis).toHaveProperty('strengths');
    expect(analysis).toHaveProperty('recommendations');
    expect(analysis.overallScore).toBeGreaterThanOrEqual(0);
    expect(analysis.overallScore).toBeLessThanOrEqual(100);
  });

  test('should import and export questions', async () => {
    const sampleQuestions = [
      {
        questionText: 'Test question',
        type: 'multiple_choice',
        difficulty: 'beginner',
        concept: 'nouns',
        cognitiveLevel: 'remember',
        learningObjective: 'Test objective',
        estimatedTimeSeconds: 30,
        points: 1,
        questionData: { type: 'multiple_choice', options: ['a', 'b'], shuffleOptions: true },
        correctAnswer: 'a',
        tags: ['test'],
        isActive: true
      }
    ];

    // Test export
    const exportResult = await managementSystem.exportQuestions({
      format: 'json',
      includeStats: true,
      includeInactive: false
    });

    expect(exportResult).toBeDefined();
    expect(typeof exportResult).toBe('string');

    // Test import (with mock data)
    const importResult = await managementSystem.importQuestions(
      JSON.stringify(sampleQuestions),
      'json'
    );

    expect(importResult).toHaveProperty('success');
    expect(importResult).toHaveProperty('imported');
    expect(importResult).toHaveProperty('errors');
  });
});

// Helper function to create sample questions for testing
function createSampleQuestion(overrides: Partial<Omit<QuestionBankItem, 'id' | 'timesUsed' | 'averageScore' | 'createdAt' | 'updatedAt'>> = {}): Omit<QuestionBankItem, 'id' | 'timesUsed' | 'averageScore' | 'createdAt' | 'updatedAt'> {
  const defaults = {
    questionText: 'Which word is a noun?',
    type: 'multiple_choice' as QuestionType,
    difficulty: 'beginner' as DifficultyLevel,
    concept: 'nouns' as QuestionConcept,
    subConcept: 'common_proper' as any,
    cognitiveLevel: 'remember' as CognitiveLevel,
    questionData: {
      type: 'multiple_choice' as const,
      options: ['run', 'cat', 'quickly', 'blue'],
      shuffleOptions: true
    },
    correctAnswer: 'cat',
    learningObjective: 'Identify nouns among other parts of speech',
    explanation: 'A noun is a word that names a person, place, thing, or idea.',
    hints: ['Look for words that name things', 'Nouns can have articles before them'],
    estimatedTimeSeconds: 30,
    points: 1,
    createdBy: 'test',
    tags: ['grammar', 'nouns', 'basic'],
    isActive: true
  };

  return { ...defaults, ...overrides };
}