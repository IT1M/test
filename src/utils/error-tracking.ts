/**
 * Error Tracking and Reporting Utility
 * Centralized error handling and reporting for production monitoring
 */

export interface ErrorContext {
  userId?: string;
  userEmail?: string;
  url?: string;
  userAgent?: string;
  timestamp: string;
  environment: string;
  [key: string]: any;
}

export interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  level: 'error' | 'warning' | 'info';
  context: ErrorContext;
  fingerprint: string;
}

class ErrorTracker {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;
  private errorCallbacks: ((error: ErrorReport) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupGlobalErrorHandlers();
    }
  }

  private setupGlobalErrorHandlers() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'uncaught_error',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          type: 'unhandled_rejection',
        }
      );
    });

    // Handle console errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      this.captureError(new Error(args.join(' ')), {
        type: 'console_error',
      });
      originalConsoleError.apply(console, args);
    };
  }

  private generateFingerprint(error: Error, context: any): string {
    // Generate a unique fingerprint for grouping similar errors
    const message = error.message || 'Unknown error';
    const stack = error.stack || '';
    const contextStr = JSON.stringify(context);
    
    // Simple hash function
    let hash = 0;
    const str = message + stack + contextStr;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  captureError(error: Error, additionalContext: any = {}) {
    const context: ErrorContext = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      ...additionalContext,
    };

    const errorReport: ErrorReport = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message: error.message || 'Unknown error',
      stack: error.stack,
      level: 'error',
      context,
      fingerprint: this.generateFingerprint(error, additionalContext),
    };

    this.errors.push(errorReport);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Notify callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorReport);
      } catch (e) {
        console.error('Error in error callback:', e);
      }
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error captured:', errorReport);
    }

    // Send to server in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToServer(errorReport);
    }
  }

  captureWarning(message: string, context: any = {}) {
    const warning: ErrorReport = {
      id: `warning_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      level: 'warning',
      context: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...context,
      },
      fingerprint: this.generateFingerprint(new Error(message), context),
    };

    this.errors.push(warning);

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    this.errorCallbacks.forEach(callback => {
      try {
        callback(warning);
      } catch (e) {
        console.error('Error in warning callback:', e);
      }
    });
  }

  captureInfo(message: string, context: any = {}) {
    const info: ErrorReport = {
      id: `info_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      message,
      level: 'info',
      context: {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ...context,
      },
      fingerprint: this.generateFingerprint(new Error(message), context),
    };

    this.errors.push(info);

    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }
  }

  private async sendToServer(errorReport: ErrorReport) {
    try {
      await fetch('/api/errors/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorReport),
      });
    } catch (e) {
      // Silently fail - don't want error reporting to cause more errors
      console.error('Failed to send error report to server:', e);
    }
  }

  onError(callback: (error: ErrorReport) => void) {
    this.errorCallbacks.push(callback);
    
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  getErrors(): ErrorReport[] {
    return [...this.errors];
  }

  getErrorsByLevel(level: 'error' | 'warning' | 'info'): ErrorReport[] {
    return this.errors.filter(e => e.level === level);
  }

  getErrorsByFingerprint(fingerprint: string): ErrorReport[] {
    return this.errors.filter(e => e.fingerprint === fingerprint);
  }

  clearErrors() {
    this.errors = [];
  }

  getErrorStats() {
    const stats = {
      total: this.errors.length,
      byLevel: {
        error: 0,
        warning: 0,
        info: 0,
      },
      byFingerprint: new Map<string, number>(),
    };

    this.errors.forEach(error => {
      stats.byLevel[error.level]++;
      
      const count = stats.byFingerprint.get(error.fingerprint) || 0;
      stats.byFingerprint.set(error.fingerprint, count + 1);
    });

    return stats;
  }
}

// Singleton instance
let errorTrackerInstance: ErrorTracker | null = null;

export function getErrorTracker(): ErrorTracker {
  if (!errorTrackerInstance) {
    errorTrackerInstance = new ErrorTracker();
  }
  return errorTrackerInstance;
}

// Convenience functions
export function captureError(error: Error, context?: any) {
  getErrorTracker().captureError(error, context);
}

export function captureWarning(message: string, context?: any) {
  getErrorTracker().captureWarning(message, context);
}

export function captureInfo(message: string, context?: any) {
  getErrorTracker().captureInfo(message, context);
}

// React Error Boundary helper
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>
) {
  return class ErrorBoundary extends React.Component<
    P,
    { hasError: boolean; error: Error | null }
  > {
    constructor(props: P) {
      super(props);
      this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
      return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
      captureError(error, {
        componentStack: errorInfo.componentStack,
        type: 'react_error_boundary',
      });
    }

    resetError = () => {
      this.setState({ hasError: false, error: null });
    };

    render() {
      if (this.state.hasError && this.state.error) {
        if (fallback) {
          const FallbackComponent = fallback;
          return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
        }
        
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Something went wrong</h2>
            <button onClick={this.resetError}>Try again</button>
          </div>
        );
      }

      return <Component {...this.props} />;
    }
  };
}
