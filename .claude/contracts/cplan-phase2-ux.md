# Contract: cplan-phase2-ux

## Task
calibration-plans Phase 2 tech-debt 4종 + TableRow 이중 네비게이션 수정

## Scope
- CalibrationPlansContent.tsx — TableRow 이중 네비게이션 제거 + year "모든 연도" 필터 + ErrorState
- CalibrationPlanDetailClient.tsx — Sticky 액션바 + Reject textarea minLength=10
- PlanItemsTable.tsx — confirmItem optimistic update
- calibration-plans-filter-utils.ts — year `_all` sentinel 지원
- use-calibration-plans-filters.ts — year `_all` URL 유지
- ko/en calibration.json — allYears + rejectReasonHint i18n 키

## MUST Criteria

| # | Criterion | Pass Condition |
|---|-----------|----------------|
| M1 | tsc --noEmit | frontend exit 0 |
| M2 | frontend build | next build exit 0 |
| M3 | TableRow onClick 제거 | CalibrationPlansContent.tsx에 `router.push` 없음, `useRouter` import 없음 |
| M4 | year _all 필터 동작 | filter-utils.ts에서 `yearRaw === '_all' ? '' : yearRaw` 변환 존재 |
| M5 | Sticky 액션바 | CalibrationPlanDetailClient.tsx 헤더에 `sticky` 클래스 존재 |
| M6 | Reject minLength=10 | Textarea에 `minLength` prop 또는 버튼 disabled 조건에 `< 10` 존재 |
| M7 | confirmItem optimistic | PlanItemsTable.tsx에 optimisticConfirmedId 또는 동등 패턴 존재 |
| M8 | i18n 완전성 | ko+en calibration.json에 `allYears` 키 존재 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | year _all countActiveFilters에 포함 |
| S2 | Reject char count 힌트 표시 |
| S3 | Sticky header에 border-b visual separator 존재 |

## Verification Commands
```bash
pnpm --filter frontend run tsc --noEmit
pnpm --filter frontend run build
```
