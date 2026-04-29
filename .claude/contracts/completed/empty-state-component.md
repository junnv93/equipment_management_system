# Contract: empty-state-component

## Summary
공용 EmptyState 컴포넌트(3-variant 팩토리)를 신규 생성하고, checkouts/equipment 빈 상태 JSX 중복을 마이그레이션한다.
EQUIPMENT_EMPTY_STATE_TOKENS을 semantic.ts로 승격(EMPTY_STATE_TOKENS)하고 equipment.ts는 re-export(@deprecated) 유지.

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter frontend exec tsc --noEmit` 에러 0 | tsc 실행 결과 |
| M2 | `components/shared/EmptyState.tsx` 파일 존재 | file exists check |
| M3 | `EmptyStateProps.variant` = `'no-data' \| 'filtered' \| 'status-filtered'` 타입 정의 | grep in EmptyState.tsx |
| M4 | `EMPTY_STATE_TOKENS` semantic.ts에 export | grep in semantic.ts |
| M5 | `EQUIPMENT_EMPTY_STATE_TOKENS`가 equipment.ts에서 `EMPTY_STATE_TOKENS` re-export (`@deprecated` 주석 포함) | grep in equipment.ts |
| M6 | `OutboundCheckoutsTab.tsx`의 인라인 `renderEmptyState()` JSX 제거 → `<EmptyState>` 사용 | grep renderEmptyState → 0 hit in OutboundCheckoutsTab |
| M7 | `InboundCheckoutsTab.tsx`의 인라인 `renderEmptyState()` JSX 제거 → `<EmptyState>` 사용 | grep renderEmptyState → 0 hit in InboundCheckoutsTab |
| M8 | `EquipmentEmptyState.tsx` 내부 구현이 `EmptyState` 사용 (public API 유지) | EmptyState import in EquipmentEmptyState.tsx |
| M9 | `EmptyState`에 `aria-live="polite"` + `role="status"` 적용 | grep in EmptyState.tsx |
| M10 | i18n 키 추가: `checkouts.empty.noData.title/description`, `checkouts.empty.filtered.title/description` — ko + en 양쪽 | grep in messages/ko/checkouts.json + messages/en/checkouts.json |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `primaryAction.permission` prop 있을 때 `useAuth().can()` 조건부 렌더링 |
| S2 | variant별 아이콘 색상 차등: no-data=brand-info/5, filtered=muted, status-filtered=문맥 색상 |
| S3 | 변경 파일 ≤ 10개 |

## Changed Files (Expected)

1. `apps/frontend/lib/design-tokens/semantic.ts` — EMPTY_STATE_TOKENS 추가
2. `apps/frontend/lib/design-tokens/components/equipment.ts` — re-export + @deprecated
3. `apps/frontend/lib/design-tokens/index.ts` — EMPTY_STATE_TOKENS export 추가
4. `apps/frontend/components/shared/EmptyState.tsx` — 신규
5. `apps/frontend/components/equipment/EquipmentEmptyState.tsx` — EmptyState 사용으로 내부 리팩토링
6. `apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx` — EmptyState 사용
7. `apps/frontend/app/(dashboard)/checkouts/tabs/InboundCheckoutsTab.tsx` — EmptyState 사용
8. `apps/frontend/messages/ko/checkouts.json` — i18n 키 추가
9. `apps/frontend/messages/en/checkouts.json` — i18n 키 추가
