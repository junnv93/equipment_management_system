'use client';

import { useMemo } from 'react';

import {
  type CheckoutStatus,
  type CheckoutPurpose,
  type NextStepDescriptor,
  type ProgressStepDescriptor,
  type TerminationKind,
  CheckoutStatusValues as CSVal,
  CheckoutPurposeValues as CPVal,
  deriveProgressStepState,
  computeStepIndex,
} from '@equipment-management/schemas';

import { CHECKOUT_DISPLAY_STEPS, CHECKOUT_STEP_LABELS } from '@/lib/design-tokens';

// ============================================================================
// 입력 타입
// ============================================================================

/**
 * Audit event slice — Phase 11에서 백엔드 timeline endpoint가 합류하면 그대로 매핑.
 * 본 hook은 array가 비어있어도 동작 (gracefully degrade) — checkout 자체 필드만으로 done 단계의
 * 일부 timestamp는 추정 가능.
 */
export interface CheckoutAuditEventSlice {
  /** 도달한 status (예: 'approved' = 1차 승인 완료 시점) */
  readonly toStatus: CheckoutStatus;
  /** 사람 이름 */
  readonly actor: string;
  /** 역할 (예: '시험책임자') */
  readonly actorRole?: string;
  /** ISO 8601 */
  readonly timestamp: string;
}

interface UseCheckoutProgressStepsInput {
  /** 현재 status (FSM authoritative) */
  readonly status: CheckoutStatus;
  /** 반출 유형 — purpose === CPVal.RENTAL 시 8-step, 그 외 5-step */
  readonly purpose: CheckoutPurpose;
  /**
   * 서버 응답의 NextStepDescriptor — `currentStepIndex` / `urgency` / `availableToCurrentUser` /
   * `reachedStepIndex` 모두 권위 출처. 본 hook은 descriptor를 단일 입력으로 보고 isOverdue/currentUserCanAct/
   * termination을 직접 도출 — 호출처에서 같은 값을 두 번 계산하지 않도록 SSOT 강화.
   */
  readonly descriptor?: NextStepDescriptor | null;
  /** 신청자 (요청 단계 actor) */
  readonly requester?: { readonly name?: string | null; readonly role?: string | null } | null;
  /** 신청 시각 — checkout.createdAt */
  readonly requestedAt?: string | Date | null;
  /** 반출 예정일 — current/future 단계의 scheduledAt */
  readonly checkoutDate?: string | Date | null;
  /** 반입 예정일 */
  readonly expectedReturnDate?: string | Date | null;
  /** Audit log 이벤트 (Phase 11에서 인입) */
  readonly auditEvents?: ReadonlyArray<CheckoutAuditEventSlice>;
  // ── 단계별 actor/timestamp (BE Phase 2 hydration — 없으면 undefined, graceful degrade) ──
  /** 대여 1차 승인 시각/승인자 (rental borrower_approved 단계) */
  readonly borrowerApprovedAt?: string | null;
  readonly borrowerApprover?: {
    readonly name?: string | null;
    readonly role?: string | null;
  } | null;
  /** 최종 승인 시각/승인자 (approved 단계) */
  readonly approvedAt?: string | null;
  readonly approver?: { readonly name?: string | null; readonly role?: string | null } | null;
  /** 빌려준 측 확인 시각/확인자 (rental lender_checked 단계) */
  readonly lenderConfirmedAt?: string | null;
  readonly lenderConfirmer?: {
    readonly name?: string | null;
    readonly role?: string | null;
  } | null;
  /** 실제 반입 시각/반입자 (returned / borrower_returned 단계) */
  readonly actualReturnDate?: string | null;
  readonly returner?: { readonly name?: string | null; readonly role?: string | null } | null;
  /** 반입 최종 승인 시각/승인자 (return_approved 단계) */
  readonly returnApprovedAt?: string | null;
  readonly returnApprover?: { readonly name?: string | null; readonly role?: string | null } | null;
}

/**
 * status → TerminationKind 추론 (rejected/canceled). 그 외는 null.
 */
function deriveTermination(status: CheckoutStatus): TerminationKind {
  if (status === CSVal.REJECTED) return 'rejected';
  if (status === CSVal.CANCELED) return 'canceled';
  return null;
}

// ============================================================================
// 헬퍼
// ============================================================================

function toIsoOrUndef(value: string | Date | null | undefined): string | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value.toISOString();
  return value;
}

/**
 * status → step별 scheduled/timestamp 추정 (audit log fallback).
 * audit event가 있으면 우선 사용. 없으면 checkout 자체 필드에서 가능한 만큼 채움.
 * SSOT 보장: CHECKOUT_DISPLAY_STEPS에 등장하는 모든 status가 아래 switch에 명시적으로 처리됨.
 */
type StepMetaInput = Pick<
  UseCheckoutProgressStepsInput,
  | 'requester'
  | 'requestedAt'
  | 'borrowerApprovedAt'
  | 'borrowerApprover'
  | 'approvedAt'
  | 'approver'
  | 'checkoutDate'
  | 'lenderConfirmedAt'
  | 'lenderConfirmer'
  | 'actualReturnDate'
  | 'returner'
  | 'expectedReturnDate'
  | 'returnApprovedAt'
  | 'returnApprover'
>;

function buildStepMeta(
  stepStatus: CheckoutStatus,
  input: StepMetaInput,
  eventByStatus: Map<CheckoutStatus, CheckoutAuditEventSlice>
): Pick<ProgressStepDescriptor, 'actor' | 'actorRole' | 'timestamp' | 'scheduledAt'> {
  // audit event 최우선 — Phase 11 audit log 인입 시 자동으로 정확한 데이터 사용
  const event = eventByStatus.get(stepStatus);
  if (event) {
    return {
      actor: event.actor,
      actorRole: event.actorRole,
      timestamp: event.timestamp,
    };
  }

  // Fallback — checkout 자체 필드로 단계별 timestamp/actor 채움
  // 순서: CHECKOUT_DISPLAY_STEPS(nonRental ∪ rental) 합집합 — 9개 status 완전 커버
  switch (stepStatus) {
    case CSVal.PENDING:
      return {
        actor: input.requester?.name ?? undefined,
        actorRole: input.requester?.role ?? undefined,
        timestamp: toIsoOrUndef(input.requestedAt),
      };
    case CSVal.BORROWER_APPROVED:
      return {
        actor: input.borrowerApprover?.name ?? undefined,
        actorRole: input.borrowerApprover?.role ?? undefined,
        timestamp: toIsoOrUndef(input.borrowerApprovedAt),
      };
    case CSVal.APPROVED:
      return {
        actor: input.approver?.name ?? undefined,
        actorRole: input.approver?.role ?? undefined,
        timestamp: toIsoOrUndef(input.approvedAt),
      };
    case CSVal.LENDER_CHECKED:
      return {
        actor: input.lenderConfirmer?.name ?? undefined,
        actorRole: input.lenderConfirmer?.role ?? undefined,
        // lenderConfirmedAt 없으면 checkoutDate fallback (빌려준 측 확인 = 반출 시작 기준)
        timestamp: toIsoOrUndef(input.lenderConfirmedAt) ?? toIsoOrUndef(input.checkoutDate),
      };
    case CSVal.CHECKED_OUT:
      // done 시 timestamp = checkoutDate (실제 반출 시작), future 시 scheduledAt (예정일)
      return {
        timestamp: toIsoOrUndef(input.checkoutDate),
        scheduledAt: toIsoOrUndef(input.checkoutDate),
      };
    case CSVal.IN_USE:
      // rental에서 lender_checked → in_use 전환 시점 = checkoutDate와 동일
      return {
        timestamp: toIsoOrUndef(input.checkoutDate),
      };
    case CSVal.BORROWER_RETURNED:
      return {
        actor: input.returner?.name ?? undefined,
        actorRole: input.returner?.role ?? undefined,
        timestamp: toIsoOrUndef(input.actualReturnDate),
        scheduledAt: toIsoOrUndef(input.expectedReturnDate),
      };
    case CSVal.RETURNED:
      return {
        actor: input.returner?.name ?? undefined,
        actorRole: input.returner?.role ?? undefined,
        timestamp: toIsoOrUndef(input.actualReturnDate),
        scheduledAt: toIsoOrUndef(input.expectedReturnDate),
      };
    case CSVal.RETURN_APPROVED:
      return {
        actor: input.returnApprover?.name ?? undefined,
        actorRole: input.returnApprover?.role ?? undefined,
        timestamp: toIsoOrUndef(input.returnApprovedAt),
        scheduledAt: toIsoOrUndef(input.expectedReturnDate),
      };
    default:
      // rejected/canceled/overdue 등 CHECKOUT_DISPLAY_STEPS에 없는 status — 메타 없음
      return {};
  }
}

// ============================================================================
// 메인 hook
// ============================================================================

/**
 * Checkout → ProgressStepDescriptor[] 변환.
 *
 * **핵심 책임**: design-tokens `CHECKOUT_DISPLAY_STEPS` 와 NextStepDescriptor 의 `currentStepIndex` 를
 * `ProgressStepDescriptor[]` 형태로 합성. Audit event 가 인입되면 actor/timestamp를 풍부하게,
 * 없으면 checkout 자체 필드(requester/checkoutDate/expectedReturnDate)로 graceful degrade.
 *
 * **불변 보장**:
 *  - 5/8-step 길이는 `CHECKOUT_DISPLAY_STEPS` 가 unit invariant 검증 (동일 SSOT 재사용).
 *  - state 결정은 `deriveProgressStepState` (schemas) 단일 함수로 위임.
 *  - i18n 키는 `CHECKOUT_STEP_LABELS[status]` SSOT 사용 (별도 라벨 매핑 금지).
 *
 * **performance**: useMemo 의존성에 input 7개 — checkout/descriptor 변경 시에만 재계산.
 */
export function useCheckoutProgressSteps({
  status,
  purpose,
  descriptor,
  requester,
  requestedAt,
  borrowerApprovedAt,
  borrowerApprover,
  approvedAt,
  approver,
  checkoutDate,
  lenderConfirmedAt,
  lenderConfirmer,
  actualReturnDate,
  returner,
  expectedReturnDate,
  returnApprovedAt,
  returnApprover,
  auditEvents,
}: UseCheckoutProgressStepsInput): ProgressStepDescriptor[] {
  return useMemo(() => {
    const steps =
      purpose === CPVal.RENTAL ? CHECKOUT_DISPLAY_STEPS.rental : CHECKOUT_DISPLAY_STEPS.nonRental;

    const termination = deriveTermination(status);

    // descriptor.currentStepIndex 는 1-based — UI 인덱스(0-based)로 정규화 + [0, steps.length-1] 클램프.
    // 클램프 이유: server schema는 `.positive()`만 강제하므로 N+1 같은 비정상 값 silent 통과 가능.
    // descriptor 부재 시 status 의 step list 위치를 fallback. terminal 상태는 reachedStepIndex 우선.
    const rawCurrent = (() => {
      if (descriptor) {
        // terminal일 때 reachedStepIndex 가 의미 있는 마지막 도달 단계
        if (termination !== null && descriptor.reachedStepIndex > 0) {
          return descriptor.reachedStepIndex - 1;
        }
        if (descriptor.currentStepIndex > 0) {
          return descriptor.currentStepIndex - 1;
        }
      }
      // SSOT fallback: steps.indexOf 는 CHECKOUT_DISPLAY_STEPS에 없는 status(lender_received 등)에서
      // -1 → 0 으로 묵묵히 잘못된 단계를 가리킨다. computeStepIndex 는 모든 status를 명시적으로 매핑.
      return Math.max(0, computeStepIndex(status, purpose) - 1);
    })();
    const currentIndex0 = Math.min(steps.length - 1, Math.max(0, rawCurrent));

    // SSOT: isOverdue / currentUserCanAct 모두 descriptor 직접 도출 (호출처 중복 제거).
    const isOverdue = descriptor?.urgency === 'critical' || status === CSVal.OVERDUE;
    const currentUserCanAct = Boolean(descriptor?.availableToCurrentUser);

    const eventByStatus = new Map<CheckoutStatus, CheckoutAuditEventSlice>();
    for (const ev of auditEvents ?? []) {
      // 동일 status 중복 시 가장 최근 이벤트 우선 (입력이 정렬 보장 안 한다고 가정)
      const existing = eventByStatus.get(ev.toStatus);
      if (!existing || ev.timestamp > existing.timestamp) {
        eventByStatus.set(ev.toStatus, ev);
      }
    }

    return steps.map((stepStatus, index) => {
      const baseState = deriveProgressStepState(
        index,
        currentIndex0,
        isOverdue && index === currentIndex0,
        termination
      );

      const meta = buildStepMeta(
        stepStatus,
        {
          requester,
          requestedAt,
          borrowerApprovedAt,
          borrowerApprover,
          approvedAt,
          approver,
          checkoutDate,
          lenderConfirmedAt,
          lenderConfirmer,
          actualReturnDate,
          returner,
          expectedReturnDate,
          returnApprovedAt,
          returnApprover,
        },
        eventByStatus
      );

      const labelKey = `stepper.${CHECKOUT_STEP_LABELS[stepStatus] ?? stepStatus}`;

      const isYourTurn =
        baseState === 'current' || baseState === 'late' ? currentUserCanAct : false;

      return {
        status: stepStatus,
        index,
        state: baseState,
        labelKey,
        actor: meta.actor,
        actorRole: meta.actorRole,
        timestamp: meta.timestamp,
        scheduledAt: meta.scheduledAt,
        isYourTurn,
      } satisfies ProgressStepDescriptor;
    });
  }, [
    status,
    purpose,
    descriptor,
    requester,
    requestedAt,
    borrowerApprovedAt,
    borrowerApprover,
    approvedAt,
    approver,
    checkoutDate,
    lenderConfirmedAt,
    lenderConfirmer,
    actualReturnDate,
    returner,
    expectedReturnDate,
    returnApprovedAt,
    returnApprover,
    auditEvents,
  ]);
}
