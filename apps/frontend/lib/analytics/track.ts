/**
 * Analytics SSOT — minimal tracking entry point
 *
 * 외부 telemetry(GA, Amplitude, Datadog 등) 통합 전, 단일 진입점만 확보.
 * - 기본 동작: window.dispatchEvent('app:analytics', detail) — 외부 listener 연결 가능
 * - SSR 안전: typeof window === 'undefined' 가드
 * - PII 방지: 키 deny-list 검증 (userId/email/role/사번 등)
 *
 * 호출자 패턴:
 *   track('sidebar.toggle', { state: 'collapsed' });
 *   track('checkout.bulk_approve', { count: 3 });
 *
 * 외부 listener 등록 (e.g. _document, layout):
 *   window.addEventListener('app:analytics', (e: CustomEvent) => {
 *     // forward to GA/Amplitude
 *   });
 */

const ANALYTICS_EVENT_NAME = 'app:analytics';

/** PII 위험 키 — track props에 포함되면 throw (DEV) / drop (PROD) */
const PII_DENY_KEYS = ['userId', 'userid', 'email', 'role', '사번', 'employeeId', 'name'] as const;

export type AnalyticsProps = Record<string, string | number | boolean>;

export interface AnalyticsEventDetail {
  event: string;
  props?: AnalyticsProps;
  ts: number;
}

function violatesPII(props: AnalyticsProps): string | null {
  for (const key of Object.keys(props)) {
    if ((PII_DENY_KEYS as readonly string[]).includes(key)) return key;
  }
  return null;
}

/**
 * Analytics 이벤트 발행.
 *
 * @param event - 이벤트 이름 (콜론 구분: domain.action, e.g. 'sidebar.toggle')
 * @param props - 부수 속성 (PII 금지)
 *
 * @example
 *   track('sidebar.toggle', { state: 'collapsed' });
 *   track('checkout.bulk_approve', { count: 3 });
 */
export function track(event: string, props?: AnalyticsProps): void {
  if (typeof window === 'undefined') return;

  if (props) {
    const violation = violatesPII(props);
    if (violation) {
      if (process.env.NODE_ENV !== 'production') {
        throw new Error(
          `[analytics.track] PII key "${violation}" rejected from event "${event}". Use anonymized counters instead.`
        );
      }
      return;
    }
  }

  const detail: AnalyticsEventDetail = {
    event,
    props,
    ts: Date.now(),
  };

  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT_NAME, { detail }));
}
