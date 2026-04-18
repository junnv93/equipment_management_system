# Phase 1 — E2E 인프라 재설계 실행 계획

**Slug**: e2e-infra-redesign  
**Date**: 2026-04-18  
**Mode**: Mode 1 (파일 9개, 기존 패턴 적용)

## 목표

E2E 테스트가 `/auth/test-login` (패스워드리스) SSOT 엔드포인트를 사용하도록 전환.
- `admin@example.com` 잔존 5건 제거
- 하드코딩 DB URL fallback 제거
- `maxWorkers: 1` 추가 (단일 DB 아키텍처)

## SSOT 현황

- `DEFAULT_ROLE_EMAILS` → `packages/shared-constants/src/test-users.ts`
  - `lab_manager` → `lab.manager@example.com`
  - `technical_manager` → `tech.manager@example.com`
  - `test_engineer` → `test.engineer@example.com`
- `/auth/test-login?role=<role>` → `test-auth.controller.ts` (이미 존재)
- 프로덕션 UUID → `apps/backend/src/database/utils/uuid-constants.ts`
  - `USER_LAB_MANAGER_SUWON_ID` = `'00000000-0000-0000-0000-000000000003'`
  - `USER_TECHNICAL_MANAGER_SUWON_ID` = `'00000000-0000-0000-0000-000000000002'`
  - `USER_TEST_ENGINEER_SUWON_ID` = `'00000000-0000-0000-0000-000000000001'`

## 파일 변경 목록 (9개)

### 1. `apps/backend/test/helpers/test-auth.ts` ← 핵심

**변경 목적**: `loginAs()` 를 `/auth/test-login?role=...` 패스워드리스 SSOT 경유로 전환.

**변경 내용**:
- `DEFAULT_ROLE_EMAILS` import 추가 (`@equipment-management/shared-constants`)
- 프로덕션 UUID 상수 import (`uuid-constants.ts`)
- `CANONICAL_ROLE` 맵 추가: `admin` → `lab_manager`, `manager` → `technical_manager`, `user` → `test_engineer`
- `TEST_USERS` 타입: `password` 필드 제거, email을 `DEFAULT_ROLE_EMAILS` 에서 파생
- `TEST_USER_IDS`: e2e UUID → 프로덕션 UUID (이유: `generateTestTokenByEmail` 이 DB 조회 시 프로덕션 UUID 반환)
- `TEST_USER_DETAILS`: canonical email + 프로덕션 UUID + `TEAM_FCC_EMC_RF_SUWON_ID` 로 업데이트
- `loginAs()`: `POST /auth/login` + password → `GET /auth/test-login?role=<canonicalRole>`
- `TEAM_PLACEHOLDER_ID` import 제거

**보존**: `loginWithCredentials()` 함수 유지 (auth.e2e-spec.ts 등 레거시 호환)

### 2. `apps/backend/test/auth.e2e-spec.ts`

**변경 목적**: `/auth/login` 엔드포인트 자체를 테스트하는 spec이므로 레거시 credentials 로컬 상수로 유지.

**변경 내용**:
- `import { TEST_USERS }` 제거
- 로컬 `LEGACY_LOGIN_USERS` 상수 추가 (이 spec 전용):
  ```typescript
  const LEGACY_LOGIN_USERS = {
    admin: { email: 'admin@example.com', password: 'admin123' },
    manager: { email: 'manager@example.com', password: 'manager123' },
    user: { email: 'user@example.com', password: 'user123' },
  } as const;
  ```
- 모든 `TEST_USERS.*` → `LEGACY_LOGIN_USERS.*` 치환

### 3. `apps/backend/test/history-card-export.e2e-spec.ts`

**변경 목적**: globalSetup이 이미 canonical 사용자를 시딩하므로 인라인 upsert 불필요.

**변경 내용**:
- `beforeAll` 의 admin@example.com 인라인 upsert 블록 (lines 25-40) 삭제
- 사용되지 않는 import 제거: `eqOp`, `users`, `AppDatabase`

### 4. `apps/backend/test/site-permissions.e2e-spec.ts`

**변경 목적**: `user1@example.com` password 의존 제거.

**변경 내용**:
- L5: `loginWithCredentials` import 제거
- L21: `loginWithCredentials(ctx.app, 'user1@example.com', 'user123')` → `loginAs(ctx.app, 'user')`
- `testOperatorToken` 할당 블록을 `loginAs` 직접 호출로 단순화

### 5. `apps/backend/test/manager-role-constraint.e2e-spec.ts`

**변경 목적**: 주석 업데이트 (admin@example.com 언급 제거).

**변경 내용**:
- L28: `globalSetup이 admin@example.com 사용자를 시딩하므로` → `globalSetup이 lab_manager 역할 사용자를 시딩하므로`

### 6. `apps/backend/test/jest-e2e.json`

**변경 목적**: 단일 DB 아키텍처 필수 설정 추가.

**변경 내용**:
- `"maxWorkers": 1` 추가 (MUST — 단일 DB 아키텍처)
- `"testTimeout": 60000` 추가 (SHOULD)

### 7. `apps/backend/test/jest-global-setup.ts` (SHOULD)

**변경 목적**: PRODUCTION_USERS_SEED 중복 제거 (TEST_USER_DETAILS 가 동일 UUID 시딩하므로).

**변경 내용**: 주석 업데이트 및 TEST_USER_DETAILS 가 canonical 사용자를 담당함을 명시.

### 8. `apps/backend/test/users.e2e-spec.ts`

**변경 목적**: 하드코딩 DB URL fallback 제거.

**변경 내용**:
- L27: `process.env.DATABASE_URL || 'postgresql://...'` → `process.env.DATABASE_URL` + throw guard

### 9. `apps/backend/test/calibration-plans.e2e-spec.ts`

**변경 목적**: `process.env.DATABASE_URL as string` 타입 단언 → 명시적 검증.

**변경 내용**:
- L39: throw guard 추가 후 사용

## 검증 명령어

```bash
# M1: tsc 통과
pnpm --filter backend exec tsc --noEmit

# M2: admin@example.com 잔존 0건
grep -rn "admin@example.com" apps/backend/test/*.e2e-spec.ts

# M3: TEST_USERS 하드코딩 이메일 0건
grep -n "admin@example\|manager@example\|user@example" apps/backend/test/helpers/test-auth.ts

# M4: loginAs password-based 0건
grep -n "POST.*auth/login\|\.post.*auth/login" apps/backend/test/helpers/test-auth.ts | grep -v loginWithCredentials

# M5: maxWorkers 설정
grep "maxWorkers" apps/backend/test/jest-e2e.json

# M6: DB URL fallback 0건
grep "postgresql://postgres:postgres@localhost" apps/backend/test/users.e2e-spec.ts
```
