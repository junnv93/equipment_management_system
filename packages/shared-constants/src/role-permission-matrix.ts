/**
 * 역할-권한 reverse-index 매트릭스 (RolePermissionMatrix)
 *
 * ⚠️ DERIVED VIEW — `ROLE_PERMISSIONS`의 reverse-index view입니다.
 *    직접 데이터 추가 금지. 새 권한은 `permissions.ts` + `role-permissions.ts`만 갱신.
 *
 * SSOT: `ROLE_PERMISSIONS`가 유일한 source. 본 매트릭스는 module-load 시점에
 *       파생되어 "임의의 Permission p에 대해 어떤 UserRole이 보유하는가?" 라는
 *       reverse query를 O(1)로 탐색합니다.
 *
 * 양방향 query API:
 * - forward: `roleHasPermission(role, perm)` (`hasPermission()`의 양방향 일관성 alias)
 * - reverse: `getRolesWithPermission(perm): UserRole[]`
 *
 * 사용 케이스:
 * - test 작성자가 "이 perm을 가진 가장 narrow scope role"을 자동 매핑
 *   (`apps/backend/test/helpers/test-permission-token.ts` — Phase 2)
 * - controller `@RequirePermissions(P_X)` ↔ matrix 정합 검증
 *   (`apps/backend/scripts/verify-e2e-actor-alignment.ts` R4 룰 — Phase 3)
 * - frontend `PermissionGate` 등 reverse query 필요 UI (현재 미사용 — 차후 격상 가능)
 *
 * Drift 방지:
 * - `ROLE_PERMISSIONS` 갱신 시 자동 반영 (별도 수정 불필요)
 * - 본 파일은 `ROLE_PERMISSIONS` + `Permission`만 import — 데이터 source 추가 금지
 *
 * 결정성:
 * - role iteration 순서 = `ROLE_PERMISSIONS` 선언 순서 (test_engineer → system_admin)
 *   = `ROLE_HIERARCHY` ascending 순서. Phase 2 헬퍼는 이 순서를 그대로 활용하여
 *   "narrowest scope role first" 정렬을 sort 없이 보장.
 */

import type { UserRole } from '@equipment-management/schemas';
import { Permission } from './permissions';
import { ROLE_PERMISSIONS } from './role-permissions';

/**
 * Permission 키별 보유 역할 array의 readonly 매트릭스.
 *
 * 모든 Permission enum 값이 key로 등장 (dead permission도 빈 배열로 표현).
 * 순서: ROLE_PERMISSIONS 선언 순서 (= ROLE_HIERARCHY ascending = narrowest first).
 */
export type RolePermissionMatrix = Readonly<Record<Permission, readonly UserRole[]>>;

/**
 * `ROLE_PERMISSIONS`로부터 reverse-index 매트릭스를 도출.
 *
 * Module-load 시점에 1회 실행 (~0.5ms, Permission ~80 × UserRole 5 = 400 iter).
 * Fail-loud invariant: 모든 Permission enum 값이 key로 등장. 누락 시 throw.
 */
function derivePermissionRoleMatrix(): RolePermissionMatrix {
  const matrix: Partial<Record<Permission, UserRole[]>> = {};

  for (const perm of Object.values(Permission)) {
    matrix[perm] = [];
  }

  for (const role of Object.keys(ROLE_PERMISSIONS) as UserRole[]) {
    const perms = ROLE_PERMISSIONS[role];
    for (const perm of perms) {
      matrix[perm]!.push(role);
    }
  }

  for (const perm of Object.values(Permission)) {
    if (matrix[perm] === undefined) {
      throw new Error(
        `[ROLE_PERMISSION_MATRIX] Invariant violation: Permission '${perm}' missing from matrix. This is a derived-view bug.`
      );
    }
  }

  for (const perm of Object.values(Permission)) {
    Object.freeze(matrix[perm]);
  }

  return Object.freeze(matrix) as RolePermissionMatrix;
}

/**
 * 역할-권한 reverse-index 매트릭스 (DERIVED VIEW).
 *
 * @example
 * ROLE_PERMISSION_MATRIX[Permission.APPROVE_CALIBRATION_PLAN]
 * // → ['lab_manager', 'system_admin']  (UL-QP-18 §4.3 최종 승인 권한)
 */
export const ROLE_PERMISSION_MATRIX: RolePermissionMatrix = derivePermissionRoleMatrix();

/**
 * 특정 권한을 보유한 모든 역할 반환 (reverse query).
 *
 * 정렬: `ROLE_PERMISSIONS` 선언 순서 (= `ROLE_HIERARCHY` ascending).
 * 첫 원소가 narrowest scope role (Phase 2 `getTokenForPermission` 활용).
 *
 * @example
 * getRolesWithPermission(Permission.CREATE_EQUIPMENT)
 * // → ['test_engineer', 'technical_manager', 'system_admin']
 *
 * @example
 * getRolesWithPermission(Permission.APPROVE_CALIBRATION_PLAN)
 * // → ['lab_manager', 'system_admin']
 */
export function getRolesWithPermission(permission: Permission): readonly UserRole[] {
  return ROLE_PERMISSION_MATRIX[permission] ?? [];
}

/**
 * 특정 역할이 특정 권한을 보유하는지 (forward query — 양방향 API 일관성).
 *
 * `role-permissions.ts`의 `hasPermission()`과 동일 동작 — 양방향 query API
 * naming 일관성을 위해 별칭으로 제공. 신규 코드는 본 함수 또는 reverse query
 * (`getRolesWithPermission`)를 사용 권장.
 *
 * @example
 * roleHasPermission('lab_manager', Permission.APPROVE_CALIBRATION_PLAN) // → true
 * roleHasPermission('lab_manager', Permission.CREATE_EQUIPMENT)         // → false (UL-QP-18 §4.2 직무분리)
 */
export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}
