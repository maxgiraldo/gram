/**
 * Feedback Engine
 *
 * Real-time feedback generation system with adaptive hint delivery,
 * progressive hint revealing, and intelligent feedback generation.
 */

import type { ExerciseQuestion } from "../../types/content";

// ===== TYPES AND INTERFACES =====

export interface FeedbackContext {
  question: ExerciseQuestion;
  userAnswer: string | string[] | Record<string, string>;
  correctAnswer: string | string[] | Record<string, string>;
  attemptNumber: number;
  hintsUsed: number;
  timeSpent: number;
  previousAttempts?: string[];
  userProfile?: UserLearningProfile;
}

export interface UserLearningProfile {
  userId: string;
  strengthAreas: string[];
  weaknessAreas: string[];
  preferredHintStyle: "detailed" | "minimal" | "visual";
  averageResponseTime: number;
  successRate: number;
  commonMistakes: ErrorPattern[];
}

export interface ErrorPattern {
  type: string;
  frequency: number;
  lastOccurrence: Date;
  remedialSuggestion?: string;
}

export interface GeneratedFeedback {
  type: "correct" | "incorrect" | "partial" | "hint" | "explanation";
  title: string;
  message: string;
  details?: string;
  encouragement?: string;
  nextSteps?: string;
  visualAid?: string;
  relatedConcepts?: string[];
  severity?: "minor" | "moderate" | "major";
  confidence?: number;
}

export interface HintSequence {
  hints: HintData[];
  currentIndex: number;
  maxHints: number;
  adaptiveMode: boolean;
}

export interface HintData {
  level: number;
  content: string;
  type: "text" | "visual" | "example" | "structural";
  revealPercentage: number;
  prerequisiteHints?: number[];
  category?: string;
}

export interface FeedbackOptions {
  enableAdaptive?: boolean;
  enableEncouragement?: boolean;
  enableVisualAids?: boolean;
  enableRelatedConcepts?: boolean;
  maxFeedbackLength?: number;
  language?: string;
  tone?: "formal" | "casual" | "encouraging";
}

// ===== FEEDBACK GENERATION =====

/**
 * Generate intelligent feedback based on context
 */
export function generateFeedback(
  context: FeedbackContext,
  options: FeedbackOptions = {}
): GeneratedFeedback {
  const {
    enableAdaptive = true,
    enableEncouragement = true,
    tone = "encouraging",
  } = options;

  // Analyze the answer
  const analysis = analyzeAnswer(context);

  // Determine feedback type
  const feedbackType = determineFeedbackType(analysis);

  // Generate base feedback
  const baseFeedback = generateBaseFeedback(feedbackType, context, analysis);

  // Enhance with adaptive elements if enabled
  const enhancedFeedback = enableAdaptive
    ? enhanceWithAdaptiveElements(baseFeedback, context, analysis)
    : baseFeedback;

  // Add encouragement if enabled
  if (enableEncouragement && feedbackType !== "correct") {
    enhancedFeedback.encouragement = generateEncouragement(
      context.attemptNumber,
      analysis.errorSeverity,
      tone
    );
  }

  // Add next steps
  enhancedFeedback.nextSteps = generateNextSteps(
    feedbackType,
    analysis,
    context
  );

  return enhancedFeedback;
}

/**
 * Analyze user's answer for patterns and errors
 */
function analyzeAnswer(context: FeedbackContext): AnswerAnalysis {
  const { question, userAnswer, correctAnswer } = context;

  const analysis: AnswerAnalysis = {
    isCorrect: false,
    partialCredit: 0,
    errorType: null,
    errorSeverity: "minor",
    commonMistake: false,
    specificIssues: [],
    strengths: [],
  };

  // Type-specific analysis
  switch (question.type) {
    case "multiple_choice":
      return analyzeMultipleChoice(
        userAnswer as string,
        correctAnswer as string,
        analysis
      );

    case "fill_in_blank":
      return analyzeFillInBlank(
        userAnswer as string[],
        correctAnswer as string[],
        analysis
      );

    case "drag_and_drop":
      return analyzeDragAndDrop(
        userAnswer as Record<string, string>,
        correctAnswer as Record<string, string>,
        analysis
      );

    case "sentence_builder":
      return analyzeSentenceBuilder(
        userAnswer as string[],
        correctAnswer as string[],
        analysis
      );

    default:
      return analysis;
  }
}

interface AnswerAnalysis {
  isCorrect: boolean;
  partialCredit: number;
  errorType: string | null;
  errorSeverity: "minor" | "moderate" | "major";
  commonMistake: boolean;
  specificIssues: string[];
  strengths: string[];
}

/**
 * Analyze multiple choice answer
 */
function analyzeMultipleChoice(
  userAnswer: string,
  correctAnswer: string,
  analysis: AnswerAnalysis
): AnswerAnalysis {
  analysis.isCorrect = userAnswer === correctAnswer;

  if (!analysis.isCorrect) {
    // Check for common distractors
    const commonDistracters = getCommonDistracters(correctAnswer);
    if (commonDistracters.includes(userAnswer)) {
      analysis.commonMistake = true;
      analysis.errorType = "common_misconception";
      analysis.specificIssues.push("This is a common misconception");
    }
  }

  return analysis;
}

/**
 * Analyze fill in the blank answer
 */
function analyzeFillInBlank(
  userAnswers: string[],
  correctAnswers: string[],
  analysis: AnswerAnalysis
): AnswerAnalysis {
  let correctCount = 0;

  userAnswers.forEach((answer, index) => {
    const normalized = normalizeText(answer);
    const correct = normalizeText(correctAnswers[index]);

    if (normalized === correct) {
      correctCount++;
      analysis.strengths.push(`Blank ${index + 1} is correct`);
    } else {
      // Check for spelling mistakes
      if (isSpellingMistake(normalized, correct)) {
        analysis.specificIssues.push(`Blank ${index + 1}: Spelling error`);
        analysis.errorType = "spelling";
        analysis.errorSeverity = "minor";
        correctCount += 0.5; // Partial credit for spelling
      }
      // Check for grammatical variations
      else if (isGrammaticalVariation(normalized, correct)) {
        analysis.specificIssues.push(
          `Blank ${index + 1}: Grammatical variation`
        );
        analysis.errorType = "grammar";
        correctCount += 0.7; // Partial credit for grammar
      }
      // Completely wrong
      else {
        analysis.specificIssues.push(`Blank ${index + 1}: Incorrect`);
        analysis.errorType = "incorrect";
        analysis.errorSeverity = "major";
      }
    }
  });

  analysis.partialCredit = correctCount / correctAnswers.length;
  analysis.isCorrect = analysis.partialCredit === 1;

  return analysis;
}

/**
 * Analyze drag and drop answer
 */
function analyzeDragAndDrop(
  userMapping: Record<string, string>,
  correctMapping: Record<string, string>,
  analysis: AnswerAnalysis
): AnswerAnalysis {
  const items = Object.keys(correctMapping);
  let correctCount = 0;

  items.forEach((item) => {
    if (userMapping[item] === correctMapping[item]) {
      correctCount++;
      analysis.strengths.push(`"${item}" correctly placed`);
    } else {
      analysis.specificIssues.push(
        `"${item}" should be in "${correctMapping[item]}", not "${userMapping[item]}"`
      );
    }
  });

  analysis.partialCredit = correctCount / items.length;
  analysis.isCorrect = analysis.partialCredit === 1;

  if (!analysis.isCorrect) {
    analysis.errorType = "misplacement";
    analysis.errorSeverity =
      analysis.partialCredit > 0.5 ? "minor" : "moderate";
  }

  return analysis;
}

/**
 * Analyze sentence builder answer
 */
function analyzeSentenceBuilder(
  userOrder: string[],
  correctOrder: string[],
  analysis: AnswerAnalysis
): AnswerAnalysis {
  const userSentence = userOrder.join(" ");
  const correctSentence = correctOrder.join(" ");

  if (userSentence === correctSentence) {
    analysis.isCorrect = true;
    return analysis;
  }

  // Check for transposition errors
  const transpositions = findTranspositions(userOrder, correctOrder);
  if (transpositions.length > 0) {
    analysis.errorType = "word_order";
    analysis.errorSeverity = transpositions.length <= 2 ? "minor" : "moderate";
    analysis.specificIssues.push(
      `Word order issues: ${transpositions.length} transpositions`
    );
    analysis.partialCredit = 1 - transpositions.length / correctOrder.length;
  }

  // Check for grammatical validity even if different
  if (isGrammaticallyValid(userSentence)) {
    analysis.strengths.push("Sentence is grammatically valid");
    analysis.partialCredit = Math.max(analysis.partialCredit, 0.7);
  }

  return analysis;
}

/**
 * Determine feedback type based on analysis
 */
function determineFeedbackType(
  analysis: AnswerAnalysis
): GeneratedFeedback["type"] {
  if (analysis.isCorrect) {
    return "correct";
  } else if (analysis.partialCredit > 0.5) {
    return "partial";
  } else {
    return "incorrect";
  }
}

/**
 * Generate base feedback
 */
function generateBaseFeedback(
  type: GeneratedFeedback["type"],
  context: FeedbackContext,
  analysis: AnswerAnalysis
): GeneratedFeedback {
  const feedback: GeneratedFeedback = {
    type,
    title: "",
    message: "",
    confidence: 1.0,
  };

  switch (type) {
    case "correct":
      feedback.title = getCorrectTitle(
        context.hintsUsed,
        context.attemptNumber
      );
      feedback.message = "Well done! You got it right.";
      if (analysis.strengths.length > 0) {
        feedback.details = `Strengths: ${analysis.strengths.join(", ")}`;
      }
      break;

    case "partial":
      feedback.title = "Almost there!";
      feedback.message = `You got ${Math.round(
        analysis.partialCredit * 100
      )}% correct.`;
      feedback.details = formatPartialFeedback(analysis);
      break;

    case "incorrect":
      feedback.title = "Not quite right";
      feedback.message = getIncorrectMessage(analysis, context.attemptNumber);
      if (analysis.specificIssues.length > 0) {
        feedback.details = `Issues: ${analysis.specificIssues.join("; ")}`;
      }
      break;
  }

  return feedback;
}

/**
 * Enhance feedback with adaptive elements
 */
function enhanceWithAdaptiveElements(
  feedback: GeneratedFeedback,
  context: FeedbackContext,
  analysis: AnswerAnalysis
): GeneratedFeedback {
  // Add related concepts based on error type
  if (analysis.errorType) {
    feedback.relatedConcepts = getRelatedConcepts(
      analysis.errorType,
      context.question
    );
  }

  // Adjust message based on user profile if available
  if (context.userProfile) {
    feedback.message = personalizeMessage(
      feedback.message,
      context.userProfile,
      analysis
    );
  }

  // Add visual aids for complex errors
  if (analysis.errorSeverity === "major" || context.attemptNumber > 2) {
    feedback.visualAid = generateVisualAid(context.question, analysis);
  }

  return feedback;
}

// ===== HINT GENERATION =====

/**
 * Generate adaptive hint sequence
 */
export function generateHintSequence(
  question: ExerciseQuestion,
  options: FeedbackOptions = {}
): HintSequence {
  const hints = generateHintsForQuestion(question);

  return {
    hints,
    currentIndex: -1,
    maxHints: Math.min(hints.length, 3),
    adaptiveMode: options.enableAdaptive ?? true,
  };
}

/**
 * Get next hint in sequence
 */
export function getNextHint(
  sequence: HintSequence,
  context?: FeedbackContext
): HintData | null {
  if (sequence.currentIndex >= sequence.maxHints - 1) {
    return null;
  }

  sequence.currentIndex++;

  if (sequence.adaptiveMode && context) {
    // Select hint based on user's specific struggle
    return selectAdaptiveHint(sequence.hints, context, sequence.currentIndex);
  }

  return sequence.hints[sequence.currentIndex];
}

/**
 * Generate hints for a question
 */
function generateHintsForQuestion(question: ExerciseQuestion): HintData[] {
  const hints: HintData[] = [];

  // Add predefined hints if available
  if (question.hints && question.hints.length > 0) {
    question.hints.forEach((hint, index) => {
      hints.push({
        level: index,
        content: hint,
        type: "text",
        revealPercentage: (index + 1) * 33,
        category: "provided",
      });
    });
  }

  // Generate additional hints based on question type
  const generatedHints = generateTypeSpecificHints(question);
  hints.push(...generatedHints);

  // Sort by reveal percentage
  return hints.sort((a, b) => a.revealPercentage - b.revealPercentage);
}

/**
 * Generate type-specific hints
 */
function generateTypeSpecificHints(question: ExerciseQuestion): HintData[] {
  const hints: HintData[] = [];

  switch (question.type) {
    case "multiple_choice":
      hints.push({
        level: 1,
        content: "Consider eliminating obviously incorrect options first.",
        type: "text",
        revealPercentage: 20,
        category: "strategy",
      });
      break;

    case "fill_in_blank":
      hints.push({
        level: 1,
        content: "Look at the context around each blank for clues.",
        type: "text",
        revealPercentage: 20,
        category: "strategy",
      });
      hints.push({
        level: 2,
        content:
          "Check the grammatical form needed (verb tense, singular/plural, etc.).",
        type: "text",
        revealPercentage: 40,
        category: "grammar",
      });
      break;

    case "sentence_builder":
      hints.push({
        level: 1,
        content: "Start by identifying the subject and main verb.",
        type: "structural",
        revealPercentage: 25,
        category: "structure",
      });
      hints.push({
        level: 2,
        content: "Think about the typical word order in English sentences.",
        type: "text",
        revealPercentage: 50,
        category: "grammar",
      });
      break;

    case "drag_and_drop":
      hints.push({
        level: 1,
        content: "Group similar items together first.",
        type: "text",
        revealPercentage: 20,
        category: "strategy",
      });
      break;
  }

  return hints;
}

/**
 * Select adaptive hint based on context
 */
function selectAdaptiveHint(
  availableHints: HintData[],
  context: FeedbackContext,
  level: number
): HintData {
  // Filter hints appropriate for current level
  const levelHints = availableHints.filter((h) => h.level <= level);

  // If user has specific error pattern, prioritize relevant hints
  if (context.userProfile?.commonMistakes.length > 0) {
    const relevantHints = levelHints.filter((hint) => {
      return context.userProfile!.commonMistakes.some(
        (mistake) => hint.category === mistake.type
      );
    });

    if (relevantHints.length > 0) {
      return relevantHints[0];
    }
  }

  // Return the most appropriate hint for the level
  return levelHints[levelHints.length - 1] || availableHints[0];
}

// ===== UTILITY FUNCTIONS =====

/**
 * Get correct feedback title based on context
 */
function getCorrectTitle(hintsUsed: number, attemptNumber: number): string {
  if (hintsUsed === 0 && attemptNumber === 1) {
    return "Perfect!";
  } else if (hintsUsed === 0) {
    return "Excellent!";
  } else if (hintsUsed === 1) {
    return "Good job!";
  } else {
    return "Correct!";
  }
}

/**
 * Get incorrect feedback message
 */
function getIncorrectMessage(
  analysis: AnswerAnalysis,
  attemptNumber: number
): string {
  if (analysis.commonMistake) {
    return "This is a common mistake. Let's think about it differently.";
  } else if (attemptNumber === 1) {
    return "Not quite. Take another look at the question.";
  } else if (attemptNumber === 2) {
    return "Still not right. Consider using a hint.";
  } else {
    return "Keep trying! You're learning.";
  }
}

/**
 * Format partial credit feedback
 */
function formatPartialFeedback(analysis: AnswerAnalysis): string {
  const parts: string[] = [];

  if (analysis.strengths.length > 0) {
    parts.push(`Correct: ${analysis.strengths.join(", ")}`);
  }

  if (analysis.specificIssues.length > 0) {
    parts.push(`To improve: ${analysis.specificIssues.join(", ")}`);
  }

  return parts.join(" | ");
}

/**
 * Generate encouragement message
 */
function generateEncouragement(
  attemptNumber: number,
  severity: string,
  tone: string
): string {
  const encouragements = {
    formal: [
      "Please review the material and try again.",
      "Consider the question from a different perspective.",
      "Take your time to think through the answer.",
    ],
    casual: [
      "No worries! Give it another shot.",
      "You've got this! Try again.",
      "Almost there, keep going!",
    ],
    encouraging: [
      "Great effort! You're getting closer.",
      "Keep it up! Learning takes practice.",
      "You're doing great! Each attempt helps you learn.",
    ],
  };

  const messages = encouragements[tone] || encouragements.encouraging;
  const index = Math.min(attemptNumber - 1, messages.length - 1);

  return messages[index];
}

/**
 * Generate next steps suggestion
 */
function generateNextSteps(
  type: GeneratedFeedback["type"],
  analysis: AnswerAnalysis,
  context: FeedbackContext
): string {
  if (type === "correct") {
    return "Move on to the next question.";
  }

  if (context.attemptNumber >= 3 && context.hintsUsed === 0) {
    return "Consider using a hint for guidance.";
  }

  if (analysis.errorType === "spelling") {
    return "Check your spelling carefully.";
  }

  if (analysis.errorType === "grammar") {
    return "Review the grammatical rules for this type of question.";
  }

  return "Review your answer and try again.";
}

/**
 * Get related concepts based on error type
 */
function getRelatedConcepts(
  errorType: string,
  question: ExerciseQuestion
): string[] {
  const conceptMap: Record<string, string[]> = {
    spelling: ["Letter patterns", "Common misspellings"],
    grammar: ["Verb conjugation", "Subject-verb agreement", "Tense usage"],
    word_order: ["Sentence structure", "Word order rules"],
    vocabulary: ["Synonyms", "Context clues", "Word meanings"],
    common_misconception: ["Common errors", "Similar concepts"],
  };

  return conceptMap[errorType] || [];
}

/**
 * Personalize message based on user profile
 */
function personalizeMessage(
  message: string,
  profile: UserLearningProfile,
  analysis: AnswerAnalysis
): string {
  // Add personalization based on learning style
  if (
    profile.preferredHintStyle === "visual" &&
    analysis.errorSeverity !== "minor"
  ) {
    message += " Check the visual guide below.";
  }

  // Reference past performance if relevant
  if (profile.commonMistakes.some((m) => m.type === analysis.errorType)) {
    message += " This relates to a pattern we've seen before.";
  }

  return message;
}

/**
 * Generate visual aid for complex errors
 */
function generateVisualAid(
  question: ExerciseQuestion,
  analysis: AnswerAnalysis
): string {
  // This would generate or reference visual aids
  // For now, return a placeholder
  return `Visual aid for ${question.type} - ${analysis.errorType}`;
}

// ===== HELPER FUNCTIONS =====

/**
 * Normalize text for comparison
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, "");
}

/**
 * Check if it's likely a spelling mistake
 */
function isSpellingMistake(userAnswer: string, correctAnswer: string): boolean {
  // Simple Levenshtein distance check
  const distance = levenshteinDistance(userAnswer, correctAnswer);
  return distance <= 2 && distance > 0;
}

/**
 * Check if it's a grammatical variation
 */
function isGrammaticalVariation(
  userAnswer: string,
  correctAnswer: string
): boolean {
  // Generate possible grammatical variations
  const variations = [
    // Plural forms
    ...generatePluralVariations(correctAnswer),
    // Verb forms
    [correctAnswer, correctAnswer + "ed"], // Past tense
    [correctAnswer, correctAnswer + "ing"], // Present continuous
    [correctAnswer, correctAnswer + "s"], // Third person singular
  ];

  return variations.some(([a, b]) => userAnswer === a || userAnswer === b);
}

/**
 * Generate plural variations for a word
 */
function generatePluralVariations(word: string): [string, string][] {
  const variations: [string, string][] = [];

  // Simple plural (most common)
  variations.push([word, word + "s"]);

  // Words ending in -s, -x, -z, -ch, -sh add "es"
  if (/[sxz]$|[cs]h$/.test(word)) {
    variations.push([word, word + "es"]);
  }

  // Words ending in consonant + y → ies (e.g., city → cities)
  if (/[bcdfghjklmnpqrstvwxz]y$/.test(word)) {
    variations.push([word, word.slice(0, -1) + "ies"]);
  }

  // Words ending in -f or -fe → ves (e.g., leaf → leaves)
  if (/fe?$/.test(word)) {
    const base = word.replace(/fe?$/, "");
    variations.push([word, base + "ves"]);
  }

  // Words ending in consonant + o → oes (e.g., hero → heroes)
  if (/[bcdfghjklmnpqrstvwxz]o$/.test(word)) {
    variations.push([word, word + "es"]);
  }

  // Common irregular plurals
  const irregularPlurals: Record<string, string> = {
    child: "children",
    foot: "feet",
    tooth: "teeth",
    mouse: "mice",
    man: "men",
    woman: "women",
    person: "people",
    goose: "geese",
    ox: "oxen",
    matrix: "matrices",
    index: "indices",
    vertex: "vertices",
  };

  if (irregularPlurals[word]) {
    variations.push([word, irregularPlurals[word]]);
  }

  return variations;
}

/**
 * Get common distracters for an answer
 */
function getCommonDistracters(correctAnswer: string): string[] {
  // This would be populated from a database of common mistakes
  // For now, return empty
  return [];
}

/**
 * Find transpositions in word order
 */
function findTranspositions(
  userOrder: string[],
  correctOrder: string[]
): number[] {
  const transpositions: number[] = [];

  for (let i = 0; i < userOrder.length; i++) {
    if (userOrder[i] !== correctOrder[i]) {
      const correctIndex = correctOrder.indexOf(userOrder[i]);
      if (correctIndex !== -1) {
        transpositions.push(i);
      }
    }
  }

  return transpositions;
}

/**
 * Check if sentence is grammatically valid
 */
function isGrammaticallyValid(sentence: string): boolean {
  // Simplified grammar check
  // In production, this would use NLP libraries
  const hasSubject = /\b(I|you|he|she|it|we|they|[A-Z][a-z]+)\b/i.test(
    sentence
  );
  const hasVerb =
    /\b(is|are|was|were|have|has|had|do|does|did|[a-z]+ed|[a-z]+ing)\b/i.test(
      sentence
    );

  return hasSubject && hasVerb;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
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

  return matrix[str2.length][str1.length];
}
