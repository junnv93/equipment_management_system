---
name: verify-security
description: 보안 설정을 검증합니다. Helmet CSP, Next.js Security Headers, PermissionsGuard 모드, @Public 남용 검사.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# 보안 설정 검증

## Purpose

프로덕션 보안 설정이 올바르게 구성되어 있는지 검증합니다:

1. **Helmet CSP 프로덕션 강화** — 프로덕션에서 unsafe-inline/unsafe-eval 없어야 함
2. **Next.js Security Headers** — 6개 필수 보안 헤더 설정
3. **PermissionsGuard DENY 모드** — 프로덕션에서 DENY 모드 권장
4. **@Public() 남용 검사** — 상태 변경 엔드포인트에 @Public() 사용 금지
5. **pnpm audit** — critical/high 취약점 없음
6. **@SiteScoped 데이터 격리** — 사이트 간 데이터 격리
7. **Throttle Guard** — InternalApiThrottlerGuard 사용
8. **enforceSiteAccess** — 4-param 시그니처 + SSOT 에러 코드

## When to Run

- 보안 관련 설정을 변경한 후
- 새 컨트롤러 엔드포인트를 추가한 후
- 프로덕션 배포 전 체크리스트
- 의존성 업데이트 후

## Related Files

| File | Purpose |
|------|---------|
| `apps/backend/src/common/middleware/helmet-config.ts` | Helmet CSP 설정 |
| `apps/frontend/next.config.js` | Next.js Security Headers |
| `apps/backend/src/modules/auth/guards/permissions.guard.ts` | PermissionsGuard |
| `apps/backend/src/modules/auth/decorators/public.decorator.ts` | @Public() 데코레이터 |
| `apps/backend/src/common/guards/internal-api-key.guard.ts` | InternalApiKey Guard |
| `apps/backend/src/common/guards/internal-api-throttler.guard.ts` | InternalApiThrottlerGuard |
| `apps/frontend/lib/api/server-api-client.ts` | Server Component API 클라이언트 |
| `apps/backend/src/common/decorators/site-scoped.decorator.ts` | @SiteScoped() 데코레이터 |
| `apps/backend/src/common/interceptors/site-scope.interceptor.ts` | SiteScopeInterceptor |
| `apps/backend/src/common/utils/enforce-site-access.ts` | 크로스 사이트/팀 접근 제어 |

## Workflow

각 Step의 bash 명령어, 코드 예시: [references/step-details.md](references/step-details.md) 참조

### Step 1: Helmet CSP 프로덕션 강화

**PASS:** scriptSrc 환경별 분리, 프로덕션 `["'self'"]`만. **FAIL:** 구분 없이 unsafe-* 포함.

### Step 2: Next.js Security Headers

**PASS:** 6개 필수 헤더 모두 설정. **FAIL:** `headers()` 없거나 헤더 누락.

### Step 3: PermissionsGuard DENY 모드

**PASS:** `PERMISSIONS_GUARD_MODE` 환경변수 참조 + `.env.example` 문서화.

### Step 4: @Public() 남용

**PASS:** `@Public()` + `@Post/@Patch/@Delete` 조합 0개 (test-login 제외).

### Step 5: pnpm audit + overrides

**PASS:** critical 0개 + 프로덕션 high `pnpm.overrides`로 미티게이션.

### Step 6: @SiteScoped 데이터 격리 + (6b) Implicit Site Filtering

**PASS:** `@SiteScoped()` + `@UseInterceptors(SiteScopeInterceptor)` 쌍. Implicit 패턴 0개.

### Step 7: 엔드포인트 보안 데코레이터

**PASS:** HTTP 메서드 수 ≈ 보안 데코레이터 수. 각 엔드포인트에 `@RequirePermissions`/`@SkipPermissions`/`@Public` 중 하나.

### Step 8: Throttle Guard 등록

**PASS:** `InternalApiThrottlerGuard`가 `APP_GUARD`로 등록. `shouldSkip()`이 X-Internal-Api-Key 검증.

### Step 9: SSR X-Internal-Api-Key 헤더

**PASS:** server-api-client.ts에 헤더 전송 코드 + `.env.local`에 INTERNAL_API_KEY 존재.

### Step 10: enforceSiteAccess 아키텍처

**PASS:** 4-param 시그니처, `ErrorCode.ScopeAccessDenied` SSOT, `scope.type === 'none'` fail-close, team→site defense-in-depth.

## Output Format

```markdown
| #   | 검사                        | 상태      | 상세                                       |
| --- | --------------------------- | --------- | ------------------------------------------ |
| 1   | Helmet CSP 프로덕션         | PASS/FAIL | scriptSrc 환경별 분리 여부                 |
| 2   | Next.js Security Headers    | PASS/FAIL | 누락된 헤더 목록                           |
| 3   | PermissionsGuard 모드       | PASS/FAIL | DENY 모드 설정 가능 여부                   |
| 4   | @Public() 남용              | PASS/FAIL | 상태 변경 엔드포인트 목록                  |
| 5   | pnpm audit + overrides      | PASS/FAIL | critical 0 + 프로덕션 high 미티게이션      |
| 6   | @SiteScoped 데이터 격리     | PASS/FAIL | 누락 컨트롤러, bypassRoles 설정            |
| 7   | 엔드포인트 보안 데코레이터  | PASS/FAIL | 미어노테이션 엔드포인트 수                 |
| 8   | Throttle Guard 등록         | PASS/FAIL | InternalApiThrottlerGuard 사용 여부        |
| 9   | SSR X-Internal-Api-Key      | PASS/FAIL | 헤더 전송 코드 존재 여부                   |
| 10  | enforceSiteAccess 팀 격리   | PASS/FAIL | entityTeamId 전달 여부                     |
```

## Exceptions

1. **AuthController의 login/test-login/refresh** — `@Public()` + `@Post` 허용 (인증 전/갱신)
2. **MonitoringController의 health check** — `@Public()` + GET 정상
3. **개발 환경의 unsafe-inline/unsafe-eval** — HMR/DevTools에 필요
4. **PermissionsGuard AUDIT 모드** — 마이그레이션 기간 동안 허용
5. **pnpm audit의 moderate/low** — high 이상만 검사
6. **devDependency 전용 high (upstream 수정 불가)** — tar via sqlite3, glob via @nestjs/cli 등 수용 가능
7. **UsersController의 `POST /users/sync`** — `@Public()` + `@UseGuards(InternalApiKeyGuard)` + `@Post` 정상
8. **MetricsController** — Prometheus 스크래핑 `@Public()` + `@Get()` 정상 (인프라 컨트롤러)
9. **AuthController/MonitoringController의 @SiteScoped 미적용** — 인증 전/헬스체크
10. **lab_manager/system_admin의 bypassRoles** — UL-QP-18 직무 정의에 따름
11. **test-login/test-cache-clear의 `@Public()` + `@SkipPermissions()`** — 테스트 전용 엔드포인트
