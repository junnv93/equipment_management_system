---
name: verify-security
description: OWASP Top 10 security verification — A01 broken access control (JwtAuthGuard, @Public misuse, userId trust), A03 injection (raw SQL, class-validator), A05 security misconfiguration (Helmet CSP, CORS), A06 vulnerable components (Dependabot, audit), A07 authentication (hardcoded passwords, token lifetime), A08 integrity (gitleaks, pre-commit), A09 logging (@AuditLog), A10 SSRF (timing-safe API keys).
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목 또는 OWASP 카테고리 (A01-A10)]'
---

# 보안 설정 검증 (OWASP Top 10)

## Purpose

OWASP Top 10 (2021) 기반으로 프로덕션 보안을 검증합니다:

1. **A01: Broken Access Control** — @Public() 남용, 글로벌 JwtAuthGuard, 클라이언트 userId 신뢰, PermissionsGuard DENY 모드
2. **A03: Injection** — Raw SQL 탐지, class-validator 잔존, Zod 검증 누락
3. **A05: Security Misconfiguration** — Helmet CSP, Next.js Headers, CORS 와일드카드, Swagger 프로덕션 노출
4. **A06: Vulnerable Components** — Dependabot, pnpm audit, 패키지 무결성
5. **A07: Authentication Failures** — 하드코딩 비밀번호, 토큰 수명, 브루트포스 보호, 프로덕션 Azure AD 전용
6. **A08: Software/Data Integrity** — gitleaks CI, 프리커밋 훅, 시크릿 강도 검증
7. **A09: Security Logging** — @AuditLog 누락, 자동 감사 인터셉터
8. **A10: SSRF** — 타이밍 안전 API 키, 사용자 입력 URL
9. **Site Scoping** — @SiteScoped 데이터 격리, enforceSiteAccess 팀 격리

## When to Run

- 새 컨트롤러 엔드포인트를 추가한 후
- 인증/인가 로직을 변경한 후
- 보안 미들웨어 (Helmet, CORS, Rate Limiting) 수정 후
- 의존성 업데이트 후
- CAR (Cyber Architecture Review) 제출 전
- 프로덕션 배포 전 체크리스트

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
| ~~`scripts/check-endpoint-annotations.ts`~~                                | (삭제됨 — CI 파이프라인 통합으로 대체)                                     |
| `apps/backend/src/common/file-upload/file-upload.service.ts`               | 파일 업로드 서비스 (MIME 검증, magic bytes, 크기 제한)                      |
| `packages/shared-constants/src/file-types.ts`                              | 파일 업로드 SSOT (ALLOWED_MIME_TYPES, MIME_TO_MAGIC_BYTES, FILE_UPLOAD_LIMITS) |
| `apps/frontend/tests/e2e/common/security-headers/security-headers.spec.ts` | 보안 헤더 E2E 테스트 (SH-01: Backend, SH-02: Frontend)                     |
| `.env`                                                                     | PERMISSIONS_GUARD_MODE 환경변수                                            |
| `apps/backend/src/common/utils/enforce-site-access.ts`                     | 크로스 사이트/팀 접근 제어 공유 유틸리티 (entityTeamId 지원)               |
| `apps/backend/src/app.module.ts`                                           | 글로벌 JwtAuthGuard, PermissionsGuard APP_GUARD 등록                       |
| `apps/backend/src/modules/auth/auth.service.ts`                            | 브루트포스 보호, 프로덕션 Azure AD 전용, 하드코딩 비밀번호               |
| `apps/backend/src/config/env.validation.ts`                                | 프로덕션 시크릿 강도 검증 (JWT_SECRET 32자+, DB_PASSWORD 기본값 거부)     |
| `packages/shared-constants/src/auth-token.ts`                              | 토큰 수명 SSOT (ACCESS 15min, REFRESH 7d, SESSION 30d)                   |
| `apps/backend/src/common/interceptors/audit.interceptor.ts`                | 자동 감사 로깅 (POST/PATCH/DELETE)                                        |
| `apps/backend/src/common/decorators/audit-log.decorator.ts`                | @AuditLog 데코레이터                                                      |
| `.github/workflows/main.yml`                                               | CI 보안 게이트 (gitleaks, npm audit, security:check)                     |
| `.github/dependabot.yml`                                                   | 의존성 자동 업데이트                                                      |
| `.npmrc`                                                                   | 패키지 무결성 (verify-store-integrity)                                    |
| `.husky/pre-commit`                                                        | 프리커밋 훅                                                              |
| `scripts/check-security-decorators.ts`                                     | 엔드포인트 보안 데코레이터 CI 검증                                        |

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

### Step 6: A01 — 글로벌 JwtAuthGuard 등록 확인

```bash
grep -n "APP_GUARD.*JwtAuthGuard\|useClass.*JwtAuthGuard" apps/backend/src/app.module.ts
```

**PASS 기준:** JwtAuthGuard가 `APP_GUARD`로 등록됨.
**FAIL 기준:** JwtAuthGuard가 글로벌 가드로 등록되지 않으면 위반 — 모든 엔드포인트가 인증 없이 접근 가능.

### Step 6a: A01 — 클라이언트 userId 신뢰 탐지

```bash
# body/dto에서 userId를 받는 패턴 탐지
grep -rn "dto\.userId\|body\.userId\|@Body.*userId" apps/backend/src/modules --include="*.ts" | grep -v "__tests__\|spec\.ts\|dto/"
```

**PASS 기준:** 0개 결과 (mutation 엔드포인트에서 userId는 `req.user.userId`로만 추출).
**FAIL 기준:** 컨트롤러/서비스에서 `dto.userId`나 `body.userId`를 사용하면 위반 — 사용자 위조 가능.

### Step 6b: A03 — Raw SQL 인젝션 탐지

```bash
grep -rn "sql\.raw(" apps/backend/src --include="*.ts" | grep -v "like-escape\|site-filter\|__tests__"
```

**PASS 기준:** 0개 결과 (허용된 예외 외에 sql.raw() 없음).
**FAIL 기준:** 사용자 입력이 sql.raw()에 전달되면 위반.

허용 예외: `like-escape.ts` (이스케이프 상수), `site-filter.ts` (테이블명 상수), `versioned-base.service.ts` (version 증감).

### Step 6c: A03 — class-validator 잔존 탐지

```bash
grep -rn "import.*class-validator\|from.*class-validator" apps/backend/src --include="*.ts" | grep -v "__tests__\|spec\.ts"
```

**PASS 기준:** 0개 결과 (Zod으로 전환 완료).
**FAIL 기준:** class-validator import 존재 시 위반. Swagger DTO 문서화용 데코레이터만 예외.

### Step 6d: A07 — 하드코딩 비밀번호 폴백 탐지

```bash
grep -rn "|| 'admin\||| 'manager\||| 'user\||| 'password\||| 'postgres'" apps/backend/src --include="*.ts" | grep -v "__tests__\|spec\.ts\|jest-setup"
```

**PASS 기준:** 0개 결과 (프로덕션 코드에 비밀번호 폴백 없음).
**FAIL 기준:** `|| 'admin123'` 같은 폴백이 src/ 프로덕션 코드에 있으면 위반.

### Step 6e: A07 — 토큰 수명 검증

```bash
grep -n "ACCESS_TOKEN_TTL_SECONDS\|REFRESH_TOKEN_TTL_SECONDS" packages/shared-constants/src/auth-token.ts
```

**PASS 기준:** ACCESS_TOKEN ≤ 3600s (1시간), REFRESH_TOKEN ≤ 2592000s (30일).
**FAIL 기준:** 토큰 수명이 위 임계값을 초과하면 위반.

### Step 6f: A07 — 프로덕션 Azure AD 전용 확인

```bash
grep -n "AUTH_PRODUCTION_AZURE_ONLY" apps/backend/src/modules/auth/auth.service.ts
```

**PASS 기준:** 프로덕션에서 로컬 로그인 차단 코드 존재.
**FAIL 기준:** 프로덕션에서 로컬 인증이 허용되면 위반.

### Step 6g: A08 — CI 시크릿 스캔 + 프리커밋 훅

```bash
grep -n "gitleaks" .github/workflows/main.yml
ls .husky/pre-commit 2>/dev/null && echo "PASS" || echo "FAIL: pre-commit hook missing"
```

**PASS 기준:** gitleaks CI 통합 + pre-commit 훅 존재.
**FAIL 기준:** 어느 하나라도 없으면 위반.

### Step 6h: A08 — 프로덕션 시크릿 강도 검증

```bash
grep -n "JWT_SECRET.*32\|INTERNAL_API_KEY.*32\|REFRESH_TOKEN_SECRET.*32" apps/backend/src/config/env.validation.ts
```

**PASS 기준:** 프로덕션 시크릿 최소 32자 검증 존재.
**FAIL 기준:** 프로덕션 환경에서 시크릿 길이 검증이 없으면 위반.

### Step 6i: A09 — 감사 로깅 커버리지

```bash
# mutation 엔드포인트가 있는 컨트롤러
mutation_controllers=$(grep -rln "@Post\|@Patch\|@Delete" apps/backend/src/modules --include="*.controller.ts" | sort -u)
# @AuditLog이 적용된 컨트롤러
audit_controllers=$(grep -rln "@AuditLog" apps/backend/src/modules --include="*.controller.ts" | sort -u)
# 차이 확인
diff <(echo "$mutation_controllers") <(echo "$audit_controllers")
```

**PASS 기준:** mutation 컨트롤러와 audit 컨트롤러 목록이 대체로 일치 (자동 감사 인터셉터가 보완).
**FAIL 기준:** mutation 엔드포인트가 있는 컨트롤러에 @AuditLog도 없고 자동 감사도 비활성화되면 위반.

### Step 6j: A10 — 타이밍 안전 API 키 검증

```bash
grep -n "timingSafeEqual" apps/backend/src/common/guards/internal-api-key.guard.ts
```

**PASS 기준:** `crypto.timingSafeEqual` 사용.
**FAIL 기준:** `===` 일반 비교 사용 시 위반 (타이밍 공격 취약).

### Step 7: @SiteScoped 데이터 격리 검사

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

### Step 7: 엔드포인트 보안 데코레이터 적용 확인

모든 컨트롤러 엔드포인트에 보안 데코레이터가 적용되어 있는지 Grep으로 확인합니다.

```bash
# @Get/@Post/@Patch/@Put/@Delete 데코레이터가 있는 메서드에 @RequirePermissions, @Public, @SkipPermissions 중 하나가 있는지 확인
grep -rn "@Get\|@Post\|@Patch\|@Put\|@Delete" apps/backend/src/**/*.controller.ts | wc -l
grep -rn "@RequirePermissions\|@Public\|@SkipPermissions" apps/backend/src/**/*.controller.ts | wc -l
```

**PASS 기준:** 두 명령어의 줄 수가 유사 (각 HTTP 메서드에 대응하는 보안 데코레이터 존재).

**FAIL 기준:** HTTP 메서드 수보다 보안 데코레이터 수가 현저히 적으면 누락 엔드포인트 확인 필요.

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

### Step 10: enforceSiteAccess 아키텍처 검증

`enforceSiteAccess()`가 올바른 시그니처와 SSOT 에러 코드를 사용하는지 확인합니다.

```bash
# enforceSiteAccess 시그니처 확인 (4-param: req, entitySite, policy, entityTeamId?)
grep -n "export function enforceSiteAccess" apps/backend/src/common/utils/enforce-site-access.ts
```

**PASS 기준:** `enforceSiteAccess(req, entitySite, policy, entityTeamId?)` — 4개 파라미터 시그니처. `errorCode` 문자열 파라미터가 없어야 함.

```bash
# SSOT 에러 코드 사용 확인 (ErrorCode.ScopeAccessDenied)
grep -n "ErrorCode.ScopeAccessDenied\|code: ErrorCode" apps/backend/src/common/utils/enforce-site-access.ts
```

**PASS 기준:** 모든 ForbiddenException에 `code: ErrorCode.ScopeAccessDenied` 사용.

**FAIL 기준:** 하드코딩된 에러 코드 문자열 (`'CHECKOUT_CROSS_SITE_MUTATION_DENIED'` 등) 사용 시 위반.

```bash
# scope.type === 'none' fail-close 처리 확인
grep -n "scope.type.*none\|fail-close" apps/backend/src/common/utils/enforce-site-access.ts
```

**PASS 기준:** `scope.type === 'none'`에서 ForbiddenException throw (fail-close).

**FAIL 기준:** `scope.type === 'none'` 미처리 시 pass-through (fail-open) — 보안 취약점.

```bash
# team scope에서 site 검증 (defense-in-depth) 확인
grep -n "team.*site\|defense-in-depth\|site.*team" apps/backend/src/common/utils/enforce-site-access.ts
```

**PASS 기준:** `scope.type === 'team'`에서 site 먼저 검증 후 team 검증 (팀⊂사이트 원칙).

```bash
# 컨트롤러에서 하드코딩된 에러 코드 잔존 여부 확인
grep -rn "CROSS_SITE\|CROSS_TEAM" apps/backend/src/modules --include="*.controller.ts"
```

**PASS 기준:** 0개 결과 (모든 컨트롤러가 `enforceSiteAccess()` 내부의 `ErrorCode.ScopeAccessDenied` 사용).

```bash
# enforceSiteAccess 호출 시 entityTeamId 전달 여부 확인 (컨트롤러 + 서비스)
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.ts" | grep -v "import\|__tests__"
```

**PASS 기준:** mutation 모듈(컨트롤러 또는 서비스)에서 `enforceSiteAccess()` 호출 시 가능하면 `entityTeamId`도 전달.

```typescript
// ❌ WRONG — 하드코딩 에러 코드 + 5-param 구식 시그니처
enforceSiteAccess(req, entitySite, EQUIPMENT_DATA_SCOPE, 'EQUIPMENT_CROSS_SITE_MUTATION_DENIED', entityTeamId);

// ❌ WRONG — 인라인 사이트 체크 (enforceSiteAccess 미사용)
if (scope.type === 'site' && equipment.site !== req.user.site) { throw new ForbiddenException(...); }

// ✅ CORRECT — 4-param 시그니처 + SSOT 에러 코드
enforceSiteAccess(req, entitySite, EQUIPMENT_DATA_SCOPE, entityTeamId);
```

### Step 10: 파일 업로드 보안 검증 (A03 Injection, A05 Security Misconfiguration)

파일 업로드 서비스가 SSOT 상수를 사용하여 MIME 타입, magic bytes, 파일 크기를 검증하는지 확인합니다.

```bash
# 10a: 백엔드 MIME 타입 허용 목록이 SSOT 참조인지 확인
grep -rn "ALLOWED_MIME_TYPES\|allowedMimeTypes" apps/backend/src/common/file-upload/ --include="*.ts"
```

**PASS 기준:** `ALLOWED_MIME_TYPES`가 `@equipment-management/shared-constants`에서 import되어 사용.

```bash
# 10b: magic bytes 검증이 SSOT 참조인지 확인
grep -rn "MIME_TO_MAGIC_BYTES\|validateMagicBytes" apps/backend/src/common/file-upload/ --include="*.ts"
```

**PASS 기준:** `MIME_TO_MAGIC_BYTES`가 import되어 `validateMagicBytes()`에서 사용.

```bash
# 10c: 파일 크기 제한이 SSOT 참조인지 확인
grep -rn "FILE_UPLOAD_LIMITS\|maxFileSize" apps/backend/src/common/file-upload/ --include="*.ts"
```

**PASS 기준:** `FILE_UPLOAD_LIMITS.MAX_FILE_SIZE`가 import되어 `maxFileSize`에 할당.

**FAIL 기준:** 하드코딩된 MIME 타입 배열, magic bytes 맵, 파일 크기 → SSOT 상수로 교체 필요.

## Output Format

```markdown
| OWASP | #   | 검사                        | 상태      | 상세                                       |
| ----- | --- | --------------------------- | --------- | ------------------------------------------ |
| A05   | 1   | Helmet CSP 프로덕션         | PASS/FAIL | scriptSrc 환경별 분리 여부                 |
| A05   | 2   | Next.js Security Headers    | PASS/FAIL | 누락된 헤더 목록                           |
| A01   | 3   | PermissionsGuard 모드       | PASS/FAIL | DENY 모드 설정 가능 여부                   |
| A01   | 4   | @Public() 남용              | PASS/FAIL | 상태 변경 엔드포인트 목록                  |
| A06   | 5   | pnpm audit + overrides      | PASS/FAIL | critical 0 + 프로덕션 high 미티게이션 여부 |
| A01   | 6   | JwtAuthGuard 글로벌 등록    | PASS/FAIL | APP_GUARD 등록 여부                        |
| A01   | 6a  | 클라이언트 userId 신뢰      | PASS/FAIL | dto.userId/body.userId 사용 금지           |
| A03   | 6b  | Raw SQL 인젝션              | PASS/FAIL | sql.raw() 사용자 입력 전달 여부            |
| A03   | 6c  | class-validator 잔존        | PASS/FAIL | Zod 전환 완료 여부                         |
| A07   | 6d  | 하드코딩 비밀번호           | PASS/FAIL | 폴백 패턴 제거 여부                        |
| A07   | 6e  | 토큰 수명                   | PASS/FAIL | ACCESS ≤ 1h, REFRESH ≤ 30d               |
| A07   | 6f  | 프로덕션 Azure AD 전용      | PASS/FAIL | 로컬 로그인 차단 여부                      |
| A08   | 6g  | CI 시크릿 스캔 + 프리커밋   | PASS/FAIL | gitleaks + husky 존재 여부                 |
| A08   | 6h  | 프로덕션 시크릿 강도        | PASS/FAIL | 32자+ 검증 여부                            |
| A09   | 6i  | 감사 로깅 커버리지          | PASS/FAIL | @AuditLog 누락 컨트롤러                    |
| A10   | 6j  | 타이밍 안전 API 키          | PASS/FAIL | timingSafeEqual 사용 여부                  |
| —     | 7   | @SiteScoped 데이터 격리     | PASS/FAIL | 누락 컨트롤러, bypassRoles 설정            |
| —     | 8   | CI 어노테이션 검증          | PASS/FAIL | 미어노테이션 엔드포인트 수                 |
| —     | 9   | Throttle Guard 등록         | PASS/FAIL | InternalApiThrottlerGuard 사용 여부        |
| —     | 10  | SSR X-Internal-Api-Key 헤더 | PASS/FAIL | 헤더 전송 코드 존재 여부                   |
| —     | 11  | enforceSiteAccess 팀 격리   | PASS/FAIL | entityTeamId 전달 여부                     |
| A03   | 12  | 파일 업로드 MIME/magic bytes| PASS/FAIL | SSOT 참조 여부 (ALLOWED_MIME_TYPES, MIME_TO_MAGIC_BYTES) |
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
11. **test-login/test-cache-clear의 `@Public()` + `@SkipPermissions()`** — 테스트 전용 엔드포인트 (프로덕션 미등록). `ALL_TEST_EMAILS` import 및 허용목록 검증 로직은 SSOT 준수
