import { reportError } from '@/lib/error-reporter';

type SentryBreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error' | 'fatal';

interface SentryLike {
  addBreadcrumb: (breadcrumb: {
    category: string;
    message: string;
    level: SentryBreadcrumbLevel;
    data?: Record<string, unknown>;
  }) => void;
}

export interface FsmMetaDriftEvent {
  checkoutId: string;
  endpoint: 'list' | 'detail';
  reason: 'meta_missing';
}

function getSentry(): SentryLike | null {
  const maybeSentry = (globalThis as { Sentry?: unknown }).Sentry;
  if (
    maybeSentry &&
    typeof maybeSentry === 'object' &&
    'addBreadcrumb' in maybeSentry &&
    typeof maybeSentry.addBreadcrumb === 'function'
  ) {
    return maybeSentry as SentryLike;
  }
  return null;
}

export function recordFsmMetaDrift(event: FsmMetaDriftEvent): void {
  const eventData: Record<string, unknown> = { ...event };

  getSentry()?.addBreadcrumb({
    category: 'fsm',
    message: 'meta missing',
    level: 'warning',
    data: eventData,
  });

  if (process.env.NODE_ENV !== 'production') {
    console.warn('[FSM drift] meta missing', event.checkoutId);
    return;
  }

  reportError(new Error(`FSM meta drift: ${event.reason}`), {
    page: 'checkouts',
    action: 'fsm_meta_drift',
    severity: 'warning',
    extra: eventData,
  });
}
