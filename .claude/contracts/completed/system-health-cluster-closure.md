# 스프린트 계약: system-health-cluster-closure

## 생성 시점
2026-05-08

## Slug
system-health-cluster-closure

## 모드
Mode 2 (Full) — 4 tech-debt 통합 closure (cluster-aware rate limiter + drops counter + shim enforcement + controller e2e)

---

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### 라운드 #1 — 빌드 + 정합성

- [ ] **M-1** `pnpm tsc --noEmit` 에러 0
  - 검증: `pnpm tsc --noEmit 2>&1 | grep -c "error TS"` = 0

- [ ] **M-2** `pnpm --filter backend run test` PASS — 신규 spec 포함 회귀 0
  - 검증: backend unit test exit 0

- [ ] **M-3** `pnpm --filter backend run test:e2e` PASS — `dashboard.system-health.e2e-spec.ts` 포함
  - 검증: e2e exit 0

- [ ] **M-4** `pnpm --filter backend run lint` 에러 0
  - 검증: `pnpm --filter backend run lint 2>&1 | grep -cE "error" | grep -v "^0$"` = 0

- [ ] **M-5** `pnpm --filter backend run build` 에러 0

#### 라운드 #2 — SSOT 정합 + import boundary

- [ ] **M-6** Shim 파일 2개 삭제 완료
  - 검증: `test ! -f apps/backend/src/modules/dashboard/health-providers/tokens.ts && echo OK`
  - 검증: `test ! -f apps/backend/src/modules/dashboard/health-providers/types.ts && echo OK`

- [ ] **M-7** Shim import 0건 — production code + spec 모두
  - 검증: `grep -rn "health-providers/tokens\|health-providers/types" apps/backend/src/ 2>/dev/null | wc -l` = 0

- [ ] **M-8** ESLint no-restricted-imports 패턴에 shim 차단 추가
  - 검증: `grep -c "health-providers/tokens\|health-providers/types" apps/backend/.eslintrc.js` ≥ 1

- [ ] **M-9** Rate limiter SSOT — contract.ts에 Symbol + interface + DropReason 정의
  - 검증: `grep -c "SYSTEM_HEALTH_RATE_LIMITER" apps/backend/src/common/system-health/contract.ts` = 1
  - 검증: `grep -c "SystemHealthRateLimiter" apps/backend/src/common/system-health/contract.ts` ≥ 1
  - 검증: `grep -c "SystemErrorEventDropReason" apps/backend/src/common/system-health/contract.ts` ≥ 1

- [ ] **M-10** Drop reason 4 enum SSOT — 4 reason 모두 contract.ts에 정의
  - 검증: `grep -E "rate-limit|dedupe|errorcode-truncate|rate-limit-fallback" apps/backend/src/common/system-health/contract.ts | wc -l` ≥ 1

- [ ] **M-11** SystemErrorEventProviderImpl 의 in-memory state 제거 (rate limiter 위임)
  - 검증: `grep -c "currentMinuteWindowStart\|currentMinuteInserts\|recentDedupeKeys\|shouldCapture" apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` = 0

- [ ] **M-12** record() 가 rate limiter + counter 사용
  - 검증: `grep -c "acquireSlot" apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` ≥ 1
  - 검증: `grep -c "incrementSystemErrorEventDrops" apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` ≥ 1

#### 라운드 #3 — graceful degradation + observability + e2e

- [ ] **M-13** Graceful degradation spec PASS — Redis 실패 시 fallback 동작
  - 검증: `grep -c "rate-limit-fallback" apps/backend/src/common/system-health/__tests__/system-health-redis-rate-limiter.spec.ts` ≥ 1

- [ ] **M-14** Drops counter 4 reason 검증 spec PASS
  - 검증: `grep -cE "rate-limit|dedupe|errorcode-truncate|rate-limit-fallback" apps/backend/src/common/metrics/__tests__/metrics-system-health-drops.spec.ts` ≥ 4

- [ ] **M-15** E2E controller test — 200/403/401 + response shape
  - 검증: `grep -cE "systemAdmin|'admin'|loginAs" apps/backend/test/dashboard.system-health.e2e-spec.ts` ≥ 2
  - 검증: `grep -cE "activeUsers|dbResponseMs|storagePct|queueSize|errorCount24h" apps/backend/test/dashboard.system-health.e2e-spec.ts` ≥ 3
  - 검증: `grep -cE "200|403|401" apps/backend/test/dashboard.system-health.e2e-spec.ts` ≥ 3

- [ ] **M-16** Lua script에 INCR + EXPIRE 포함
  - 검증: `grep -cE "INCR|EXPIRE" apps/backend/src/common/system-health/system-health-rate-limiter.lua.ts` ≥ 2

- [ ] **M-17** Redis client lifecycle — OnModuleDestroy + quit()
  - 검증: `grep -c "OnModuleDestroy" apps/backend/src/common/system-health/system-health-redis-rate-limiter.service.ts` ≥ 1
  - 검증: `grep -c "quit()" apps/backend/src/common/system-health/system-health-redis-rate-limiter.service.ts` ≥ 1

- [ ] **M-18** DashboardModule에서 SystemHealthModule import + SYSTEM_HEALTH_RATE_LIMITER provider
  - 검증: `grep -cE "SystemHealthModule|SYSTEM_HEALTH_RATE_LIMITER" apps/backend/src/modules/dashboard/dashboard.module.ts` ≥ 1

- [ ] **M-19** system-health 영역 logger 텍스트 영어 (한국어 메시지 금지)
  - 검증: `grep -nE "을|이다|입니다" apps/backend/src/common/system-health/ --include="*.ts" -r 2>/dev/null | wc -l` = 0

---

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 기록

- [ ] **S-1** Rate limiter unit spec ≥ 6 cases
- [ ] **S-2** Provider spec — record() drop path 4 분기 모두 cover
- [ ] **S-3** `Record<SystemErrorEventDropReason, ...>` exhaustive guard 패턴
- [ ] **S-4** backend-patterns.md "System Health Rate Limiter" 섹션 신설
- [ ] **S-5** Tech-debt tracker [x] 4건 처리

---

## 종료 조건
- MUST 19개 전체 PASS → 성공
- 동일 이슈 2회 연속 FAIL → 설계 문제 (수동 개입)
- 3회 반복 초과 → 수동 개입
