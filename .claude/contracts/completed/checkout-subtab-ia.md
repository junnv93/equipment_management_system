# Contract: checkout-subtab-ia

PR-12 v2 — 반출 목록 IA 서브탭 (진행 중 / 완료)

## Slug
checkout-subtab-ia

## Scope
- apps/frontend/lib/utils/checkout-filter-utils.ts
- apps/frontend/components/checkouts/CheckoutListTabs.tsx (신규)
- apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| M1 | `pnpm --filter frontend run tsc --noEmit` exits 0 | CI |
| M2 | `pnpm --filter frontend run build` exits 0 | CI |
| M3 | `UICheckoutFilters` 에 `subTab: CheckoutSubTab` 필드 추가 | Grep |
| M4 | `DEFAULT_UI_FILTERS.subTab === 'inProgress'` | Grep |
| M5 | `parseCheckoutFiltersFromSearchParams` — URL `?subTab=completed` 파싱 | Grep |
| M6 | `filtersToSearchParams` — `subTab === 'inProgress'` 시 생략, `completed` 시 포함 | Grep |
| M7 | `convertFiltersToApiParams` — `status==='all'` 시 subTab 상태 목록을 `statuses`로 전달 | Grep |
| M8 | `SUBTAB_STATUS_GROUPS.inProgress` + `SUBTAB_STATUS_GROUPS.completed` 합집합 = 모든 CheckoutStatus | 코드 검증 |
| M9 | `CheckoutListTabs` 컴포넌트: `role="tablist"`, `aria-selected`, 키보드 ←/→ 지원 | Grep/Review |
| M10 | i18n 키 사용: `list.subtab.inProgress`, `list.subtab.completed`, `list.count.checkouts` | Grep |
| M11 | subTab 전환 시 `status` 리셋(→ 'all') + `page` 리셋(→ 1) | Grep |
| M12 | `countActiveFilters` — `subTab` 제외 (탐색 파라미터, 필터 아님) | Grep |
| M13 | `OutboundCheckoutsTab` — 빈 상태 i18n이 subTab에 따라 분기 | Grep |
| M14 | 하드코딩 상태값 없음 — 모든 상태값 `SUBTAB_STATUS_GROUPS` 경유 | self-audit |

## SHOULD Criteria (루프 차단 없음)

| ID | Criterion |
|----|-----------|
| S1 | 비활성 서브탭에도 카운트 배지 (별도 lightweight 쿼리) |
| S2 | 서브탭 전환 애니메이션 (CHECKOUT_MOTION 토큰 사용) |
| S3 | 모바일 bottom sheet 레이아웃 |

## Status Group Definition

```
inProgress: pending, approved, overdue, checked_out, lender_checked,
            borrower_received, in_use, borrower_returned, lender_received, returned
completed:  return_approved, canceled, rejected
```

총 13개 CheckoutStatus ← CHECKOUT_STATUS_VALUES 와 동일해야 함.
