'use client';

import { useMemo } from 'react';

import {
  SOFTWARE_VALIDATION_STEP_VALUES,
  type SoftwareValidationStepDescriptor,
  type SoftwareValidationStepKey,
  type ProgressStepState,
  type TerminationKind,
  deriveProgressStepState,
  deriveSoftwareValidationStepIndex,
  deriveSoftwareValidationRejectedStepIndex,
  deriveSoftwareValidationTermination,
  type ValidationStatus,
} from '@equipment-management/schemas';

// ============================================================================
// 입력 타입
// ============================================================================

interface ActorMeta {
  readonly name?: string | null;
  readonly role?: string | null;
}

interface UseSoftwareValidationProgressStepsInput {
  /** 현재 status (FSM authoritative) */
  readonly status: ValidationStatus;
  /** 제출 시각 — submitted 단계 timestamp */
  readonly submittedAt?: string | null;
  readonly submitter?: ActorMeta | null;
  /** 기술 승인 시각/승인자 */
  readonly technicalApprovedAt?: string | null;
  readonly technicalApprover?: ActorMeta | null;
  /** 품질 승인 시각/승인자 */
  readonly qualityApprovedAt?: string | null;
  readonly qualityApprover?: ActorMeta | null;
}

// ============================================================================
// labelKey 매핑 (i18n) — software.json validation.steps.*
// ============================================================================

const STEP_LABEL_KEY: Record<SoftwareValidationStepKey, string> = {
  submitted: 'validation.steps.submitted',
  approved: 'validation.steps.approved',
  quality_approved: 'validation.steps.qualityApproved',
};

// ============================================================================
// Hook
// ============================================================================

/**
 * `SoftwareValidation` 객체로부터 stepper 시각화 descriptor 배열을 도출.
 *
 * - draft: 빈 배열 반환 (stepper hide 신호 — caller가 `steps.length === 0`이면 stepper 미렌더)
 * - rejected: 마지막 도달 단계만 'terminated', 이후는 'future'
 * - quality_approved: 모든 단계 'done' (성공 종료)
 *
 * **순수 함수** — props 안정 시 useMemo 캐시.
 */
export function useSoftwareValidationProgressSteps(
  input: UseSoftwareValidationProgressStepsInput
): readonly SoftwareValidationStepDescriptor[] {
  const {
    status,
    submittedAt,
    submitter,
    technicalApprovedAt,
    technicalApprover,
    qualityApprovedAt,
    qualityApprover,
  } = input;

  return useMemo(() => {
    // draft = stepper 미노출
    if (status === 'draft') return [];

    const termination: TerminationKind = deriveSoftwareValidationTermination(status);

    // rejected는 reachedStep 별도 도출
    const currentStepIndex =
      status === 'rejected'
        ? deriveSoftwareValidationRejectedStepIndex(submittedAt, technicalApprovedAt)
        : deriveSoftwareValidationStepIndex(status);

    if (currentStepIndex < 0) {
      // rejected이지만 어떤 메타도 없는 비정상 케이스 — 첫 단계 'terminated'로 표시
      return SOFTWARE_VALIDATION_STEP_VALUES.map((key, index): SoftwareValidationStepDescriptor => {
        const state: ProgressStepState = index === 0 ? 'terminated' : 'future';
        return { key, index, state, labelKey: STEP_LABEL_KEY[key] };
      });
    }

    return SOFTWARE_VALIDATION_STEP_VALUES.map((key, index): SoftwareValidationStepDescriptor => {
      const state = deriveProgressStepState(index, currentStepIndex, false, termination);

      // 메타 매핑 — 단계별 actor/timestamp
      let actor: string | undefined;
      let timestamp: string | undefined;

      if (key === 'submitted' && submittedAt) {
        timestamp = submittedAt;
        if (submitter?.name) actor = submitter.name;
      } else if (key === 'approved' && technicalApprovedAt) {
        timestamp = technicalApprovedAt;
        if (technicalApprover?.name) actor = technicalApprover.name;
      } else if (key === 'quality_approved' && qualityApprovedAt) {
        timestamp = qualityApprovedAt;
        if (qualityApprover?.name) actor = qualityApprover.name;
      }

      return {
        key,
        index,
        state,
        labelKey: STEP_LABEL_KEY[key],
        ...(actor !== undefined && { actor }),
        ...(timestamp !== undefined && { timestamp }),
      };
    });
  }, [
    status,
    submittedAt,
    submitter?.name,
    technicalApprovedAt,
    technicalApprover?.name,
    qualityApprovedAt,
    qualityApprover?.name,
  ]);
}
