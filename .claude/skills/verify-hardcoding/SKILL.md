---
name: verify-hardcoding
description: SSOT 소스가 존재하는 값의 하드코딩을 탐지합니다. API 경로, queryKeys, 환경변수, 캐시 키, 토큰 TTL, 페이지 옵션 등. 기능 구현 후 사용.
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
| `apps/frontend/lib/api/repair-history-api.ts` | 수리 이력 API 클라이언트 (API_ENDPOINTS 사용) |

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
grep -rn "'equipment:\|'checkouts:\|'calibration:\|'calibration-plans:\|'dashboard:\|'disposal-requests:\|'equipment-imports:\|'software:\|'non-conformances\|'audit-logs:\|'notification:" apps/backend/src/modules --include="*.service.ts" | grep -v "CACHE_KEY_PREFIXES\|cache-key-prefixes\|// \|spec\|test"
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
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS` 등 레이블+값 쌍은 로컬 정의 허용. 순수 값 배열(`Site[]`)만 schemas에서 import 필수.
2. **테스트 파일의 날짜 오프셋 계산** — E2E/단위 테스트에서 `7 * 24 * 60 * 60 * 1000` 형태로 날짜를 계산하는 코드는 토큰 TTL과 무관
3. **`shared-test-data.ts`의 `BACKEND` URL 직접 정의** — E2E 테스트용 URL SSOT이므로 직접 참조 정상
4. **`Promise<unknown>` private 헬퍼** — 클래스 내부 전용 private 메서드는 면제. public 메서드에서만 위반
5. **response DTO의 ApiResponse 재사용** — 응답 타입 정의에서 ApiResponse를 import 후 래핑하는 것은 정상
