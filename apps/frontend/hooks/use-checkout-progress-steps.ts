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
 */
type StepMetaInput = Pick<
  UseCheckoutProgressStepsInput,
  'requester' | 'requestedAt' | 'checkoutDate' | 'expectedReturnDate'
>;

function buildStepMeta(
  stepStatus: CheckoutStatus,
  input: StepMetaInput,
  eventByStatus: Map<CheckoutStatus, CheckoutAuditEventSlice>
): Pick<ProgressStepDescriptor, 'actor' | 'actorRole' | 'timestamp' | 'scheduledAt'> {
  const event = eventByStatus.get(stepStatus);
  if (event) {
    return {
      actor: event.actor,
      actorRole: event.actorRole,
      timestamp: event.timestamp,
    };
  }

  // Fallback — checkout 자체 필드로 의미 있는 메타 채움
  switch (stepStatus) {
    case CSVal.PENDING: {
      const requestedIso = toIsoOrUndef(input.requestedAt);
      return {
        actor: input.requester?.name ?? undefined,
        actorRole: input.requester?.role ?? undefined,
        timestamp: requestedIso,
      };
    }
    case CSVal.CHECKED_OUT:
      return { scheduledAt: toIsoOrUndef(input.checkoutDate) };
    case CSVal.RETURNED:
    case CSVal.RETURN_APPROVED:
    case CSVal.BORROWER_RETURNED:
      return { scheduledAt: toIsoOrUndef(input.expectedReturnDate) };
    default:
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
  checkoutDate,
  expectedReturnDate,
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
      const idx = steps.indexOf(status);
      return idx >= 0 ? idx : 0;
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
        { requester, requestedAt, checkoutDate, expectedReturnDate },
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
    checkoutDate,
    expectedReturnDate,
    auditEvents,
  ]);
}
