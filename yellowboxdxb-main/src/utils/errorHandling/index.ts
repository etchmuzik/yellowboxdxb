export { ErrorCode, CustomError } from './errorTypes';
export type { AppError } from './errorTypes';
export { errorHandler, ErrorHandler } from './errorHandler';
export { withRetry, isRetryableError, createRetryableError, RETRYABLE_ERROR_CODES } from './retryUtils';

// Convenience functions
export function handleError(error: unknown, userMessage?: string): void {
  errorHandler.handleError(error, {
    showToast: true,
    logError: true,
    rethrow: false
  });
}

export function logError(error: unknown): void {
  errorHandler.handleError(error, {
    showToast: false,
    logError: true,
    rethrow: false
  });
}

export function throwError(code: ErrorCode, message: string, userMessage?: string): never {
  throw new CustomError(code, message, userMessage);
}