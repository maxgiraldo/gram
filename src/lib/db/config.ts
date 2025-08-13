/**
 * Database Configuration Management
 * 
 * Validates and manages database configuration with environment-based
 * provider selection and validation.
 */

import { DatabaseProvider, DatabaseConfig } from './providers';

// ===== CONFIGURATION VALIDATION =====

export interface EnvironmentConfig {
  databaseUrl: string;
  nodeEnv: string;
  ssl?: boolean;
  poolSize?: number;
  connectionTimeout?: number;
  queryTimeout?: number;
  logLevel?: string;
}

/**
 * Load and validate environment configuration
 */
export function loadEnvironmentConfig(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
    nodeEnv: process.env.NODE_ENV || 'development',
  };

  // Optional SSL configuration
  if (process.env.DATABASE_SSL) {
    config.ssl = process.env.DATABASE_SSL === 'true';
  }

  // Optional pool configuration
  if (process.env.DATABASE_POOL_SIZE) {
    const poolSize = parseInt(process.env.DATABASE_POOL_SIZE, 10);
    if (isNaN(poolSize) || poolSize < 1 || poolSize > 100) {
      throw new Error('DATABASE_POOL_SIZE must be a number between 1 and 100');
    }
    config.poolSize = poolSize;
  }

  // Optional timeout configuration
  if (process.env.DATABASE_CONNECTION_TIMEOUT) {
    const timeout = parseInt(process.env.DATABASE_CONNECTION_TIMEOUT, 10);
    if (isNaN(timeout) || timeout < 1000) {
      throw new Error('DATABASE_CONNECTION_TIMEOUT must be at least 1000ms');
    }
    config.connectionTimeout = timeout;
  }

  if (process.env.DATABASE_QUERY_TIMEOUT) {
    const timeout = parseInt(process.env.DATABASE_QUERY_TIMEOUT, 10);
    if (isNaN(timeout) || timeout < 1000) {
      throw new Error('DATABASE_QUERY_TIMEOUT must be at least 1000ms');
    }
    config.queryTimeout = timeout;
  }

  // Optional log level
  if (process.env.LOG_LEVEL) {
    const validLevels = ['error', 'warn', 'info', 'query'];
    if (!validLevels.includes(process.env.LOG_LEVEL)) {
      throw new Error(`LOG_LEVEL must be one of: ${validLevels.join(', ')}`);
    }
    config.logLevel = process.env.LOG_LEVEL;
  }

  return config;
}

/**
 * Validate database URL format
 */
export function validateDatabaseUrl(url: string): {
  isValid: boolean;
  provider: DatabaseProvider | null;
  errors: string[];
} {
  const errors: string[] = [];
  let provider: DatabaseProvider | null = null;

  if (!url) {
    errors.push('Database URL is required');
    return { isValid: false, provider, errors };
  }

  // Check for PostgreSQL
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    provider = 'postgresql';
    
    // Basic PostgreSQL URL validation
    const pgRegex = /^postgres(ql)?:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    if (!pgRegex.test(url)) {
      errors.push('Invalid PostgreSQL connection string format');
    }
  }
  // Check for SQLite
  else if (url.startsWith('file:') || url.includes('.db') || !url.includes('://')) {
    provider = 'sqlite';
    
    // SQLite validation - file path should be valid
    if (url.startsWith('file:')) {
      const filePath = url.replace('file:', '');
      if (!filePath || filePath.trim() === '') {
        errors.push('SQLite file path cannot be empty');
      }
    }
  }
  else {
    errors.push(`Unsupported database URL format: ${url}`);
  }

  return {
    isValid: errors.length === 0,
    provider,
    errors
  };
}

/**
 * Create validated database configuration
 */
export function createValidatedDatabaseConfig(): DatabaseConfig {
  const envConfig = loadEnvironmentConfig();
  const urlValidation = validateDatabaseUrl(envConfig.databaseUrl);

  if (!urlValidation.isValid) {
    throw new Error(
      `Invalid database configuration:\n${urlValidation.errors.join('\n')}`
    );
  }

  const config: DatabaseConfig = {
    provider: urlValidation.provider!,
    url: envConfig.databaseUrl,
    logLevel: (envConfig.logLevel as any) || (envConfig.nodeEnv === 'development' ? 'query' : 'error'),
  };

  // Add provider-specific configuration
  if (urlValidation.provider === 'postgresql') {
    if (envConfig.ssl !== undefined) config.ssl = envConfig.ssl;
    if (envConfig.poolSize !== undefined) config.poolSize = envConfig.poolSize;
    if (envConfig.connectionTimeout !== undefined) config.connectionTimeout = envConfig.connectionTimeout;
    if (envConfig.queryTimeout !== undefined) config.queryTimeout = envConfig.queryTimeout;
  }

  return config;
}

/**
 * Get recommended configuration for environment
 */
export function getRecommendedConfig(environment: 'development' | 'test' | 'production'): Partial<DatabaseConfig> {
  const baseConfigs = {
    development: {
      provider: 'sqlite' as DatabaseProvider,
      url: 'file:./dev.db',
      logLevel: 'query' as const,
    },
    test: {
      provider: 'sqlite' as DatabaseProvider,
      url: 'file:./test.db',
      logLevel: 'error' as const,
    },
    production: {
      provider: 'postgresql' as DatabaseProvider,
      ssl: true,
      poolSize: 20,
      connectionTimeout: 5000,
      queryTimeout: 30000,
      logLevel: 'error' as const,
    },
  };

  return baseConfigs[environment];
}

/**
 * Print configuration summary for debugging
 */
export function printConfigSummary(config: DatabaseConfig): void {
  console.log('📊 Database Configuration Summary:');
  console.log(`  Provider: ${config.provider}`);
  console.log(`  URL: ${config.url.replace(/:[^:@]+@/, ':****@')}`); // Hide password
  console.log(`  Log Level: ${config.logLevel}`);
  
  if (config.provider === 'postgresql') {
    console.log(`  SSL: ${config.ssl ? 'enabled' : 'disabled'}`);
    if (config.poolSize) console.log(`  Pool Size: ${config.poolSize}`);
    if (config.connectionTimeout) console.log(`  Connection Timeout: ${config.connectionTimeout}ms`);
    if (config.queryTimeout) console.log(`  Query Timeout: ${config.queryTimeout}ms`);
  }
}