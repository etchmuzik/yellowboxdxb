import { logActivity } from './activityService';
import { toast } from 'sonner';

interface ErrorDetails {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userAction?: string;
}

class ErrorService {
  private isProduction = import.meta.env.PROD;

  // Log error to activity service and optionally show user notification
  async logError(error: Error | ErrorDetails, showToast = true): Promise<void> {
    const errorDetails: ErrorDetails = error instanceof Error
      ? {
          message: error.message,
          stack: error.stack,
        }
      : error;

    // Always log to console in development
    if (!this.isProduction) {
      console.error('Error caught:', errorDetails);
    }

    try {
      // Log to activity service
      await logActivity(
        'system',
        'error',
        errorDetails.message,
        {
          ...errorDetails.context,
          stack: errorDetails.stack,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        }
      );
    } catch (logError) {
      // If logging fails, at least log to console
      console.error('Failed to log error:', logError);
    }

    // Show user-friendly error message
    if (showToast) {
      this.showErrorToast(errorDetails.message);
    }
  }

  // Show user-friendly error message
  showErrorToast(message: string): void {
    const userFriendlyMessage = this.getUserFriendlyMessage(message);
    
    toast.error('Error', {
      description: userFriendlyMessage,
      duration: 5000,
    });
  }

  // Convert technical errors to user-friendly messages
  private getUserFriendlyMessage(message: string): string {
    // Network errors
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your connection and try again.';
    }
    
    // Permission errors
    if (message.includes('permission') || message.includes('denied')) {
      return 'You don\'t have permission to perform this action.';
    }
    
    // Firebase errors
    if (message.includes('Firebase') || message.includes('firestore')) {
      return 'Database error. Please try again later.';
    }
    
    // Auth errors
    if (message.includes('auth') || message.includes('unauthenticated')) {
      return 'Authentication error. Please log in again.';
    }
    
    // Default message
    return 'Something went wrong. Please try again.';
  }

  // Global error handler for unhandled rejections
  setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      this.logError({
        message: `Unhandled promise rejection: ${event.reason}`,
        context: {
          type: 'unhandledRejection',
          reason: event.reason,
        }
      });
      
      // Prevent default browser behavior
      event.preventDefault();
    });

    // Handle general errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      this.logError({
        message: event.error?.message || 'Unknown error',
        stack: event.error?.stack,
        context: {
          type: 'globalError',
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        }
      });
      
      // Prevent default browser behavior
      event.preventDefault();
    });
  }

  // Wrap async functions with error handling
  wrapAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    context?: string
  ): T {
    return (async (...args: Parameters<T>) => {
      try {
        return await fn(...args);
      } catch (error) {
        await this.logError({
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          context: {
            functionName: fn.name,
            contextDescription: context,
            args: args.map(arg => typeof arg === 'object' ? '[Object]' : arg),
          }
        });
        throw error;
      }
    }) as T;
  }
}

export const errorService = new ErrorService();

// Export convenience functions
export const logError = errorService.logError.bind(errorService);
export const showErrorToast = errorService.showErrorToast.bind(errorService);
export const wrapAsync = errorService.wrapAsync.bind(errorService);
export const setupGlobalErrorHandlers = errorService.setupGlobalErrorHandlers.bind(errorService);