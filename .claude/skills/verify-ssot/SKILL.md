---
name: verify-ssot
description: SSOT(Single Source of Truth) 임포트 패턴을 검증합니다. 타입/enum/상수 추가/수정 후 사용.
disable-model-invocation: true
argument-hint: '[선택사항: 특정 패키지명]'
---

# SSOT 임포트 패턴 검증

## Purpose

타입, enum, 상수가 올바른 패키지에서 임포트되는지 검증합니다:

1. **Enum/타입 임포트** — `UserRole`, `EquipmentStatus`, `CheckoutStatus` 등은 `@equipment-management/schemas`에서 임포트
2. **Permission 임포트** — `Permission` enum은 `@equipment-management/shared-constants`에서 임포트
3. **API 엔드포인트 임포트** — `API_ENDPOINTS`는 `@equipment-management/shared-constants`에서 임포트
4. **로컬 재정의 금지** — 패키지에 정의된 타입을 로컬에서 재정의하지 않음
5. **Query Keys 팩토리** — `queryKeys`는 `lib/api/query-config.ts`에서 임포트
6. **Icon Library 통합** — lucide-react 표준 준수, react-icons 등 deprecated library 제거

## When to Run

- 새로운 enum이나 타입을 추가한 후
- import 경로를 변경한 후
- 새로운 모듈/컴포넌트를 추가한 후
- 패키지 간 타입 의존성 변경 후

## Related Files

| File                                                                         | Purpose                                                                                        |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `packages/db/src/schema/audit-logs.ts`                                       | DB enum 배열 (auditAction, auditEntityType — schemas와 동기화 필수)                            |
| `packages/schemas/src/enums.ts`                                              | SSOT enum 정의 (EquipmentStatus, CheckoutStatus 등)                                            |
| `packages/schemas/src/user.ts`                                               | UserRole 타입 정의                                                                             |
| `packages/schemas/src/settings.ts`                                           | SSOT 설정 타입/기본값 (SystemSettings, DisplayPreferences)                                     |
| `packages/schemas/src/audit-log.ts`                                          | SSOT 감사 로그 타입 (AuditAction, AuditEntityType, AuditLogDetails)                            |
| `packages/schemas/src/field-labels.ts`                                       | SSOT 필드 라벨 (FIELD_LABELS, getFieldLabel)                                                   |
| `packages/schemas/src/index.ts`                                              | schemas 패키지 내보내기                                                                        |
| `packages/shared-constants/src/permissions.ts`                               | Permission enum 정의                                                                           |
| `packages/shared-constants/src/api-endpoints.ts`                             | API_ENDPOINTS 상수                                                                             |
| `packages/shared-constants/src/entity-routes.ts`                             | SSOT 엔티티 라우팅 (ENTITY_ROUTES, getEntityRoute)                                             |
| `packages/shared-constants/src/data-scope.ts`                                | SSOT 데이터 스코프 (DataScopeType, resolveDataScope, AUDIT_LOG_SCOPE)                          |
| `packages/shared-constants/src/index.ts`                                     | shared-constants 패키지 내보내기                                                               |
| `packages/shared-constants/src/auth-token.ts`                                | SSOT 인증 토큰 라이프사이클 상수 (TTL, buffer, expires_in)                                     |
| `apps/frontend/lib/api/query-config.ts`                                      | queryKeys 팩토리                                                                               |
| `apps/frontend/lib/config/api-config.ts`                                     | SSOT API_BASE_URL (`process.env.NEXT_PUBLIC_API_URL` 직접 참조 금지)                           |
| `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts`               | E2E 테스트 URL SSOT (`BASE_URLS.BACKEND`, `BASE_URLS.FRONTEND`)                                |
| `apps/frontend/lib/config/dashboard-config.ts`                               | SSOT 역할별 대시보드 Config (DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE)                              |
| `apps/frontend/lib/config/pagination.ts`                                     | SSOT 페이지네이션 상수 (PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE — 로컬 재정의 금지)               |
| `apps/frontend/lib/utils/dashboard-scope.ts`                                 | SSOT 대시보드 스코프 유틸리티 (DashboardScope, resolveDashboardScope, buildScopedEquipmentUrl) |
| `apps/frontend/components/dashboard/StatsCard.tsx`                           | lucide-react 타입 참조 (LucideIcon)                                                            |
| `apps/backend/src/modules/calibration-plans/calibration-plans.types.ts`      | Drizzle `$inferSelect` 기반 모듈 타입 SSOT (CalibrationPlanDetail 등)                          |
| `apps/backend/src/modules/equipment-imports/types/equipment-import.types.ts` | Drizzle `$inferSelect` 기반 모듈 타입 SSOT                                                     |

## Workflow

### Step 1: 로컬 enum/타입 재정의 탐지

패키지에 정의된 핵심 타입이 로컬에서 재정의되는지 확인합니다.

```bash
# 로컬 UserRole 재정의 탐지
grep -rn "type UserRole\s*=\|enum UserRole\|interface UserRole" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 EquipmentStatus 재정의 탐지
grep -rn "type EquipmentStatus\s*=\|enum EquipmentStatus" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 CheckoutStatus 재정의 탐지
grep -rn "type CheckoutStatus\s*=\|enum CheckoutStatus" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 SystemSettings/DisplayPreferences 재정의 탐지
grep -rn "interface SystemSettings\b\|type SystemSettings\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 DEFAULT_SYSTEM_SETTINGS/DEFAULT_DISPLAY_PREFERENCES 재정의 탐지
grep -rn "DEFAULT_SYSTEM_SETTINGS\s*=\|DEFAULT_DISPLAY_PREFERENCES\s*=\|DEFAULT_CALIBRATION_ALERT_DAYS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 AuditLogFilter 재정의 탐지 (schemas의 AuditLogFilter 재정의 금지)
grep -rn "interface AuditLogFilter\b\|type AuditLogFilter\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|export type {\|// "
```

**PASS 기준:** 0개 결과 (AuditLogFilter는 `@equipment-management/schemas`에서 import + 서비스는 `export type { AuditLogFilter }` re-export 패턴).

**FAIL 기준:** `packages/` 외부에서 `interface AuditLogFilter` 또는 `type AuditLogFilter =` 정의 발견 시 위반.

```bash
# 로컬 AuditAction 재정의 탐지
grep -rn "type AuditAction\s*=\|enum AuditAction" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 AuditEntityType 재정의 탐지
grep -rn "type AuditEntityType\s*=\|enum AuditEntityType" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|// "
```

```bash
# 로컬 FIELD_LABELS 재정의 탐지
grep -rn "FIELD_LABELS\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 ENTITY_ROUTES 재정의 탐지
grep -rn "ENTITY_ROUTES\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

```bash
# 로컬 DataScopeType/resolveDataScope/AUDIT_LOG_SCOPE 재정의 탐지
grep -rn "type DataScopeType\s*=\|AUDIT_LOG_SCOPE\s*=\|resolveDataScope\s*=" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|@equipment-management\|import\|re-export\|// "
```

**PASS 기준:** 0개 결과 (모든 핵심 타입은 패키지에서 임포트).

**FAIL 기준:** 로컬 타입 정의가 발견되면 패키지 임포트로 변경 필요.

### Step 2: Permission 임포트 소스 확인

Permission이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# Permission import 중 shared-constants가 아닌 소스 탐지
grep -rn "import.*Permission" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** 로컬 Permission 정의나 다른 패키지에서의 임포트가 발견되면 위반.

### Step 3: API_ENDPOINTS 임포트 확인

API 엔드포인트 상수가 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# API_ENDPOINTS import 소스 확인
grep -rn "import.*API_ENDPOINTS" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules"
```

**PASS 기준:** 모든 API_ENDPOINTS 임포트가 `@equipment-management/shared-constants`에서.

### Step 3a: Audit Log 타입 임포트 확인

감사 로그 타입이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# AuditAction, AuditEntityType import 소스 확인 (schemas에서 import해야 함)
grep -rn "import.*\(AuditAction\|AuditEntityType\|AUDIT_ACTION_LABELS\|AUDIT_ENTITY_TYPE_LABELS\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** 모든 Audit 타입 임포트가 `@equipment-management/schemas`에서.

**FAIL 기준:** `@equipment-management/shared-constants`나 로컬에서 임포트 시 위반.

### Step 3b: Field Labels 임포트 확인

필드 라벨이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# FIELD_LABELS, getFieldLabel import 소스 확인 (schemas에서 import해야 함)
grep -rn "import.*\(FIELD_LABELS\|getFieldLabel\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** 모든 필드 라벨 임포트가 `@equipment-management/schemas`에서.

### Step 3c: Entity Routes 임포트 확인

엔티티 라우팅이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# ENTITY_ROUTES, getEntityRoute import 소스 확인 (shared-constants에서 import해야 함)
grep -rn "import.*\(ENTITY_ROUTES\|getEntityRoute\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 모든 엔티티 라우팅 임포트가 `@equipment-management/shared-constants`에서.

### Step 3d: Data Scope 임포트 확인

데이터 스코프 타입이 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# DataScopeType, resolveDataScope, AUDIT_LOG_SCOPE import 소스 확인 (shared-constants에서 import해야 함)
grep -rn "import.*\(DataScopeType\|resolveDataScope\|AUDIT_LOG_SCOPE\|FeatureScopePolicy\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/shared-constants\|node_modules\|// "
```

**PASS 기준:** 모든 데이터 스코프 임포트가 `@equipment-management/shared-constants`에서.

**FAIL 기준:** 로컬에서 정의하거나 다른 패키지에서 임포트 시 위반.

### Step 3e: Audit Log SSOT 상수 임포트 확인

감사 로그 활동 매핑 상수가 올바른 패키지에서 임포트되는지 확인합니다.

```bash
# AUDIT_TO_ACTIVITY_TYPE, RENTAL_ACTIVITY_TYPE_OVERRIDES import 소스 확인 (schemas에서 import해야 함)
grep -rn "import.*\(AUDIT_TO_ACTIVITY_TYPE\|RENTAL_ACTIVITY_TYPE_OVERRIDES\)" apps/backend/src apps/frontend --include="*.ts" --include="*.tsx" | grep -v "@equipment-management/schemas\|node_modules\|// "
```

**PASS 기준:** 모든 audit-log 상수 임포트가 `@equipment-management/schemas`에서.

**FAIL 기준:** 로컬에서 재정의하거나 다른 패키지에서 임포트 시 위반.

**참고:** Architecture v3에서 추가된 SSOT 상수:

- `AUDIT_TO_ACTIVITY_TYPE` — `{action}:{entityType}` → 프론트엔드 활동 타입 매핑 (예: `'create:equipment'` → `'equipment_added'`)
- `RENTAL_ACTIVITY_TYPE_OVERRIDES` — checkout purpose가 'rental'일 때 활동 타입 오버라이드 (예: `'checkout_created'` → `'rental_created'`)

### Step 4: 하드코딩된 API 경로 탐지

API 경로가 상수 대신 문자열로 하드코딩되어 있는지 확인합니다.

```bash
# 하드코딩된 API 경로 탐지 (API 클라이언트 파일)
grep -rn "'/api/" apps/frontend/lib/api --include="*.ts" | grep -v "API_ENDPOINTS\|baseURL\|// \|test\|mock"
```

**PASS 기준:** API 클라이언트에서 하드코딩된 경로가 없어야 함 (API_ENDPOINTS 사용).

### Step 5: queryKeys 팩토리 사용 확인

쿼리 키가 팩토리에서 생성되는지 확인합니다.

```bash
# 하드코딩된 queryKey 탐지
grep -rn "queryKey:\s*\['" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "query-config\|queryKeys\|// "
```

**PASS 기준:** 모든 queryKey가 `queryKeys` 팩토리를 통해 생성.

**FAIL 기준:** `queryKey: ['equipment', 'detail']` 같은 하드코딩 문자열 배열이 발견되면 위반.

### Step 6: Icon Library 통합 확인

프로젝트 표준 icon library(lucide-react) 준수 여부를 확인합니다.

```bash
# react-icons 사용 탐지 (deprecated)
grep -rn "from 'react-icons" apps/frontend --include="*.tsx" --include="*.ts"
```

```bash
# react-icons 의존성 확인
grep "react-icons" apps/frontend/package.json
```

```bash
# lucide-react가 아닌 icon library import 탐지
grep -rn "import.*Icon.*from" apps/frontend --include="*.tsx" --include="*.ts" | grep -v "lucide-react\|@radix-ui\|next/\|react\|// \|type\|node_modules"
```

**PASS 기준:**

- react-icons 사용 없음 (0개 결과)
- package.json에서 react-icons 의존성 제거
- 모든 icon은 lucide-react에서 임포트

**FAIL 기준:**

- react-icons import 발견 → lucide-react로 변경 필요
- package.json에 react-icons 의존성 존재 → 제거 필요
- 비표준 icon library 사용 → lucide-react로 통합 필요

**표준 패턴:**

```typescript
// ✅ CORRECT - lucide-react 사용
import { Package, CheckCircle2, AlertCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ❌ WRONG - react-icons 사용
import { FiBox, FiCheckCircle } from 'react-icons/fi';
import type { IconType } from 'react-icons';
```

### Step 7: Frontend 환경변수 직접 참조 탐지

`process.env.NEXT_PUBLIC_API_URL`을 직접 참조하는 코드가 있는지 확인합니다. 모든 API base URL은 `lib/config/api-config.ts`의 `API_BASE_URL`을 통해 참조해야 합니다.

```bash
# process.env.NEXT_PUBLIC_API_URL 직접 참조 탐지 (E2E 테스트 파일 제외)
grep -rn "process\.env\.NEXT_PUBLIC_API_URL" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "api-config.ts\|node_modules\|tests/e2e\|// "
```

**PASS 기준:** 0개 결과 (`lib/config/api-config.ts`와 `tests/e2e/` 제외 모든 파일에서 직접 참조 없음).

**FAIL 기준:** `api-config.ts` 외 파일에서 직접 참조 시 다음으로 변경 필요:

```typescript
// ❌ WRONG — 직접 환경변수 참조
const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ✅ CORRECT — SSOT에서 import
import { API_BASE_URL } from '@/lib/config/api-config';
const url = API_BASE_URL;
```

**참고:** `lib/config/api-config.ts`가 `API_BASE_URL` SSOT. `lib/config/dashboard-config.ts`가 역할별 대시보드 Config SSOT (`DASHBOARD_ROLE_CONFIG`, `DEFAULT_ROLE`, `DEFAULT_TAB`, `LEGACY_TAB_MAP`).

### Step 7b: E2E 테스트 Backend URL SSOT 확인

E2E 테스트 파일에서 `process.env.NEXT_PUBLIC_API_URL`을 직접 사용하는 경우, `BASE_URLS.BACKEND` (`shared-test-data.ts`)를 통해 참조해야 합니다.

```bash
# E2E 테스트 내 직접 환경변수 참조 탐지 (shared-test-data.ts는 SSOT이므로 제외)
grep -rn "process\.env\.NEXT_PUBLIC_API_URL" apps/frontend/tests/e2e --include="*.ts" --include="*.tsx" | grep -v "shared-test-data.ts\|node_modules\|// "
```

**PASS 기준:** 0개 결과 (모든 E2E 파일은 `BASE_URLS.BACKEND`를 import해서 사용).

**FAIL 기준:** `shared-test-data.ts` 외 E2E 파일에서 직접 참조 시 다음으로 변경 필요:

```typescript
// ❌ WRONG — E2E 테스트에서 직접 환경변수 참조
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ✅ CORRECT — shared-test-data.ts SSOT 사용
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
const BACKEND_URL = BASE_URLS.BACKEND;
```

### Step 8: 서비스 메서드의 `Promise<unknown>` 안티패턴 탐지

서비스 메서드의 반환 타입이 `Promise<unknown>`으로 선언되어 있으면, 호출자가 타입 단언(`as Type`) 없이는 결과를 안전하게 사용할 수 없습니다. 반환 타입은 Drizzle `$inferSelect` 또는 `Pick<$inferSelect, ...>`으로 파생된 구체적 타입이어야 합니다.

```bash
# 서비스 메서드의 Promise<unknown> 반환 타입 탐지
grep -rn "): Promise<unknown>" apps/backend/src/modules --include="*.service.ts" | grep -v "//\|spec\|test"
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** 서비스 메서드에 `Promise<unknown>` 반환 타입이 있으면 위반.

**수정 패턴:**

```typescript
// ❌ WRONG — TypeScript가 호출자에게 타입 정보를 전달 못함
async findOne(uuid: string): Promise<unknown> {
  return this.cacheService.getOrSet(cacheKey, async () => { ... });
}

// ✅ CORRECT — Drizzle $inferSelect 기반 SSOT 타입 사용
// 1. 모듈 *.types.ts 파일에 타입 정의 (Pick<typeof table.$inferSelect, keys>)
// 2. getOrSet<ConcreteType>()으로 제네릭 명시
async findOne(uuid: string): Promise<CalibrationPlanDetail> {
  return this.cacheService.getOrSet<CalibrationPlanDetail>(cacheKey, async () => { ... });
}
```

**참고 — 모듈 타입 파일 패턴:**

```typescript
// apps/backend/src/modules/{feature}/{feature}.types.ts
import type { featureTable } from '@equipment-management/db/schema/{feature}';

// 하드코딩 금지 — $inferSelect + Pick으로 DB 스키마에서 도출
export type FeatureDetail = typeof featureTable.$inferSelect & {
  items: FeatureItemDetail[];
};
```

### Step 9: 인증 토큰 TTL 하드코딩 탐지

토큰 라이프사이클 상수(`ABSOLUTE_SESSION_MAX_AGE_SECONDS`, `ACCESS_TOKEN_TTL_SECONDS` 등)가
`@equipment-management/shared-constants`에서 임포트되지 않고 auth/session 파일에 직접 하드코딩되어 있는지 확인합니다.

```bash
# auth/session 관련 파일의 토큰 TTL 하드코딩 탐지 (JWT expiresIn 문자열 포함)
grep -rn "expiresIn.*['\"]15m['\"]\\|expiresIn.*['\"]7d['\"]\\|30 \\* 24 \\* 60 \\* 60[^*]\\|15 \\* 60[^*]\\|7 \\* 24 \\* 60 \\* 60[^*]" \
  apps/frontend/lib/auth.ts apps/frontend/lib/auth \
  apps/backend/src/modules/auth \
  --include="*.ts" \
  | grep -v "LOCK_DURATION\\|ATTEMPT_WINDOW\\|shared-constants\\|auth-token\\.ts\\|// "
```

**PASS 기준:** 0개 결과 (auth/session 파일에 토큰 TTL 하드코딩 없음).

**FAIL 기준:** `'15m'`, `'7d'`, `30 * 24 * 60 * 60` 등이 직접 코드에 있으면 위반.

**수정 패턴:**

```typescript
// ❌ WRONG — auth 파일에 TTL 하드코딩
const ABSOLUTE_SESSION_MAX_AGE = 30 * 24 * 60 * 60;
expiresIn: '15m';

// ✅ CORRECT — shared-constants에서 임포트
import {
  ABSOLUTE_SESSION_MAX_AGE_SECONDS,
  ACCESS_TOKEN_EXPIRES_IN,
} from '@equipment-management/shared-constants';
expiresIn: ACCESS_TOKEN_EXPIRES_IN; // '900s'
```

**참고 — auth-token.ts SSOT 상수 목록 (`packages/shared-constants/src/auth-token.ts`):**

- `ACCESS_TOKEN_TTL_SECONDS` — 900s (15분)
- `REFRESH_TOKEN_TTL_SECONDS` — 604800s (7일)
- `ABSOLUTE_SESSION_MAX_AGE_SECONDS` — 2592000s (30일)
- `REFRESH_BUFFER_SECONDS` — 60s (선제 갱신 버퍼)
- `ACCESS_TOKEN_EXPIRES_IN` — `'900s'` (NestJS JwtModule용)
- `REFRESH_TOKEN_EXPIRES_IN` — `'604800s'` (NestJS JwtModule용)

```bash
# 로컬 재정의 추가 탐지: ABSOLUTE_SESSION_MAX_AGE, accessTokenExpiresInSeconds 패턴
grep -rn "ABSOLUTE_SESSION_MAX_AGE\s*=\|accessTokenExpiresInSeconds\s*=" \
  apps/frontend apps/backend/src \
  --include="*.ts" \
  | grep -v "shared-constants\\|auth-token\\.ts\\|import\\|// "
```

**PASS 기준:** 0개 결과.

### Step 10: SITE_VALUES 로컬 재정의 탐지

`SITE_VALUES`(또는 `Site[]` 타입의 로컬 배열 상수)가 `@equipment-management/schemas`에서 임포트되지 않고 컴포넌트/유틸리티에 하드코딩되어 있는지 확인합니다. `SiteEnum.options`에서 자동 도출되는 `SITE_VALUES`는 schemas 패키지의 SSOT입니다.

```bash
# Site[] 타입의 로컬 배열 선언 탐지 (schemas import 제외)
grep -rn "Site\[\]\s*=\s*\[" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// "
```

```bash
# SITE_VALUES 로컬 상수 선언 탐지
grep -rn "const SITE_VALUES\s*[=:]" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "node_modules\|// "
```

**PASS 기준:** 0개 결과.

**FAIL 기준:** `SITE_VALUES` 또는 `Site[]` 타입 배열이 컴포넌트/훅/유틸리티에서 직접 선언되면 위반.

**수정 패턴:**

```typescript
// ❌ WRONG — 로컬 하드코딩 (EquipmentFilters.tsx 등)
const SITE_VALUES: Site[] = ['suwon', 'uiwang', 'pyeongtaek'];

// ✅ CORRECT — schemas SSOT에서 import
import { SITE_VALUES } from '@equipment-management/schemas';
// SITE_VALUES = SiteEnum.options (자동 파생, 추가 사이트 시 자동 반영)
```

**참고:** UI 표시용 `SITE_OPTIONS: { value: Site, label: string }[]` (레이블 포함 객체 배열)은 로컬 정의 허용. 순수 값 배열(`Site[]`)만 schemas에서 import해야 합니다.

### Step 11: PAGE_SIZE_OPTIONS 로컬 재정의 탐지

`PAGE_SIZE_OPTIONS`가 `@/lib/config/pagination`에서 임포트되지 않고 컴포넌트에서 직접 선언되어 있는지 확인합니다.

```bash
# PAGE_SIZE_OPTIONS 로컬 상수 선언 탐지
grep -rn "const PAGE_SIZE_OPTIONS\s*[=:]" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "pagination\.ts\|node_modules\|// "
```

```bash
# PAGE_SIZE_OPTIONS 올바른 import 확인
grep -rn "PAGE_SIZE_OPTIONS" apps/frontend --include="*.ts" --include="*.tsx" | grep -v "pagination\.ts\|node_modules\|// "
```

**PASS 기준:** `PAGE_SIZE_OPTIONS` 사용 파일 모두 `@/lib/config/pagination`에서 import.

**FAIL 기준:** `pagination.ts` 외 파일에 `const PAGE_SIZE_OPTIONS = [...]` 직접 선언 시 위반.

**수정 패턴:**

```typescript
// ❌ WRONG — 컴포넌트 내 하드코딩
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// ✅ CORRECT — pagination SSOT에서 import
import { PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE } from '@/lib/config/pagination';
// type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]; // 10 | 20 | 50 | 100
```

**참고 — pagination.ts SSOT 상수 (`apps/frontend/lib/config/pagination.ts`):**

- `PAGE_SIZE_OPTIONS` — `[10, 20, 50, 100] as const`
- `PageSizeOption` — `10 | 20 | 50 | 100` (추론 타입)
- `DEFAULT_PAGE_SIZE` — `20` (기본값)

## Output Format

```markdown
| #   | 검사                          | 상태      | 상세                                   |
| --- | ----------------------------- | --------- | -------------------------------------- |
| 1   | 로컬 타입 재정의              | PASS/FAIL | 재정의 위치 목록                       |
| 2   | Permission 임포트             | PASS/FAIL | 잘못된 임포트 위치                     |
| 3   | API_ENDPOINTS 임포트          | PASS/FAIL | 잘못된 임포트 위치                     |
| 3a  | Audit Log 타입 임포트         | PASS/FAIL | 잘못된 임포트 위치                     |
| 3b  | Field Labels 임포트           | PASS/FAIL | 잘못된 임포트 위치                     |
| 3c  | Entity Routes 임포트          | PASS/FAIL | 잘못된 임포트 위치                     |
| 3d  | Data Scope 임포트             | PASS/FAIL | 잘못된 임포트 위치                     |
| 3e  | Audit Log SSOT 상수           | PASS/FAIL | 잘못된 임포트 위치                     |
| 4   | 하드코딩 API 경로             | PASS/FAIL | 하드코딩 위치 목록                     |
| 5   | queryKeys 팩토리              | PASS/FAIL | 하드코딩 queryKey 위치                 |
| 6   | Icon Library 통합             | PASS/FAIL | react-icons 사용, 비표준 library 위치  |
| 7   | 환경변수 직접 참조            | PASS/FAIL | NEXT_PUBLIC_API_URL 직접 참조 위치     |
| 7b  | E2E Backend URL SSOT          | PASS/FAIL | E2E 내 직접 env 참조 파일 목록         |
| 8   | Promise<unknown> 반환 타입    | PASS/FAIL | 서비스 메서드의 unknown 반환 타입 위치 |
| 9   | 토큰 TTL 하드코딩             | PASS/FAIL | auth 파일 내 하드코딩 위치             |
| 10  | SITE_VALUES 로컬 재정의       | PASS/FAIL | Site[] 로컬 선언 위치                  |
| 11  | PAGE_SIZE_OPTIONS 로컬 재정의 | PASS/FAIL | pagination.ts 외 직접 선언 위치        |
```

## Exceptions

다음은 **위반이 아닙니다**:

1. **프론트엔드 UI 표시용 옵션 객체** — `SITE_OPTIONS: { value: Site, label: string }[]`, `CLASSIFICATION_OPTIONS` 등 레이블+값 쌍의 UI 표시용 객체 배열은 로컬 정의 허용. 단, 순수 값 배열(`SITE_VALUES: Site[]`)은 `@equipment-management/schemas`에서 import 필수.
2. **packages/ 디렉토리 내 정의** — 패키지 자체에서의 타입 정의는 SSOT의 원본이므로 정상
3. **테스트 파일의 mock 타입** — 테스트에서 사용하는 mock 타입 정의는 허용
4. **re-export 파일** — `export type { UserRole } from '@equipment-management/schemas'` 같은 재내보내기는 위반 아님
5. **NestJS Swagger DTO** — 백엔드 응답 DTO에서 Swagger 문서화용 class 정의는 허용 (enum 재정의가 아닌 경우)
6. **백엔드 DTO의 re-export** — `export { DEFAULT_SYSTEM_SETTINGS, type SystemSettings } from '@equipment-management/schemas'` 같은 re-export는 SSOT 소비자이므로 정상
7. **roles.enum.ts의 TypeScript enum** — 백엔드 호환성을 위한 로컬 enum (SSOT 주석 + re-export 동반 시 면제)
8. **`Promise<unknown>` 허용 케이스** — `private` 헬퍼 메서드(클래스 내부 전용)나 단순 delete/count 반환(`Promise<number>`, `{ deleted: true }`)은 `unknown`이 아닌 추론 타입을 사용하는 한 면제. `Promise<unknown>`은 `public` 메서드에서만 위반으로 간주.
9. **`shared-test-data.ts`의 `BACKEND` URL 직접 정의** — `tests/e2e/shared/constants/shared-test-data.ts`는 E2E 테스트용 URL SSOT이므로 `process.env.NEXT_PUBLIC_API_URL` 직접 참조가 정상. 다른 E2E 파일은 `BASE_URLS.BACKEND`를 import해서 사용해야 함
10. **테스트 파일의 날짜 오프셋 계산** — E2E/단위 테스트 파일에서 `7 * 24 * 60 * 60 * 1000` (밀리초 단위) 형태로 체크아웃 `expectedReturnDate` 등 날짜를 계산하는 코드는 토큰 TTL과 무관하므로 Step 9 위반이 아님
