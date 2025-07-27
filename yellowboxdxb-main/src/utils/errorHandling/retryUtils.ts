import { CustomError, ErrorCode } from './errorTypes';

interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  onRetry?: (error: unknown, attempt: number) => void;
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  delay: 1000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  shouldRetry: (error) => {
    if (error instanceof CustomError) {
      return error.isRetryable || false;
    }
    return false;
  },
  onRetry: () => {}
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === opts.maxAttempts || !opts.shouldRetry(error, attempt)) {
        throw error;
      }
      
      opts.onRetry(error, attempt);
      
      const delay = Math.min(
        opts.delay * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelay
      );
      
      await sleep(delay);
    }
  }
  
  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createRetryableError(
  code: ErrorCode,
  message: string,
  userMessage?: string
): CustomError {
  return new CustomError(code, message, userMessage, undefined, true);
}

export const RETRYABLE_ERROR_CODES = new Set([
  ErrorCode.NETWORK_TIMEOUT,
  ErrorCode.NETWORK_REQUEST_FAILED,
  ErrorCode.FIREBASE_UNAVAILABLE,
  ErrorCode.FIREBASE_QUOTA_EXCEEDED
]);

export function isRetryableError(error: unknown): boolean {
  if (error instanceof CustomError) {
    return error.isRetryable || RETRYABLE_ERROR_CODES.has(error.code);
  }
  
  if (error instanceof Error) {
    const retryableMessages = [
      'network',
      'timeout',
      'unavailable',
      'quota',
      'rate limit'
    ];
    
    return retryableMessages.some(msg => 
      error.message.toLowerCase().includes(msg)
    );
  }
  
  return false;
}