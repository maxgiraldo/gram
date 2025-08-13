/**
 * Exercise Validation Logic
 * 
 * Handles validation of exercise responses for different question types,
 * scoring, feedback generation, and answer analysis.
 */

import type { 
  ExerciseQuestion,
  QuestionData,
  CorrectAnswer,
  MultipleChoiceData,
  FillInBlankData,
  DragAndDropData,
  SentenceBuilderData
} from '@/types/content';

// ===== VALIDATION RESULT TYPES =====

export interface ValidationResult {
  isCorrect: boolean;
  points: number;
  maxPoints: number;
  feedback: string;
  partialCredit?: number;
  errorDetails?: string[];
  explanation?: string;
}

export interface ValidationOptions {
  allowPartialCredit?: boolean;
  caseSensitive?: boolean;
  strictMatching?: boolean;
  provideFeedback?: boolean;
}

// ===== MAIN VALIDATION FUNCTION =====

/**
 * Validate exercise response based on question type
 */
export function validateExerciseResponse(
  question: ExerciseQuestion,
  userResponse: any,
  options: ValidationOptions = {}
): ValidationResult {
  const defaultOptions = {
    allowPartialCredit: true,
    caseSensitive: false,
    strictMatching: false,
    provideFeedback: true,
    ...options
  };

  try {
    // Parse question data and correct answer
    const questionData = typeof question.questionData === 'string' 
      ? JSON.parse(question.questionData) 
      : question.questionData;
    const correctAnswer = typeof question.correctAnswer === 'string'
      ? JSON.parse(question.correctAnswer)
      : question.correctAnswer;

    // Validate based on question type
    switch (question.type) {
      case 'multiple_choice':
        return validateMultipleChoice(questionData, correctAnswer, userResponse, defaultOptions);
      
      case 'fill_in_blank':
        return validateFillInBlank(questionData, correctAnswer, userResponse, defaultOptions);
      
      case 'drag_and_drop':
        return validateDragAndDrop(questionData, correctAnswer, userResponse, defaultOptions);
      
      case 'sentence_builder':
        return validateSentenceBuilder(questionData, correctAnswer, userResponse, defaultOptions);
      
      default:
        throw new Error(`Unsupported question type: ${question.type}`);
    }
  } catch (error) {
    return {
      isCorrect: false,
      points: 0,
      maxPoints: question.points,
      feedback: 'An error occurred while validating your answer. Please try again.',
      errorDetails: [error instanceof Error ? error.message : 'Unknown error']
    };
  }
}

// ===== MULTIPLE CHOICE VALIDATION =====

function validateMultipleChoice(
  questionData: MultipleChoiceData,
  correctAnswer: string | string[],
  userResponse: string | string[],
  options: ValidationOptions
): ValidationResult {
  const maxPoints = 1; // Multiple choice typically worth 1 point
  
  // Handle single or multiple correct answers
  const correctAnswers = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const userAnswers = Array.isArray(userResponse) ? userResponse : [userResponse];
  
  // Check if user response matches any correct answer
  const isCorrect = correctAnswers.some(correct => 
    userAnswers.some(user => 
      options.caseSensitive ? user === correct : user.toLowerCase() === correct.toLowerCase()
    )
  );
  
  // Generate feedback
  let feedback = '';
  if (options.provideFeedback) {
    if (isCorrect) {
      feedback = 'Correct! Well done.';
    } else {
      feedback = 'That\'s not quite right. Try again!';
    }
  }
  
  return {
    isCorrect,
    points: isCorrect ? maxPoints : 0,
    maxPoints,
    feedback,
    explanation: isCorrect ? 'You selected the correct answer.' : 'The correct answer was different.'
  };
}

// ===== FILL IN THE BLANK VALIDATION =====

function validateFillInBlank(
  questionData: FillInBlankData,
  correctAnswer: any,
  userResponse: { [blankId: string]: string },
  options: ValidationOptions
): ValidationResult {
  const maxPoints = questionData.blanks.length;
  let correctBlanks = 0;
  const errorDetails: string[] = [];
  
  // Validate each blank
  for (const blank of questionData.blanks) {
    const userAnswer = userResponse[blank.id]?.trim() || '';
    const correctAnswers = blank.acceptableAnswers || [];
    
    // Check if user answer matches any acceptable answer
    const isBlankCorrect = correctAnswers.some(acceptable => {
      if (blank.caseSensitive === false || !options.caseSensitive) {
        return userAnswer.toLowerCase() === acceptable.toLowerCase();
      }
      return userAnswer === acceptable;
    });
    
    if (isBlankCorrect) {
      correctBlanks++;
    } else {
      errorDetails.push(`Blank ${blank.position}: Expected one of [${correctAnswers.join(', ')}], got "${userAnswer}"`);
    }
  }
  
  const isFullyCorrect = correctBlanks === maxPoints;
  const partialCredit = options.allowPartialCredit ? correctBlanks / maxPoints : 0;
  const points = isFullyCorrect ? maxPoints : (options.allowPartialCredit ? partialCredit * maxPoints : 0);
  
  // Generate feedback
  let feedback = '';
  if (options.provideFeedback) {
    if (isFullyCorrect) {
      feedback = 'Perfect! All blanks are correct.';
    } else if (correctBlanks > 0 && options.allowPartialCredit) {
      feedback = `Good progress! You got ${correctBlanks} out of ${maxPoints} blanks correct.`;
    } else {
      feedback = 'Some answers need correction. Check your spelling and try again.';
    }
  }
  
  return {
    isCorrect: isFullyCorrect,
    points: Math.round(points * 100) / 100, // Round to 2 decimal places
    maxPoints,
    feedback,
    partialCredit: options.allowPartialCredit ? partialCredit : undefined,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    explanation: `You correctly filled in ${correctBlanks} out of ${maxPoints} blanks.`
  };
}

// ===== DRAG AND DROP VALIDATION =====

function validateDragAndDrop(
  questionData: DragAndDropData,
  correctAnswer: { [targetId: string]: string | string[] },
  userResponse: { [targetId: string]: string[] },
  options: ValidationOptions
): ValidationResult {
  const maxPoints = questionData.items.length;
  let correctPlacements = 0;
  const errorDetails: string[] = [];
  
  // Validate each target zone
  for (const target of questionData.targets) {
    const correctItems = Array.isArray(correctAnswer[target.id]) 
      ? correctAnswer[target.id] as string[]
      : [correctAnswer[target.id] as string];
    const userItems = userResponse[target.id] || [];
    
    // Check if user placed items correctly in this target
    const correctlyPlaced = userItems.filter(userItem => 
      correctItems.some(correctItem => userItem === correctItem)
    );
    
    correctPlacements += correctlyPlaced.length;
    
    // Track errors
    const incorrectlyPlaced = userItems.filter(userItem => 
      !correctItems.some(correctItem => userItem === correctItem)
    );
    
    if (incorrectlyPlaced.length > 0) {
      errorDetails.push(`Target "${target.label}": Incorrectly placed items: ${incorrectlyPlaced.join(', ')}`);
    }
    
    const missing = correctItems.filter(correctItem => 
      !userItems.some(userItem => userItem === correctItem)
    );
    
    if (missing.length > 0) {
      errorDetails.push(`Target "${target.label}": Missing items: ${missing.join(', ')}`);
    }
  }
  
  const isFullyCorrect = correctPlacements === maxPoints && errorDetails.length === 0;
  const partialCredit = options.allowPartialCredit ? correctPlacements / maxPoints : 0;
  const points = isFullyCorrect ? maxPoints : (options.allowPartialCredit ? partialCredit * maxPoints : 0);
  
  // Generate feedback
  let feedback = '';
  if (options.provideFeedback) {
    if (isFullyCorrect) {
      feedback = 'Excellent! All items are placed correctly.';
    } else if (correctPlacements > 0 && options.allowPartialCredit) {
      feedback = `Good work! You placed ${correctPlacements} out of ${maxPoints} items correctly.`;
    } else {
      feedback = 'Some items are in the wrong places. Try moving them around.';
    }
  }
  
  return {
    isCorrect: isFullyCorrect,
    points: Math.round(points * 100) / 100,
    maxPoints,
    feedback,
    partialCredit: options.allowPartialCredit ? partialCredit : undefined,
    errorDetails: errorDetails.length > 0 ? errorDetails : undefined,
    explanation: `You correctly placed ${correctPlacements} out of ${maxPoints} items.`
  };
}

// ===== SENTENCE BUILDER VALIDATION =====

function validateSentenceBuilder(
  questionData: SentenceBuilderData,
  correctAnswer: string | string[],
  userResponse: string[],
  options: ValidationOptions
): ValidationResult {
  const maxPoints = 1; // Sentence building typically worth 1 point
  
  // Handle multiple correct sentence structures
  const correctSentences = Array.isArray(correctAnswer) ? correctAnswer : [correctAnswer];
  const userSentence = userResponse.join(' ').toLowerCase().trim();
  
  // Check if user sentence matches any correct structure
  let isCorrect = false;
  let bestMatch = '';
  
  for (const correct of correctSentences) {
    const normalizedCorrect = correct.toLowerCase().trim();
    
    if (options.strictMatching) {
      // Exact word order required
      if (userSentence === normalizedCorrect) {
        isCorrect = true;
        bestMatch = correct;
        break;
      }
    } else {
      // Allow some flexibility in word order for grammatically correct sentences
      const userWords = userSentence.split(/\s+/).sort();
      const correctWords = normalizedCorrect.split(/\s+/).sort();
      
      if (JSON.stringify(userWords) === JSON.stringify(correctWords)) {
        isCorrect = true;
        bestMatch = correct;
        break;
      }
    }
  }
  
  // Calculate partial credit based on word overlap
  let partialCredit = 0;
  if (!isCorrect && options.allowPartialCredit) {
    const userWords = new Set(userSentence.split(/\s+/));
    const correctWords = new Set(correctSentences[0].toLowerCase().split(/\s+/));
    const intersection = new Set([...userWords].filter(word => correctWords.has(word)));
    partialCredit = intersection.size / correctWords.size;
  }
  
  const points = isCorrect ? maxPoints : (options.allowPartialCredit ? partialCredit * maxPoints : 0);
  
  // Generate feedback
  let feedback = '';
  if (options.provideFeedback) {
    if (isCorrect) {
      feedback = 'Perfect sentence! Great job with word order and grammar.';
    } else if (partialCredit > 0.5 && options.allowPartialCredit) {
      feedback = 'You\'re on the right track! Check the word order and try again.';
    } else {
      feedback = 'This sentence needs some work. Think about the correct word order.';
    }
  }
  
  return {
    isCorrect,
    points: Math.round(points * 100) / 100,
    maxPoints,
    feedback,
    partialCredit: options.allowPartialCredit ? partialCredit : undefined,
    explanation: isCorrect 
      ? `Your sentence matches the expected structure: "${bestMatch}"`
      : `Expected something like: "${correctSentences[0]}"`
  };
}

// ===== UTILITY FUNCTIONS =====

/**
 * Normalize text for comparison (remove extra spaces, punctuation, etc.)
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' '); // Normalize spaces
}

/**
 * Calculate similarity between two strings (0-1 scale)
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);
  
  if (normalized1 === normalized2) return 1;
  
  // Use simple word overlap for similarity
  const words1 = new Set(normalized1.split(' '));
  const words2 = new Set(normalized2.split(' '));
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Generate hints based on user response and correct answer
 */
export function generateHint(
  question: ExerciseQuestion,
  userResponse: any,
  hintLevel: number = 1
): string {
  // Use predefined hints if available
  if (question.hints) {
    const hints = typeof question.hints === 'string' ? JSON.parse(question.hints) : question.hints;
    if (hints[hintLevel - 1]) {
      return hints[hintLevel - 1];
    }
  }
  
  // Generate generic hints based on question type
  switch (question.type) {
    case 'multiple_choice':
      return 'Look carefully at each option and think about what you learned in the lesson.';
    
    case 'fill_in_blank':
      return 'Think about the grammar rules we covered. Check your spelling carefully.';
    
    case 'drag_and_drop':
      return 'Consider which category each item belongs to. Some items might fit in multiple places.';
    
    case 'sentence_builder':
      return 'Think about the correct word order. Start with the subject, then the verb.';
    
    default:
      return 'Take your time and think about what you learned in this lesson.';
  }
}

/**
 * Determine if user needs remediation based on performance
 */
export function needsRemediation(responses: ValidationResult[]): boolean {
  if (responses.length === 0) return false;
  
  const totalCorrect = responses.filter(r => r.isCorrect).length;
  const accuracy = totalCorrect / responses.length;
  
  return accuracy < 0.6; // Less than 60% accuracy suggests need for remediation
}

/**
 * Determine if user is eligible for enrichment based on performance
 */
export function isEligibleForEnrichment(responses: ValidationResult[]): boolean {
  if (responses.length === 0) return false;
  
  const totalCorrect = responses.filter(r => r.isCorrect).length;
  const accuracy = totalCorrect / responses.length;
  
  return accuracy >= 0.9; // 90% or higher accuracy suggests readiness for enrichment
}