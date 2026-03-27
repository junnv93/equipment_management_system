/**
 * Centralized Error Reporting
 *
 * LAN-내부 백엔드 API를 통한 구조화된 에러 로깅.
 * 프로덕션에서는 /api/monitoring/client-errors 엔드포인트로 전송하고,
 * 개발에서는 콘솔에 출력합니다.
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

// ── Rate limiter: 분당 최대 10개 ──────────────────────────────────────────────
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;

let errorCount = 0;
let windowStart = Date.now();

function isRateLimited(): boolean {
  const now = Date.now();
  if (now - windowStart >= RATE_LIMIT_WINDOW_MS) {
    errorCount = 0;
    windowStart = now;
  }
  if (errorCount >= RATE_LIMIT_MAX) {
    return true;
  }
  errorCount++;
  return false;
}
// ─────────────────────────────────────────────────────────────────────────────

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

  // Production: fire-and-forget POST to backend via sendBeacon
  if (isRateLimited()) {
    return;
  }

  const component = [page, action].filter(Boolean).join('/') || undefined;
  const payload = JSON.stringify({
    message: normalizedError.message,
    stack: normalizedError.stack,
    component,
    url: typeof window !== 'undefined' ? window.location.href : '',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
    timestamp: new Date().toISOString(),
  });

  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}/api/monitoring/client-errors`;

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon(backendUrl, new Blob([payload], { type: 'application/json' }));
  } else {
    // SSR 또는 sendBeacon 미지원 환경 폴백
    fetch(backendUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // 에러 리포터 자체의 실패는 무시
    });
  }
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
