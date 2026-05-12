/**
 * Software Validation Step Descriptor — UL-QP-18-09 유효성 확인 승인 워크플로 시각화 SSOT.
 *
 * `progress-step.ts`(checkout 도메인)의 `ProgressStepState` 타입을 재사용 (Exclude로 `late` 제외).
 * status enum이 다르므로 별도 descriptor 타입으로 분리. CheckoutProgressStepper 패턴 추종.
 *
 * **3-step 워크플로**:
 *   1. submitted        — 제출됨 (작성자 → 기술책임자 review 대기)
 *   2. approved         — 기술책임자 승인 (→ 품질책임자 review 대기)
 *   3. quality_approved — 품질책임자 승인 (최종)
 *
 * **terminal 종료**:
 *   - rejected: 어느 단계에서든 반려 → reachedStep만 'terminated', 이후는 'future'
 *   - quality_approved: 모든 단계 'done' (성공 종료)
 *
 * **draft**는 stepper 노출 대상 아님 — submitted 이전 단계는 작성 중. ValidationDetailContent에서
 * `validation.status === 'draft'`이면 stepper 자체를 숨김 (작성 안내문구 또는 submit 버튼 강조).
 */

import { z } from 'zod';
import { type ProgressStepState, type TerminationKind } from './progress-step';
import { VALIDATION_STATUS_VALUES, type ValidationStatus } from '../enums/software';

// ============================================================================
// 도메인별 state subset (시니어 자기검토 #3 갭A4)
// ============================================================================

/**
 * 도메인별 state subset — `late` 제외.
 *
 * **review-architecture 갭A4 fix**: validation 도메인은 dueAt 개념이 없음.
 * `late` state는 unreachable이지만 ProgressStepState union 그대로 사용 시 dead code 발생.
 * 좁힌 union으로 타입 시스템에서 unreachable 보장.
 */
export type SoftwareValidationStepState = Exclude<ProgressStepState, 'late'>;

export const SOFTWARE_VALIDATION_STEP_STATES: readonly SoftwareValidationStepState[] = [
  'done',
  'current',
  'future',
  'terminated',
];

// ============================================================================
// Software Validation Step (3-step) — 와이어프레임 04 stepper 시각 사양
// ============================================================================

/**
 * 워크플로 단계 enum — `ValidationStatus`의 부분집합 (draft/rejected 제외).
 * draft = stepper 미노출, rejected = stepper 내부 terminated marker로 표현.
 */
export const SOFTWARE_VALIDATION_STEP_VALUES = [
  'submitted',
  'approved',
  'quality_approved',
] as const;

export type SoftwareValidationStepKey = (typeof SOFTWARE_VALIDATION_STEP_VALUES)[number];

export const SoftwareValidationStepKeyEnum = z.enum(SOFTWARE_VALIDATION_STEP_VALUES);

// ============================================================================
// Descriptor — UI 시각화용 단일 출처
// ============================================================================

/**
 * Stepper 노드 1개의 시각화 정보.
 *
 * `ProgressStepDescriptor` (checkout 도메인)와 동일한 4-tier state(`done|current|late|future|terminated`)
 * + i18n labelKey + actor/timestamp 메타 패턴을 추종. 비주얼 토큰까지 공유 가능.
 *
 * Adapter hook (`use-software-validation-progress-steps.ts`)이 `SoftwareValidation` 객체로부터
 * 본 descriptor 배열을 도출 → `<SoftwareValidationStepper>` 컴포넌트가 props로 소비.
 */
export interface SoftwareValidationStepDescriptor {
  /** 이 step이 매핑되는 워크플로 단계 키 */
  readonly key: SoftwareValidationStepKey;
  /** 0-based 인덱스 (3-step: 0..2) */
  readonly index: number;
  /**
   * 시각 상태 (4-tier: done/current/future/terminated) — `late` 제외.
   * Adapter hook이 deriveProgressStepState(isOverdue=false)로 호출하여 'late' 미반환 보장.
   */
  readonly state: SoftwareValidationStepState;
  /** i18n 키 — `validation.steps.{key}` 형식 (예: 'validation.steps.submitted') */
  readonly labelKey: string;

  // ── 메타 (audit log 또는 validation 객체 필드 기반) ─────────────────────────

  /** 액션 수행자 이름 (제출자 / 기술책임자 / 품질책임자) — done 단계에서 표시 */
  readonly actor?: string;
  /** ISO 8601 타임스탬프 — done 단계는 *At 필드, current/future는 undefined */
  readonly timestamp?: string;
}

// ============================================================================
// Zod Schema (서버 응답 검증용 reserved)
// ============================================================================

export const SoftwareValidationStepDescriptorSchema: z.ZodType<SoftwareValidationStepDescriptor> =
  z.object({
    key: SoftwareValidationStepKeyEnum,
    index: z
      .number()
      .int()
      .min(0)
      .max(SOFTWARE_VALIDATION_STEP_VALUES.length - 1),
    state: z.enum(['done', 'current', 'future', 'terminated']),
    labelKey: z.string(),
    actor: z.string().optional(),
    timestamp: z.string().datetime({ offset: true }).optional(),
  });

// ============================================================================
// 도출 헬퍼
// ============================================================================

/**
 * `ValidationStatus` → reachedStepIndex 매핑.
 *
 * - draft: 0 미만 (stepper 미노출 신호) — caller는 -1을 받으면 stepper 자체 hide
 * - submitted: 0 (current = submitted)
 * - approved: 1 (current = approved 완료, quality_approved 대기)
 * - quality_approved: 2 (current = 모든 단계 done)
 * - rejected: 마지막 도달 단계 — caller가 별도 reachedStep prop으로 전달해야 함
 *
 * @returns -1 if draft, else 0..2
 */
export function deriveSoftwareValidationStepIndex(status: ValidationStatus): number {
  switch (status) {
    case 'draft':
      return -1; // stepper hide signal
    case 'submitted':
      return 0;
    case 'approved':
      return 1;
    case 'quality_approved':
      return 2;
    case 'rejected':
      // rejected는 어느 단계에서도 발생 가능 — caller가 reachedStep 직접 전달
      // (보통 submittedAt/technicalApprovedAt 존재 여부로 추정)
      return -1;
  }
}

/**
 * rejected 상태일 때 마지막 도달 단계 추정.
 * `qualityApprovedAt` 있으면 의미상 모순(quality_approved → rejected 불가)이므로 무시.
 *
 * - technicalApprovedAt 있음 → reached step = 1 (approved 단계에서 반려)
 * - submittedAt 있음 → reached step = 0 (submitted 단계에서 반려)
 * - 둘 다 없음 → -1 (draft 직후 반려? 비정상이지만 -1 반환)
 */
export function deriveSoftwareValidationRejectedStepIndex(
  submittedAt: string | null | undefined,
  technicalApprovedAt: string | null | undefined
): number {
  if (technicalApprovedAt) return 1;
  if (submittedAt) return 0;
  return -1;
}

/**
 * Termination kind 도출 — `progress-step.ts`의 `TerminationKind` 호환.
 */
export function deriveSoftwareValidationTermination(status: ValidationStatus): TerminationKind {
  if (status === 'rejected') return 'rejected';
  if (status === 'quality_approved') return 'completed';
  return null;
}

/**
 * 컴파일타임 sanity — VALIDATION_STATUS_VALUES와의 일관성 보장.
 * SOFTWARE_VALIDATION_STEP_VALUES는 VALIDATION_STATUS_VALUES의 부분집합이어야 함.
 */
type _StepValuesSubsetOfStatus = SoftwareValidationStepKey extends ValidationStatus ? true : never;
const _stepValuesSubsetCheck: _StepValuesSubsetOfStatus = true;
void _stepValuesSubsetCheck;
void VALIDATION_STATUS_VALUES;
