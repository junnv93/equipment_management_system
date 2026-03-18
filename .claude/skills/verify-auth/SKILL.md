---
name: verify-auth
description: 서버 사이드 인증/인가 패턴 준수 여부를 검증합니다. 컨트롤러 엔드포인트 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 모듈명]'
---

# 서버 사이드 인증/인가 패턴 검증

## Purpose

백엔드 컨트롤러가 인증/인가 규칙을 올바르게 준수하는지 검증합니다:

1. **서버 사이드 userId 추출** — `req.user.userId`로 사용자 식별, Body에서 userId/approverId 수신 금지
2. **Permission Guard** — 변경(POST/PATCH/DELETE) 엔드포인트에 `@RequirePermissions()` 데코레이터 적용
3. **@AuditLog 데코레이터** — 상태 변경 엔드포인트에 감사 로그 데코레이터 적용
4. **@Public 데코레이터** — 인증 불필요 엔드포인트에만 사용

## When to Run

- 새로운 컨트롤러 엔드포인트를 추가한 후
- 승인/반려 로직을 수정한 후
- 권한 체계를 변경한 후
- 보안 관련 코드 리뷰 시

## Related Files

| File                                                                        | Purpose                                                          |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `apps/backend/src/modules/auth/auth.controller.ts`                          | Auth 컨트롤러                                                    |
| `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`                  | JWT 전략                                                         |
| `apps/backend/src/modules/auth/guards/permissions.guard.ts`                 | Permission Guard                                                 |
| `apps/backend/src/modules/auth/decorators/skip-permissions.decorator.ts`    | @SkipPermissions() 데코레이터                                    |
| `apps/backend/src/modules/auth/decorators/public.decorator.ts`              | @Public() 데코레이터 (인증 바이패스)                             |
| `apps/backend/src/modules/auth/decorators/permissions.decorator.ts`         | @RequirePermissions() 데코레이터                                 |
| `apps/backend/src/modules/auth/decorators/roles.decorator.ts`               | @Roles() 데코레이터 (역할 기반 접근 제어)                        |
| `apps/backend/src/common/decorators/audit-log.decorator.ts`                 | AuditLog 데코레이터                                              |
| `apps/backend/src/common/decorators/skip-audit.decorator.ts`                | @SkipAudit() 데코레이터                                          |
| `apps/backend/src/common/decorators/sse-authenticated.decorator.ts`         | SSE 인증 데코레이터 (SseJwtAuthGuard 연동)                       |
| `apps/backend/src/common/decorators/internal-service-only.decorator.ts`     | 내부 서비스 전용 데코레이터                                      |
| `apps/backend/src/common/guards/internal-api-key.guard.ts`                  | InternalApiKey Guard (서비스 간 인증)                            |
| `apps/backend/src/common/interceptors/audit.interceptor.ts`                 | AuditLog 인터셉터 (JwtUser 필드 접근)                            |
| `apps/backend/src/database/utils/uuid-constants.ts`                         | SYSTEM_USER_UUID (nil UUID) — 시스템 생성 감사 로그 actor 식별자 |
| `apps/backend/src/types/auth.ts`                                            | SSOT: JwtUser, AuthenticatedRequest 타입                         |
| `apps/backend/src/modules/auth/blacklist/token-blacklist.interface.ts`      | ITokenBlacklist 인터페이스 (Redis 전환 준비)                     |
| `apps/backend/src/modules/auth/blacklist/in-memory-blacklist.provider.ts`   | InMemoryBlacklistProvider (개발/테스트용)                        |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts`                | 참조 구현 (올바른 패턴)                                          |
| `apps/backend/src/modules/calibration/calibration.controller.ts`            | 참조 구현                                                        |
| `apps/backend/src/modules/non-conformances/non-conformances.controller.ts`  | 참조 구현                                                        |
| `apps/backend/src/modules/audit/audit.controller.ts`                        | 감사 로그 컨트롤러 (읽기 전용, @AuditLog 불필요)                 |
| `apps/backend/src/modules/settings/settings.controller.ts`                  | 설정 컨트롤러 (AuditLog entityIdPath 포함)                       |
| `apps/backend/src/modules/notifications/sse/notification-sse.controller.ts` | SSE 컨트롤러 (SseJwtAuthGuard 사용)                              |
| `apps/backend/src/common/metrics/metrics.controller.ts`                     | Prometheus 메트릭 컨트롤러 (@Public() + GET, src/common/ 레이어) |
| `packages/shared-constants/src/permissions.ts`                              | Permission enum 정의                                             |
| `apps/backend/src/common/utils/enforce-site-access.ts`                      | 크로스 사이트/팀 접근 제어 공유 유틸리티                         |

## Workflow

### Step 1: Body에서 userId/approverId 수신 금지

클라이언트 요청 Body에서 userId나 approverId를 받는 패턴을 탐지합니다.

```bash
# Body에서 userId/approverId 수신 패턴 탐지
grep -rn "approverId\|reviewerId\|userId" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "//\|Rule 2\|서버에서\|제외\|미포함"
```

**PASS 기준:** 상태 변경 DTO(approve-_, reject-_)에 approverId/userId 필드가 없어야 함.

**FAIL 기준:** DTO에 approverId/userId가 Zod schema 필드로 정의되어 있으면 위반.

```bash
# DTO의 Zod schema에서 approverId/userId 필드 정의 탐지
grep -rn "approverId:\|userId:" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep "z\.\|schema"
```

**위반:** Zod schema에 `approverId: z.string()` 등이 있으면 서버에서 추출하도록 변경 필요.

### Step 2: req.user.userId 서버 사이드 추출

승인/반려 컨트롤러 메서드에서 `@Request() req`를 통해 userId를 추출하는지 확인합니다.

```bash
# approve/reject 메서드에 @Request() req 사용 확인
grep -rn "approve\|reject" apps/backend/src --include="*.controller.ts" -A 3 | grep -E "@Request|req\.user"
```

**PASS 기준:** 모든 approve/reject 메서드에 `@Request() req: AuthenticatedRequest` 파라미터가 있어야 함.

### Step 3: @RequirePermissions 적용 확인

변경(POST/PATCH/DELETE) 엔드포인트에 Permission Guard가 적용되어 있는지 확인합니다.

```bash
# POST/PATCH/DELETE 엔드포인트 중 @RequirePermissions가 없는 것 탐지
grep -rn "@Post\|@Patch\|@Delete" apps/backend/src --include="*.controller.ts" -B 5 | grep -v "@RequirePermissions\|@Public\|@SkipPermissions\|test-login\|monitoring\|health\|metrics"
```

**PASS 기준:** 모든 변경 엔드포인트에 `@RequirePermissions()`, `@Public()`, 또는 `@SkipPermissions()` 데코레이터가 있어야 함.

**FAIL 기준:** 변경 엔드포인트에 세 데코레이터 모두 없으면 위반.

### Step 4: @AuditLog 데코레이터 확인

상태 변경 엔드포인트에 감사 로그가 기록되는지 확인합니다.

```bash
# approve/reject/delete 메서드에 @AuditLog 확인
grep -rn "approve\|reject\|delete\|dispose" apps/backend/src --include="*.controller.ts" -B 5 | grep -E "@AuditLog|async (approve|reject|delete|dispose)"
```

**PASS 기준:** 상태 변경 메서드에 `@AuditLog()` 데코레이터가 있어야 함.

### Step 5: JwtUser 필드 접근 패턴 확인 (인터셉터/서비스)

컨트롤러 외에 JwtUser를 직접 접근하는 파일(인터셉터, 서비스)이 SSOT 필드명(`userId`, `roles`)을 사용하는지 확인합니다.

```bash
# JwtUser 레거시 필드 접근 탐지 (user.id, user.role — 단수형은 레거시)
grep -rn "user\?\.id\b\|user\.id\b\|user\?\.role\b\|user\.role\b" apps/backend/src/common/interceptors --include="*.ts" apps/backend/src/modules --include="*.service.ts" | grep -v "userId\|roles\|teamId\|roleId\|// \|node_modules\|\.id ===\|\.id !=="
```

**PASS 기준:** 인터셉터/서비스에서 `user.userId` (SSOT), `user.roles` (배열) 사용.

**FAIL 기준:** `user.id` (레거시), `user.role` (단수형, JwtUser에 없음) 사용 시 위반.

**참고:** `types/auth.ts`의 `JwtUser` 인터페이스가 SSOT. `userId`는 JWT `sub` 클레임에서 추출, `roles`는 배열 타입.

```bash
# SSOT 확인: audit.interceptor.ts에서 올바른 필드 접근
grep -n "user\?\." apps/backend/src/common/interceptors/audit.interceptor.ts | head -10
```

**기대값:** `user?.userId`, `user?.roles?.[0]`, `user?.name` (SSOT 필드만 사용).

### Step 6: Permission import 소스 확인

Permission 값이 `@equipment-management/shared-constants`에서 import되는지 확인합니다.

```bash
# Permission import 소스 확인
grep -rn "import.*Permission" apps/backend/src --include="*.controller.ts" | grep -v "@equipment-management/shared-constants"
```

**PASS 기준:** 0개 결과 (모든 Permission은 shared-constants에서 import).

**FAIL 기준:** 로컬 정의 또는 다른 패키지에서 import하면 위반.

### Step 7: @SkipAudit() 올바른 사용 검증

`@SkipAudit()` 데코레이터가 POST/PATCH/DELETE 엔드포인트에 잘못 사용되지 않는지 확인합니다.

```bash
# @SkipAudit() 전체 사용 위치 확인
grep -rn "@SkipAudit" apps/backend/src --include="*.controller.ts"
```

```bash
# @SkipAudit() 근처에 POST/PATCH/DELETE가 있는 케이스 탐지 (위험 조합)
grep -rn "@SkipAudit" apps/backend/src --include="*.controller.ts" -A 10 | grep "@Post\|@Patch\|@Delete"
```

**PASS 기준:** 0개 결과 (POST/PATCH/DELETE 엔드포인트에 `@SkipAudit()` 사용 없음).

**FAIL 기준:** 상태 변경 엔드포인트에 `@SkipAudit()`이 사용되면 감사 로그 공백 발생 — 위반.

**수정 방법:** `@SkipAudit()`을 제거하거나, 불가피한 경우 코드 주석에 이유를 명시하고 Exceptions에 추가.

**Exceptions (허용 케이스):**

- GET 전용 엔드포인트의 `@SkipAudit()` — 읽기 작업은 감사 로그 불필요, 정상
- 내부 시스템 스케줄러가 호출하는 배치 엔드포인트 (단, `@InternalApiKeyGuard` 동반 시)
- `NotificationSseController`처럼 HTTP 상태가 없는 스트리밍 엔드포인트

### Step 8: SYSTEM_USER_UUID 사용 확인

감사 로그 생성 시 시스템 actor를 나타내는 UUID 컬럼에 문자열 리터럴을 직접 사용하지 않는지 확인합니다.

PostgreSQL `uuid` 타입 컬럼에 `'system'`, `'anonymous'` 같은 비-UUID 문자열을 삽입하면 INSERT가 조용히 실패합니다.

```bash
# UUID 컬럼에 'system'/'anonymous' 하드코딩 탐지 (audit 관련 파일)
grep -rn "userId:\s*['\"]system['\"]\\|userId:\s*['\"]anonymous['\"]\\|entityId:\s*['\"]system['\"]" \
  apps/backend/src --include="*.ts" | grep -v "//\|test\|spec"
```

**PASS 기준:** 0개 결과 (시스템 actor는 `SYSTEM_USER_UUID`에서 import).

**FAIL 기준:** UUID 컬럼에 `'system'`, `'anonymous'` 등 비-UUID 문자열 → INSERT 실패 (audit log 소실).

**올바른 패턴:**

```typescript
// ❌ WRONG — PostgreSQL uuid 컬럼에 비-UUID 삽입 → 조용한 INSERT 실패
await this.create({ userId: 'system', entityId: payload.email ?? 'unknown' });

// ✅ CORRECT — nil UUID (RFC 4122 표준) 사용
import { SYSTEM_USER_UUID } from '../../database/utils/uuid-constants';
await this.create({
  userId: SYSTEM_USER_UUID,
  entityId: SYSTEM_USER_UUID,
  entityName: payload.email,
});
```

### Step 9: AuthenticatedRequest 옵셔널 파라미터 탐지

컨트롤러에서 `req?: AuthenticatedRequest` 또는 `req!.user`와 같은 옵셔널/non-null assertion 패턴을 탐지합니다.
JwtAuthGuard가 글로벌 적용되므로 `req`는 항상 존재하며, 옵셔널 처리는 타입 안전성을 약화시킵니다.

```bash
# 옵셔널 req 파라미터 탐지
grep -rn "req?:\s*AuthenticatedRequest\|req!\.user\|req?\." apps/backend/src --include="*.controller.ts" | grep -v "//\|test\|spec"
```

**PASS 기준:** 0개 결과 (모든 컨트롤러에서 `req: AuthenticatedRequest` 사용).

**FAIL 기준:** `req?:` 옵셔널 또는 `req!.` non-null assertion 사용 시 위반.

```typescript
// ❌ WRONG — 옵셔널 req (JwtAuthGuard가 보장하므로 불필요)
async create(@Request() req?: AuthenticatedRequest) {
  const userId = req?.user?.userId; // 항상 undefined 가능
}

// ❌ WRONG — non-null assertion (타입 안전성 위반)
async create(@Request() req: AuthenticatedRequest) {
  const userId = req!.user.userId;
}

// ✅ CORRECT — 비옵셔널 req
async create(@Request() req: AuthenticatedRequest) {
  const userId = req.user?.userId; // user는 ?. 허용 (Guard 내 payload 파싱)
}
```

### Step 10: enforceSiteAccess() 뮤테이션 엔드포인트 적용 확인

크로스 사이트 데이터 변경을 방지하기 위해 mutation 엔드포인트에서 `enforceSiteAccess()`를 호출하는지 확인합니다.
**참고:** 컨트롤러에서 직접 호출하거나, 서비스 내부에서 호출하는 두 가지 패턴 모두 허용됩니다.

```bash
# enforceSiteAccess 사용 현황 확인 (컨트롤러 + 서비스 모두 포함)
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.ts" | grep -v "import\|__tests__"
```

```bash
# enforceSiteAccess import 소스 확인 (SSOT: common/utils)
grep -rn "import.*enforceSiteAccess" apps/backend/src --include="*.ts" | grep -v "common/utils"
```

**PASS 기준:** `enforceSiteAccess`가 `common/utils`에서 import되고, 주요 mutation 모듈(컨트롤러 또는 서비스)에서 사용됨.

**FAIL 기준:** mutation 엔드포인트에서 사이트 접근 제어 없이 다른 사이트 데이터 변경 가능.

```bash
# 구식 시그니처 (5-param) 또는 하드코딩 에러 코드 잔존 확인
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.ts" | grep "CROSS_SITE\|CROSS_TEAM\|DENIED"
```

**PASS 기준:** 0개 결과 (4-param 시그니처: `req, entitySite, policy, entityTeamId?`).

**FAIL 기준:** 하드코딩 에러 코드 문자열이 인자로 전달되면 구식 시그니처 사용 — `errorCode` 인자 제거 필요.

```bash
# 인라인 사이트 체크 중복 구현 탐지 (enforceSiteAccess 대신 직접 구현)
grep -rn "scope.type.*===.*site.*entitySite\|equipment.*\.site.*!==.*req" apps/backend/src/modules --include="*.ts" | grep -v "// \|__tests__"
```

**PASS 기준:** 0개 결과 (모든 사이트 체크가 `enforceSiteAccess()` 유틸리티를 통해 수행).

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

1. **AuthController의 login/test-login** — 인증 전이므로 `@Public()` 사용이 정상
2. **MonitoringController의 health check** — `@Public()` 사용이 정상 (인증 불필요)
3. **MetricsController (`src/common/metrics/`)** — Prometheus 스크래핑을 위한 `@Public()` + `@Get()` 사용이 정상. 외부 접근은 monitoring-network 격리 + Nginx 프록시로 차단되므로 인증 불필요. `src/modules/`가 아닌 `src/common/` 레이어에 위치하는 인프라 컨트롤러
4. **GET 엔드포인트** — 읽기 전용이므로 `@RequirePermissions` 필수 아님 (단, JwtAuthGuard는 글로벌 적용)
5. **DTO의 주석 내 userId 언급** — 코드가 아닌 문서화 목적의 주석은 위반 아님
6. **DashboardController** — 통계 조회용 GET 엔드포인트는 Permission Guard 필수 아님
7. **NotificationSseController** — SSE 연결은 `SseJwtAuthGuard`로 Authorization 헤더(Bearer 토큰) 우선 인증, EventSource 호환을 위한 query param(`?token=`) 폴백 지원. 표준 글로벌 JwtAuthGuard와 다른 별도 가드 사용이 정상
8. **SettingsController의 GET 엔드포인트** — 설정 조회는 읽기 전용이므로 AuditLog 불필요
9. **AuditController** — 읽기 전용 컨트롤러 (GET만 존재). 메서드별 `@RequirePermissions(Permission.VIEW_AUDIT_LOGS)` 사용이 정상. @AuditLog 불필요 (감사 로그 조회에 감사 로그 불필요)
10. **UsersController의 `@SkipPermissions()` PATCH** — `updateMyPreferences()`는 로그인한 사용자 본인의 설정만 변경하므로 `@SkipPermissions()` + PATCH 조합이 정상. `findAll()`, `findOne()`의 `@SkipPermissions()` + GET도 드롭다운/승인 워크플로에서 모든 역할이 사용자 목록 조회가 필요하므로 정상
