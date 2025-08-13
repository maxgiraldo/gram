/**
 * Database Client Configuration
 * 
 * Centralized Prisma client management with provider abstraction,
 * connection pooling, error handling, and proper lifecycle management 
 * for the grammar learning platform.
 */

import { PrismaClient } from '@prisma/client';
import { 
  createDatabaseClient, 
  getDatabaseConfig, 
  executeOptimizedQuery,
  type DatabaseProvider,
  type ProviderFeatures 
} from './providers';

// ===== GLOBAL CONFIGURATION =====

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  provider: DatabaseProvider | undefined;
  features: ProviderFeatures | undefined;
};

// ===== CLIENT CONFIGURATION =====

/**
 * Create database client with provider abstraction
 */
const createDatabaseClientWithProvider = () => {
  const { client, provider, features } = createDatabaseClient();
  
  // Store provider info globally for optimization
  globalForPrisma.provider = provider;
  globalForPrisma.features = features;
  
  return client;
};

/**
 * Fallback client creation for compatibility
 */
const createPrismaClient = () => {
  const config = getDatabaseConfig();
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: 'pretty',
  });
};

/**
 * Global Prisma client instance with provider abstraction
 * In development, use global variable to prevent hot reload issues
 * In production, create new instance each time
 */
export const prisma = globalForPrisma.prisma ?? createDatabaseClientWithProvider();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// ===== PROVIDER INFORMATION =====

/**
 * Get current database provider
 */
export function getDatabaseProvider(): DatabaseProvider {
  return globalForPrisma.provider || 'sqlite';
}

/**
 * Get provider features for optimization
 */
export function getProviderFeatures(): ProviderFeatures {
  return globalForPrisma.features || {
    supportsJsonQueries: true,
    supportsFullTextSearch: false,
    supportsArrayOperations: false,
    supportsTransactions: true,
    maxConnections: 1,
    optimalBatchSize: 100,
  };
}

// ===== CONNECTION MANAGEMENT =====

/**
 * Database connection health check
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Graceful database disconnection
 */
export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

/**
 * Database initialization and migration check
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Check if database is accessible
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Cannot connect to database');
    }

    // Run pending migrations in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Checking for database migrations...');
      // Note: In a real app, you might want to run migrations programmatically
      // For now, we'll assume migrations are handled via CLI
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

// ===== TRANSACTION UTILITIES =====

/**
 * Execute multiple operations in a transaction with proper error handling
 */
export async function executeTransaction<T>(
  operations: (tx: any) => Promise<T>
): Promise<T> {
  try {
    return await prisma.$transaction(async (tx) => {
      return await operations(tx);
    });
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
}

/**
 * Execute operations with retry logic for transient failures
 */
export async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain error types
      if (isNonRetryableError(error)) {
        throw error;
      }

      if (attempt < maxRetries) {
        console.warn(`Database operation failed (attempt ${attempt}/${maxRetries}), retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // Exponential backoff
      }
    }
  }

  throw lastError!;
}

/**
 * Check if an error should not be retried
 */
function isNonRetryableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const errorMessage = (error as Error).message?.toLowerCase() || '';
  
  // Don't retry validation errors, constraint violations, etc.
  return (
    errorMessage.includes('unique constraint') ||
    errorMessage.includes('foreign key constraint') ||
    errorMessage.includes('check constraint') ||
    errorMessage.includes('not found') ||
    errorMessage.includes('invalid')
  );
}

// ===== QUERY UTILITIES =====

/**
 * Safe query execution with error handling, logging, and provider optimization
 */
export async function executeQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    // Use provider-specific optimizations
    const result = await executeOptimizedQuery(queryFn, globalForPrisma.provider);
    const duration = Date.now() - startTime;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Query ${queryName} (${globalForPrisma.provider || 'unknown'}) completed in ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Paginated query helper
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextCursor?: string;
    prevCursor?: string;
  };
}

/**
 * Execute paginated query with consistent pagination logic
 */
export async function executePaginatedQuery<T>(
  queryName: string,
  countQuery: () => Promise<number>,
  dataQuery: (skip: number, take: number) => Promise<T[]>,
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(100, Math.max(1, options.limit || 10));
  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    countQuery(),
    dataQuery(skip, limit)
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      // Cursor-based pagination would be implemented here if needed
    }
  };
}

// ===== ERROR TYPES =====

/**
 * Custom database error class
 */
export class DatabaseError extends Error {
  constructor(
    message: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

/**
 * Validation error for database operations
 */
export class ValidationError extends DatabaseError {
  constructor(
    message: string,
    operation: string,
    public field?: string
  ) {
    super(message, operation);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error for database queries
 */
export class NotFoundError extends DatabaseError {
  constructor(
    resource: string,
    identifier: string,
    operation: string = 'find'
  ) {
    super(`${resource} with identifier ${identifier} not found`, operation);
    this.name = 'NotFoundError';
  }
}

// ===== CLEANUP ON EXIT =====

process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
  process.exit(0);
});
