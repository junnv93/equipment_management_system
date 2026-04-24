/**
 * FSM Descriptor Baseline Snapshot
 *
 * 이 파일은 getNextStep()의 현재 동작을 모든 (status × purpose × role) 조합에 대해
 * 기록한 기준선(baseline)이다.
 *
 * - 재생성: `pnpm --filter schemas run gen:descriptor-table` (S2 tech-debt 대상)
 * - 의도적 FSM 변경 시에만 재생성 허용. 우발적 변경은 table test FAIL로 감지됨.
 *
 * ⚠️ 직접 편집 금지 — 재생성 스크립트로만 업데이트할 것.
 */

import type { CheckoutStatus, CheckoutPurpose } from '../../../enums/checkout';
import { CHECKOUT_STATUS_VALUES, CHECKOUT_PURPOSE_VALUES } from '../../../enums/checkout';
import { getNextStep } from '../../checkout-fsm';
import type { NextStepDescriptor } from '../../checkout-fsm';

// ============================================================================
// Role permission mapping (FSM-relevant keys only)
// @equipment-management/shared-constants 순환의존 회피 — 문자열 직접 선언
// 원본: packages/shared-constants/src/role-permissions.ts
// ============================================================================

export type FixtureUserRole =
  | 'test_engineer'
  | 'technical_manager'
  | 'quality_manager'
  | 'lab_manager'
  | 'system_admin';

/** FSM 전이에 관련된 permission key만 포함. 조회/생성 권한은 제외. */
export const ROLE_FSM_PERMISSIONS: Record<FixtureUserRole, readonly string[]> = {
  // 시험실무자: 취소·시작·반입 가능. approve/reject/borrower_approve 없음.
  test_engineer: ['cancel:checkout', 'start:checkout', 'complete:checkout'],
  // 기술책임자: 모든 승인 권한 포함 (lender 측 approve + borrower 측 approve)
  technical_manager: [
    'approve:checkout',
    'reject:checkout',
    'borrower_approve:checkout',
    'borrower_reject:checkout',
    'start:checkout',
    'complete:checkout',
    'cancel:checkout',
  ],
  // 품질책임자: 반출 FSM 권한 없음 (조회 전용)
  quality_manager: [],
  // 시험소장: 반출 FSM 권한 없음 (조회 전용)
  lab_manager: [],
  // 시스템관리자: technical_manager의 모든 FSM 권한 포함
  system_admin: [
    'approve:checkout',
    'reject:checkout',
    'borrower_approve:checkout',
    'borrower_reject:checkout',
    'start:checkout',
    'complete:checkout',
    'cancel:checkout',
  ],
} as const;

export const FIXTURE_ROLE_VALUES = [
  'test_engineer',
  'technical_manager',
  'quality_manager',
  'lab_manager',
  'system_admin',
] as const satisfies readonly FixtureUserRole[];

// ============================================================================
// Table type
// ============================================================================

export type TableKey = `${CheckoutStatus}:${CheckoutPurpose}:${FixtureUserRole}`;
export type TableRow = Pick<
  NextStepDescriptor,
  | 'nextAction'
  | 'nextActor'
  | 'availableToCurrentUser'
  | 'nextStepIndex'
  | 'phase'
  | 'phaseIndex'
  | 'totalPhases'
>;

// ============================================================================
// Generated snapshot — 모든 (status × purpose × role) 조합 기록
// ============================================================================

function buildDescriptorTable(): Record<TableKey, TableRow> {
  const entries: Array<[TableKey, TableRow]> = [];
  for (const status of CHECKOUT_STATUS_VALUES) {
    for (const purpose of CHECKOUT_PURPOSE_VALUES) {
      for (const role of FIXTURE_ROLE_VALUES) {
        const key = `${status}:${purpose}:${role}` as TableKey;
        const {
          nextAction,
          nextActor,
          availableToCurrentUser,
          nextStepIndex,
          phase,
          phaseIndex,
          totalPhases,
        } = getNextStep({ status, purpose }, ROLE_FSM_PERMISSIONS[role]);
        entries.push([
          key,
          {
            nextAction,
            nextActor,
            availableToCurrentUser,
            nextStepIndex,
            phase,
            phaseIndex,
            totalPhases,
          },
        ]);
      }
    }
  }
  return Object.fromEntries(entries) as Record<TableKey, TableRow>;
}

export const DESCRIPTOR_TABLE = buildDescriptorTable() satisfies Record<TableKey, TableRow>;
