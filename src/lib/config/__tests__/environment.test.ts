/**
 * Environment Configuration System Tests
 * 
 * Tests for environment detection, feature flags, resource limits,
 * and configuration validation.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  EnvironmentType,
  DeploymentTier,
  detectEnvironment,
  detectDeploymentTier,
  getFeatureFlags,
  getResourceLimits,
  getSecurityConfig
} from '../environment';

import {
  createEnvironmentConfig,
  getCurrentConfig,
  refreshConfig,
  isFeatureEnabled,
  getResourceLimit,
  ConfigurationError,
  ValidationError
} from '../index';

describe('Environment Detection', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    originalEnv = { ...process.env };
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('detectEnvironment', () => {
    it('should detect explicit environment variable', () => {
      process.env.GRAM_ENVIRONMENT = 'hosted_premium';
      expect(detectEnvironment()).toBe(EnvironmentType.HOSTED_PREMIUM);
    });
    
    it('should detect development from NODE_ENV', () => {
      process.env.NODE_ENV = 'development';
      delete process.env.GRAM_ENVIRONMENT;
      expect(detectEnvironment()).toBe(EnvironmentType.DEVELOPMENT);
    });
    
    it('should detect testing from NODE_ENV', () => {
      process.env.NODE_ENV = 'test';
      delete process.env.GRAM_ENVIRONMENT;
      expect(detectEnvironment()).toBe(EnvironmentType.TESTING);
    });
    
    it('should detect production from NODE_ENV', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.GRAM_ENVIRONMENT;
      expect(detectEnvironment()).toBe(EnvironmentType.PRODUCTION);
    });
    
    it('should detect hosted environment from platform indicators', () => {
      process.env.VERCEL = '1';
      process.env.GRAM_TIER = 'premium';
      delete process.env.GRAM_ENVIRONMENT;
      delete process.env.NODE_ENV;
      
      expect(detectEnvironment()).toBe(EnvironmentType.HOSTED_PREMIUM);
    });
    
    it('should detect local environment from local indicators', () => {
      process.env.DATABASE_URL = 'file:./test.db';
      delete process.env.GRAM_ENVIRONMENT;
      delete process.env.NODE_ENV;
      delete process.env.VERCEL;
      
      expect(detectEnvironment()).toBe(EnvironmentType.LOCAL);
    });
    
    it('should default to local for unknown environments', () => {
      delete process.env.GRAM_ENVIRONMENT;
      delete process.env.NODE_ENV;
      delete process.env.VERCEL;
      delete process.env.DATABASE_URL;
      
      expect(detectEnvironment()).toBe(EnvironmentType.LOCAL);
    });
  });
  
  describe('detectDeploymentTier', () => {
    it('should detect explicit tier variable', () => {
      process.env.GRAM_TIER = 'premium';
      expect(detectDeploymentTier(EnvironmentType.PRODUCTION)).toBe(DeploymentTier.PREMIUM);
    });
    
    it('should return local for development environments', () => {
      delete process.env.GRAM_TIER;
      expect(detectDeploymentTier(EnvironmentType.DEVELOPMENT)).toBe(DeploymentTier.LOCAL);
      expect(detectDeploymentTier(EnvironmentType.TESTING)).toBe(DeploymentTier.LOCAL);
      expect(detectDeploymentTier(EnvironmentType.LOCAL)).toBe(DeploymentTier.LOCAL);
    });
    
    it('should detect premium from postgres database', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      delete process.env.GRAM_TIER;
      
      expect(detectDeploymentTier(EnvironmentType.PRODUCTION)).toBe(DeploymentTier.PREMIUM);
    });
    
    it('should detect premium from redis URL', () => {
      process.env.REDIS_URL = 'redis://localhost:6379';
      delete process.env.GRAM_TIER;
      delete process.env.DATABASE_URL;
      
      expect(detectDeploymentTier(EnvironmentType.PRODUCTION)).toBe(DeploymentTier.PREMIUM);
    });
    
    it('should default to free for hosted environments', () => {
      delete process.env.GRAM_TIER;
      delete process.env.DATABASE_URL;
      delete process.env.REDIS_URL;
      
      expect(detectDeploymentTier(EnvironmentType.HOSTED_FREE)).toBe(DeploymentTier.FREE);
    });
  });
});

describe('Feature Flags', () => {
  describe('getFeatureFlags', () => {
    it('should enable all features for local tier', () => {
      const features = getFeatureFlags(DeploymentTier.LOCAL);
      
      expect(features.userRegistration).toBe(true);
      expect(features.unlimitedLessons).toBe(true);
      expect(features.advancedAnalytics).toBe(true);
      expect(features.ssoIntegration).toBe(true);
      expect(features.apiAccess).toBe(true);
      expect(features.aiTutor).toBe(true);
    });
    
    it('should limit features for free tier', () => {
      const features = getFeatureFlags(DeploymentTier.FREE);
      
      expect(features.userRegistration).toBe(true);
      expect(features.guestMode).toBe(true);
      expect(features.unlimitedLessons).toBe(false);
      expect(features.advancedAnalytics).toBe(false);
      expect(features.ssoIntegration).toBe(false);
      expect(features.prioritySupport).toBe(false);
    });
    
    it('should enable premium features for premium tier', () => {
      const features = getFeatureFlags(DeploymentTier.PREMIUM);
      
      expect(features.userRegistration).toBe(true);
      expect(features.unlimitedLessons).toBe(true);
      expect(features.advancedAnalytics).toBe(true);
      expect(features.customContent).toBe(true);
      expect(features.prioritySupport).toBe(true);
      expect(features.aiTutor).toBe(true);
      
      // Enterprise features should still be disabled
      expect(features.ssoIntegration).toBe(false);
      expect(features.bulkUserManagement).toBe(false);
    });
    
    it('should enable all features for enterprise tier', () => {
      const features = getFeatureFlags(DeploymentTier.ENTERPRISE);
      
      expect(features.userRegistration).toBe(true);
      expect(features.unlimitedLessons).toBe(true);
      expect(features.ssoIntegration).toBe(true);
      expect(features.bulkUserManagement).toBe(true);
      expect(features.advancedReporting).toBe(true);
      expect(features.customBranding).toBe(true);
      expect(features.apiAccess).toBe(true);
    });
  });
});

describe('Resource Limits', () => {
  describe('getResourceLimits', () => {
    it('should provide generous limits for local tier', () => {
      const limits = getResourceLimits(DeploymentTier.LOCAL);
      
      expect(limits.maxUsers).toBe(1000);
      expect(limits.maxLessonsPerUser).toBe(1000);
      expect(limits.maxConcurrentConnections).toBe(100);
      expect(limits.sessionTimeoutMinutes).toBe(480);
    });
    
    it('should provide restricted limits for free tier', () => {
      const limits = getResourceLimits(DeploymentTier.FREE);
      
      expect(limits.maxUsers).toBe(100);
      expect(limits.maxLessonsPerUser).toBe(10);
      expect(limits.maxCustomLessons).toBe(0);
      expect(limits.maxUploadSizeMB).toBe(5);
      expect(limits.maxConcurrentConnections).toBe(10);
      expect(limits.sessionTimeoutMinutes).toBe(60);
    });
    
    it('should provide premium limits for premium tier', () => {
      const limits = getResourceLimits(DeploymentTier.PREMIUM);
      
      expect(limits.maxUsers).toBe(10000);
      expect(limits.maxLessonsPerUser).toBe(1000);
      expect(limits.maxCustomLessons).toBe(100);
      expect(limits.maxUploadSizeMB).toBe(50);
      expect(limits.maxConcurrentConnections).toBe(100);
      expect(limits.sessionTimeoutMinutes).toBe(240);
    });
    
    it('should provide enterprise limits for enterprise tier', () => {
      const limits = getResourceLimits(DeploymentTier.ENTERPRISE);
      
      expect(limits.maxUsers).toBe(100000);
      expect(limits.maxLessonsPerUser).toBe(10000);
      expect(limits.maxCustomLessons).toBe(1000);
      expect(limits.maxUploadSizeMB).toBe(100);
      expect(limits.maxStorageGB).toBe(100);
      expect(limits.maxConcurrentConnections).toBe(1000);
    });
  });
});

describe('Security Configuration', () => {
  describe('getSecurityConfig', () => {
    it('should provide relaxed security for local tier', () => {
      const security = getSecurityConfig(DeploymentTier.LOCAL);
      
      expect(security.authentication.required).toBe(false);
      expect(security.authentication.methods).toContain('password');
      expect(security.authentication.methods).toContain('oauth');
      expect(security.rateLimiting.enabled).toBe(false);
      expect(security.audit.enabled).toBe(false);
    });
    
    it('should provide basic security for free tier', () => {
      const security = getSecurityConfig(DeploymentTier.FREE);
      
      expect(security.authentication.required).toBe(true);
      expect(security.authentication.methods).toContain('password');
      expect(security.authentication.passwordPolicy.minLength).toBe(8);
      expect(security.encryption.atRest).toBe(false);
      expect(security.rateLimiting.enabled).toBe(true);
      expect(security.audit.enabled).toBe(false);
    });
    
    it('should provide enhanced security for premium tier', () => {
      const security = getSecurityConfig(DeploymentTier.PREMIUM);
      
      expect(security.authentication.required).toBe(true);
      expect(security.authentication.methods).toContain('oauth');
      expect(security.authentication.passwordPolicy.minLength).toBe(10);
      expect(security.authentication.passwordPolicy.requireSpecialChar).toBe(true);
      expect(security.encryption.atRest).toBe(true);
      expect(security.audit.enabled).toBe(true);
      expect(security.audit.logLevel).toBe('detailed');
    });
    
    it('should provide maximum security for enterprise tier', () => {
      const security = getSecurityConfig(DeploymentTier.ENTERPRISE);
      
      expect(security.authentication.required).toBe(true);
      expect(security.authentication.methods).toContain('sso');
      expect(security.authentication.passwordPolicy.minLength).toBe(12);
      expect(security.encryption.atRest).toBe(true);
      expect(security.encryption.inTransit).toBe(true);
      expect(security.audit.enabled).toBe(true);
      expect(security.audit.logLevel).toBe('comprehensive');
      expect(security.audit.retention).toBe(365);
    });
  });
});

describe('Configuration Factory', () => {
  let originalEnv: NodeJS.ProcessEnv;
  
  beforeEach(() => {
    originalEnv = { ...process.env };
    // Set up valid environment for testing
    process.env.DATABASE_URL = 'file:./test.db';
    process.env.NODE_ENV = 'test';
  });
  
  afterEach(() => {
    process.env = originalEnv;
  });
  
  describe('createEnvironmentConfig', () => {
    it('should create valid configuration', () => {
      const config = createEnvironmentConfig();
      
      expect(config.type).toBeDefined();
      expect(config.tier).toBeDefined();
      expect(config.database).toBeDefined();
      expect(config.features).toBeDefined();
      expect(config.limits).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.optimization).toBeDefined();
      expect(config.monitoring).toBeDefined();
    });
    
    it('should include database configuration', () => {
      const config = createEnvironmentConfig();
      
      expect(config.database.url).toBeDefined();
      expect(config.database.provider).toBeDefined();
      expect(config.database.poolSize).toBeDefined();
      expect(config.database.timeout).toBeGreaterThan(0);
    });
    
    it('should validate configuration', () => {
      // This should not throw
      expect(() => createEnvironmentConfig()).not.toThrow();
    });
  });
  
  describe('getCurrentConfig', () => {
    it('should return cached configuration', () => {
      const config1 = getCurrentConfig();
      const config2 = getCurrentConfig();
      
      expect(config1).toBe(config2); // Same object reference
    });
    
    it('should refresh configuration when requested', () => {
      const config1 = getCurrentConfig();
      const config2 = refreshConfig();
      
      expect(config1).not.toBe(config2); // Different object reference
      expect(config1).toEqual(config2); // Same content
    });
  });
  
  describe('isFeatureEnabled', () => {
    it('should return correct feature status', () => {
      // Should work with any valid feature flag
      const result = isFeatureEnabled('userRegistration');
      expect(typeof result).toBe('boolean');
    });
  });
  
  describe('getResourceLimit', () => {
    it('should return correct limit value', () => {
      const limit = getResourceLimit('maxUsers');
      expect(typeof limit).toBe('number');
      expect(limit).toBeGreaterThan(0);
    });
  });
});

describe('Configuration Validation', () => {
  describe('ValidationError', () => {
    it('should create proper validation error', () => {
      const error = new ValidationError('testField', 'testValue', 'Test message');
      
      expect(error).toBeInstanceOf(ConfigurationError);
      expect(error.name).toBe('ValidationError');
      expect(error.field).toBe('testField');
      expect(error.value).toBe('testValue');
      expect(error.message).toContain('testField');
      expect(error.message).toContain('Test message');
    });
  });
  
  describe('Configuration validation', () => {
    let originalEnv: NodeJS.ProcessEnv;
    
    beforeEach(() => {
      originalEnv = { ...process.env };
    });
    
    afterEach(() => {
      process.env = originalEnv;
    });
    
    it('should throw for missing database URL', () => {
      delete process.env.DATABASE_URL;
      
      expect(() => createEnvironmentConfig()).toThrow(ConfigurationError);
    });
    
    it('should validate with proper configuration', () => {
      process.env.DATABASE_URL = 'file:./valid.db';
      process.env.NODE_ENV = 'test';
      
      expect(() => createEnvironmentConfig()).not.toThrow();
    });
  });
});