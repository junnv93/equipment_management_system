# 하드코딩 값 탐지 — Step 상세

## Step 1: 하드코딩된 API 경로

```bash
grep -rn "'/api/" apps/frontend/lib/api --include="*.ts" | grep -v "API_ENDPOINTS\|baseURL\|// \|test\|mock"
```

## Step 2: queryKeys 팩토리 사용

```bash
grep -rn "queryKey:\s*\['" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "query-config\|queryKeys\|// "
```

## Step 3: Promise<unknown> 반환 타입

```bash
grep -rn "): Promise<unknown>" apps/backend/src/modules --include="*.service.ts" | grep -v "//\|spec\|test"
```

```typescript
// ❌ WRONG
async findOne(uuid: string): Promise<unknown> { ... }

// ✅ CORRECT
async findOne(uuid: string): Promise<CalibrationPlanDetail> { ... }
```

## Step 4: Frontend 환경변수 직접 참조

```bash
grep -rn "process\.env\.NEXT_PUBLIC_API_URL" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "api-config.ts\|node_modules\|tests/e2e\|// "
```

### Step 4b: E2E 테스트 Backend URL SSOT

```bash
grep -rn "process\.env\.NEXT_PUBLIC_API_URL" apps/frontend/tests/e2e --include="*.ts" --include="*.tsx" | grep -v "shared-test-data.ts\|node_modules\|// "
```

## Step 5: 인증 토큰 TTL 하드코딩

```bash
grep -rn "expiresIn.*['\"]15m['\"]\\|expiresIn.*['\"]7d['\"]\\|30 \\* 24 \\* 60 \\* 60[^*]\\|15 \\* 60[^*]\\|7 \\* 24 \\* 60 \\* 60[^*]" \
  apps/frontend/lib/auth.ts apps/frontend/lib/auth \
  apps/backend/src/modules/auth \
  --include="*.ts" \
  | grep -v "LOCK_DURATION\\|ATTEMPT_WINDOW\\|shared-constants\\|auth-token\\.ts\\|// "
```

```bash
grep -rn "ABSOLUTE_SESSION_MAX_AGE\s*=\|accessTokenExpiresInSeconds\s*=" \
  apps/frontend apps/backend/src \
  --include="*.ts" \
  | grep -v "shared-constants\\|auth-token\\.ts\\|import\\|// "
```

SSOT 상수: `ACCESS_TOKEN_TTL_SECONDS` (900s), `REFRESH_TOKEN_TTL_SECONDS` (604800s), `ABSOLUTE_SESSION_MAX_AGE_SECONDS` (2592000s), `ACCESS_TOKEN_EXPIRES_IN` ('900s').

## Step 6: SITE_VALUES 로컬 재정의

```bash
grep -rn "Site\[\]\s*=\s*\[" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// "
```

## Step 7: PAGE_SIZE_OPTIONS 로컬 재정의

```bash
grep -rn "const PAGE_SIZE_OPTIONS\s*[=:]" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "pagination\.ts\|node_modules\|// "
```

## Step 8: CACHE_KEY_PREFIXES SSOT

```bash
grep -rn "'equipment:\|'checkouts:\|'calibration:\|'calibration-plans:\|'dashboard:\|'disposal-requests:\|'equipment-imports:\|'software:\|'non-conformances:\|'audit-logs:\|'notification:\|'actor:name:\|'approvals:\|'settings:\|'user_active:\|'reports:\|'documents:" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" --include="*.ts" | grep -v "CACHE_KEY_PREFIXES\|cache-key-prefixes\|// \|spec\|test\|__tests__"
```

```bash
grep -rn "'equipment:\|'checkouts:\|'calibration:\|'dashboard:\|'disposal-requests:\|'equipment-imports:" apps/backend/src/common/cache/cache-invalidation.helper.ts | grep -v "CACHE_KEY_PREFIXES\|// "
```

```bash
grep -rn "'checkout:\|'calibration:\|'disposal-requests:\|'equipment-imports:" apps/backend/src/common/cache/cache-event.registry.ts | grep -v "CACHE_KEY_PREFIXES\|// "
```

## Step 9: APPROVAL_KPI 임계값

```bash
grep -rn "URGENT_THRESHOLD_DAYS\s*=\|WARNING_THRESHOLD_DAYS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|approval-kpi\.ts\|// "
```

### Step 9b: 리포트 상수 (REPORT_CONSTANTS)

```bash
grep -rn "\.limit(10[_0]*00)\|* 8[^0-9]\|\.slice(0, [0-9])" apps/backend/src/modules/reports --include="*.ts" | grep -v "REPORT_CONSTANTS\|REPORT_EXPORT_ROW_LIMIT\|node_modules\|// "
```

## Step 10: ErrorCode ↔ 프론트엔드 매핑 완전성

```bash
grep -n "= '" packages/schemas/src/errors.ts | grep -v "// "
```

```bash
grep -n "ErrorCode\.\|: EquipmentErrorCode\." apps/frontend/lib/errors/equipment-errors.ts | head -30
```

## Step 11: DTO→Entity 동적 매핑 (getTableColumns)

```bash
grep -n "getTableColumns\|EQUIPMENT_COLUMNS" apps/backend/src/modules/equipment/equipment.service.ts
```

```bash
grep -n "const fields.*Array.*keyof" apps/backend/src/modules/equipment/equipment.service.ts
```

## Step 12: requestData 직렬화 코덱

```bash
grep -n "JSON\.\(parse\|stringify\)" apps/backend/src/modules/equipment/services/equipment-approval.service.ts
```

## Step 13: DTO 하드코딩 검증 메시지 (VM SSOT)

```bash
grep -rn "z\.\(string\|number\|array\|enum\).*['\"].*[가-힣]" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "VM\.\|// \|describe\|test"
```

```bash
grep -rn "message:\s*['\"][^'\"]*[가-힣]" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "VM\.\|// "
```

```bash
grep -rn "\.int(['\"].*[가-힣]\|\.positive(['\"].*[가-힣]\|\.min([0-9]*,\s*['\"].*[가-힣]\|\.max([0-9]*,\s*['\"].*[가-힣]\|\.uuid(['\"].*[가-힣]" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "VM\.\|// "
```

```typescript
// ❌ WRONG
z.string().uuid('유효한 장비 UUID가 아닙니다')

// ✅ CORRECT
import { VM } from '@equipment-management/schemas';
z.string().uuid(VM.uuid.invalid('장비'))
```

### Step 13b: Test User Email SSOT

```bash
grep -rn "'test\.engineer@example\.com'\|'tech\.manager@example\.com'" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "shared-test-data\.ts\|test-users\.ts\|import\|// "
```

## Step 14: CALIBRATION_THRESHOLDS 하드코딩

```bash
grep -rn "addDaysUtc.*[^A-Z_]30[^0-9]\|days.*=\s*30[^0-9]\|days:\s*30[^0-9]" \
  apps/backend/src/modules/calibration apps/frontend/components/calibration apps/frontend/app/\(dashboard\)/calibration \
  --include="*.ts" --include="*.tsx" \
  | grep -v "CALIBRATION_THRESHOLDS\|business-rules\|// \|spec\|test\|\.plan\."
```

```bash
grep -rn "<=\s*7[^0-9]\|<\s*7[^0-9]\|days.*7[^0-9]" \
  apps/backend/src/modules/calibration apps/frontend/components/calibration \
  --include="*.ts" --include="*.tsx" \
  | grep -v "CALIBRATION_THRESHOLDS\|business-rules\|// \|spec\|test"
```

SSOT: `CALIBRATION_THRESHOLDS.WARNING_DAYS` (30), `CALIBRATION_THRESHOLDS.INTERMEDIATE_CHECK_UPCOMING_DAYS` (7).

## Step 15: VERSION_CONFLICT SSOT (createVersionConflictException)

```bash
grep -rn "VERSION_CONFLICT" apps/backend/src/modules --include="*.service.ts" | grep "ConflictException" | grep -v "createVersionConflictException\|import\|// "
```

```bash
grep -rn "다른 사용자.*수정\|수정되었습니다.*새로고침" apps/backend/src --include="*.service.ts"
```

## Step 16: CSS easing 하드코딩

```bash
grep -rn "ease-\[cubic-bezier" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "design-tokens/primitives\|// \|/\*\| \* "
```

```typescript
// ❌ WRONG
className="transition-transform ease-[cubic-bezier(0.4,0,0.2,1)] duration-200"

// ✅ CORRECT
className="transition-transform ease-[var(--ease-smooth)] duration-200"
```

## Step 17: 백엔드 페이지네이션 매직넘버

```bash
grep -rn "\.limit([0-9]" apps/backend/src/modules --include="*.ts" | grep -v "\.limit(1)\|node_modules\|spec\|test\|__tests__\|// "
```

SSOT: `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `DASHBOARD_ITEM_LIMIT`, `SELECTOR_PAGE_SIZE`, `REPORT_EXPORT_ROW_LIMIT`.

## Step 18: unwrapResponseData SSOT

```bash
grep -rn "'success' in\|\.success ==" apps/frontend/lib/api/api-client.ts apps/frontend/lib/api/server-api-client.ts apps/frontend/lib/api/authenticated-client-provider.tsx | grep -v "unwrapResponseData\|response-transformers\|// "
```

```bash
grep -rn "unwrapResponseData" apps/frontend/lib/api/api-client.ts apps/frontend/lib/api/server-api-client.ts apps/frontend/lib/api/authenticated-client-provider.tsx
```

```bash
grep -rn "return response\.data" apps/frontend/lib/api --include="*.ts" | grep -v "response-transformers\|node_modules\|// \|\.blob\|Blob\|response\.data\.\|response\.data?"
```
