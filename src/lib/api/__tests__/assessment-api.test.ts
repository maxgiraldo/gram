/**
 * Assessment API Tests
 * 
 * Comprehensive test suite for assessment and progress API endpoints.
 * Tests validation, authentication, and database operations.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  validateCreateAssessment,
  validateUpdateAssessment,
  validateCreateAssessmentQuestion,
  validateCreateProgress,
  validateCreateObjectiveProgress,
  isValidString,
  isValidNumber,
  isValidBoolean,
  isValidEnum,
  isValidJSON,
  createSuccessResponse,
  createErrorResponse,
  createValidationErrorResponse
} from '../validation';
import {
  extractToken,
  extractApiKey,
  authenticateRequest,
  requireRole,
  requireAnyRole,
  AuthenticationError,
  AuthorizationError
} from '../auth';

describe('API Validation', () => {
  
  describe('Basic Validators', () => {
    it('should validate strings correctly', () => {
      expect(isValidString('valid string')).toBe(true);
      expect(isValidString('', false)).toBe(false);
      expect(isValidString('   ', false)).toBe(false);
      expect(isValidString(null, false)).toBe(true);
      expect(isValidString(undefined, false)).toBe(true);
      expect(isValidString(null, true)).toBe(false);
      expect(isValidString(123)).toBe(false);
    });
    
    it('should validate numbers correctly', () => {
      expect(isValidNumber(10)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-5)).toBe(true);
      expect(isValidNumber(10, 0, 20)).toBe(true);
      expect(isValidNumber(25, 0, 20)).toBe(false);
      expect(isValidNumber(-5, 0)).toBe(false);
      expect(isValidNumber('10')).toBe(false);
      expect(isValidNumber(NaN)).toBe(false);
      expect(isValidNumber(null, undefined, undefined, false)).toBe(true);
      expect(isValidNumber(null, undefined, undefined, true)).toBe(false);
    });
    
    it('should validate booleans correctly', () => {
      expect(isValidBoolean(true)).toBe(true);
      expect(isValidBoolean(false)).toBe(true);
      expect(isValidBoolean('true')).toBe(false);
      expect(isValidBoolean(1)).toBe(false);
      expect(isValidBoolean(null, false)).toBe(true);
      expect(isValidBoolean(null, true)).toBe(false);
    });
    
    it('should validate enums correctly', () => {
      const validValues = ['option1', 'option2', 'option3'];
      expect(isValidEnum('option1', validValues)).toBe(true);
      expect(isValidEnum('option2', validValues)).toBe(true);
      expect(isValidEnum('invalid', validValues)).toBe(false);
      expect(isValidEnum(null, validValues, false)).toBe(true);
      expect(isValidEnum(null, validValues, true)).toBe(false);
    });
    
    it('should validate JSON correctly', () => {
      expect(isValidJSON({ key: 'value' })).toBe(true);
      expect(isValidJSON('{"key": "value"}')).toBe(true);
      expect(isValidJSON('invalid json')).toBe(false);
      expect(isValidJSON(null, false)).toBe(true);
      expect(isValidJSON(null, true)).toBe(false);
    });
  });
  
  describe('Assessment Validation', () => {
    it('should validate create assessment request', () => {
      const validData = {
        title: 'Test Assessment',
        type: 'formative',
        description: 'A test assessment',
        masteryThreshold: 0.8,
        maxAttempts: 3,
        timeLimit: 1800,
        isPublished: false
      };
      
      expect(() => validateCreateAssessment(validData)).not.toThrow();
    });
    
    it('should reject invalid create assessment request', () => {
      const invalidData = {
        title: '',
        type: 'invalid_type',
        masteryThreshold: 1.5,
        maxAttempts: -1
      };
      
      expect(() => validateCreateAssessment(invalidData)).toThrow();
    });
    
    it('should validate update assessment request', () => {
      const validData = {
        title: 'Updated Assessment',
        masteryThreshold: 0.9
      };
      
      expect(() => validateUpdateAssessment(validData)).not.toThrow();
      
      // Empty update should be valid
      expect(() => validateUpdateAssessment({})).not.toThrow();
    });
    
    it('should validate create assessment question request', () => {
      const validData = {
        assessmentId: 'assessment-1',
        questionText: 'What is 2 + 2?',
        type: 'multiple_choice',
        orderIndex: 0,
        questionData: { options: ['2', '3', '4', '5'] },
        correctAnswer: 2,
        points: 1,
        difficulty: 'easy'
      };
      
      expect(() => validateCreateAssessmentQuestion(validData)).not.toThrow();
    });
    
    it('should reject invalid question types', () => {
      const invalidData = {
        assessmentId: 'assessment-1',
        questionText: 'What is 2 + 2?',
        type: 'invalid_type',
        orderIndex: 0,
        questionData: {},
        correctAnswer: 2
      };
      
      expect(() => validateCreateAssessmentQuestion(invalidData)).toThrow();
    });
  });
  
  describe('Progress Validation', () => {
    it('should validate create progress request', () => {
      const validData = {
        userId: 'user-1',
        lessonId: 'lesson-1',
        status: 'in_progress',
        currentScore: 0.75,
        bestScore: 0.8,
        masteryAchieved: false,
        totalTimeSpent: 1200,
        sessionsCount: 3,
        needsRemediation: false,
        eligibleForEnrichment: true
      };
      
      expect(() => validateCreateProgress(validData)).not.toThrow();
    });
    
    it('should reject invalid progress scores', () => {
      const invalidData = {
        userId: 'user-1',
        lessonId: 'lesson-1',
        currentScore: 1.5, // Invalid score > 1
        bestScore: -0.1 // Invalid score < 0
      };
      
      expect(() => validateCreateProgress(invalidData)).toThrow();
    });
    
    it('should validate create objective progress request', () => {
      const validData = {
        userId: 'user-1',
        objectiveId: 'objective-1',
        currentScore: 0.8,
        bestScore: 0.85,
        masteryAchieved: true,
        totalAttempts: 5,
        correctAttempts: 4
      };
      
      expect(() => validateCreateObjectiveProgress(validData)).not.toThrow();
    });
    
    it('should reject invalid attempt counts', () => {
      const invalidData = {
        userId: 'user-1',
        objectiveId: 'objective-1',
        totalAttempts: 3,
        correctAttempts: 5 // More correct than total
      };
      
      expect(() => validateCreateObjectiveProgress(invalidData)).toThrow();
    });
  });
  
  describe('Response Helpers', () => {
    it('should create success response correctly', () => {
      const data = { id: '1', name: 'test' };
      const response = createSuccessResponse(data, 'Success message');
      
      expect(response).toBeDefined();
      // Note: In a real test environment, you might parse the response body
    });
    
    it('should create error response correctly', () => {
      const response = createErrorResponse('Test error', 'Error message', 400);
      
      expect(response).toBeDefined();
    });
    
    it('should create validation error response correctly', () => {
      const errors = [
        { field: 'name', message: 'Name is required', value: '' }
      ];
      const response = createValidationErrorResponse(errors);
      
      expect(response).toBeDefined();
    });
  });
});

describe('API Authentication', () => {
  
  describe('Token Extraction', () => {
    it('should extract Bearer token correctly', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Bearer test-token-123')
        }
      } as any;
      
      const token = extractToken(mockRequest);
      expect(token).toBe('test-token-123');
    });
    
    it('should extract Token header correctly', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Token test-token-456')
        }
      } as any;
      
      const token = extractToken(mockRequest);
      expect(token).toBe('test-token-456');
    });
    
    it('should return null for invalid auth header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue('Invalid header format')
        }
      } as any;
      
      const token = extractToken(mockRequest);
      expect(token).toBe(null);
    });
    
    it('should return null for missing auth header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        }
      } as any;
      
      const token = extractToken(mockRequest);
      expect(token).toBe(null);
    });
  });
  
  describe('API Key Extraction', () => {
    it('should extract API key from x-api-key header', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header) => {
            if (header === 'x-api-key') return 'test-api-key';
            return null;
          })
        },
        url: 'http://localhost:3000/api/test'
      } as any;
      
      const apiKey = extractApiKey(mockRequest);
      expect(apiKey).toBe('test-api-key');
    });
    
    it('should extract API key from query parameter', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockReturnValue(null)
        },
        url: 'http://localhost:3000/api/test?api_key=query-api-key'
      } as any;
      
      const apiKey = extractApiKey(mockRequest);
      expect(apiKey).toBe('query-api-key');
    });
    
    it('should prefer header over query parameter', () => {
      const mockRequest = {
        headers: {
          get: vi.fn().mockImplementation((header) => {
            if (header === 'x-api-key') return 'header-api-key';
            return null;
          })
        },
        url: 'http://localhost:3000/api/test?api_key=query-api-key'
      } as any;
      
      const apiKey = extractApiKey(mockRequest);
      expect(apiKey).toBe('header-api-key');
    });
  });
  
  describe('Role Authorization', () => {
    const mockUser = {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      role: 'student'
    };
    
    it('should allow access with correct role', () => {
      expect(() => requireRole(mockUser, 'student')).not.toThrow();
    });
    
    it('should deny access with incorrect role', () => {
      expect(() => requireRole(mockUser, 'admin')).toThrow(AuthorizationError);
    });
    
    it('should allow access with any of required roles', () => {
      expect(() => requireAnyRole(mockUser, ['student', 'teacher'])).not.toThrow();
    });
    
    it('should deny access without any required role', () => {
      expect(() => requireAnyRole(mockUser, ['admin', 'teacher'])).toThrow(AuthorizationError);
    });
    
    it('should handle user without role', () => {
      const userWithoutRole = { ...mockUser, role: undefined };
      expect(() => requireRole(userWithoutRole, 'student')).toThrow(AuthorizationError);
    });
  });
  
  describe('Authentication Errors', () => {
    it('should create AuthenticationError correctly', () => {
      const error = new AuthenticationError('Invalid token', 'TOKEN_INVALID');
      
      expect(error).toBeInstanceOf(AuthenticationError);
      expect(error.message).toBe('Invalid token');
      expect(error.code).toBe('TOKEN_INVALID');
      expect(error.name).toBe('AuthenticationError');
    });
    
    it('should create AuthorizationError correctly', () => {
      const error = new AuthorizationError('Access denied', 'INSUFFICIENT_ROLE');
      
      expect(error).toBeInstanceOf(AuthorizationError);
      expect(error.message).toBe('Access denied');
      expect(error.code).toBe('INSUFFICIENT_ROLE');
      expect(error.name).toBe('AuthorizationError');
    });
  });
});

describe('Integration Tests', () => {
  
  describe('Assessment Workflow', () => {
    it('should validate complete assessment creation workflow', () => {
      // Test valid assessment data
      const assessmentData = {
        title: 'Grammar Assessment',
        description: 'Test grammar knowledge',
        type: 'formative',
        lessonId: 'lesson-123',
        masteryThreshold: 0.8,
        maxAttempts: 3,
        timeLimit: 1800,
        isPublished: true
      };
      
      expect(() => validateCreateAssessment(assessmentData)).not.toThrow();
      
      // Test question data
      const questionData = {
        assessmentId: 'assessment-123',
        questionText: 'Choose the correct verb form.',
        type: 'multiple_choice',
        orderIndex: 0,
        questionData: {
          options: ['is', 'are', 'was', 'were'],
          shuffle: true
        },
        correctAnswer: 1,
        points: 1,
        difficulty: 'medium',
        feedback: 'The correct answer is "are" for plural subjects.'
      };
      
      expect(() => validateCreateAssessmentQuestion(questionData)).not.toThrow();
    });
  });
  
  describe('Progress Tracking Workflow', () => {
    it('should validate complete progress tracking workflow', () => {
      // Test lesson progress
      const progressData = {
        userId: 'user-123',
        lessonId: 'lesson-123',
        status: 'completed',
        currentScore: 0.85,
        bestScore: 0.9,
        masteryAchieved: true,
        masteryDate: '2025-08-12T10:00:00Z',
        totalTimeSpent: 2400,
        sessionsCount: 4,
        needsRemediation: false,
        eligibleForEnrichment: true
      };
      
      expect(() => validateCreateProgress(progressData)).not.toThrow();
      
      // Test objective progress
      const objectiveProgressData = {
        userId: 'user-123',
        objectiveId: 'objective-123',
        currentScore: 0.8,
        bestScore: 0.85,
        masteryAchieved: true,
        masteryDate: '2025-08-12T10:30:00Z',
        totalAttempts: 8,
        correctAttempts: 7
      };
      
      expect(() => validateCreateObjectiveProgress(objectiveProgressData)).not.toThrow();
    });
  });
  
  describe('Error Handling', () => {
    it('should handle multiple validation errors', () => {
      const invalidAssessmentData = {
        title: '', // Invalid: empty
        type: 'invalid', // Invalid: not in enum
        masteryThreshold: 1.5, // Invalid: > 1
        maxAttempts: -1, // Invalid: negative
        timeLimit: 'not a number' // Invalid: not a number
      };
      
      expect(() => validateCreateAssessment(invalidAssessmentData)).toThrow();
    });
    
    it('should handle nested validation errors', () => {
      const invalidQuestionData = {
        assessmentId: '', // Invalid: empty
        questionText: '', // Invalid: empty
        type: 'unknown', // Invalid: not in enum
        orderIndex: -1, // Invalid: negative
        questionData: 'invalid json', // Invalid: not JSON
        correctAnswer: 'invalid json' // Invalid: not JSON
      };
      
      expect(() => validateCreateAssessmentQuestion(invalidQuestionData)).toThrow();
    });
  });
});

describe('Type Safety', () => {
  
  it('should ensure type safety for assessment interfaces', () => {
    // This test ensures our validation returns correctly typed data
    const validData = {
      title: 'Test Assessment',
      type: 'formative' as const,
      description: 'Test description',
      masteryThreshold: 0.8,
      maxAttempts: 3
    };
    
    const result = validateCreateAssessment(validData);
    
    // TypeScript should infer the correct type
    expect(result.title).toBe('Test Assessment');
    expect(result.type).toBe('formative');
    expect(result.masteryThreshold).toBe(0.8);
  });
  
  it('should ensure type safety for progress interfaces', () => {
    const validData = {
      userId: 'user-1',
      lessonId: 'lesson-1',
      status: 'completed' as const,
      currentScore: 0.85,
      masteryAchieved: true
    };
    
    const result = validateCreateProgress(validData);
    
    expect(result.userId).toBe('user-1');
    expect(result.lessonId).toBe('lesson-1');
    expect(result.status).toBe('completed');
    expect(result.currentScore).toBe(0.85);
  });
});