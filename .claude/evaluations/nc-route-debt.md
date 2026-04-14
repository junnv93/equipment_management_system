---
slug: nc-route-debt
iteration: 2
verdict: PASS
---

## MUST Criteria

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| M1 Backend tsc 0 errors | PASS | `pnpm --filter backend exec tsc --noEmit` → 0 errors |
| M2 Frontend tsc 0 errors | PASS | `pnpm --filter frontend exec tsc --noEmit` → 0 errors |
| M3 Backend unit tests PASS | PASS | 671 tests passed, 50 suites |
| M4 라우트 순서 (equipment/:uuid → :uuid) | PASS | non-conformances.controller.ts L115 `@Get('equipment/:equipmentUuid')` < L135 `@Get(':uuid')` |
| M5 equipment_imports checkCount 존재 | PASS | verification.ts: `checkCount(pool, 'Equipment Imports count', 'equipment_imports', EQUIPMENT_IMPORTS_SEED_DATA.length)` |
| M6 EQUIPMENT_IMPORTS_SEED_DATA import | PASS | verification.ts L41: import from `../seed-data/operations/equipment-imports.seed` |

## SHOULD Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| S1 error-reporter.ts API_BASE_URL | PASS | `API_BASE_URL` imported from `@/lib/config/api-config`, 직접 참조 제거 |
| S2 history-card.service.ts magic number → HISTORY_CARD_QUERY_LIMIT | PASS | shared-constants `HISTORY_CARD_QUERY_LIMIT = 50` 7곳 모두 교체 |
| S3 form-template-export.service.ts magic number → EXPORT_QUERY_LIMITS | PASS | L231/1296 `FULL_EXPORT`, L1569 `SECTION_EXPORT` 사용 |
| S4 reports-filter-utils.ts convertFiltersToApiParams + ApiReportsFilters | PASS | 인터페이스 + 함수 추가 |
| S5 software-filter-utils.ts convertFiltersToApiParams + ApiTestSoftwareFilters | PASS | `toApiFilters` → `convertFiltersToApiParams`, `ApiTestSoftwareFilters` 타입 추가, 소비자 업데이트 |
| S6 audit.controller.ts 반환 타입 구체화 | PASS | 이전 세션에서 이미 완료 |
| S7 users.controller.ts SIGNATURE_UPLOAD_LIMITS shared-constants | PASS | 로컬 static 상수 제거 → `SIGNATURE_UPLOAD_LIMITS` 임포트 |

## Summary

**All MUST criteria PASS. All SHOULD criteria PASS.**

- tsc (backend + frontend): 0 errors
- 백엔드 유닛 테스트: 671 PASS / 50 suites
- 라우트 순서 버그 수정 완료
- verification.ts equipment_imports 추가 완료
- 7건 tech-debt SHOULD 전부 해결
