# CLAUDE.md - Equipment Management System

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this repository.
**UL-QP-18 (장비 관리 절차서)** 기반 장비 관리 시스템의 프로덕션급 개발 가이드입니다.

> 답변은 한국어로 해주세요.

## Build/Lint/Test Commands

```bash
# Development
pnpm dev                              # Start all services (frontend + backend)
pnpm --filter backend run dev         # Backend only (NestJS)
pnpm --filter frontend run dev        # Frontend only (Next.js)

# Build
pnpm build                            # Build all packages
pnpm --filter backend run build       # Build backend
pnpm --filter frontend run build      # Build frontend

# Type Checking
pnpm tsc --noEmit                     # Check all TypeScript
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# Lint
pnpm lint                             # Lint all packages
pnpm --filter backend run lint
pnpm --filter frontend run lint

# Tests
pnpm test                             # Run all tests
pnpm --filter backend run test        # Backend unit tests
pnpm --filter backend run test:e2e    # Backend E2E tests
pnpm --filter frontend run test       # Frontend tests
pnpm --filter frontend run test:e2e   # Playwright E2E tests

# Database
pnpm --filter backend run db:generate # Generate migration
pnpm --filter backend run db:migrate  # Run migrations
pnpm --filter backend run db:studio   # Open Drizzle Studio

# Docker (Infrastructure only)
docker compose up -d                  # Start PostgreSQL + Redis
docker compose down                   # Stop containers
```

## High-Level Architecture

```
equipment_management_system/
├── apps/
│   ├── backend/                 # NestJS API (Port 3001)
│   │   ├── src/
│   │   │   ├── modules/         # 18 Feature modules
│   │   │   ├── common/          # Shared: guards, pipes, filters, interceptors, decorators, cache
│   │   │   └── database/        # Drizzle ORM setup
│   │   └── test/                # E2E tests
│   │
│   └── frontend/                # Next.js 16 App Router (Port 3000)
│       ├── app/                 # Route handlers and pages
│       │   ├── (auth)/          # Auth routes (login)
│       │   ├── (dashboard)/     # Dashboard routes (protected)
│       │   └── api/             # API routes (NextAuth)
│       ├── components/          # React components (feature-grouped)
│       ├── hooks/               # Custom React hooks
│       └── lib/                 # API clients, errors, utilities
│
├── packages/                    # Dependency chain: schemas ← shared-constants, schemas ← db
│   ├── db/                      # Shared Drizzle schema
│   ├── schemas/                 # Shared Zod schemas + enums (SSOT)
│   └── shared-constants/        # Permissions, API endpoints
│                                # Note: Shared UI components use shadcn/ui directly in apps/frontend/components/ui/
│
└── docs/
    └── development/             # Development guides
```

### Backend Modules (18)

| Module | Path | Description |
|---|---|---|
| `approvals` | `modules/approvals/` | 통합 승인 관리 (1-step, 2-step, 3-step) |
| `audit` | `modules/audit/` | 감사 로그 |
| `auth` | `modules/auth/` | JWT + Azure AD, Guards, RBAC |
| `calibration` | `modules/calibration/` | 교정 기록 관리 |
| `calibration-factors` | `modules/calibration-factors/` | 교정 인자 관리 |
| `calibration-plans` | `modules/calibration-plans/` | 교정 계획 (3단계 승인) |
| `checkouts` | `modules/checkouts/` | 반출 관리 (교정/수리/렌탈) |
| `dashboard` | `modules/dashboard/` | 대시보드 통계 |
| `equipment` | `modules/equipment/` | 장비 CRUD + 폐기 + 수리이력 |
| `equipment-imports` | `modules/equipment-imports/` | 장비 반입 (구 rental-imports) |
| `monitoring` | `modules/monitoring/` | 시스템 모니터링 |
| `non-conformances` | `modules/non-conformances/` | 부적합 관리 |
| `notifications` | `modules/notifications/` | 알림 서비스 |
| `reports` | `modules/reports/` | 리포트 생성 |
| `settings` | `modules/settings/` | 시스템/교정 설정 관리 |
| `software` | `modules/software/` | 소프트웨어 관리 |
| `teams` | `modules/teams/` | 팀 관리 |
| `users` | `modules/users/` | 사용자 관리 |

### Ports

| Service | Port |
|---|---|
| Frontend | 3000 |
| Backend | 3001 |
| PostgreSQL | 5432 |
| Redis | 6379 |

---

## Behavioral Guidelines (코딩 전 행동 원칙)

**이 원칙은 모든 기술 규칙보다 우선합니다. 위반 시 불필요한 재작업과 사이드 이펙트 발생.**

### Guideline 1: 코딩 전에 생각하기

**가정을 숨기지 않는다. 혼란을 감추지 않는다. 트레이드오프를 표면에 드러낸다.**

구현 전 확인 사항:
- 상태 변경이 수반되는가? → CAS(`version` 필드) 필요 여부 먼저 판단
- 여러 해석이 가능하면 **조용히 하나를 선택하지 말고** 선택지를 제시
- 더 단순한 접근법이 있으면 말한다. 필요 시 반론을 제기한다
- 불명확하면 멈추고, **무엇이 불명확한지** 명시한 뒤 질문한다

```
// 판단 체크리스트
1. 이 변경에 CAS가 필요한가? → VersionedBaseService + versionedSchema
2. 캐시 무효화 전략은? → CacheInvalidationHelper 교차 무효화
3. 어떤 역할이 이 기능에 접근하는가? → @RequirePermissions
4. 프론트엔드 상태는 어디서 관리하는가? → TanStack Query (useState 금지)
```

### Guideline 2: 최소 코드 원칙

**요청된 문제를 해결하는 최소한의 코드만 작성한다. 추측성 코드 금지.**

- 요청되지 않은 기능, 추상화, "유연성", "설정 가능성"을 추가하지 않는다
- 불가능한 시나리오에 대한 에러 핸들링을 넣지 않는다
- 한 번만 사용되는 코드에 헬퍼/유틸리티를 만들지 않는다
- 200줄로 짠 것이 50줄로 가능하면 다시 작성한다

```typescript
// ❌ 과잉 — 한 번만 쓰는 타입 변환에 유틸리티 생성
function formatCheckoutForDisplay(checkout: Checkout): DisplayCheckout { ... }
const formatted = formatCheckoutForDisplay(checkout);

// ✅ 최소 — 인라인으로 충분
const displayData = { ...checkout, statusLabel: STATUS_LABELS[checkout.status] };
```

**프로젝트 특화 함정:**
- `useOptimisticMutation`의 `onSuccess`에서 `setQueryData` 호출 금지 (TData ≠ TCachedData 75%)
- Drizzle ORM에서 correlated subquery 대신 JOIN + GROUP BY 사용 (subquery는 0 반환)
- 필터 상태를 `useState`로 이중 관리하지 않는다 (URL 파라미터가 SSOT)

### Guideline 3: 수술적 변경 (Surgical Changes)

**변경한 부분만 건드린다. 자기가 만든 잔여물만 정리한다.**

기존 코드 편집 시:
- 인접 코드의 "개선", 주석 추가, 포맷팅 변경 금지
- 고장나지 않은 것을 리팩토링하지 않는다
- 기존 스타일에 맞춘다 (더 좋은 방법을 알아도)
- 관련 없는 데드 코드를 발견하면 **언급만** 하고 삭제하지 않는다

자신의 변경으로 인한 잔여물:
- 자신의 변경이 만든 미사용 import/변수/함수는 제거한다
- 기존에 있던 데드 코드는 요청 없이 제거하지 않는다

**검증:** 변경된 모든 라인이 사용자 요청에 직접 매핑되어야 한다.

### Guideline 4: 목표 기반 실행

**성공 기준을 정의하고, 검증될 때까지 반복한다.**

작업을 검증 가능한 목표로 변환:

```
"유효성 검사 추가" → "잘못된 입력 테스트 작성 → 통과시키기"
"버그 수정"       → "재현 테스트 작성 → 통과시키기"
"리팩토링"        → "기존 테스트 통과 확인 → 변경 → 재확인"
```

다단계 작업 시 검증 계획 명시:

```
1. [단계] → 검증: pnpm tsc --noEmit (타입 에러 0)
2. [단계] → 검증: pnpm --filter backend run test (관련 스위트)
3. [단계] → 검증: 브라우저에서 해당 페이지 동작 확인
```

**명확한 성공 기준 = 독립적 반복 가능. 모호한 기준("되게 만들기") = 매번 확인 필요.**

---

## CRITICAL Rules (위반 시 프로덕션 버그)

### Rule 0: SSOT (Single Source of Truth)

**Shared types and constants MUST be imported from packages, not redefined.**

```typescript
// ✅ CORRECT
import { UserRole, EquipmentStatus, CheckoutStatus } from '@equipment-management/schemas';
import { Permission, API_ENDPOINTS } from '@equipment-management/shared-constants';

// ❌ WRONG - 로컬 재정의 금지
type UserRole = 'ADMIN' | 'USER' | 'MANAGER'; // Wrong values!
```

| Data Type | SSOT Package | Example |
|---|---|---|
| Enums (Status, Role) | `@equipment-management/schemas` | `EquipmentStatus`, `UserRole`, `CheckoutStatus` |
| Permissions | `@equipment-management/shared-constants` | `Permission.VIEW_EQUIPMENT` |
| API Endpoints | `@equipment-management/shared-constants` | `API_ENDPOINTS.EQUIPMENT.LIST` |
| Management Number | `@equipment-management/schemas` | `generateManagementNumber()` |
| Query Keys | `lib/api/query-config.ts` | `queryKeys.equipment.detail(id)` |
| Equipment Filters | `lib/utils/equipment-filter-utils.ts` | `parseEquipmentFiltersFromSearchParams()` |
| Error Codes | `lib/errors/equipment-errors.ts` | `EquipmentErrorCode.VERSION_CONFLICT` |

> **Frontend-specific UI options (SITE_OPTIONS, CLASSIFICATION_OPTIONS) are allowed locally.**

### Rule 1: Single Database Architecture

**THIS IS CRITICAL - DO NOT VIOLATE**

```
✅ CORRECT:
- Single DB: postgres_equipment (port 5432)
- DB commands: pnpm db:migrate
- Tests run on development DB

❌ NEVER SUGGEST:
- "테스트 DB와 개발 DB를 분리해야..."
- postgres_equipment_test (removed)
- localhost:5434 (not used)
```

### Rule 2: Server-Side User Extraction (Security)

**서버에서 userId를 추출해야 합니다. 클라이언트 body의 userId를 절대 신뢰하면 안 됩니다.**

```typescript
// ✅ CORRECT — JWT에서 추출
@Patch(':uuid/approve')
async approve(@Param('uuid') uuid: string, @Request() req: AuthenticatedRequest) {
  const approverId = req.user?.userId; // ← 서버에서 추출
}

// ❌ WRONG — 클라이언트 body 신뢰 금지
async approve(@Body() dto: { approverId: string }) {
  await this.service.approve(dto.approverId); // 위조 가능!
}
```

### Rule 3: TypeScript Strict (`any` 금지)

```typescript
// ❌ NEVER
const data: any = await fetch(...);

// ✅ Always use proper types
interface Equipment { id: string; name: string; }
const data: Equipment = await fetch(...).then(r => r.json());
```

### Rule 4: Next.js 16 Patterns

```typescript
// ✅ CORRECT - params/searchParams are Promise
export default async function Page(props: PageProps<'/equipment/[id]'>) {
  const { id } = await props.params;
  const equipment = await getEquipment(id);
  return <EquipmentDetailClient equipment={equipment} />;
}

// ❌ WRONG - Direct access without await
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>;
}
```

```typescript
// ✅ useActionState (React 19) — ❌ useFormState is deprecated
import { useActionState } from 'react';
```

---

## Concurrency Control (CAS / Optimistic Locking)

프로젝트의 핵심 아키텍처 패턴. DB → Backend → Frontend → Error 전 계층을 관통합니다.

### CAS 적용 엔티티

| Table | Service | Key File |
|---|---|---|
| equipment | EquipmentService | `modules/equipment/equipment.service.ts` |
| checkouts | CheckoutsService | `modules/checkouts/checkouts.service.ts` |
| calibrations | CalibrationService | `modules/calibration/calibration.service.ts` |
| non_conformances | NonConformancesService | `modules/non-conformances/non-conformances.service.ts` |
| disposal_requests | DisposalService | `modules/equipment/services/disposal.service.ts` |
| equipment_imports | EquipmentImportsService | `modules/equipment-imports/equipment-imports.service.ts` |
| equipment_requests | EquipmentService | `modules/equipment/equipment.service.ts` |
| software_history | SoftwareService | `modules/software/software.service.ts` |

### Backend CAS Pattern

**Base Class:** `VersionedBaseService` (`common/base/versioned-base.service.ts`)

```typescript
// 핵심 메서드
protected async updateWithVersion<T>(
  table, id: string, expectedVersion: number,
  updateData: Record<string, unknown>, entityName: string
): Promise<T>
// → UPDATE ... SET version = version + 1 WHERE id = ? AND version = ?
// → 0 rows affected? → 엔티티 없음(404) or 버전 충돌(409 + code: 'VERSION_CONFLICT')
```

**DTO Pattern:** `VersionedDto` (`common/dto/base-versioned.dto.ts`)

```typescript
// 모든 상태 변경 DTO는 version 필드 필수
export const versionedSchema = { version: z.number().int().positive() };
```

### Frontend CAS Error Chain

```
Backend 409 { code: 'VERSION_CONFLICT' }
  → mapBackendErrorCode('VERSION_CONFLICT')
    → EquipmentErrorCode.VERSION_CONFLICT
      → ERROR_MESSAGES[VERSION_CONFLICT] (한국어 메시지)
        → useOptimisticMutation.onError: invalidateQueries (서버 재검증)
```

### Cache Coherence

**CAS 실패(409) 시 반드시 detail 캐시 삭제** — 미삭제 시 stale cache로 재시도도 계속 409 발생.

```typescript
// Backend: updateCheckoutStatus의 catch 블록
catch (error) {
  if (error instanceof ConflictException) {
    this.cacheService.delete(detailCacheKey); // stale cache 방지
  }
  throw error;
}
```

---

## Backend Patterns

### DB Enum Column Policy

| Pattern | Use When | Tables |
|---|---|---|
| `pgEnum` | 값이 거의 변경되지 않는 핵심 enum | equipment_status, attachment_type, approval_status, request_type |
| `varchar + $type<>()` | 값이 자주 변경/확장되는 enum | checkout status/purpose, NC type, calibration status 등 |

두 패턴 모두 `@equipment-management/schemas`의 enum 값 배열을 SSOT로 참조합니다.

### Validation: Zod Pipeline (NOT class-validator)

글로벌 ValidationPipe 없음. 엔드포인트별 `ZodValidationPipe` 사용.

```typescript
// DTO 파일 구조: Zod schema → Type inference → Pipe → Swagger class
export const updateEquipmentSchema = z.object({
  name: z.string().min(1),
  ...versionedSchema, // CAS version 포함
});
export type UpdateEquipmentDto = z.infer<typeof updateEquipmentSchema>;
export const UpdateEquipmentPipe = new ZodValidationPipe(updateEquipmentSchema);

// Controller에서 사용
@UsePipes(UpdateEquipmentPipe)
update(@Body() dto: UpdateEquipmentDto) { ... }
```

**Key File:** `common/pipes/zod-validation.pipe.ts`

### Error Handling: GlobalExceptionFilter

**File:** `common/filters/error.filter.ts`

처리 순서: `AppError` → `ZodError` → `HttpException` → `unknown`

```typescript
// 응답 형식 — 커스텀 code 필드 보존 (VERSION_CONFLICT 등)
{
  code: string,          // 'VERSION_CONFLICT', 'VALIDATION_ERROR', etc.
  message: string,
  timestamp: string,
  currentVersion?: number, // CAS 실패 시 추가 필드
  expectedVersion?: number
}
```

### Response Format: ApiResponse\<T\>

**Interceptor:** `ResponseTransformInterceptor` (`common/interceptors/response-transform.interceptor.ts`)

```typescript
// 모든 성공 응답 자동 래핑
{ success: true, data: T, message: string, timestamp: string }

// 바이패스: @SkipResponseTransform()
```

### Auth & Authorization

- **Global Guard:** `JwtAuthGuard` — 모든 라우트 보호, `@Public()` 바이패스
- **Permission Guard:** `@RequirePermissions(Permission.APPROVE_CHECKOUT)` + `PermissionsGuard`
- **Token Lifecycle:** Access 15분 → Refresh 7일 → 절대만료 30일
- **Auto Refresh:** JWT 콜백에서 만료 60초 전 자동 갱신
- **E2E Test Auth:** `GET /api/auth/test-login?role=xxx` (dev/test 환경만)

### Audit Trail

```typescript
// 비동기 감사 로그 (요청 성능 미영향)
@AuditLog({
  action: 'approve',
  entityType: 'calibration',
  entityIdPath: 'params.uuid', // request/response에서 동적 추출
})
@Patch(':uuid/approve')
approve() { ... }
```

**Key Files:** `common/decorators/audit-log.decorator.ts`, `common/interceptors/audit.interceptor.ts`

### Caching

**In-Memory Cache:** `SimpleCacheService` (`common/cache/simple-cache.service.ts`)

```typescript
// Cache-Aside 패턴
const data = await cacheService.getOrSet(key, () => db.query(...), ttl);

// Smart Invalidation
cacheInvalidationHelper.invalidateAfterEquipmentUpdate(equipmentId, statusChanged);
```

**Key:** `CacheInvalidationHelper` (`common/cache/cache-invalidation.helper.ts`) — 엔티티 간 교차 무효화

### Transaction

```typescript
// 다중 테이블 원자성 보장
await db.transaction(async (tx) => {
  await tx.update(equipment).set({...});
  await tx.insert(auditLogs).values({...});
});

// CAS 단일 테이블 업데이트는 트랜잭션 불필요 (WHERE절 원자성)
```

---

## Frontend Patterns

### Three-Tier API Client

| Layer | File | Context | Use Case |
|---|---|---|---|
| Client-side | `lib/api/api-client.ts` | `getSession()` interceptor | API hooks, mutations |
| Context-based | `lib/api/authenticated-client-provider.tsx` | `useSession()` hook | 세션 동기화 필요 시 |
| Server-side | `lib/api/server-api-client.ts` | `getServerAuthSession()` | Server Component, Route Handler |

### State Management: TanStack Query

**서버 상태는 반드시 TanStack Query 사용 (useState 금지)**

```typescript
// Query Key Factory — lib/api/query-config.ts
queryKeys.equipment.detail(id)    // ['equipment', 'detail', id]
queryKeys.checkouts.list(filters) // ['checkouts', 'list', filters]
queryKeys.approvals.counts(role)  // ['approval-counts', role]
```

**Cache Time Hierarchy:**

| Preset | staleTime | Use Case |
|---|---|---|
| `SHORT` | 30s | Dashboard, Notifications |
| `MEDIUM` | 2min | Detail pages |
| `LONG` | 5min | List pages |
| `VERY_LONG` | 10min | Rarely changing data |
| `REFERENCE` | 30min | Teams, status codes |

### Optimistic Mutation Pattern

```typescript
// hooks/use-optimistic-mutation.ts
const mutation = useOptimisticMutation({
  mutationFn: (vars) => api.approve(vars),
  queryKey: queryKeys.checkouts.detail(id),
  optimisticUpdate: (old, vars) => ({ ...old, status: 'approved' }),
  invalidateKeys: [queryKeys.checkouts.lists()],
});

// Lifecycle:
// 1. onMutate: 즉시 UI 업데이트 (0ms)
// 2. onSuccess: 서버 확정 → invalidateQueries
// 3. onError: 스냅샷 롤백이 아닌 서버 재검증 (invalidateQueries)
//    → VERSION_CONFLICT 시 특별 토스트 메시지
```

### Error Handling

**Enum:** `EquipmentErrorCode` (21개) — `lib/errors/equipment-errors.ts`

**Key Utilities:**

| Function | Purpose |
|---|---|
| `mapBackendErrorCode(code)` | 백엔드 code → EquipmentErrorCode (HTTP status 폴백) |
| `isConflictError(error)` | CAS 충돌 여부 |
| `isRetryableError(error)` | 재시도 가능 여부 |
| `ApiError.getErrorInfo()` | 한국어 제목/메시지/해결방안 |

### Cache Invalidation (Frontend)

```typescript
// lib/api/cache-invalidation.ts — 정적 메서드로 교차 엔티티 무효화
await EquipmentCacheInvalidation.invalidateEquipment(queryClient, equipmentId);
await EquipmentCacheInvalidation.invalidateAfterNonConformanceCreation(queryClient, equipmentId);
await EquipmentCacheInvalidation.invalidateAfterDisposal(queryClient, equipmentId);
await DashboardCacheInvalidation.invalidateAll(queryClient);
```

### Component Conventions

| Suffix | Purpose | Example |
|---|---|---|
| `*Client.tsx` | 서버 데이터를 props로 받는 클라이언트 컴포넌트 | `EquipmentDetailClient.tsx` |
| `*Content.tsx` | 페이지 레벨 클라이언트 컴포넌트 | `CheckoutsContent.tsx` |
| `*Skeleton.tsx` | 로딩 상태 | `EquipmentDetailSkeleton.tsx` |

디렉토리: 기능별 조직 (`components/equipment/`, `components/checkouts/`, `components/calibration/` 등)

### Equipment Filters (URL-Driven State)

- **SSOT:** `equipment-filter-utils.ts` — 서버/클라이언트 공유 파싱/변환
- **역할별 기본 필터:** `page.tsx`에서 서버 사이드 리다이렉트 (useEffect 금지)
- **URL 파라미터가 유일한 진실의 소스** — useState로 필터 관리 금지

---

## Domain Context (UL-QP-18)

### Role Hierarchy (4 역할)

| Role | Korean | Level | 특이사항 |
|---|---|---|---|
| `test_engineer` | 시험실무자 | 1 | 기본 CRUD, 교정 등록 가능 |
| `technical_manager` | 기술책임자 | 2 | 승인/반려, 교정계획 생성 |
| `quality_manager` | 품질책임자 | 3 | 교정계획 검토 (대부분 읽기 전용) |
| `lab_manager` | 시험소장 | 4 | 전체 권한 (단, 교정 등록 불가 — UL-QP-18 직무분리) |

### Equipment Status (12개) / Checkout Status (13개)

SSOT: `@equipment-management/schemas`의 `EquipmentStatus`, `CheckoutStatus`. 전체 값은 코드 참조.

**프론트엔드에서 주의할 상태 전이 규칙:**

| 상태 | 표시 | UI 동작 |
|---|---|---|
| `calibration_scheduled` | "사용 가능" + D-day 배지 | `retired`, `non_conforming`, `spare`, `disposed`에서는 배지 숨김 |
| `calibration_overdue` | **"부적합"** (빨간 배지) | 스케줄러가 자동으로 `non_conforming` 전환 |
| `overdue` (checkout) | "기한 초과" | 승인/반려 버튼 없음 — 승인 테스트에 사용 금지 |

**Checkout 플로우:** 표준(교정/수리) 6단계 + 렌탈 4-Step + 공통 3개 = 13개 상태

### Approval Workflows

| Flow | 단계 | 예시 |
|---|---|---|
| 1-step | technical_manager 승인 | Checkout, Calibration, Software |
| 2-step | TM 검토 → LM 승인 | Disposal |
| 3-step | TM 제출 → QM 검토 → LM 승인 | Calibration Plan |

### Calibration Display Logic

**교정 기한 초과 자동 처리 (CalibrationOverdueScheduler):**

- 백엔드 스케줄러가 **매시간** 교정기한 초과 장비를 자동으로 `non_conforming` 상태로 전환
- 앱 시작 시 `onModuleInit`에서 즉시 점검
- 부적합 기록(non-conformance) 자동 생성 및 사고 이력 등록
- 관리자 수동 트리거: `POST /api/notifications/trigger-overdue-check`

**프론트엔드 상태 표시:**

- `calibration_overdue` → **"부적합"** (빨간색 배지)
- `calibration_scheduled` → "사용 가능" + D-day 배지 (D-7, D-3 등)
- D-day 배지는 `retired`, `non_conforming`, `spare`, `disposed` 등에서 숨김

### Management Number Format

```
XXX – X YYYY
 │    │  └── Serial number
 │    └───── Classification (E/R/W/S/A/P)
 └────────── Site code (SUW/UIW/PYT)
```

---

## E2E Testing Patterns

### Auth Architecture (Setup Project + storageState)

**실행 순서**: `globalSetup` → `setup` project (auth.setup.ts) → browser projects → `globalTeardown`

| 파일 | 역할 |
|------|------|
| `tests/e2e/auth.setup.ts` | 5개 역할 browser-native 로그인 → `.auth/*.json` storageState 저장 |
| `tests/e2e/shared/fixtures/auth.fixture.ts` | storageState 파일 로드 → 역할별 인증 Page 제공 |
| `playwright.config.ts` | `setup` project + `dependencies: ['setup']` |
| `tests/e2e/global-setup.ts` | Health check (Backend/Frontend), 시드 데이터 로딩, `.auth/` 디렉토리 보장 |

**Fixtures**: `testOperatorPage`, `techManagerPage`, `qualityManagerPage`, `siteAdminPage`, `systemAdminPage`

### E2E Auth Rules (CRITICAL)

1. **storageState 기반 인증 — loginAs() 사용 금지**
   - 모든 테스트는 `auth.fixture.ts`의 fixture 사용
   - 직접 로그인 코드 작성 금지 (`loginAs`, `signIn`, `page.goto('/login')` 등)

2. **새 역할/팀 추가 시**
   - `auth.setup.ts`의 ROLES 배열에 추가
   - `auth.fixture.ts`의 STORAGE_STATE와 AuthFixtures 인터페이스에 추가
   - 절대 spec 파일에서 직접 로그인하지 않음

3. **Backend API 직접 호출 시**
   - `getBackendToken()` 사용 (checkout-helpers.ts)
   - storageState와는 별도 — NextAuth 세션이 아닌 raw JWT 반환

### Test Template

```typescript
import { test, expect } from '../../shared/fixtures/auth.fixture';

test.describe('Feature Name', () => {
  test.describe.configure({ mode: 'serial' }); // 상태 변경 테스트만

  test('TC-01: description', async ({ techManagerPage: page }) => {
    await page.goto('/target-page');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: '승인' }).click();
    await expect(page.getByText('성공')).toBeVisible();
  });
});
```

### Test Isolation

- `fullyParallel: true` → 상태 변경 테스트는 `test.describe.configure({ mode: 'serial' })`
- UUID 상수: `backend/src/database/utils/uuid-constants.ts`
- 체크아웃 ID 격리: c2(승인용: 001,002,003,005) ≠ c3(반려용: 004,006,007,008,015)
- Overdue checkout(056+)는 승인/반려 버튼 없음 — 승인 테스트에 사용 금지

### Anti-Patterns

| ❌ 잘못된 패턴 | ✅ 올바른 패턴 |
|---|---|
| `loginAs(page, role)` | `auth.fixture.ts` fixture 사용 |
| `page.goto('/login')` in spec | `auth.setup.ts`가 처리 (Setup Project) |
| `waitForTimeout(1000)` | `waitForURL` + locator assertion |
| `page.locator('[role="dialog"]')` | `page.getByRole('dialog', { name: 'Title' })` |
| `page.waitForFunction()` | `await expect(locator).toBeVisible()` |
| `locator1.or(locator2)` (둘 다 표시) | 조건부 분기 |
| 체크아웃 ID 공유 | 스위트별 격리 |
| "반입 처리" `getByRole('button')` | `getByRole('link')` (HTML `<a>` 태그) |

---

## Production Checklist

### Backend Endpoint 추가 시

- [ ] CAS 필요 여부 확인 (상태 변경 → `version` 필드 + `VersionedBaseService`)
- [ ] Zod schema + `versionedSchema` + `ZodValidationPipe`
- [ ] `@RequirePermissions(Permission.XXX)` 데코레이터
- [ ] `req.user.userId` 서버 사이드 추출 (body에서 userId 받지 않기)
- [ ] `@AuditLog()` 데코레이터
- [ ] 캐시 무효화 전략 (`CacheInvalidationHelper`)
- [ ] 에러 응답에 `code` 필드 정의 (VERSION_CONFLICT 등)
- [ ] 다중 테이블 업데이트 → `db.transaction()`
- [ ] **검증:** `pnpm --filter backend run tsc --noEmit` 통과
- [ ] **검증:** 관련 유닛 테스트 통과 (`pnpm --filter backend run test -- --grep "모듈명"`)

### Frontend 기능 추가 시

- [ ] 서버 상태 → TanStack Query (useState 금지)
- [ ] 상태 변경 → `useOptimisticMutation`
- [ ] `queryKeys` 팩토리 등록 (`lib/api/query-config.ts`)
- [ ] VERSION_CONFLICT 에러 특별 처리
- [ ] Loading / Error / Empty state
- [ ] 캐시 무효화 (`EquipmentCacheInvalidation` or `invalidateQueries`)
- [ ] **검증:** `pnpm --filter frontend run tsc --noEmit` 통과
- [ ] **검증:** 변경된 모든 라인이 사용자 요청에 직접 매핑되는지 diff 재확인

---

## File Conventions

### Frontend Routes (App Router)

| File | Purpose |
|---|---|
| `page.tsx` | Route page component |
| `layout.tsx` | Shared layout wrapper |
| `loading.tsx` | Loading skeleton |
| `error.tsx` | Error boundary ('use client' required) |
| `not-found.tsx` | 404 page |

### Component Organization

```
components/
├── equipment/           # 장비 관리
├── checkouts/           # 반출 관리
├── calibration/         # 교정 관리
├── non-conformances/    # 부적합 관리
├── approvals/           # 승인 관리
├── layout/              # 레이아웃
├── ui/                  # shadcn/ui
└── auth/                # 인증
```

## Useful Skills

This project has custom Claude Code skills in `.claude/skills/`:

- **equipment-management**: Domain knowledge for UL-QP-18 procedures
- **nextjs-16**: Next.js 16 patterns and best practices
- **verify-cas**: CAS(Optimistic Locking) 패턴 검증 — version 필드, VersionedBaseService, 캐시 무효화
- **verify-auth**: 서버 사이드 인증/인가 검증 — req.user.userId, @RequirePermissions, @AuditLog
- **verify-zod**: Zod 검증 패턴 검증 — ZodValidationPipe, class-validator 금지, Controller Pipe 적용, Query DTO 패턴 일관성
- **verify-ssot**: SSOT 임포트 소스 검증 — 타입/enum 패키지 임포트, 로컬 재정의 금지, Icon library 통합(lucide-react)
- **verify-hardcoding**: SSOT 하드코딩 탐지 — API 경로, queryKeys, 환경변수, 캐시 키, 토큰 TTL, ErrorCode 매핑, DTO 매핑
- **verify-frontend-state**: 프론트엔드 상태 관리 검증 — TanStack Query, onSuccess setQueryData 금지
- **verify-nextjs**: Next.js 16 패턴 검증 — await params, useActionState, 서버 컴포넌트, Dynamic imports(코드 분할)
- **verify-design-tokens**: Design Token 3-Layer 아키텍처 검증 — transition-all 금지, focus-visible 우선, import 경로, Layer 참조
- **verify-security**: 보안 설정 검증 — Helmet CSP 프로덕션 강화, Next.js Security Headers, PermissionsGuard DENY 모드, @Public 남용
- **verify-i18n**: i18n 번역 일관성 검증 — en/ko 키 쌍 일치, 빈 번역 없음, 네임스페이스 참조
- **verify-sql-safety**: SQL 안전성 검증 — LIKE 와일드카드 이스케이프, N+1 쿼리 패턴 탐지
- **verify-filters**: URL-driven 필터 SSOT 검증 — filter-utils 필수 export, hook 존재, page.tsx 서버 파싱
- **verify-implementation**: 모든 verify 스킬 통합 실행
- **manage-skills**: 검증 스킬 유지보수 (커버리지 갭 분석, 스킬 생성/업데이트)

Reference these skills when working on related features.
