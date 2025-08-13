/**
 * API Type Definitions and Contracts
 * 
 * TypeScript interfaces for API requests and responses.
 * Provides type safety for assessment and progress API endpoints.
 */

// ===== COMMON API TYPES =====

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  count?: number;
}

export interface PaginatedApiResponse<T = any> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  field?: string;
  value?: any;
}

// ===== ASSESSMENT API TYPES =====

export interface CreateAssessmentRequest {
  lessonId?: string;
  title: string;
  description?: string;
  type: 'diagnostic' | 'formative' | 'summative' | 'retention_check';
  timeLimit?: number;
  maxAttempts?: number;
  masteryThreshold?: number;
  scheduledDelay?: number;
  isPublished?: boolean;
}

export interface UpdateAssessmentRequest {
  title?: string;
  description?: string;
  type?: 'diagnostic' | 'formative' | 'summative' | 'retention_check';
  timeLimit?: number;
  maxAttempts?: number;
  masteryThreshold?: number;
  scheduledDelay?: number;
  isPublished?: boolean;
}

export interface AssessmentResponse {
  id: string;
  lessonId?: string;
  title: string;
  description?: string;
  type: 'diagnostic' | 'formative' | 'summative' | 'retention_check';
  timeLimit?: number;
  maxAttempts: number;
  masteryThreshold: number;
  scheduledDelay?: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  lesson?: LessonSummary;
  questions?: AssessmentQuestionResponse[];
  attempts?: AssessmentAttemptResponse[];
  _count?: {
    attempts: number;
  };
}

export interface CreateAssessmentQuestionRequest {
  assessmentId: string;
  objectiveId?: string;
  questionText: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder' | 'essay';
  orderIndex: number;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionData: any; // JSON object
  correctAnswer: any; // JSON object
  distractors?: any; // JSON object
  feedback?: string;
}

export interface UpdateAssessmentQuestionRequest {
  objectiveId?: string;
  questionText?: string;
  type?: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder' | 'essay';
  orderIndex?: number;
  points?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  questionData?: any;
  correctAnswer?: any;
  distractors?: any;
  feedback?: string;
}

export interface AssessmentQuestionResponse {
  id: string;
  assessmentId: string;
  objectiveId?: string;
  questionText: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'drag_and_drop' | 'sentence_builder' | 'essay';
  orderIndex: number;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questionData: any;
  correctAnswer: any;
  distractors?: any;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
  assessment?: AssessmentSummary;
  objective?: ObjectiveSummary;
}

export interface CreateAssessmentAttemptRequest {
  userId: string;
}

export interface AssessmentAttemptResponse {
  id: string;
  userId: string;
  assessmentId: string;
  startedAt: string;
  completedAt?: string;
  timeSpent?: number;
  totalQuestions: number;
  correctAnswers: number;
  scorePercentage: number;
  achievedMastery: boolean;
  user?: UserSummary;
  assessment?: AssessmentSummary;
  responses?: AssessmentResponseItem[];
}

export interface CreateAssessmentResponseRequest {
  attemptId: string;
  questionId: string;
  response: any; // JSON object
  isCorrect: boolean;
  points: number;
  timeSpent?: number;
  errorType?: string;
  confidence?: number;
}

export interface AssessmentResponseItem {
  id: string;
  attemptId: string;
  questionId: string;
  response: any;
  isCorrect: boolean;
  points: number;
  timeSpent?: number;
  errorType?: string;
  confidence?: number;
  createdAt: string;
  question?: AssessmentQuestionResponse;
}

export interface AssessmentStatsResponse {
  totalAttempts: number;
  masteryCount: number;
  masteryRate: number;
  averageScore: number;
  averageTime: number;
}

export interface QuestionPerformanceResponse {
  totalResponses: number;
  correctResponses: number;
  accuracy: number;
  averageTime: number;
  errorTypes: Record<string, number>;
}

// ===== PROGRESS API TYPES =====

export interface CreateProgressRequest {
  userId: string;
  lessonId: string;
  status?: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: string;
  totalTimeSpent?: number;
  sessionsCount?: number;
  needsRemediation?: boolean;
  remediationPath?: any; // JSON object or string
  eligibleForEnrichment?: boolean;
  enrichmentActivities?: any; // JSON object or string
}

export interface UpdateProgressRequest {
  status?: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: string;
  totalTimeSpent?: number;
  sessionsCount?: number;
  needsRemediation?: boolean;
  remediationPath?: any;
  eligibleForEnrichment?: boolean;
  enrichmentActivities?: any;
}

export interface ProgressResponse {
  id: string;
  userId: string;
  lessonId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'mastered';
  currentScore: number;
  bestScore: number;
  masteryAchieved: boolean;
  masteryDate?: string;
  totalTimeSpent: number;
  sessionsCount: number;
  lastAccessedAt: string;
  needsRemediation: boolean;
  remediationPath?: string;
  eligibleForEnrichment: boolean;
  enrichmentActivities?: string;
  createdAt: string;
  updatedAt: string;
  user?: UserSummary;
  lesson?: LessonSummary;
}

export interface CreateObjectiveProgressRequest {
  userId: string;
  objectiveId: string;
  currentScore?: number;
  bestScore?: number;
  masteryAchieved?: boolean;
  masteryDate?: string;
  totalAttempts?: number;
  correctAttempts?: number;
}

export interface ObjectiveProgressResponse {
  id: string;
  userId: string;
  objectiveId: string;
  currentScore: number;
  bestScore: number;
  masteryAchieved: boolean;
  masteryDate?: string;
  totalAttempts: number;
  correctAttempts: number;
  lastAttemptAt: string;
  createdAt: string;
  updatedAt: string;
  objective?: ObjectiveSummary;
}

export interface ProgressSummaryResponse {
  userId: string;
  totalLessons: number;
  completedLessons: number;
  masteredLessons: number;
  totalObjectives: number;
  masteredObjectives: number;
  overallProgress: number;
  masteryRate: number;
  totalTimeSpent: number;
  averageScore: number;
  needsRemediationCount: number;
  eligibleForEnrichmentCount: number;
}

export interface LessonProgressStatsResponse {
  totalProgress: number;
  masteryCount: number;
  masteryRate: number;
  remediationCount: number;
  enrichmentCount: number;
  averageCurrentScore: number;
  averageBestScore: number;
  averageTimeSpent: number;
  statusDistribution: Record<string, number>;
}

// ===== SUMMARY TYPES FOR RELATIONS =====

export interface UserSummary {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface LessonSummary {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
  masteryThreshold: number;
  estimatedMinutes: number;
  difficulty: string;
  unit?: UnitSummary;
}

export interface UnitSummary {
  id: string;
  title: string;
  description: string;
  orderIndex: number;
  isPublished: boolean;
  masteryThreshold: number;
}

export interface ObjectiveSummary {
  id: string;
  title: string;
  description: string;
  category: string;
  masteryThreshold: number;
  lesson?: LessonSummary;
  unit?: UnitSummary;
}

export interface AssessmentSummary {
  id: string;
  title: string;
  type: string;
  masteryThreshold: number;
  maxAttempts: number;
  isPublished: boolean;
}

// ===== QUERY PARAMETER TYPES =====

export interface AssessmentQueryParams {
  lessonId?: string;
  includeQuestions?: boolean;
  includeAttempts?: boolean;
  includeLesson?: boolean;
}

export interface ProgressQueryParams {
  userId?: string;
  lessonId?: string;
  type?: 'summary' | 'remediation' | 'enrichment';
}

export interface ObjectiveProgressQueryParams {
  userId: string;
  objectiveId?: string;
}

// ===== API ENDPOINT PATHS =====

export const API_ENDPOINTS = {
  // Assessment endpoints
  ASSESSMENTS: '/api/assessments',
  ASSESSMENT_BY_ID: '/api/assessments/[id]',
  ASSESSMENT_ATTEMPTS: '/api/assessments/[id]/attempts',
  ASSESSMENT_QUESTIONS: '/api/assessments/[id]/questions',
  ASSESSMENT_RESPONSES: '/api/assessments/attempts/[attemptId]/responses',
  ASSESSMENT_STATS: '/api/assessments/[id]/stats',
  
  // Progress endpoints
  PROGRESS: '/api/progress',
  OBJECTIVE_PROGRESS: '/api/progress/objectives',
  PROGRESS_STATS: '/api/progress/stats',
  
  // Helper functions for dynamic paths
  assessmentById: (id: string) => `/api/assessments/${id}`,
  assessmentAttempts: (id: string) => `/api/assessments/${id}/attempts`,
  assessmentQuestions: (id: string) => `/api/assessments/${id}/questions`,
  assessmentResponses: (attemptId: string) => `/api/assessments/attempts/${attemptId}/responses`,
  assessmentStats: (id: string) => `/api/assessments/${id}/stats`
} as const;

// ===== HTTP STATUS CODES =====

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

// ===== VALIDATION ERROR TYPES =====

export interface ValidationErrorDetails {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationErrorResponse extends ApiError {
  errors: ValidationErrorDetails[];
}

// ===== TYPE GUARDS =====

export function isApiError(response: any): response is ApiError {
  return response && response.success === false && typeof response.error === 'string';
}

export function isValidationError(response: any): response is ValidationErrorResponse {
  return isApiError(response) && Array.isArray(response.errors);
}

export function isPaginatedResponse<T>(response: any): response is PaginatedApiResponse<T> {
  return response && response.success === true && response.pagination;
}