# SSOT File Map (Full Reference)

## Related Files

| File                                                                         | Purpose                                                                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `packages/db/src/schema/audit-logs.ts`                                       | DB enum 배열 (auditAction, auditEntityType — schemas와 동기화 필수)                                       |
| `packages/db/src/index.ts`                                                   | AppDatabase SSOT 타입 (NodePgDatabase 직접 import 금지)                                                   |
| `packages/schemas/src/enums.ts`                                              | SSOT enum 정의 (EquipmentStatus, CheckoutStatus 등)                                                       |
| `packages/schemas/src/errors.ts`                                             | SSOT ErrorCode enum + errorCodeToStatusCode 매핑                                                          |
| `packages/schemas/src/user.ts`                                               | UserRole 타입 정의                                                                                        |
| `packages/schemas/src/settings.ts`                                           | SSOT 설정 타입/기본값 (SystemSettings, DisplayPreferences)                                                |
| `packages/schemas/src/audit-log.ts`                                          | SSOT 감사 로그 타입 (AuditAction, AuditEntityType, AuditLogDetails)                                       |
| `packages/schemas/src/field-labels.ts`                                       | SSOT 필드 라벨 (FIELD_LABELS, getFieldLabel)                                                              |
| `packages/schemas/src/index.ts`                                              | schemas 패키지 내보내기                                                                                   |
| `packages/schemas/src/validation/messages.ts`                                | VM (Validation Messages) SSOT — 전체 DTO 검증 메시지 중앙 관리                                            |
| `packages/schemas/src/utils/fields.ts`                                       | SSOT 폼 안전 UUID 유틸리티 (optionalUuid, nullableOptionalUuid — HTML 빈 문자열 변환)                     |
| `packages/schemas/src/api-response.ts`                                       | ApiResponse 타입 SSOT (로컬 재정의 금지)                                                                  |
| `packages/shared-constants/src/permissions.ts`                               | Permission enum 정의                                                                                      |
| `packages/shared-constants/src/api-endpoints.ts`                             | API_ENDPOINTS 상수                                                                                        |
| `packages/shared-constants/src/entity-routes.ts`                             | SSOT 엔티티 라우팅 (ENTITY_ROUTES, getEntityRoute)                                                        |
| `packages/shared-constants/src/data-scope.ts`                                | SSOT 데이터 스코프 (DataScopeType, resolveDataScope, \*\_DATA_SCOPE 정책 + INTERMEDIATE_CHECK_DATA_SCOPE) |
| `packages/shared-constants/src/permission-categories.ts`                     | SSOT 권한 카테고리 그룹핑 (PERMISSION_CATEGORIES, PERMISSION_CATEGORY_KEYS)                               |
| `packages/shared-constants/src/index.ts`                                     | shared-constants 패키지 내보내기                                                                          |
| `packages/shared-constants/src/auth-token.ts`                                | SSOT 인증 토큰 라이프사이클 + 세션 동작 상수 (TTL, idle timeout, session sync)                            |
| `packages/shared-constants/src/approval-kpi.ts`                              | SSOT 승인 KPI 임계값 (URGENT_THRESHOLD_DAYS, WARNING_THRESHOLD_DAYS)                                      |
| `packages/shared-constants/src/approval-categories.ts`                       | SSOT 승인 카테고리 및 역할별 매핑 (APPROVAL_CATEGORIES, ROLE_APPROVAL_SCOPES)                             |
| `packages/shared-constants/src/business-rules.ts`                            | SSOT 비즈니스 규칙 상수 (UL-QP-18 절차서 기반 운영 규칙)                                                  |
| `packages/shared-constants/src/notification-config.ts`                       | SSOT 알림 설정 상수 (NOTIFICATION_CONFIG — 만료, 배치 처리 등) + SSE_APPROVAL_CHANGED_SENTINEL             |
| `apps/backend/src/modules/notifications/events/notification-events.ts`       | SSOT 이벤트명→알림타입 매핑 (EVENT_TO_NOTIFICATION_TYPE — 모듈 로드 시 NOTIFICATION_TYPE_VALUES 교차 검증) |
| `packages/shared-constants/src/security.ts`                                  | SSOT 보안 상수 (SECURITY — 로그인 제한, 잠금 정책 등)                                                     |
| `packages/db/src/schema/calibration-plans.ts`                                | DB 스키마 rejectionStage (REJECTION_STAGE_VALUES SSOT import 필수)                                        |
| `apps/frontend/lib/api/query-config.ts`                                      | queryKeys 팩토리 (countsAll prefix 키 포함)                                                               |
| `apps/frontend/lib/api/cache-invalidation.ts`                                | 캐시 무효화 SSOT (CheckoutCacheInvalidation 등)                                                           |
| `apps/frontend/lib/config/api-config.ts`                                     | SSOT API_BASE_URL (`process.env.NEXT_PUBLIC_API_URL` 직접 참조 금지)                                      |
| `apps/frontend/lib/config/dashboard-config.ts`                               | SSOT 역할별 대시보드 Config (DASHBOARD_ROLE_CONFIG, DEFAULT_ROLE)                                         |
| `apps/frontend/lib/config/pagination.ts`                                     | SSOT 페이지네이션 상수 (PAGE_SIZE_OPTIONS, DEFAULT_PAGE_SIZE — 로컬 재정의 금지)                          |
| `apps/frontend/lib/navigation/nav-config.ts`                                 | SSOT 네비게이션 설정 (NavItemConfig, FRONTEND_ROUTES, Permission 기반 필터링)                             |
| `apps/frontend/lib/utils/dashboard-scope.ts`                                 | SSOT 대시보드 스코프 유틸리티 (DashboardScope, resolveDashboardScope, buildScopedEquipmentUrl)            |
| `apps/frontend/lib/errors/equipment-errors.ts`                               | 프론트엔드 에러 코드 매핑 (ErrorCode <-> EquipmentErrorCode, mapBackendErrorCode)                        |
| `apps/frontend/tests/e2e/shared/constants/shared-test-data.ts`               | E2E 테스트 URL SSOT (`BASE_URLS.BACKEND`, `BASE_URLS.FRONTEND`)                                           |
| `apps/frontend/components/dashboard/StatsCard.tsx`                           | lucide-react 타입 참조 (LucideIcon)                                                                       |
| `apps/backend/src/common/cache/cache-key-prefixes.ts`                        | SSOT 캐시 키 프리픽스 (CACHE_KEY_PREFIXES — 서비스/레지스트리/헬퍼 공유)                                  |
| `apps/backend/src/modules/calibration-plans/calibration-plans.types.ts`      | Drizzle `$inferSelect` 기반 모듈 타입 SSOT (CalibrationPlanDetail 등)                                     |
| `apps/backend/src/modules/equipment-imports/types/equipment-import.types.ts` | Drizzle `$inferSelect` 기반 모듈 타입 SSOT                                                                |
| `apps/backend/src/modules/equipment/utils/request-data-codec.ts`             | requestData 직렬화/역직렬화 코덱 (JSON<->DTO 변환 SSOT)                                                  |
| `apps/backend/src/modules/equipment/equipment.service.ts`                    | DTO->Entity 매핑 (getTableColumns 기반 동적 컬럼 추출)                                                    |

## Extended Examples

### Step 7: Environment Variable Fix Pattern

```typescript
// ❌ WRONG — 직접 환경변수 참조
const url = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

// ✅ CORRECT — SSOT에서 import
import { API_BASE_URL } from '@/lib/config/api-config';
const url = API_BASE_URL;
```

**참고:** `lib/config/api-config.ts`가 `API_BASE_URL` SSOT. `lib/config/dashboard-config.ts`가 역할별 대시보드 Config SSOT (`DASHBOARD_ROLE_CONFIG`, `DEFAULT_ROLE`, `DEFAULT_TAB`, `LEGACY_TAB_MAP`).

### Step 7b: E2E Backend URL Fix Pattern

```typescript
// ❌ WRONG — E2E 테스트에서 직접 환경변수 참조
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// ✅ CORRECT — shared-test-data.ts SSOT 사용
import { BASE_URLS } from '../../../shared/constants/shared-test-data';
const BACKEND_URL = BASE_URLS.BACKEND;
```

### Step 8: AppDatabase Fix Pattern

```typescript
// ❌ WRONG — 드라이버 직접 의존 (드라이버 변경 시 모든 서비스 수정 필요)
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '@equipment-management/db';
constructor(@Inject('DATABASE') private db: NodePgDatabase<typeof schema>) {}

// ✅ CORRECT — SSOT 추상화 타입 사용
import type { AppDatabase } from '@equipment-management/db';
constructor(@Inject('DATABASE') private db: AppDatabase) {}
```

**참고:** `AppDatabase` 타입은 `packages/db/src/index.ts`에서 `NodePgDatabase<typeof schema>`로 정의됨. DB 드라이버 변경 시 한 곳만 수정하면 됨.

### Step 9a: Promise<unknown> Fix Pattern

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

### Step 9b: Token TTL Fix Pattern

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

### Step 10: SITE_VALUES Fix Pattern

```typescript
// ❌ WRONG — 로컬 하드코딩 (EquipmentFilters.tsx 등)
const SITE_VALUES: Site[] = ['suwon', 'uiwang', 'pyeongtaek'];

// ✅ CORRECT — schemas SSOT에서 import
import { SITE_VALUES } from '@equipment-management/schemas';
// SITE_VALUES = SiteEnum.options (자동 파생, 추가 사이트 시 자동 반영)
```

**참고:** UI 표시용 `SITE_OPTIONS: { value: Site, label: string }[]` (레이블 포함 객체 배열)은 로컬 정의 허용. 순수 값 배열(`Site[]`)만 schemas에서 import해야 합니다.

### Step 11a: Cache Key Fix Pattern

```typescript
// ❌ WRONG — 하드코딩 캐시 키
private readonly CACHE_PREFIX = 'equipment:';
const cacheKey = `dashboard:summary:${site}`;
patterns: [{ pattern: 'checkout:*' }],

// ✅ CORRECT — SSOT에서 import
import { CACHE_KEY_PREFIXES } from '../../common/cache/cache-key-prefixes';
private readonly CACHE_PREFIX = CACHE_KEY_PREFIXES.EQUIPMENT;
const cacheKey = `${CACHE_KEY_PREFIXES.DASHBOARD}summary:${site}`;
patterns: [{ pattern: `${CACHE_KEY_PREFIXES.CHECKOUTS}*` }],
```

### Step 11e: APPROVAL_KPI Fix Pattern

See `packages/shared-constants/src/approval-kpi.ts` for SSOT values.

### Step 11f: Shared Constants Fix Pattern

```typescript
// ❌ WRONG — 로컬 하드코딩
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

// ✅ CORRECT — shared-constants에서 import
import { SECURITY } from '@equipment-management/shared-constants';
const { MAX_LOGIN_ATTEMPTS, LOCK_DURATION_MS, ATTEMPT_WINDOW_MS } = SECURITY;
```

### Step 11g: REJECTION_STAGE_VALUES Fix Pattern

```typescript
// ❌ WRONG — 로컬 하드코딩
export const rejectionStage = ['review', 'approval'] as const;

// ✅ CORRECT — schemas SSOT에서 import
import { REJECTION_STAGE_VALUES } from '@equipment-management/schemas';
export const rejectionStage = REJECTION_STAGE_VALUES;
```

### Step 11h: ErrorCode Mapping Pattern

```typescript
// apps/frontend/lib/errors/equipment-errors.ts

// 1. EquipmentErrorCode enum에 추가
enum EquipmentErrorCode {
  // ...
  SCOPE_ACCESS_DENIED = 'SCOPE_ACCESS_DENIED',
}

// 2. mapBackendErrorCode에 매핑 추가
const backendCodeMap: Record<string, EquipmentErrorCode> = {
  // ...
  SCOPE_ACCESS_DENIED: EquipmentErrorCode.SCOPE_ACCESS_DENIED,
};

// 3. ERROR_MESSAGES에 한국어 메시지 추가
[EquipmentErrorCode.SCOPE_ACCESS_DENIED]: {
  title: '접근 범위 초과',
  message: '해당 사이트/팀의 리소스에 대한 접근 권한이 없습니다.',
  solutions: [...],
  severity: 'error',
},
```

### Step 11 (PAGE_SIZE_OPTIONS): Fix Pattern

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

### Step 3e: Audit Log SSOT Constants

Architecture v3에서 추가된 SSOT 상수:

- `AUDIT_TO_ACTIVITY_TYPE` — `{action}:{entityType}` -> 프론트엔드 활동 타입 매핑 (예: `'create:equipment'` -> `'equipment_added'`)
- `RENTAL_ACTIVITY_TYPE_OVERRIDES` — checkout purpose가 'rental'일 때 활동 타입 오버라이드 (예: `'checkout_created'` -> `'rental_created'`)
