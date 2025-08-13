/**
 * API Request/Response Validation
 * 
 * Validation utilities for API endpoints with comprehensive
 * type checking and error handling.
 */

import { NextRequest, NextResponse } from 'next/server';
import type {
  ApiResponse,
  ApiError,
  ValidationErrorDetails,
  ValidationErrorResponse,
  CreateAssessmentRequest,
  UpdateAssessmentRequest,
  CreateAssessmentQuestionRequest,
  UpdateAssessmentQuestionRequest,
  CreateProgressRequest,
  UpdateProgressRequest,
  CreateObjectiveProgressRequest
} from '@/types/api';

// ===== VALIDATION ERROR CLASS =====

export class RequestValidationError extends Error {
  constructor(
    public field: string,
    public value: any,
    message: string
  ) {
    super(`Validation failed for ${field}: ${message}`);
    this.name = 'RequestValidationError';
  }
}

// ===== BASIC VALIDATORS =====

export function isValidString(value: any, required = false): boolean {
  if (required && (value === undefined || value === null)) return false;
  if (value === undefined || value === null) return true;
  return typeof value === 'string' && value.trim().length > 0;
}

export function isValidNumber(value: any, min?: number, max?: number, required = false): boolean {
  if (required && (value === undefined || value === null)) return false;
  if (value === undefined || value === null) return true;
  
  if (typeof value !== 'number' || isNaN(value)) return false;
  if (min !== undefined && value < min) return false;
  if (max !== undefined && value > max) return false;
  
  return true;
}

export function isValidBoolean(value: any, required = false): boolean {
  if (required && (value === undefined || value === null)) return false;
  if (value === undefined || value === null) return true;
  return typeof value === 'boolean';
}

export function isValidEnum(value: any, enumValues: string[], required = false): boolean {
  if (required && (value === undefined || value === null)) return false;
  if (value === undefined || value === null) return true;
  return enumValues.includes(value);
}

export function isValidDate(value: any, required = false): boolean {
  if (required && (value === undefined || value === null)) return false;
  if (value === undefined || value === null) return true;
  
  const date = new Date(value);
  return !isNaN(date.getTime());
}

export function isValidJSON(value: any, required = false): boolean {
  if (required && (value === undefined || value === null)) return false;
  if (value === undefined || value === null) return true;
  
  if (typeof value === 'object') return true;
  
  if (typeof value === 'string') {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
}

// ===== ASSESSMENT VALIDATORS =====

export function validateCreateAssessment(data: any): CreateAssessmentRequest {
  const errors: ValidationErrorDetails[] = [];

  // Required fields
  if (!isValidString(data.title, true)) {
    errors.push({
      field: 'title',
      message: 'Title is required and must be a non-empty string',
      value: data.title
    });
  }

  if (!isValidEnum(data.type, ['diagnostic', 'formative', 'summative', 'retention_check'], true)) {
    errors.push({
      field: 'type',
      message: 'Type must be one of: diagnostic, formative, summative, retention_check',
      value: data.type
    });
  }

  // Optional fields
  if (!isValidString(data.lessonId)) {
    errors.push({
      field: 'lessonId',
      message: 'LessonId must be a valid string if provided',
      value: data.lessonId
    });
  }

  if (!isValidString(data.description)) {
    errors.push({
      field: 'description',
      message: 'Description must be a valid string if provided',
      value: data.description
    });
  }

  if (!isValidNumber(data.timeLimit, 0)) {
    errors.push({
      field: 'timeLimit',
      message: 'TimeLimit must be a non-negative number if provided',
      value: data.timeLimit
    });
  }

  if (!isValidNumber(data.maxAttempts, 1)) {
    errors.push({
      field: 'maxAttempts',
      message: 'MaxAttempts must be a positive number if provided',
      value: data.maxAttempts
    });
  }

  if (!isValidNumber(data.masteryThreshold, 0, 1)) {
    errors.push({
      field: 'masteryThreshold',
      message: 'MasteryThreshold must be a number between 0 and 1 if provided',
      value: data.masteryThreshold
    });
  }

  if (!isValidNumber(data.scheduledDelay, 0)) {
    errors.push({
      field: 'scheduledDelay',
      message: 'ScheduledDelay must be a non-negative number if provided',
      value: data.scheduledDelay
    });
  }

  if (!isValidBoolean(data.isPublished)) {
    errors.push({
      field: 'isPublished',
      message: 'IsPublished must be a boolean if provided',
      value: data.isPublished
    });
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    (error as any).validationErrors = errors;
    throw error;
  }

  return data as CreateAssessmentRequest;
}

export function validateUpdateAssessment(data: any): UpdateAssessmentRequest {
  const errors: ValidationErrorDetails[] = [];

  // All fields are optional for updates
  if (data.title !== undefined && !isValidString(data.title)) {
    errors.push({
      field: 'title',
      message: 'Title must be a non-empty string if provided',
      value: data.title
    });
  }

  if (data.type !== undefined && !isValidEnum(data.type, ['diagnostic', 'formative', 'summative', 'retention_check'])) {
    errors.push({
      field: 'type',
      message: 'Type must be one of: diagnostic, formative, summative, retention_check',
      value: data.type
    });
  }

  if (data.description !== undefined && !isValidString(data.description)) {
    errors.push({
      field: 'description',
      message: 'Description must be a valid string if provided',
      value: data.description
    });
  }

  if (data.timeLimit !== undefined && !isValidNumber(data.timeLimit, 0)) {
    errors.push({
      field: 'timeLimit',
      message: 'TimeLimit must be a non-negative number if provided',
      value: data.timeLimit
    });
  }

  if (data.maxAttempts !== undefined && !isValidNumber(data.maxAttempts, 1)) {
    errors.push({
      field: 'maxAttempts',
      message: 'MaxAttempts must be a positive number if provided',
      value: data.maxAttempts
    });
  }

  if (data.masteryThreshold !== undefined && !isValidNumber(data.masteryThreshold, 0, 1)) {
    errors.push({
      field: 'masteryThreshold',
      message: 'MasteryThreshold must be a number between 0 and 1 if provided',
      value: data.masteryThreshold
    });
  }

  if (data.scheduledDelay !== undefined && !isValidNumber(data.scheduledDelay, 0)) {
    errors.push({
      field: 'scheduledDelay',
      message: 'ScheduledDelay must be a non-negative number if provided',
      value: data.scheduledDelay
    });
  }

  if (data.isPublished !== undefined && !isValidBoolean(data.isPublished)) {
    errors.push({
      field: 'isPublished',
      message: 'IsPublished must be a boolean if provided',
      value: data.isPublished
    });
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    (error as any).validationErrors = errors;
    throw error;
  }

  return data as UpdateAssessmentRequest;
}

export function validateCreateAssessmentQuestion(data: any): CreateAssessmentQuestionRequest {
  const errors: ValidationErrorDetails[] = [];

  // Required fields
  if (!isValidString(data.assessmentId, true)) {
    errors.push({
      field: 'assessmentId',
      message: 'AssessmentId is required and must be a valid string',
      value: data.assessmentId
    });
  }

  if (!isValidString(data.questionText, true)) {
    errors.push({
      field: 'questionText',
      message: 'QuestionText is required and must be a non-empty string',
      value: data.questionText
    });
  }

  if (!isValidEnum(data.type, ['multiple_choice', 'fill_in_blank', 'drag_and_drop', 'sentence_builder', 'essay'], true)) {
    errors.push({
      field: 'type',
      message: 'Type must be one of: multiple_choice, fill_in_blank, drag_and_drop, sentence_builder, essay',
      value: data.type
    });
  }

  if (!isValidNumber(data.orderIndex, 0, undefined, true)) {
    errors.push({
      field: 'orderIndex',
      message: 'OrderIndex is required and must be a non-negative number',
      value: data.orderIndex
    });
  }

  if (!isValidJSON(data.questionData, true)) {
    errors.push({
      field: 'questionData',
      message: 'QuestionData is required and must be valid JSON',
      value: data.questionData
    });
  }

  if (!isValidJSON(data.correctAnswer, true)) {
    errors.push({
      field: 'correctAnswer',
      message: 'CorrectAnswer is required and must be valid JSON',
      value: data.correctAnswer
    });
  }

  // Optional fields
  if (!isValidString(data.objectiveId)) {
    errors.push({
      field: 'objectiveId',
      message: 'ObjectiveId must be a valid string if provided',
      value: data.objectiveId
    });
  }

  if (!isValidNumber(data.points, 0)) {
    errors.push({
      field: 'points',
      message: 'Points must be a non-negative number if provided',
      value: data.points
    });
  }

  if (!isValidEnum(data.difficulty, ['easy', 'medium', 'hard'])) {
    errors.push({
      field: 'difficulty',
      message: 'Difficulty must be one of: easy, medium, hard',
      value: data.difficulty
    });
  }

  if (!isValidJSON(data.distractors)) {
    errors.push({
      field: 'distractors',
      message: 'Distractors must be valid JSON if provided',
      value: data.distractors
    });
  }

  if (!isValidString(data.feedback)) {
    errors.push({
      field: 'feedback',
      message: 'Feedback must be a valid string if provided',
      value: data.feedback
    });
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    (error as any).validationErrors = errors;
    throw error;
  }

  return data as CreateAssessmentQuestionRequest;
}

// ===== PROGRESS VALIDATORS =====

export function validateCreateProgress(data: any): CreateProgressRequest {
  const errors: ValidationErrorDetails[] = [];

  // Required fields
  if (!isValidString(data.userId, true)) {
    errors.push({
      field: 'userId',
      message: 'UserId is required and must be a valid string',
      value: data.userId
    });
  }

  if (!isValidString(data.lessonId, true)) {
    errors.push({
      field: 'lessonId',
      message: 'LessonId is required and must be a valid string',
      value: data.lessonId
    });
  }

  // Optional fields
  if (!isValidEnum(data.status, ['not_started', 'in_progress', 'completed', 'mastered'])) {
    errors.push({
      field: 'status',
      message: 'Status must be one of: not_started, in_progress, completed, mastered',
      value: data.status
    });
  }

  if (!isValidNumber(data.currentScore, 0, 1)) {
    errors.push({
      field: 'currentScore',
      message: 'CurrentScore must be a number between 0 and 1 if provided',
      value: data.currentScore
    });
  }

  if (!isValidNumber(data.bestScore, 0, 1)) {
    errors.push({
      field: 'bestScore',
      message: 'BestScore must be a number between 0 and 1 if provided',
      value: data.bestScore
    });
  }

  if (!isValidBoolean(data.masteryAchieved)) {
    errors.push({
      field: 'masteryAchieved',
      message: 'MasteryAchieved must be a boolean if provided',
      value: data.masteryAchieved
    });
  }

  if (!isValidDate(data.masteryDate)) {
    errors.push({
      field: 'masteryDate',
      message: 'MasteryDate must be a valid date if provided',
      value: data.masteryDate
    });
  }

  if (!isValidNumber(data.totalTimeSpent, 0)) {
    errors.push({
      field: 'totalTimeSpent',
      message: 'TotalTimeSpent must be a non-negative number if provided',
      value: data.totalTimeSpent
    });
  }

  if (!isValidNumber(data.sessionsCount, 0)) {
    errors.push({
      field: 'sessionsCount',
      message: 'SessionsCount must be a non-negative number if provided',
      value: data.sessionsCount
    });
  }

  if (!isValidBoolean(data.needsRemediation)) {
    errors.push({
      field: 'needsRemediation',
      message: 'NeedsRemediation must be a boolean if provided',
      value: data.needsRemediation
    });
  }

  if (!isValidJSON(data.remediationPath)) {
    errors.push({
      field: 'remediationPath',
      message: 'RemediationPath must be valid JSON if provided',
      value: data.remediationPath
    });
  }

  if (!isValidBoolean(data.eligibleForEnrichment)) {
    errors.push({
      field: 'eligibleForEnrichment',
      message: 'EligibleForEnrichment must be a boolean if provided',
      value: data.eligibleForEnrichment
    });
  }

  if (!isValidJSON(data.enrichmentActivities)) {
    errors.push({
      field: 'enrichmentActivities',
      message: 'EnrichmentActivities must be valid JSON if provided',
      value: data.enrichmentActivities
    });
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    (error as any).validationErrors = errors;
    throw error;
  }

  return data as CreateProgressRequest;
}

export function validateCreateObjectiveProgress(data: any): CreateObjectiveProgressRequest {
  const errors: ValidationErrorDetails[] = [];

  // Required fields
  if (!isValidString(data.userId, true)) {
    errors.push({
      field: 'userId',
      message: 'UserId is required and must be a valid string',
      value: data.userId
    });
  }

  if (!isValidString(data.objectiveId, true)) {
    errors.push({
      field: 'objectiveId',
      message: 'ObjectiveId is required and must be a valid string',
      value: data.objectiveId
    });
  }

  // Optional fields
  if (!isValidNumber(data.currentScore, 0, 1)) {
    errors.push({
      field: 'currentScore',
      message: 'CurrentScore must be a number between 0 and 1 if provided',
      value: data.currentScore
    });
  }

  if (!isValidNumber(data.bestScore, 0, 1)) {
    errors.push({
      field: 'bestScore',
      message: 'BestScore must be a number between 0 and 1 if provided',
      value: data.bestScore
    });
  }

  if (!isValidBoolean(data.masteryAchieved)) {
    errors.push({
      field: 'masteryAchieved',
      message: 'MasteryAchieved must be a boolean if provided',
      value: data.masteryAchieved
    });
  }

  if (!isValidDate(data.masteryDate)) {
    errors.push({
      field: 'masteryDate',
      message: 'MasteryDate must be a valid date if provided',
      value: data.masteryDate
    });
  }

  if (!isValidNumber(data.totalAttempts, 0)) {
    errors.push({
      field: 'totalAttempts',
      message: 'TotalAttempts must be a non-negative number if provided',
      value: data.totalAttempts
    });
  }

  if (!isValidNumber(data.correctAttempts, 0)) {
    errors.push({
      field: 'correctAttempts',
      message: 'CorrectAttempts must be a non-negative number if provided',
      value: data.correctAttempts
    });
  }

  // Cross-field validation
  if (data.totalAttempts !== undefined && data.correctAttempts !== undefined && 
      data.correctAttempts > data.totalAttempts) {
    errors.push({
      field: 'correctAttempts',
      message: 'CorrectAttempts cannot exceed TotalAttempts',
      value: data.correctAttempts
    });
  }

  if (errors.length > 0) {
    const error = new Error('Validation failed');
    (error as any).validationErrors = errors;
    throw error;
  }

  return data as CreateObjectiveProgressRequest;
}

// ===== RESPONSE HELPERS =====

export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status = 200
): NextResponse {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };

  if (Array.isArray(data)) {
    (response as any).count = data.length;
  }

  return NextResponse.json(response, { status });
}

export function createErrorResponse(
  error: string,
  message: string,
  status = 500,
  validationErrors?: ValidationErrorDetails[]
): NextResponse {
  const response: ApiError | ValidationErrorResponse = {
    success: false,
    error,
    message,
    ...(validationErrors && { errors: validationErrors })
  };

  return NextResponse.json(response, { status });
}

export function createValidationErrorResponse(
  errors: ValidationErrorDetails[],
  message = 'Validation failed'
): NextResponse {
  const response: ValidationErrorResponse = {
    success: false,
    error: 'Validation failed',
    message,
    errors
  };

  return NextResponse.json(response, { status: 400 });
}

// ===== MIDDLEWARE HELPERS =====

export async function validateRequestBody<T>(
  request: NextRequest,
  validator: (data: any) => T
): Promise<T> {
  try {
    const body = await request.json();
    return validator(body);
  } catch (error) {
    if (error instanceof Error && (error as any).validationErrors) {
      throw error;
    }
    throw new Error('Invalid JSON in request body');
  }
}

export function handleValidationError(error: any): NextResponse {
  if (error instanceof Error && (error as any).validationErrors) {
    return createValidationErrorResponse((error as any).validationErrors, error.message);
  }

  if (error instanceof RequestValidationError) {
    return createValidationErrorResponse([{
      field: error.field,
      message: error.message,
      value: error.value
    }]);
  }

  return createErrorResponse('Validation failed', error.message || 'Unknown validation error', 400);
}