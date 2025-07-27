import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import { env, isProduction, isStaging } from '@/config/environment';

export function initializeSentry(): void {
  if (!env.sentry?.dsn) {
    console.log('Sentry DSN not configured, skipping initialization');
    return;
  }

  if (!isProduction && !isStaging) {
    console.log('Sentry disabled in development environment');
    return;
  }

  Sentry.init({
    dsn: env.sentry.dsn,
    environment: env.sentry.environment,
    release: env.sentry.release,
    
    // Performance Monitoring
    integrations: [
      new BrowserTracing({
        // Set sampling rate for performance monitoring
        tracingOrigins: [
          'localhost',
          env.firebase.authDomain,
          /^\//,
        ],
        // Capture interactions
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          window.history
        ),
      }),
    ],
    
    // Performance sampling
    tracesSampleRate: isProduction ? 0.1 : 1.0,
    
    // Session tracking
    autoSessionTracking: true,
    
    // Release health
    attachStacktrace: true,
    
    // Privacy
    beforeSend(event, hint) {
      // Filter out sensitive data
      if (event.request?.cookies) {
        delete event.request.cookies;
      }
      
      // Don't send events in development
      if (!isProduction && !isStaging) {
        return null;
      }
      
      // Filter out known non-errors
      const error = hint.originalException;
      if (error && typeof error === 'string') {
        // Filter out network errors that are expected
        if (error.includes('Network request failed')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Ignore certain errors
    ignoreErrors: [
      // Browser extensions
      'top.GLOBALS',
      // Random network errors
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // Firebase errors that are handled
      'permission-denied',
      'unauthenticated',
      // React errors
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
    ],
    
    // Don't capture console logs
    integrations: function(integrations) {
      return integrations.filter(integration => 
        integration.name !== 'CaptureConsole'
      );
    },
  });
}

// User context
export function setSentryUser(user: { id: string; email?: string; role?: string } | null): void {
  if (!env.sentry?.dsn) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      role: user.role,
    });
  } else {
    Sentry.setUser(null);
  }
}

// Custom error logging
export function logError(error: Error, context?: Record<string, any>): void {
  console.error('Application Error:', error);
  
  if (!env.sentry?.dsn) return;
  
  Sentry.captureException(error, {
    contexts: {
      custom: context || {},
    },
  });
}

// Performance monitoring
export function measurePerformance(name: string, fn: () => Promise<any>): Promise<any> {
  if (!env.sentry?.dsn) return fn();
  
  const transaction = Sentry.startTransaction({
    op: 'function',
    name,
  });
  
  Sentry.getCurrentHub().configureScope(scope => scope.setSpan(transaction));
  
  return fn()
    .then(result => {
      transaction.setStatus('ok');
      return result;
    })
    .catch(error => {
      transaction.setStatus('internal_error');
      throw error;
    })
    .finally(() => {
      transaction.finish();
    });
}

// Breadcrumb logging
export function addBreadcrumb(
  message: string,
  category: string,
  level: Sentry.SeverityLevel = 'info',
  data?: Record<string, any>
): void {
  if (!env.sentry?.dsn) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    level,
    data,
    timestamp: Date.now() / 1000,
  });
}