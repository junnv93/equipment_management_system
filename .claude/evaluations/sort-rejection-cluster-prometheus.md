# Evaluation Report: sort-rejection-cluster-prometheus

Date: 2026-05-09
Iteration: 1

## Summary

PASS

## MUST Criteria

| ID | Criterion | Result | Evidence |
|----|-----------|--------|---------|
| M-1 | `SORT_REJECTION_RATE_LIMITER` DI 토큰 + `SortRejectionRateLimiter` 인터페이스 + `SortRejectionDropReason` type이 `security/contract.ts`에 정의됨 | PASS | grep count = 4 (≥ 3). SORT_REJECTION_RATE_LIMITER (Symbol, line 23), SortRejectionRateLimiter (interface, line 58), SortRejectionDropReason (type, line 53) 확인. |
| M-2 | `SortRejectionRedisRateLimiterService`가 `SortRejectionRateLimiter` implements + Redis Lua + in-memory fallback 구현 | PASS | grep count = 5 (≥ 3). `implements SortRejectionRateLimiter` (line 30), `RATE_LIMIT_LUA` (line 89), `acquireSlotFallback` (line 102) 확인. |
| M-3 | Redis key prefix가 `sr:rl:counter` + `sr:dedupe` (system-health `sh:` 와 분리) | PASS | grep count = 2 (≥ 2). RATE_LIMIT_KEY_PREFIX = 'sr:rl:counter' (line 14), DEDUPE_KEY_PREFIX = 'sr:dedupe' (line 15) 확인. |
| M-4 | `SortRejectionTelemetryService`에 in-memory Map (`recentRejections`) 제거됨 | PASS | grep → 0건. 파일에 `recentRejections` / `currentMinuteCount` 없음 확인. |
| M-5 | `SortRejectionTelemetryService`가 `SORT_REJECTION_RATE_LIMITER` inject + async `doRecord` 패턴 | PASS | grep count = 4 (≥ 2). `SORT_REJECTION_RATE_LIMITER` (line 8, 29), `doRecord` (line 36, 39), `void this` (line 36) 확인. |
| M-6 | `SecurityTelemetryModule`이 `MetricsModule` import + `SortRejectionRedisRateLimiterService` 등록 | PASS | grep count = 8 (≥ 3). MetricsModule (line 5, 22), SortRejectionRedisRateLimiterService (line 3, 23, 24), SORT_REJECTION_RATE_LIMITER (line 4, 24) 확인. |
| M-7 | `MetricsService`에 `sort_rejection_total` Counter + `observeSortRejection()` 메서드 추가 | PASS | grep count = 2 (≥ 2). Counter 등록 (line 87), 메서드 (line 158) 확인. |
| M-8 | `MetricsService`에 `sort_rejection_drops_total` Counter + `incrementSortRejectionDrops()` 메서드 추가 | PASS | grep count = 2 (≥ 2). Counter 등록 (line 94), 메서드 (line 162) 확인. |
| M-9 | `sort_rejection_total` labelNames: `['route', 'reason']` — cardinality 통제 (reason은 3 enum 값) | PASS | labelNames: ['route', 'reason'] (metrics.service.ts line 89). SortRejectionReason = 3값 ('invalid_value' / 'too_big' / 'invalid_type') 확인. |
| M-10 | telemetry spec이 mock rateLimiter 기반 — allowed/not-allowed 분기, log format, fire-and-forget 검증 | PASS | grep count = 18 (≥ 4). acquireSlot (makeRateLimiter 내), mockResolvedValue (line 20), flush (line 11, 70, 88 등 다수), fire-and-forget 'rateLimiter.acquireSlot 이 reject 해도 service 는 throw 안 함' 검증 확인. |
| M-11 | Redis rate limiter spec — allowed/dedupe/rate-limit/fallback/lifecycle 분기 검증 | PASS | 파일 존재 확인. 5개 describe 블록: 정상경로(4 cases) + graceful degradation(3) + invalidValue 길이(1) + lifecycle(1) = 21 tests 전체 PASS. |
| M-12 | `tsc --noEmit` PASS (backend) | PASS | `pnpm --filter backend exec tsc --noEmit` → 출력 없음(0 errors). |
| M-13 | backend test PASS | PASS | 2 suites, 21 tests, 0 failures. `sort-rejection-telemetry.spec.ts` + `sort-rejection-redis-rate-limiter.spec.ts` 모두 PASS. |
| M-14 | SSOT 위반 없음 — `SortRejectionRateLimiter` 로컬 재정의 0건 | PASS | grep → 0건. contract.ts 외 `interface SortRejectionRateLimiter` 정의 없음. |
| M-15 | 하드코딩 없음 — 상한값 상수로 선언 (`MAX_LOGS_PER_MINUTE`) | PASS | `const MAX_LOGS_PER_MINUTE = 60;` (line 12) 상수 선언 확인. 코드 내 `60` 리터럴도 모두 `MAX_LOGS_PER_MINUTE` 참조. |

## SHOULD Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S-1 | Redis 장애 시 `Logger.warn` 1회/분 throttle (system-health 패턴) | PASS | `fallbackWarnedAt` 필드 + `if (now - this.fallbackWarnedAt >= 60_000)` 패턴으로 1회/분 throttle 구현 (sort-rejection-redis-rate-limiter.service.ts lines 39, 62-67). |
| S-2 | `incrementSortRejectionDrops` 가 drop reason Prometheus counter 증가 — telemetry spec 에서 mock metricsService 통해 검증 | PASS | telemetry spec에서 `makeMetricsService()` mock + `expect(metrics.incrementSortRejectionDrops).toHaveBeenCalledWith('dedupe')` / `'rate-limit-fallback'` 2개 분기 모두 검증. |
| S-3 | `SortRejectionRedisRateLimiterService`의 `onModuleDestroy`가 `client.quit()` 호출 (lifecycle spec) | PASS | 구현 (service.ts line 50-52) + lifecycle spec 'onModuleDestroy 호출 시 Redis client.quit() 실행' (spec.ts lines 157-161) 모두 확인. |

## Issues Found

없음. 모든 MUST/SHOULD 기준 충족.

## Verdict

PASS
