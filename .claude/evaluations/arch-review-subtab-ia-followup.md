---
slug: arch-review-subtab-ia-followup
date: 2026-04-22
scope: CheckoutsContent.tsx, OutboundCheckoutsTab.tsx, InboundCheckoutsTab.tsx, query-config.ts
verdict: WARN
---

## Architecture Review Results

### Critical Issues
없음.

### Warnings (should fix)

**W1: CHECKOUT_DESTINATIONS staleTime/gcTime이 CACHE_TTL DAY 티어와 불일치**
- 위치: query-config.ts (CHECKOUT_DESTINATIONS 프리셋)
- packages/shared-constants/cache-config.ts:31에서 DAY 티어 주석이 "반출 목적지 목록"을 예시로 명시
- 현재: staleTime: CACHE_TIMES.LONG(5분) / gcTime: CACHE_TIMES.VERY_LONG(10분)
- 수정안: staleTime: CACHE_TIMES.DAY, gcTime: CACHE_TIMES.DAY
- → 즉시 수정

**W2: OutboundCheckoutsTab isAllActive 인라인이 countActiveFilters SSOT 우회**
- 위치: OutboundCheckoutsTab.tsx:196-201
- checkout-filter-utils.ts에 countActiveFilters(filters) 함수가 존재하는데 5개 필드 인라인 재확인
- 새 필터 추가 시 동기화 누락 위험
- 수정안: `const filterActive = countActiveFilters(filters) > 0; const isAllActive = !filterActive;`
- → 즉시 수정

### Observations (정상 확인)
- O1: WCAG tablist/tabpanel sibling 관계 + aria-controls/aria-labelledby 매핑 정확 ✅
- O2: Radix Select 4개 핸들러 동일값 가드 정상 ✅
- O3: filtersToSearchParams SSOT 일관 사용 ✅
- O4: CHECKOUT_LIST/CHECKOUT_SUMMARY/EQUIPMENT_IMPORT_LIST 캐시 전략 적절 ✅
- O5: 레이어 위반 없음, SSOT import 정확 ✅
