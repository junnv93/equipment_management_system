/**
 * Centralized Error Reporting
 *
 * Abstraction layer for error tracking services (Sentry, DataDog, etc.)
 *
 * Benefits:
 * - Single integration point for error reporting
 * - Easy to swap providers (Sentry → DataDog)
 * - Type-safe error context
 * - Development vs Production behavior
 *
 * Usage:
 * ```typescript
 * import { reportError } from '@/lib/error-reporter';
 *
 * reportError(error, {
 *   page: 'teams',
 *   action: 'fetch_initial_data',
 *   severity: 'error',
 * });
 * ```
 */

export type ErrorSeverity = 'error' | 'warning' | 'info';

export interface ErrorContext {
  /** Page/route where error occurred */
  page?: string;
  /** User action that triggered error */
  action?: string;
  /** Error severity level */
  severity?: ErrorSeverity;
  /** Additional context data */
  extra?: Record<string, unknown>;
  /** Error digest from Next.js */
  digest?: string;
  /** User ID (if authenticated) */
  userId?: string;
}

/**
 * Report error to monitoring service
 *
 * @param error - Error object
 * @param context - Additional context for debugging
 */
export function reportError(error: Error, context?: ErrorContext): void {
  const { page, action, severity = 'error', extra, digest, userId } = context || {};

  // Normalize error to Error object if it's not already
  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : JSON.stringify(error));

  // Development: Console logging with rich context
  if (process.env.NODE_ENV === 'development') {
    const logFn =
      severity === 'error' ? console.error : severity === 'warning' ? console.warn : console.info;

    logFn(`[ErrorReporter] ${severity.toUpperCase()}`, {
      message: normalizedError.message,
      page,
      action,
      digest,
      userId,
      stack: normalizedError.stack,
      extra,
    });
    return;
  }

  // Production: Send to monitoring service
  // TODO: Integrate Sentry or DataDog here
  // Example Sentry integration (uncomment when ready):
  /*
  import * as Sentry from '@sentry/nextjs';

  Sentry.captureException(error, {
    level: severity,
    tags: {
      page: page || 'unknown',
      action: action || 'unknown',
    },
    extra: {
      digest,
      userId,
      ...extra,
    },
  });
  */

  // Fallback: Console in production (temporary until monitoring is set up)
  console.error('[ErrorReporter]', {
    message: normalizedError.message,
    page,
    action,
    digest,
    // Don't log full stack in production to avoid sensitive info leakage
    errorType: normalizedError.constructor.name,
  });
}

/**
 * Report performance issue
 *
 * @param metric - Performance metric name
 * @param value - Metric value
 * @param threshold - Expected threshold
 */
export function reportPerformanceIssue(metric: string, value: number, threshold: number): void {
  if (value <= threshold) return; // No issue

  reportError(new Error(`Performance threshold exceeded: ${metric}`), {
    severity: 'warning',
    extra: {
      metric,
      value,
      threshold,
      exceedBy: value - threshold,
    },
  });
}

/**
 * Create error boundary error reporter
 *
 * Returns a function optimized for React Error Boundary usage
 */
export function createErrorBoundaryReporter(page: string) {
  return (error: Error, digest?: string) => {
    reportError(error, {
      page,
      action: 'render',
      severity: 'error',
      digest,
    });
  };
}
