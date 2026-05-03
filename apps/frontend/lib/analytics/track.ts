/**
 * Analytics SSOT — minimal tracking entry point
 *
 * 외부 telemetry(GA, Amplitude, Datadog 등) 통합 전, 단일 진입점만 확보.
 * - 기본 동작: window.dispatchEvent('app:analytics', detail) — 외부 listener 연결 가능
 * - SSR 안전: typeof window === 'undefined' 가드
 * - PII 방지: 직접 식별 키 deny-list 검증 (userId/email/사번 등)
 * - 권한/역할 컨벤션: role/permission/teamId는 직접 PII는 아니지만 세그먼트 추론 위험이 있어
 *   analytics props에 싣지 않는다. 필요 시 익명 aggregate counter만 사용한다.
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

/**
 * PII 위험 키 — track props에 포함되면 throw (DEV) / drop (PROD)
 * 주의: 'name' 같은 단어는 컴포넌트명/설정명에도 쓰이므로 제외.
 * 사람을 직접 식별하는 구체적 키만 등록한다.
 *
 * role/permission/teamId는 직접 식별 키가 아니므로 deny-list에는 넣지 않는다.
 * 대신 호출처 컨벤션으로 금지한다. 이 구분은 telemetry 도입 전까지 role 분포 같은
 * 세그먼트 추론 데이터를 우발적으로 수집하지 않기 위한 운영 규칙이다.
 */
const PII_DENY_KEYS = [
  'userId',
  'userid',
  'email',
  'firstName',
  'lastName',
  'displayName',
  'fullName',
  '사번',
  'employeeId',
] as const;

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
