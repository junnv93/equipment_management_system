# Contract: ssot-hardcoding-cleanup

**Mode**: 1 (Lightweight)
**Slug**: ssot-hardcoding-cleanup
**등록일**: 2026-04-14

## 목적

tech-debt-tracker의 SHOULD 항목 8건을 한 번에 처리한다.
모두 additive / non-logic-changing 변경이므로 Mode 1로 배치 처리.

## 변경 범위

| 파일 | 변경 내용 |
|------|----------|
| `packages/shared-constants/src/business-rules.ts` | `HISTORY_CARD_QUERY_LIMITS`, `EXPORT_QUERY_LIMITS`, `SIGNATURE_UPLOAD_LIMITS` 상수 추가 |
| `apps/frontend/lib/error-reporter.ts` | `process.env.NEXT_PUBLIC_API_URL` → `API_BASE_URL` import |
| `apps/backend/src/modules/equipment/services/history-card.service.ts` | `.limit(50)` × 7 → `HISTORY_CARD_QUERY_LIMITS.SECTION_ITEMS` |
| `apps/backend/src/modules/reports/form-template-export.service.ts` | `.limit(1000)` × 2, `.limit(500)` × 1 → `EXPORT_QUERY_LIMITS.*` |
| `apps/backend/src/modules/users/users.controller.ts` | `SIGNATURE_MAX_SIZE` / `SIGNATURE_ALLOWED_TYPES` static field → `SIGNATURE_UPLOAD_LIMITS.*` import |
| `apps/backend/src/modules/audit/audit.controller.ts` | `Promise<unknown>` × 4 → 구체적 반환 타입 |
| `apps/frontend/lib/utils/reports-filter-utils.ts` | `ApiReportsFilters` interface + `convertFiltersToApiParams` 함수 추가 |
| `apps/frontend/lib/utils/software-filter-utils.ts` | `ApiTestSoftwareFilters` interface + `convertFiltersToApiParams` 별칭 추가 |

## MUST 기준 (PASS/FAIL)

- [ ] M1: `pnpm --filter backend run tsc --noEmit` → exit 0
- [ ] M2: `pnpm --filter frontend run tsc --noEmit` → exit 0
- [ ] M3: `pnpm --filter @equipment-management/shared-constants run tsc --noEmit` → exit 0
- [ ] M4: `pnpm --filter backend run test` → 기존 테스트 모두 통과
- [ ] M5: `grep 'NEXT_PUBLIC_API_URL' apps/frontend/lib/error-reporter.ts` → 0 hit
- [ ] M6: `grep "private static readonly SIGNATURE" apps/backend/src/modules/users/users.controller.ts` → 0 hit
- [ ] M7: `grep "Promise<unknown>" apps/backend/src/modules/audit/audit.controller.ts` → 0 hit
- [ ] M8: `grep "toApiFilters" apps/frontend/ -r --include='*.ts' --include='*.tsx'` → 0 hit (이전 세션에서 함수 + 호출처 모두 제거됨, 잔존 없어야 함)
- [ ] M9: `grep "convertFiltersToApiParams" apps/frontend/lib/utils/software-filter-utils.ts` → 1 hit (신규 추가)
- [ ] M10: `grep "convertFiltersToApiParams" apps/frontend/lib/utils/reports-filter-utils.ts` → 1 hit (신규 추가)

## SHOULD 기준

- [ ] S1: shared-constants 신규 상수에 JSDoc 주석 포함
- [ ] S2: software-filter-utils의 `toApiFilters`는 deprecated 주석 표시 + convertFiltersToApiParams 위임 구현
