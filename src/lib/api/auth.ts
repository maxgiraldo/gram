/**
 * API Authentication Middleware
 * 
 * Simple authentication middleware for API endpoints.
 * Supports JWT tokens and basic API key authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createErrorResponse } from './validation';
import { isFeatureEnabled } from '@/lib/config';

// ===== TYPES =====

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role?: string;
}

export interface AuthContext {
  user: AuthenticatedUser;
  token: string;
}

// ===== AUTHENTICATION ERRORS =====

export class AuthenticationError extends Error {
  constructor(message: string, public code: string = 'AUTH_FAILED') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code: string = 'ACCESS_DENIED') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// ===== TOKEN UTILITIES =====

/**
 * Extract authorization token from request headers
 */
export function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer <token>" and "Token <token>" formats
  const match = authHeader.match(/^(Bearer|Token)\s+(.+)$/i);
  return match ? match[2] : null;
}

/**
 * Extract API key from request headers or query params
 */
export function extractApiKey(request: NextRequest): string | null {
  // Check headers first
  const apiKey = request.headers.get('x-api-key') || request.headers.get('api-key');
  
  if (apiKey) {
    return apiKey;
  }
  
  // Check query parameters as fallback
  const { searchParams } = new URL(request.url);
  return searchParams.get('api_key') || searchParams.get('apiKey');
}

// ===== MOCK AUTHENTICATION =====

/**
 * Mock JWT verification (replace with real implementation)
 */
async function verifyJwtToken(token: string): Promise<AuthenticatedUser> {
  // This is a mock implementation
  // In a real app, you would verify the JWT signature and decode the payload
  
  if (!token || token.length < 10) {
    throw new AuthenticationError('Invalid token format');
  }
  
  // Mock user data (replace with real JWT decoding)
  if (token === 'mock-user-token') {
    return {
      id: 'user-1',
      email: 'user@example.com',
      name: 'Test User',
      role: 'student'
    };
  }
  
  if (token === 'mock-admin-token') {
    return {
      id: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'admin'
    };
  }
  
  throw new AuthenticationError('Invalid or expired token');
}

/**
 * Mock API key verification (replace with real implementation)
 */
async function verifyApiKey(apiKey: string): Promise<AuthenticatedUser> {
  // This is a mock implementation
  // In a real app, you would check the API key against your database
  
  if (!apiKey || apiKey.length < 10) {
    throw new AuthenticationError('Invalid API key format');
  }
  
  // Mock API key validation
  if (apiKey === 'test-api-key-123') {
    return {
      id: 'api-user-1',
      email: 'api@example.com',
      name: 'API User',
      role: 'api'
    };
  }
  
  throw new AuthenticationError('Invalid API key');
}

// ===== AUTHENTICATION METHODS =====

/**
 * Authenticate request using JWT token
 */
export async function authenticateWithToken(request: NextRequest): Promise<AuthContext> {
  const token = extractToken(request);
  
  if (!token) {
    throw new AuthenticationError('Authorization token required');
  }
  
  try {
    const user = await verifyJwtToken(token);
    return { user, token };
  } catch (error) {
    throw new AuthenticationError('Invalid or expired token');
  }
}

/**
 * Authenticate request using API key
 */
export async function authenticateWithApiKey(request: NextRequest): Promise<AuthContext> {
  const apiKey = extractApiKey(request);
  
  if (!apiKey) {
    throw new AuthenticationError('API key required');
  }
  
  try {
    const user = await verifyApiKey(apiKey);
    return { user, token: apiKey };
  } catch (error) {
    throw new AuthenticationError('Invalid API key');
  }
}

/**
 * Authenticate request using multiple methods
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthContext> {
  // Try token authentication first
  const token = extractToken(request);
  if (token) {
    try {
      return await authenticateWithToken(request);
    } catch (error) {
      // If token exists but is invalid, don't try other methods
      throw error;
    }
  }
  
  // Try API key authentication
  const apiKey = extractApiKey(request);
  if (apiKey) {
    return await authenticateWithApiKey(request);
  }
  
  throw new AuthenticationError('Authentication required - provide either Bearer token or API key');
}

// ===== AUTHORIZATION UTILITIES =====

/**
 * Check if user has required role
 */
export function requireRole(user: AuthenticatedUser, requiredRole: string): void {
  if (!user.role || user.role !== requiredRole) {
    throw new AuthorizationError(`Access denied - ${requiredRole} role required`);
  }
}

/**
 * Check if user has any of the required roles
 */
export function requireAnyRole(user: AuthenticatedUser, requiredRoles: string[]): void {
  if (!user.role || !requiredRoles.includes(user.role)) {
    throw new AuthorizationError(`Access denied - one of these roles required: ${requiredRoles.join(', ')}`);
  }
}

/**
 * Check if user can access resource (basic ownership check)
 */
export function requireResourceAccess(user: AuthenticatedUser, resourceUserId?: string): void {
  // Admin can access any resource
  if (user.role === 'admin') {
    return;
  }
  
  // User can access their own resources
  if (resourceUserId && user.id === resourceUserId) {
    return;
  }
  
  // API users have broader access
  if (user.role === 'api') {
    return;
  }
  
  throw new AuthorizationError('Access denied - insufficient permissions for this resource');
}

// ===== MIDDLEWARE FUNCTIONS =====

/**
 * Authentication middleware wrapper
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, auth: AuthContext, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Check if authentication is required
      const authRequired = isFeatureEnabled('userRegistration');
      
      if (!authRequired) {
        // Create mock auth context for development
        const mockAuth: AuthContext = {
          user: {
            id: 'dev-user',
            email: 'dev@example.com',
            name: 'Development User',
            role: 'admin'
          },
          token: 'dev-token'
        };
        return await handler(request, mockAuth, ...args);
      }
      
      const auth = await authenticateRequest(request);
      return await handler(request, auth, ...args);
      
    } catch (error) {
      if (error instanceof AuthenticationError) {
        return createErrorResponse(
          'Authentication failed',
          error.message,
          401
        );
      }
      
      if (error instanceof AuthorizationError) {
        return createErrorResponse(
          'Access denied',
          error.message,
          403
        );
      }
      
      console.error('Authentication middleware error:', error);
      return createErrorResponse(
        'Authentication error',
        'Internal authentication error',
        500
      );
    }
  };
}

/**
 * Optional authentication middleware (allows unauthenticated access)
 */
export function withOptionalAuth<T extends any[]>(
  handler: (request: NextRequest, auth: AuthContext | null, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      // Try to authenticate, but don't fail if no auth provided
      const token = extractToken(request);
      const apiKey = extractApiKey(request);
      
      if (!token && !apiKey) {
        return await handler(request, null, ...args);
      }
      
      const auth = await authenticateRequest(request);
      return await handler(request, auth, ...args);
      
    } catch (error) {
      // If authentication fails but was attempted, return error
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return await handler(request, null, ...args);
      }
      
      console.error('Optional authentication middleware error:', error);
      return createErrorResponse(
        'Authentication error',
        'Internal authentication error',
        500
      );
    }
  };
}

/**
 * Role-based authentication middleware
 */
export function withRoleAuth<T extends any[]>(
  requiredRoles: string | string[],
  handler: (request: NextRequest, auth: AuthContext, ...args: T) => Promise<NextResponse>
) {
  const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  
  return withAuth(async (request: NextRequest, auth: AuthContext, ...args: T) => {
    try {
      requireAnyRole(auth.user, roles);
      return await handler(request, auth, ...args);
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return createErrorResponse(
          'Access denied',
          error.message,
          403
        );
      }
      throw error;
    }
  });
}

// ===== UTILITY FUNCTIONS =====

/**
 * Extract user ID from various sources (auth context, query params, body)
 */
export function extractUserId(
  request: NextRequest,
  auth: AuthContext | null,
  body?: any
): string | null {
  // Check authenticated user first
  if (auth?.user?.id) {
    return auth.user.id;
  }
  
  // Check query parameters
  const { searchParams } = new URL(request.url);
  const userIdFromQuery = searchParams.get('userId');
  if (userIdFromQuery) {
    return userIdFromQuery;
  }
  
  // Check request body
  if (body?.userId) {
    return body.userId;
  }
  
  return null;
}

/**
 * Validate user access to resource
 */
export function validateUserAccess(
  auth: AuthContext,
  resourceUserId: string,
  allowSelfAccess = true
): void {
  // Admin has access to everything
  if (auth.user.role === 'admin') {
    return;
  }
  
  // API users have broad access
  if (auth.user.role === 'api') {
    return;
  }
  
  // Check self-access
  if (allowSelfAccess && auth.user.id === resourceUserId) {
    return;
  }
  
  throw new AuthorizationError('Access denied - insufficient permissions for this user resource');
}