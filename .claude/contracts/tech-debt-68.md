# Contract — tech-debt-68

**Date**: 2026-04-14
**Mode**: Mode 1 (Lightweight Harness)
**Slug**: tech-debt-68

## Scope

68차 tech-debt 배치 (4건):
1. 장비 이력 탭 3개 useQuery QUERY_CONFIG.HISTORY spread 누락
2. audit.service.ts cursor/user limit 하드코딩 → SSOT
3. dashboard.service.ts days=30 하드코딩 → SSOT
4. repair-history.ts createdByUser/deletedByUser relations 미완성

---

## MUST Criteria (루프 차단 기준)

| ID | 기준 | 검증 명령 |
|----|------|-----------|
| M-1 | `pnpm tsc --noEmit` → exit 0 (전체) | `pnpm tsc --noEmit` |
| M-2 | backend tests 674 PASS | `pnpm --filter backend run test` |
| M-3 | LocationHistoryTab, MaintenanceHistoryTab, IncidentHistoryTab useQuery에 QUERY_CONFIG.HISTORY spread | grep 3 hits |
| M-4 | 3개 탭 파일에 staleTime 하드코딩 없음 | 0 hit |
| M-5 | AUDIT_CURSOR_PAGE_SIZE, AUDIT_LOGS_BY_USER in business-rules.ts | 2 hits |
| M-6 | `size="icon" asChild` Button에 aria-label 직접 부착 (0 miss) | 0 hit without aria-label |
| M-7 | QUERY_CONFIG.HISTORY LocationHistoryTab에 1 hit | 1 hit |
| M-8 | audit.service.ts 하드코딩 `limit = 30` / `limit = 100` 없음 | 0 hit |
| M-9 | dashboard.service.ts 하드코딩 `days = 30` 없음 | 0 hit |
| M-10 | repair-history.ts createdByUser/deletedByUser 2 hit | 2 hits |

## SHOULD Criteria (기술부채 기록)

| ID | 기준 |
|----|------|
| S-1 | docker-compose.prod.yml floating 태그 핀닝 (0482fd49에서 확인 필요) |
