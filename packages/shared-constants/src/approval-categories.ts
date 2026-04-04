/**
 * 승인 카테고리 및 역할별 매핑 — Backend/Frontend SSOT
 *
 * Backend: ApprovalsService.getPendingCountsByRole에서 카운트 쿼리 스코핑
 * Frontend: 승인 관리 탭 필터링 (approvals-api.ts ROLE_TABS)
 *
 * ⚠️ 이 파일이 유일한 소스이며, 로컬 재정의는 금지됩니다.
 */
import {
  type UserRole,
  type ApprovalCategory,
  APPROVAL_CATEGORY_VALUES as _APPROVAL_CATEGORY_VALUES,
  ApprovalCategoryValues as AC,
} from '@equipment-management/schemas';

// Re-export SSOT 타입/상수 (convenience)
export type { ApprovalCategory };
export const APPROVAL_CATEGORY_VALUES = _APPROVAL_CATEGORY_VALUES;

/**
 * 역할별 승인 카테고리 매핑
 *
 * 해당 역할에 배정된 카테고리만 포함 — 미배정 카테고리는 카운트 쿼리 생략 (0 반환)
 *
 * UL-QP-18 직무분리 원칙:
 * - test_engineer: 승인 권한 없음 (기본 CRUD만)
 * - technical_manager: 대부분의 1차 승인
 * - quality_manager: 교정계획서 검토만
 * - lab_manager: 최종 승인 (폐기, 계획서) + 반입 승인
 * - system_admin: 시스템 관리 전용, 승인 워크플로우 미참여
 */
export const ROLE_APPROVAL_CATEGORIES: Record<UserRole, readonly ApprovalCategory[]> = {
  test_engineer: [],
  technical_manager: [
    AC.OUTGOING,
    AC.INCOMING,
    AC.EQUIPMENT,
    AC.CALIBRATION,
    AC.INSPECTION,
    AC.NONCONFORMITY,
    AC.DISPOSAL_REVIEW,
    AC.SOFTWARE_VALIDATION,
  ],
  quality_manager: [AC.PLAN_REVIEW],
  lab_manager: [AC.DISPOSAL_FINAL, AC.PLAN_FINAL, AC.INCOMING],
  system_admin: [],
};

/**
 * 역할이 특정 카테고리에 대한 승인 권한을 가지는지 확인
 */
export function hasApprovalCategory(role: UserRole, category: ApprovalCategory): boolean {
  return ROLE_APPROVAL_CATEGORIES[role].includes(category);
}
