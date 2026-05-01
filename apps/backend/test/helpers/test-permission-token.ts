/**
 * `getTokenForPermission(app, perm, opts?)` — 테스트 작성자가 "어떤 token이 perm X를
 * 가지는가?"를 코드로 묻는 SSOT 진입점.
 *
 * 흐름:
 *   1. `getRolesWithPermission(perm)` (Phase 1 SSOT) → narrowest first 정렬된 UserRole[]
 *   2. 첫 매칭 TestRole alias 발견 시 `loginAs()` 호출 → access token 반환
 *   3. (default `broaden=false`) `quality_manager`처럼 alias 미존재 role을 만나면 throw
 *      with actionable message (Step 23 4-place SSOT 갱신 가이드)
 *   4. (`broaden=true`) alias 미존재 시 다음 hierarchy로 fallback
 *   5. `roles.length === 0` → "dead permission" throw
 *
 * 설계 철학:
 * - 사용자(test 작성자)는 권한만 알면 된다 — 어느 역할이 그 권한을 갖는지는 SSOT가 답한다.
 * - "scope-우회 default 금지" — `system_admin`은 거의 모든 권한을 가지므로
 *   first-match가 항상 `system_admin`이면 scope 검증이 dead-code화된다 (verify-e2e Step 25 안티패턴).
 *   Phase 1 matrix가 ROLE_HIERARCHY ascending(narrowest first) 정렬을 보장하므로
 *   본 헬퍼는 자연스럽게 narrowest scope role을 우선한다.
 *
 * 참고:
 * - Phase 1 contract: `packages/shared-constants/src/role-permission-matrix.ts`
 * - Phase 4 dogfood: `apps/backend/test/lab-manager-permission-scope.e2e-spec.ts`
 * - SSOT 4-place 갱신 가이드: `.claude/skills/verify-e2e/SKILL.md` Step 23
 */

import type { INestApplication } from '@nestjs/common';
import {
  Permission,
  getRolesWithPermission,
} from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { loginAs, type TestRole } from './test-auth';

/**
 * UserRole → TestRole reverse mapping.
 *
 * `test-auth.ts`의 `CANONICAL_ROLE` 역방향. **현 sprint scope**는 4 TestRole
 * (admin/manager/user/systemAdmin) 만 보유 — `quality_manager`는 alias 미존재.
 *
 * 갱신 시 4-place SSOT 동시 갱신 필수 (verify-e2e Step 23):
 *   1. test-auth.ts `TestRole` 유니언 + `CANONICAL_ROLE` + `TEST_USERS` + `TEST_USER_IDS` + `TEST_USER_DETAILS`
 *   2. 본 매핑 테이블
 *   3. jest-global-setup 시드
 */
const TEST_ROLE_BY_CANONICAL: Partial<Record<UserRole, TestRole>> = {
  test_engineer: 'user',
  technical_manager: 'manager',
  lab_manager: 'admin',
  system_admin: 'systemAdmin',
  // quality_manager: alias 미존재 — broaden=true에서만 다음 hierarchy로 fallback
};

export interface GetTokenForPermissionOptions {
  /**
   * narrowest scope role이 TestRole alias 미보유(예: `quality_manager`)일 때
   * 다음 hierarchy 단계로 fallback할지 여부.
   *
   * - `false` (기본): alias 미존재 시 actionable throw — scope 의도 명시 강제
   * - `true`: 다음 hierarchy로 진행 (`system_admin`이 최종 fallback)
   *
   * ⚠️ `broaden=true`는 scope 검증 의도와 충돌 가능 — 사용 시 주석으로 의도 명시 권장.
   */
  broaden?: boolean;
}

/**
 * 특정 권한을 보유한 가장 narrow scope의 TestRole token을 반환.
 *
 * @example
 * // technical_manager 토큰 (CREATE_EQUIPMENT의 narrowest는 test_engineer이지만
 * // technical_manager도 보유 — 첫 원소는 test_engineer)
 * const userToken = await getTokenForPermission(app, Permission.CREATE_EQUIPMENT);
 *
 * @example
 * // lab_manager 토큰 (APPROVE_CALIBRATION_PLAN의 narrowest)
 * const adminToken = await getTokenForPermission(app, Permission.APPROVE_CALIBRATION_PLAN);
 *
 * @example
 * // quality_manager는 TestRole alias 미존재 → throw
 * await getTokenForPermission(app, Permission.REVIEW_CALIBRATION_PLAN);
 * // → throws Error: "...narrowest role 'quality_manager' has no TestRole alias..."
 *
 * @example
 * // broaden=true → lab_manager fallback (의도 명시 필수)
 * const labManagerToken = await getTokenForPermission(
 *   app,
 *   Permission.REVIEW_CALIBRATION_PLAN,
 *   { broaden: true }, // intentional: REVIEW endpoint scope 미검증
 * );
 */
export async function getTokenForPermission(
  app: INestApplication,
  permission: Permission,
  opts: GetTokenForPermissionOptions = {}
): Promise<string> {
  const { broaden = false } = opts;
  const roles = getRolesWithPermission(permission);

  if (roles.length === 0) {
    throw new Error(
      `[getTokenForPermission] Permission '${permission}' has no role coverage — dead permission? ` +
        `(매트릭스에 role 0건 — controller @RequirePermissions(${permission})이 사용 중이라면 ` +
        `ROLE_PERMISSIONS에 매핑 추가 필요)`
    );
  }

  for (const role of roles) {
    const testRole = TEST_ROLE_BY_CANONICAL[role];
    if (testRole !== undefined) {
      return loginAs(app, testRole);
    }
    if (!broaden) {
      throw new Error(
        `[getTokenForPermission] Permission '${permission}' narrowest role '${role}' has no TestRole alias.\n` +
          `→ verify-e2e Step 23 (4-place SSOT) 갱신으로 alias를 추가하거나, { broaden: true }를 명시하여 다음 hierarchy로 fallback하세요.\n` +
          `(matched roles: [${roles.join(', ')}])`
      );
    }
  }

  throw new Error(
    `[getTokenForPermission] Permission '${permission}' has roles [${roles.join(', ')}] but none have a TestRole alias.\n` +
      `→ test-auth.ts TestRole 유니언 + 4-place SSOT 갱신 (verify-e2e Step 23) 필요.`
  );
}
