/**
 * Analytics Event Registry — SSOT for event names
 *
 * 호출자에서 매직 스트링 대신 이 레지스트리 키를 사용해야 합니다.
 * 새 이벤트 추가 시 여기에 등록하고 호출처에서 import.
 *
 * 명명 규칙:
 *   - 도메인.액션 (snake_case 액션) — `lib/analytics/track.ts`의 콜론 표기와 일치
 *   - 예: 'sidebar.checkouts.click', 'checkout.bulk_approve'
 *
 * 타입 안전성:
 *   - `as const` + `ReadonlyArray<...>` 추론 → 호출자에서 typo 시 컴파일 오류
 *
 * 외부 telemetry 통합 시:
 *   - 본 레지스트리가 sender(track.ts)와 receiver(GA/Amplitude listener) 양쪽 SSOT
 *   - 이벤트 추가/제거 시 한 곳만 변경
 */
export const ANALYTICS_EVENTS = {
  /** 사이드바 반출 메뉴 클릭 — pendingCount 동반 */
  SIDEBAR_CHECKOUTS_CLICK: 'sidebar.checkouts.click',
} as const;

/** ANALYTICS_EVENTS 값들의 union type — track() 호출자 타입 좁히기 용 */
export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
