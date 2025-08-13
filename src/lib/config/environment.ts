/**
 * Environment Configuration System
 * 
 * Handles environment detection, feature flags, and configuration management
 * for different deployment scenarios (local, hosted free, hosted premium).
 */

// ===== ENVIRONMENT TYPES =====

export enum EnvironmentType {
  LOCAL = 'local',
  HOSTED_FREE = 'hosted_free', 
  HOSTED_PREMIUM = 'hosted_premium',
  DEVELOPMENT = 'development',
  TESTING = 'testing',
  STAGING = 'staging',
  PRODUCTION = 'production'
}

export enum DeploymentTier {
  LOCAL = 'local',
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise'
}

// ===== CONFIGURATION INTERFACES =====

export interface EnvironmentConfig {
  type: EnvironmentType;
  tier: DeploymentTier;
  database: DatabaseEnvironmentConfig;
  features: FeatureFlags;
  limits: ResourceLimits;
  security: SecurityConfig;
  optimization: OptimizationConfig;
  monitoring: MonitoringConfig;
}

export interface DatabaseEnvironmentConfig {
  provider: 'sqlite' | 'postgresql' | 'mysql';
  url: string;
  poolSize?: {
    min: number;
    max: number;
  };
  ssl?: boolean;
  timeout?: number;
  retries?: number;
  backup?: {
    enabled: boolean;
    frequency?: string;
    retention?: number;
  };
}

export interface FeatureFlags {
  // Core features
  userRegistration: boolean;
  guestMode: boolean;
  offlineMode: boolean;
  
  // Premium features
  unlimitedLessons: boolean;
  advancedAnalytics: boolean;
  customContent: boolean;
  exportData: boolean;
  prioritySupport: boolean;
  
  // Enterprise features
  ssoIntegration: boolean;
  bulkUserManagement: boolean;
  advancedReporting: boolean;
  customBranding: boolean;
  apiAccess: boolean;
  
  // Experimental features
  aiTutor: boolean;
  voiceRecognition: boolean;
  gamification: boolean;
  socialLearning: boolean;
}

export interface ResourceLimits {
  // User limits
  maxUsers: number;
  maxLessonsPerUser: number;
  maxExercisesPerDay: number;
  maxAssessmentsPerDay: number;
  
  // Content limits
  maxCustomLessons: number;
  maxUploadSizeMB: number;
  maxStorageGB: number;
  
  // Performance limits
  maxConcurrentConnections: number;
  maxQueriesPerMinute: number;
  maxRequestsPerHour: number;
  
  // Time limits
  sessionTimeoutMinutes: number;
  inactivityTimeoutMinutes: number;
}

export interface SecurityConfig {
  authentication: {
    required: boolean;
    methods: ('password' | 'oauth' | 'sso')[];
    passwordPolicy: {
      minLength: number;
      requireSpecialChar: boolean;
      requireNumber: boolean;
      requireUppercase: boolean;
    };
  };
  encryption: {
    atRest: boolean;
    inTransit: boolean;
    algorithm: string;
  };
  audit: {
    enabled: boolean;
    logLevel: 'basic' | 'detailed' | 'comprehensive';
    retention: number;
  };
  rateLimiting: {
    enabled: boolean;
    requestsPerMinute: number;
    burstLimit: number;
  };
}

export interface OptimizationConfig {
  caching: {
    enabled: boolean;
    strategy: 'memory' | 'redis' | 'file';
    ttl: number;
  };
  compression: {
    enabled: boolean;
    algorithm: 'gzip' | 'brotli';
    level: number;
  };
  cdn: {
    enabled: boolean;
    provider?: string;
    regions?: string[];
  };
  preloading: {
    enabled: boolean;
    strategies: string[];
  };
}

export interface MonitoringConfig {
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
    destination: 'console' | 'file' | 'remote';
  };
  metrics: {
    enabled: boolean;
    provider?: 'prometheus' | 'datadog' | 'newrelic';
    interval: number;
  };
  alerts: {
    enabled: boolean;
    channels: ('email' | 'slack' | 'webhook')[];
    thresholds: {
      errorRate: number;
      responseTime: number;
      memoryUsage: number;
    };
  };
  healthChecks: {
    enabled: boolean;
    interval: number;
    endpoints: string[];
  };
}

// ===== ENVIRONMENT DETECTION =====

/**
 * Detect current environment based on various indicators
 */
export function detectEnvironment(): EnvironmentType {
  // Check explicit environment variable first
  const envVar = process.env.GRAM_ENVIRONMENT?.toLowerCase();
  if (envVar && Object.values(EnvironmentType).includes(envVar as EnvironmentType)) {
    return envVar as EnvironmentType;
  }
  
  // Check NODE_ENV for standard values
  const nodeEnv = process.env.NODE_ENV?.toLowerCase();
  switch (nodeEnv) {
    case 'development':
      return EnvironmentType.DEVELOPMENT;
    case 'test':
    case 'testing':
      return EnvironmentType.TESTING;
    case 'staging':
      return EnvironmentType.STAGING;
    case 'production':
      return EnvironmentType.PRODUCTION;
  }
  
  // Check for hosting platform indicators
  if (process.env.VERCEL || process.env.NETLIFY || process.env.HEROKU_APP_NAME) {
    // Check if it's a premium deployment
    if (process.env.GRAM_TIER === 'premium' || process.env.DATABASE_URL?.includes('postgres')) {
      return EnvironmentType.HOSTED_PREMIUM;
    }
    return EnvironmentType.HOSTED_FREE;
  }
  
  // Check for local development indicators
  if (
    process.env.DATABASE_URL?.includes('localhost') ||
    process.env.DATABASE_URL?.includes('file:') ||
    process.env.PWD?.includes('/Users/') ||
    process.env.HOME
  ) {
    return EnvironmentType.LOCAL;
  }
  
  // Default to local for unknown environments
  return EnvironmentType.LOCAL;
}

/**
 * Detect deployment tier based on environment and configuration
 */
export function detectDeploymentTier(envType: EnvironmentType): DeploymentTier {
  // Check explicit tier setting
  const tierVar = process.env.GRAM_TIER?.toLowerCase();
  if (tierVar && Object.values(DeploymentTier).includes(tierVar as DeploymentTier)) {
    return tierVar as DeploymentTier;
  }
  
  // Determine tier based on environment
  switch (envType) {
    case EnvironmentType.LOCAL:
    case EnvironmentType.DEVELOPMENT:
    case EnvironmentType.TESTING:
      return DeploymentTier.LOCAL;
    
    case EnvironmentType.HOSTED_FREE:
      return DeploymentTier.FREE;
    
    case EnvironmentType.HOSTED_PREMIUM:
    case EnvironmentType.STAGING:
    case EnvironmentType.PRODUCTION:
      // Check for premium indicators
      if (
        process.env.DATABASE_URL?.includes('postgres') ||
        process.env.REDIS_URL ||
        process.env.MONITORING_ENABLED === 'true'
      ) {
        return DeploymentTier.PREMIUM;
      }
      return DeploymentTier.FREE;
    
    default:
      return DeploymentTier.LOCAL;
  }
}

// ===== CONFIGURATION PRESETS =====

/**
 * Get feature flags for deployment tier
 */
export function getFeatureFlags(tier: DeploymentTier): FeatureFlags {
  const baseFeatures: FeatureFlags = {
    // Core features - available in all tiers
    userRegistration: true,
    guestMode: true,
    offlineMode: false,
    
    // Premium features - limited by tier
    unlimitedLessons: false,
    advancedAnalytics: false,
    customContent: false,
    exportData: false,
    prioritySupport: false,
    
    // Enterprise features - only in premium+
    ssoIntegration: false,
    bulkUserManagement: false,
    advancedReporting: false,
    customBranding: false,
    apiAccess: false,
    
    // Experimental features - configurable
    aiTutor: false,
    voiceRecognition: false,
    gamification: true,
    socialLearning: false
  };
  
  switch (tier) {
    case DeploymentTier.LOCAL:
      return {
        ...baseFeatures,
        // Enable all features for local development
        unlimitedLessons: true,
        advancedAnalytics: true,
        customContent: true,
        exportData: true,
        ssoIntegration: true,
        bulkUserManagement: true,
        advancedReporting: true,
        customBranding: true,
        apiAccess: true,
        aiTutor: true,
        voiceRecognition: true,
        socialLearning: true
      };
    
    case DeploymentTier.FREE:
      return {
        ...baseFeatures,
        // Limited features for free tier
        offlineMode: true
      };
    
    case DeploymentTier.PREMIUM:
      return {
        ...baseFeatures,
        // Premium features enabled
        unlimitedLessons: true,
        advancedAnalytics: true,
        customContent: true,
        exportData: true,
        prioritySupport: true,
        offlineMode: true,
        aiTutor: true,
        socialLearning: true
      };
    
    case DeploymentTier.ENTERPRISE:
      return {
        ...baseFeatures,
        // All features enabled for enterprise
        unlimitedLessons: true,
        advancedAnalytics: true,
        customContent: true,
        exportData: true,
        prioritySupport: true,
        ssoIntegration: true,
        bulkUserManagement: true,
        advancedReporting: true,
        customBranding: true,
        apiAccess: true,
        offlineMode: true,
        aiTutor: true,
        voiceRecognition: true,
        gamification: true,
        socialLearning: true
      };
    
    default:
      return baseFeatures;
  }
}

/**
 * Get resource limits for deployment tier
 */
export function getResourceLimits(tier: DeploymentTier): ResourceLimits {
  switch (tier) {
    case DeploymentTier.LOCAL:
      return {
        maxUsers: 1000,
        maxLessonsPerUser: 1000,
        maxExercisesPerDay: 1000,
        maxAssessmentsPerDay: 100,
        maxCustomLessons: 1000,
        maxUploadSizeMB: 100,
        maxStorageGB: 10,
        maxConcurrentConnections: 100,
        maxQueriesPerMinute: 10000,
        maxRequestsPerHour: 100000,
        sessionTimeoutMinutes: 480,
        inactivityTimeoutMinutes: 120
      };
    
    case DeploymentTier.FREE:
      return {
        maxUsers: 100,
        maxLessonsPerUser: 10,
        maxExercisesPerDay: 50,
        maxAssessmentsPerDay: 5,
        maxCustomLessons: 0,
        maxUploadSizeMB: 5,
        maxStorageGB: 0.1,
        maxConcurrentConnections: 10,
        maxQueriesPerMinute: 100,
        maxRequestsPerHour: 1000,
        sessionTimeoutMinutes: 60,
        inactivityTimeoutMinutes: 30
      };
    
    case DeploymentTier.PREMIUM:
      return {
        maxUsers: 10000,
        maxLessonsPerUser: 1000,
        maxExercisesPerDay: 500,
        maxAssessmentsPerDay: 50,
        maxCustomLessons: 100,
        maxUploadSizeMB: 50,
        maxStorageGB: 5,
        maxConcurrentConnections: 100,
        maxQueriesPerMinute: 1000,
        maxRequestsPerHour: 10000,
        sessionTimeoutMinutes: 240,
        inactivityTimeoutMinutes: 60
      };
    
    case DeploymentTier.ENTERPRISE:
      return {
        maxUsers: 100000,
        maxLessonsPerUser: 10000,
        maxExercisesPerDay: 1000,
        maxAssessmentsPerDay: 100,
        maxCustomLessons: 1000,
        maxUploadSizeMB: 100,
        maxStorageGB: 100,
        maxConcurrentConnections: 1000,
        maxQueriesPerMinute: 10000,
        maxRequestsPerHour: 100000,
        sessionTimeoutMinutes: 480,
        inactivityTimeoutMinutes: 120
      };
    
    default:
      return getResourceLimits(DeploymentTier.FREE);
  }
}

/**
 * Get security configuration for deployment tier
 */
export function getSecurityConfig(tier: DeploymentTier): SecurityConfig {
  const baseConfig: SecurityConfig = {
    authentication: {
      required: true,
      methods: ['password'],
      passwordPolicy: {
        minLength: 8,
        requireSpecialChar: false,
        requireNumber: true,
        requireUppercase: true
      }
    },
    encryption: {
      atRest: false,
      inTransit: true,
      algorithm: 'AES-256-GCM'
    },
    audit: {
      enabled: false,
      logLevel: 'basic',
      retention: 30
    },
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 100,
      burstLimit: 200
    }
  };
  
  switch (tier) {
    case DeploymentTier.LOCAL:
      return {
        ...baseConfig,
        authentication: {
          ...baseConfig.authentication,
          required: false,
          methods: ['password', 'oauth']
        },
        rateLimiting: {
          ...baseConfig.rateLimiting,
          enabled: false
        }
      };
    
    case DeploymentTier.FREE:
      return baseConfig;
    
    case DeploymentTier.PREMIUM:
      return {
        ...baseConfig,
        authentication: {
          ...baseConfig.authentication,
          methods: ['password', 'oauth'],
          passwordPolicy: {
            ...baseConfig.authentication.passwordPolicy,
            minLength: 10,
            requireSpecialChar: true
          }
        },
        encryption: {
          ...baseConfig.encryption,
          atRest: true
        },
        audit: {
          enabled: true,
          logLevel: 'detailed',
          retention: 90
        },
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 1000,
          burstLimit: 2000
        }
      };
    
    case DeploymentTier.ENTERPRISE:
      return {
        ...baseConfig,
        authentication: {
          required: true,
          methods: ['password', 'oauth', 'sso'],
          passwordPolicy: {
            minLength: 12,
            requireSpecialChar: true,
            requireNumber: true,
            requireUppercase: true
          }
        },
        encryption: {
          atRest: true,
          inTransit: true,
          algorithm: 'AES-256-GCM'
        },
        audit: {
          enabled: true,
          logLevel: 'comprehensive',
          retention: 365
        },
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 10000,
          burstLimit: 20000
        }
      };
    
    default:
      return baseConfig;
  }
}