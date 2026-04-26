---
slug: checkout-sprint3-bff-querykeys
iteration: 1
date: 2026-04-26
contracts: [checkout-inbound-bff-overview, checkout-query-keys-view-resource-refactor]
---

# Evaluation Report — Sprint 3 BFF + Query Keys

## Build Verification

| Check | Result |
|-------|--------|
| Frontend tsc | PASS (exit 0, no errors) |
| Backend tsc | PASS (exit 0, no errors) |
| Backend unit tests (checkouts.service.spec) | PASS (36/36 passed, including 4 getInboundOverview tests) |

---

## Sprint 3.1 Contract Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | `pnpm tsc --noEmit` exit 0 | PASS | Both frontend and backend clean |
| M2 | Backend unit test 통과 (신규 service 메서드 unit test 포함) | PASS | 4 getInboundOverview unit tests passed (L1080-L1135 of spec) |
| M3 | Backend e2e test 통과 (신규 엔드포인트 E2E smoke 포함) | FAIL | `apps/backend/test/` 디렉토리에 `inbound-overview` e2e 테스트 파일 없음. 계약은 "신규 엔드포인트 E2E smoke 포함"을 명시 |
| M4 | `@Get('inbound-overview')` + `@RequirePermissions(Permission.VIEW_CHECKOUTS)` | PASS | Controller L281-296에서 확인. `@ApiOperation` + `@ApiResponse` 포함 |
| M5 | PermissionsGuard DENY 정책 준수 — 403 E2E | PARTIAL | unit test에 scope 검증 없음, e2e smoke 미존재(M3 FAIL)로 403 e2e 미확인 |
| M6 | `async getInboundOverview(query, userPermissions, teamId)` 서명 존재 | FAIL | 실제 서명: `async getInboundOverview(query: InboundOverviewQueryInput, teamId: string \| null)`. `userPermissions` 파라미터 누락. 계약 명시 서명과 불일치 |
| M7 | service 내부 `Promise.all` 병렬 실행 | PASS | L924에서 6개 쿼리(3섹션 + sparkline 3개) `Promise.all`로 병렬 실행 확인 |
| M8 | 응답 `meta.availableActions` 모든 item에 populate | PARTIAL | standard 섹션은 `this.findAll()`로 Sprint 1.1 보증됨. rental/internalShared는 `rentalImportsService.findAll()` 사용 — EquipmentImport 타입에 `availableActions` 없음(frontend `InboundSectionMeta` 미포함). E2E 미실행으로 런타임 미확인 |
| M9 | `InboundOverviewResponseSchema` Zod 정의 + 서버 응답 parse 통과 | FAIL | `packages/schemas/src/checkout.ts`에 `InboundOverviewQuerySchema`만 존재(L57). `InboundOverviewResponseSchema`는 **미존재**. frontend `checkout-api.ts`도 로컬 TypeScript 인터페이스(`InboundOverviewResponse`)를 사용하며 `schema.parse()` 미호출. SSOT Rule 0 위반 |
| M10 | `InboundCheckoutsTab.tsx` useQuery 1개(overview) + 섹션 페이지네이션 최대 3개 (flag ON 시 overview만) | PASS | 4개 useQuery 인스턴스: 1개 BFF(`enabled: bffEnabled`) + 3개 레거시(`enabled: !bffEnabled`). flag ON 시 BFF 1개만 활성화. canary rollback 안전 패턴 준수 |
| M11 | `queryKeys.checkouts.view.inboundOverview` key 정의 + 호출 | PASS | `query-config.ts` L516에 정의, `InboundCheckoutsTab.tsx` L85에서 호출 확인 |
| M12 | `isInboundBffEnabled()` 헬퍼, 기본값 `false` | PASS | `apps/frontend/lib/features/checkout-flags.ts`에 구현, `process.env.NEXT_PUBLIC_CHECKOUT_INBOUND_BFF === 'true'`만 ON. 기본값 false |
| M13 | flag OFF 경로 — 기존 3 useQuery 행위 변경 0 | PASS | 레거시 3개 쿼리키가 `queryKeys.checkouts.view.inboundSection` 및 `queryKeys.equipmentImports.bySourceType`로 유지. queryFn 로직 동일 |
| M14 | Redis cache — `getInboundOverview` 결과 30s team별 cache | FAIL | `getInboundOverview` 메서드(L903-L972) 내에 `cacheService.getOrSet` 호출 없음. 계약은 "Redis 있으면 S 강등" 조건을 명시하지만, 시스템에 Redis/SimpleCacheService가 실제로 주입되어 있으므로 S로 강등 근거 부족. M14는 FAIL로 유지 |
| M15 | Network tab 수동 QA: 필터 1회 변경 → request 1개 (flag ON) | NOT VERIFIED | 수동 QA 불가 환경. 코드 구조상 flag ON 시 단일 BFF useQuery가 활성화되어 동작은 예상됨 |
| M16 | 변경 파일 최대 9개 | FAIL | 실제 3.1 귀속 파일: `checkouts.controller.ts`, `checkouts.service.ts`, `checkouts.service.spec.ts`, `dto/index.ts`, `schemas/checkout.ts`, `shared-constants/api-endpoints.ts`(계약 외), `checkout-api.ts`, `InboundCheckoutsTab.tsx`, `query-config.ts`, `checkout-flags.ts`, `next-env.d.ts`(자동생성) = **11개** (자동생성 제외해도 10개 > 9개 한도) |

**Sprint 3.1 MUST 합격: 7/16**
**FAIL 항목: M3, M6, M9, M14, M16**
**PARTIAL 항목: M5, M8**

---

## Sprint 3.2 Contract Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| M1 | `pnpm tsc --noEmit` exit 0 | PASS | 빌드 오류 없음 |
| M2 | `pnpm --filter frontend exec eslint` error 0 | NOT VERIFIED | lint 별도 미실행. tsc PASS + 코드 구조상 문제 없어 PASS 예상 |
| M3 | `pnpm --filter frontend run test` + `test:e2e` 통과 | NOT VERIFIED | 프론트엔드 테스트/e2e 미실행 |
| M4 | 8개 함수: `view.{outbound, inboundOverview, inboundSection}` + `resource.{detail, pendingCount, destinations, summary, returnPending}` | PASS | `query-config.ts` L514-536에서 8개 모두 확인. 추가로 `resource.pending()`도 구현됨(계약 외 추가) |
| M5 | `view.all()` + `resource.all()` 헬퍼 존재 | PASS | L513 `view.all()`, L525 `resource.all()` 확인 |
| M6 | 구 평면 키 0건 (`outbound`, `inbound`, `list`, `lists`, `detail`, `destinations`, `pending`, `pendingCount`, `summary`, `returnPending` 직접 참조) | PASS | grep 결과 0건. e2e spec 파일 내 주석에만 old key 언급(코드 아님) |
| M7 | 호출처 13파일 모두 신규 prefix 경유 | FAIL | 13파일 중 8파일은 `.view.*` 또는 `.resource.*` 참조 확인. 미준수 2파일: `CreateCheckoutContent.tsx`(`.all`만 사용), `CheckoutHistoryTab.tsx`(`.all`만 사용). 나머지 3파일(`CreateEquipmentImportForm.tsx`, `EquipmentImportDetail.tsx`, `ReceiveEquipmentImportForm.tsx`)은 `queryKeys.checkouts.*` 미사용(equipmentImports만 사용) — 이 3파일은 마이그레이션 불필요로 볼 수 있음. 그러나 계약이 "모두 신규 prefix 경유"를 명시하므로 write-path 2파일의 `.all` 사용은 비준수 |
| M8 | `cache-invalidation.ts`에서 `view.all()` 축 무효화 사용 | PASS | `CheckoutCacheInvalidation.invalidateViews()`(L614-619)에서 `queryKeys.checkouts.view.all()` 사용 확인 |
| M9 | cache regex 필드 순서 의존 없음 | PASS | `cache-invalidation.ts`에 regex 패턴 없음. `invalidateQueries` 배열 기반 키 매칭만 사용 |
| M10 | E2E 기존 테스트(`suite-21-pending-checks`) 통과 | NOT VERIFIED | e2e 미실행. queryKey 구조 변경으로 회귀 가능성 있음 — `s21-pending-checks.spec.ts` L108, L110에서 `resource.pending()` 호출 확인됨 |
| M11 | `lists()` 헬퍼 재검토 — 미사용 시 제거 | PASS | `queryKeys.checkouts.lists()`가 `query-config.ts`에서 제거됨. `checkouts` 네임스페이스에 `lists` 키 없음 |
| M12 | 변경 파일 최대 15개 | PASS | 3.2 귀속 프론트엔드 파일 10개 (`query-config` + 8 call sites + `cache-invalidation`). 15 한도 이내 |
| M13 | 필터 객체 key sorting 헬퍼 — 없으면 S로 이동 | PASS(S이동) | `canonicalizeFilters` 헬퍼 미존재. 계약 명시대로 SHOULD S2(`canonical-filter-sort-helper`)로 이동 처리 |
| M14 | invalidation 회귀 없음 — 승인/반려 후 목록 즉시 refresh | NOT VERIFIED | E2E 미실행. `APPROVAL_KEYS`가 `checkouts.all`(광역)을 사용하므로 회귀 가능성 낮음 |

**Sprint 3.2 MUST 합격: 6/14 (검증됨 기준), NOT VERIFIED 4건**
**FAIL 항목: M7**
**NOT VERIFIED: M2, M3, M10, M14 (테스트 미실행)**

---

## SHOULD Criteria (non-blocking)

### Sprint 3.1 SHOULD 미달
- **S1** (`checkout-inbound-overview-redis-cache`): `getInboundOverview`에 Redis cache 미적용. M14 FAIL과 동일 원인. SHOULD에 등록 필요.
- **S4** (`inbound-overview-openapi-gen`): `@ApiOkResponse` 대신 `@ApiResponse(status: OK)` 사용 — 응답 스키마 타입 미지정. Generated type 미사용.

### Sprint 3.2 SHOULD 미달
- **S2** (`canonical-filter-sort-helper`): `canonicalizeFilters()` 헬퍼 미구현. M13에서 S로 이동됨.

---

## Overall Verdict

**FAIL**

Sprint 3.1에서 5개 MUST 기준 실패(M3, M6, M9, M14, M16), Sprint 3.2에서 1개 MUST 기준 실패(M7).

---

## Repair Instructions

### [3.1-FAIL-M3] Backend e2e smoke test 미존재

- **File**: `apps/backend/test/checkouts/checkouts.e2e-spec.ts` (신규 또는 기존 파일에 추가)
- **Issue**: `GET /checkouts/inbound-overview` 엔드포인트 e2e smoke test 없음
- **Fix**: 아래 케이스를 e2e에 추가:
  1. `VIEW_CHECKOUTS` 권한 사용자 → 200 + `{standard, rental, internalShared, sparkline, generatedAt}` 구조 확인
  2. 권한 없는 사용자 → 403 확인 (M5 동시 충족)

---

### [3.1-FAIL-M6] Service 메서드 서명에 `userPermissions` 파라미터 누락

- **File**: `apps/backend/src/modules/checkouts/checkouts.service.ts` L903
- **Issue**: 계약 서명 `async getInboundOverview(query, userPermissions, teamId)` vs 실제 `async getInboundOverview(query, teamId)`. `userPermissions` 파라미터 없음.
- **Fix**: 계약 서명과 일치시키거나, 계약 변경이 의도적이라면 계약을 명시적으로 개정해야 함. `userPermissions` 파라미터 추가 시 내부에서 접근 범위 필터링에 활용 가능.

---

### [3.1-FAIL-M9] `InboundOverviewResponseSchema` Zod 스키마 미존재 + parse 미호출

- **File 1**: `packages/schemas/src/checkout.ts`
- **Issue**: `InboundOverviewQuerySchema`만 존재. 계약이 명시한 `InboundOverviewResponseSchema`(z.object with standard/rental/internalShared/sparkline/generatedAt) 없음.
- **Fix**: 계약 명시대로 다음을 추가:
  ```typescript
  export const InboundOverviewResponseSchema = z.object({
    standard: CheckoutListResponseSchema,
    rental: EquipmentImportListResponseSchema,
    internalShared: EquipmentImportListResponseSchema,
    sparkline: z.object({
      standard: z.array(z.number()).length(14),
      rental: z.array(z.number()).length(14),
      internalShared: z.array(z.number()).length(14),
    }),
    generatedAt: z.string().datetime(),
  });
  export type InboundOverviewResponse = z.infer<typeof InboundOverviewResponseSchema>;
  ```

- **File 2**: `apps/frontend/lib/api/checkout-api.ts` L572-581
- **Issue**: 로컬 `InboundOverviewResponse` 인터페이스 사용, `schema.parse()` 미호출. SSOT Rule 0 위반.
- **Fix**: 로컬 인터페이스 제거 → `@equipment-management/schemas`에서 import + 응답에 `InboundOverviewResponseSchema.parse(response.data)` 적용

---

### [3.1-FAIL-M14] `getInboundOverview` Redis cache 미적용

- **File**: `apps/backend/src/modules/checkouts/checkouts.service.ts` L903 (getInboundOverview 메서드 내)
- **Issue**: `cacheService.getOrSet()` 호출 없음. 동일 필터로 반복 요청 시 매번 6개 DB 쿼리 실행.
- **Fix**: 메서드 진입부에 팀별 캐시 키 생성 후 `cacheService.getOrSet(cacheKey, async () => { ... }, 30)` 패턴 적용. 키 예시: `inbound-overview:t:${teamId}:s:${statusFilter}:q:${searchTerm}`.

---

### [3.1-FAIL-M16] 변경 파일 9개 초과 (실제 10-11개)

- **Issue**: `packages/shared-constants/src/api-endpoints.ts`(계약 미포함)와 `checkouts.service.spec.ts`(계약에서 별도 카운트) 포함으로 9개 초과.
- **Note**: `next-env.d.ts`는 자동 생성 파일이므로 제외 가능. `api-endpoints.ts`의 `INBOUND_OVERVIEW` 상수 추가는 SSOT 관점에서 올바르나 계약 scope 미기재. M16은 계약 문서 개정(실제 필요 파일 수 반영) 또는 수용 기준 재협의로 해소 권장.

---

### [3.2-FAIL-M7] 13파일 중 2파일 미준수 (`CreateCheckoutContent.tsx`, `CheckoutHistoryTab.tsx`)

- **File 1**: `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx` L161
- **Issue**: `queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.all })` — write 후 광역 무효화. 계약은 모든 13파일에 `.view.*` 또는 `.resource.*` 경유를 요구.
- **Fix**: 생성 후에는 목록 뷰만 갱신하면 충분하므로 `queryKeys.checkouts.view.all()`로 교체:
  ```typescript
  await queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.view.all() });
  ```

- **File 2**: `apps/frontend/components/equipment/CheckoutHistoryTab.tsx` L140
- **Issue**: `queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.all, exact: false })` — 광역 무효화.
- **Fix**: 장비 반출 이력 탭은 detail 관련이므로 `queryKeys.checkouts.resource.all()` 또는 명시적 detail 키 사용 검토:
  ```typescript
  queryClient.invalidateQueries({ queryKey: queryKeys.checkouts.resource.all(), exact: false });
  ```
