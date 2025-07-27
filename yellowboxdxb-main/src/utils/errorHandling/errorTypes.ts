export enum ErrorCode {
  // Authentication Errors
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_UNAUTHORIZED = 'AUTH_UNAUTHORIZED',
  AUTH_FORBIDDEN = 'AUTH_FORBIDDEN',
  
  // Firebase Errors
  FIREBASE_PERMISSION_DENIED = 'FIREBASE_PERMISSION_DENIED',
  FIREBASE_NOT_FOUND = 'FIREBASE_NOT_FOUND',
  FIREBASE_ALREADY_EXISTS = 'FIREBASE_ALREADY_EXISTS',
  FIREBASE_QUOTA_EXCEEDED = 'FIREBASE_QUOTA_EXCEEDED',
  FIREBASE_UNAVAILABLE = 'FIREBASE_UNAVAILABLE',
  
  // Validation Errors
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_OUT_OF_RANGE = 'VALIDATION_OUT_OF_RANGE',
  
  // Business Logic Errors
  BUSINESS_INVALID_STATUS = 'BUSINESS_INVALID_STATUS',
  BUSINESS_INSUFFICIENT_FUNDS = 'BUSINESS_INSUFFICIENT_FUNDS',
  BUSINESS_DUPLICATE_ENTRY = 'BUSINESS_DUPLICATE_ENTRY',
  BUSINESS_LIMIT_EXCEEDED = 'BUSINESS_LIMIT_EXCEEDED',
  
  // Network Errors
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_REQUEST_FAILED = 'NETWORK_REQUEST_FAILED',
  
  // Generic Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

export interface AppError extends Error {
  code: ErrorCode;
  message: string;
  details?: any;
  isRetryable?: boolean;
  userMessage?: string;
  timestamp: Date;
}

export class CustomError extends Error implements AppError {
  code: ErrorCode;
  details?: any;
  isRetryable: boolean;
  userMessage: string;
  timestamp: Date;

  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    details?: any,
    isRetryable = false
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.userMessage = userMessage || message;
    this.details = details;
    this.isRetryable = isRetryable;
    this.timestamp = new Date();
    
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}