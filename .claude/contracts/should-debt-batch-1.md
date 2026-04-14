---
slug: should-debt-batch-1
mode: 1
created: 2026-04-14
---

# Contract: SHOULD 기술부채 배치 처리 #1

## 목표

tech-debt-tracker.md의 SHOULD 미완료 항목 6건을 아키텍처 수준에서 수정.

## 변경 파일 목록

1. `packages/shared-constants/src/business-rules.ts` — HISTORY_CARD_QUERY_LIMIT 상수 추가
2. `packages/shared-constants/src/index.ts` — export 오타 수정 (HISTORY_CARD_QUERY_LIMITS → HISTORY_CARD_QUERY_LIMIT)
3. `apps/backend/src/modules/reports/form-template-export.service.ts` — EXPORT_QUERY_LIMITS 적용
4. `apps/backend/src/modules/audit/audit.controller.ts` — Promise<unknown> 4건 → 구체적 타입
5. `apps/frontend/lib/error-reporter.ts` — process.env.NEXT_PUBLIC_API_URL → API_BASE_URL
6. `apps/frontend/lib/utils/reports-filter-utils.ts` — convertFiltersToApiParams + ApiReportsFilters 추가
7. `apps/frontend/app/(dashboard)/reports/ReportsContent.tsx` — convertFiltersToApiParams 사용
8. `apps/frontend/lib/utils/software-filter-utils.ts` — convertFiltersToApiParams + ApiTestSoftwareFilters 추가
9. `apps/frontend/app/(dashboard)/software/TestSoftwareListContent.tsx` — convertFiltersToApiParams 사용

## MUST Criteria

- [ ] M1: `cd apps/backend && npx tsc --noEmit` → 0 errors (history-card, form-template-export, audit-controller 관련 오류 해소)
- [ ] M2: `pnpm --filter frontend tsc --noEmit` → 0 errors
- [ ] M3: `grep 'HISTORY_CARD_QUERY_LIMIT,' packages/shared-constants/src/index.ts` → 1 hit (오타 수정 확인)
- [ ] M4: `grep '\.limit(1000)\|\.limit(500)' apps/backend/src/modules/reports/form-template-export.service.ts` → 0 hit (상수로 교체)
- [ ] M5: `grep 'Promise<unknown>' apps/backend/src/modules/audit/audit.controller.ts` → 0 hit
- [ ] M6: `grep 'process\.env\.NEXT_PUBLIC_API_URL' apps/frontend/lib/error-reporter.ts` → 0 hit
- [ ] M7: `grep 'convertFiltersToApiParams' apps/frontend/lib/utils/reports-filter-utils.ts` → 1 hit
- [ ] M8: `grep 'convertFiltersToApiParams' apps/frontend/lib/utils/software-filter-utils.ts` → 1 hit

## SHOULD Criteria

- [ ] S1: `pnpm --filter backend run test` → PASS
- [ ] S2: ReportsContent.tsx 내 additionalParams 인라인 조건 로직이 convertFiltersToApiParams 호출로 대체
- [ ] S3: TestSoftwareListContent.tsx가 toApiFilters 대신 convertFiltersToApiParams 사용
