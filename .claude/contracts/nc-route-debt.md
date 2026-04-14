---
slug: nc-route-debt
created: 2026-04-14
mode: 1
---

# Contract: nc-route-debt

## Scope

1. **라우트 순서 버그 수정** — `non-conformances.controller.ts`
2. **verification.ts equipment_imports checkCount 추가**
3. **tech-debt SHOULD 7건** (filter-utils SSOT, magic number 상수화, type 명시)

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend run tsc --noEmit` 0 errors | CLI |
| M2 | `pnpm --filter frontend run tsc --noEmit` 0 errors | CLI |
| M3 | `pnpm --filter backend run test` 전체 PASS | CLI |
| M4 | `GET /non-conformances/equipment/:equipmentUuid` 라우트가 `GET /non-conformances/:uuid` 보다 먼저 선언됨 | Grep 검증 |
| M5 | `verification.ts`에 `equipment_imports` table checkCount 호출 존재 | Grep 검증 |
| M6 | `EQUIPMENT_IMPORTS_SEED_DATA` import가 `verification.ts`에 존재 | Grep 검증 |

## SHOULD Criteria (루프 차단 없음, tech-debt-tracker 기록)

| # | Criterion | File |
|---|-----------|------|
| S1 | `error-reporter.ts:105` `process.env.NEXT_PUBLIC_API_URL` → `API_BASE_URL` | `apps/frontend/lib/error-reporter.ts` |
| S2 | `history-card.service.ts` `.limit(50)` 7건 → shared-constants 상수 | `apps/backend/src/modules/equipment/services/history-card.service.ts` |
| S3 | `form-template-export.service.ts` `.limit(1000)/.limit(500)` → shared-constants 상수 | `apps/backend/src/modules/reports/form-template-export.service.ts` |
| S4 | `reports-filter-utils.ts` `convertFiltersToApiParams` + `ApiReportsFilters` 추가 | `apps/frontend/lib/utils/reports-filter-utils.ts` |
| S5 | `software-filter-utils.ts` `toApiFilters` → `convertFiltersToApiParams` + `ApiTestSoftwareFilters` | `apps/frontend/lib/utils/software-filter-utils.ts` |
| S6 | `audit.controller.ts` 반환 타입 `Promise<unknown>` 4건 → 구체적 타입 | `apps/backend/src/modules/audit/audit.controller.ts` |
| S7 | `users.controller.ts` `SIGNATURE_ALLOWED_TYPES/MAX_SIZE` → shared-constants | `apps/backend/src/modules/users/users.controller.ts` |

## Out of Scope

- 인접 코드 리팩토링 (수술적 변경 원칙)
- 새 기능 추가
- DB 마이그레이션
