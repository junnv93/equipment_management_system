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
 * 액션 의미 분류 — 변형(variant) 결정의 기준.
 *
 *   - `approve`: 승인 류 (1차 승인, 차용팀 1차 승인). isMyTurn일 때만 강조.
 *   - `ok`:      정상 진행 액션 (반환·수령·반입·사용 시작). 컬러 변경 없이 ok로 안정 표시.
 *   - `negative`:거절·취소 류. inline action에선 일반적으로 overflow menu로 분리되므로
 *                inline 컬러 매핑 자체가 호출처에서 발생할 일 적음. 'info' fallback.
 *   - `lender`:  대여팀 검수·반입 (외부 렌탈 워크플로). 'info' fallback (스코프 외 강조 없음).
 *   - `neutral`: 시작·기본 진행 (start). 'info' fallback.
 */
type InlineActionClass = 'approve' | 'ok' | 'negative' | 'lender' | 'neutral';

/**
 * **CheckoutAction × InlineActionClass exhaustive map (SSOT)**.
 *
 * `satisfies Record<CheckoutAction, InlineActionClass>`로 컴파일러가 다음을 강제:
 *   1. CheckoutAction enum에 새 멤버 추가 시 본 map에 분류 추가 누락 → 빌드 실패.
 *   2. CheckoutAction enum에서 멤버 제거 시 본 map의 dead key → eslint/tsc 경고.
 *
 * 단순 `Set<CheckoutAction>` 패턴은 enum 확장 시 silent fail 가능 — Record 권장.
 */
const CHECKOUT_ACTION_INLINE_CLASS = {
  // approve 클래스 — isMyTurn일 때 'warning' 강조
  approve: 'approve',
  borrower_approve: 'approve',
  // ok 클래스 — 정상 진행 액션
  submit_return: 'ok',
  lender_receive: 'ok',
  borrower_receive: 'ok',
  approve_return: 'ok',
  mark_in_use: 'ok',
  // negative 클래스 — overflow menu가 일반적, inline일 경우 info fallback
  reject: 'negative',
  cancel: 'negative',
  borrower_reject: 'negative',
  reject_return: 'negative',
  // lender/logistics 워크플로 — 별도 강조 없이 info
  lender_check: 'lender',
  borrower_return: 'lender',
  // neutral — 기본 진행
  start: 'neutral',
} as const satisfies Record<CheckoutAction, InlineActionClass>;

/**
 * Inline action variant 결정 함수 — 행 단위 액션 버튼 색상 SSOT.
 *
 * **권위 순서 (Q1 결정)**:
 *   1) urgency='critical'                           → 'danger'
 *   2) urgency='warning'                            → 'warning'
 *   3) urgency='normal' + isMyTurn + class='approve' → 'warning' (내 차례 강조)
 *   4) urgency='normal' + class='ok'                → 'ok' (isMyTurn 무관)
 *   5) 그 외 (terminal, negative, lender, neutral)   → 'info'
 *
 * @example
 *   resolveInlineActionVariant({ urgency: 'critical', nextAction: 'approve', isMyTurn: true })
 *     // 'danger' (urgency 권위)
 *   resolveInlineActionVariant({ urgency: 'normal', nextAction: 'approve', isMyTurn: true })
 *     // 'warning' (내 차례 강조)
 *   resolveInlineActionVariant({ urgency: 'normal', nextAction: 'submit_return', isMyTurn: false })
 *     // 'ok' (isMyTurn 무관)
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

  // urgency 1차 권위 — D-day/reason 종합 판정 결과 우선
  if (urgency === 'critical') return 'danger';
  if (urgency === 'warning') return 'warning';

  // terminal 방어
  if (nextAction === null) return 'info';

  // action class 분류 SSOT 조회
  const actionClass = CHECKOUT_ACTION_INLINE_CLASS[nextAction];

  if (actionClass === 'approve' && isMyTurn) return 'warning';
  if (actionClass === 'ok') return 'ok';

  return 'info';
}
