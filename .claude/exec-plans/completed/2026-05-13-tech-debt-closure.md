# Exec Plan: tech-debt-closure-20260513

**Slug**: tech-debt-closure-20260513  
**Mode**: 2  
**Date**: 2026-05-13  
**Status**: IN_PROGRESS

## 목표 (8건 tech-debt)

| ID | 항목 | 도메인 | 복잡도 |
|----|------|--------|--------|
| R-4 | use-keyboard-shortcuts-scope dead code 제거 | Frontend | Low |
| R-3 | extractKeyPaths 배열 구조 명시적 throw | Frontend | Low |
| G-7 | CheckoutCacheInvalidation.REVOCATION_KEYS 신설 | Frontend | Low |
| G-6 | revokeMutation TData void → Checkout | Frontend | Low |
| SH-4 | rejection_presets.sort_order DB index | DB/Schema | Low |
| G-5 | 팀 삭제 시 saved-views orphan → PRIVATE 강등 | Multi-domain | Medium |
| SH-5 | useRevocationWindow server-time skew 대응 | Backend+Frontend | Medium |
| SH-6 | destination varchar → 별도 테이블 승격 | DB+Backend+Frontend | High |

---

## Phase 1: Frontend Simple Fixes (R-4, R-3, G-7, G-6)

### 파일 변경 목록

| 파일 | 액션 |
|------|------|
| `apps/frontend/hooks/use-keyboard-shortcuts-scope.ts` | DELETE |
| `apps/frontend/lib/__tests__/i18n-parity.test.ts` | MODIFY - extractKeyPaths Array.isArray 시 throw |
| `apps/frontend/lib/api/cache-invalidation.ts` | MODIFY - REVOCATION_KEYS 추가 |
| `apps/frontend/lib/api/checkout-revoke-approval.ts` | MODIFY - Promise<void> → Promise<Checkout> |
| `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx` | MODIFY - revokeMutation<void,...> → <Checkout,...> + REVOCATION_KEYS |

### 세부 구현

**R-4**: `use-keyboard-shortcuts-scope.ts` 삭제. 호출자 없음 확인됨 (grep 0건).

**R-3**: `extractKeyPaths`에서 `Array.isArray(input)` 시 현재 leaf 처리 → `throw new Error(...)` 변경. 배열을 i18n 구조에 도입하면 spec이 명시적으로 실패하도록 보장.

**G-7**: `CheckoutCacheInvalidation.REVOCATION_KEYS` 추가:
```ts
static readonly REVOCATION_KEYS: ReadonlyArray<readonly unknown[]> = [
  queryKeys.checkouts.all,        // view.* + resource.* 전체
  queryKeys.equipment.all,        // 장비 상태 PENDING 복원 영향
  queryKeys.approvals.all,        // 승인 이력 갱신
  queryKeys.approvals.countsAll,  // 대기 건수 변동
  queryKeys.dashboard.all,        // 대시보드 통계
  queryKeys.notifications.all,    // 철회 시 승인자 알림 상태
];
```

**G-6**: `revokeApproval` 반환을 `Promise<Checkout>`으로 변경. backend가 이미 updated checkout 반환함. `CheckoutDetailClient.tsx` revokeMutation → `<Checkout, string, Checkout>` + invalidateKeys를 `REVOCATION_KEYS`로 교체.

---

## Phase 2: SH-4 DB Index

### 파일 변경 목록

| 파일 | 액션 |
|------|------|
| `packages/db/src/schema/rejection-presets.ts` | MODIFY - sortOrder index 추가 |
| `apps/backend/drizzle/0060_add_rejection_presets_sort_order_idx.sql` | CREATE |
| `apps/backend/drizzle/meta/_journal.json` | MODIFY - entry 추가 |

### 세부 구현

```sql
-- 0060_add_rejection_presets_sort_order_idx.sql
CREATE INDEX "rejection_presets_sort_order_idx" ON "rejection_presets" ("sort_order");
```

journal entry:
```json
{
  "idx": 60,
  "version": "7",
  "when": 1747181400000,
  "tag": "0060_add_rejection_presets_sort_order_idx",
  "breakpoints": true
}
```

---

## Phase 3: G-5 Team Deletion → Saved Views Orphan Cleanup

### 아키텍처 결정

- `DOMAIN_EVENTS` 신설 (`apps/backend/src/common/events/domain-events.ts`): 캐시 무효화도 알림도 아닌 도메인 사이드 이펙트 이벤트 SSOT
- `teams.service.ts`: EventEmitter2 inject + delete 후 `DOMAIN_EVENTS.TEAM_DELETED` emit
- `saved-views` 모듈에 `listeners/saved-views-team.listener.ts` 신설: `@OnEvent` 수신 + orphan TEAM scope → PRIVATE 강등
- `saved-views.module.ts`: listener 등록

### 파일 변경 목록

| 파일 | 액션 |
|------|------|
| `apps/backend/src/common/events/domain-events.ts` | CREATE - DOMAIN_EVENTS SSOT |
| `apps/backend/src/modules/teams/teams.service.ts` | MODIFY - EventEmitter2 inject + emit |
| `apps/backend/src/modules/saved-views/listeners/saved-views-team.listener.ts` | CREATE |
| `apps/backend/src/modules/saved-views/saved-views.module.ts` | MODIFY - listener 등록 |

### 세부 구현

**DOMAIN_EVENTS** (ADR-0012 준수 - `domain.` prefix):
```ts
export const DOMAIN_EVENTS = {
  TEAM_DELETED: 'domain.team.deleted',
} as const;
```

**Listener**: `@OnEvent(DOMAIN_EVENTS.TEAM_DELETED, { async: true })` →  
`UPDATE saved_views SET scope='PRIVATE', team_id=NULL WHERE scope='TEAM' AND team_id=deletedTeamId`  
+ cache invalidation (삭제된 팀 관련 saved-views list 캐시 무효화)  
+ audit log emit (OPTIONAL - 데이터 무결성 자동 처리는 audit 불필요)

---

## Phase 4: SH-5 Server-Time Skew 대응

### 아키텍처 결정

"Drift-once-on-mount" 패턴:
1. `GET /monitoring/server-time` (Public) → `{ serverTime: string }` ISO 8601
2. Frontend: `useServerTimeOffset` hook - 한 번 fetch → `serverTimeDelta = serverTime - Date.now()` 
3. `useRevocationWindow`에 optional `serverTimeDelta` prop 추가 (backward compat 유지)

### 파일 변경 목록

| 파일 | 액션 |
|------|------|
| `packages/shared-constants/src/api-endpoints.ts` | MODIFY - MONITORING.SERVER_TIME 추가 |
| `apps/backend/src/modules/monitoring/monitoring.controller.ts` | MODIFY - @Get('server-time') 추가 |
| `apps/frontend/lib/api/server-time-api.ts` | CREATE |
| `apps/frontend/hooks/use-server-time-offset.ts` | CREATE |
| `apps/frontend/hooks/use-revocation-window.ts` | MODIFY - serverTimeDelta optional param |

---

## Phase 5: SH-6 Destination Table Promotion

### 아키텍처 결정

**Non-destructive**: `checkouts.destination varchar(255)` 유지 (breaking migration 금지).  
새 `checkout_destinations` 테이블을 autocomplete entity SSOT로 사용.

- 기존 `GET /checkouts/destinations` → `string[]` (distinct) → 변경: `CheckoutDestinationEntity[]`
- 신규 `POST /checkouts/destinations` → 인라인 등록
- 기존 `GET /checkouts/destinations/recent` → 유지 (사용자 recent 5건)
- Frontend: `use-recent-destinations.ts` → `use-destinations.ts` (entity 기반)
- 체크아웃 생성 시 destination 자동 upsert (optional - 첫 use 시 entity 자동 생성)

### Entity 구조

```sql
CREATE TABLE "checkout_destinations" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name" VARCHAR(255) NOT NULL UNIQUE,
  "is_active" BOOLEAN NOT NULL DEFAULT TRUE,
  "created_at" TIMESTAMP DEFAULT NOW() NOT NULL,
  "updated_at" TIMESTAMP DEFAULT NOW() NOT NULL
);
-- Backfill
INSERT INTO "checkout_destinations" ("name")
SELECT DISTINCT "destination" FROM "checkouts"
WHERE "destination" IS NOT NULL AND "destination" != ''
ON CONFLICT ("name") DO NOTHING;
```

### 파일 변경 목록

| 파일 | 액션 |
|------|------|
| `packages/db/src/schema/checkout-destinations.ts` | CREATE |
| `packages/db/src/schema/index.ts` | MODIFY - export |
| `apps/backend/drizzle/0061_add_checkout_destinations.sql` | CREATE |
| `apps/backend/drizzle/meta/_journal.json` | MODIFY - entry 추가 |
| `packages/shared-constants/src/api-endpoints.ts` | MODIFY - DESTINATIONS_CREATE 추가 |
| `apps/backend/src/modules/checkouts/checkouts.service.ts` | MODIFY - getDestinations → entity 기반 + upsert + createDestination |
| `apps/backend/src/modules/checkouts/checkouts.controller.ts` | MODIFY - POST /destinations |
| `apps/frontend/hooks/use-destinations.ts` | CREATE (replace use-recent-destinations) |
| `apps/frontend/hooks/use-recent-destinations.ts` | DELETE or keep for /recent |
| `apps/frontend/lib/api/checkout-api.ts` | MODIFY - createDestination API |
| `apps/frontend/lib/api/query-config.ts` | MODIFY - queryKeys.checkouts.resource.destinations |
| `apps/frontend/components/checkouts/CheckoutDestinationCombobox.tsx` | MODIFY - entity 기반 + POST on create |
| `apps/frontend/lib/api/cache-invalidation.ts` | MODIFY - destination invalidation |

---

## 검증 명령

```bash
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit
pnpm --filter backend run test
pnpm --filter frontend run test
pnpm --filter backend run db:migrate
```

## 중간 커밋 포인트

1. Phase 1 완료 후 커밋
2. Phase 2 완료 후 커밋
3. Phase 3 완료 후 커밋
4. Phase 4 완료 후 커밋
5. Phase 5 완료 후 커밋
