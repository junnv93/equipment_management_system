---
slug: report-query-perf
created: 2026-04-18
mode: 1
---

# Contract: report-query-perf

## Scope

| File | Change |
|------|--------|
| `apps/backend/src/modules/reports/form-template-export.service.ts` | 1) resolveUser N+1 → inArray 배치 쿼리 2) exportSoftwareRegistry teamId ForbiddenException 가드 |
| `apps/backend/src/modules/reports/services/equipment-registry-data.service.ts` | SELECT * → 명시적 16개 컬럼 + EquipmentRegistryRow 타입 Pick으로 교체 |

## Item 4 Status

`notifications.type`은 `varchar(50)` (PG enum 아님). `non_conformance_attachment*` 값 DB 0건.
**No action required.**

---

## MUST Criteria

| # | Criterion | How to verify |
|---|-----------|---------------|
| M1 | `pnpm --filter backend run tsc --noEmit` PASS | Run tsc |
| M2 | `pnpm --filter backend run build` PASS | Run build |
| M3 | `pnpm --filter backend run test` PASS | Run tests |
| M4 | `resolveUser` 함수 제거 — 단일 `inArray` 배치 쿼리로 대체 | `grep -n "resolveUser"` → 0건 |
| M5 | `exportSoftwareRegistry`에 `filter.teamId` → `ForbiddenException` 가드 추가 | `grep -n "SCOPE_RESOURCE_MISMATCH"` 2건(registry + validation) |
| M6 | `equipment-registry-data.service.ts` `.select()` → 명시적 컬럼 `.select({...})` | `grep -n "\.select()"` → 해당 파일에서 0건 |
| M7 | `EquipmentRegistryRow` 타입이 `$inferSelect`(전체) 아닌 `Pick<>` 또는 명시적 16컬럼 | 확인 |
| M8 | SSOT: 기존 `inArray` import 활용, 새 import 추가 불필요 | 확인 |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | `EquipmentRegistryRow` 타입 주석 — 렌더러 의존 컬럼임을 명시 |
| S2 | inArray 배치 쿼리에 dedup(Set)으로 중복 ID 제거 |
