# 보안 설정 검증 — Step 상세

## Step 1: Helmet CSP 프로덕션 강화

```bash
grep -n "scriptSrc\|unsafe-inline\|unsafe-eval\|isProduction" apps/backend/src/common/middleware/helmet-config.ts
```

PASS: `scriptSrc`가 환경별 분리, 프로덕션 `["'self'"]`만.

## Step 2: Next.js Security Headers

```bash
grep -n "X-Frame-Options\|X-Content-Type-Options\|Referrer-Policy\|Permissions-Policy\|Strict-Transport-Security\|X-DNS-Prefetch-Control" apps/frontend/next.config.js
```

필수 6개 헤더: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-DNS-Prefetch-Control: on`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, `Strict-Transport-Security: max-age=31536000; includeSubDomains`.

## Step 3: PermissionsGuard DENY 모드

```bash
grep -n "PERMISSIONS_GUARD_MODE\|mode.*AUDIT\|mode.*DENY" apps/backend/src/modules/auth/guards/permissions.guard.ts
```

```bash
grep -n "PERMISSIONS_GUARD_MODE" .env.example .env 2>/dev/null
```

## Step 4: @Public() 남용

```bash
grep -rn "@Public()" apps/backend/src --include="*.controller.ts"
```

```bash
grep -rn "@Public()" apps/backend/src --include="*.controller.ts" -A 10 | grep "@Post\|@Patch\|@Delete"
```

PASS: `@Public()` + `@Post/@Patch/@Delete` 조합 0개 (test-login 제외).

## Step 5: pnpm audit + pnpm.overrides

```bash
pnpm audit --audit-level=high 2>&1 | tail -20
```

```bash
grep -A 20 '"pnpm"' package.json | grep -A 10 '"overrides"'
```

FAIL 시 수정: `package.json`의 `pnpm.overrides`에 최소 버전 강제 → `pnpm install`.

## Step 6: @SiteScoped 데이터 격리

```bash
grep -rn "@SiteScoped\|SiteScopeInterceptor" apps/backend/src --include="*.controller.ts"
```

```bash
grep -rn "@UseInterceptors.*SiteScopeInterceptor\|SiteScoped" apps/backend/src --include="*.controller.ts" | head -10
```

```bash
grep -rn "@SiteScoped" apps/backend/src --include="*.controller.ts" -A 1 | grep "bypassRoles\|lab_manager\|system_admin" | head -5
```

### Step 6b: Implicit Site Filtering

```bash
for f in $(grep -rln "req\.user\.site\|req\.user\?.site" apps/backend/src/modules --include="*.controller.ts"); do
  if ! grep -q "@SiteScoped\|@UseInterceptors.*SiteScopeInterceptor" "$f"; then
    echo "IMPLICIT: $f"
  fi
done
```

```typescript
// ❌ WRONG — implicit site filtering
@Get('stats')
async getStats(@Request() req: AuthenticatedRequest) {
  return this.service.getStats(req.user.site);
}

// ✅ CORRECT — declarative site scoping
@SiteScoped()
@Get('stats')
async getStats(@Request() req: AuthenticatedRequest) {
  return this.service.getStats(req.query.site);
}
```

참고: DashboardController, ApprovalsController, AuditController가 현재 implicit 패턴 사용 중.

## Step 7: 엔드포인트 보안 데코레이터

```bash
grep -rn "@Get\|@Post\|@Patch\|@Put\|@Delete" apps/backend/src/**/*.controller.ts | wc -l
grep -rn "@RequirePermissions\|@Public\|@SkipPermissions" apps/backend/src/**/*.controller.ts | wc -l
```

각 엔드포인트는 `@RequirePermissions(...)`, `@SkipPermissions()`, `@Public()` 중 하나 필수.

## Step 8: Throttle Guard

```bash
grep -n "ThrottlerGuard" apps/backend/src/app.module.ts
```

PASS: `InternalApiThrottlerGuard`가 `APP_GUARD`로 등록.

```bash
grep -n "shouldSkip\|x-internal-api-key\|validInternalKeys" apps/backend/src/common/guards/internal-api-throttler.guard.ts
```

## Step 9: SSR X-Internal-Api-Key 헤더

```bash
grep -n "X-Internal-Api-Key\|INTERNAL_API_KEY\|x-internal-api-key" apps/frontend/lib/api/server-api-client.ts
```

```bash
grep -n "INTERNAL_API_KEY" apps/frontend/.env.local 2>/dev/null || echo "MISSING"
```

## Step 10: enforceSiteAccess 아키텍처

```bash
grep -n "export function enforceSiteAccess" apps/backend/src/common/utils/enforce-site-access.ts
```

4-param 시그니처 확인: `enforceSiteAccess(req, entitySite, policy, entityTeamId?)`.

```bash
grep -n "ErrorCode.ScopeAccessDenied\|code: ErrorCode" apps/backend/src/common/utils/enforce-site-access.ts
```

```bash
grep -n "scope.type.*none\|fail-close" apps/backend/src/common/utils/enforce-site-access.ts
```

```bash
grep -rn "CROSS_SITE\|CROSS_TEAM" apps/backend/src/modules --include="*.controller.ts"
```

```bash
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.ts" | grep -v "import\|__tests__"
```

```typescript
// ❌ WRONG — 5-param 구식 시그니처
enforceSiteAccess(req, entitySite, EQUIPMENT_DATA_SCOPE, 'EQUIPMENT_CROSS_SITE_MUTATION_DENIED', entityTeamId);

// ✅ CORRECT — 4-param + SSOT 에러 코드
enforceSiteAccess(req, entitySite, EQUIPMENT_DATA_SCOPE, entityTeamId);
```
