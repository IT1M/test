import toast from 'react-hot-toast';

// ============================================================================
// Error Types
// ============================================================================

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404);
  }
}

export class PermissionError extends AppError {
  constructor(action: string) {
    super(`You do not have permission to ${action}`, 'PERMISSION_DENIED', 403);
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Network connection failed') {
    super(message, 'NETWORK_ERROR', 0);
  }
}

export class APIRateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super(
      retryAfter
        ? `Rate limit exceeded. Please try again in ${retryAfter} seconds`
        : 'Rate limit exceeded. Please try again later',
      'RATE_LIMIT_ERROR',
      429
    );
  }
}

export class QuotaExceededError extends AppError {
  constructor(resource: string = 'Storage') {
    super(`${resource} quota exceeded`, 'QUOTA_EXCEEDED', 507);
  }
}

export class TimeoutError extends AppError {
  constructor(operation: string = 'Operation') {
    super(`${operation} timed out`, 'TIMEOUT_ERROR', 408);
  }
}

// ============================================================================
// Error Context
// ============================================================================

export interface ErrorContext {
  entityType?: string;
  entityId?: string;
  userId?: string;
  operation?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// Error Handler Class
// ============================================================================

export class ErrorHandler {
  private static errorLog: Array<{
    error: Error;
    context: ErrorContext;
    timestamp: Date;
  }> = [];

  /**
   * Main error handling method
   */
  static async handle(error: Error, context: ErrorContext = {}): Promise<void> {
    // Log error
    this.logError(error, context);

    // Show user-friendly message
    const userMessage = this.getUserFriendlyMessage(error);
    toast.error(userMessage);

    // Attempt recovery if possible
    if (this.isRecoverable(error)) {
      await this.attemptRecovery(error, context);
    }

    // Report to admin (in production, this would send to monitoring service)
    await this.reportToAdmin(error, context);
  }

  /**
   * Gets user-friendly error message
   */
  static getUserFriendlyMessage(error: Error): string {
    if (error instanceof AppError) {
      return error.message;
    }

    const errorMessages: Record<string, string> = {
      NetworkError: 'Connection issue. Please check your internet connection.',
      QuotaExceededError: 'Storage limit reached. Please free up space.',
      APIRateLimitError: 'Too many requests. Please wait a moment.',
      ValidationError: 'Please check your input and try again.',
      NotFoundError: 'The requested item was not found.',
      PermissionError: 'You do not have permission to perform this action.',
      TimeoutError: 'The operation took too long. Please try again.',
      TypeError: 'Invalid data format. Please check your input.',
      ReferenceError: 'Something went wrong. Please refresh the page.',
    };

    return (
      errorMessages[error.name] ||
      'An unexpected error occurred. Please try again.'
    );
  }

  /**
   * Checks if error is recoverable
   */
  static isRecoverable(error: Error): boolean {
    const recoverableErrors = [
      'NetworkError',
      'APIRateLimitError',
      'TimeoutError',
    ];

    if (error instanceof AppError) {
      return error.isOperational;
    }

    return recoverableErrors.includes(error.name);
  }

  /**
   * Attempts to recover from error
   */
  static async attemptRecovery(
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    if (error instanceof NetworkError) {
      // Queue operation for retry when online
      await this.queueForRetry(context);
    } else if (error instanceof APIRateLimitError) {
      // Retry with exponential backoff
      if (context.operation) {
        toast.loading('Retrying operation...', { duration: 2000 });
      }
    } else if (error instanceof TimeoutError) {
      // Suggest user to try again
      toast('Please try again', { icon: '🔄' });
    }
  }

  /**
   * Queues operation for retry
   */
  private static async queueForRetry(context: ErrorContext): Promise<void> {
    // In a real implementation, this would use a queue system
    // For now, we'll just log it
    console.log('Queued for retry:', context);

    // Check if online
    if (typeof window !== 'undefined' && navigator.onLine) {
      toast.success('Connection restored. Retrying...');
    } else {
      toast('Operation will retry when connection is restored', {
        icon: '📡',
        duration: 5000,
      });
    }
  }

  /**
   * Logs error to console and storage
   */
  private static logError(error: Error, context: ErrorContext): void {
    const errorEntry = {
      error,
      context,
      timestamp: new Date(),
    };

    // Add to in-memory log
    this.errorLog.push(errorEntry);

    // Keep only last 100 errors
    if (this.errorLog.length > 100) {
      this.errorLog.shift();
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error occurred:', {
        message: error.message,
        name: error.name,
        stack: error.stack,
        context,
      });
    }

    // In production, this would send to a logging service
    // For now, we'll store in localStorage
    if (typeof window !== 'undefined') {
      try {
        const logs = JSON.parse(localStorage.getItem('error_logs') || '[]');
        logs.push({
          message: error.message,
          name: error.name,
          context,
          timestamp: new Date().toISOString(),
        });

        // Keep only last 50 logs
        if (logs.length > 50) {
          logs.shift();
        }

        localStorage.setItem('error_logs', JSON.stringify(logs));
      } catch (e) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Reports error to admin dashboard
   */
  private static async reportToAdmin(
    error: Error,
    context: ErrorContext
  ): Promise<void> {
    // In a real implementation, this would send to admin dashboard or monitoring service
    // For now, we'll just log it
    if (error instanceof AppError && !error.isOperational) {
      console.error('Critical error reported to admin:', error);
    }
  }

  /**
   * Gets error log
   */
  static getErrorLog(): Array<{
    error: Error;
    context: ErrorContext;
    timestamp: Date;
  }> {
    return [...this.errorLog];
  }

  /**
   * Clears error log
   */
  static clearErrorLog(): void {
    this.errorLog = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('error_logs');
    }
  }
}

// ============================================================================
// Retry Logic with Exponential Backoff
// ============================================================================

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Retries a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry,
  } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        // Wait before retrying
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

/**
 * Retries a function with linear backoff
 */
export async function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const { maxRetries = 3, baseDelay = 1000, onRetry } = options;

  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * (attempt + 1);

        if (onRetry) {
          onRetry(attempt + 1, lastError);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// ============================================================================
// Async Error Wrapper
// ============================================================================

/**
 * Wraps async function with error handling
 */
export function asyncErrorHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      await ErrorHandler.handle(error as Error, context || {});
      return undefined;
    }
  };
}

/**
 * Wraps async function and throws error
 */
export function asyncErrorThrower<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(
        (error as Error).message || 'An unexpected error occurred',
        'UNKNOWN_ERROR'
      );
    }
  };
}

// ============================================================================
// Error Boundary Helpers
// ============================================================================

export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Creates error boundary state
 */
export function createErrorBoundaryState(): ErrorBoundaryState {
  return {
    hasError: false,
  };
}

/**
 * Handles error boundary error
 */
export function handleErrorBoundaryError(
  error: Error,
  errorInfo: React.ErrorInfo
): ErrorBoundaryState {
  ErrorHandler.handle(error, {
    entityType: 'ui',
    operation: 'render',
    metadata: { componentStack: errorInfo.componentStack },
  });

  return {
    hasError: true,
    error,
    errorInfo,
  };
}

/**
 * Resets error boundary
 */
export function resetErrorBoundary(): ErrorBoundaryState {
  return {
    hasError: false,
  };
}

// ============================================================================
// Validation Error Helpers
// ============================================================================

/**
 * Creates validation error from field errors
 */
export function createValidationError(
  errors: Record<string, string>
): ValidationError {
  const firstError = Object.values(errors)[0];
  return new ValidationError(firstError || 'Validation failed');
}

/**
 * Throws validation error if errors exist
 */
export function throwIfValidationErrors(
  errors: Record<string, string>
): void {
  if (Object.keys(errors).length > 0) {
    throw createValidationError(errors);
  }
}

// ============================================================================
// Network Error Helpers
// ============================================================================

/**
 * Checks if error is network error
 */
export function isNetworkError(error: Error): boolean {
  return (
    error instanceof NetworkError ||
    error.name === 'NetworkError' ||
    error.message.includes('network') ||
    error.message.includes('fetch')
  );
}

/**
 * Creates network error from fetch error
 */
export function createNetworkError(error: Error): NetworkError {
  return new NetworkError(error.message);
}

// ============================================================================
// Error Logging Utilities
// ============================================================================

/**
 * Logs error to console with context
 */
export function logError(error: Error, context?: ErrorContext): void {
  ErrorHandler.handle(error, context || {});
}

/**
 * Logs warning
 */
export function logWarning(message: string, context?: ErrorContext): void {
  console.warn('Warning:', message, context);
  toast(message, { icon: '⚠️' });
}

/**
 * Logs info
 */
export function logInfo(message: string): void {
  console.info('Info:', message);
}
