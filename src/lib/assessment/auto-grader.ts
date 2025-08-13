/**
 * Auto-Grading Validation System
 * 
 * Provides automatic grading for different question types with
 * intelligent validation, partial credit, and detailed feedback.
 */

import { z } from 'zod';
import type { QuestionType, QuestionData, CorrectAnswer } from '@/types/content';
import type { QuestionBankItem } from './question-bank';

// ===== TYPES =====

export interface GradingResult {
  isCorrect: boolean;
  score: number; // 0-1 (percentage)
  maxPoints: number;
  earnedPoints: number;
  feedback: string;
  partialCredit?: {
    component: string;
    score: number;
    feedback: string;
  }[];
  mistakes?: {
    type: string;
    description: string;
    suggestion: string;
  }[];
  timeBonus?: number;
}

export interface StudentResponse {
  questionId: string;
  response: any; // Type varies by question type
  timeSpent: number; // seconds
  hintsUsed: number;
  attemptNumber: number;
}

export interface GradingOptions {
  allowPartialCredit: boolean;
  caseSensitive: boolean;
  timeLimit?: number;
  penalizeHints: boolean;
  customFeedback?: Record<string, string>;
}

// ===== AUTO-GRADER CLASS =====

export class AutoGrader {
  private defaultOptions: GradingOptions = {
    allowPartialCredit: true,
    caseSensitive: false,
    penalizeHints: true,
    customFeedback: {}
  };

  /**
   * Grade a student response to a question
   */
  gradeResponse(
    question: QuestionBankItem,
    response: StudentResponse,
    options: Partial<GradingOptions> = {}
  ): GradingResult {
    const gradeOptions = { ...this.defaultOptions, ...options };

    switch (question.type) {
      case 'multiple_choice':
        return this.gradeMultipleChoice(question, response, gradeOptions);
      case 'fill_in_blank':
        return this.gradeFillInBlank(question, response, gradeOptions);
      case 'drag_and_drop':
        return this.gradeDragAndDrop(question, response, gradeOptions);
      case 'sentence_builder':
        return this.gradeSentenceBuilder(question, response, gradeOptions);
      case 'essay':
        return this.gradeEssay(question, response, gradeOptions);
      default:
        return this.createErrorResult(question, "Unsupported question type");
    }
  }

  /**
   * Batch grade multiple responses
   */
  batchGrade(
    questions: QuestionBankItem[],
    responses: StudentResponse[],
    options: Partial<GradingOptions> = {}
  ): GradingResult[] {
    const responseMap = new Map(responses.map(r => [r.questionId, r]));
    
    return questions.map(question => {
      const response = responseMap.get(question.id);
      if (!response) {
        return this.createErrorResult(question, "No response found");
      }
      return this.gradeResponse(question, response, options);
    });
  }

  /**
   * Calculate overall assessment score
   */
  calculateAssessmentScore(gradingResults: GradingResult[]): {
    totalPoints: number;
    earnedPoints: number;
    percentage: number;
    passingScore: boolean;
    breakdown: {
      correct: number;
      incorrect: number;
      partialCredit: number;
    };
  } {
    const totalPoints = gradingResults.reduce((sum, result) => sum + result.maxPoints, 0);
    const earnedPoints = gradingResults.reduce((sum, result) => sum + result.earnedPoints, 0);
    const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;

    const breakdown = {
      correct: gradingResults.filter(r => r.isCorrect).length,
      incorrect: gradingResults.filter(r => !r.isCorrect && r.score === 0).length,
      partialCredit: gradingResults.filter(r => !r.isCorrect && r.score > 0).length
    };

    return {
      totalPoints,
      earnedPoints,
      percentage,
      passingScore: percentage >= 80, // 80% mastery threshold
      breakdown
    };
  }

  // ===== QUESTION TYPE SPECIFIC GRADERS =====

  private gradeMultipleChoice(
    question: QuestionBankItem,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const questionData = question.questionData as any;
    const studentAnswer = response.response;
    const correctAnswer = question.correctAnswer;

    // Validate response format
    if (typeof studentAnswer !== 'string') {
      return this.createErrorResult(question, "Invalid response format");
    }

    // Check if answer is correct
    const isCorrect = this.compareAnswers(studentAnswer, correctAnswer, options.caseSensitive);
    const baseScore = isCorrect ? 1 : 0;

    // Calculate final score with penalties
    let finalScore = baseScore;
    let feedback = isCorrect ? "Correct!" : "Incorrect.";

    // Apply hint penalty
    if (options.penalizeHints && response.hintsUsed > 0) {
      const hintPenalty = response.hintsUsed * 0.1; // 10% penalty per hint
      finalScore = Math.max(0, finalScore - hintPenalty);
      if (isCorrect && hintPenalty > 0) {
        feedback += ` (${response.hintsUsed} hint${response.hintsUsed > 1 ? 's' : ''} used)`;
      }
    }

    // Add explanation for incorrect answers
    if (!isCorrect && question.explanation) {
      feedback += ` ${question.explanation}`;
    }

    // Time bonus for quick correct answers
    let timeBonus = 0;
    if (isCorrect && question.estimatedTimeSeconds && response.timeSpent < question.estimatedTimeSeconds * 0.75) {
      timeBonus = 0.1; // 10% bonus for speed
      finalScore = Math.min(1, finalScore + timeBonus);
      feedback += " Great job answering quickly!";
    }

    return {
      isCorrect,
      score: finalScore,
      maxPoints: question.points,
      earnedPoints: finalScore * question.points,
      feedback,
      timeBonus,
      mistakes: isCorrect ? undefined : this.analyzeMistakes(question, studentAnswer)
    };
  }

  private gradeFillInBlank(
    question: QuestionBankItem,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const questionData = question.questionData as any;
    const studentAnswers = Array.isArray(response.response) ? response.response : [response.response];
    const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];

    if (questionData.type === 'fill_in_blank' && questionData.blanks) {
      return this.gradeMultipleBlanks(question, studentAnswers, correctAnswers, options);
    }

    // Single blank
    const studentAnswer = String(studentAnswers[0] || '').trim();
    const correctAnswer = String(correctAnswers[0] || '');

    const isCorrect = this.compareAnswers(studentAnswer, correctAnswer, options.caseSensitive);
    let score = isCorrect ? 1 : 0;

    // Check for partial credit with fuzzy matching
    if (!isCorrect && options.allowPartialCredit) {
      const similarity = this.calculateStringSimilarity(studentAnswer, correctAnswer);
      if (similarity > 0.7) {
        score = 0.5; // Half credit for close answers
      }
    }

    let feedback = isCorrect ? "Correct!" : `Incorrect. The correct answer is "${correctAnswer}".`;
    
    if (score === 0.5) {
      feedback = `Close! The correct answer is "${correctAnswer}".`;
    }

    return {
      isCorrect,
      score,
      maxPoints: question.points,
      earnedPoints: score * question.points,
      feedback,
      mistakes: isCorrect ? undefined : [{
        type: 'spelling_grammar',
        description: `Expected "${correctAnswer}" but got "${studentAnswer}"`,
        suggestion: `Check your spelling and grammar`
      }]
    };
  }

  private gradeMultipleBlanks(
    question: QuestionBankItem,
    studentAnswers: string[],
    correctAnswers: string[],
    options: GradingOptions
  ): GradingResult {
    let totalBlanks = correctAnswers.length;
    let correctBlanks = 0;
    const partialCredit = [];

    for (let i = 0; i < totalBlanks; i++) {
      const studentAnswer = String(studentAnswers[i] || '').trim();
      const correctAnswer = String(correctAnswers[i] || '');
      
      if (this.compareAnswers(studentAnswer, correctAnswer, options.caseSensitive)) {
        correctBlanks++;
        partialCredit.push({
          component: `Blank ${i + 1}`,
          score: 1,
          feedback: "Correct"
        });
      } else {
        partialCredit.push({
          component: `Blank ${i + 1}`,
          score: 0,
          feedback: `Incorrect. Expected "${correctAnswer}"`
        });
      }
    }

    const score = correctBlanks / totalBlanks;
    const isCorrect = score === 1;

    return {
      isCorrect,
      score,
      maxPoints: question.points,
      earnedPoints: score * question.points,
      feedback: `${correctBlanks}/${totalBlanks} blanks correct`,
      partialCredit
    };
  }

  private gradeDragAndDrop(
    question: QuestionBankItem,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const studentMapping = response.response as Record<string, string>;
    const correctMapping = question.correctAnswer as Record<string, string>;

    if (!studentMapping || typeof studentMapping !== 'object') {
      return this.createErrorResult(question, "Invalid drag and drop response");
    }

    let totalItems = Object.keys(correctMapping).length;
    let correctItems = 0;
    const partialCredit = [];

    for (const [item, correctCategory] of Object.entries(correctMapping)) {
      const studentCategory = studentMapping[item];
      const isItemCorrect = studentCategory === correctCategory;
      
      if (isItemCorrect) {
        correctItems++;
      }

      partialCredit.push({
        component: item,
        score: isItemCorrect ? 1 : 0,
        feedback: isItemCorrect ? "Correct" : `Should be in "${correctCategory}"`
      });
    }

    const score = correctItems / totalItems;
    const isCorrect = score === 1;

    return {
      isCorrect,
      score,
      maxPoints: question.points,
      earnedPoints: score * question.points,
      feedback: `${correctItems}/${totalItems} items placed correctly`,
      partialCredit: options.allowPartialCredit ? partialCredit : undefined
    };
  }

  private gradeSentenceBuilder(
    question: QuestionBankItem,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const studentSentence = String(response.response || '').trim();
    const correctSentence = String(question.correctAnswer || '');

    // For sentence building, we need more sophisticated checking
    const isCorrect = this.validateSentenceStructure(studentSentence, correctSentence, question);
    
    let score = isCorrect ? 1 : 0;
    let feedback = isCorrect ? "Excellent sentence!" : "The sentence structure needs improvement.";

    // Check for partial credit based on components
    if (!isCorrect && options.allowPartialCredit) {
      const components = this.analyzeSentenceComponents(studentSentence, question);
      if (components.score > 0) {
        score = components.score;
        feedback = components.feedback;
      }
    }

    return {
      isCorrect,
      score,
      maxPoints: question.points,
      earnedPoints: score * question.points,
      feedback,
      mistakes: isCorrect ? undefined : this.analyzeSentenceMistakes(studentSentence, question)
    };
  }

  private gradeEssay(
    question: QuestionBankItem,
    response: StudentResponse,
    options: GradingOptions
  ): GradingResult {
    const studentEssay = String(response.response || '').trim();
    
    // For now, essays require manual grading
    // This is a placeholder implementation
    return {
      isCorrect: false,
      score: 0,
      maxPoints: question.points,
      earnedPoints: 0,
      feedback: "Essay requires manual grading by instructor.",
      mistakes: [{
        type: 'manual_review',
        description: 'Essay responses need human evaluation',
        suggestion: 'Your essay will be reviewed by your instructor'
      }]
    };
  }

  // ===== HELPER METHODS =====

  private compareAnswers(student: any, correct: any, caseSensitive: boolean): boolean {
    const studentStr = String(student).trim();
    const correctStr = String(correct).trim();

    if (caseSensitive) {
      return studentStr === correctStr;
    } else {
      return studentStr.toLowerCase() === correctStr.toLowerCase();
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance implementation
    const matrix = [];
    const len1 = str1.length;
    const len2 = str2.length;

    for (let i = 0; i <= len2; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= len1; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= len2; i++) {
      for (let j = 1; j <= len1; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    const maxLen = Math.max(len1, len2);
    return (maxLen - matrix[len2][len1]) / maxLen;
  }

  private analyzeMistakes(question: QuestionBankItem, studentAnswer: string): any[] {
    // This would analyze common mistakes based on the question type and student answer
    // For now, return a simple mistake analysis
    return [{
      type: 'incorrect_choice',
      description: `Selected "${studentAnswer}" instead of correct answer`,
      suggestion: 'Review the concept and try again'
    }];
  }

  private validateSentenceStructure(studentSentence: string, correctSentence: string, question: QuestionBankItem): boolean {
    // This would implement sophisticated sentence structure validation
    // For now, simple string comparison
    return this.compareAnswers(studentSentence, correctSentence, false);
  }

  private analyzeSentenceComponents(studentSentence: string, question: QuestionBankItem): { score: number; feedback: string } {
    // This would analyze sentence components (subject, predicate, etc.)
    // For now, return placeholder
    return {
      score: 0.5,
      feedback: "Partial credit for sentence attempt"
    };
  }

  private analyzeSentenceMistakes(studentSentence: string, question: QuestionBankItem): any[] {
    return [{
      type: 'sentence_structure',
      description: 'Sentence structure does not match requirements',
      suggestion: 'Check that your sentence has all required components'
    }];
  }

  private createErrorResult(question: QuestionBankItem, errorMessage: string): GradingResult {
    return {
      isCorrect: false,
      score: 0,
      maxPoints: question.points,
      earnedPoints: 0,
      feedback: errorMessage,
      mistakes: [{
        type: 'system_error',
        description: errorMessage,
        suggestion: 'Please contact your instructor'
      }]
    };
  }
}

// ===== GRADING UTILITIES =====

export class GradingAnalytics {
  /**
   * Analyze grading patterns to identify problematic questions
   */
  static analyzeQuestionPerformance(gradingResults: Array<{ questionId: string; result: GradingResult }>): {
    questionId: string;
    averageScore: number;
    successRate: number;
    commonMistakes: string[];
    difficulty: 'too_easy' | 'appropriate' | 'too_hard';
    recommendation: string;
  }[] {
    const questionMap = new Map<string, GradingResult[]>();
    
    // Group results by question
    for (const { questionId, result } of gradingResults) {
      if (!questionMap.has(questionId)) {
        questionMap.set(questionId, []);
      }
      questionMap.get(questionId)!.push(result);
    }

    // Analyze each question
    return Array.from(questionMap.entries()).map(([questionId, results]) => {
      const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      const successRate = results.filter(r => r.isCorrect).length / results.length;
      
      let difficulty: 'too_easy' | 'appropriate' | 'too_hard';
      let recommendation: string;

      if (successRate > 0.9) {
        difficulty = 'too_easy';
        recommendation = 'Consider increasing difficulty or replacing with more challenging question';
      } else if (successRate < 0.3) {
        difficulty = 'too_hard';
        recommendation = 'Consider reducing difficulty or providing additional instruction';
      } else {
        difficulty = 'appropriate';
        recommendation = 'Question difficulty is appropriate';
      }

      // Extract common mistakes
      const mistakes = results
        .flatMap(r => r.mistakes || [])
        .map(m => m.description);
      const commonMistakes = [...new Set(mistakes)];

      return {
        questionId,
        averageScore,
        successRate,
        commonMistakes,
        difficulty,
        recommendation
      };
    });
  }

  /**
   * Generate detailed feedback for students
   */
  static generateStudentFeedback(results: GradingResult[], studentLevel: 'beginner' | 'intermediate' | 'advanced'): {
    overallFeedback: string;
    strengths: string[];
    areasForImprovement: string[];
    recommendedActions: string[];
  } {
    const totalQuestions = results.length;
    const correctAnswers = results.filter(r => r.isCorrect).length;
    const percentage = (correctAnswers / totalQuestions) * 100;

    let overallFeedback: string;
    if (percentage >= 90) {
      overallFeedback = "Excellent work! You've mastered this material.";
    } else if (percentage >= 80) {
      overallFeedback = "Good job! You've reached the mastery threshold.";
    } else if (percentage >= 70) {
      overallFeedback = "You're making progress, but need more practice to reach mastery.";
    } else {
      overallFeedback = "This material needs more work. Don't worry - practice makes perfect!";
    }

    // Analyze patterns for strengths and improvements
    const mistakes = results.flatMap(r => r.mistakes || []);
    const mistakeTypes = mistakes.reduce((acc, mistake) => {
      acc[mistake.type] = (acc[mistake.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const strengths = [];
    const areasForImprovement = [];
    const recommendedActions = [];

    // Generate specific feedback based on performance patterns
    if (percentage >= 80) {
      strengths.push("You understand the core concepts well");
    }

    if (mistakeTypes['spelling_grammar']) {
      areasForImprovement.push("Spelling and grammar accuracy");
      recommendedActions.push("Practice spelling common words and review grammar rules");
    }

    if (mistakeTypes['sentence_structure']) {
      areasForImprovement.push("Sentence construction");
      recommendedActions.push("Practice building complete sentences with subjects and predicates");
    }

    return {
      overallFeedback,
      strengths,
      areasForImprovement,
      recommendedActions
    };
  }
}