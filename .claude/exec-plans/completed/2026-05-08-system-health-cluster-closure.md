# Exec Plan: system-health-cluster-closure

## 메타
- 생성: 2026-05-08
- 모드: Mode 2 (Full)
- Slug: system-health-cluster-closure
- 예상 변경: 신규 7 + 수정 8 + 삭제 2 = 17개

## Summary

`SystemErrorEventProviderImpl` in-memory rate limiter(PM2/K8s replicas 환경에서 인스턴스별 분당 60건 → 클러스터 전체 N×60건 폭주 위험)를 Redis-backed 클러스터 안전 구현으로 교체하면서 **4개 tech-debt 항목을 단일 sprint로 통합 closure**:

1. **Cluster-aware rate limiter** (MEDIUM) — Redis Lua atomic INCR + dedupe `SET NX EX`. Graceful degradation으로 Redis 미가용 시 in-memory fallback (응답 흐름 비차단 보장).
2. **Prometheus drops counter** (LOW) — `system_error_events_drops_total{reason}` Counter를 MetricsService에 등록 → `record()` drop 경로 모두 계측.
3. **Shim import enforcement** (LOW) — `tokens.ts`/`types.ts` 4 파일 import 라인을 `common/system-health/contract` 직접 import로 마이그레이션 → shim 삭제 → ESLint `no-restricted-imports` 패턴으로 회귀 영구 차단.
4. **Controller E2E** (LOW) — `/api/dashboard/system-health` 200/403/401 + response shape 검증 e2e spec.

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Redis 라이브러리 | `ioredis` 직접 + Lua script | `rate-limiter-flexible` 신규 dependency 미도입 — 기존 `createRedisClient()` 팩토리 SSOT 활용 |
| Rate limiter API | `acquireSlot(event): Promise<{ allowed: boolean; reason: ... }>` | 단일 메서드로 rate-limit + dedupe 통합. reason 반환으로 Prometheus counter labeling 자동 |
| Lua script 위치 | TS string export (`system-health-rate-limiter.lua.ts`) | 별도 `.lua` 파일 빌드 파이프라인 추가 불필요 |
| Redis client lifecycle | `SystemHealthRedisRateLimiterService` 자체 client 소유 + `OnModuleDestroy` quit() | 공유 client cross-domain 영향 회피. `maxRetries: 0` fail-fast |
| Fallback 전략 | Redis 호출 실패 → in-memory rate limiter → drop counter `'rate-limit-fallback'` | 응답 흐름 비차단 contract 불변 |
| Drop reason enum | `'rate-limit' \| 'dedupe' \| 'errorcode-truncate' \| 'rate-limit-fallback'` — contract.ts SSOT | 4 reason 명시, low-cardinality, silent drop 모두 표면화 |
| Counter 이름 | `system_error_events_drops_total{reason}` | prometheus naming convention `_total` suffix |
| Shim 정리 정책 | 4 파일 마이그레이션 → shim 2개 삭제 → ESLint pattern 추가 | 삭제 + ESLint 가드 = defense-in-depth |
| E2E scope | controller layer 한정 (200/403/401 + response shape) | 권한 가드 회귀 자동 차단이 목적 |

## Phase 순서

### Phase 1: SSOT 신설 — contract 확장
**목표:** `common/system-health/contract.ts`에 `SystemHealthRateLimiter` interface + `SystemErrorEventDropReason` 타입 + `SYSTEM_HEALTH_RATE_LIMITER` Symbol 추가.

**변경:**
- `apps/backend/src/common/system-health/contract.ts` — SYSTEM_HEALTH_RATE_LIMITER Symbol + SystemErrorEventDropReason union + SystemHealthRateLimiter interface

**검증:** `pnpm --filter backend run tsc --noEmit`

---

### Phase 2: Redis-backed rate limiter 구현
**목표:** `SystemHealthRedisRateLimiterService` 신설 — Lua atomic counter + `SET NX EX` dedupe + Redis 실패 시 in-memory fallback.

**변경:**
1. `apps/backend/src/common/system-health/system-health-rate-limiter.lua.ts` — 신규 (Lua script TS string export)
2. `apps/backend/src/common/system-health/system-health-redis-rate-limiter.service.ts` — 신규
3. `apps/backend/src/common/system-health/system-health.module.ts` — 신규

**검증:** `pnpm --filter backend run tsc --noEmit`

---

### Phase 3: MetricsService Counter 등록 + Provider integration
**목표:** drops Counter 등록 + `SystemErrorEventProviderImpl`이 rate limiter 주입받아 사용. 기존 in-memory 필드/메서드 삭제.

**변경:**
1. `apps/backend/src/common/metrics/metrics.service.ts` — `systemErrorEventsDropsCounter` + `incrementSystemErrorEventDrops(reason)` 추가
2. `apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` — rate limiter 주입, `shouldCapture` 삭제, counter 호출
3. `apps/backend/src/modules/dashboard/dashboard.module.ts` — `SystemHealthModule` import 추가

**검증:** `pnpm --filter backend run tsc --noEmit`

---

### Phase 4: Shim 마이그레이션
**목표:** 4 파일 import 경로를 `common/system-health/contract` 직접 import로 변경.

**변경:**
1. `apps/backend/src/modules/dashboard/dashboard.module.ts` — shim → contract
2. `apps/backend/src/modules/dashboard/dashboard.service.ts` — shim → contract
3. `apps/backend/src/common/filters/__tests__/error.filter.spec.ts` — shim → contract
4. `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts` — shim → contract

**검증:** `grep -rn "health-providers/tokens\|health-providers/types" apps/backend/src/` (0건)

---

### Phase 5: Shim 삭제 + ESLint 회귀 차단
**목표:** shim 파일 2개 삭제 + `.eslintrc.js` no-restricted-imports 패턴 추가.

**변경:**
1. `apps/backend/src/modules/dashboard/health-providers/tokens.ts` — **삭제**
2. `apps/backend/src/modules/dashboard/health-providers/types.ts` — **삭제**
3. `apps/backend/.eslintrc.js` — shim 차단 패턴 추가

**검증:** `pnpm --filter backend run lint && pnpm --filter backend run test`

---

### Phase 6: 회귀 Spec 신설
**목표:** rate limiter unit + drops counter + graceful degradation + controller e2e spec 4종.

**변경:**
1. `apps/backend/src/common/system-health/__tests__/system-health-redis-rate-limiter.spec.ts` — 신규 (≥6 cases)
2. `apps/backend/src/common/metrics/__tests__/metrics-system-health-drops.spec.ts` — 신규 (4 reason exhaustive)
3. `apps/backend/src/modules/dashboard/health-providers/__tests__/system-error-event-provider-rate-limit.spec.ts` — 신규/수정
4. `apps/backend/test/dashboard.system-health.e2e-spec.ts` — 신규 (200/403/401)

**검증:**
```bash
pnpm --filter backend run test -- --testPathPattern="system-health-redis-rate-limiter|metrics-system-health-drops|system-error-event-provider-rate-limit"
pnpm --filter backend run test:e2e -- --testPathPattern="dashboard.system-health"
```

---

### Phase 7: 문서화 + Tracker closure
**목표:** `backend-patterns.md` 섹션 신설, tech-debt [x] 4건, MEMORY.md 인덱스.

**변경:**
1. `docs/references/backend-patterns.md` — "System Health Rate Limiter (Cluster-Aware)" 섹션
2. `.claude/exec-plans/tech-debt-tracker.md` — 4 항목 [x]

---

## 전체 파일 요약

| 분류 | 파일 | 용도 |
|------|------|------|
| 신규 | `common/system-health/system-health-rate-limiter.lua.ts` | Lua atomic script |
| 신규 | `common/system-health/system-health-redis-rate-limiter.service.ts` | Redis rate limiter |
| 신규 | `common/system-health/system-health.module.ts` | DI module |
| 신규 | `common/system-health/__tests__/system-health-redis-rate-limiter.spec.ts` | unit spec |
| 신규 | `common/metrics/__tests__/metrics-system-health-drops.spec.ts` | drops counter spec |
| 신규 | `dashboard/health-providers/__tests__/system-error-event-provider-rate-limit.spec.ts` | provider spec |
| 신규 | `test/dashboard.system-health.e2e-spec.ts` | controller e2e |
| 수정 | `common/system-health/contract.ts` | SSOT 확장 |
| 수정 | `common/metrics/metrics.service.ts` | drops Counter |
| 수정 | `dashboard/health-providers/system-error-event.provider.ts` | rate limiter 주입 |
| 수정 | `dashboard/dashboard.module.ts` | module 등록 + shim 마이그레이션 |
| 수정 | `dashboard/dashboard.service.ts` | shim 마이그레이션 |
| 수정 | `common/filters/__tests__/error.filter.spec.ts` | shim 마이그레이션 |
| 수정 | `dashboard/__tests__/dashboard.service.spec.ts` | shim 마이그레이션 |
| 수정 | `.eslintrc.js` | no-restricted-imports 패턴 |
| 수정 | `docs/references/backend-patterns.md` | 섹션 신설 |
| 삭제 | `health-providers/tokens.ts` | shim 제거 |
| 삭제 | `health-providers/types.ts` | shim 제거 |
