/**
 * Database Provider Abstraction Tests
 * 
 * Tests the database provider abstraction layer to ensure it works
 * correctly with both SQLite and PostgreSQL configurations.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { 
  detectProvider, 
  getDatabaseConfig, 
  createDatabaseProvider,
  executeOptimizedQuery,
  type DatabaseProvider 
} from '../providers';
import { 
  loadEnvironmentConfig, 
  validateDatabaseUrl, 
  createValidatedDatabaseConfig 
} from '../config';

// Mock environment variables for testing
const originalEnv = process.env;

beforeEach(() => {
  // Reset environment for each test
  process.env = { ...originalEnv };
});

afterEach(() => {
  // Restore original environment
  process.env = originalEnv;
});

describe('Database Provider Detection', () => {
  test('detects SQLite from file URL', () => {
    process.env.DATABASE_URL = 'file:./test.db';
    expect(detectProvider()).toBe('sqlite');
  });

  test('detects SQLite from .db filename', () => {
    process.env.DATABASE_URL = './test.db';
    expect(detectProvider()).toBe('sqlite');
  });

  test('detects PostgreSQL from postgresql:// URL', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    expect(detectProvider()).toBe('postgresql');
  });

  test('detects PostgreSQL from postgres:// URL', () => {
    process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
    expect(detectProvider()).toBe('postgresql');
  });

  test('defaults to SQLite for unknown formats', () => {
    process.env.DATABASE_URL = 'unknown://test';
    expect(detectProvider()).toBe('sqlite');
  });

  test('defaults to SQLite when no URL provided', () => {
    delete process.env.DATABASE_URL;
    expect(detectProvider()).toBe('sqlite');
  });
});

describe('Database Configuration', () => {
  test('creates SQLite configuration', () => {
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.NODE_ENV = 'development';
    
    const config = getDatabaseConfig();
    
    expect(config.provider).toBe('sqlite');
    expect(config.url).toBe('file:./test.db');
    expect(config.logLevel).toBe('query');
  });

  test('creates PostgreSQL configuration with defaults', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.NODE_ENV = 'production';
    
    const config = getDatabaseConfig();
    
    expect(config.provider).toBe('postgresql');
    expect(config.url).toBe('postgresql://user:pass@localhost:5432/db');
    expect(config.logLevel).toBe('error');
    expect(config.ssl).toBe(false);
    expect(config.poolSize).toBe(10);
  });

  test('creates PostgreSQL configuration with custom settings', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.DATABASE_SSL = 'true';
    process.env.DATABASE_POOL_SIZE = '20';
    process.env.DATABASE_CONNECTION_TIMEOUT = '10000';
    process.env.DATABASE_QUERY_TIMEOUT = '60000';
    
    const config = getDatabaseConfig();
    
    expect(config.ssl).toBe(true);
    expect(config.poolSize).toBe(20);
    expect(config.connectionTimeout).toBe(10000);
    expect(config.queryTimeout).toBe(60000);
  });
});

describe('URL Validation', () => {
  test('validates correct PostgreSQL URLs', () => {
    const testCases = [
      'postgresql://user:pass@localhost:5432/database',
      'postgres://user:pass@example.com:5432/mydb',
    ];
    
    testCases.forEach(url => {
      const result = validateDatabaseUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('postgresql');
      expect(result.errors).toHaveLength(0);
    });
  });

  test('validates correct SQLite URLs', () => {
    const testCases = [
      'file:./database.db',
      'file:./path/to/db.sqlite',
      './local.db',
    ];
    
    testCases.forEach(url => {
      const result = validateDatabaseUrl(url);
      expect(result.isValid).toBe(true);
      expect(result.provider).toBe('sqlite');
      expect(result.errors).toHaveLength(0);
    });
  });

  test('rejects invalid URLs', () => {
    const testCases = [
      '',
      'invalid://url',
      'postgresql://incomplete',
      'file:',
    ];
    
    testCases.forEach(url => {
      const result = validateDatabaseUrl(url);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

describe('Environment Configuration Loading', () => {
  test('loads valid environment configuration', () => {
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.NODE_ENV = 'development';
    process.env.DATABASE_SSL = 'true';
    process.env.DATABASE_POOL_SIZE = '15';
    
    const config = loadEnvironmentConfig();
    
    expect(config.databaseUrl).toBe('file:./test.db');
    expect(config.nodeEnv).toBe('development');
    expect(config.ssl).toBe(true);
    expect(config.poolSize).toBe(15);
  });

  test('throws error for invalid pool size', () => {
    process.env.DATABASE_POOL_SIZE = 'invalid';
    
    expect(() => loadEnvironmentConfig()).toThrow(/DATABASE_POOL_SIZE/);
  });

  test('throws error for invalid timeout values', () => {
    process.env.DATABASE_CONNECTION_TIMEOUT = '500'; // Too low
    
    expect(() => loadEnvironmentConfig()).toThrow(/DATABASE_CONNECTION_TIMEOUT/);
  });

  test('throws error for invalid log level', () => {
    process.env.LOG_LEVEL = 'invalid';
    
    expect(() => loadEnvironmentConfig()).toThrow(/LOG_LEVEL/);
  });
});

describe('Provider Factory', () => {
  test('creates SQLite provider', () => {
    const provider = createDatabaseProvider('sqlite');
    expect(provider).toBeDefined();
    
    const features = provider.getProviderFeatures();
    expect(features.supportsJsonQueries).toBe(true);
    expect(features.supportsFullTextSearch).toBe(false);
    expect(features.maxConnections).toBe(1);
  });

  test('creates PostgreSQL provider', () => {
    const provider = createDatabaseProvider('postgresql');
    expect(provider).toBeDefined();
    
    const features = provider.getProviderFeatures();
    expect(features.supportsJsonQueries).toBe(true);
    expect(features.supportsFullTextSearch).toBe(true);
    expect(features.maxConnections).toBe(100);
  });

  test('throws error for unsupported provider', () => {
    expect(() => createDatabaseProvider('unsupported' as DatabaseProvider))
      .toThrow(/Unsupported database provider/);
  });
});

describe('Query Optimization', () => {
  test('executes optimized query with timing', async () => {
    const mockQuery = () => Promise.resolve('test result');
    
    const result = await executeOptimizedQuery(mockQuery, 'sqlite');
    expect(result).toBe('test result');
  });

  test('handles query errors gracefully', async () => {
    const mockQuery = () => Promise.reject(new Error('Query failed'));
    
    await expect(executeOptimizedQuery(mockQuery, 'sqlite'))
      .rejects.toThrow('Query failed');
  });
});

describe('Configuration Validation', () => {
  test('creates validated configuration for SQLite', () => {
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.NODE_ENV = 'development';
    
    const config = createValidatedDatabaseConfig();
    
    expect(config.provider).toBe('sqlite');
    expect(config.url).toBe('file:./test.db');
    expect(config.logLevel).toBe('query');
  });

  test('creates validated configuration for PostgreSQL', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_SSL = 'true';
    
    const config = createValidatedDatabaseConfig();
    
    expect(config.provider).toBe('postgresql');
    expect(config.ssl).toBe(true);
    expect(config.logLevel).toBe('error');
  });

  test('throws error for invalid configuration', () => {
    process.env.DATABASE_URL = 'invalid://url';
    
    expect(() => createValidatedDatabaseConfig())
      .toThrow(/Invalid database configuration/);
  });
});

describe('Provider Features', () => {
  test('SQLite features are correctly defined', () => {
    const provider = createDatabaseProvider('sqlite');
    const features = provider.getProviderFeatures();
    
    expect(features).toEqual({
      supportsJsonQueries: true,
      supportsFullTextSearch: false,
      supportsArrayOperations: false,
      supportsTransactions: true,
      maxConnections: 1,
      optimalBatchSize: 100,
    });
  });

  test('PostgreSQL features are correctly defined', () => {
    const provider = createDatabaseProvider('postgresql');
    const features = provider.getProviderFeatures();
    
    expect(features).toEqual({
      supportsJsonQueries: true,
      supportsFullTextSearch: true,
      supportsArrayOperations: true,
      supportsTransactions: true,
      maxConnections: 100,
      optimalBatchSize: 1000,
    });
  });
});