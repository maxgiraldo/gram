/**
 * SQLite Database Provider Implementation
 * 
 * Provides SQLite-specific optimizations and configurations
 * for the grammar learning platform.
 */

import { PrismaClient } from '@prisma/client';
import { 
  BaseProvider, 
  DatabaseProviderType, 
  SQLiteConfig,
  TableInfo,
  IndexInfo,
  ColumnInfo,
  ConstraintInfo,
  TableStatistics,
  ProviderConnectionError,
  ProviderConfigurationError,
  ProviderMigrationError,
  ProviderFeatures,
  ProviderCapabilities
} from './base';

// ===== SQLITE PROVIDER =====

export class SQLiteProvider extends BaseProvider {
  readonly name = 'SQLite';
  readonly version = '3.x';
  readonly type = DatabaseProviderType.SQLITE;
  
  private sqliteConfig: SQLiteConfig;
  
  constructor(config: SQLiteConfig) {
    super(config);
    this.sqliteConfig = config;
    this.validateConfig();
  }
  
  // ===== CONNECTION MANAGEMENT =====
  
  async connect(): Promise<void> {
    const startTime = Date.now();
    
    try {
      this.client = new PrismaClient({
        datasources: {
          db: {
            url: this.config.url
          }
        },
        log: this.config.logging 
          ? (Array.isArray(this.config.logging) 
              ? this.config.logging as any[] 
              : ['query', 'info', 'warn', 'error'])
          : ['error'],
        errorFormat: 'pretty'
      });
      
      // Test connection
      await this.client.$connect();
      await this.applySQLiteOptimizations();
      
      this.connected = true;
      this.logOperation('connect', startTime);
      
    } catch (error) {
      this.client = null;
      this.connected = false;
      throw new ProviderConnectionError(this.name, error);
    }
  }
  
  async disconnect(): Promise<void> {
    const startTime = Date.now();
    
    try {
      if (this.client) {
        await this.client.$disconnect();
        this.client = null;
      }
      this.connected = false;
      this.logOperation('disconnect', startTime);
      
    } catch (error) {
      console.warn(`[${this.name}] Warning during disconnect:`, error);
    }
  }
  
  async healthCheck(): Promise<boolean> {
    try {
      if (!this.connected || !this.client) {
        return false;
      }
      
      // Simple query to test connection
      await this.client.$queryRaw`SELECT 1`;
      return true;
      
    } catch (error) {
      console.error(`[${this.name}] Health check failed:`, error);
      return false;
    }
  }
  
  getClient(): PrismaClient {
    this.ensureConnected();
    return this.client!;
  }
  
  // ===== SQLITE-SPECIFIC OPTIMIZATIONS =====
  
  async applySQLiteOptimizations(): Promise<void> {
    if (!this.client) return;
    
    const optimizations = [
      // Performance optimizations
      'PRAGMA journal_mode = WAL',
      'PRAGMA synchronous = NORMAL',
      'PRAGMA cache_size = 10000',
      'PRAGMA foreign_keys = ON',
      'PRAGMA temp_store = MEMORY',
      'PRAGMA mmap_size = 268435456', // 256MB
      
      // Analysis for query optimization
      'PRAGMA optimize'
    ];
    
    // Apply custom SQLite config if provided
    if (this.sqliteConfig.journal) {
      optimizations.push(`PRAGMA journal_mode = ${this.sqliteConfig.journal}`);
    }
    
    if (this.sqliteConfig.synchronous) {
      optimizations.push(`PRAGMA synchronous = ${this.sqliteConfig.synchronous}`);
    }
    
    if (this.sqliteConfig.busyTimeout) {
      optimizations.push(`PRAGMA busy_timeout = ${this.sqliteConfig.busyTimeout}`);
    }
    
    if (this.sqliteConfig.cache) {
      optimizations.push(`PRAGMA cache = ${this.sqliteConfig.cache}`);
    }
    
    // Execute optimizations
    for (const pragma of optimizations) {
      try {
        await this.client.$executeRawUnsafe(pragma);
      } catch (error) {
        console.warn(`[${this.name}] Failed to apply optimization "${pragma}":`, error);
      }
    }
  }
  
  async optimize(): Promise<void> {
    const startTime = Date.now();
    this.ensureConnected();
    
    try {
      // Update table statistics
      await this.client!.$executeRaw`ANALYZE`;
      
      // Rebuild indices if needed
      await this.client!.$executeRaw`REINDEX`;
      
      // Vacuum if database is getting fragmented
      const dbSize = await this.getDatabaseSize();
      if (dbSize.fragmentationRatio > 0.3) {
        await this.client!.$executeRaw`VACUUM`;
      }
      
      this.logOperation('optimize', startTime);
      
    } catch (error) {
      throw new Error(`Optimization failed: ${error}`);
    }
  }
  
  // ===== MIGRATION SUPPORT =====
  
  async runMigrations(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // In a real implementation, this would run Prisma migrations
      // For now, we'll check if the database schema is up to date
      const tables = await this.getTableInfo();
      
      if (tables.length === 0) {
        throw new ProviderMigrationError(
          this.name, 
          'No tables found - database may need initialization'
        );
      }
      
      this.logOperation('runMigrations', startTime);
      
    } catch (error) {
      throw new ProviderMigrationError(this.name, 'Migration check failed', error);
    }
  }
  
  // ===== INTROSPECTION =====
  
  async getTableInfo(tableName?: string): Promise<TableInfo[]> {
    this.ensureConnected();
    
    const tables: any[] = tableName 
      ? await this.client!.$queryRaw`
          SELECT name 
          FROM sqlite_master 
          WHERE type = 'table' AND name = ${tableName}
        `
      : await this.client!.$queryRaw`
          SELECT name 
          FROM sqlite_master 
          WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
        `;
    
    const tableInfos: TableInfo[] = [];
    
    for (const table of tables) {
      const columns = await this.getTableColumns(table.name);
      const indexes = await this.getTableIndexes(table.name);
      const constraints = await this.getTableConstraints(table.name);
      const statistics = await this.getTableStatistics(table.name);
      
      tableInfos.push({
        name: table.name,
        columns,
        indexes,
        constraints,
        statistics
      });
    }
    
    return tableInfos;
  }
  
  async getIndexInfo(tableName?: string): Promise<IndexInfo[]> {
    this.ensureConnected();
    
    const condition = tableName ? 'AND tbl_name = ?' : '';
    const indexes: any[] = await this.client!.$queryRawUnsafe(`
      SELECT name, tbl_name, sql
      FROM sqlite_master 
      WHERE type = 'index' 
        AND name NOT LIKE 'sqlite_%'
        ${condition}
    `, ...(tableName ? [tableName] : []));
    
    const indexInfos: IndexInfo[] = [];
    
    for (const index of indexes) {
      const indexDetails: any[] = await this.client!.$queryRawUnsafe(`
        PRAGMA index_info(${index.name})
      `);
      
      const columns = indexDetails
        .sort((a, b) => a.seqno - b.seqno)
        .map(detail => detail.name);
      
      indexInfos.push({
        name: index.name,
        tableName: index.tbl_name,
        columns,
        unique: index.sql?.includes('UNIQUE') || false,
        primary: index.name.includes('PRIMARY') || false,
        type: 'BTREE'
      });
    }
    
    return indexInfos;
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private validateConfig(): void {
    if (!this.config.url) {
      throw new ProviderConfigurationError(this.name, 'Database URL is required');
    }
    
    if (this.sqliteConfig.timeout && this.sqliteConfig.timeout < 1000) {
      console.warn(`[${this.name}] Warning: Very low timeout (${this.sqliteConfig.timeout}ms) may cause connection issues`);
    }
  }
  
  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const columns: any[] = await this.client!.$queryRawUnsafe(`
      PRAGMA table_info(${tableName})
    `);
    
    return columns.map(col => ({
      name: col.name,
      type: col.type,
      nullable: !col.notnull,
      defaultValue: col.dflt_value,
      primaryKey: !!col.pk,
      autoIncrement: col.type.toUpperCase().includes('INTEGER') && !!col.pk,
      unique: false, // Would need to check indexes for this
      comment: undefined
    }));
  }
  
  private async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    return await this.getIndexInfo(tableName);
  }
  
  private async getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
    const foreignKeys: any[] = await this.client!.$queryRawUnsafe(`
      PRAGMA foreign_key_list(${tableName})
    `);
    
    const constraints: ConstraintInfo[] = [];
    
    // Add foreign key constraints
    foreignKeys.forEach(fk => {
      constraints.push({
        name: `${tableName}_${fk.from}_fkey`,
        type: 'FOREIGN_KEY',
        columns: [fk.from],
        referencedTable: fk.table,
        referencedColumns: [fk.to],
        onUpdate: fk.on_update,
        onDelete: fk.on_delete
      });
    });
    
    return constraints;
  }
  
  private async getTableStatistics(tableName: string): Promise<TableStatistics> {
    try {
      const result: any[] = await this.client!.$queryRawUnsafe(`
        SELECT COUNT(*) as row_count 
        FROM ${tableName}
      `);
      
      const rowCount = result[0]?.row_count || 0;
      
      return {
        rowCount,
        sizeBytes: 0, // SQLite doesn't easily provide table size
        lastUpdated: new Date()
      };
    } catch (error) {
      return {
        rowCount: 0,
        sizeBytes: 0,
        lastUpdated: new Date()
      };
    }
  }
  
  private async getDatabaseSize(): Promise<{ sizeBytes: number; fragmentationRatio: number }> {
    try {
      const pageCount: any[] = await this.client!.$queryRaw`PRAGMA page_count`;
      const pageSize: any[] = await this.client!.$queryRaw`PRAGMA page_size`;
      const freelistCount: any[] = await this.client!.$queryRaw`PRAGMA freelist_count`;
      
      const totalPages = pageCount[0]?.page_count || 0;
      const pageSizeBytes = pageSize[0]?.page_size || 4096;
      const freePages = freelistCount[0]?.freelist_count || 0;
      
      const sizeBytes = totalPages * pageSizeBytes;
      const fragmentationRatio = totalPages > 0 ? freePages / totalPages : 0;
      
      return { sizeBytes, fragmentationRatio };
    } catch (error) {
      return { sizeBytes: 0, fragmentationRatio: 0 };
    }
  }
  
  // ===== CAPABILITIES =====
  
  static getCapabilities(): ProviderCapabilities {
    return {
      features: {
        supportsTransactions: true,
        supportsNestedTransactions: true,
        supportsReturnClause: true,
        supportsUpsert: true,
        supportsFullTextSearch: true,
        supportsJsonOperations: true,
        supportsArrayOperations: false,
        supportsPartialIndexes: true,
        supportsExpressionIndexes: true,
        supportsCTE: true,
        supportsWindowFunctions: true,
        maxQueryParameters: 999,
        maxStringLength: 1000000000,
        maxBlobSize: 1000000000
      },
      optimizations: [
        'WAL journal mode for better concurrency',
        'Memory-mapped I/O for large databases',
        'Query planner optimizations',
        'Automatic index recommendations',
        'Pragma optimizations for performance'
      ],
      limitations: [
        'No native array data types',
        'Limited concurrent write operations',
        'Single database file',
        'No server-side programming'
      ],
      recommendations: [
        'Use WAL mode for concurrent read access',
        'Regular VACUUM operations for maintenance',
        'Keep database file on fast storage',
        'Use prepared statements for performance',
        'Monitor database size for large datasets'
      ]
    };
  }
}