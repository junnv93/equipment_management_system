/**
 * RolePermissionMatrix — derived reverse-index view 검증
 *
 * MUST 기준 (contract M2/M8):
 * - 모든 Permission enum 값이 matrix key로 등장 (dead permission 0건)
 * - matrix는 frozen readonly + ROLE_PERMISSIONS 외 데이터 source 0건
 * - 양방향 round-trip 동치성: forward ↔ reverse
 * - 결정성: roles array 정렬은 ROLE_PERMISSIONS 선언 순서 보존
 * - UL-QP-18 직무분리 도메인 케이스 (lab_manager LACKS CREATE_EQUIPMENT 등)
 */

import type { UserRole } from '@equipment-management/schemas';
import { Permission } from '../src/permissions';
import { ROLE_PERMISSIONS, hasPermission } from '../src/role-permissions';
import {
  ROLE_PERMISSION_MATRIX,
  getRolesWithPermission,
  roleHasPermission,
} from '../src/role-permission-matrix';

const ALL_ROLES: UserRole[] = Object.keys(ROLE_PERMISSIONS) as UserRole[];

describe('RolePermissionMatrix (derived reverse-index view)', () => {
  describe('completeness invariant', () => {
    it('contains every Permission enum value as a key (no missing entries)', () => {
      const matrixKeys = new Set(Object.keys(ROLE_PERMISSION_MATRIX));
      for (const perm of Object.values(Permission)) {
        expect(matrixKeys.has(perm)).toBe(true);
      }
    });

    it('every entry is a readonly array of valid UserRoles', () => {
      for (const perm of Object.values(Permission)) {
        const roles = ROLE_PERMISSION_MATRIX[perm];
        expect(Array.isArray(roles)).toBe(true);
        for (const role of roles) {
          expect(ALL_ROLES).toContain(role);
        }
      }
    });

    it('top-level matrix is frozen (cannot mutate)', () => {
      expect(Object.isFrozen(ROLE_PERMISSION_MATRIX)).toBe(true);
    });

    it('every roles array is frozen (cannot mutate)', () => {
      for (const perm of Object.values(Permission)) {
        expect(Object.isFrozen(ROLE_PERMISSION_MATRIX[perm])).toBe(true);
      }
    });
  });

  describe('round-trip equivalence (forward ↔ reverse)', () => {
    it('roleHasPermission(r, p) ↔ getRolesWithPermission(p).includes(r) for every (role, perm) pair', () => {
      for (const role of ALL_ROLES) {
        for (const perm of Object.values(Permission)) {
          const forward = roleHasPermission(role, perm);
          const reverse = getRolesWithPermission(perm).includes(role);
          expect(forward).toBe(reverse);
        }
      }
    });

    it('roleHasPermission() agrees with legacy hasPermission()', () => {
      for (const role of ALL_ROLES) {
        for (const perm of Object.values(Permission)) {
          expect(roleHasPermission(role, perm)).toBe(hasPermission(role, perm));
        }
      }
    });
  });

  describe('determinism (sort stability)', () => {
    it('roles array preserves ROLE_PERMISSIONS declaration order (ROLE_HIERARCHY ascending)', () => {
      // 선언 순서 = test_engineer → technical_manager → quality_manager → lab_manager → system_admin
      const declOrder = ALL_ROLES;
      for (const perm of Object.values(Permission)) {
        const roles = getRolesWithPermission(perm);
        if (roles.length < 2) continue;
        const indices = roles.map((r) => declOrder.indexOf(r));
        const sortedIndices = [...indices].sort((a, b) => a - b);
        expect(indices).toEqual(sortedIndices);
      }
    });

    it('first role is always the narrowest scope (lowest hierarchy index)', () => {
      const declOrder = ALL_ROLES;
      for (const perm of Object.values(Permission)) {
        const roles = getRolesWithPermission(perm);
        if (roles.length === 0) continue;
        const firstIdx = declOrder.indexOf(roles[0]);
        const otherIndices = roles.slice(1).map((r) => declOrder.indexOf(r));
        for (const idx of otherIndices) {
          expect(firstIdx).toBeLessThan(idx);
        }
      }
    });
  });

  describe('UL-QP-18 도메인 매핑', () => {
    it('CREATE_EQUIPMENT — test_engineer + technical_manager + system_admin (등록 권한)', () => {
      expect(getRolesWithPermission(Permission.CREATE_EQUIPMENT)).toEqual([
        'test_engineer',
        'technical_manager',
        'system_admin',
      ]);
    });

    it('APPROVE_CALIBRATION_PLAN — lab_manager + system_admin (UL-QP-18 §4.3 최종 승인)', () => {
      expect(getRolesWithPermission(Permission.APPROVE_CALIBRATION_PLAN)).toEqual([
        'lab_manager',
        'system_admin',
      ]);
    });

    it('REVIEW_CALIBRATION_PLAN — quality_manager + lab_manager + system_admin', () => {
      expect(getRolesWithPermission(Permission.REVIEW_CALIBRATION_PLAN)).toEqual([
        'quality_manager',
        'lab_manager',
        'system_admin',
      ]);
    });

    it('lab_manager LACKS CREATE_EQUIPMENT (UL-QP-18 §4.2 직무분리)', () => {
      expect(getRolesWithPermission(Permission.CREATE_EQUIPMENT)).not.toContain('lab_manager');
      expect(roleHasPermission('lab_manager', Permission.CREATE_EQUIPMENT)).toBe(false);
    });

    it('lab_manager LACKS CREATE_CHECKOUT (반출 신청 박탈)', () => {
      expect(getRolesWithPermission(Permission.CREATE_CHECKOUT)).not.toContain('lab_manager');
    });

    it('lab_manager LACKS APPROVE_EQUIPMENT (등록·승인 분리)', () => {
      expect(getRolesWithPermission(Permission.APPROVE_EQUIPMENT)).not.toContain('lab_manager');
    });

    it('CREATE_CALIBRATION excludes system_admin (블랙리스트 의도적 제외)', () => {
      expect(getRolesWithPermission(Permission.CREATE_CALIBRATION)).not.toContain('system_admin');
    });

    it('PERFORM_DATA_MIGRATION — lab_manager + system_admin (블랙리스트 흡수)', () => {
      const roles = getRolesWithPermission(Permission.PERFORM_DATA_MIGRATION);
      expect(roles).toContain('system_admin');
      expect(roles).toContain('lab_manager');
    });
  });

  describe('matrix is pure derived view of ROLE_PERMISSIONS', () => {
    it('every (role, perm) in ROLE_PERMISSIONS appears in matrix reverse', () => {
      for (const role of ALL_ROLES) {
        for (const perm of ROLE_PERMISSIONS[role]) {
          expect(getRolesWithPermission(perm)).toContain(role);
        }
      }
    });

    it('every (perm, role) in matrix has the perm in ROLE_PERMISSIONS[role]', () => {
      for (const perm of Object.values(Permission)) {
        for (const role of getRolesWithPermission(perm)) {
          expect(ROLE_PERMISSIONS[role]).toContain(perm);
        }
      }
    });
  });
});
