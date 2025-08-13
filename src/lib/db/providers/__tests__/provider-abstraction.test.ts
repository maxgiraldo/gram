/**
 * Database Provider Abstraction Tests
 * 
 * Tests for the database provider abstraction layer to ensure
 * both SQLite and PostgreSQL providers work correctly.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DatabaseProviderType,
  SQLiteProvider,
  PostgreSQLProvider,
  createDatabaseProvider,
  createDatabaseConfig,
  parseProviderFromUrl,
  getProviderCapabilities,
  ProviderPresets,
  getEnvironmentPreset
} from '../index';

describe('Database Provider Abstraction', () => {
  
  describe('URL Parsing', () => {
    it('should detect SQLite from file URLs', () => {
      expect(parseProviderFromUrl('file:./test.db')).toBe(DatabaseProviderType.SQLITE);
      expect(parseProviderFromUrl('test.sqlite')).toBe(DatabaseProviderType.SQLITE);
      expect(parseProviderFromUrl('/path/to/database.db')).toBe(DatabaseProviderType.SQLITE);
    });
    
    it('should detect PostgreSQL from postgres URLs', () => {
      expect(parseProviderFromUrl('postgresql://localhost:5432/test')).toBe(DatabaseProviderType.POSTGRESQL);
      expect(parseProviderFromUrl('postgres://user:pass@host:5432/db')).toBe(DatabaseProviderType.POSTGRESQL);
    });
    
    it('should default to SQLite for unknown URLs', () => {
      expect(parseProviderFromUrl('unknown://test')).toBe(DatabaseProviderType.SQLITE);
    });
  });
  
  describe('Provider Creation', () => {
    it('should create SQLite provider with correct configuration', () => {
      const config = {
        provider: DatabaseProviderType.SQLITE,
        url: 'file:./test.db',
        journal: 'WAL' as const,
        synchronous: 'NORMAL' as const,
        timeout: 30000
      };
      
      const provider = createDatabaseProvider(config);
      expect(provider).toBeInstanceOf(SQLiteProvider);
      expect(provider.name).toBe('SQLite');
      expect(provider.type).toBe(DatabaseProviderType.SQLITE);
    });
    
    it('should create PostgreSQL provider with correct configuration', () => {
      const config = {
        provider: DatabaseProviderType.POSTGRESQL,
        url: 'postgresql://localhost:5432/test',
        applicationName: 'test-app',
        statementTimeout: 60000
      };
      
      const provider = createDatabaseProvider(config);
      expect(provider).toBeInstanceOf(PostgreSQLProvider);
      expect(provider.name).toBe('PostgreSQL');
      expect(provider.type).toBe(DatabaseProviderType.POSTGRESQL);
    });
  });
  
  describe('Provider Capabilities', () => {
    it('should return SQLite capabilities', () => {
      const capabilities = getProviderCapabilities(DatabaseProviderType.SQLITE);
      
      expect(capabilities.features.supportsTransactions).toBe(true);
      expect(capabilities.features.supportsJsonOperations).toBe(true);
      expect(capabilities.features.supportsArrayOperations).toBe(false);
      expect(capabilities.features.supportsFullTextSearch).toBe(true);
      expect(capabilities.features.maxQueryParameters).toBe(999);
    });
    
    it('should return PostgreSQL capabilities', () => {
      const capabilities = getProviderCapabilities(DatabaseProviderType.POSTGRESQL);
      
      expect(capabilities.features.supportsTransactions).toBe(true);
      expect(capabilities.features.supportsJsonOperations).toBe(true);
      expect(capabilities.features.supportsArrayOperations).toBe(true);
      expect(capabilities.features.supportsFullTextSearch).toBe(true);
      expect(capabilities.features.maxQueryParameters).toBe(65535);
    });
  });
  
  describe('Provider Presets', () => {
    it('should create development preset', () => {
      const config = ProviderPresets.localDevelopment();
      
      expect(config.provider).toBe(DatabaseProviderType.SQLITE);
      expect(config.journal).toBe('WAL');
      expect(config.synchronous).toBe('NORMAL');
      expect(config.logging).toBe(true);
    });
    
    it('should create testing preset', () => {
      const config = ProviderPresets.testing();
      
      expect(config.provider).toBe(DatabaseProviderType.SQLITE);
      expect(config.url).toBe('file::memory:?cache=shared');
      expect(config.journal).toBe('MEMORY');
      expect(config.logging).toBe(false);
    });
    
    it('should create production preset', () => {
      const config = ProviderPresets.production();
      
      expect(config.provider).toBe(DatabaseProviderType.POSTGRESQL);
      expect(config.applicationName).toBe('gram-learning-platform');
      expect(config.logging).toBe(false);
      expect(config.pool?.min).toBe(5);
      expect(config.pool?.max).toBe(20);
    });
  });
  
  describe('Environment-based Configuration', () => {
    it('should use testing preset for test environment', () => {
      process.env.NODE_ENV = 'test';
      const config = getEnvironmentPreset();
      
      expect(config.provider).toBe(DatabaseProviderType.SQLITE);
      expect((config as any).url).toBe('file::memory:?cache=shared');
    });
    
    it('should use development preset for development environment', () => {
      process.env.NODE_ENV = 'development';
      const config = getEnvironmentPreset();
      
      expect(config.provider).toBe(DatabaseProviderType.SQLITE);
      expect((config as any).logging).toBe(true);
    });
  });
  
  describe('Provider Interface Compliance', () => {
    describe('SQLite Provider', () => {
      let provider: SQLiteProvider;
      
      beforeEach(() => {
        const config = ProviderPresets.testing();
        provider = new SQLiteProvider(config);
      });
      
      afterEach(async () => {
        if (provider) {
          await provider.disconnect();
        }
      });
      
      it('should implement all required methods', () => {
        expect(typeof provider.connect).toBe('function');
        expect(typeof provider.disconnect).toBe('function');
        expect(typeof provider.healthCheck).toBe('function');
        expect(typeof provider.getClient).toBe('function');
        expect(typeof provider.transaction).toBe('function');
        expect(typeof provider.optimize).toBe('function');
        expect(typeof provider.runMigrations).toBe('function');
        expect(typeof provider.getTableInfo).toBe('function');
        expect(typeof provider.getIndexInfo).toBe('function');
      });
      
      it('should have correct metadata', () => {
        expect(provider.name).toBe('SQLite');
        expect(provider.version).toBe('3.x');
        expect(provider.type).toBe(DatabaseProviderType.SQLITE);
      });
    });
    
    describe('PostgreSQL Provider', () => {
      let provider: PostgreSQLProvider;
      
      beforeEach(() => {
        const config = {
          provider: DatabaseProviderType.POSTGRESQL,
          url: 'postgresql://localhost:5432/test_db',
          applicationName: 'test-app'
        };
        provider = new PostgreSQLProvider(config);
      });
      
      afterEach(async () => {
        if (provider) {
          await provider.disconnect();
        }
      });
      
      it('should implement all required methods', () => {
        expect(typeof provider.connect).toBe('function');
        expect(typeof provider.disconnect).toBe('function');
        expect(typeof provider.healthCheck).toBe('function');
        expect(typeof provider.getClient).toBe('function');
        expect(typeof provider.transaction).toBe('function');
        expect(typeof provider.optimize).toBe('function');
        expect(typeof provider.runMigrations).toBe('function');
        expect(typeof provider.getTableInfo).toBe('function');
        expect(typeof provider.getIndexInfo).toBe('function');
      });
      
      it('should have correct metadata', () => {
        expect(provider.name).toBe('PostgreSQL');
        expect(provider.version).toBe('13+');
        expect(provider.type).toBe(DatabaseProviderType.POSTGRESQL);
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should throw configuration error for invalid SQLite config', () => {
      expect(() => {
        new SQLiteProvider({
          provider: DatabaseProviderType.SQLITE,
          url: '' // Invalid empty URL
        } as any);
      }).toThrow();
    });
    
    it('should throw configuration error for invalid PostgreSQL config', () => {
      expect(() => {
        new PostgreSQLProvider({
          provider: DatabaseProviderType.POSTGRESQL,
          url: '', // Invalid empty URL
          port: 99999 // Invalid port
        } as any);
      }).toThrow();
    });
  });
});

describe('Integration Tests', () => {
  // Note: These tests would require actual database connections
  // In a real test suite, you might use test containers or mock databases
  
  it.skip('should connect to SQLite database', async () => {
    const config = ProviderPresets.testing();
    const provider = createDatabaseProvider(config);
    
    await provider.connect();
    expect(await provider.healthCheck()).toBe(true);
    
    const client = provider.getClient();
    expect(client).toBeDefined();
    
    await provider.disconnect();
  });
  
  it.skip('should perform CRUD operations through provider abstraction', async () => {
    const config = ProviderPresets.testing();
    const provider = createDatabaseProvider(config);
    
    await provider.connect();
    
    // This would test actual database operations
    // const result = await provider.transaction(async (tx) => {
    //   // Perform test operations
    //   return 'success';
    // });
    // expect(result).toBe('success');
    
    await provider.disconnect();
  });
});