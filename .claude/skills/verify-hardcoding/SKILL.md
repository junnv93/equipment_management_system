---
name: verify-hardcoding
description: Detects hardcoded values that should use SSOT sources — API paths, queryKeys, environment variables, cache keys, token TTL, pagination options, Korean UI labels, ErrorCode mappings, DTO field mappings. Run after feature implementation.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 검사 항목]'
---

# 하드코딩 값 탐지

## Purpose

SSOT 소스(중앙 상수, 유틸리티, 팩토리)가 존재하는 값이 하드코딩되어 있는지 탐지합니다:

1. **API 경로 하드코딩** — `API_ENDPOINTS` 대신 문자열 직접 사용
2. **queryKeys 하드코딩** — `queryKeys` 팩토리 대신 배열 직접 생성
3. **환경변수 직접 참조** — `API_BASE_URL` 대신 `process.env` 직접 접근
4. **서비스 반환 타입** — `Promise<unknown>` 안티패턴
5. **토큰 TTL 하드코딩** — `shared-constants` 대신 매직 넘버 직접 사용
6. **상수 하드코딩** — SITE_VALUES, PAGE_SIZE_OPTIONS, CACHE_KEY_PREFIXES 등
7. **ErrorCode 매핑 완전성** — 백엔드 ↔ 프론트엔드 에러 코드 매핑
8. **DTO→Entity 매핑** — `getTableColumns()` 대신 필드 목록 하드코딩
9. **CSS easing 하드코딩** — `ease-[cubic-bezier(...)]` 대신 `ease-[var(--ease-*)]` 또는 `TRANSITION_PRESETS` 사용
10. **백엔드 페이지네이션 매직넘버** — `.limit(20)` 대신 `DEFAULT_PAGE_SIZE` 등 SSOT 상수 사용

> **임포트 소스 검증(타입/enum이 올바른 패키지에서 import 되는지)은 `/verify-ssot`에서 수행합니다.**

## When to Run

- 새로운 API 클라이언트 함수를 추가한 후
- 캐시 키를 사용하는 서비스를 추가/수정한 후
- 환경변수를 참조하는 코드를 추가한 후
- 프론트엔드 목록/검색 기능을 구현한 후

## Related Files

| File | Purpose |
|---|---|
| `apps/frontend/lib/api/query-config.ts` | queryKeys 팩토리 (countsAll prefix 키 포함) |
| `apps/frontend/lib/config/api-config.ts` | SSOT API_BASE_URL |
| `apps/frontend/lib/config/pagination.ts` | PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE |
| `apps/frontend/lib/errors/equipment-errors.ts` | ErrorCode ↔ EquipmentErrorCode 매핑 |
| `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts` | E2E 테스트 URL SSOT (BASE_URLS) |
| `apps/backend/src/common/cache/cache-key-prefixes.ts` | CACHE_KEY_PREFIXES SSOT |
| `apps/backend/src/modules/equipment/utils/request-data-codec.ts` | requestData 직렬화/역직렬화 코덱 |
| `apps/backend/src/modules/equipment/equipment.service.ts` | DTO→Entity 매핑 (getTableColumns) |
| `packages/shared-constants/src/auth-token.ts` | 토큰 TTL SSOT |
| `packages/shared-constants/src/business-rules.ts` | 비즈니스 규칙 상수 SSOT (CALIBRATION_THRESHOLDS, REPORT_CONSTANTS 등) |
| `apps/frontend/lib/api/utils/response-transformers.ts` | unwrapResponseData SSOT — API 응답 래핑 해제 함수 |
| `packages/shared-constants/src/pagination.ts` | 페이지네이션 상수 SSOT (DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE 등) |
| `apps/frontend/lib/api/repair-history-api.ts` | 수리 이력 API 클라이언트 (API_ENDPOINTS 사용) |
| `packages/schemas/src/validation/messages.ts` | VM (Validation Messages) SSOT — DTO 검증 메시지 중앙 관리 |
| `packages/shared-constants/src/test-users.ts` | Test User Email SSOT |
| `packages/schemas/src/document.ts` | DocumentTypeValues SSOT (개별 document type 상수) |
| `packages/shared-constants/src/file-types.ts` | FILE_UPLOAD_LIMITS, ALLOWED_MIME_TYPES, ALLOWED_EXTENSIONS, DOCUMENT_FILE_RULES SSOT |
| `apps/backend/src/common/base/versioned-base.service.ts` | VERSION_CONFLICT_MESSAGE, createVersionConflictException SSOT |
| `apps/frontend/lib/utils/approval-summary-utils.ts` | i18n 기반 승인 summary 렌더링 유틸 (getLocalizedSummary) |
| `packages/shared-constants/src/checkout-selectability.ts` | 반출 장비 선택 가능 여부 + 차단 사유 i18n 키 (getBlockedReasonKey) |

전체 SSOT 파일 맵: [../verify-ssot/references/ssot-file-map.md](../verify-ssot/references/ssot-file-map.md) 참조.

## Workflow

### Step 1: 하드코딩된 API 경로 탐지

```bash
# 하드코딩된 API 경로 탐지 (API 클라이언트 파일)
grep -rn "'/api/" apps/frontend/lib/api --include="*.ts" | grep -v "API_ENDPOINTS\|baseURL\|// \|test\|mock"
```

**PASS 기준:** API 클라이언트에서 하드코딩된 경로가 없어야 함 (API_ENDPOINTS 사용).

### Step 2: queryKeys 팩토리 사용 확인

```bash
# 하드코딩된 queryKey 탐지
grep -rn "queryKey:\s*\['" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "query-config\|queryKeys\|// "
```

**PASS 기준:** 모든 queryKey가 `queryKeys` 팩토리를 통해 생성.

**FAIL 기준:** `queryKey: ['equipment', 'detail']` 같은 하드코딩 문자열 배열.

### Step 3: 서비스 메서드의 `Promise<unknown>` 안티패턴 탐지

```bash
grep -rn "): Promise<unknown>" apps/backend/src/modules --include="*.service.ts" | grep -v "//\|spec\|test"
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** public 서비스 메서드에 `Promise<unknown>` 반환 타입이 있으면 위반.

```typescript
// ❌ WRONG
async findOne(uuid: string): Promise<unknown> { ... }

// ✅ CORRECT — Drizzle $inferSelect 기반 SSOT 타입
async findOne(uuid: string): Promise<CalibrationPlanDetail> {
  return this.cacheService.getOrSet<CalibrationPlanDetail>(cacheKey, async () => { ... });
}
```

### Step 4: Frontend 환경변수 직접 참조 탐지

```bash
# process.env.NEXT_PUBLIC_API_URL 직접 참조 탐지 (E2E 테스트 파일 제외)
grep -rn "process\.env\.NEXT_PUBLIC_API_URL" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "api-config.ts\|node_modules\|tests/e2e\|// "
```

**PASS 기준:** 0개 결과 (`lib/config/api-config.ts`와 `tests/e2e/` 제외).

```typescript
// ❌ WRONG — 직접 환경변수 참조
const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ✅ CORRECT — SSOT에서 import
import { API_BASE_URL } from '@/lib/config/api-config';
```

#### Step 4b: E2E 테스트 Backend URL SSOT 확인

```bash
grep -rn "process\.env\.NEXT_PUBLIC_API_URL" apps/frontend/tests/e2e --include="*.ts" --include="*.tsx" | grep -v "shared-test-data.ts\|node_modules\|// "
```

**PASS 기준:** 0개 결과 (모든 E2E 파일은 `BASE_URLS.BACKEND`를 import).

### Step 5: 인증 토큰 TTL 하드코딩 탐지

```bash
grep -rn "expiresIn.*['\"]15m['\"]\\|expiresIn.*['\"]7d['\"]\\|30 \\* 24 \\* 60 \\* 60[^*]\\|15 \\* 60[^*]\\|7 \\* 24 \\* 60 \\* 60[^*]" \
  apps/frontend/lib/auth.ts apps/frontend/lib/auth \
  apps/backend/src/modules/auth \
  --include="*.ts" \
  | grep -v "LOCK_DURATION\\|ATTEMPT_WINDOW\\|shared-constants\\|auth-token\\.ts\\|// "
```

**PASS 기준:** 0개 결과.

```bash
# 로컬 재정의 추가 탐지
grep -rn "ABSOLUTE_SESSION_MAX_AGE\s*=\|accessTokenExpiresInSeconds\s*=" \
  apps/frontend apps/backend/src \
  --include="*.ts" \
  | grep -v "shared-constants\\|auth-token\\.ts\\|import\\|// "
```

**PASS 기준:** 0개 결과.

**SSOT 상수 목록** (`packages/shared-constants/src/auth-token.ts`):

- `ACCESS_TOKEN_TTL_SECONDS` — 900s (15분)
- `REFRESH_TOKEN_TTL_SECONDS` — 604800s (7일)
- `ABSOLUTE_SESSION_MAX_AGE_SECONDS` — 2592000s (30일)
- `ACCESS_TOKEN_EXPIRES_IN` — `'900s'` (NestJS JwtModule용)

### Step 6: SITE_VALUES 로컬 재정의 탐지

```bash
grep -rn "Site\[\]\s*=\s*\[" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// "
```

```bash
grep -rn "const SITE_VALUES\s*[=:]" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// "
```

**PASS 기준:** 0개 결과.

### Step 7: PAGE_SIZE_OPTIONS 로컬 재정의 탐지

```bash
grep -rn "const PAGE_SIZE_OPTIONS\s*[=:]" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "pagination\.ts\|node_modules\|// "
```

**PASS 기준:** `pagination.ts` 외 파일에 직접 선언 없음.

### Step 8: CACHE_KEY_PREFIXES SSOT 사용 확인

```bash
# 서비스 파일에서 하드코딩된 캐시 키 프리픽스 탐지
grep -rn "'equipment:\|'checkouts:\|'calibration:\|'calibration-plans:\|'dashboard:\|'disposal-requests:\|'equipment-imports:\|'software:\|'non-conformances:\|'audit-logs:\|'notification:\|'actor:name:\|'approvals:\|'settings:\|'user_active:\|'reports:\|'documents:" apps/backend/src/modules apps/backend/src/common --include="*.service.ts" --include="*.ts" | grep -v "CACHE_KEY_PREFIXES\|cache-key-prefixes\|// \|spec\|test\|__tests__"
```

```bash
# cache-invalidation.helper.ts에서 하드코딩 탐지
grep -rn "'equipment:\|'checkouts:\|'calibration:\|'dashboard:\|'disposal-requests:\|'equipment-imports:" apps/backend/src/common/cache/cache-invalidation.helper.ts | grep -v "CACHE_KEY_PREFIXES\|// "
```

```bash
# cache-event.registry.ts에서 하드코딩 탐지
grep -rn "'checkout:\|'calibration:\|'disposal-requests:\|'equipment-imports:" apps/backend/src/common/cache/cache-event.registry.ts | grep -v "CACHE_KEY_PREFIXES\|// "
```

**PASS 기준:** 0개 결과 (모든 캐시 키가 `CACHE_KEY_PREFIXES.*`로 참조).

### Step 9: APPROVAL_KPI 임계값 하드코딩 탐지

```bash
grep -rn "URGENT_THRESHOLD_DAYS\s*=\|WARNING_THRESHOLD_DAYS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|approval-kpi\.ts\|// "
```

**PASS 기준:** `approval-kpi.ts` 외 파일에서 직접 선언 없음.

### Step 9b: 리포트 상수 하드코딩 탐지 (REPORT_CONSTANTS, REPORT_EXPORT_ROW_LIMIT)

```bash
# 리포트 관련 매직넘버 탐지: 8(시간/일), 10000(export 제한)을 직접 사용하는 경우
grep -rn "\.limit(10[_0]*00)\|* 8[^0-9]\|\.slice(0, [0-9])" apps/backend/src/modules/reports --include="*.ts" | grep -v "REPORT_CONSTANTS\|REPORT_EXPORT_ROW_LIMIT\|node_modules\|// "
```

**PASS 기준:** `REPORT_CONSTANTS.HOURS_PER_CHECKOUT`, `REPORT_CONSTANTS.TOP_N_LIMIT`, `REPORT_CONSTANTS.BOTTOM_N_LIMIT`, `REPORT_EXPORT_ROW_LIMIT`이 `@equipment-management/shared-constants`에서 import되어 사용.

**FAIL 기준:** `.limit(10000)`, `* 8`, `.slice(0, 5)` 등 매직넘버가 직접 사용되면 위반. `REPORT_UTILIZATION_THRESHOLDS.HIGH/LOW`도 하드코딩 금지.

### Step 10: ErrorCode ↔ 프론트엔드 mapBackendErrorCode 매핑 완전성

```bash
# 백엔드 ErrorCode enum 값 목록 확인
grep -n "= '" packages/schemas/src/errors.ts | grep -v "// "
```

```bash
# 프론트엔드 mapBackendErrorCode 매핑 확인
grep -n "ErrorCode\.\|: EquipmentErrorCode\." apps/frontend/lib/errors/equipment-errors.ts | head -30
```

**PASS 기준:** `ErrorCode`의 주요 에러 코드가 `mapBackendErrorCode`에 매핑됨.

**FAIL 기준:** 백엔드 `ErrorCode` 값이 프론트엔드 매핑에 없으면 generic 에러로 표시.

### Step 11: DTO→Entity 매핑 SSOT (getTableColumns)

```bash
grep -n "getTableColumns\|EQUIPMENT_COLUMNS" apps/backend/src/modules/equipment/equipment.service.ts
```

**PASS 기준:** `EQUIPMENT_COLUMNS = new Set(Object.keys(getTableColumns(equipment)))` 패턴으로 DB 스키마에서 컬럼 목록 추출.

```bash
# 하드코딩된 필드 배열 탐지
grep -n "const fields.*Array.*keyof" apps/backend/src/modules/equipment/equipment.service.ts
```

**FAIL 기준:** 하드코딩된 필드 배열이 발견되면 `getTableColumns()` 기반으로 전환 필요.

### Step 12: requestData 직렬화 코덱 사용

```bash
grep -n "JSON\.\(parse\|stringify\)" apps/backend/src/modules/equipment/services/equipment-approval.service.ts
```

**PASS 기준:** 0개 결과. 모든 requestData 처리는 `serializeRequestData()`, `deserializeRequestData()`, `parseRequestDataForDisplay()`를 통해야 함.

**FAIL 기준:** `JSON.parse(request.requestData)` 직접 호출 → Date 필드가 문자열로 남아 Drizzle ORM TypeError 유발.

### Step 13: DTO 하드코딩 검증 메시지 탐지 (VM SSOT)

DTO 파일의 Zod 검증자에 하드코딩된 한국어 메시지가 있는지 탐지합니다. 모든 검증 메시지는 `VM` (Validation Messages) 상수를 사용해야 합니다.

```bash
# DTO에서 하드코딩된 한국어 검증 메시지 탐지 (VM 미사용)
# z.string().min(1, '직접 한국어 메시지') 패턴 탐지
grep -rn "z\.\(string\|number\|array\|enum\).*['\"].*[가-힣]" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "VM\.\|// \|describe\|test"
```

```bash
# message: '한국어' 패턴 탐지 (enum 등의 message 옵션)
grep -rn "message:\s*['\"][^'\"]*[가-힣]" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "VM\.\|// "
```

```bash
# Zod .int(), .positive(), .min(), .max(), .uuid() 등에 직접 한국어 문자열 전달 탐지
grep -rn "\.int(['\"].*[가-힣]\|\.positive(['\"].*[가-힣]\|\.min([0-9]*,\s*['\"].*[가-힣]\|\.max([0-9]*,\s*['\"].*[가-힣]\|\.uuid(['\"].*[가-힣]" apps/backend/src/modules/*/dto --include="*.dto.ts" | grep -v "VM\.\|// "
```

**PASS 기준:** 0개 결과. 모든 검증 메시지가 `VM.*` 상수를 사용.

**FAIL 기준:** 하드코딩된 한국어 문자열 → `VM.*` 상수로 교체 필요.

```typescript
// ❌ WRONG — 하드코딩 검증 메시지
z.string().uuid('유효한 장비 UUID가 아닙니다')
z.string().min(1, '반출 사유를 입력해주세요')
z.enum(VALUES, { message: '유효하지 않은 상태입니다' })

// ✅ CORRECT — VM SSOT 상수 사용
import { VM } from '@equipment-management/schemas';
z.string().uuid(VM.uuid.invalid('장비'))
z.string().min(1, VM.checkout.reason.required)
z.enum(VALUES, { message: VM.checkout.status.invalid })
```

**SSOT 파일:** `packages/schemas/src/validation/messages.ts`

### Step 13b: Test User Email SSOT 하드코딩 탐지

E2E spec 파일에서 테스트 이메일을 직접 리터럴로 사용하는지 탐지합니다.

```bash
# E2E spec에서 테스트 이메일 하드코딩 탐지
grep -rn "'test\.engineer@example\.com'\|'tech\.manager@example\.com'" apps/frontend/tests/e2e --include="*.spec.ts" | grep -v "shared-test-data\.ts\|test-users\.ts\|import\|// "
```

**PASS 기준:** 0개 결과. 모든 테스트 이메일이 `shared-test-data.ts`의 상수를 통해 참조.

**FAIL 기준:** spec 파일에서 `'test.engineer@example.com'` 등의 이메일 리터럴 직접 사용 시 위반.

```typescript
// ❌ WRONG — 이메일 하드코딩
const email = 'test.engineer@example.com';

// ✅ CORRECT — shared-test-data.ts 상수 참조
import { TEST_USERS } from '../shared/constants/shared-test-data';
const email = TEST_USERS.TEST_ENGINEER.email;
```

### Step 14: CALIBRATION_THRESHOLDS 하드코딩 탐지

```bash
# 교정 임계값 매직넘버 탐지: 30(일), 7(일)을 직접 사용하는 경우
# addDaysUtc(*, 30), days = 30, WARNING_DAYS: 30 등
grep -rn "addDaysUtc.*[^A-Z_]30[^0-9]\|days.*=\s*30[^0-9]\|days:\s*30[^0-9]" \
  apps/backend/src/modules/calibration apps/frontend/components/calibration apps/frontend/app/\(dashboard\)/calibration \
  --include="*.ts" --include="*.tsx" \
  | grep -v "CALIBRATION_THRESHOLDS\|business-rules\|// \|spec\|test\|\.plan\."
```

```bash
# 중간점검 임계값 7(일) 직접 사용 탐지
grep -rn "<=\s*7[^0-9]\|<\s*7[^0-9]\|days.*7[^0-9]" \
  apps/backend/src/modules/calibration apps/frontend/components/calibration \
  --include="*.ts" --include="*.tsx" \
  | grep -v "CALIBRATION_THRESHOLDS\|business-rules\|// \|spec\|test"
```

**PASS 기준:** 0개 결과. 모든 교정 임계값이 `CALIBRATION_THRESHOLDS.*`로 참조.

**FAIL 기준:** `addDaysUtc(today, 30)`, `days = 7` 등 매직넘버가 직접 사용되면 위반.

**SSOT 상수 목록** (`packages/shared-constants/src/business-rules.ts`):

- `CALIBRATION_THRESHOLDS.WARNING_DAYS` — 30 (교정 예정 경고 일수)
- `CALIBRATION_THRESHOLDS.INTERMEDIATE_CHECK_UPCOMING_DAYS` — 7 (중간점검 upcoming 일수)

### Step 15: VERSION_CONFLICT SSOT (createVersionConflictException)

`versioned-base.service.ts`의 `createVersionConflictException()` 헬퍼가 VERSION_CONFLICT 에러 생성의 SSOT입니다. 인라인 CAS를 구현하는 서비스에서 이 헬퍼를 사용하는지 확인합니다.

```bash
# VERSION_CONFLICT을 직접 ConflictException으로 throw하는 곳 탐지 (헬퍼 미사용)
grep -rn "VERSION_CONFLICT" apps/backend/src/modules --include="*.service.ts" | grep "ConflictException" | grep -v "createVersionConflictException\|import\|// "
```

**PASS 기준:** 0개 결과. 모든 서비스가 `createVersionConflictException()` 헬퍼를 사용.

**FAIL 기준:** `new ConflictException({ ... code: 'VERSION_CONFLICT' })` 인라인 생성 → `createVersionConflictException()` 헬퍼로 교체 필요.

```bash
# 한국어 VERSION_CONFLICT 메시지 잔존 탐지
grep -rn "다른 사용자.*수정\|수정되었습니다.*새로고침" apps/backend/src --include="*.service.ts"
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** 한국어 에러 메시지가 남아 있으면 `createVersionConflictException()`으로 교체 필요.

### Step 16: CSS easing 하드코딩 탐지

globals.css `--ease-*` → `EASING_CSS_VARS` → `getTransitionClasses()` SSOT 체인이 구축되어 있으므로, `ease-[cubic-bezier(...)]` 패턴이 코드에 직접 사용되면 SSOT 위반입니다.

```bash
# ease-[cubic-bezier(...)] 하드코딩 탐지 (프론트엔드 코드)
grep -rn "ease-\[cubic-bezier" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "design-tokens/primitives\|// \|/\*\| \* "
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** `ease-[cubic-bezier(...)]`가 컴포넌트/유틸리티 코드에서 발견되면 위반. `ease-[var(--ease-*)]` 또는 `TRANSITION_PRESETS.*`으로 교체 필요.

```typescript
// ❌ WRONG — cubic-bezier 하드코딩
className="transition-transform ease-[cubic-bezier(0.4,0,0.2,1)] duration-200"

// ✅ CORRECT — CSS 변수 참조
className="transition-transform ease-[var(--ease-smooth)] duration-200"

// ✅ CORRECT — TRANSITION_PRESETS 사용
import { TRANSITION_PRESETS } from '@/lib/design-tokens';
className={TRANSITION_PRESETS.smooth}
```

**Exceptions:** `lib/design-tokens/primitives.ts`의 JSDoc 주석은 면제 (SSOT 정의 문서).

### Step 17: 백엔드 페이지네이션 매직넘버 탐지

`.limit()` 안에 숫자를 직접 사용하면 SSOT 위반입니다. 모든 페이지네이션은 `packages/shared-constants/src/pagination.ts`의 상수를 사용해야 합니다.

```bash
# .limit() 안에 숫자 직접 사용 탐지 (.limit(1) 제외 — 단일 레코드 조회)
grep -rn "\.limit([0-9]" apps/backend/src/modules --include="*.ts" | grep -v "\.limit(1)\|node_modules\|spec\|test\|__tests__\|// "
```

**PASS 기준:** 0개 결과. 모든 페이지네이션이 SSOT 상수 사용.

**FAIL 기준:** `.limit(20)`, `.limit(50)`, `.limit(100)` 등 매직넘버가 직접 사용되면 위반. SSOT 상수로 교체 필요.

```typescript
// ❌ WRONG — 매직넘버 하드코딩
.limit(20)
.limit(100)

// ✅ CORRECT — SSOT 상수 사용
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '@equipment-management/shared-constants';
.limit(DEFAULT_PAGE_SIZE)
.limit(MAX_PAGE_SIZE)
```

**SSOT 상수 목록** (`packages/shared-constants/src/pagination.ts`):

- `DEFAULT_PAGE_SIZE` — 기본 페이지 크기
- `MAX_PAGE_SIZE` — 최대 페이지 크기
- `DASHBOARD_ITEM_LIMIT` — 대시보드 항목 제한
- `SELECTOR_PAGE_SIZE` — 셀렉터 페이지 크기
- `REPORT_EXPORT_ROW_LIMIT` — 리포트 내보내기 행 제한

**Exceptions:** `.limit(1)`은 단일 레코드 조회 패턴으로 면제.

### Step 18: unwrapResponseData SSOT 사용 확인

백엔드 `ResponseTransformInterceptor`의 `{ success, data }` 래핑을 해제하는 로직은 `unwrapResponseData` 함수가 SSOT입니다. API 클라이언트의 응답 인터셉터에서 이 함수를 사용하지 않고 인라인으로 래핑 해제하면, 3개 클라이언트(apiClient, serverApiClient, authenticatedClient) 간 동작 불일치가 발생합니다.

```bash
# 1. unwrapResponseData를 사용하지 않는 인라인 래핑 해제 탐지
# 인터셉터에서 'success' in + 'data' in 패턴을 직접 구현하는 경우
grep -rn "'success' in\|\.success ==" apps/frontend/lib/api/api-client.ts apps/frontend/lib/api/server-api-client.ts apps/frontend/lib/api/authenticated-client-provider.tsx | grep -v "unwrapResponseData\|response-transformers\|// "

# 2. 3개 API 클라이언트 모두 unwrapResponseData를 import하는지 확인
grep -rn "unwrapResponseData" apps/frontend/lib/api/api-client.ts apps/frontend/lib/api/server-api-client.ts apps/frontend/lib/api/authenticated-client-provider.tsx
```

**PASS 기준:** 3개 API 클라이언트 모두 `unwrapResponseData`를 import하여 응답 인터셉터에서 사용. 인라인 래핑 해제 코드 0건.

**FAIL 기준:** (1) API 클라이언트가 `unwrapResponseData`를 사용하지 않고 인라인으로 `'success' in response.data` 검사를 수행, 또는 (2) 3개 클라이언트 중 일부만 `unwrapResponseData`를 사용.

```bash
# 3. API 메서드에서 response.data 직접 반환 탐지
# 모든 API 메서드는 transform*Response를 통해 응답을 반환해야 함
grep -rn "return response\.data" apps/frontend/lib/api --include="*.ts" | grep -v "response-transformers\|node_modules\|// \|\.blob\|Blob\|response\.data\.\|response\.data?"
```

**PASS 기준:** 0개 결과. 모든 API 메서드가 `transformSingleResponse`, `transformArrayResponse`, 또는 `transformPaginatedResponse`를 통해 응답 반환.

**FAIL 기준:** `return response.data` 직접 반환이 발견되면 위반. `transform*Response` 사용으로 교체 필요.

**Exceptions:**
- `response.data`를 Blob 생성에 사용하는 경우 (파일 다운로드): `new Blob([response.data])`
- `PaginatedResponse`의 `.data` 배열 접근: `response.data || []` (이미 transform 된 후의 접근)
- JSDoc 주석 내 `response.data` 문자열

**SSOT 파일:** `apps/frontend/lib/api/utils/response-transformers.ts`의 `unwrapResponseData` 함수.

### Step 19: 프론트엔드 한국어 하드코딩 UI 라벨 탐지

API 클라이언트 및 유틸리티 파일에서 사용자에게 표시되는 한국어 문자열이 하드코딩되어 있는지 탐지합니다. 모든 UI 라벨은 i18n 파일(`messages/{en,ko}/*.json`)에서 관리해야 합니다.

```bash
# API 클라이언트 파일에서 한국어 UI 라벨 하드코딩 탐지 (주석 제외)
grep -rPn '[가-힣]' apps/frontend/lib/api --include="*.ts" | grep -v '//\|/\*\|\*\s' | head -20
```

```bash
# 유틸리티 파일에서 한국어 UI 라벨 하드코딩 탐지 (주석 제외)
grep -rPn '[가-힣]' apps/frontend/lib/utils --include="*.ts" | grep -v '//\|/\*\|\*\s' | head -20
```

```bash
# shared-constants에서 한국어 UI 라벨 하드코딩 탐지 (주석 제외)
grep -rPn '[가-힣]' packages/shared-constants/src --include="*.ts" | grep -v '//\|/\*\|\*\s' | head -20
```

**PASS 기준:** 0개 결과. 모든 사용자 표시 문자열이 i18n 키 기반으로 관리.

**FAIL 기준:** `'알 수 없음'`, `'장비'`, `'반출 요청'` 등 한국어 폴백/라벨이 코드에 직접 존재하면 위반. 영어 기본값 + i18n summaryData/키 패턴으로 전환 필요.

```typescript
// ❌ WRONG — 한국어 하드코딩 UI 라벨
requesterName: registeredByUser?.name || '시험실무자',
summary: `${equipmentNames} 반출 요청`,

// ✅ CORRECT — 영어 기본값 + i18n summaryData
requesterName: registeredByUser?.name || 'Test Engineer',
summary: `${equipmentNames} Checkout Request`,
summaryData: { type: 'checkout', equipmentNames, direction: 'outgoing' },
// → 컴포넌트에서 getLocalizedSummary(item, t)로 로케일별 표시
```

**Exceptions:**
- `packages/schemas/src/enums/labels.ts`의 한국어 라벨 상수 — SSOT 정의이므로 면제 (향후 i18n 전환 대상)
- 주석 내 한국어 설명 — 코드 문서이므로 면제

### Step 20: 컴포넌트 내 *_LABELS 맵 직접 사용 및 import 탐지

i18n 마이그레이션 후 React 컴포넌트에서 schemas 패키지의 `*_LABELS` 맵을 직접 import하거나 사용하여 UI 텍스트를 표시하는 패턴을 탐지합니다. `lib/i18n/use-enum-labels.ts`의 hook 또는 `useTranslations()` + JSON 키 패턴으로 교체 필요.

```bash
# 20a: 컴포넌트/페이지에서 *_LABELS[value] 패턴 사용 탐지
grep -rn '_LABELS\[' apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v 'node_modules\|// \|/\*\|\.spec\.\|\.test\.\|tests/' | head -30

# 20b: 컴포넌트/페이지에서 *_LABELS import 탐지 (SITE_LABELS, CLASSIFICATION_LABELS 등)
grep -rn 'import.*\(SITE_LABELS\|CLASSIFICATION_LABELS\|CALIBRATION_METHOD_LABELS\|EQUIPMENT_STATUS_LABELS\|CHECKOUT_STATUS_LABELS\).*from.*schemas' apps/frontend/components apps/frontend/app --include="*.tsx" --include="*.ts" | grep -v 'node_modules\|\.spec\.\|\.test\.\|tests/' | head -30
```

**PASS 기준:** 20a, 20b 모두 0개 결과. 컴포넌트에서 `useSiteLabels()`, `useClassificationLabels()`, `useCalibrationMethodLabels()` 등 i18n hook을 사용.

**FAIL 기준:**
- 20a: `*_LABELS[value]`를 직접 JSX에서 사용하면 영어 로케일에서 한국어 혼재
- 20b: 컴포넌트/페이지에서 `*_LABELS`를 직접 import → `lib/i18n/use-enum-labels.ts` hook으로 교체 필요

**Exceptions:**
- `lib/api/*.ts` (API 유틸리티 파일) — React hook 사용 불가, `@deprecated` 표기 후 유지
- `tests/e2e/**/*.ts` (E2E 테스트) — 한국어 로케일 기반 실행
- `lib/constants/*.ts` (상수 정의 파일) — re-export는 `@deprecated` 표기 후 유지

### Step 21: FILE_UPLOAD_LIMITS 및 파일 타입 하드코딩 탐지

파일 업로드 관련 상수(크기 제한, MIME 타입, 확장자)가 SSOT(`file-types.ts`)를 참조하는지 확인합니다.

```bash
# 21a: 파일 크기 매직넘버 탐지 (10MB = 10 * 1024 * 1024)
grep -rn "10 \* 1024 \* 1024\|10485760" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "file-types\.ts\|file-validation\.ts\|FILE_UPLOAD_LIMITS\|node_modules\|// \|test\|\.spec\."
```

```bash
# 21b: 프론트엔드 accept 속성에 확장자 직접 하드코딩 탐지
grep -rn "accept=['\"{].*\.pdf\|accept=['\"{].*\.png\|accept=['\"{].*\.jpg" apps/frontend --include="*.tsx" | grep -v "DOCUMENT_FILE_RULES\|ALLOWED_EXTENSIONS\|node_modules"
```

**PASS 기준:** 21a, 21b 모두 0개 결과.

**FAIL 기준:**
- 21a: 파일 크기 매직넘버 → `FILE_UPLOAD_LIMITS.MAX_FILE_SIZE` 사용으로 교체
- 21b: accept 속성 하드코딩 → `DOCUMENT_FILE_RULES[type].accept` 또는 `ALLOWED_EXTENSIONS.join(',')` 사용

## Output Format

```markdown
| #   | 검사                          | 상태      | 상세                                   |
| --- | ----------------------------- | --------- | -------------------------------------- |
| 1   | 하드코딩 API 경로             | PASS/FAIL | 하드코딩 위치 목록                     |
| 2   | queryKeys 팩토리              | PASS/FAIL | 하드코딩 queryKey 위치                 |
| 3   | Promise<unknown> 반환 타입    | PASS/FAIL | 서비스 메서드의 unknown 반환 타입 위치 |
| 4   | 환경변수 직접 참조            | PASS/FAIL | NEXT_PUBLIC_API_URL 직접 참조 위치     |
| 4b  | E2E Backend URL SSOT          | PASS/FAIL | E2E 내 직접 env 참조 파일 목록         |
| 5   | 토큰 TTL 하드코딩             | PASS/FAIL | auth 파일 내 하드코딩 위치             |
| 6   | SITE_VALUES 로컬 재정의       | PASS/FAIL | Site[] 로컬 선언 위치                  |
| 7   | PAGE_SIZE_OPTIONS 로컬 재정의 | PASS/FAIL | pagination.ts 외 직접 선언 위치        |
| 8   | CACHE_KEY_PREFIXES SSOT       | PASS/FAIL | 하드코딩 캐시 키 위치                  |
| 9   | APPROVAL_KPI 임계값           | PASS/FAIL | 하드코딩 임계값 위치                   |
| 10  | ErrorCode↔프론트엔드 매핑    | PASS/FAIL | 누락된 ErrorCode 매핑 목록             |
| 11  | DTO→Entity 동적 매핑 SSOT     | PASS/FAIL | 하드코딩 필드 목록 위치                |
| 12  | requestData 코덱 사용         | PASS/FAIL | 직접 JSON.parse 위치                   |
| 13  | DTO 검증 메시지 VM SSOT       | PASS/FAIL | 하드코딩 한국어 메시지 위치            |
| 13b | Test User Email SSOT          | PASS/FAIL | 하드코딩 이메일 리터럴 위치            |
| 14  | CALIBRATION_THRESHOLDS SSOT   | PASS/FAIL | 교정 임계값 매직넘버 위치              |
| 15  | VERSION_CONFLICT 메시지 일관성 | PASS/FAIL | SSOT 불일치 서비스 목록                |
| 16  | CSS easing 하드코딩           | PASS/FAIL | ease-[cubic-bezier] 하드코딩 위치      |
| 17  | 페이지네이션 매직넘버         | PASS/FAIL | .limit(숫자) 하드코딩 위치             |
| 18  | unwrapResponseData SSOT       | PASS/FAIL | 인라인 래핑 해제 위치                  |
| 19  | 한국어 하드코딩 UI 라벨      | PASS/FAIL | API/유틸/상수 내 한국어 문자열 위치    |
| 20  | 컴포넌트 *_LABELS 잔존 사용  | PASS/FAIL | 컴포넌트 내 LABELS 맵 직접 사용 위치   |
| 21  | FILE_UPLOAD_LIMITS 하드코딩   | PASS/FAIL | 파일 크기/타입 매직넘버 위치            |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS` 등 레이블+값 쌍은 로컬 정의 허용. 순수 값 배열(`Site[]`)만 schemas에서 import 필수.
2. **테스트 파일의 날짜 오프셋 계산** — E2E/단위 테스트에서 `7 * 24 * 60 * 60 * 1000` 형태로 날짜를 계산하는 코드는 토큰 TTL과 무관
3. **`shared-test-data.ts`의 `BACKEND` URL 직접 정의** — E2E 테스트용 URL SSOT이므로 직접 참조 정상
4. **`Promise<unknown>` private 헬퍼** — 클래스 내부 전용 private 메서드는 면제. public 메서드에서만 위반
5. **response DTO의 ApiResponse 재사용** — 응답 타입 정의에서 ApiResponse를 import 후 래핑하는 것은 정상
6. **`lib/design-tokens/primitives.ts`의 JSDoc 주석** — easing SSOT 정의 문서이므로 `cubic-bezier` 값 기술 면제
7. **`.limit(1)` 단일 레코드 조회** — 페이지네이션이 아닌 단건 조회 패턴으로 면제
8. **서버 로그/경고 메시지** — `console.log`, `console.warn` 등 개발자 디버깅용 메시지는 UI 표시가 아니므로 면제
9. **`packages/schemas/src/enums/labels.ts`의 한국어 라벨** — 서버 사이드 전용 SSOT 정의 파일이므로 면제. 프론트엔드 UI 표시에는 i18n 메시지 JSON을 사용 (전환 완료)
10. **`*_LABELS[value]` 잔존 사용 (컴포넌트 내)** — i18n 마이그레이션 후 React 컴포넌트에서 `*_LABELS` 맵을 직접 사용하여 UI 텍스트를 표시하면 영어 로케일에서 한국어가 혼재됨. `useTranslations()` + JSON 키로 교체 필요. 단, API 유틸리티 파일(`lib/api/*`)에서의 사용은 React hook 호출 불가로 면제 (별도 아키텍처 변경 필요)
11. **E2E 테스트 파일의 `*_LABELS` 사용** — 테스트는 특정 로케일(한국어) 기반으로 실행되므로 면제
