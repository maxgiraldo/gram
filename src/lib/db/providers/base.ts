/**
 * Database Provider Abstraction Base Interface
 * 
 * Defines the contract that all database providers must implement
 * to ensure consistent behavior across different database engines.
 */

import { PrismaClient } from '@prisma/client';

// ===== PROVIDER INTERFACE =====

export interface DatabaseProvider {
  readonly name: string;
  readonly version: string;
  readonly type: DatabaseProviderType;
  
  // Connection management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<boolean>;
  
  // Client access
  getClient(): PrismaClient;
  
  // Transaction support
  transaction<T>(
    operations: (client: PrismaClient) => Promise<T>
  ): Promise<T>;
  
  // Provider-specific optimizations
  optimize(): Promise<void>;
  
  // Migration support
  runMigrations(): Promise<void>;
  
  // Database introspection
  getTableInfo(tableName?: string): Promise<TableInfo[]>;
  getIndexInfo(tableName?: string): Promise<IndexInfo[]>;
}

// ===== PROVIDER TYPES =====

export enum DatabaseProviderType {
  SQLITE = 'sqlite',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql'
}

// ===== CONFIGURATION TYPES =====

export interface DatabaseConfig {
  provider: DatabaseProviderType;
  url: string;
  schema?: string;
  logging?: boolean | string[];
  pool?: {
    min?: number;
    max?: number;
    timeout?: number;
  };
  ssl?: {
    ca?: string;
    cert?: string;
    key?: string;
    rejectUnauthorized?: boolean;
  };
  options?: Record<string, any>;
}

export interface SQLiteConfig extends DatabaseConfig {
  provider: DatabaseProviderType.SQLITE;
  file?: string;
  memory?: boolean;
  timeout?: number;
  busyTimeout?: number;
  journal?: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF';
  synchronous?: 'OFF' | 'NORMAL' | 'FULL';
  cache?: 'shared' | 'private';
}

export interface PostgreSQLConfig extends DatabaseConfig {
  provider: DatabaseProviderType.POSTGRESQL;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  applicationName?: string;
  searchPath?: string[];
  statementTimeout?: number;
  queryTimeout?: number;
  connectionTimeout?: number;
  idleTimeout?: number;
}

// ===== METADATA TYPES =====

export interface TableInfo {
  name: string;
  schema?: string;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  constraints: ConstraintInfo[];
  statistics?: TableStatistics;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: any;
  primaryKey: boolean;
  autoIncrement: boolean;
  unique: boolean;
  comment?: string;
}

export interface IndexInfo {
  name: string;
  tableName: string;
  columns: string[];
  unique: boolean;
  primary: boolean;
  type?: string;
  partial?: boolean;
  expression?: string;
}

export interface ConstraintInfo {
  name: string;
  type: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'UNIQUE' | 'CHECK' | 'NOT_NULL';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
  onUpdate?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'SET_DEFAULT' | 'NO_ACTION';
  onDelete?: 'CASCADE' | 'RESTRICT' | 'SET_NULL' | 'SET_DEFAULT' | 'NO_ACTION';
  checkCondition?: string;
}

export interface TableStatistics {
  rowCount: number;
  sizeBytes: number;
  lastUpdated: Date;
  fragmentationLevel?: number;
}

// ===== ERROR TYPES =====

export class DatabaseProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public operation: string,
    public originalError?: unknown
  ) {
    super(`[${provider}] ${operation}: ${message}`);
    this.name = 'DatabaseProviderError';
  }
}

export class ProviderConnectionError extends DatabaseProviderError {
  constructor(provider: string, originalError?: unknown) {
    super('Failed to connect to database', provider, 'connect', originalError);
    this.name = 'ProviderConnectionError';
  }
}

export class ProviderConfigurationError extends DatabaseProviderError {
  constructor(provider: string, message: string) {
    super(`Configuration error: ${message}`, provider, 'configure');
    this.name = 'ProviderConfigurationError';
  }
}

export class ProviderMigrationError extends DatabaseProviderError {
  constructor(provider: string, message: string, originalError?: unknown) {
    super(`Migration failed: ${message}`, provider, 'migrate', originalError);
    this.name = 'ProviderMigrationError';
  }
}

// ===== UTILITY TYPES =====

export interface ProviderFeatures {
  supportsTransactions: boolean;
  supportsNestedTransactions: boolean;
  supportsReturnClause: boolean;
  supportsUpsert: boolean;
  supportsFullTextSearch: boolean;
  supportsJsonOperations: boolean;
  supportsArrayOperations: boolean;
  supportsPartialIndexes: boolean;
  supportsExpressionIndexes: boolean;
  supportsCTE: boolean;
  supportsWindowFunctions: boolean;
  maxQueryParameters: number;
  maxStringLength: number;
  maxBlobSize: number;
}

export interface ProviderCapabilities {
  features: ProviderFeatures;
  optimizations: string[];
  limitations: string[];
  recommendations: string[];
}

// ===== PROVIDER REGISTRY =====

export interface ProviderRegistry {
  register(provider: DatabaseProvider): void;
  unregister(name: string): void;
  get(name: string): DatabaseProvider | undefined;
  list(): DatabaseProvider[];
  isRegistered(name: string): boolean;
}

// ===== BASE PROVIDER ABSTRACT CLASS =====

export abstract class BaseProvider implements DatabaseProvider {
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly type: DatabaseProviderType;
  
  protected client: PrismaClient | null = null;
  protected connected = false;
  
  constructor(protected config: DatabaseConfig) {}
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract healthCheck(): Promise<boolean>;
  abstract getClient(): PrismaClient;
  abstract runMigrations(): Promise<void>;
  abstract getTableInfo(tableName?: string): Promise<TableInfo[]>;
  abstract getIndexInfo(tableName?: string): Promise<IndexInfo[]>;
  abstract optimize(): Promise<void>;
  
  async transaction<T>(
    operations: (client: PrismaClient) => Promise<T>
  ): Promise<T> {
    const client = this.getClient();
    return await client.$transaction(operations);
  }
  
  protected ensureConnected(): void {
    if (!this.connected || !this.client) {
      throw new ProviderConnectionError(this.name);
    }
  }
  
  protected logOperation(operation: string, startTime: number): void {
    const duration = Date.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.name}] ${operation} completed in ${duration}ms`);
    }
  }
}