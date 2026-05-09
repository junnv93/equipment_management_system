# Contract: sort-rejection-cluster-prometheus

Sprint: three-low-tech-debt-closure S-1 + S-3  
Date: 2026-05-09  
Mode: 1 (Lightweight)  
Slug: sort-rejection-cluster-prometheus

## Goal

S-1: `SortRejectionTelemetryService` in-memory rate limiter → Redis Lua atomic counter 격상  
S-3: `MetricsService.observeSortRejection()` Prometheus Counter 추가

## Changed Files

| File | Change |
|------|--------|
| `common/security/contract.ts` | `SORT_REJECTION_RATE_LIMITER` + `SortRejectionRateLimiter` + `SortRejectionDropReason` 추가 |
| `common/security/sort-rejection-redis-rate-limiter.service.ts` | NEW — Redis Lua + in-memory fallback |
| `common/security/sort-rejection-telemetry.service.ts` | in-memory 제거, rateLimiter + metricsService 주입 |
| `common/security/security-telemetry.module.ts` | MetricsModule import + 새 service 등록 |
| `common/metrics/metrics.service.ts` | `sort_rejection_total` + `sort_rejection_drops_total` Counter |
| `common/security/__tests__/sort-rejection-telemetry.spec.ts` | mock rateLimiter 기반 재작성 |
| `common/security/__tests__/sort-rejection-redis-rate-limiter.spec.ts` | NEW |

## MUST Criteria

| ID | Criterion | Verification |
|----|-----------|-------------|
| M-1 | `SORT_REJECTION_RATE_LIMITER` DI 토큰 + `SortRejectionRateLimiter` 인터페이스 + `SortRejectionDropReason` type이 `security/contract.ts`에 정의됨 | `grep -c "SORT_REJECTION_RATE_LIMITER\|SortRejectionRateLimiter\|SortRejectionDropReason" apps/backend/src/common/security/contract.ts` ≥ 3 |
| M-2 | `SortRejectionRedisRateLimiterService`가 `SortRejectionRateLimiter` implements + Redis Lua + in-memory fallback 구현 | `grep -c "implements SortRejectionRateLimiter\|RATE_LIMIT_LUA\|acquireSlotFallback" apps/backend/src/common/security/sort-rejection-redis-rate-limiter.service.ts` ≥ 3 |
| M-3 | Redis key prefix가 `sr:rl:counter` + `sr:dedupe` (system-health `sh:` 와 분리) | `grep -c "sr:rl:counter\|sr:dedupe" apps/backend/src/common/security/sort-rejection-redis-rate-limiter.service.ts` ≥ 2 |
| M-4 | `SortRejectionTelemetryService`에 in-memory Map (`recentRejections`) 제거됨 | `grep "recentRejections\|currentMinuteCount" apps/backend/src/common/security/sort-rejection-telemetry.service.ts` → 0건 |
| M-5 | `SortRejectionTelemetryService`가 `SORT_REJECTION_RATE_LIMITER` inject + async `doRecord` 패턴 | `grep -c "SORT_REJECTION_RATE_LIMITER\|doRecord\|void this" apps/backend/src/common/security/sort-rejection-telemetry.service.ts` ≥ 2 |
| M-6 | `SecurityTelemetryModule`이 `MetricsModule` import + `SortRejectionRedisRateLimiterService` 등록 | `grep -c "MetricsModule\|SortRejectionRedisRateLimiterService\|SORT_REJECTION_RATE_LIMITER" apps/backend/src/common/security/security-telemetry.module.ts` ≥ 3 |
| M-7 | `MetricsService`에 `sort_rejection_total` Counter + `observeSortRejection()` 메서드 추가 | `grep -c "sort_rejection_total\|observeSortRejection" apps/backend/src/common/metrics/metrics.service.ts` ≥ 2 |
| M-8 | `MetricsService`에 `sort_rejection_drops_total` Counter + `incrementSortRejectionDrops()` 메서드 추가 | `grep -c "sort_rejection_drops_total\|incrementSortRejectionDrops" apps/backend/src/common/metrics/metrics.service.ts` ≥ 2 |
| M-9 | `sort_rejection_total` labelNames: `['route', 'reason']` — cardinality 통제 (reason은 3 enum 값) | `grep "sort_rejection_total" -A 3 apps/backend/src/common/metrics/metrics.service.ts \| grep "route.*reason\|labelNames"` PASS |
| M-10 | telemetry spec이 mock rateLimiter 기반 — allowed/not-allowed 분기, log format, fire-and-forget 검증 | `grep -c "acquireSlot\|mockResolvedValue\|await.*resolve\|flush" apps/backend/src/common/security/__tests__/sort-rejection-telemetry.spec.ts` ≥ 4 |
| M-11 | Redis rate limiter spec — allowed/dedupe/rate-limit/fallback/lifecycle 분기 검증 | `ls apps/backend/src/common/security/__tests__/sort-rejection-redis-rate-limiter.spec.ts` EXISTS |
| M-12 | `tsc --noEmit` PASS (backend) | `pnpm --filter backend run tsc --noEmit` 0 errors |
| M-13 | backend test PASS | `pnpm --filter backend run test` 0 failures |
| M-14 | SSOT 위반 없음 — `SortRejectionRateLimiter` 로컬 재정의 0건 | `grep -rn "interface SortRejectionRateLimiter" apps/backend/src --include="*.ts" \| grep -v "contract.ts"` → 0건 |
| M-15 | 하드코딩 없음 — 상한값 상수로 선언 (`MAX_LOGS_PER_MINUTE`) | `grep "MAX_LOGS_PER_MINUTE\|= 60" apps/backend/src/common/security/sort-rejection-redis-rate-limiter.service.ts` EXISTS |

## SHOULD Criteria

| ID | Criterion |
|----|-----------|
| S-1 | Redis 장애 시 `Logger.warn` 1회/분 throttle (system-health 패턴) |
| S-2 | `incrementSortRejectionDrops` 가 drop reason Prometheus counter 증가 — telemetry spec 에서 mock metricsService 통해 검증 |
| S-3 | `SortRejectionRedisRateLimiterService`의 `onModuleDestroy`가 `client.quit()` 호출 (lifecycle spec) |
