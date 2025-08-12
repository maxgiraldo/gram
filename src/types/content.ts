/**
 * Content Models and Type Definitions
 * 
 * Comprehensive TypeScript interfaces for lesson content, exercises, assessments,
 * and learning objectives. These models align with the Prisma database schema
 * and provide type safety throughout the application.
 */

// ===== CORE CONTENT TYPES =====

/**
 * Learning difficulty levels
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Learning objective categories based on Bloom's taxonomy
 */
export type ObjectiveCategory = 
  | 'knowledge' 
  | 'comprehension' 
  | 'application' 
  | 'analysis' 
  | 'synthesis' 
  | 'evaluation';

/**
 * Exercise and assessment question types
 */
export type QuestionType = 
  | 'multiple_choice' 
  | 'fill_in_blank' 
  | 'drag_and_drop' 
  | 'sentence_builder' 
  | 'essay';

/**
 * Exercise types for practice activities
 */
export type ExerciseType = 'practice' | 'reinforcement' | 'challenge' | 'enrichment';

/**
 * Assessment types for different evaluation purposes
 */
export type AssessmentType = 'diagnostic' | 'formative' | 'summative' | 'retention_check';

/**
 * Progress status for tracking learner advancement
 */
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'mastered';

// ===== UNIT AND LESSON MODELS =====

/**
 * Learning unit containing multiple lessons
 */
export interface Unit {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
  
  // Mastery requirements
  masteryThreshold: number; // 0.9 for 90%
  
  // Prerequisites and relationships
  prerequisiteUnits?: string[]; // Array of unit IDs
  
  // Content relationships
  lessons: Lesson[];
  objectives: LearningObjective[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual lesson within a unit
 */
export interface Lesson {
  id: string;
  unitId: string;
  unit?: Unit;
  
  title: string;
  description: string;
  content: string; // Markdown content
  orderIndex: number;
  isPublished: boolean;
  
  // Mastery requirements
  masteryThreshold: number; // 0.8 for 80%
  estimatedMinutes: number;
  
  // Content metadata
  difficulty: DifficultyLevel;
  tags?: string[]; // Topic tags
  
  // Content relationships
  objectives: LearningObjective[];
  exercises: Exercise[];
  assessments: Assessment[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Learning objective for tracking specific skills
 */
export interface LearningObjective {
  id: string;
  unitId?: string;
  unit?: Unit;
  lessonId?: string;
  lesson?: Lesson;
  
  title: string;
  description: string;
  category: ObjectiveCategory;
  
  // Mastery tracking
  masteryThreshold: number; // 0.8 for 80%
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ===== EXERCISE MODELS =====

/**
 * Practice exercise for skill development
 */
export interface Exercise {
  id: string;
  lessonId: string;
  lesson?: Lesson;
  
  title: string;
  description?: string;
  type: ExerciseType;
  orderIndex: number;
  
  // Exercise configuration
  timeLimit?: number; // in seconds
  maxAttempts: number;
  difficulty: DifficultyLevel;
  
  // Content relationships
  questions: ExerciseQuestion[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual question within an exercise
 */
export interface ExerciseQuestion {
  id: string;
  exerciseId: string;
  exercise?: Exercise;
  objectiveId?: string;
  objective?: LearningObjective;
  
  questionText: string;
  type: QuestionType;
  orderIndex: number;
  
  // Question configuration
  points: number;
  timeLimit?: number; // in seconds
  
  // Question content (typed based on question type)
  questionData: QuestionData;
  correctAnswer: CorrectAnswer;
  hints?: string[]; // Progressive hints
  
  // Feedback content
  correctFeedback?: string;
  incorrectFeedback?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ===== ASSESSMENT MODELS =====

/**
 * Formal assessment for evaluation
 */
export interface Assessment {
  id: string;
  lessonId?: string;
  lesson?: Lesson;
  
  title: string;
  description?: string;
  type: AssessmentType;
  
  // Assessment configuration
  timeLimit?: number; // in seconds
  maxAttempts: number;
  masteryThreshold: number; // 0.8 for 80%
  
  // Scheduling for retention checks
  scheduledDelay?: number; // days after lesson completion
  
  // Content relationships
  questions: AssessmentQuestion[];
  
  // Publishing
  isPublished: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Individual question within an assessment
 */
export interface AssessmentQuestion {
  id: string;
  assessmentId: string;
  assessment?: Assessment;
  objectiveId?: string;
  objective?: LearningObjective;
  
  questionText: string;
  type: QuestionType;
  orderIndex: number;
  
  // Question configuration
  points: number;
  difficulty: DifficultyLevel;
  
  // Question content (typed based on question type)
  questionData: QuestionData;
  correctAnswer: CorrectAnswer;
  
  // Analysis data
  distractors?: string[]; // Wrong answers for analysis
  feedback?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ===== QUESTION DATA TYPES =====

/**
 * Question-specific data structures based on question type
 */
export type QuestionData = 
  | MultipleChoiceData
  | FillInBlankData
  | DragAndDropData
  | SentenceBuilderData
  | EssayData;

/**
 * Multiple choice question data
 */
export interface MultipleChoiceData {
  type: 'multiple_choice';
  options: string[];
  shuffleOptions?: boolean;
}

/**
 * Fill in the blank question data
 */
export interface FillInBlankData {
  type: 'fill_in_blank';
  template: string; // Text with {blank} placeholders
  blanks: {
    id: string;
    position: number;
    acceptableAnswers: string[];
    caseSensitive?: boolean;
  }[];
}

/**
 * Drag and drop question data
 */
export interface DragAndDropData {
  type: 'drag_and_drop';
  items: {
    id: string;
    content: string;
    category?: string;
  }[];
  targets: {
    id: string;
    label: string;
    acceptsCategory?: string;
  }[];
}

/**
 * Sentence builder question data
 */
export interface SentenceBuilderData {
  type: 'sentence_builder';
  words: string[];
  shuffleWords?: boolean;
  allowExtraWords?: boolean;
}

/**
 * Essay question data
 */
export interface EssayData {
  type: 'essay';
  prompt: string;
  minWords?: number;
  maxWords?: number;
  rubric?: {
    criteria: string;
    points: number;
  }[];
}

/**
 * Correct answer types based on question type
 */
export type CorrectAnswer = 
  | string // Single correct answer
  | string[] // Multiple correct answers
  | { [targetId: string]: string } // Drag and drop mappings
  | {
      text: string;
      keyPoints?: string[];
      rubricScore?: number;
    }; // Essay answer

// ===== PROGRESS AND ANALYTICS MODELS =====

/**
 * Learner progress for a specific lesson
 */
export interface LearnerProgress {
  id: string;
  userId: string;
  lessonId: string;
  lesson?: Lesson;
  
  // Progress status
  status: ProgressStatus;
  
  // Mastery tracking
  currentScore: number;
  bestScore: number;
  masteryAchieved: boolean;
  masteryDate?: Date;
  
  // Engagement metrics
  totalTimeSpent: number; // in seconds
  sessionsCount: number;
  lastAccessedAt: Date;
  
  // Learning path customization
  needsRemediation: boolean;
  remediationPath?: string[]; // Activity IDs
  eligibleForEnrichment: boolean;
  enrichmentActivities?: string[]; // Completed activity IDs
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Progress for individual learning objectives
 */
export interface ObjectiveProgress {
  id: string;
  userId: string;
  objectiveId: string;
  objective?: LearningObjective;
  
  // Mastery tracking
  currentScore: number;
  bestScore: number;
  masteryAchieved: boolean;
  masteryDate?: Date;
  
  // Attempt tracking
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptAt: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// ===== ATTEMPT AND RESPONSE MODELS =====

/**
 * Exercise attempt by a learner
 */
export interface ExerciseAttempt {
  id: string;
  userId: string;
  exerciseId: string;
  exercise?: Exercise;
  
  // Attempt metadata
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number; // in seconds
  
  // Scoring
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  isPassed: boolean;
  
  // Responses
  responses: ExerciseResponse[];
}

/**
 * Individual response to an exercise question
 */
export interface ExerciseResponse {
  id: string;
  attemptId: string;
  attempt?: ExerciseAttempt;
  questionId: string;
  question?: ExerciseQuestion;
  
  // Response data
  response: any; // User's answer (typed based on question type)
  isCorrect: boolean;
  points: number;
  timeSpent?: number; // in seconds
  hintsUsed: number;
  
  // Feedback given
  feedback?: string;
  
  // Metadata
  createdAt: Date;
}

/**
 * Assessment attempt by a learner
 */
export interface AssessmentAttempt {
  id: string;
  userId: string;
  assessmentId: string;
  assessment?: Assessment;
  
  // Attempt metadata
  startedAt: Date;
  completedAt?: Date;
  timeSpent?: number; // in seconds
  
  // Scoring
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  achievedMastery: boolean;
  
  // Responses
  responses: AssessmentResponse[];
}

/**
 * Individual response to an assessment question
 */
export interface AssessmentResponse {
  id: string;
  attemptId: string;
  attempt?: AssessmentAttempt;
  questionId: string;
  question?: AssessmentQuestion;
  
  // Response data
  response: any; // User's answer (typed based on question type)
  isCorrect: boolean;
  points: number;
  timeSpent?: number; // in seconds
  
  // Analysis data
  errorType?: string; // Type of error for analytics
  confidence?: number; // User's confidence level (0-1)
  
  // Metadata
  createdAt: Date;
}

// ===== CONTENT CREATION AND MANAGEMENT =====

/**
 * Content creation request for new lessons/exercises
 */
export interface ContentCreationRequest {
  type: 'lesson' | 'exercise' | 'assessment';
  title: string;
  description?: string;
  difficulty: DifficultyLevel;
  objectives: string[]; // Learning objective IDs
  metadata?: {
    estimatedMinutes?: number;
    tags?: string[];
    prerequisites?: string[];
  };
}

/**
 * Content validation result
 */
export interface ContentValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error for content
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Validation warning for content
 */
export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

// ===== UTILITY TYPES =====

/**
 * Base content item interface
 */
export interface BaseContentItem {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Content with publishing status
 */
export interface PublishableContent extends BaseContentItem {
  isPublished: boolean;
}

/**
 * Content with difficulty level
 */
export interface DifficultyContent extends BaseContentItem {
  difficulty: DifficultyLevel;
}

/**
 * Content with mastery requirements
 */
export interface MasteryContent extends BaseContentItem {
  masteryThreshold: number;
}

/**
 * Ordered content item
 */
export interface OrderedContent extends BaseContentItem {
  orderIndex: number;
}

// ===== TYPE GUARDS =====

/**
 * Type guard for multiple choice question data
 */
export function isMultipleChoiceData(data: QuestionData): data is MultipleChoiceData {
  return data.type === 'multiple_choice';
}

/**
 * Type guard for fill in blank question data
 */
export function isFillInBlankData(data: QuestionData): data is FillInBlankData {
  return data.type === 'fill_in_blank';
}

/**
 * Type guard for drag and drop question data
 */
export function isDragAndDropData(data: QuestionData): data is DragAndDropData {
  return data.type === 'drag_and_drop';
}

/**
 * Type guard for sentence builder question data
 */
export function isSentenceBuilderData(data: QuestionData): data is SentenceBuilderData {
  return data.type === 'sentence_builder';
}

/**
 * Type guard for essay question data
 */
export function isEssayData(data: QuestionData): data is EssayData {
  return data.type === 'essay';
}