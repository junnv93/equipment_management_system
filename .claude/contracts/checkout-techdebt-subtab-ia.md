---
slug: checkout-techdebt-subtab-ia
date: 2026-04-22
scope: apps/frontend — CheckoutsContent.tsx, OutboundCheckoutsTab.tsx, lib/api/query-config.ts
---

# Contract: 반출 필터 UI tech-debt (subtab-ia 후속)

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|--------------|
| M1 | `pnpm --filter frontend tsc --noEmit` 통과 | CLI |
| M2 | `CheckoutListTabs` (role=tablist)가 `role="tabpanel"` div의 **sibling**으로 배치 (WCAG 4.1.2) | grep/read |
| M3 | `role="tabpanel"` div 내부에 `role="tablist"` 요소가 없음 | grep |
| M4 | `handleStatusChange` / `handleLocationChange` / `handlePurposeChange` / `handlePeriodChange` 각각 첫 라인에 `if (value === filters.X) return;` 가드 존재 | grep/read |
| M5 | `QUERY_CONFIG` 에 `CHECKOUT_LIST`, `CHECKOUT_SUMMARY`, `CHECKOUT_DESTINATIONS` 키 추가 | grep |
| M6 | `CheckoutsContent.tsx` 의 직접 `staleTime: CACHE_TIMES.*` 3곳이 `...QUERY_CONFIG.CHECKOUT_*` 스프레드로 교체 | grep |
| M7 | `OutboundCheckoutsTab.tsx:handlePageChange` 가 `filtersToSearchParams` 사용, `new URLSearchParams(searchParams.toString())` 직접 조작 없음 | grep/read |
| M8 | `OutboundCheckoutsTab.tsx` 의 `staleTime: CACHE_TIMES.SHORT` 가 `...QUERY_CONFIG.CHECKOUT_LIST` 로 교체 | grep |

## SHOULD Criteria (루프 차단 없음, tech-debt 기록)

| # | Criterion |
|---|-----------|
| S1 | InboundCheckoutsTab.tsx 에도 동일한 QUERY_CONFIG 프리셋 적용 (별도 PR) |
| S2 | OutboundCheckoutsTab.tsx 에서 더 이상 사용되지 않는 `CACHE_TIMES` import 제거 |
| S3 | CheckoutsContent.tsx 에서 더 이상 사용되지 않는 `CACHE_TIMES` import 제거 |

## Domain Context

- `filtersToSearchParams` (checkout-filter-utils.ts): 기본값(all/1)과 같은 필터는 URL 파라미터 생략 — `new URLSearchParams(searchParams)` 직접 조작과 달리 SSOT 보장
- `QUERY_CONFIG` (query-config.ts): REFETCH_STRATEGIES 기반 프리셋 — 하드코딩된 staleTime 대신 의미적 이름으로 갱신 전략을 선언
- WCAG Tab Pattern: `role=tablist` ↔ `role=tabpanel` 는 형제 관계, `aria-controls`/`aria-labelledby`로 연결
