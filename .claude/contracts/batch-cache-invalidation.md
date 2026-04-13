# Contract: batch-cache-invalidation

**Slug**: batch-cache-invalidation  
**Mode**: 1 (Lightweight)  
**Date**: 2026-04-13  
**Source**: example-prompts.md — 46차 🟠 HIGH — batchStatusUpdate 캐시 무효화 O(n) → O(unique teams) + Promise.all 병렬화

---

## Deliverables

1. `apps/backend/src/modules/equipment/equipment.service.ts`
   - `private invalidateCacheBatch(entries: { equipmentId: string; teamId?: string }[]): Promise<void>` 신설
   - `batchStatusUpdate` 루프(line ~1184-1186) → `invalidateCacheBatch()` 단일 호출로 교체
   - 기존 `private invalidateCache(equipmentId, teamId?)` → `invalidateCacheBatch([{equipmentId, teamId}])` 위임 (DRY, 시그니처 유지)

---

## MUST Criteria (루프 차단)

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm tsc --noEmit` exit 0 | CLI |
| M2 | `pnpm --filter backend run test` 578+ PASS | CLI |
| M3 | `batchStatusUpdate` 내 `for.*of updated.*invalidateCache` 패턴 0 hit | `grep -n 'for.*of updated\|invalidateCache.*for\|forEach.*invalidate' apps/backend/src/modules/equipment/equipment.service.ts` |
| M4 | `invalidateCacheBatch` 메서드 정의 존재 | `grep -n 'invalidateCacheBatch' apps/backend/src/modules/equipment/equipment.service.ts \| wc -l` ≥ 2 (정의 + 호출처) |
| M5 | global/dashboard 무효화가 배치 내 1회만 실행 | `invalidateCacheBatch` 구현에서 `invalidateAllDashboard` 호출이 루프 밖 단일 Promise.all에 있는지 코드 확인 |
| M6 | 단건 `invalidateCache` 시그니처 유지 (기존 호출처 변경 없음) | `grep -n 'await this.invalidateCache(' apps/backend/src/modules/equipment/equipment.service.ts` — 기존 호출처 패턴 유지 |

---

## SHOULD Criteria (tech-debt, 루프 차단 안 함)

| # | Criterion |
|---|-----------|
| S1 | `invalidateCacheBatch` JSDoc 주석: "O(unique teams) 최적화, global/dashboard 1회만" |

---

## Out of Scope

- Redis 전환 관련 변경
- 다른 서비스의 캐시 무효화 패턴 변경
- checkouts 프론트엔드 (다른 세션 작업 중)
