/**
 * 반출 도메인 임계값 SSOT (Single Source of Truth).
 *
 * 대시보드 임계값 (`dashboard-thresholds.ts`)과 분리해 관리하는 이유:
 *   대시보드는 30일 horizon의 가동률/배치 모니터링이 목적이고,
 *   반출은 즉시 조치가 필요한 단기 워크플로(승인·반출·반입)이므로 임계값 의미가 다르다.
 *
 * 본 파일은 외부 디자인 리뷰(REVIEW_RESULT.md §4.3)의 D-day pill 색상 명세를 기반으로 한다.
 * 와이어프레임 01의 `dday-ok / dday-warn / dday-danger` + 미사용 `dday-neutral` 4-tier에 1:1 대응.
 *
 * **반드시 이 모듈만 import 사용**:
 *   - 프론트엔드 `lib/design-tokens/components/dday-colors.ts`의 신규 4-tier 매핑
 *   - 프론트엔드 `components/checkouts/DdayBadge.tsx` 등 D-day pill 호출처
 *   - 백엔드 `apps/backend/src/modules/checkouts/checkouts.service.ts` (priority 정렬 등)
 *
 * 임계값을 컴포넌트나 서비스에 하드코딩하면 frontend/backend 분기가 발생하여
 * "백엔드는 OVERDUE인데 프론트는 warning" 같은 시각/논리 불일치를 유발한다.
 */

// ============================================================================
// 반출 D-day 4단계 색상 명세 (REVIEW_RESULT.md §4.3).
// ============================================================================
//
// 입력 규약: `daysRemaining` = 양수=미래 일수, 0=오늘, 음수=overdue 일수.
// (대시보드 `DDAY_THRESHOLDS`의 `days` 부호 규약과 다름 — 여기는 frontend 표시 친화)
//
// - daysRemaining < 0   → 'danger'  (D+N, overdue, 즉시 조치)
// - 0 ≤ days ≤ 2        → 'warning' (D-day · D-1 · D-2, 긴급)
// - 3 ≤ days ≤ 14       → 'ok'      (정상 진행)
// - days ≥ 15           → 'neutral' (여유 — pill 무색 처리 가능)
export const CHECKOUT_DDAY_THRESHOLDS = {
  /** D+N (overdue) → 'danger'. daysRemaining < this 값. */
  overdue: 0,
  /** D-0..D-2 → 'warning'. daysRemaining ≤ this 값. */
  warning: 2,
  /** D-3..D-14 → 'ok'. daysRemaining ≤ this 값. */
  ok: 14,
} as const;

/**
 * 반출 도메인 D-day tier — REVIEW_RESULT.md §4.3 명세.
 * 와이어프레임 01의 D-day pill `dday-ok / dday-warn / dday-danger` + neutral.
 */
export type CheckoutDdayTier = 'danger' | 'warning' | 'ok' | 'neutral';

/**
 * 반출 D-day tier 결정 함수 — 단일 분기 SSOT.
 *
 * @param daysRemaining 남은 일수 (양수=미래, 0=오늘, 음수=overdue)
 * @returns 4-tier 중 하나
 *
 * @example
 *   getCheckoutDdayTier(-3)  // 'danger'  (D+3 overdue)
 *   getCheckoutDdayTier(0)   // 'warning' (D-day)
 *   getCheckoutDdayTier(2)   // 'warning' (D-2 긴급)
 *   getCheckoutDdayTier(7)   // 'ok'      (D-7 정상)
 *   getCheckoutDdayTier(20)  // 'neutral' (D-20 여유)
 */
export function getCheckoutDdayTier(daysRemaining: number): CheckoutDdayTier {
  if (daysRemaining < CHECKOUT_DDAY_THRESHOLDS.overdue) return 'danger';
  if (daysRemaining <= CHECKOUT_DDAY_THRESHOLDS.warning) return 'warning';
  if (daysRemaining <= CHECKOUT_DDAY_THRESHOLDS.ok) return 'ok';
  return 'neutral';
}
