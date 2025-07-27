import { FirestoreError } from 'firebase/firestore';
import { FirebaseError } from 'firebase/app';
import { toast } from 'sonner';
import { ErrorCode, CustomError } from './errorTypes';

interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  rethrow?: boolean;
}

const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logError: true,
  rethrow: false
};

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorLog: CustomError[] = [];
  private readonly maxLogSize = 100;

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  handleError(error: unknown, options: ErrorHandlerOptions = {}): CustomError {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    const appError = this.normalizeError(error);

    if (opts.logError) {
      this.logError(appError);
    }

    if (opts.showToast) {
      this.showErrorToast(appError);
    }

    if (opts.rethrow) {
      throw appError;
    }

    return appError;
  }

  private normalizeError(error: unknown): CustomError {
    if (error instanceof CustomError) {
      return error;
    }

    if (error instanceof FirestoreError || error instanceof FirebaseError) {
      return this.handleFirebaseError(error);
    }

    if (error instanceof Error) {
      return new CustomError(
        ErrorCode.INTERNAL_ERROR,
        error.message,
        'An unexpected error occurred'
      );
    }

    return new CustomError(
      ErrorCode.UNKNOWN_ERROR,
      String(error),
      'An unknown error occurred'
    );
  }

  private handleFirebaseError(error: FirestoreError | FirebaseError): CustomError {
    const errorMap: Record<string, { code: ErrorCode; message: string; isRetryable?: boolean }> = {
      'permission-denied': {
        code: ErrorCode.FIREBASE_PERMISSION_DENIED,
        message: 'You do not have permission to perform this action'
      },
      'not-found': {
        code: ErrorCode.FIREBASE_NOT_FOUND,
        message: 'The requested resource was not found'
      },
      'already-exists': {
        code: ErrorCode.FIREBASE_ALREADY_EXISTS,
        message: 'This resource already exists'
      },
      'resource-exhausted': {
        code: ErrorCode.FIREBASE_QUOTA_EXCEEDED,
        message: 'Quota exceeded. Please try again later',
        isRetryable: true
      },
      'unavailable': {
        code: ErrorCode.FIREBASE_UNAVAILABLE,
        message: 'Service temporarily unavailable',
        isRetryable: true
      },
      'unauthenticated': {
        code: ErrorCode.AUTH_UNAUTHORIZED,
        message: 'Please log in to continue'
      },
      'invalid-argument': {
        code: ErrorCode.VALIDATION_INVALID_FORMAT,
        message: 'Invalid data provided'
      }
    };

    const mapped = errorMap[error.code] || {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An error occurred while processing your request'
    };

    return new CustomError(
      mapped.code,
      error.message,
      mapped.message,
      { originalCode: error.code },
      mapped.isRetryable || false
    );
  }

  private showErrorToast(error: CustomError): void {
    const message = error.userMessage || 'An error occurred';
    
    if (error.isRetryable) {
      toast.error(message, {
        action: {
          label: 'Retry',
          onClick: () => {
            window.location.reload();
          }
        }
      });
    } else {
      toast.error(message);
    }
  }

  private logError(error: CustomError): void {
    console.error('[ErrorHandler]', {
      code: error.code,
      message: error.message,
      userMessage: error.userMessage,
      details: error.details,
      timestamp: error.timestamp,
      stack: error.stack
    });

    this.errorLog.unshift(error);
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog.pop();
    }
  }

  getErrorLog(): CustomError[] {
    return [...this.errorLog];
  }

  clearErrorLog(): void {
    this.errorLog = [];
  }
}

export const errorHandler = ErrorHandler.getInstance();