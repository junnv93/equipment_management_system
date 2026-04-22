---
slug: checkout-techdebt-subtab-ia
date: 2026-04-22
iteration: 1
verdict: PASS
---

## MUST Results

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1 | PASS | `pnpm --filter frontend exec tsc --noEmit` 무출력(성공) |
| M2 | PASS | OutboundCheckoutsTab.tsx:352–356 — `<CheckoutListTabs />` 가 `role="tabpanel"` div(라인 358) 앞 sibling으로 배치 |
| M3 | PASS | `role="tabpanel"` div(라인 358–501) 내부에 CheckoutListTabs 또는 `role="tablist"` 없음 |
| M4 | PASS | handleStatusChange/handleLocationChange/handlePurposeChange/handlePeriodChange 모두 첫 라인에 `if (value === filters.X) return;` 가드 존재 |
| M5 | PASS | query-config.ts — CHECKOUT_LIST, CHECKOUT_SUMMARY, CHECKOUT_DESTINATIONS 모두 QUERY_CONFIG에 존재 |
| M6 | PASS | CheckoutsContent.tsx — pendingChecksData: `...QUERY_CONFIG.CHECKOUT_SUMMARY`, destinations: `...QUERY_CONFIG.CHECKOUT_DESTINATIONS`, liveSummary: `...QUERY_CONFIG.CHECKOUT_SUMMARY`. 직접 `staleTime: CACHE_TIMES.*` 없음 |
| M7 | PASS | OutboundCheckoutsTab.tsx:handlePageChange — `filtersToSearchParams({ ...filters, page: newPage })` 사용. 직접 URLSearchParams 조작 없음 |
| M8 | PASS | OutboundCheckoutsTab.tsx — `...QUERY_CONFIG.CHECKOUT_LIST` 스프레드 사용. 직접 `staleTime: CACHE_TIMES.SHORT` 없음 |

## SHOULD Results

| Criterion | Verdict | Note |
|-----------|---------|------|
| S2 | PASS | OutboundCheckoutsTab.tsx imports에 CACHE_TIMES 없음 (자동 제거됨) |
| S3 | PASS | CheckoutsContent.tsx imports에 CACHE_TIMES 없음 (자동 제거됨) |

## Issues (FAIL only)
없음.

## 관찰 사항 (참고용, FAIL 아님)
- OutboundCheckoutsTab.tsx:handleSubTabChange — `new URLSearchParams(searchParams.toString())` 직접 조작이 남아 있음. M7 기준 대상(handlePageChange)과 달라 FAIL 아니나, filtersToSearchParams와 일관성 불일치. 추후 tech-debt 등록 권고.
