/**
 * Main Configuration System
 * 
 * Integrates environment detection, database configuration, feature flags,
 * and optimization settings for the grammar learning platform.
 */

import {
  EnvironmentType,
  DeploymentTier,
  EnvironmentConfig,
  DatabaseEnvironmentConfig,
  OptimizationConfig,
  MonitoringConfig,
  detectEnvironment,
  detectDeploymentTier,
  getFeatureFlags,
  getResourceLimits,
  getSecurityConfig
} from './environment';

import {
  createDatabaseConfig,
  DatabaseProviderType,
  type DatabaseConfig
} from '../db/providers';

// ===== CONFIGURATION ERRORS =====

export class ConfigurationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public value?: any
  ) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends ConfigurationError {
  constructor(
    field: string,
    value: any,
    message: string
  ) {
    super(`Validation failed for ${field}: ${message}`, field, value);
    this.name = 'ValidationError';
  }
}

// ===== MAIN CONFIGURATION FACTORY =====

/**
 * Create complete environment configuration
 */
export function createEnvironmentConfig(): EnvironmentConfig {
  try {
    // Detect environment and tier
    const envType = detectEnvironment();
    const tier = detectDeploymentTier(envType);
    
    // Create database configuration
    const databaseConfig = createDatabaseEnvironmentConfig(envType, tier);
    
    // Get tier-specific configurations
    const features = getFeatureFlags(tier);
    const limits = getResourceLimits(tier);
    const security = getSecurityConfig(tier);
    const optimization = getOptimizationConfig(tier);
    const monitoring = getMonitoringConfig(tier);
    
    // Validate configuration
    const config: EnvironmentConfig = {
      type: envType,
      tier,
      database: databaseConfig,
      features,
      limits,
      security,
      optimization,
      monitoring
    };
    
    validateEnvironmentConfig(config);
    
    return config;
  } catch (error) {
    if (error instanceof ConfigurationError) {
      throw error;
    }
    throw new ConfigurationError(`Failed to create environment configuration: ${error}`);
  }
}

/**
 * Create database configuration based on environment
 */
function createDatabaseEnvironmentConfig(
  envType: EnvironmentType,
  tier: DeploymentTier
): DatabaseEnvironmentConfig {
  try {
    // Use existing database configuration logic
    const dbConfig = createDatabaseConfig();
    
    // Map to environment config format
    const baseConfig: DatabaseEnvironmentConfig = {
      provider: dbConfig.provider as any,
      url: dbConfig.url,
      ssl: false,
      timeout: 30000,
      retries: 3
    };
    
    // Add tier-specific configuration
    switch (tier) {
      case DeploymentTier.LOCAL:
        return {
          ...baseConfig,
          poolSize: { min: 1, max: 5 },
          backup: { enabled: false }
        };
      
      case DeploymentTier.FREE:
        return {
          ...baseConfig,
          poolSize: { min: 1, max: 3 },
          timeout: 10000,
          backup: { enabled: false }
        };
      
      case DeploymentTier.PREMIUM:
        return {
          ...baseConfig,
          poolSize: { min: 2, max: 10 },
          ssl: true,
          backup: {
            enabled: true,
            frequency: 'daily',
            retention: 7
          }
        };
      
      case DeploymentTier.ENTERPRISE:
        return {
          ...baseConfig,
          poolSize: { min: 5, max: 50 },
          ssl: true,
          backup: {
            enabled: true,
            frequency: 'hourly',
            retention: 30
          }
        };
      
      default:
        return baseConfig;
    }
  } catch (error) {
    throw new ConfigurationError(`Failed to create database configuration: ${error}`);
  }
}

/**
 * Get optimization configuration for tier
 */
function getOptimizationConfig(tier: DeploymentTier): OptimizationConfig {
  switch (tier) {
    case DeploymentTier.LOCAL:
      return {
        caching: {
          enabled: false,
          strategy: 'memory',
          ttl: 300
        },
        compression: {
          enabled: false,
          algorithm: 'gzip',
          level: 1
        },
        cdn: {
          enabled: false
        },
        preloading: {
          enabled: true,
          strategies: ['critical-path']
        }
      };
    
    case DeploymentTier.FREE:
      return {
        caching: {
          enabled: true,
          strategy: 'memory',
          ttl: 600
        },
        compression: {
          enabled: true,
          algorithm: 'gzip',
          level: 6
        },
        cdn: {
          enabled: false
        },
        preloading: {
          enabled: true,
          strategies: ['critical-path']
        }
      };
    
    case DeploymentTier.PREMIUM:
      return {
        caching: {
          enabled: true,
          strategy: 'redis',
          ttl: 1800
        },
        compression: {
          enabled: true,
          algorithm: 'brotli',
          level: 6
        },
        cdn: {
          enabled: true,
          provider: 'cloudflare',
          regions: ['us', 'eu']
        },
        preloading: {
          enabled: true,
          strategies: ['critical-path', 'predictive']
        }
      };
    
    case DeploymentTier.ENTERPRISE:
      return {
        caching: {
          enabled: true,
          strategy: 'redis',
          ttl: 3600
        },
        compression: {
          enabled: true,
          algorithm: 'brotli',
          level: 9
        },
        cdn: {
          enabled: true,
          provider: 'cloudflare',
          regions: ['us', 'eu', 'asia', 'oceania']
        },
        preloading: {
          enabled: true,
          strategies: ['critical-path', 'predictive', 'adaptive']
        }
      };
    
    default:
      return getOptimizationConfig(DeploymentTier.FREE);
  }
}

/**
 * Get monitoring configuration for tier
 */
function getMonitoringConfig(tier: DeploymentTier): MonitoringConfig {
  switch (tier) {
    case DeploymentTier.LOCAL:
      return {
        logging: {
          level: 'debug',
          format: 'text',
          destination: 'console'
        },
        metrics: {
          enabled: false,
          interval: 60000
        },
        alerts: {
          enabled: false,
          channels: [],
          thresholds: {
            errorRate: 0.1,
            responseTime: 5000,
            memoryUsage: 0.9
          }
        },
        healthChecks: {
          enabled: true,
          interval: 30000,
          endpoints: ['/health']
        }
      };
    
    case DeploymentTier.FREE:
      return {
        logging: {
          level: 'warn',
          format: 'json',
          destination: 'console'
        },
        metrics: {
          enabled: false,
          interval: 300000
        },
        alerts: {
          enabled: false,
          channels: [],
          thresholds: {
            errorRate: 0.05,
            responseTime: 3000,
            memoryUsage: 0.8
          }
        },
        healthChecks: {
          enabled: true,
          interval: 60000,
          endpoints: ['/health']
        }
      };
    
    case DeploymentTier.PREMIUM:
      return {
        logging: {
          level: 'info',
          format: 'json',
          destination: 'remote'
        },
        metrics: {
          enabled: true,
          provider: 'prometheus',
          interval: 60000
        },
        alerts: {
          enabled: true,
          channels: ['email'],
          thresholds: {
            errorRate: 0.02,
            responseTime: 2000,
            memoryUsage: 0.7
          }
        },
        healthChecks: {
          enabled: true,
          interval: 30000,
          endpoints: ['/health', '/metrics', '/ready']
        }
      };
    
    case DeploymentTier.ENTERPRISE:
      return {
        logging: {
          level: 'info',
          format: 'json',
          destination: 'remote'
        },
        metrics: {
          enabled: true,
          provider: 'datadog',
          interval: 30000
        },
        alerts: {
          enabled: true,
          channels: ['email', 'slack', 'webhook'],
          thresholds: {
            errorRate: 0.01,
            responseTime: 1000,
            memoryUsage: 0.6
          }
        },
        healthChecks: {
          enabled: true,
          interval: 15000,
          endpoints: ['/health', '/metrics', '/ready', '/live']
        }
      };
    
    default:
      return getMonitoringConfig(DeploymentTier.FREE);
  }
}

// ===== CONFIGURATION VALIDATION =====

/**
 * Validate environment configuration
 */
function validateEnvironmentConfig(config: EnvironmentConfig): void {
  // Validate environment type
  if (!Object.values(EnvironmentType).includes(config.type)) {
    throw new ValidationError('type', config.type, 'Invalid environment type');
  }
  
  // Validate deployment tier
  if (!Object.values(DeploymentTier).includes(config.tier)) {
    throw new ValidationError('tier', config.tier, 'Invalid deployment tier');
  }
  
  // Validate database configuration
  validateDatabaseConfig(config.database);
  
  // Validate resource limits
  validateResourceLimits(config.limits);
  
  // Validate feature flag consistency
  validateFeatureFlags(config.features, config.tier);
}

/**
 * Validate database configuration
 */
function validateDatabaseConfig(config: DatabaseEnvironmentConfig): void {
  if (!config.url) {
    throw new ValidationError('database.url', config.url, 'Database URL is required');
  }
  
  if (config.poolSize) {
    if (config.poolSize.min < 1) {
      throw new ValidationError('database.poolSize.min', config.poolSize.min, 'Must be at least 1');
    }
    if (config.poolSize.max < config.poolSize.min) {
      throw new ValidationError('database.poolSize.max', config.poolSize.max, 'Must be greater than min');
    }
  }
  
  if (config.timeout && config.timeout < 1000) {
    throw new ValidationError('database.timeout', config.timeout, 'Must be at least 1000ms');
  }
}

/**
 * Validate resource limits
 */
function validateResourceLimits(limits: any): void {
  const requiredFields = [
    'maxUsers', 'maxLessonsPerUser', 'maxExercisesPerDay',
    'maxConcurrentConnections', 'sessionTimeoutMinutes'
  ];
  
  for (const field of requiredFields) {
    if (typeof limits[field] !== 'number' || limits[field] < 0) {
      throw new ValidationError(`limits.${field}`, limits[field], 'Must be a non-negative number');
    }
  }
}

/**
 * Validate feature flags against tier
 */
function validateFeatureFlags(features: any, tier: DeploymentTier): void {
  // Enterprise features should only be available in premium+ tiers
  const enterpriseFeatures = [
    'ssoIntegration', 'bulkUserManagement', 'advancedReporting',
    'customBranding', 'apiAccess'
  ];
  
  if (tier === DeploymentTier.FREE) {
    for (const feature of enterpriseFeatures) {
      if (features[feature]) {
        throw new ValidationError(
          `features.${feature}`,
          features[feature],
          `Feature not available in ${tier} tier`
        );
      }
    }
  }
}

// ===== CONFIGURATION UTILITIES =====

/**
 * Get current environment configuration (cached)
 */
let cachedConfig: EnvironmentConfig | null = null;

export function getCurrentConfig(): EnvironmentConfig {
  if (!cachedConfig) {
    cachedConfig = createEnvironmentConfig();
  }
  return cachedConfig;
}

/**
 * Refresh configuration cache
 */
export function refreshConfig(): EnvironmentConfig {
  cachedConfig = null;
  return getCurrentConfig();
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(featureName: keyof EnvironmentConfig['features']): boolean {
  const config = getCurrentConfig();
  return config.features[featureName] || false;
}

/**
 * Get resource limit value
 */
export function getResourceLimit(limitName: keyof EnvironmentConfig['limits']): number {
  const config = getCurrentConfig();
  return config.limits[limitName] || 0;
}

/**
 * Get database connection configuration
 */
export function getDatabaseConnectionConfig(): DatabaseEnvironmentConfig {
  const config = getCurrentConfig();
  return config.database;
}

/**
 * Export environment detection functions
 */
export {
  detectEnvironment,
  detectDeploymentTier,
  EnvironmentType,
  DeploymentTier
} from './environment';

// ===== TYPE EXPORTS =====

export type {
  EnvironmentConfig,
  DatabaseEnvironmentConfig,
  FeatureFlags,
  ResourceLimits,
  SecurityConfig,
  OptimizationConfig,
  MonitoringConfig
} from './environment';