import { initializeSentry, setSentryUser } from './sentryService';
import { initializePerformanceMonitoring, reportWebVitals } from './performanceService';
import { initializeAnalytics } from './analyticsService';
import { env } from '@/config/environment';

export * from './sentryService';
export * from './performanceService';
export * from './analyticsService';

export function initializeMonitoring(): void {
  console.log('🔍 Initializing monitoring services...');
  
  // Initialize Sentry for error tracking
  if (env.features.errorReporting) {
    try {
      initializeSentry();
      console.log('✅ Sentry initialized');
    } catch (error) {
      console.error('Failed to initialize Sentry:', error);
    }
  }
  
  // Initialize Firebase Performance Monitoring
  if (env.features.performanceMonitoring) {
    try {
      initializePerformanceMonitoring();
      reportWebVitals();
      console.log('✅ Performance monitoring initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }
  
  // Initialize Firebase Analytics
  if (env.features.analytics) {
    try {
      initializeAnalytics();
      console.log('✅ Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
    }
  }
  
  // Set up global error handler
  if (env.features.errorReporting) {
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
    });
  }
}