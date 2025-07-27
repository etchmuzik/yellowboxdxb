/**
 * Environment configuration with type safety and validation
 */

export type Environment = 'development' | 'staging' | 'production';

interface EnvironmentConfig {
  // Firebase
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
    functionsUrl?: string;
  };
  
  // Google Maps
  googleMaps: {
    apiKey: string;
  };
  
  // App
  app: {
    name: string;
    environment: Environment;
    version: string;
    buildTime: string;
  };
  
  // Features
  features: {
    analytics: boolean;
    errorReporting: boolean;
    performanceMonitoring: boolean;
    appCheck: boolean;
  };
  
  // External Services
  sentry?: {
    dsn: string;
    environment: string;
    release: string;
  };
  
  // Rate Limiting
  rateLimits: {
    perMinute: number;
    perHour: number;
  };
  
  // Security
  security: {
    httpsRedirect: boolean;
    enableCSP: boolean;
    cspReportUri?: string;
  };
}

function getEnvVar(key: string, defaultValue?: string): string {
  const value = import.meta.env[key] || defaultValue;
  if (!value && !defaultValue) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function getEnvBoolean(key: string, defaultValue = false): boolean {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  return value === 'true' || value === true;
}

function getEnvNumber(key: string, defaultValue: number): number {
  const value = import.meta.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

export function getEnvironmentConfig(): EnvironmentConfig {
  const environment = (getEnvVar('VITE_APP_ENVIRONMENT', 'development') as Environment);
  
  const config: EnvironmentConfig = {
    firebase: {
      apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
      authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
      projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
      storageBucket: getEnvVar('VITE_FIREBASE_STORAGE_BUCKET'),
      messagingSenderId: getEnvVar('VITE_FIREBASE_MESSAGING_SENDER_ID'),
      appId: getEnvVar('VITE_FIREBASE_APP_ID'),
      measurementId: getEnvVar('VITE_FIREBASE_MEASUREMENT_ID', ''),
      functionsUrl: getEnvVar('VITE_FIREBASE_FUNCTIONS_URL', ''),
    },
    
    googleMaps: {
      apiKey: getEnvVar('VITE_GOOGLE_MAPS_API_KEY', ''),
    },
    
    app: {
      name: getEnvVar('VITE_APP_NAME', 'Yellow Box'),
      environment,
      version: getEnvVar('VITE_APP_VERSION', '1.0.0'),
      buildTime: getEnvVar('VITE_APP_BUILD_TIME', new Date().toISOString()),
    },
    
    features: {
      analytics: getEnvBoolean('VITE_ENABLE_ANALYTICS', environment === 'production'),
      errorReporting: getEnvBoolean('VITE_ENABLE_ERROR_REPORTING', environment !== 'development'),
      performanceMonitoring: getEnvBoolean('VITE_ENABLE_PERFORMANCE_MONITORING', environment === 'production'),
      appCheck: getEnvBoolean('VITE_ENABLE_APP_CHECK', environment === 'production'),
    },
    
    rateLimits: {
      perMinute: getEnvNumber('VITE_API_RATE_LIMIT_PER_MINUTE', 60),
      perHour: getEnvNumber('VITE_API_RATE_LIMIT_PER_HOUR', 1000),
    },
    
    security: {
      httpsRedirect: getEnvBoolean('VITE_ENABLE_HTTPS_REDIRECT', environment === 'production'),
      enableCSP: getEnvBoolean('VITE_ENABLE_CSP', environment === 'production'),
      cspReportUri: getEnvVar('VITE_CSP_REPORT_URI', ''),
    },
  };
  
  // Optional Sentry configuration
  const sentryDsn = getEnvVar('VITE_SENTRY_DSN', '');
  if (sentryDsn) {
    config.sentry = {
      dsn: sentryDsn,
      environment: getEnvVar('VITE_SENTRY_ENVIRONMENT', environment),
      release: getEnvVar('VITE_SENTRY_RELEASE', config.app.version),
    };
  }
  
  return config;
}

export const env = getEnvironmentConfig();

// Environment checks
export const isDevelopment = env.app.environment === 'development';
export const isStaging = env.app.environment === 'staging';
export const isProduction = env.app.environment === 'production';

// Environment logging removed for production