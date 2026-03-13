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
2. **Next.js Security Headers** — X-Frame-Options, X-Content-Type-Options 등 보안 헤더 설정
3. **PermissionsGuard DENY 모드** — 프로덕션에서 DENY 모드 권장
4. **@Public() 남용 검사** — 상태 변경 엔드포인트에 @Public() 사용 금지
5. **pnpm audit** — critical/high 취약점 없음

## When to Run

- 보안 관련 설정을 변경한 후
- Helmet/CSP 설정을 수정한 후
- 새 컨트롤러 엔드포인트를 추가한 후
- 프로덕션 배포 전 체크리스트
- 의존성 업데이트 후

## Related Files

| File                                                                       | Purpose                                                                    |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `apps/backend/src/common/middleware/helmet-config.ts`                      | Helmet CSP 설정                                                            |
| `apps/frontend/next.config.js`                                             | Next.js Security Headers                                                   |
| `apps/backend/src/modules/auth/guards/permissions.guard.ts`                | PermissionsGuard (AUDIT/DENY)                                              |
| `apps/backend/src/modules/auth/decorators/public.decorator.ts`             | @Public() 데코레이터                                                       |
| `apps/backend/src/common/guards/internal-api-key.guard.ts`                 | InternalApiKey Guard (서비스 간 인증, X-Internal-Api-Key 헤더)             |
| `apps/backend/src/common/guards/internal-api-throttler.guard.ts`           | InternalApiThrottlerGuard (ThrottlerGuard 확장 — SSR 요청 throttle bypass) |
| `apps/frontend/lib/api/server-api-client.ts`                               | Server Component용 Axios 클라이언트 (X-Internal-Api-Key 헤더 전송)         |
| `apps/backend/src/common/decorators/site-scoped.decorator.ts`              | @SiteScoped() 데코레이터 (데이터 격리)                                     |
| `apps/backend/src/common/interceptors/site-scope.interceptor.ts`           | SiteScopeInterceptor (JWT site → req.query.site 강제 주입)                 |
| `apps/backend/src/common/metrics/metrics.controller.ts`                    | Prometheus 메트릭 컨트롤러 (@Public() + GET, src/common/ 레이어)           |
| `scripts/check-endpoint-annotations.ts`                                    | CI 보안 검증 스크립트 (190/190 엔드포인트 어노테이션 검증)                 |
| `apps/frontend/tests/e2e/common/security-headers/security-headers.spec.ts` | 보안 헤더 E2E 테스트 (SH-01: Backend, SH-02: Frontend)                     |
| `.env`                                                                     | PERMISSIONS_GUARD_MODE 환경변수                                            |
| `apps/backend/src/common/utils/enforce-site-access.ts`                     | 크로스 사이트/팀 접근 제어 공유 유틸리티 (entityTeamId 지원)               |

## Workflow

### Step 1: Helmet CSP 프로덕션 강화 확인

프로덕션에서 `unsafe-inline`/`unsafe-eval`이 scriptSrc에 포함되지 않는지 확인합니다.

```bash
# scriptSrc 설정 확인
grep -n "scriptSrc\|unsafe-inline\|unsafe-eval\|isProduction" apps/backend/src/common/middleware/helmet-config.ts
```

**PASS 기준:** `scriptSrc`가 환경별로 분리되어 있고, 프로덕션에서는 `["'self'"]`만 사용.

**FAIL 기준:** 프로덕션/개발 구분 없이 `unsafe-inline`/`unsafe-eval`이 항상 포함되면 위반.

### Step 2: Next.js Security Headers 확인

`next.config.js`에 보안 헤더가 설정되어 있는지 확인합니다.

```bash
# Security Headers 설정 확인
grep -n "X-Frame-Options\|X-Content-Type-Options\|Referrer-Policy\|Permissions-Policy\|Strict-Transport-Security\|X-DNS-Prefetch-Control" apps/frontend/next.config.js
```

**PASS 기준:** 다음 6개 보안 헤더가 모두 설정되어야 함:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: on`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`

**FAIL 기준:** `headers()` 함수가 없거나, 필수 헤더가 누락되면 위반.

### Step 3: PermissionsGuard DENY 모드 확인

PermissionsGuard가 프로덕션에서 DENY 모드로 설정 가능한지 확인합니다.

```bash
# PERMISSIONS_GUARD_MODE 환경변수 참조 확인
grep -n "PERMISSIONS_GUARD_MODE\|mode.*AUDIT\|mode.*DENY" apps/backend/src/modules/auth/guards/permissions.guard.ts
```

```bash
# .env.example에 PERMISSIONS_GUARD_MODE 포함 여부
grep -n "PERMISSIONS_GUARD_MODE" .env.example .env 2>/dev/null
```

**PASS 기준:** `PermissionsGuard`가 `PERMISSIONS_GUARD_MODE` 환경변수를 참조하고, `.env.example`에 문서화.

**FAIL 기준:** 환경변수 참조가 없거나, 하드코딩된 모드 사용 시 위반.

### Step 4: @Public() 남용 검사

상태 변경 엔드포인트(POST/PATCH/DELETE)에 `@Public()`이 사용되지 않는지 확인합니다.

```bash
# @Public() 데코레이터 사용 위치 확인 (src/common/ 레이어 포함)
grep -rn "@Public()" apps/backend/src --include="*.controller.ts"
```

```bash
# @Public() 근처의 POST/PATCH/DELETE 확인
grep -rn "@Public()" apps/backend/src --include="*.controller.ts" -A 10 | grep "@Post\|@Patch\|@Delete"
```

**PASS 기준:** `@Public()` + `@Post/@Patch/@Delete` 조합이 없어야 함 (test-login 제외).

**FAIL 기준:** 상태 변경 엔드포인트에 `@Public()`이 적용되면 위반 (인증 우회 보안 취약점).

### Step 5: pnpm audit + pnpm.overrides 검증

critical/high 취약점이 없는지 확인하고, 전이적 의존성 취약점에 대한 `pnpm.overrides` 미티게이션이 설정되어 있는지 확인합니다.

```bash
# 의존성 보안 감사
pnpm audit --audit-level=high 2>&1 | tail -20
```

```bash
# pnpm.overrides 설정 확인 (전이적 취약점 미티게이션)
grep -A 20 '"pnpm"' package.json | grep -A 10 '"overrides"'
```

**PASS 기준:**

- critical 취약점 0개
- high 취약점이 있는 경우: **프로덕션 의존성 체인**의 high는 모두 `pnpm.overrides`로 미티게이션되어야 함
- devDependency 전용 high(tar/sqlite3, glob/@nestjs/cli 등)는 upstream 수정 불가 시 수용 가능 (아래 Exceptions 참조)

**FAIL 기준:**

- critical 취약점 1개 이상
- 프로덕션 체인의 high 취약점이 `pnpm.overrides` 없이 방치된 경우

**FAIL 시 수정 방법:** `package.json`의 `pnpm.overrides`에 최소 버전 강제 설정:

```json
{
  "pnpm": {
    "overrides": {
      "취약한-패키지": ">=수정된-버전"
    }
  }
}
```

그 후 `pnpm install` 실행하여 lock 파일 갱신.

### Step 6: @SiteScoped 데이터 격리 검사

사이트 간 데이터 격리가 올바르게 설정되어 있는지 확인합니다.

```bash
# @SiteScoped 데코레이터 사용 위치 확인 (src/common/ 레이어 포함)
grep -rn "@SiteScoped\|SiteScopeInterceptor" apps/backend/src --include="*.controller.ts"
```

```bash
# @SiteScoped 사용 시 SiteScopeInterceptor도 함께 @UseInterceptors로 등록되어 있는지 확인
grep -rn "@UseInterceptors.*SiteScopeInterceptor\|SiteScoped" apps/backend/src --include="*.controller.ts" | head -10
```

```bash
# bypassRoles 설정 확인 (lab_manager/system_admin이 전체 데이터 접근 가능해야 함)
grep -rn "@SiteScoped" apps/backend/src --include="*.controller.ts" -A 1 | grep "bypassRoles\|lab_manager\|system_admin" | head -5
```

**PASS 기준:**

- `@SiteScoped()` 사용 시 해당 컨트롤러에 `@UseInterceptors(SiteScopeInterceptor)`가 함께 등록되어 있음 (컨트롤러 클래스 레벨 또는 메서드 레벨)
- `bypassRoles: ['lab_manager', 'system_admin']`으로 전체 접근 가능
- `@SiteScoped` 없이 사이트 필터링 로직을 직접 구현하지 않음

**FAIL 기준:**

- `@SiteScoped()` 데코레이터는 있지만 `@UseInterceptors(SiteScopeInterceptor)` 누락 → 데코레이터가 효과 없음
- 신규 컨트롤러에서 사이트 필터링 로직을 직접 구현 → `@SiteScoped` 패턴 사용 필요

### Step 6b: Implicit Site Filtering 탐지

`@SiteScoped` 데코레이터 없이 `req.user.site`를 수동으로 전달하여 사이트 필터링을 구현하는 패턴을 탐지합니다.

```bash
# @SiteScoped 없이 req.user.site를 사용하는 컨트롤러 탐지
for f in $(grep -rln "req\.user\.site\|req\.user\?.site" apps/backend/src/modules --include="*.controller.ts"); do
  if ! grep -q "@SiteScoped\|@UseInterceptors.*SiteScopeInterceptor" "$f"; then
    echo "IMPLICIT: $f"
  fi
done
```

**PASS 기준:** 0개 결과 (모든 사이트 필터링이 @SiteScoped 데코레이터를 통해 선언적으로 처리).

**FAIL 기준:** @SiteScoped 없이 `req.user.site`를 수동 전달하는 컨트롤러 발견 시 위반 — 코드 리뷰에서 사이트 격리 의도가 불명확.

```typescript
// ❌ WRONG — implicit site filtering (의도 불명확)
@Get('stats')
async getStats(@Request() req: AuthenticatedRequest) {
  return this.service.getStats(req.user.site); // @SiteScoped 없이 수동 전달
}

// ✅ CORRECT — declarative site scoping
@SiteScoped()
@Get('stats')
async getStats(@Request() req: AuthenticatedRequest) {
  return this.service.getStats(req.query.site); // interceptor가 주입한 site 사용
}
```

**참고:** DashboardController, ApprovalsController, AuditController가 현재 implicit 패턴을 사용 중.

### Step 7: CI 엔드포인트 어노테이션 검증

모든 컨트롤러 엔드포인트에 보안 데코레이터가 적용되어 있는지 CI 스크립트로 확인합니다.

```bash
# CI 보안 검증 스크립트 실행 (190/190 통과 확인)
npx ts-node scripts/check-endpoint-annotations.ts 2>&1 | tail -10
```

**PASS 기준:** `All X endpoints have annotations` 메시지 출력 (0개 실패).

**FAIL 기준:** `MISSING` 항목 출력 시 해당 엔드포인트에 `@RequirePermissions()`, `@SkipPermissions()`, 또는 `@Public()` 추가 필요.

**참고:** 각 엔드포인트는 다음 중 하나를 반드시 가져야 함:

- `@RequirePermissions(...)` — 역할 기반 권한 검사
- `@SkipPermissions()` — 인증만 필요 (권한 검사 생략)
- `@Public()` — 인증/인가 모두 생략

### Step 8: Throttle Guard 등록 검증

IP 기반 `ThrottlerGuard`가 아닌 SSR 요청을 인식하는 `InternalApiThrottlerGuard`가 전역 가드로 등록되어 있는지 확인합니다.

```bash
# ThrottlerGuard 직접 등록 탐지 (InternalApiThrottlerGuard로 교체되어야 함)
grep -n "ThrottlerGuard" apps/backend/src/app.module.ts
```

**PASS 기준:** `ThrottlerGuard` 대신 `InternalApiThrottlerGuard`가 `APP_GUARD`로 등록됨:

```typescript
{ provide: APP_GUARD, useClass: InternalApiThrottlerGuard }
```

**FAIL 기준:** `useClass: ThrottlerGuard` 사용 시 위반 — SSR 병렬 요청이 429를 유발.

```bash
# InternalApiThrottlerGuard의 shouldSkip 로직 확인 (X-Internal-Api-Key 검증)
grep -n "shouldSkip\|x-internal-api-key\|validInternalKeys" apps/backend/src/common/guards/internal-api-throttler.guard.ts
```

**PASS 기준:** `shouldSkip()`이 `X-Internal-Api-Key` 헤더를 검증하고, 유효한 경우 `true` 반환.

**FAIL 기준:** `shouldSkip()`이 없거나 헤더 검증이 없으면 throttle bypass가 동작하지 않음.

### Step 9: SSR 클라이언트 X-Internal-Api-Key 헤더 전송 확인

Server Component용 API 클라이언트가 `InternalApiThrottlerGuard`가 인식할 수 있는 헤더를 실제로 전송하는지 확인합니다.

```bash
# server-api-client.ts의 X-Internal-Api-Key 헤더 전송 확인
grep -n "X-Internal-Api-Key\|INTERNAL_API_KEY\|x-internal-api-key" apps/frontend/lib/api/server-api-client.ts
```

**PASS 기준:** `process.env.INTERNAL_API_KEY`를 읽어 `X-Internal-Api-Key` 헤더로 설정:

```typescript
...(internalApiKey && { 'X-Internal-Api-Key': internalApiKey })
```

**FAIL 기준:** 헤더 전송 코드 없음 → SSR 병렬 요청이 여전히 IP 기반 throttle에 걸림.

```bash
# INTERNAL_API_KEY 환경변수가 프론트엔드 .env.local에 존재하는지 확인
grep -n "INTERNAL_API_KEY" apps/frontend/.env.local 2>/dev/null || echo "MISSING: apps/frontend/.env.local에 INTERNAL_API_KEY 없음"
```

**PASS 기준:** `INTERNAL_API_KEY=...` 라인 존재.

**FAIL 기준:** 환경변수 없으면 헤더가 전송되지 않아 throttle bypass 실패.

### Step 10: enforceSiteAccess 팀 레벨 격리 검증

`enforceSiteAccess()`가 `entityTeamId` 파라미터를 활용하여 팀 레벨 격리를 지원하는지 확인합니다.

```bash
# enforceSiteAccess에 entityTeamId 파라미터 지원 확인
grep -n "entityTeamId\|resolveDataScope" apps/backend/src/common/utils/enforce-site-access.ts
```

**PASS 기준:** `enforceSiteAccess()`가 `entityTeamId`를 5번째 파라미터로 받아 `resolveDataScope()`를 통해 팀 레벨 접근 제어 수행.

**FAIL 기준:** 사이트 레벨 격리만 하고 팀 레벨 격리가 없으면 같은 사이트 내 다른 팀의 데이터 변경 가능.

```bash
# enforceSiteAccess 호출 시 entityTeamId 전달 여부 확인
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.controller.ts" | grep -v "import"
```

**PASS 기준:** mutation 엔드포인트에서 `enforceSiteAccess()` 호출 시 가능하면 `entityTeamId`도 전달.

```typescript
// ❌ WRONG — 사이트 레벨만 확인 (같은 사이트 다른 팀 데이터 변경 가능)
enforceSiteAccess(req.user, entitySite, 'Equipment');

// ✅ CORRECT — 팀 레벨까지 확인
enforceSiteAccess(req.user, entitySite, 'Equipment', ForbiddenException, entityTeamId);
```

## Output Format

```markdown
| #   | 검사                        | 상태      | 상세                                       |
| --- | --------------------------- | --------- | ------------------------------------------ |
| 1   | Helmet CSP 프로덕션         | PASS/FAIL | scriptSrc 환경별 분리 여부                 |
| 2   | Next.js Security Headers    | PASS/FAIL | 누락된 헤더 목록                           |
| 3   | PermissionsGuard 모드       | PASS/FAIL | DENY 모드 설정 가능 여부                   |
| 4   | @Public() 남용              | PASS/FAIL | 상태 변경 엔드포인트 목록                  |
| 5   | pnpm audit + overrides      | PASS/FAIL | critical 0 + 프로덕션 high 미티게이션 여부 |
| 6   | @SiteScoped 데이터 격리     | PASS/FAIL | 누락 컨트롤러, bypassRoles 설정            |
| 7   | CI 어노테이션 검증          | PASS/FAIL | 미어노테이션 엔드포인트 수                 |
| 8   | Throttle Guard 등록         | PASS/FAIL | InternalApiThrottlerGuard 사용 여부        |
| 9   | SSR X-Internal-Api-Key 헤더 | PASS/FAIL | 헤더 전송 코드 존재 여부                   |
| 10  | enforceSiteAccess 팀 격리   | PASS/FAIL | entityTeamId 전달 여부                     |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **AuthController의 login/test-login/refresh** — 인증 전 또는 Access Token 만료 후 갱신이므로 `@Public()` 사용이 정상. `@Post('refresh')`는 만료된 토큰으로 호출되므로 `@Public()` + `@Post` 조합이 허용됨
2. **MonitoringController의 health check** — `@Public()` + GET은 정상
3. **개발 환경의 unsafe-inline/unsafe-eval** — HMR/DevTools에 필요
4. **PermissionsGuard AUDIT 모드** — 마이그레이션 기간 동안 허용 (프로덕션 전환 전)
5. **pnpm audit의 moderate/low** — high 이상만 검사
6. **devDependency 전용 high (upstream 수정 불가)** — 프로덕션 체인에 포함되지 않는 devDep의 high 취약점 중 upstream이 아직 수정하지 않은 경우 수용 가능. 현재 알려진 수용 예시:
   - `tar` via `drizzle-orm > sqlite3@5.1.7` (latest) — sqlite3가 prebuild 추출용으로만 사용, 악의적 tarball 주입 불가
   - `glob` via `@nestjs/cli@10.x` — @nestjs/cli 내부 라이브러리 사용 (CLI `--cmd` 플래그 인젝션 경로 없음)
7. **UsersController의 `POST /users/sync`** — `@Public()` + `@UseGuards(InternalApiKeyGuard)` + `@Post` 조합은 정상. `InternalApiKeyGuard`가 `X-Internal-Api-Key` 헤더를 검증하는 서비스 간 인증 (NextAuth → Backend Azure AD 사용자 동기화). 인증 우회가 아닌 다른 인증 방식 사용
8. **MetricsController (`src/common/metrics/`)** — Prometheus 스크래핑을 위한 `@Public()` + `@Get()` 사용이 정상. 외부 접근은 monitoring-network 격리 + Nginx 프록시로 차단되므로 인증 불필요. `src/modules/`가 아닌 `src/common/` 레이어에 위치하는 인프라 컨트롤러
9. **AuthController/MonitoringController의 @SiteScoped 미적용** — 인증 전 엔드포인트이거나 시스템 헬스체크이므로 @SiteScoped 불필요
10. **lab_manager/system_admin의 bypassRoles** — 이 역할들은 전체 사이트 데이터 접근 권한이 있으므로 `@SiteScoped()`에서 bypass 처리가 정상 (UL-QP-18 직무 정의에 따름)
