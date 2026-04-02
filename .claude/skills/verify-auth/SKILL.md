---
name: verify-auth
description: Verifies server-side authentication/authorization pattern compliance — req.user.userId extraction (no body userId), @RequirePermissions decorator, @AuditLog decorator, JwtAuthGuard coverage. Run after adding/modifying controller endpoints.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# 서버 사이드 인증/인가 패턴 검증

## Purpose

백엔드 컨트롤러가 인증/인가 규칙을 올바르게 준수하는지 검증합니다:

1. **서버 사이드 userId 추출** — `req.user.userId`로 사용자 식별, Body에서 userId 수신 금지
2. **Permission Guard** — 변경 엔드포인트에 `@RequirePermissions()` 데코레이터 적용
3. **@AuditLog 데코레이터** — 상태 변경 엔드포인트에 감사 로그 데코레이터 적용
4. **@Public 데코레이터** — 인증 불필요 엔드포인트에만 사용

## When to Run

- 새로운 컨트롤러 엔드포인트를 추가한 후
- 승인/반려 로직을 수정한 후
- 권한 체계를 변경한 후

## Related Files

| File | Purpose |
|---|---|
| `apps/backend/src/modules/auth/guards/permissions.guard.ts` | Permission Guard |
| `apps/backend/src/modules/auth/decorators/permissions.decorator.ts` | @RequirePermissions() |
| `apps/backend/src/common/decorators/audit-log.decorator.ts` | AuditLog 데코레이터 |
| `apps/backend/src/types/auth.ts` | SSOT: JwtUser, AuthenticatedRequest 타입 |
| `apps/backend/src/database/utils/uuid-constants.ts` | SYSTEM_USER_UUID |
| `apps/backend/src/common/utils/enforce-site-access.ts` | 크로스 사이트 접근 제어 |
| `packages/shared-constants/src/permissions.ts` | Permission enum |

## Workflow

### Step 1: Body에서 userId/approverId 수신 금지

상태 변경 DTO에 approverId/userId 필드가 정의되어 있지 않은지 확인합니다.
**PASS:** DTO에 approverId/userId 없음. **FAIL:** Zod schema에 정의되어 있으면 위반.

상세: [references/auth-checks.md](references/auth-checks.md) Step 1

### Step 2: req.user.userId 서버 사이드 추출

approve/reject 메서드에서 `@Request() req: AuthenticatedRequest`를 통해 userId를 추출하는지 확인.
**PASS:** 모든 approve/reject에 req 파라미터 존재. **FAIL:** 누락 메서드.

상세: [references/auth-checks.md](references/auth-checks.md) Step 2

### Step 3: @RequirePermissions 적용 확인

POST/PATCH/DELETE 엔드포인트에 Permission Guard가 적용되어 있는지 확인합니다.
**PASS:** 모든 변경 엔드포인트에 데코레이터 존재. **FAIL:** 누락.

상세: [references/auth-checks.md](references/auth-checks.md) Step 3

### Step 4: @AuditLog 데코레이터 확인

상태 변경 엔드포인트에 감사 로그가 기록되는지 확인합니다.
**PASS:** 상태 변경 메서드에 @AuditLog 존재. **FAIL:** 누락.

상세: [references/auth-checks.md](references/auth-checks.md) Step 4

### Step 5~10: 추가 인증/인가 검증

| Step | 검증 대상 |
|---|---|
| 5 | JwtUser 필드 접근 패턴 (레거시 user.id/user.role 사용 금지) |
| 6 | Permission import 소스 (shared-constants에서만) |
| 7 | @SkipAudit() 올바른 사용 (POST/PATCH/DELETE에 사용 금지) |
| 8 | SYSTEM_USER_UUID 사용 (비-UUID 문자열 하드코딩 금지) |
| 9 | AuthenticatedRequest 옵셔널 파라미터 탐지 |
| 10 | enforceSiteAccess() 뮤테이션 엔드포인트 적용 |

상세: [references/auth-checks.md](references/auth-checks.md) Step 5~10

## Output Format

```markdown
| #   | 검사                        | 상태      | 상세                            |
| --- | --------------------------- | --------- | ------------------------------- |
| 1   | Body userId 금지            | PASS/FAIL | 위반 DTO 목록                   |
| 2   | req.user.userId 추출        | PASS/FAIL | 누락 메서드 목록                |
| 3   | @RequirePermissions         | PASS/FAIL | 누락 엔드포인트 목록            |
| 4   | @AuditLog                   | PASS/FAIL | 누락 메서드 목록                |
| 5   | JwtUser 필드 접근           | PASS/FAIL | 레거시 필드 사용 위치           |
| 6   | Permission import           | PASS/FAIL | 잘못된 import 위치              |
| 7   | @SkipAudit() 오용           | PASS/FAIL | POST/PATCH/DELETE에 사용된 위치 |
| 8   | SYSTEM_USER_UUID 사용       | PASS/FAIL | UUID 컬럼에 비-UUID 하드코딩    |
| 9   | AuthenticatedRequest 옵셔널 | PASS/FAIL | req?: 또는 req!. 사용 위치      |
| 10  | enforceSiteAccess 적용      | PASS/FAIL | 누락 mutation 컨트롤러          |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **AuthController의 login/test-login** — 인증 전이므로 `@Public()` 정상
2. **MonitoringController의 health check** — `@Public()` 정상
3. **MetricsController (`src/common/metrics/`)** — Prometheus 스크래핑용 `@Public()` + `@Get()` 정상
4. **GET 엔드포인트** — 읽기 전용이므로 `@RequirePermissions` 필수 아님
5. **DTO의 주석 내 userId 언급** — 문서화 목적
6. **DashboardController** — 통계 조회용 GET
7. **NotificationSseController** — `SseJwtAuthGuard` 별도 가드 사용 정상
8. **SettingsController의 GET** — 읽기 전용, AuditLog 불필요
9. **AuditController** — 읽기 전용 (GET만 존재)
10. **UsersController의 `@SkipPermissions()` PATCH** — 본인 설정만 변경하므로 정상
11. **TestAuthController** — 개발/테스트 전용, 프로덕션 미등록
