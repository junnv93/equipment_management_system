---
slug: checkout-inbound-bff-overview
type: contract
date: 2026-04-24
depends: [checkout-fsm-resolve-action, checkout-meta-fail-closed]
sprint: 3
sprint_step: 3.1
---

# Contract: Sprint 3.1 — BFF `GET /checkouts/inbound-overview` 집계 엔드포인트 + InboundTab 1-request 전환

## Context

V2 리뷰 P-1(P0) 실측: `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx` L82·L106·L131에서 `useQuery` 3개 독립 실행:

```typescript
// L82: 팀 대여 (standard checkouts)
queryKeys.checkouts.inbound({statusFilter, searchTerm, teamId, page: inboundPage})

// L106: 외부 렌탈 (equipment imports rental)
queryKeys.equipmentImports.bySourceType('rental', {statusFilter, searchTerm, page: rentalPage})

// L131: 내부 공용 (equipment imports internal_shared)
queryKeys.equipmentImports.bySourceType('internal_shared', {statusFilter, searchTerm, page: internalPage})
```

공통 필터(`statusFilter`, `searchTerm`) 1회 변경 → **3 round-trip**. TanStack Query는 dedup/cancel하지만 네트워크 트래픽은 그대로. 저사양/낮은 대역폭에서 초기 FCP 지연.

**목표**: backend에 집계 BFF 엔드포인트 `GET /checkouts/inbound-overview` 신설. 3개 섹션 메타데이터 + sparkline 시계열을 **단일 응답**에. 섹션별 페이지네이션은 기존 3개 키 유지하여 상세 페이지 단위 fetch는 존속.

---

## Scope

### 수정 대상 — Backend
- `apps/backend/src/modules/checkouts/checkouts.controller.ts`
  - 신규 엔드포인트 `@Get('inbound-overview')`:
    ```typescript
    @Get('inbound-overview')
    @RequirePermissions(Permission.VIEW_CHECKOUTS)
    async getInboundOverview(
      @Query() query: InboundOverviewQueryDto,
      @Request() req: AuthenticatedRequest,
    ): Promise<InboundOverviewResponseDto> {
      const userPermissions = getPermissions(req.user.role);
      return this.checkoutsService.getInboundOverview(query, userPermissions, req.user.teamId);
    }
    ```
  - OpenAPI/Swagger 데코레이터(`@ApiOperation`, `@ApiOkResponse`) 추가
- `apps/backend/src/modules/checkouts/checkouts.service.ts`
  - `async getInboundOverview(query, userPermissions, teamId)` 메서드 신설
  - 내부에서 3개 섹션 데이터를 **병렬 DB 쿼리**(`Promise.all`)로 수집:
    - `standardInbound`: `checkouts.*` 중 반입 대상 (team 기반)
    - `rentalImports`: `equipment_imports.source_type = 'rental'` 최신순
    - `internalSharedImports`: `equipment_imports.source_type = 'internal_shared'` 최신순
    - 각각 `items` + `meta.pagination` + `meta.availableActions` per item (Sprint 1.1 populate 보증)
  - 추가로 `sparkline: { standard: number[], rental: number[], internalShared: number[] }` — 최근 14일 일별 count (V2 §7 metric용)
- `packages/schemas/src/checkout.ts` (또는 새 파일)
  - `InboundOverviewQuerySchema` (zod): `statusFilter?`, `searchTerm?`, `limitPerSection?` (default 10)
  - `InboundOverviewResponseSchema`:
    ```typescript
    z.object({
      standard: CheckoutListResponseSchema,
      rental: EquipmentImportListResponseSchema,
      internalShared: EquipmentImportListResponseSchema,
      sparkline: z.object({
        standard: z.array(z.number()).length(14),
        rental: z.array(z.number()).length(14),
        internalShared: z.array(z.number()).length(14),
      }),
      generatedAt: z.string().datetime(),
    })
    ```
- `apps/backend/src/modules/checkouts/dto/inbound-overview.dto.ts` 신규

### 수정 대상 — Frontend
- `apps/frontend/lib/api/query-config.ts`
  - `queryKeys.checkouts`에 `view.inboundOverview(filters)` 추가:
    ```typescript
    checkouts: {
      // ...existing...
      view: {
        inboundOverview: (filters: object) => [...queryKeys.checkouts.all, 'view', 'inbound-overview', filters] as const,
      },
    }
    ```
    (Sprint 3.2 `query-keys-view-resource-refactor`와 **같은 PR에서 병합 권장** — view.* prefix는 이 contract에서 시작)
- `apps/frontend/lib/api/checkout-api.ts`
  - `getInboundOverview(params: InboundOverviewQuery): Promise<InboundOverviewResponse>` 함수 추가
  - 응답은 `InboundOverviewResponseSchema.parse()` 경유 (MEMORY.md `project_74` parse 패턴)
- `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - L82·L106·L131 **3개 useQuery → 1개**:
    ```typescript
    const { data: overview, isLoading } = useQuery({
      queryKey: queryKeys.checkouts.view.inboundOverview({statusFilter, searchTerm}),
      queryFn: () => checkoutApi.getInboundOverview({statusFilter, searchTerm}),
      ...QUERY_CONFIG.CHECKOUT_LIST,
    });
    ```
  - 섹션별 내부 state(페이지 번호, 해당 섹션 필터)는 유지. 상세 페이지네이션은 별도 useQuery(section별 next page만) 유지 — overview의 initial page만 집계로.
  - 섹션별 데이터 추출: `overview.standard.items`, `overview.rental.items`, `overview.internalShared.items`
- `apps/frontend/components/checkouts/SparklineMini.tsx` (있다면) 입력을 `overview.sparkline.{standard|rental|internalShared}`로 전환
- Feature flag: `NEXT_PUBLIC_CHECKOUT_INBOUND_BFF` env — `true`면 BFF 사용, `false`면 기존 3 useQuery 경로. 1 스프린트 canary 후 기본 ON, 다음 스프린트에 flag 제거 (Sprint 1.4 패턴과 동일).

### 수정 금지
- 다른 checkouts 엔드포인트 (단일 list, detail 등).
- `equipment_imports` 테이블 스키마.
- `PermissionsGuard` / `AuthGuard` 기본 구조.
- 섹션별 상세 페이지네이션 fetch (기존 `queryKeys.equipmentImports.bySourceType`는 "detail pagination" 용도로 유지).

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter backend run test` 통과 (신규 service 메서드 unit test 포함) | test |
| M3 | `pnpm --filter backend run test:e2e` 통과 (신규 엔드포인트 E2E smoke 포함) | test |
| M4 | backend `checkouts.controller.ts`에 `@Get('inbound-overview')` 핸들러 존재 + `@RequirePermissions(Permission.VIEW_CHECKOUTS)` | `grep -c "@Get('inbound-overview')" apps/backend/src/modules/checkouts/checkouts.controller.ts` = 1 |
| M5 | `PermissionsGuard` 기본 DENY 정책 준수 (MEMORY.md) — 권한 없는 role로 접근 시 403 E2E | 테스트 |
| M6 | `checkouts.service.ts`에 `async getInboundOverview(query, userPermissions, teamId)` 메서드 존재 | grep 확인 |
| M7 | service 내부 3개 섹션 쿼리가 `Promise.all`로 병렬 실행 (순차 await 금지) | 코드 review |
| M8 | 응답 `meta.availableActions`가 모든 item에 populate (Sprint 1.1 fail-closed 전제) | 응답 스키마 + E2E |
| M9 | `InboundOverviewResponseSchema` zod 정의 + 서버 응답이 parse 통과 | test |
| M10 | frontend `InboundCheckoutsTab.tsx`에서 `useQuery` 호출 수 **1개** (overview) + 섹션 상세 페이지네이션 최대 3개 (flag ON 시 overview만) | `grep -c "useQuery" 'apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx'` — flag ON 경로 분기 확인 |
| M11 | `queryKeys.checkouts.view.inboundOverview` key 정의 + 호출 | grep 확인 |
| M12 | feature flag `isInboundBffEnabled()` 헬퍼 `checkout-flags.ts`에 추가, 기본값 `false` (canary) | 코드 |
| M13 | flag OFF 경로에서 기존 3 useQuery 동작 **행위 변경 0** (rollback 안전) | E2E 비교 |
| M14 | 서버 `response caching` TTL — Redis 있으면 team별 30s cache, `getInboundOverview` 결과. 없으면 S 로 강등 | Redis 사용 여부 확인 |
| M15 | Network tab 수동 QA: 필터 1회 변경 → request 1개 확인 (flag ON) | 수동 QA |
| M16 | 변경 파일 = backend 2~3 + dto 1 + schemas 1 + frontend query-config + checkout-api + InboundCheckoutsTab + checkout-flags + env = **최대 9개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 9 |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | Redis cache 30s TTL 적용 (없으면 구현 시까지 uncached) | `checkout-inbound-overview-redis-cache` |
| S2 | Sparkline은 시계열 DB 집계 — 대량 데이터 최적화 (현재는 raw count). `pg_trgm` 또는 materialized view 검토 | `sparkline-aggregation-perf` |
| S3 | BFF 엔드포인트 응답 크기 모니터링 — 섹션별 limit 10 넘으면 size warning 로그 | `inbound-overview-response-size-monitor` |
| S4 | OpenAPI 스펙 업데이트 + 프론트 `checkoutApi.getInboundOverview`가 generated type 사용 (있으면) | `inbound-overview-openapi-gen` |
| S5 | feature flag 제거 타임라인 — 다음 스프린트(PR-23 또는 6차 Sprint)에 flag 완전 제거 티켓 | `inbound-bff-flag-removal` |
| S6 | `EquipmentImports` 모듈과의 책임 분리 — 현재 service가 equipment-imports 테이블도 read. 향후 module boundary 재검토 | `inbound-overview-module-boundary` |

---

## Verification Commands

```bash
# 1. 타입 + 테스트
pnpm tsc --noEmit
pnpm --filter backend run test -- inbound-overview
pnpm --filter backend run test:e2e -- inbound-overview

# 2. MUST grep
grep -c "@Get('inbound-overview')" apps/backend/src/modules/checkouts/checkouts.controller.ts
# 기대: 1

grep -n "async getInboundOverview" apps/backend/src/modules/checkouts/checkouts.service.ts
# 기대: 1 hit

grep -n "Promise.all" apps/backend/src/modules/checkouts/checkouts.service.ts | grep -A5 "getInboundOverview"
# getInboundOverview 본체에 Promise.all 호출 확인

grep -n "view.inboundOverview" apps/frontend/lib/api/query-config.ts apps/frontend/lib/api/checkout-api.ts 'apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx'
# 기대: 3+ hit

grep -n "isInboundBffEnabled" apps/frontend/lib/features/checkout-flags.ts
# 기대: 1 hit

# 3. 수동 QA
# - NEXT_PUBLIC_CHECKOUT_INBOUND_BFF=true 로 dev 실행
# - /checkouts → inbound 탭 → 필터 변경 시 network tab에서 요청 1개 확인

# 4. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 9
```

---

## 응답 페이로드 예시 (참조)

```json
{
  "standard": {
    "items": [{ "id": "...", "equipmentName": "...", "meta": { "availableActions": { "canApprove": true, ... }, "nextStep": { ... } } }],
    "meta": { "pagination": { "total": 42, "page": 1, "limit": 10 } }
  },
  "rental": { "items": [...], "meta": {...} },
  "internalShared": { "items": [...], "meta": {...} },
  "sparkline": {
    "standard": [2, 1, 3, 4, 2, 0, 1, 2, 3, 5, 4, 2, 1, 3],
    "rental": [1, 0, 2, 1, 1, 0, 0, 1, 2, 3, 2, 1, 0, 1],
    "internalShared": [0, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1]
  },
  "generatedAt": "2026-04-24T14:30:00Z"
}
```

---

## Acceptance

루프 완료 조건 = MUST 16개 모두 PASS + 수동 QA에서 network request 1개 확인.
Sprint 3.2 (queryKey view.*/resource.* 재편)과 **같은 PR에서 병합 권장** — view.* prefix가 본 contract에서 시작.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 1.1 · `checkout-fsm-resolve-action.md` — **선행 필수**. 모든 item에 `meta.availableActions` populate 보증.
- Sprint 1.3 · `checkout-meta-fail-closed.md` — **선행 필수**. 클라가 `?? false` 전환 후 본 contract 안전.
- Sprint 3.2 · `checkout-query-keys-view-resource-refactor.md` — 같은 PR에서 병합. view.* prefix 공용.
- Sprint 4 · nav "내 차례 N" 배지(U-11) — `overview.standard.meta.pagination.total` 활용 가능.
