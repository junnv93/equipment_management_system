# Contract: tech-debt-constants-ssot

**Mode**: 1 (Lightweight)
**Slug**: tech-debt-constants-ssot
**Date**: 2026-04-14

## 작업 범위

tech-debt-tracker.md SHOULD 항목 일괄 처리:
1. SSOT 상수 도입 (QUERY_SAFETY_LIMITS 확장, FORM_EXPORT_QUERY_LIMITS, USER_SIGNATURE_CONSTRAINTS)
2. Filter utils SSOT 패턴 완성 (reports + software)
3. API URL 하드코딩 제거 (error-reporter.ts)
4. audit.controller.ts Promise<unknown> 구체화
5. performance.integration.spec.ts Rule 1 위반 수정

## 변경 파일 목록

1. `packages/shared-constants/src/business-rules.ts` — 상수 추가
2. `packages/shared-constants/src/index.ts` — 신규 상수 export
3. `apps/backend/src/modules/equipment/services/history-card.service.ts` — .limit(50) → QUERY_SAFETY_LIMITS.HISTORY_CARD_RELATIONS
4. `apps/backend/src/modules/reports/form-template-export.service.ts` — .limit(1000)/.limit(500) → FORM_EXPORT_QUERY_LIMITS
5. `apps/backend/src/modules/users/users.controller.ts` — SIGNATURE 상수 → USER_SIGNATURE_CONSTRAINTS
6. `apps/frontend/lib/error-reporter.ts` — API_BASE_URL import
7. `apps/frontend/lib/utils/reports-filter-utils.ts` — ApiReportsFilters + convertFiltersToApiParams 추가
8. `apps/frontend/lib/utils/software-filter-utils.ts` — toApiFilters → convertFiltersToApiParams rename + ApiTestSoftwareFilters
9. `apps/frontend/app/(dashboard)/software/TestSoftwareListContent.tsx` — import 업데이트
10. `apps/backend/src/modules/audit/audit.controller.ts` — Promise<unknown> 구체화
11. `apps/backend/src/database/tests/performance.integration.spec.ts` — Rule 1 수정

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| 1 | backend tsc PASS | `pnpm --filter backend run tsc --noEmit` → exit 0 |
| 2 | frontend tsc PASS | `pnpm --filter frontend run tsc --noEmit` → exit 0 |
| 3 | shared-constants tsc PASS | `pnpm --filter @equipment-management/shared-constants run tsc --noEmit` → exit 0 |
| 4 | backend tests PASS | `pnpm --filter backend run test` → exit 0 |
| 5 | Rule 1 준수 | `grep 'equipment_management_test' apps/backend/src/database/tests/performance.integration.spec.ts` → 0 hit |
| 6 | process.env 직접 접근 제거 | `grep 'process.env.NEXT_PUBLIC_API_URL' apps/frontend/lib/error-reporter.ts` → 0 hit |
| 7 | toApiFilters 비표준 제거 | `grep 'toApiFilters' apps/frontend/app` → 0 hit |

## SHOULD Criteria (non-blocking)

| # | Criterion |
|---|-----------|
| S1 | `grep 'HISTORY_CARD_RELATIONS\|FORM_EXPORT_QUERY_LIMITS\|USER_SIGNATURE_CONSTRAINTS' packages/shared-constants/src/business-rules.ts` → 3 hits |
| S2 | `grep 'Promise<unknown>' apps/backend/src/modules/audit/audit.controller.ts` → 0 hit |
| S3 | `grep 'convertFiltersToApiParams' apps/frontend/lib/utils/reports-filter-utils.ts` → 1 hit |
| S4 | `grep 'convertFiltersToApiParams' apps/frontend/lib/utils/software-filter-utils.ts` → 1 hit |
