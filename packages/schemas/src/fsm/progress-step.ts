/**
 * Progress Step Descriptor — 통합 진행 흐름 stepper 단일 출처.
 *
 * REVIEW_RESULT.md §4.2 Stepper prop 명세 기반.
 * 와이어프레임 02_detail_recommended.html line 260-291 시각 사양과 1:1 매핑.
 *
 * **NextStepDescriptor와의 관계**:
 *   - `NextStepDescriptor` (checkout-fsm.ts) = "현재 + 다음 단계 1점" — 액션 가능 여부, urgency 등
 *   - `ProgressStepDescriptor[]` (이 파일) = "전체 N-step 시각화" — 각 단계의 actor/timestamp/state
 *   두 타입은 보완 관계. NextStepDescriptor는 액션 결정용, ProgressStepDescriptor는 시각화용.
 *
 * **5-step (calibration/repair) vs 7-step (rental)**:
 *   - 5-step: PENDING → APPROVED → CHECKED_OUT → RETURNED → RETURN_APPROVED
 *   - 7-step: PENDING → BORROWER_APPROVED → APPROVED → LENDER_CHECKED
 *             → IN_USE → BORROWER_RETURNED → RETURN_APPROVED
 *   (BORROWER_RECEIVED 제거 — borrower_receive 인수 확인이 in_use로 직접 전이)
 *   step list 자체는 frontend `CHECKOUT_DISPLAY_STEPS` (design-tokens) 가 단일 출처.
 *   본 모듈은 각 step에 메타(actor/timestamp/state)를 입혀서 stepper 컴포넌트로 전달하는 형식만 정의.
 *
 * **적용**:
 *   - `apps/frontend/components/checkouts/CheckoutProgressStepper.tsx` 가 props로 소비
 *   - `apps/frontend/hooks/use-checkout-progress-steps.ts` 가 checkout + audit_log 로부터 도출
 */

import { z } from 'zod';
import { CheckoutStatus, CHECKOUT_STATUS_VALUES } from '../enums/checkout';

// ============================================================================
// Step state — 4단계 (와이어프레임 02 line 86-105 정확 매핑)
// ============================================================================

/**
 * 단계의 시각적 상태.
 *  - 'done'       : 완료된 과거 단계 (✓ 표시 + ok 색상)
 *  - 'current'    : 현재 진행 중인 단계 (브랜드 info 강조 + box-shadow ring)
 *  - 'late'       : current이지만 dueAt 초과 — critical 경고 (REVIEW §1.5 audit 데이터 활용)
 *  - 'future'     : 아직 도달하지 않은 미래 단계 (border + 회색 텍스트)
 *  - 'terminated' : 반려/취소된 reachedStep — "X단계에서 종료" 의미 (회색 strike + sr-only state)
 *
 * `terminated`는 NextStepDescriptor의 `reachedStepIndex` 와 짝을 이룬다.
 * checkout.status ∈ {rejected, canceled} 일 때 reachedStep 위치만 'terminated', 그 이후는 'future'.
 */
export const PROGRESS_STEP_STATES = ['done', 'current', 'late', 'future', 'terminated'] as const;
export type ProgressStepState = (typeof PROGRESS_STEP_STATES)[number];

/**
 * Terminal 종료 종류 — null = 비-terminal.
 * - 'rejected' / 'canceled': 중단 종료 — 현재 step 'terminated', 이후 'future'
 * - 'completed': 성공 종료 (return_approved) — 모든 step 'done'
 */
export type TerminationKind = 'rejected' | 'canceled' | 'completed' | null;

// ============================================================================
// ProgressStepDescriptor — REVIEW §4.2 prop 정식화
// ============================================================================

/**
 * 통합 stepper의 각 노드에 표시되는 정보.
 *
 * 모든 텍스트는 `labelKey` 같은 i18n 키 형태로 전달 — frontend에서 `useTranslations()` 변환.
 * `actor` (사람 이름)와 `timestamp`는 audit log에서 직접 가져온 raw 값 — 변환 없이 표시.
 */
export interface ProgressStepDescriptor {
  /** 이 step이 매핑되는 CheckoutStatus (CHECKOUT_DISPLAY_STEPS의 status 값과 동일) */
  readonly status: CheckoutStatus;
  /** 0-based step 인덱스 (5-step: 0..4 / 8-step: 0..7) */
  readonly index: number;
  /** 시각 상태 — done/current/late/future 4-tier */
  readonly state: ProgressStepState;
  /** i18n 키 — `stepper.{status}` 형태 (예: 'stepper.pendingApproval', 'stepper.approved') */
  readonly labelKey: string;

  // ── 메타 (audit log 또는 schedule 기반 — 모두 optional) ─────────────────────

  /** 액션 수행자 이름 (예: "박지훈") — done/current 단계에서 표시 */
  readonly actor?: string;
  /** 액션 수행자 역할 (예: "시험책임자") — actor와 함께 단계 actor badge */
  readonly actorRole?: string;
  /**
   * 액션 발생 타임스탬프 (ISO 8601, e.g., "2026-04-26T14:32:00Z").
   * done 단계는 audit log의 createdAt, current/future는 undefined (대기 중).
   */
  readonly timestamp?: string;
  /**
   * 예정일 (ISO 8601). future/current 단계에서 "예정 04-28" 표시.
   * 비즈니스 로직: requested 단계는 createdAt, approved/checked_out 단계는 expectedDates 등.
   */
  readonly scheduledAt?: string;
  /**
   * 현재 사용자가 이 단계의 actor 후보인 경우 true.
   * `state === 'current'`이고 `isYourTurn === true`일 때만 "⚡ 당신" badge 표시.
   * 백엔드 NextStepDescriptor.availableToCurrentUser와 의미 동일하지만 step별로 결정.
   */
  readonly isYourTurn?: boolean;
}

// ============================================================================
// Zod Schema (서버 응답 검증용 — 향후 백엔드가 이 구조를 직접 emit할 경우)
// ============================================================================

export const ProgressStepDescriptorSchema: z.ZodType<ProgressStepDescriptor> = z.object({
  status: z.enum(CHECKOUT_STATUS_VALUES),
  index: z.number().int().min(0),
  state: z.enum(PROGRESS_STEP_STATES),
  labelKey: z.string(),
  actor: z.string().optional(),
  actorRole: z.string().optional(),
  timestamp: z.string().datetime({ offset: true }).optional(),
  scheduledAt: z.string().datetime({ offset: true }).optional(),
  isYourTurn: z.boolean().optional(),
});

/**
 * 헬퍼: 인덱스/현재 인덱스 + dueAt + terminal 정보로 state 결정.
 * 비즈니스 로직 단일 출처 — `use-checkout-progress-steps.ts` 등 여러 어댑터에서 재사용.
 *
 * @param stepIndex 결정 대상 step 인덱스 (0-based)
 * @param currentStepIndex FSM이 판단한 현재 step 인덱스 (0-based) — `NextStepDescriptor.currentStepIndex - 1`
 *                         혹은 terminal 시 `reachedStepIndex - 1`로 변환된 값.
 * @param isOverdue 현재 단계가 due 초과 상태인지 (dueAt < now). terminal일 때는 무시.
 * @param termination terminal 종류 (rejected/canceled). null = 비-terminal.
 *                    terminal일 때 currentStepIndex 위치는 'terminated', 이후는 'future', 이전은 'done'.
 */
export function deriveProgressStepState(
  stepIndex: number,
  currentStepIndex: number,
  isOverdue: boolean = false,
  termination: TerminationKind = null
): ProgressStepState {
  if (termination === 'completed') return 'done'; // 성공 종료: 전 단계 done
  if (stepIndex < currentStepIndex) return 'done';
  if (stepIndex === currentStepIndex) {
    if (termination !== null) return 'terminated';
    return isOverdue ? 'late' : 'current';
  }
  return 'future';
}
