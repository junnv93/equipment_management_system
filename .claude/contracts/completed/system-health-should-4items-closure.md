# 스프린트 계약: System Health SHOULD 4items Closure

## 생성 시점
2026-05-09

## slug
`system-health-should-4items-closure`

## 모드
Mode 2 — system-wide (신규 외부 의존성 2건 + 신규 스케줄러 + DI 조건부 바인딩 + production startup wiring)

## 범위 (in-scope)
- `packages/shared-constants/src/system-health-backends.ts` (Item 1 stale comment 정정)
- `apps/backend/package.json` (`bullmq` + `@sentry/node` 정식 의존성 추가)
- `apps/backend/src/modules/dashboard/health-providers/system-error-events-retention.scheduler.ts` (신규)
- `apps/backend/src/modules/dashboard/health-providers/__tests__/system-error-events-retention.scheduler.spec.ts` (신규)
- `apps/backend/src/modules/dashboard/health-providers/bullmq-backlog.provider.ts` (신규)
- `apps/backend/src/modules/dashboard/health-providers/__tests__/bullmq-backlog.provider.spec.ts` (신규)
- `apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` (수정 — 정적 import)
- `apps/backend/src/modules/dashboard/health-providers/__tests__/sentry-error-sink.spec.ts` (수정 — 재작성)
- `apps/backend/src/modules/dashboard/dashboard.module.ts` (scheduler 등록 + useFactory 바인딩)
- `apps/backend/src/config/env.validation.ts` (4 키 추가)
- `.env.example` (신규 키 4건 주석 + Sentry 블록 갱신)
- `.claude/exec-plans/tech-debt-tracker.md` (4 SHOULD 항목 closure)

## 범위 외 (deferred)
- `system_error_events` partition/vacuum DDL
- BullMQ Worker / Job producer 신설
- Sentry 고급 통합 (tracesSampleRate 등)
- frontend SystemHealthCard 변경 (Item 1: 이미 구현됨)

---

## 성공 기준

### 필수 (MUST) — binary PASS/FAIL

#### A. 빌드 & 타입

- [ ] **M-1**. `pnpm --filter backend run tsc --noEmit` 에러 0 **AND** `pnpm --filter frontend run tsc --noEmit` 에러 0

#### B. 회귀 테스트

- [ ] **M-2**. `pnpm --filter backend run test` 전체 PASS (기존 회귀 0 + 신규 spec 모두 PASS)

#### C. Item 1: stale comment 정정

- [ ] **M-3**.
  - `grep -c "후속 sprint 에서 도입" packages/shared-constants/src/system-health-backends.ts` → **0**
  - `grep -cE "BackendBadge|Tooltip|투명성|transparency 가시화" packages/shared-constants/src/system-health-backends.ts` → **≥ 1**

#### D. Item 2: retention scheduler

- [ ] **M-4**. 파일 존재 + DashboardModule 등록:
  - `test -f apps/backend/src/modules/dashboard/health-providers/system-error-events-retention.scheduler.ts && echo PASS`
  - `grep -c "SystemErrorEventsRetentionScheduler" apps/backend/src/modules/dashboard/dashboard.module.ts` → **≥ 2** (import + providers)
  - `grep -c "@Cron" apps/backend/src/modules/dashboard/health-providers/system-error-events-retention.scheduler.ts` → **≥ 1**

- [ ] **M-5**. retention scheduler spec ≥ 3 cases PASS:
  - (a) `handleCron()` 호출 시 `db.delete` 가 1회 호출됨 + cutoff 가 호출 시점 기준 ≈90일 전 (±2초 허용)
  - (b) 삭제 건수를 포함한 `logger.log` 호출 검증
  - (c) `db.delete` reject 시 throw 하지 않음 + `logger.error` 호출

#### E. Item 3: BullMQ provider

- [ ] **M-6**. 파일 존재 + 인터페이스 구현:
  - `test -f apps/backend/src/modules/dashboard/health-providers/bullmq-backlog.provider.ts && echo PASS`
  - `grep -c "implements AsyncWorkBacklogProvider" apps/backend/src/modules/dashboard/health-providers/bullmq-backlog.provider.ts` → **≥ 1**
  - `grep -cE "from 'bullmq'|from \"bullmq\"" apps/backend/src/modules/dashboard/health-providers/bullmq-backlog.provider.ts` → **≥ 1**
  - `grep -cE "backend: 'bullmq'|backend: \"bullmq\"" apps/backend/src/modules/dashboard/health-providers/bullmq-backlog.provider.ts` → **≥ 1**

- [ ] **M-7**. BullMQ provider spec ≥ 3 cases PASS:
  - (a) 다중 큐 `getJobCounts` 합산 (waiting+active+delayed across queues)
  - (b) `ASYNC_WORK_QUEUE_NAMES` 미설정 → `queueSize: 0` + `backend: 'bullmq'` graceful
  - (c) Redis 연결 실패 / `getJobCounts` reject → `queueSize: 0` + `backend: 'bullmq'` + `logger.warn` (throw 없음)

- [ ] **M-8**. DashboardModule 조건부 바인딩:
  - `grep -c "QUEUE_STRATEGY" apps/backend/src/modules/dashboard/dashboard.module.ts` → **≥ 1**
  - `awk '/providers:/,/\]/' apps/backend/src/modules/dashboard/dashboard.module.ts | grep -c "useFactory"` → **≥ 1**
  - `grep -c "BullmqBacklogProviderImpl" apps/backend/src/modules/dashboard/dashboard.module.ts` → **≥ 2** (import + providers)
  - `grep -c "AsyncWorkBacklogProviderImpl" apps/backend/src/modules/dashboard/dashboard.module.ts` → **≥ 2** (회귀 — 기존 provider 보존)

#### F. Item 4: Sentry formal add

- [ ] **M-9**. `@sentry/node` 의존성 등록:
  - `grep -c '"@sentry/node"' apps/backend/package.json` → **≥ 1**

- [ ] **M-10**. `sentry-error-sink.ts` 정적 import 전환:
  - `grep -cE "from '@sentry/node'|from \"@sentry/node\"" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` → **≥ 1**
  - `grep -cE "lazyLoadSentry|dependencyMissingWarned|moduleName = '@sentry/node'|await import" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` → **0**
  - `grep -cE "Sentry\.init\(" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` → **≥ 1**

- [ ] **M-11**. `.env.example` 갱신:
  - `grep -c "SENTRY_DSN" .env.example` → **≥ 1** (기존 보존)
  - `grep -cE "@sentry/node.*직접 설치|운영자가.*설치" .env.example` → **0** (문구 제거)

- [ ] **M-12**. sentry-error-sink spec ≥ 4 cases PASS:
  - (a) `SENTRY_DSN` 미설정 → `Sentry.init` 미호출 + `isEnabled()===false` + `emit()` no-op
  - (b) `SENTRY_DSN` 빈 문자열 → `enabled=false`
  - (c) `SENTRY_DSN` 설정 → `Sentry.init` 가 `dsn` 포함 객체로 호출됨 + `isEnabled()===true`
  - (d) `SENTRY_DSN` 설정 + `emit(input)` → `Sentry.captureMessage` 가 `'SystemErrorEvent: <errorCode>'` + `{ level, tags, extra }` 로 호출됨

#### G. Tracker closure

- [ ] **M-13**. 4 항목 모두 tracker에서 closure 처리:
  - `grep -cE "system-health-frontend-transparency-fields|system-error-events-retention-policy|bullmq-async-work-backlog-strategy|sentry-node-dependency-formal-add" .claude/exec-plans/tech-debt-tracker.md` → **0** (완료 항목 제거 정책)

---

### 권장 (SHOULD) — 미충족 시 tech-debt 등록

- [ ] **S-1**. `Sentry.init` 인자에 `SENTRY_ENVIRONMENT` + `SENTRY_RELEASE` 옵션 전달
- [ ] **S-2**. retention scheduler 로그에 삭제 건수 N 포함 + spec 검증
- [ ] **S-3**. BullMQ provider Redis 연결 실패 시 `logger.warn` + graceful return
- [ ] **S-4**. `.env.example` 에 `ASYNC_WORK_QUEUE_NAMES` + `QUEUE_STRATEGY` + `SENTRY_ENVIRONMENT` + `SENTRY_RELEASE` 4 키 모두 주석 라인 존재

---

## 정당 위치 enumeration (false-FAIL 회피)

- `bullmq` import 정당 위치: `bullmq-backlog.provider.ts` (production) + `bullmq-backlog.provider.spec.ts` (mock)
- `@sentry/node` import 정당 위치: `sentry-error-sink.ts` (production) + `sentry-error-sink.spec.ts` (mock)
- `QUEUE_STRATEGY` 인용 정당 위치: `dashboard.module.ts` + `env.validation.ts` + `.env.example` + (선택적) spec
- `SystemErrorEventsRetentionScheduler` 정당 위치: scheduler 파일 + spec 파일 + `dashboard.module.ts`
- spec 의 `bullmq` / `@sentry/node` mock 은 `jest.mock()` 정적 mock — 실제 Redis/네트워크 I/O 0

---

## 검증 명령 요약

```bash
# 빌드 & 타입
pnpm --filter backend run tsc --noEmit
pnpm --filter frontend run tsc --noEmit

# 회귀
pnpm --filter backend run test
pnpm --filter backend run build

# 신규 spec scope 검증
pnpm --filter backend run test -- system-error-events-retention.scheduler
pnpm --filter backend run test -- bullmq-backlog.provider
pnpm --filter backend run test -- sentry-error-sink

# Item 1
grep -c "후속 sprint 에서 도입" packages/shared-constants/src/system-health-backends.ts       # 0

# Item 2
test -f apps/backend/src/modules/dashboard/health-providers/system-error-events-retention.scheduler.ts
grep -c "SystemErrorEventsRetentionScheduler" apps/backend/src/modules/dashboard/dashboard.module.ts  # ≥2

# Item 3
grep -c '"bullmq"' apps/backend/package.json                                                  # ≥1
grep -c "QUEUE_STRATEGY" apps/backend/src/modules/dashboard/dashboard.module.ts              # ≥1

# Item 4
grep -c '"@sentry/node"' apps/backend/package.json                                            # ≥1
grep -c "lazyLoadSentry" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts  # 0

# Tracker
grep -cE "system-health-frontend-transparency-fields|system-error-events-retention-policy|bullmq-async-work-backlog-strategy|sentry-node-dependency-formal-add" .claude/exec-plans/tech-debt-tracker.md  # 0
```

## 종료 조건
- M-1 ~ M-13 모두 PASS
- S-1 ~ S-4 미충족 시 tech-debt-tracker.md 에 후속 항목 등록
- Evaluator PASS 후 contract → `.claude/contracts/completed/` 이동
