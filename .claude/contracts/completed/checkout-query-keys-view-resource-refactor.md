---
slug: checkout-query-keys-view-resource-refactor
type: contract
date: 2026-04-24
depends: [checkout-inbound-bff-overview]
sprint: 3
sprint_step: 3.2
---

# Contract: Sprint 3.2 — `queryKeys.checkouts.view.*` / `.resource.*` 계층 재편

## Context

V2 리뷰 §3 권장: 현재 `queryKeys.checkouts` 네임스페이스가 평면(flat)이며 prefix 구분 없음.

**현재 (`apps/frontend/lib/api/query-config.ts` L500-514)**:
```typescript
queryKeys.checkouts.{all, lists, list, detail, outbound, inbound, destinations, pending, pendingCount, returnPending, summary}
queryKeys.equipmentImports.{all, lists, list, detail, bySourceType}
```

**문제**: `invalidateQueries({ queryKey: [...checkouts.all] })`가 상세/요약/목록 모두 무효화 → over-invalidation. 필요한 것은 "목록 뷰만 무효화" 또는 "요약만 무효화" 같은 축별 분리.

**목표** (리뷰 §3 권장 + MEMORY.md `buildDetailCachePattern SSOT` 정합):
```typescript
queryKeys.checkouts.view.outbound(filters)           // 목록 뷰 — outbound
queryKeys.checkouts.view.inboundOverview(filters)    // 목록 뷰 — inbound BFF (Sprint 3.1)
queryKeys.checkouts.view.inboundSection(kind, filters)  // 섹션 상세 페이지네이션
queryKeys.checkouts.resource.detail(id)              // 개별 리소스
queryKeys.checkouts.resource.pendingCount()          // 카운트 요약
queryKeys.checkouts.resource.destinations()          // destination 목록
queryKeys.checkouts.resource.summary(params)         // summary 위젯
queryKeys.checkouts.resource.returnPending()         // 반입 대기 카운트
```

- `view.*` 하위 전체 무효화: `invalidateQueries({ queryKey: [...checkouts.all, 'view'] })`
- `resource.detail(id)` 만 무효화: 기존 패턴과 동일
- MEMORY.md `feedback_cache_key_json_sorted`: 필터 객체 필드 순서 의존 금지. 본 contract에서도 동일.

---

## Scope

### 수정 대상
- `apps/frontend/lib/api/query-config.ts`
  - L500-514 `queryKeys.checkouts` 전면 재편:
    ```typescript
    checkouts: {
      all: ['checkouts'] as const,
      view: {
        all: () => [...queryKeys.checkouts.all, 'view'] as const,
        outbound: (filters: OutboundFilters = {}) =>
          [...queryKeys.checkouts.view.all(), 'outbound', filters] as const,
        inboundOverview: (filters: InboundOverviewFilters = {}) =>
          [...queryKeys.checkouts.view.all(), 'inbound-overview', filters] as const,
        inboundSection: (kind: 'standard' | 'rental' | 'internalShared', filters: object = {}) =>
          [...queryKeys.checkouts.view.all(), 'inbound-section', kind, filters] as const,
      },
      resource: {
        all: () => [...queryKeys.checkouts.all, 'resource'] as const,
        detail: (id: string) => [...queryKeys.checkouts.resource.all(), 'detail', id] as const,
        pendingCount: () => [...queryKeys.checkouts.resource.all(), 'pending-count'] as const,
        destinations: () => [...queryKeys.checkouts.resource.all(), 'destinations'] as const,
        summary: (params: object = {}) =>
          [...queryKeys.checkouts.resource.all(), 'summary', params] as const,
        returnPending: () => [...queryKeys.checkouts.resource.all(), 'return-pending'] as const,
      },
    }
    ```
  - `queryKeys.equipmentImports`는 **유지**. 다만 `bySourceType('rental'|'internal_shared', filters)`는 "inbound section의 상세 페이지네이션" 용도로만 사용 — `view.inboundSection`이 wrapper가 될 수 있으나 일단 병행.
- 호출처 전수 업데이트 — `grep`으로 확인된 13개 파일:
  - `apps/frontend/app/(dashboard)/checkouts/CheckoutsContent.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/[id]/check/ConditionCheckClient.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/[id]/return/ReturnCheckoutClient.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/pending-checks/PendingChecksClient.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx`
  - `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx`
  - `apps/frontend/components/equipment-imports/CreateEquipmentImportForm.tsx`
  - `apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx`
  - `apps/frontend/components/equipment-imports/ReceiveEquipmentImportForm.tsx`
  - `apps/frontend/components/equipment/CheckoutHistoryTab.tsx`
  - `apps/frontend/hooks/use-prefetch-detail.ts`
- `apps/frontend/lib/api/cache-invalidation.ts`
  - Cache invalidation 매트릭스(있다면)에서 `checkouts.all` → `view.all()` 또는 `resource.detail()` 구분 사용.
  - 이벤트 기반 캐시 리스너(MEMORY.md `project_73`, `project_76`)의 regex 패턴이 신규 키 구조에서도 매칭되도록 업데이트. **필드 순서 의존 금지** (MEMORY.md `feedback_cache_key_json_sorted`).
- E2E `apps/frontend/tests/e2e/features/checkouts/suite-21-pending-checks/s21-pending-checks.spec.ts`에서 queryKey 직접 참조 시 업데이트.

### 수정 금지
- `queryKeys.calibrations` / `queryKeys.disposal` / 다른 도메인.
- `queryKeys.equipmentImports` 구조 (별 이슈 없음 — inbound section과 병용).
- TanStack Query config preset (`QUERY_CONFIG.*`).

### 신규 생성
- (없음 — 기존 key 재구조만)

---

## MUST Criteria (실패 시 루프 차단)

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm tsc --noEmit` exit 0 | 빌드 |
| M2 | `pnpm --filter frontend exec eslint` error 0 | lint |
| M3 | `pnpm --filter frontend run test` + `test:e2e` 통과 | 테스트 |
| M4 | `query-config.ts`에 `checkouts.view.{outbound, inboundOverview, inboundSection}` + `checkouts.resource.{detail, pendingCount, destinations, summary, returnPending}` 8개 함수 정의 | grep 확인 |
| M5 | `checkouts.view.all()` + `checkouts.resource.all()` 헬퍼 함수 존재 (invalidate 축 제공) | grep |
| M6 | 구 평면 키 `queryKeys.checkouts.outbound`, `.inbound`, `.list`, `.lists`, `.detail`, `.destinations`, `.pending`, `.pendingCount`, `.summary`, `.returnPending` 0건 | `grep -cE "queryKeys\.checkouts\.(outbound\|inbound\|list\|lists\|destinations\|pending\|pendingCount\|summary\|returnPending)\b" apps/frontend/` = 0 (new view/resource prefix 경유 필수) |
| M7 | 호출처 13 파일 모두 신규 prefix 경유 (수동 review + grep) | 각 파일에 `queryKeys.checkouts.view` 또는 `.resource` 참조 |
| M8 | `cache-invalidation.ts`에서 `invalidateQueries({ queryKey: queryKeys.checkouts.view.all() })` 같은 축 무효화 패턴 사용 | grep 확인 |
| M9 | `cache-invalidation.ts`의 regex/정규식 매칭이 **필드 순서 의존 없음** — JSON filter 객체의 필드 순서 달라도 매칭 (MEMORY.md `feedback_cache_key_json_sorted`) | 코드 review + test |
| M10 | E2E 기존 테스트(`suite-21-pending-checks` 등) 통과 | test |
| M11 | `lists()` 헬퍼는 유지 필요성 재검토 — 대부분 호출처가 `list(filters)` 또는 `view.outbound(filters)` 경유. 사용 없으면 제거 | 조사 후 결정 |
| M12 | 변경 파일 = `query-config.ts` + 13 호출처 + `cache-invalidation.ts` = **최대 15개** | `git diff --name-only \| grep -v '^\.claude/' \| wc -l` <= 15 |
| M13 | 필터 객체 key sorting 또는 canonical form 헬퍼 (MEMORY.md 규칙 준수) — 있으면 재사용, 없으면 S로 이동 | 확인 |
| M14 | invalidate 회귀 없음 — 승인/반려 후 목록 즉시 refresh (Optimistic UI 동작 유지) E2E | test |

---

## SHOULD Criteria

| # | Criterion | Tech-debt slug |
|---|-----------|----------------|
| S1 | `queryKeys.equipmentImports.bySourceType`를 `queryKeys.checkouts.view.inboundSection`으로 통합 (단일 inbound 경로) | `equipment-imports-view-unify` |
| S2 | Canonical filter key sorting 헬퍼 `canonicalizeFilters(obj)` 신설 (Sprint 3 범위 아니면 SHOULD) | `canonical-filter-sort-helper` |
| S3 | TanStack Query invalidation cheatsheet 문서 생성 — "언제 view.all() vs resource.all() vs 단일 detail 무효화" | `query-invalidation-cheatsheet-doc` |
| S4 | `queryKeys.checkouts.resource.summary` 캐시 TTL 5s로 단축 (실시간성) — 현재 CHECKOUT_SUMMARY preset 유지 | `summary-cache-ttl-tune` |
| S5 | `verify-cache-events` skill에 신규 prefix 매칭 규칙 추가 | `verify-cache-events-prefix-update` |
| S6 | 다른 도메인(calibrations, approvals)도 `view.*`/`resource.*` prefix 도입 검토 | `all-domains-view-resource-refactor` |

---

## Verification Commands

```bash
# 1. 타입 + 테스트
pnpm tsc --noEmit
pnpm --filter frontend run test
pnpm --filter frontend run test:e2e -- checkouts

# 2. MUST grep
grep -cE "view\.outbound|view\.inboundOverview|view\.inboundSection|resource\.detail|resource\.pendingCount|resource\.destinations|resource\.summary|resource\.returnPending" apps/frontend/lib/api/query-config.ts
# 기대: 8+

grep -cE "queryKeys\.checkouts\.(outbound|inbound|list|lists|destinations|pending|pendingCount|summary|returnPending)\b" apps/frontend/ -r --include="*.ts" --include="*.tsx" | grep -v ".next" | wc -l
# 기대: 0 (모두 view/resource prefix 경유)

# 호출처 전수 확인
grep -rln "queryKeys\.checkouts\.view\|queryKeys\.checkouts\.resource" apps/frontend/ --include="*.ts" --include="*.tsx" | grep -v ".next" | wc -l
# 기대: 13+

grep -n "queryKeys\.checkouts\.view\.all\|queryKeys\.checkouts\.resource\.all" apps/frontend/lib/api/cache-invalidation.ts
# 기대: 1+ hit (축 무효화 사용)

# 3. 변경 파일 수
git diff --name-only | grep -v '^\.claude/' | wc -l
# 기대: <= 15
```

---

## 마이그레이션 매핑 테이블 (구 → 신)

| 구 key | 신 key |
|---|---|
| `queryKeys.checkouts.list(filters)` | `queryKeys.checkouts.view.outbound(filters)` (or `.view.inboundSection('standard', filters)` 맥락별) |
| `queryKeys.checkouts.outbound(teamId, status, location)` | `queryKeys.checkouts.view.outbound({teamId, status, location})` |
| `queryKeys.checkouts.inbound(filters)` | `queryKeys.checkouts.view.inboundSection('standard', filters)` |
| `queryKeys.checkouts.detail(id)` | `queryKeys.checkouts.resource.detail(id)` |
| `queryKeys.checkouts.destinations()` | `queryKeys.checkouts.resource.destinations()` |
| `queryKeys.checkouts.pending(role)` | `queryKeys.checkouts.resource.summary({ kind: 'pending', role })` 또는 resource.pending 신설 검토 |
| `queryKeys.checkouts.pendingCount()` | `queryKeys.checkouts.resource.pendingCount()` |
| `queryKeys.checkouts.returnPending()` | `queryKeys.checkouts.resource.returnPending()` |
| `queryKeys.checkouts.summary(params)` | `queryKeys.checkouts.resource.summary(params)` |

호출처별 변경 diff는 reviewer 편의를 위해 커밋 메시지에 매핑 요약 포함.

---

## Acceptance

루프 완료 조건 = MUST 14개 모두 PASS + E2E 회귀 통과.
invalidation 축이 view/resource 2분할로 정리됨. 새 BFF `inbound-overview`와 기존 detail/summary/count가 **독립적으로** 무효화 가능.
SHOULD 미달 항목은 `tech-debt-tracker.md`에 등록 후 루프 종료.

---

## 연계 contracts

- Sprint 3.1 · `checkout-inbound-bff-overview.md` — **같은 PR에서 병합 권장**. view.* prefix가 본 contract에서 완성.
- MEMORY.md `project_76_tech_debt_0420b`·`project_74`·`buildDetailCachePattern SSOT` — 키 구조 정합.
- Sprint 4 · U-01(일괄 승인) — view.all() 축 무효화가 일괄 승인 후 목록 refresh에 사용.
