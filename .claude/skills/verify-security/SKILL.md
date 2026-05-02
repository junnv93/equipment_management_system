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
| `apps/frontend/proxy.ts` | CSP nonce SSOT (per-request nonce + strict-dynamic) |
| `apps/backend/src/modules/security/security.controller.ts` | CSP violation report 수집 |
| `apps/backend/src/common/config/throttle.constants.ts` | Named throttler 설정 + `throttleAllNamed()` |
| `apps/frontend/next.config.js` | 정적 보안 헤더 (CSP는 proxy.ts로 이관됨) |
| `apps/backend/src/modules/auth/guards/permissions.guard.ts` | PermissionsGuard |
| `apps/backend/src/modules/auth/decorators/public.decorator.ts` | @Public() 데코레이터 |
| `apps/backend/src/common/guards/internal-api-key.guard.ts` | InternalApiKey Guard |
| `apps/backend/src/common/guards/internal-api-throttler.guard.ts` | InternalApiThrottlerGuard |
| `apps/frontend/lib/api/server-api-client.ts` | Server Component API 클라이언트 |
| `apps/backend/src/common/decorators/site-scoped.decorator.ts` | @SiteScoped() 데코레이터 |
| `apps/backend/src/common/interceptors/site-scope.interceptor.ts` | SiteScopeInterceptor |
| `apps/backend/src/common/utils/enforce-site-access.ts` | 크로스 사이트/팀 접근 제어 |
| `apps/backend/src/common/constants/security-auditable-codes.ts` | SECURITY_AUDITABLE_CODES SSOT |
| `apps/backend/src/common/utils/audit-entity-id.util.ts` | audit 엔티티 ID 추출 유틸 |
| `apps/backend/src/common/filters/error.filter.ts` | GlobalExceptionFilter (APP_FILTER DI) |

## Workflow

각 Step의 bash 명령어, 코드 예시: [references/step-details.md](references/step-details.md) 참조

### Step 1: CSP nonce SSOT (proxy.ts)

**PASS:** `proxy.ts`가 `API_ENDPOINTS.SECURITY.CSP_REPORT` SSOT 경로 사용, `buildCspHeader(nonce, isDev, ...)` 환경별 분기, prod에서 `'unsafe-eval'` 없음, `connect-src` dev에서만 `ws: wss:` 허용.
**FAIL:** 하드코딩된 CSP report 경로, prod에서 `unsafe-eval`, dev/prod 분기 없는 `connect-src`.

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

### Step 11: ExportDataService deny-by-default 스코프 가드 (2026-04-21 추가)

스코프 필터(`EnforcedScope.site` or `teamId`)가 활성화된 ExportDataService에서
빈 items 배열에서 `some()`이 false를 반환해 검증이 스킵되는 패턴 탐지.

**11a: scopeActive && items.length === 0 가드 존재 확인**
```bash
grep -rn "scopeActive.*items.length\|items.length.*scopeActive" \
  apps/backend/src --include="*-export-data.service.ts"
# 결과: scope filter를 items.some()으로 검증하는 서비스 전부 가드 있어야 함
```

**11b: export-data 서비스에서 some() 전 빈 배열 가드 누락 패턴 탐지**
```bash
grep -rn "items\.some\|filter\.site.*some\|some.*filter\.site" \
  apps/backend/src --include="*-export-data.service.ts"
# 결과: some() 사용 파일마다 items.length === 0 가드 선행 여부 수동 확인
```

**PASS:** some() 사용 서비스 전부 빈 배열 deny-by-default 가드 보유. **FAIL:** 가드 없이 some() 직접 사용.

### Step 12: server-only 설정 파일 빌드타임 경계 (2026-04-29 추가)

서버 전용 설정 파일(`api-config.server.ts` 등)에 `import 'server-only'`가 선언되어 있어야 하며,
Client Component 파일에서 해당 파일을 import해선 안 된다.

```bash
# server-only import 선언 확인
grep -n "import 'server-only'" apps/frontend/lib/config/api-config.server.ts

# Client Component에서 api-config.server import 0건
grep -rn "api-config\.server" apps/frontend/components apps/frontend/app \
  --include="*.tsx" --include="*.ts" \
  | grep -v "api-config\.server\.ts"
```

**PASS:** `import 'server-only'` 선언 존재 + Client 파일 import 0건. **FAIL:** 미선언 또는 Client import ≥1건.

### Step 13: GlobalExceptionFilter APP_FILTER DI 등록 (2026-05-02 추가)

`GlobalExceptionFilter`는 `main.ts`의 `useGlobalFilters(new ...)` 직접 등록이 아닌
`APP_FILTER` 프로바이더(DI 컨테이너)로 등록해야 한다. 직접 등록 시 `AuditService` 등 DI 의존성 주입 불가.

```bash
# main.ts에 useGlobalFilters(GlobalExceptionFilter) 없어야 함 (0건 = PASS)
grep -n "useGlobalFilters.*GlobalExceptionFilter\|new GlobalExceptionFilter" \
  apps/backend/src/main.ts

# app.module.ts에 APP_FILTER provider 등록 확인
grep -n "APP_FILTER\|GlobalExceptionFilter" apps/backend/src/app.module.ts
```

**PASS:** `main.ts` 0건 + `app.module.ts`에 `APP_FILTER` + `GlobalExceptionFilter` 확인.
**FAIL:** `main.ts`에 `useGlobalFilters(new GlobalExceptionFilter())` 잔존.

### Step 14: SECURITY_AUDITABLE_CODES SSOT 로컬 재정의 금지 (2026-05-02 추가)

`GlobalExceptionFilter`와 `AuditInterceptor`가 공유하는 보안 감사 대상 `ErrorCode` 집합은
`security-auditable-codes.ts`에서만 정의되어야 한다. 각 파일에서 로컬 `new Set<ErrorCode>` 재정의 시 드리프트 위험.

```bash
# security-auditable-codes.ts 외 로컬 Set<ErrorCode> 재정의 탐지 (0건 = PASS)
grep -rn "new Set<ErrorCode>\|new Set(\[ErrorCode" \
  apps/backend/src/common/ --include="*.ts" \
  | grep -v "security-auditable-codes\.ts" | grep -v "spec\.ts"

# SECURITY_AUDITABLE_CODES는 단 1곳에서만 export (소스 일관성)
grep -rn "export.*SECURITY_AUDITABLE_CODES" apps/backend/src/ --include="*.ts"

# filter와 interceptor 모두 import 확인
grep -rn "SECURITY_AUDITABLE_CODES" apps/backend/src/common/ --include="*.ts" \
  | grep -v "spec\.ts"
```

**PASS:** 로컬 `new Set<ErrorCode>` 0건 + filter/interceptor 양쪽 import 확인.
**FAIL:** `security-auditable-codes.ts` 외에 `new Set<ErrorCode>` 재정의 ≥1건.

### Step 15: scope/소유권 위반 ErrorCode → HTTP 403 + SECURITY_AUDITABLE_CODES 등록 (2026-05-02 추가)

소유권 위반(`*WithdrawNotSubmitter`, `*OnlyRequesterCanCancel`)은 유효성 오류(400)가 아닌
권한 위반(403)이다. service 레이어에서 `BadRequestException`으로 던지면 HTTP 의미론 위반 +
감사 로그 누락 이중 gap 발생 (2026-05-02 intermediate/self/equipment-import 3건 수정 사례).

```bash
# 소유권/scope 위반 ErrorCode가 BadRequestException으로 throw되는 케이스 탐지 (0건 = PASS)
# 패턴: *NotSubmitter, *OnlyRequesterCan, *OnlyXxxCan naming의 scope 코드
grep -rn "throw new BadRequestException" apps/backend/src/modules --include="*.service.ts" -A5 \
  | grep -E "NotSubmitter|OnlyRequesterCan|OnlyXxxCan"

# scope 위반 코드가 errorCodeToStatusCode에서 403 외 다른 값으로 매핑됐는지 탐지
# (NotSubmitter/OnlyRequesterCanCancel 패턴 코드 라인이 403 포함 여부 교차 확인)
python3 -c "
import re
with open('packages/schemas/src/errors.ts') as f:
    content = f.read()
# errorCodeToStatusCode 블록 추출
block_match = re.search(r'errorCodeToStatusCode[^{]*{(.+?)^}', content, re.DOTALL | re.MULTILINE)
if block_match:
    block = block_match.group(1)
    for line in block.splitlines():
        if re.search(r'NotSubmitter|OnlyRequesterCan', line) and '403' not in line:
            print('FAIL (non-403):', line.strip())
" 2>/dev/null || echo "(python3 없으면 수동 검토)"

# SECURITY_AUDITABLE_CODES에 scope 위반 코드 등록 여부 확인
grep -n "NotSubmitter\|OnlyRequesterCanCancel" \
  apps/backend/src/common/constants/security-auditable-codes.ts
```

**PASS:** service `BadRequestException` scope throw 0건 + 모든 scope 코드 403 매핑 + `SECURITY_AUDITABLE_CODES` 등록 확인.
**FAIL:** `BadRequestException`으로 scope 위반 throw ≥1건 OR 403 매핑 누락 OR `SECURITY_AUDITABLE_CODES` 미등록.

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
| 11  | ExportDataService deny-by-default | PASS/FAIL | items.some() 전 빈 배열 가드 누락 서비스   |
| 12  | server-only 빌드타임 경계          | PASS/FAIL | api-config.server.ts import 'server-only' + Client import 0건 |
| 13  | GlobalExceptionFilter APP_FILTER DI | PASS/FAIL | main.ts 직접 등록 0건 + app.module.ts APP_FILTER 등록 |
| 14  | SECURITY_AUDITABLE_CODES SSOT      | PASS/FAIL | 로컬 new Set<ErrorCode> 재정의 0건 |
| 15  | scope 위반 ErrorCode 403 + 감사 등록 | PASS/FAIL | BadRequestException scope throw 0건 + 403 매핑 + SECURITY_AUDITABLE_CODES 등록 |
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
12. **UsersController의 `POST/DELETE me/signature`** — `@SkipPermissions()` 사용하나 `req.user.userId`로 본인만 변경, MIME 타입(PNG/JPEG) + 2MB 크기 제한 적용
13. **SecurityController의 `POST csp-report`** — `@Public()` + `@Post` 정상. CSP violation은 브라우저가 인증 없이 전송. `throttleAllNamed(THROTTLE_PRESETS.CSP_REPORT)`로 rate limit 적용
14. **forge-handover-token의 `@Public()` + `@Post`** — TestAuthController 자체가 dev/test에서만 등록 + endpoint-level NODE_ENV 이중 가드
13. **FilesController의 `GET /api/files/:subdir/:filename`** — `@SkipPermissions()` 사용하나 전역 JwtAuthGuard로 인증 보장 (미인증 401). 특정 권한 불필요, 인증된 사용자 전체 허용이 의도적 설계. Path traversal 방지(`safeSubdir`/`safeFilename`) 적용.
