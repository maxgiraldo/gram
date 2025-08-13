/**
 * Database Provider Factory
 * 
 * Environment-based database provider selection and configuration
 * with unified interface for the grammar learning platform.
 */

import { PrismaClient } from '@prisma/client';
import { 
  DatabaseProvider,
  DatabaseProviderType,
  DatabaseConfig,
  SQLiteConfig,
  PostgreSQLConfig,
  ProviderConfigurationError,
  ProviderFeatures,
  ProviderCapabilities
} from './base';
import { SQLiteProvider } from './sqlite';
import { PostgreSQLProvider } from './postgresql';

// ===== ENVIRONMENT CONFIGURATION =====

/**
 * Parse database URL to determine provider type
 */
export function parseProviderFromUrl(url: string): DatabaseProviderType {
  if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
    return DatabaseProviderType.POSTGRESQL;
  }
  if (url.startsWith('file:') || url.endsWith('.db') || url.endsWith('.sqlite')) {
    return DatabaseProviderType.SQLITE;
  }
  if (url.startsWith('mysql://')) {
    return DatabaseProviderType.MYSQL;
  }
  
  // Default to SQLite for local development
  return DatabaseProviderType.SQLITE;
}

/**
 * Create database configuration from environment variables
 */
export function createDatabaseConfig(): DatabaseConfig {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    throw new ProviderConfigurationError(
      'Environment', 
      'DATABASE_URL environment variable is required'
    );
  }
  
  const provider = parseProviderFromUrl(databaseUrl);
  
  const baseConfig: DatabaseConfig = {
    provider,
    url: databaseUrl,
    logging: process.env.DATABASE_LOGGING === 'true' || process.env.NODE_ENV === 'development'
  };
  
  switch (provider) {
    case DatabaseProviderType.SQLITE:
      return createSQLiteConfig(baseConfig);
    
    case DatabaseProviderType.POSTGRESQL:
      return createPostgreSQLConfig(baseConfig);
    
    case DatabaseProviderType.MYSQL:
      throw new ProviderConfigurationError('Factory', 'MySQL provider not yet implemented');
    
    default:
      throw new ProviderConfigurationError('Factory', `Unsupported provider: ${provider}`);
  }
}

/**
 * Create SQLite-specific configuration
 */
function createSQLiteConfig(baseConfig: DatabaseConfig): SQLiteConfig {
  return {
    ...baseConfig,
    provider: DatabaseProviderType.SQLITE,
    journal: (process.env.SQLITE_JOURNAL_MODE as any) || 'WAL',
    synchronous: (process.env.SQLITE_SYNCHRONOUS as any) || 'NORMAL',
    timeout: parseInt(process.env.SQLITE_TIMEOUT || '30000'),
    busyTimeout: parseInt(process.env.SQLITE_BUSY_TIMEOUT || '10000'),
    cache: (process.env.SQLITE_CACHE as any) || 'shared'
  };
}

/**
 * Create PostgreSQL-specific configuration
 */
function createPostgreSQLConfig(baseConfig: DatabaseConfig): PostgreSQLConfig {
  return {
    ...baseConfig,
    provider: DatabaseProviderType.POSTGRESQL,
    applicationName: process.env.POSTGRES_APP_NAME || 'gram-learning-platform',
    searchPath: process.env.POSTGRES_SEARCH_PATH?.split(','),
    statementTimeout: parseInt(process.env.POSTGRES_STATEMENT_TIMEOUT || '60000'),
    queryTimeout: parseInt(process.env.POSTGRES_QUERY_TIMEOUT || '30000'),
    connectionTimeout: parseInt(process.env.POSTGRES_CONNECTION_TIMEOUT || '10000'),
    idleTimeout: parseInt(process.env.POSTGRES_IDLE_TIMEOUT || '300000'),
    pool: {
      min: parseInt(process.env.POSTGRES_POOL_MIN || '2'),
      max: parseInt(process.env.POSTGRES_POOL_MAX || '10'),
      timeout: parseInt(process.env.POSTGRES_POOL_TIMEOUT || '30000')
    }
  };
}

// ===== PROVIDER FACTORY =====

/**
 * Create database provider based on configuration
 */
export function createDatabaseProvider(config?: DatabaseConfig): DatabaseProvider {
  const dbConfig = config || createDatabaseConfig();
  
  switch (dbConfig.provider) {
    case DatabaseProviderType.SQLITE:
      return new SQLiteProvider(dbConfig as SQLiteConfig);
    
    case DatabaseProviderType.POSTGRESQL:
      return new PostgreSQLProvider(dbConfig as PostgreSQLConfig);
    
    case DatabaseProviderType.MYSQL:
      throw new ProviderConfigurationError('Factory', 'MySQL provider not yet implemented');
    
    default:
      throw new ProviderConfigurationError('Factory', `Unsupported provider: ${dbConfig.provider}`);
  }
}

/**
 * Create connected database client with provider abstraction
 */
export async function createConnectedProvider(config?: DatabaseConfig): Promise<DatabaseProvider> {
  const provider = createDatabaseProvider(config);
  await provider.connect();
  return provider;
}

// ===== UNIFIED CLIENT INTERFACE =====

/**
 * Create Prisma client with provider abstraction
 */
export function createDatabaseClient(config?: DatabaseConfig): {
  client: PrismaClient;
  provider: DatabaseProvider;
  features: ProviderFeatures;
} {
  const dbConfig = config || createDatabaseConfig();
  const provider = createDatabaseProvider(dbConfig);
  
  // Get provider capabilities
  const capabilities = getProviderCapabilities(dbConfig.provider);
  
  // Create optimized Prisma client
  const client = new PrismaClient({
    datasources: {
      db: {
        url: dbConfig.url
      }
    },
    log: dbConfig.logging 
      ? (Array.isArray(dbConfig.logging) 
          ? dbConfig.logging as any[] 
          : ['query', 'info', 'warn', 'error'])
      : ['error'],
    errorFormat: 'pretty'
  });
  
  return {
    client,
    provider,
    features: capabilities.features
  };
}

/**
 * Get database configuration for current environment
 */
export function getDatabaseConfig(): DatabaseConfig {
  return createDatabaseConfig();
}

// ===== PROVIDER CAPABILITIES =====

/**
 * Get capabilities for a specific provider type
 */
export function getProviderCapabilities(providerType: DatabaseProviderType): ProviderCapabilities {
  switch (providerType) {
    case DatabaseProviderType.SQLITE:
      return SQLiteProvider.getCapabilities();
    
    case DatabaseProviderType.POSTGRESQL:
      return PostgreSQLProvider.getCapabilities();
    
    default:
      throw new ProviderConfigurationError('Factory', `Capabilities not available for provider: ${providerType}`);
  }
}

/**
 * Get optimized query execution function for provider
 */
export async function executeOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  provider?: DatabaseProvider | string
): Promise<T> {
  if (!provider) {
    // Fallback to direct execution
    return await queryFn();
  }
  
  const providerName = typeof provider === 'string' ? provider : provider.name;
  
  // Provider-specific optimizations
  switch (providerName) {
    case 'SQLite':
      // SQLite optimizations
      return await executeSQLiteOptimizedQuery(queryFn);
    
    case 'PostgreSQL':
      // PostgreSQL optimizations
      return await executePostgreSQLOptimizedQuery(queryFn);
    
    default:
      return await queryFn();
  }
}

/**
 * SQLite-specific query optimizations
 */
async function executeSQLiteOptimizedQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  // For SQLite, we can use WAL mode checkpoints and optimize for single-writer scenarios
  return await queryFn();
}

/**
 * PostgreSQL-specific query optimizations
 */
async function executePostgreSQLOptimizedQuery<T>(queryFn: () => Promise<T>): Promise<T> {
  // For PostgreSQL, we can use connection pooling and query planning optimizations
  return await queryFn();
}

// ===== MIGRATION UTILITIES =====

/**
 * Check if database needs migrations
 */
export async function checkMigrationStatus(provider: DatabaseProvider): Promise<{
  needsMigration: boolean;
  currentVersion?: string;
  targetVersion?: string;
  pendingMigrations?: string[];
}> {
  try {
    await provider.runMigrations();
    return {
      needsMigration: false,
      currentVersion: '1.0.0', // Would be determined from actual migration system
      targetVersion: '1.0.0'
    };
  } catch (error) {
    return {
      needsMigration: true,
      currentVersion: 'unknown',
      targetVersion: '1.0.0',
      pendingMigrations: ['initial_schema']
    };
  }
}

/**
 * Run database migrations for a provider
 */
export async function runDatabaseMigrations(provider: DatabaseProvider): Promise<void> {
  try {
    await provider.runMigrations();
    console.log(`[${provider.name}] Migrations completed successfully`);
  } catch (error) {
    console.error(`[${provider.name}] Migration failed:`, error);
    throw error;
  }
}

// ===== HEALTH CHECK UTILITIES =====

/**
 * Comprehensive database health check
 */
export async function performHealthCheck(provider: DatabaseProvider): Promise<{
  healthy: boolean;
  provider: string;
  version: string;
  capabilities: ProviderFeatures;
  performance: {
    connectionTime: number;
    queryTime: number;
  };
  issues: string[];
}> {
  const startTime = Date.now();
  const issues: string[] = [];
  
  try {
    // Test basic connection
    const connectStart = Date.now();
    const isHealthy = await provider.healthCheck();
    const connectionTime = Date.now() - connectStart;
    
    if (!isHealthy) {
      issues.push('Basic health check failed');
    }
    
    // Test simple query performance
    const queryStart = Date.now();
    const client = provider.getClient();
    await client.$queryRaw`SELECT 1`;
    const queryTime = Date.now() - queryStart;
    
    if (queryTime > 1000) {
      issues.push('Slow query performance detected');
    }
    
    // Get provider capabilities
    const capabilities = getProviderCapabilities(provider.type);
    
    return {
      healthy: isHealthy && issues.length === 0,
      provider: provider.name,
      version: provider.version,
      capabilities: capabilities.features,
      performance: {
        connectionTime,
        queryTime
      },
      issues
    };
  } catch (error) {
    issues.push(`Health check error: ${error}`);
    
    return {
      healthy: false,
      provider: provider.name,
      version: provider.version,
      capabilities: {} as ProviderFeatures,
      performance: {
        connectionTime: Date.now() - startTime,
        queryTime: -1
      },
      issues
    };
  }
}

// ===== PROVIDER REGISTRY =====

class DatabaseProviderRegistry {
  private providers = new Map<string, DatabaseProvider>();
  
  register(provider: DatabaseProvider): void {
    this.providers.set(provider.name.toLowerCase(), provider);
  }
  
  unregister(name: string): void {
    this.providers.delete(name.toLowerCase());
  }
  
  get(name: string): DatabaseProvider | undefined {
    return this.providers.get(name.toLowerCase());
  }
  
  list(): DatabaseProvider[] {
    return Array.from(this.providers.values());
  }
  
  isRegistered(name: string): boolean {
    return this.providers.has(name.toLowerCase());
  }
  
  clear(): void {
    this.providers.clear();
  }
}

// Global registry instance
export const providerRegistry = new DatabaseProviderRegistry();

// ===== AUTO-REGISTRATION =====

/**
 * Auto-register available providers
 */
export function registerDefaultProviders(): void {
  try {
    // Register SQLite provider
    const sqliteConfig = createSQLiteConfig({
      provider: DatabaseProviderType.SQLITE,
      url: 'file:./dev.db'
    });
    providerRegistry.register(new SQLiteProvider(sqliteConfig));
    
    // Register PostgreSQL provider (with dummy config)
    const postgresConfig = createPostgreSQLConfig({
      provider: DatabaseProviderType.POSTGRESQL,
      url: 'postgresql://localhost:5432/gram'
    });
    providerRegistry.register(new PostgreSQLProvider(postgresConfig));
    
  } catch (error) {
    console.warn('Failed to register some default providers:', error);
  }
}

// Auto-register on module load
registerDefaultProviders();