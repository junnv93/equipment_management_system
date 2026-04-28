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

// ============================================================================
// Inline Action variant 매핑 SSOT (REVIEW_RESULT.md §4.1 + 와이어프레임 04 spec)
// ============================================================================
//
// 행 단위 inline action 버튼의 색상 variant를 결정하는 단일 함수.
// frontend `SURFACE_INLINE_ACTION_TOKENS.variant`(`info`|`ok`|`warning`|`danger`)
// 키와 1:1 대응. 여기서는 string literal type으로 mirror — frontend SemanticColor
// 어휘를 import하지 않음 (역방향 의존 회피, schemas → shared-constants 단방향 유지).
//
// **권위 결정 규칙 (Q1 — descriptor.urgency를 1차 권위로)**:
//   1) urgency='critical'                                     → 'danger'
//   2) urgency='warning'                                      → 'warning'
//   3) urgency='normal' + isMyTurn + (approve|borrower_approve)  → 'warning' (내 차례 강조)
//   4) urgency='normal' + ok-class action (반환·수령·반입)        → 'ok'
//   5) 그 외 (terminal, 기본 진행)                              → 'info'
//
// 의도: FSM이 종합 판정한 urgency가 항상 우선. 회귀 시 안전 방향(과강조)로 fail.
// 와이어프레임 04 spec "D-day 의미 매핑"은 urgency가 dueAt 기반으로 계산되므로
// 자연 만족 (overdue → urgency='critical' → 'danger').

import type { CheckoutAction } from '@equipment-management/schemas';

/**
 * Inline action variant 키 — frontend `SurfaceInlineActionVariant` 미러.
 * 변경 시 `apps/frontend/lib/design-tokens/semantic.ts`의 동일 enum과 동기 필수.
 */
export type InlineActionVariantKey = 'info' | 'ok' | 'warning' | 'danger';

/**
 * `urgency='normal'` 정상 흐름에서 'ok'로 매핑되는 액션 (반환·수령·반입 류).
 * 와이어프레임 04: "정상 진행 액션은 ok variant" + 핸드오프 "반입 처리/수령 확인 → ok".
 */
const OK_INLINE_ACTIONS: ReadonlySet<CheckoutAction> = new Set([
  'submit_return',
  'lender_receive',
  'borrower_receive',
  'approve_return',
  'mark_in_use',
]);

/**
 * `urgency='normal'`에서 `isMyTurn`일 때 'warning'으로 강조되는 승인 액션.
 * 핸드오프: "1차 승인 → info; 2차 승인(내 차례 시) → warning".
 * 단 urgency가 이미 critical/warning이면 그쪽이 우선.
 */
const APPROVE_INLINE_ACTIONS: ReadonlySet<CheckoutAction> = new Set([
  'approve',
  'borrower_approve',
]);

/**
 * Inline action variant 결정 함수 — 행 단위 액션 버튼 색상 SSOT.
 *
 * @example
 *   resolveInlineActionVariant({ urgency: 'critical', nextAction: 'approve', isMyTurn: true })
 *     // 'danger' (urgency 권위)
 *   resolveInlineActionVariant({ urgency: 'normal', nextAction: 'approve', isMyTurn: true })
 *     // 'warning' (내 차례 강조)
 *   resolveInlineActionVariant({ urgency: 'normal', nextAction: 'submit_return', isMyTurn: true })
 *     // 'ok'
 *   resolveInlineActionVariant({ urgency: 'normal', nextAction: 'approve', isMyTurn: false })
 *     // 'info' (기본 진행, 남의 차례)
 *   resolveInlineActionVariant({ urgency: 'normal', nextAction: null, isMyTurn: false })
 *     // 'info' (terminal — 실제 도달 0%, 방어)
 */
export function resolveInlineActionVariant(input: {
  urgency: 'normal' | 'warning' | 'critical';
  nextAction: CheckoutAction | null;
  isMyTurn: boolean;
}): InlineActionVariantKey {
  const { urgency, nextAction, isMyTurn } = input;

  if (urgency === 'critical') return 'danger';
  if (urgency === 'warning') return 'warning';

  if (nextAction === null) return 'info';

  if (isMyTurn && APPROVE_INLINE_ACTIONS.has(nextAction)) return 'warning';
  if (OK_INLINE_ACTIONS.has(nextAction)) return 'ok';

  return 'info';
}
