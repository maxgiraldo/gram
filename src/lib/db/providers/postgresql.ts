/**
 * PostgreSQL Database Provider Implementation
 * 
 * Provides PostgreSQL-specific optimizations and configurations
 * for the grammar learning platform.
 */

import { PrismaClient } from '@prisma/client';
import { 
  BaseProvider, 
  DatabaseProviderType, 
  PostgreSQLConfig,
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

// ===== POSTGRESQL PROVIDER =====

export class PostgreSQLProvider extends BaseProvider {
  readonly name = 'PostgreSQL';
  readonly version = '13+';
  readonly type = DatabaseProviderType.POSTGRESQL;
  
  private postgresConfig: PostgreSQLConfig;
  
  constructor(config: PostgreSQLConfig) {
    super(config);
    this.postgresConfig = config;
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
      await this.applyPostgreSQLOptimizations();
      
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
      
      // PostgreSQL-specific health check
      await this.client.$queryRaw`SELECT 1`;
      
      // Check if we can access the database
      const result: any[] = await this.client.$queryRaw`
        SELECT current_database(), current_user, version()
      `;
      
      return result.length > 0;
      
    } catch (error) {
      console.error(`[${this.name}] Health check failed:`, error);
      return false;
    }
  }
  
  getClient(): PrismaClient {
    this.ensureConnected();
    return this.client!;
  }
  
  // ===== POSTGRESQL-SPECIFIC OPTIMIZATIONS =====
  
  async applyPostgreSQLOptimizations(): Promise<void> {
    if (!this.client) return;
    
    try {
      // Set application name for connection tracking
      if (this.postgresConfig.applicationName) {
        await this.client.$executeRawUnsafe(
          `SET application_name = '${this.postgresConfig.applicationName}'`
        );
      }
      
      // Set search path if specified
      if (this.postgresConfig.searchPath && this.postgresConfig.searchPath.length > 0) {
        const searchPath = this.postgresConfig.searchPath.join(', ');
        await this.client.$executeRawUnsafe(`SET search_path = ${searchPath}`);
      }
      
      // Set statement timeout
      if (this.postgresConfig.statementTimeout) {
        await this.client.$executeRawUnsafe(
          `SET statement_timeout = ${this.postgresConfig.statementTimeout}`
        );
      }
      
      // Optimize for our workload
      const optimizations = [
        'SET random_page_cost = 1.1', // SSD optimization
        'SET effective_cache_size = \'1GB\'', // Adjust based on available memory
        'SET shared_preload_libraries = \'pg_stat_statements\'', // Query monitoring
        'SET log_min_duration_statement = 1000', // Log slow queries
        'SET log_checkpoints = on',
        'SET log_connections = on',
        'SET log_disconnections = on'
      ];
      
      for (const optimization of optimizations) {
        try {
          await this.client.$executeRawUnsafe(optimization);
        } catch (error) {
          // Some settings may require superuser or may not be available
          console.debug(`[${this.name}] Skipped optimization "${optimization}":`, error);
        }
      }
      
    } catch (error) {
      console.warn(`[${this.name}] Some optimizations could not be applied:`, error);
    }
  }
  
  async optimize(): Promise<void> {
    const startTime = Date.now();
    this.ensureConnected();
    
    try {
      // Update table statistics
      await this.client!.$executeRaw`ANALYZE`;
      
      // Update planner statistics
      await this.client!.$executeRaw`VACUUM ANALYZE`;
      
      // Check for bloated tables and suggest maintenance
      const bloatedTables = await this.checkTableBloat();
      if (bloatedTables.length > 0) {
        console.log(`[${this.name}] Tables with high bloat detected:`, bloatedTables);
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
      // Check if the database is accessible and has proper schema
      const schemas: any[] = await this.client!.$queryRaw`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name = current_schema()
      `;
      
      if (schemas.length === 0) {
        throw new ProviderMigrationError(
          this.name, 
          'Database schema not found or inaccessible'
        );
      }
      
      // Check for basic tables
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
    
    const whereClause = tableName 
      ? `AND table_name = '${tableName}'`
      : '';
    
    const tables: any[] = await this.client!.$queryRawUnsafe(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = current_schema()
        AND table_type = 'BASE TABLE'
        ${whereClause}
      ORDER BY table_name
    `);
    
    const tableInfos: TableInfo[] = [];
    
    for (const table of tables) {
      const columns = await this.getTableColumns(table.table_name);
      const indexes = await this.getTableIndexes(table.table_name);
      const constraints = await this.getTableConstraints(table.table_name);
      const statistics = await this.getTableStatistics(table.table_name);
      
      tableInfos.push({
        name: table.table_name,
        schema: table.table_schema,
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
    
    const whereClause = tableName 
      ? `AND t.relname = '${tableName}'`
      : '';
    
    const indexes: any[] = await this.client!.$queryRawUnsafe(`
      SELECT 
        i.relname as index_name,
        t.relname as table_name,
        ix.indisunique as is_unique,
        ix.indisprimary as is_primary,
        ix.indispartial as is_partial,
        pg_get_indexdef(i.oid) as definition,
        array_agg(a.attname ORDER BY c.ordinality) as columns
      FROM pg_class i
      JOIN pg_index ix ON i.oid = ix.indexrelid
      JOIN pg_class t ON ix.indrelid = t.oid
      JOIN unnest(ix.indkey) WITH ORDINALITY c(colnum, ordinality) ON true
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = c.colnum
      WHERE i.relkind = 'i'
        AND t.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = current_schema())
        ${whereClause}
      GROUP BY i.relname, t.relname, ix.indisunique, ix.indisprimary, ix.indispartial, i.oid
      ORDER BY t.relname, i.relname
    `);
    
    return indexes.map(index => ({
      name: index.index_name,
      tableName: index.table_name,
      columns: index.columns,
      unique: index.is_unique,
      primary: index.is_primary,
      partial: index.is_partial,
      type: 'BTREE',
      expression: index.definition.includes('(') ? 
        index.definition.substring(index.definition.indexOf('(') + 1, index.definition.lastIndexOf(')')) :
        undefined
    }));
  }
  
  // ===== PRIVATE HELPER METHODS =====
  
  private validateConfig(): void {
    if (!this.config.url) {
      throw new ProviderConfigurationError(this.name, 'Database URL is required');
    }
    
    if (this.postgresConfig.port && (this.postgresConfig.port < 1 || this.postgresConfig.port > 65535)) {
      throw new ProviderConfigurationError(this.name, 'Invalid port number');
    }
    
    if (this.postgresConfig.connectionTimeout && this.postgresConfig.connectionTimeout < 1000) {
      console.warn(`[${this.name}] Warning: Very low connection timeout (${this.postgresConfig.connectionTimeout}ms) may cause issues`);
    }
  }
  
  private async getTableColumns(tableName: string): Promise<ColumnInfo[]> {
    const columns: any[] = await this.client!.$queryRawUnsafe(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length,
        numeric_precision,
        numeric_scale,
        is_identity,
        identity_generation
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `);
    
    // Get primary key info
    const primaryKeys: any[] = await this.client!.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = current_schema()
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'PRIMARY KEY'
    `);
    
    const pkColumns = new Set(primaryKeys.map(pk => pk.column_name));
    
    return columns.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      defaultValue: col.column_default,
      primaryKey: pkColumns.has(col.column_name),
      autoIncrement: col.is_identity === 'YES' || 
                    (col.column_default && col.column_default.includes('nextval')),
      unique: false, // Would need to check constraints
      comment: undefined
    }));
  }
  
  private async getTableIndexes(tableName: string): Promise<IndexInfo[]> {
    return await this.getIndexInfo(tableName);
  }
  
  private async getTableConstraints(tableName: string): Promise<ConstraintInfo[]> {
    const constraints: any[] = await this.client!.$queryRawUnsafe(`
      SELECT 
        tc.constraint_name,
        tc.constraint_type,
        array_agg(kcu.column_name ORDER BY kcu.ordinal_position) as columns,
        ccu.table_name as referenced_table,
        array_agg(ccu.column_name ORDER BY kcu.ordinal_position) as referenced_columns,
        rc.update_rule,
        rc.delete_rule,
        cc.check_clause
      FROM information_schema.table_constraints tc
      LEFT JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      LEFT JOIN information_schema.constraint_column_usage ccu 
        ON tc.constraint_name = ccu.constraint_name
      LEFT JOIN information_schema.referential_constraints rc 
        ON tc.constraint_name = rc.constraint_name
      LEFT JOIN information_schema.check_constraints cc 
        ON tc.constraint_name = cc.constraint_name
      WHERE tc.table_schema = current_schema()
        AND tc.table_name = '${tableName}'
      GROUP BY tc.constraint_name, tc.constraint_type, ccu.table_name, 
               rc.update_rule, rc.delete_rule, cc.check_clause
    `);
    
    return constraints.map(constraint => ({
      name: constraint.constraint_name,
      type: constraint.constraint_type as any,
      columns: constraint.columns,
      referencedTable: constraint.referenced_table,
      referencedColumns: constraint.referenced_columns,
      onUpdate: constraint.update_rule,
      onDelete: constraint.delete_rule,
      checkCondition: constraint.check_clause
    }));
  }
  
  private async getTableStatistics(tableName: string): Promise<TableStatistics> {
    try {
      const stats: any[] = await this.client!.$queryRawUnsafe(`
        SELECT 
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_tuples,
          n_dead_tup as dead_tuples,
          last_vacuum,
          last_autovacuum,
          last_analyze,
          last_autoanalyze
        FROM pg_stat_user_tables
        WHERE schemaname = current_schema()
          AND tablename = '${tableName}'
      `);
      
      const tableSizes: any[] = await this.client!.$queryRawUnsafe(`
        SELECT pg_total_relation_size('${tableName}') as total_size
      `);
      
      const stat = stats[0];
      const size = tableSizes[0];
      
      return {
        rowCount: stat?.live_tuples || 0,
        sizeBytes: size?.total_size || 0,
        lastUpdated: stat?.last_analyze || stat?.last_autoanalyze || new Date()
      };
    } catch (error) {
      return {
        rowCount: 0,
        sizeBytes: 0,
        lastUpdated: new Date()
      };
    }
  }
  
  private async checkTableBloat(): Promise<string[]> {
    try {
      const bloatedTables: any[] = await this.client!.$queryRawUnsafe(`
        SELECT tablename, bloat_ratio
        FROM (
          SELECT 
            schemaname,
            tablename,
            ROUND((CASE WHEN otta=0 THEN 0.0 ELSE sml.relpages/otta::numeric END)::numeric,1) AS bloat_ratio
          FROM (
            SELECT
              schemaname, tablename, cc.reltuples, cc.relpages, bs,
              CEIL((cc.reltuples*((datahdr+ma-
                (CASE WHEN datahdr%ma=0 THEN ma ELSE datahdr%ma END))+nullhdr2+4))/(bs-20::float)) AS otta
            FROM (
              SELECT
                ma,bs,schemaname,tablename,
                (datawidth+(hdr+ma-(case when hdr%ma=0 THEN ma ELSE hdr%ma END)))::numeric AS datahdr,
                (maxfracsum*(nullhdr+ma-(case when nullhdr%ma=0 THEN ma ELSE nullhdr%ma END))) AS nullhdr2
              FROM (
                SELECT
                  schemaname, tablename, hdr, ma, bs,
                  SUM((1-null_frac)*avg_width) AS datawidth,
                  MAX(null_frac) AS maxfracsum,
                  hdr+(
                    SELECT 1+count(*)/8
                    FROM pg_stats s2
                    WHERE null_frac<>0 AND s2.schemaname = s.schemaname AND s2.tablename = s.tablename
                  ) AS nullhdr
                FROM pg_stats s, (
                  SELECT
                    (SELECT current_setting('block_size')::numeric) AS bs,
                    CASE WHEN substring(v,12,3) IN ('8.0','8.1','8.2') THEN 27 ELSE 23 END AS hdr,
                    CASE WHEN v ~ 'mingw32' THEN 8 ELSE 4 END AS ma
                  FROM (SELECT version() AS v) AS foo
                ) AS constants
                GROUP BY 1,2,3,4,5
              ) AS foo
            ) AS rs
            JOIN pg_class cc ON cc.relname = rs.tablename
            JOIN pg_namespace nn ON cc.relnamespace = nn.oid AND nn.nspname = rs.schemaname AND nn.nspname <> 'information_schema'
          ) AS sml
        ) AS bloat_info
        WHERE bloat_ratio > 2.0  -- Tables with more than 2x bloat
        ORDER BY bloat_ratio DESC
      `);
      
      return bloatedTables.map(table => table.tablename);
    } catch (error) {
      // Bloat calculation query might fail on some PostgreSQL versions
      return [];
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
        supportsArrayOperations: true,
        supportsPartialIndexes: true,
        supportsExpressionIndexes: true,
        supportsCTE: true,
        supportsWindowFunctions: true,
        maxQueryParameters: 65535,
        maxStringLength: 1073741824,
        maxBlobSize: 1073741824
      },
      optimizations: [
        'Connection pooling for concurrent access',
        'Query planner statistics and optimization',
        'Partial and expression indexes',
        'Materialized views for complex queries',
        'Advanced JSON and array operations',
        'Full-text search capabilities',
        'Table partitioning for large datasets'
      ],
      limitations: [
        'Requires more memory than SQLite',
        'More complex setup and maintenance',
        'Network latency for remote connections'
      ],
      recommendations: [
        'Use connection pooling for high concurrency',
        'Regular VACUUM and ANALYZE operations',
        'Monitor query performance with pg_stat_statements',
        'Consider table partitioning for large tables',
        'Use appropriate indexes for query patterns',
        'Monitor and tune shared_buffers and work_mem'
      ]
    };
  }
}