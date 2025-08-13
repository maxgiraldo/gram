/**
 * Database Provider Abstraction Layer
 * 
 * Unified interface for multiple database providers with environment-based
 * selection and provider-specific optimizations.
 */

// ===== BASE EXPORTS =====

export {
  type DatabaseProvider,
  type DatabaseConfig,
  type SQLiteConfig,
  type PostgreSQLConfig,
  type TableInfo,
  type IndexInfo,
  type ColumnInfo,
  type ConstraintInfo,
  type TableStatistics,
  type ProviderFeatures,
  type ProviderCapabilities,
  DatabaseProviderType,
  BaseProvider,
  DatabaseProviderError,
  ProviderConnectionError,
  ProviderConfigurationError,
  ProviderMigrationError
} from './base';

// ===== PROVIDER IMPLEMENTATIONS =====

export { SQLiteProvider } from './sqlite';
export { PostgreSQLProvider } from './postgresql';

// ===== FACTORY EXPORTS =====

export {
  parseProviderFromUrl,
  createDatabaseConfig,
  createDatabaseProvider,
  createConnectedProvider,
  createDatabaseClient,
  getDatabaseConfig,
  getProviderCapabilities,
  executeOptimizedQuery,
  checkMigrationStatus,
  runDatabaseMigrations,
  performHealthCheck,
  providerRegistry
} from './factory';

// ===== CONVENIENCE EXPORTS =====

import { createDatabaseConfig, createDatabaseClient } from './factory';
import { DatabaseProviderType } from './base';
import type { SQLiteConfig, PostgreSQLConfig, DatabaseConfig } from './base';

/**
 * Get current database provider type from environment
 */
export function getCurrentProviderType(): DatabaseProviderType {
  const config = createDatabaseConfig();
  return config.provider;
}

/**
 * Create default database client for current environment
 */
export function createDefaultClient() {
  return createDatabaseClient();
}

/**
 * Quick provider setup for common scenarios
 */
export const ProviderPresets = {
  /**
   * SQLite for local development
   */
  localDevelopment: (): SQLiteConfig => ({
    provider: DatabaseProviderType.SQLITE,
    url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    journal: 'WAL',
    synchronous: 'NORMAL',
    timeout: 30000,
    busyTimeout: 10000,
    cache: 'shared',
    logging: true
  }),
  
  /**
   * SQLite for testing (in-memory)
   */
  testing: (): SQLiteConfig => ({
    provider: DatabaseProviderType.SQLITE,
    url: 'file::memory:?cache=shared',
    journal: 'MEMORY',
    synchronous: 'OFF',
    timeout: 5000,
    logging: false
  }),
  
  /**
   * PostgreSQL for production
   */
  production: (): PostgreSQLConfig => ({
    provider: DatabaseProviderType.POSTGRESQL,
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/gram_prod',
    applicationName: 'gram-learning-platform',
    statementTimeout: 60000,
    queryTimeout: 30000,
    connectionTimeout: 10000,
    pool: {
      min: 5,
      max: 20,
      timeout: 30000
    },
    logging: false
  }),
  
  /**
   * PostgreSQL for staging
   */
  staging: (): PostgreSQLConfig => ({
    provider: DatabaseProviderType.POSTGRESQL,
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/gram_staging',
    applicationName: 'gram-learning-platform-staging',
    statementTimeout: 30000,
    queryTimeout: 15000,
    connectionTimeout: 5000,
    pool: {
      min: 2,
      max: 10,
      timeout: 15000
    },
    logging: true
  })
};

/**
 * Environment-based preset selection
 */
export function getEnvironmentPreset(): DatabaseConfig {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'test':
    case 'testing':
      return ProviderPresets.testing();
    
    case 'production':
      return ProviderPresets.production();
    
    case 'staging':
      return ProviderPresets.staging();
    
    case 'development':
    default:
      return ProviderPresets.localDevelopment();
  }
}