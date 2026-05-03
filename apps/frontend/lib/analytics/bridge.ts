import type { AnalyticsEventDetail } from './track';

const ANALYTICS_EVENT_NAME = 'app:analytics';

type GtagFunction = (command: 'event', eventName: string, params?: Record<string, unknown>) => void;
type DataLayerEntry = Record<string, unknown>;

type AnalyticsWindow = Window & {
  gtag?: GtagFunction;
  dataLayer?: DataLayerEntry[];
};

function isAnalyticsDetail(value: unknown): value is AnalyticsEventDetail {
  if (!value || typeof value !== 'object') return false;
  const detail = value as Partial<AnalyticsEventDetail>;
  return typeof detail.event === 'string' && typeof detail.ts === 'number';
}

function forwardAnalyticsEvent(target: AnalyticsWindow, detail: AnalyticsEventDetail): void {
  const params = {
    ...(detail.props ?? {}),
    app_event_ts: detail.ts,
  };

  target.gtag?.('event', detail.event, params);
  target.dataLayer?.push({
    event: 'app.analytics',
    appEvent: detail.event,
    appEventTs: detail.ts,
    ...(detail.props ? { appEventProps: detail.props } : {}),
  });
}

export function installAnalyticsBridge(target: AnalyticsWindow = window): () => void {
  const handleAnalyticsEvent = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail;
    if (!isAnalyticsDetail(detail)) return;
    forwardAnalyticsEvent(target, detail);
  };

  target.addEventListener(ANALYTICS_EVENT_NAME, handleAnalyticsEvent);
  return () => {
    target.removeEventListener(ANALYTICS_EVENT_NAME, handleAnalyticsEvent);
  };
}
