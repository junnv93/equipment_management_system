---
slug: cache-arch-unification
title: Cache Architecture Unification — buildCacheKey SSOT + NC dual-invalidation + onVersionConflict consistency
mode: 1
created: 2026-04-12
---

## Scope

1. scope-aware `buildCacheKey` + `normalizeCacheParams` 5곳 복제 → 공통 팩토리 함수 추출
2. NC 서비스 이중 캐시 무효화 (직접호출 + 이벤트) → 이벤트 단일 경로 통일
3. `onVersionConflict` async 처리 차이 (await vs no-await) → 통일

## MUST Criteria

| # | Criterion | Verification |
|---|-----------|-------------|
| M1 | `pnpm --filter backend run tsc --noEmit` PASS | CLI |
| M2 | `pnpm --filter backend run build` PASS | CLI |
| M3 | `pnpm --filter backend run test` ALL PASS | CLI |
| M4 | 5개 서비스에서 private buildCacheKey/normalizeCacheParams 메서드 제거됨 | Grep |
| M5 | 공통 유틸의 buildCacheKey 출력이 기존과 동일 (키 형식 불변) | 코드 검토 |
| M6 | onVersionConflict 전 서비스 await 통일 | Grep |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | NC close/rejectCorrection에서 중복 cacheInvalidationHelper 직접호출 제거 |
| S2 | 공통 유틸에 단위 테스트 추가 |
