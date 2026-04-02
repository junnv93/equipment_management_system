# 서버 사이드 인증/인가 검증 상세 체크리스트

## Step 1: Body에서 userId/approverId 수신 금지

```bash
# Body에서 userId/approverId 수신 패턴 탐지
grep -rn "approverId\|reviewerId\|userId" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "//\|Rule 2\|서버에서\|제외\|미포함"
```

**PASS 기준:** 상태 변경 DTO(approve-*, reject-*)에 approverId/userId 필드가 없어야 함.

```bash
# DTO의 Zod schema에서 approverId/userId 필드 정의 탐지
grep -rn "approverId:\|userId:" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep "z\.\|schema"
```

**위반:** Zod schema에 `approverId: z.string()` 등이 있으면 서버에서 추출하도록 변경 필요.

## Step 2: req.user.userId 서버 사이드 추출

```bash
# approve/reject 메서드에 @Request() req 사용 확인
grep -rn "approve\|reject" apps/backend/src --include="*.controller.ts" -A 3 | grep -E "@Request|req\.user"
```

**PASS 기준:** 모든 approve/reject 메서드에 `@Request() req: AuthenticatedRequest` 파라미터가 있어야 함.

## Step 3: @RequirePermissions 적용 확인

```bash
# POST/PATCH/DELETE 엔드포인트 중 @RequirePermissions가 없는 것 탐지
grep -rn "@Post\|@Patch\|@Delete" apps/backend/src --include="*.controller.ts" -B 5 | grep -v "@RequirePermissions\|@Public\|@SkipPermissions\|test-login\|monitoring\|health\|metrics"
```

**PASS 기준:** 모든 변경 엔드포인트에 `@RequirePermissions()`, `@Public()`, 또는 `@SkipPermissions()` 데코레이터가 있어야 함.

## Step 4: @AuditLog 데코레이터 확인

```bash
# approve/reject/delete 메서드에 @AuditLog 확인
grep -rn "approve\|reject\|delete\|dispose" apps/backend/src --include="*.controller.ts" -B 5 | grep -E "@AuditLog|async (approve|reject|delete|dispose)"
```

**PASS 기준:** 상태 변경 메서드에 `@AuditLog()` 데코레이터가 있어야 함.

## Step 5: JwtUser 필드 접근 패턴 확인 (인터셉터/서비스)

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

## Step 6: Permission import 소스 확인

> **참고:** `verify-ssot` Step 2가 전체 파일에서 Permission import 소스를 검사합니다.
> 이 Step은 컨트롤러에 집중하여 인가 관점에서 빠르게 확인하는 보완 검사입니다.

```bash
# Permission import 소스 확인 (컨트롤러 한정)
grep -rn "import.*Permission" apps/backend/src --include="*.controller.ts" | grep -v "@equipment-management/shared-constants"
```

**PASS 기준:** 0개 결과 (모든 Permission은 shared-constants에서 import).

## Step 7: @SkipAudit() 올바른 사용 검증

```bash
# @SkipAudit() 전체 사용 위치 확인
grep -rn "@SkipAudit" apps/backend/src --include="*.controller.ts"
```

```bash
# @SkipAudit() 근처에 POST/PATCH/DELETE가 있는 케이스 탐지 (위험 조합)
grep -rn "@SkipAudit" apps/backend/src --include="*.controller.ts" -A 10 | grep "@Post\|@Patch\|@Delete"
```

**PASS 기준:** 0개 결과 (POST/PATCH/DELETE 엔드포인트에 `@SkipAudit()` 사용 없음).

**Exceptions (허용 케이스):**

- GET 전용 엔드포인트의 `@SkipAudit()` — 읽기 작업은 감사 로그 불필요, 정상
- 내부 시스템 스케줄러가 호출하는 배치 엔드포인트 (단, `@InternalApiKeyGuard` 동반 시)
- `NotificationSseController`처럼 HTTP 상태가 없는 스트리밍 엔드포인트

## Step 8: SYSTEM_USER_UUID 사용 확인

```bash
# UUID 컬럼에 'system'/'anonymous' 하드코딩 탐지 (audit 관련 파일)
grep -rn "userId:\s*['\"]system['\"]\\|userId:\s*['\"]anonymous['\"]\\|entityId:\s*['\"]system['\"]" \
  apps/backend/src --include="*.ts" | grep -v "//\|test\|spec"
```

**PASS 기준:** 0개 결과 (시스템 actor는 `SYSTEM_USER_UUID`에서 import).

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

## Step 9: AuthenticatedRequest 옵셔널 파라미터 탐지

```bash
# 옵셔널 req 파라미터 탐지
grep -rn "req?:\s*AuthenticatedRequest\|req!\.user\|req?\." apps/backend/src --include="*.controller.ts" | grep -v "//\|test\|spec"
```

**PASS 기준:** 0개 결과 (모든 컨트롤러에서 `req: AuthenticatedRequest` 사용).

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

## Step 10: enforceSiteAccess() 뮤테이션 엔드포인트 적용 확인

```bash
# enforceSiteAccess 사용 현황 확인 (컨트롤러 + 서비스 모두 포함)
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.ts" | grep -v "import\|__tests__"
```

```bash
# enforceSiteAccess import 소스 확인 (SSOT: common/utils)
grep -rn "import.*enforceSiteAccess" apps/backend/src --include="*.ts" | grep -v "common/utils"
```

**PASS 기준:** `enforceSiteAccess`가 `common/utils`에서 import되고, 주요 mutation 모듈에서 사용됨.

```bash
# 구식 시그니처 (5-param) 또는 하드코딩 에러 코드 잔존 확인
grep -rn "enforceSiteAccess" apps/backend/src/modules --include="*.ts" | grep "CROSS_SITE\|CROSS_TEAM\|DENIED"
```

**PASS 기준:** 0개 결과 (4-param 시그니처: `req, entitySite, policy, entityTeamId?`).

```bash
# 인라인 사이트 체크 중복 구현 탐지 (enforceSiteAccess 대신 직접 구현)
grep -rn "scope.type.*===.*site.*entitySite\|equipment.*\.site.*!==.*req" apps/backend/src/modules --include="*.ts" | grep -v "// \|__tests__"
```

**PASS 기준:** 0개 결과 (모든 사이트 체크가 `enforceSiteAccess()` 유틸리티를 통해 수행).
