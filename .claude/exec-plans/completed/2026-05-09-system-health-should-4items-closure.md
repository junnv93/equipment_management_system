# System Health SHOULD 4건 종결 실행 계획

## 메타
- 생성: 2026-05-09
- 모드: Mode 2 (system-wide — 신규 패키지 의존성 + 신규 스케줄러 + DI 조건부 바인딩 + production startup wiring)
- 예상 변경: 약 11~13개 파일 (신규 4 / 수정 7~9)
- slug: `system-health-should-4items-closure`
- 대상 tech-debt 통합 종결:
  - `system-health-frontend-transparency-fields` — **stale 식별 (이미 구현됨)**, 주석 정정 + tracker closure 만 필요
  - `system-error-events-retention-policy` — `@Cron` 기반 90일 retention scheduler 신규
  - `bullmq-async-work-backlog-strategy` — `bullmq` 의존성 추가 + provider strategy + 환경변수 기반 조건부 바인딩
  - `sentry-node-dependency-formal-add` — `@sentry/node` 정식 의존성 + sentry-error-sink 정적 import 전환

## 설계 철학

`system-health-data-source-ssot` sprint(2026-05-05)에서 `SystemHealthProvider` 컨트랙트 + 3 strategy + Sentry sink 골격을 완성했고, **본 sprint 는 그 골격에 운영 단계 잔여 4건을 흡수**한다. 신규 추상화는 도입하지 않으며, 기존 인터페이스(`AsyncWorkBacklogProvider`)·DI 토큰(`ASYNC_WORK_BACKLOG_PROVIDER`)·SSOT enum(`SYSTEM_HEALTH_QUEUE_BACKENDS`)을 모두 재사용한다.

- Item 1: surveying 결과 이미 frontend `BackendBadge` 구현됨 → SSOT comment 정정 + tracker closure 로만 마감 (코드 변경 0)
- Item 2: `notification-cleanup-scheduler.ts` `@Cron(EVERY_DAY_AT_MIDNIGHT)` 패턴 mirror
- Item 3: `useExisting` → `useFactory` 한 줄로 전환되도록 설계된 기존 wiring 활용, 기본값 `pending-work-aggregate` 유지 → 회귀 0
- Item 4: dynamic string-import → 정적 import + DSN-gated init 으로 단순화, DSN 미설정 시 enabled=false 동작 보존

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Item 1 처리 방식 | JSDoc stale 1줄 정정 + tracker [x] | `SystemHealthCard.tsx`의 `BackendBadge` + `dashboard.systemHealth.backend.*` i18n 키가 ko/en 양쪽 존재 — surveying 결과 "후속 sprint 에서 도입" 주석만 stale |
| retention scheduler 위치 | `health-providers/system-error-events-retention.scheduler.ts` | provider 가 모인 디렉토리에 동거 — `SystemErrorEventProviderImpl` 와 같은 도메인 |
| retention 정책 값 | `RETENTION_DAYS = 90` 스칼라 상수 | tracker 항목 명세 그대로. env 화는 over-engineering. partition DDL 은 별도 sprint |
| retention scheduler trigger | `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)` UTC 자정 | `notification-cleanup-scheduler.ts` 와 동일 cadence |
| BullMQ 의존성 | `bullmq` 정식 의존성 (`ioredis` 이미 deps) | tracker 항목 트리거 충족. lazy import 안 씀 — 정적 import + 미설정 시 graceful no-op |
| BullMQ 큐 감시 목록 | `ASYNC_WORK_QUEUE_NAMES` env (콤마 구분, 공백 트림) | env-driven SSOT. 운영자가 새 큐 추가 시 코드 수정 없이 env 만 갱신 |
| BullMQ Redis 연결 | 기존 `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` 재사용 | 신규 env 추가 회피. cache/rate-limiter 와 동일 Redis |
| BullMQ queueSize 합산 | `getJobCounts('waiting','active','delayed')` 합산 | "처리 대기 작업의 양" 시맨틱 = 대기 + 처리중 + 지연. completed/failed 는 backlog 제외 |
| Queue 인스턴스 라이프사이클 | `OnModuleInit` 생성 + `OnModuleDestroy` close | NestJS lifecycle 표준. 매 `read()` 마다 연결 생성 금지 |
| Strategy 전환 기전 | `DashboardModule` `useFactory` + `QUEUE_STRATEGY` env | 기본값 `pending-work-aggregate` 유지 → 환경변수 한 줄로 전환 |
| `@sentry/node` 의존성 | `apps/backend/package.json` 정식 추가 | 운영자 수동 설치 단계 제거 |
| sentry-error-sink 리팩토링 | 정적 import + 생성자 `Sentry.init` 직접 호출 | dynamic import + lazyLoad + dependencyMissingWarned 제거. 정식 의존성이면 정적 import 가 표준 |
| Sentry env 옵션 | `SENTRY_DSN` (기존) + `SENTRY_ENVIRONMENT` + `SENTRY_RELEASE` (optional) | alert 그루핑/release health 가시화. 미설정 시 SDK default — backward compatible |
| `.env.example` SSOT | root `.env.example` | `apps/backend/.env.example` 별도 미존재 — root 가 SSOT |
| 마이그레이션 | DDL 변경 0 | retention 은 코드 레벨 cron. partition DDL 은 별도 tech-debt |

## 구현 Phase

### Phase 0 — Item 1: stale comment 정정 + tracker closure

**변경 파일**:

1. `packages/shared-constants/src/system-health-backends.ts` — **수정**
   - JSDoc 상단 stale 한 줄 `"frontend SystemHealthCard 표시는 후속 sprint 에서 도입 (현재는 transparency 필드만 응답)."` 를 현재 구현 상태 반영하는 문구로 갱신
   - 코드 export 변경 금지

2. `.claude/exec-plans/tech-debt-tracker.md` — **수정**
   - "2026-05-05 system-health-data-source-ssot 후속 (SHOULD)" 섹션 4 항목 closure 처리
   - 빈 섹션 헤더 제거 정책 적용

**검증**:
```bash
grep -c "후속 sprint 에서 도입" packages/shared-constants/src/system-health-backends.ts  # 0
grep -cE "BackendBadge|Tooltip" packages/shared-constants/src/system-health-backends.ts  # ≥1
```

---

### Phase 1 — Item 2: system-error-events retention scheduler

**신규/수정 파일**:

1. `apps/backend/src/modules/dashboard/health-providers/system-error-events-retention.scheduler.ts` — **신규**
   - `@Injectable()` + `@Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)`
   - `RETENTION_DAYS = 90` 상수
   - `handleCron()`: cutoff 계산 → `db.delete(systemErrorEvents).where(lt(createdAt, cutoff))` → 삭제 건수 로깅
   - try/catch → logger.error (cron 흐름 보호)
   - 패턴 참조: `notification-cleanup-scheduler.ts`

2. `apps/backend/src/modules/dashboard/health-providers/__tests__/system-error-events-retention.scheduler.spec.ts` — **신규**
   - ≥3 케이스: (a) db.delete 호출 확인 + cutoff 90일 전 검증, (b) 삭제 건수 로깅, (c) reject 시 throw 없음 + logger.error

3. `apps/backend/src/modules/dashboard/dashboard.module.ts` — **수정**
   - `SystemErrorEventsRetentionScheduler` import + providers 배열 추가

**검증**:
```bash
test -f apps/backend/src/modules/dashboard/health-providers/system-error-events-retention.scheduler.ts
grep -c "SystemErrorEventsRetentionScheduler" apps/backend/src/modules/dashboard/dashboard.module.ts  # ≥2
pnpm --filter backend run test -- system-error-events-retention.scheduler
```

---

### Phase 2 — Item 3: BullMQ async-work-backlog provider

**신규/수정 파일**:

1. `apps/backend/package.json` — **수정**: `"bullmq": "^5"` 추가

2. `apps/backend/src/modules/dashboard/health-providers/bullmq-backlog.provider.ts` — **신규**
   - `implements AsyncWorkBacklogProvider, OnModuleInit, OnModuleDestroy`
   - `OnModuleInit`: `ASYNC_WORK_QUEUE_NAMES` 파싱 → `new Queue(name, { connection })` 생성
   - `read()`: `Promise.all(queues.map(q => q.getJobCounts('waiting','active','delayed')))` 합산 → `{ queueSize, backend: 'bullmq' }`
   - try/catch → graceful `{ queueSize: 0, backend: 'bullmq' }` + logger.warn
   - `OnModuleDestroy`: `await queue.close()` 병렬

3. `apps/backend/src/modules/dashboard/health-providers/__tests__/bullmq-backlog.provider.spec.ts` — **신규**
   - ≥3 케이스: (a) 다중 큐 합산, (b) env 미설정 → queueSize:0 graceful, (c) Redis 실패 → warn + queueSize:0

4. `apps/backend/src/modules/dashboard/dashboard.module.ts` — **수정**
   - `BullmqBacklogProviderImpl` providers 추가
   - `ASYNC_WORK_BACKLOG_PROVIDER` 토큰을 `useFactory` + `QUEUE_STRATEGY` env 기반 분기로 교체
   - 기본값 `pending-work-aggregate` 유지 (회귀 0)

5. `apps/backend/src/config/env.validation.ts` — **수정**
   - `QUEUE_STRATEGY: z.enum(['pending-work-aggregate', 'bullmq']).optional()`
   - `ASYNC_WORK_QUEUE_NAMES: z.string().optional()`

6. `.env.example` — **수정**: `QUEUE_STRATEGY` + `ASYNC_WORK_QUEUE_NAMES` 주석 라인 추가

**검증**:
```bash
grep -c '"bullmq"' apps/backend/package.json  # ≥1
grep -c "QUEUE_STRATEGY" apps/backend/src/modules/dashboard/dashboard.module.ts  # ≥1
pnpm --filter backend run test -- bullmq-backlog.provider
```

---

### Phase 3 — Item 4: Sentry formal add

**신규/수정 파일**:

1. `apps/backend/package.json` — **수정**: `"@sentry/node": "^9"` 추가

2. `apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` — **수정**
   - `import * as Sentry from '@sentry/node'` 정적 import
   - 생성자에서 DSN 없으면 return, 있으면 `Sentry.init({ dsn, environment, release })`
   - `lazyLoadSentry` / `dependencyMissingWarned` / dynamic import 완전 제거

3. `apps/backend/src/modules/dashboard/health-providers/__tests__/sentry-error-sink.spec.ts` — **수정**
   - `jest.mock('@sentry/node', () => ({ init: jest.fn(), captureMessage: jest.fn() }))` 로 재작성
   - ≥4 케이스: DSN 미설정 no-op / 빈 문자열 no-op / 정상 init / emit captureMessage 호출

4. `apps/backend/src/config/env.validation.ts` — **수정**
   - `SENTRY_ENVIRONMENT: z.string().optional()`
   - `SENTRY_RELEASE: z.string().optional()`

5. `.env.example` — **수정**
   - 의존성 직접 설치 문구 제거
   - `SENTRY_ENVIRONMENT` / `SENTRY_RELEASE` 주석 라인 추가

**검증**:
```bash
grep -c '"@sentry/node"' apps/backend/package.json  # ≥1
grep -c "lazyLoadSentry\|dependencyMissingWarned" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts  # 0
pnpm --filter backend run test -- sentry-error-sink
```

---

### Phase 4 — 통합 검증

```bash
pnpm --filter backend run tsc --noEmit      # error 0
pnpm --filter frontend run tsc --noEmit     # error 0
pnpm --filter backend run test              # all PASS
pnpm --filter backend run build             # DI 그래프 컴파일
```

## Build Sequence (체크리스트)

- [ ] P0-1: `system-health-backends.ts` JSDoc stale 1줄 정정
- [ ] P0-2: `tech-debt-tracker.md` 4건 closure 마킹 + 빈 섹션 헤더 제거
- [ ] P1-1: `system-error-events-retention.scheduler.ts` 신규
- [ ] P1-2: `system-error-events-retention.scheduler.spec.ts` 신규
- [ ] P1-3: `dashboard.module.ts` scheduler 등록
- [ ] P2-1: `pnpm --filter backend add bullmq`
- [ ] P2-2: `bullmq-backlog.provider.ts` 신규
- [ ] P2-3: `bullmq-backlog.provider.spec.ts` 신규
- [ ] P2-4: `dashboard.module.ts` useFactory 조건부 바인딩 + BullmqBacklogProviderImpl 등록
- [ ] P2-5: `env.validation.ts` QUEUE_STRATEGY + ASYNC_WORK_QUEUE_NAMES 추가
- [ ] P2-6: `.env.example` 4 옵션 주석 라인
- [ ] P3-1: `pnpm --filter backend add @sentry/node`
- [ ] P3-2: `sentry-error-sink.ts` 정적 import 전환
- [ ] P3-3: `sentry-error-sink.spec.ts` 재작성 (4+ cases)
- [ ] P3-4: `env.validation.ts` SENTRY_ENVIRONMENT + SENTRY_RELEASE 추가
- [ ] P3-5: `.env.example` Sentry 블록 갱신
- [ ] P4-1: tsc --noEmit (backend + frontend) error 0
- [ ] P4-2: backend test all PASS
- [ ] P4-3: backend build DI 그래프 성공

## 범위 외 (out-of-scope)
- `system_error_events` partition/vacuum DDL — 별도 sprint
- BullMQ Worker / Job producer 코드 — 큐 도입 자체가 별도 sprint
- Sentry `tracesSampleRate` / breadcrumb / `Sentry.setUser` 고급 통합
