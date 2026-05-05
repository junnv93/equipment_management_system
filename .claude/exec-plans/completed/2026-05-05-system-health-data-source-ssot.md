# System Health Data Source SSOT 구현 계획

## 메타
- 생성: 2026-05-05T00:00:00+09:00
- 모드: Mode 2 (system-wide refactor + new persistence + module re-wiring)
- 예상 변경: 약 18개 파일 (신규 9 / 수정 9)
- slug: `system-health-data-source-ssot`
- 대상 tech-debt 통합 종결:
  - `system-health-queue-size-impl` (`dashboard.service.ts:800` `queueSize = 0` stub)
  - `system-health-error-source-table` (`audit_logs reject/cancel` proxy → 진짜 시스템 에러)
  - `dashboard-storage-capacity-env` (env capacity 100 GiB 기본 / monitoring `df` 결과 미활용)

## 설계 철학

`getSystemHealth()` 가 6 메트릭을 인라인으로 self-compute 하면서 발생한 **데이터 소스 분기** (storage 는 dashboard 와 monitoring 가 서로 다르게 측정, queueSize 는 stub, errorCount24h 는 비즈니스 거절을 proxy) 를 **`SystemHealthProvider` 전략 컨트랙트** 하나로 봉합한다. 세 SHOULD 항목은 모두 동일한 아키텍처 결손에서 파생된 증상이므로 개별 패치가 아니라 컨트랙트 도입 + 3 개 production strategy + GlobalExceptionFilter 통합 으로 동시에 종결한다. 새 필드는 frontend 가 즉시 소비하지 않더라도 SSOT enum 으로 등록해 다음 sprint 가 "어떤 backend 가 답했는지" 추적할 수 있게 만든다 (관측성 + 테스트성).

## 아키텍처 결정

| 결정 | 선택 | 근거 |
|------|------|------|
| Provider 분리 단위 | `StorageHealthProvider` / `AsyncWorkBacklogProvider` / `SystemErrorEventProvider` 3 개 인터페이스 | 메트릭별 데이터 소스가 독립적이고 (DB 쿼리 / prom-client / 새 테이블), 도입 sprint 가 다름. 한 인터페이스로 묶으면 Open/Closed 위반. |
| DI 토큰 형식 | `Symbol('STORAGE_HEALTH_PROVIDER')` 등 `Symbol` 토큰 + interface 분리 (TOKEN_BLACKLIST 패턴) | MEMORY 의 jwt.strategy ↔ AuthService 순환 의존성 회피 사례와 동일. interface import 만으로는 NestJS DI 토큰이 안 되며, string 토큰은 typo 위험. |
| Provider 파일 위치 | `apps/backend/src/modules/dashboard/health-providers/` 하위 (interface + impl + tokens) | dashboard 도메인 로컬 컨셉. monitoring 모듈로 옮기면 monitoring → dashboard 재import 발생 + dashboard 외 신규 컨슈머 가능성 낮음. |
| Storage capacity 우선순위 | (1) `DASHBOARD_STORAGE_CAPACITY_BYTES` env 가 명시적으로 설정된 경우(override) → configured-capacity 모드, (2) 미설정 시 → `MonitoringService.getMetrics().storage` 의 host disk 값 사용 (host-disk 모드), (3) 둘 다 실패 시 → `pg_database_size` 만 노출하고 `storagePct = null` (pg-database 모드, frontend 는 "측정 불가" 표시) | env 기본값 100 GiB 가 사실은 "운영자가 설정 안 함" 신호인데 100 GiB 절대값으로 굳어져 misleading. env 를 optional 로 격하 + 자동 fallback. 실제 디스크가 dashboard 의 진실. |
| `pg_database_size` 의 위치 | `dbSizeBytes` 필드로 별도 노출, `storagePct` 와 분리 | 기존 코드는 "DB 크기 / 가상 capacity" 로 storagePct 를 만들어 의미 혼동. DB 크기는 그 자체로 admin 진단 가치가 있으므로 별도 필드, storagePct 는 host-disk 기준으로 일원화. |
| `errorCount24h` 데이터 소스 | 신규 `system_error_events` 테이블 + GlobalExceptionFilter 가 5xx/InternalServerError fire-and-forget insert | audit_logs 는 `access_denied` 보안 이벤트만 기록. 5xx/uncaught 는 어디에도 저장 안 됨. Sentry 만으로는 self-hosted 운영에서 SSOT 미확보. 테이블이 진실의 소스 + Sentry 는 옵션 sink. |
| `system_error_events` 캡처 범위 | 5xx (status >= 500) 이고 `ErrorCode.InternalServerError` 또는 비-`AppError`/`ZodError`/`HttpException<5xx 외>` | 4xx 는 클라이언트 책임, ZodError/Permission 거절 등은 운영 노이즈. "서버가 응답 못 함" 신호만 캡처. |
| PII deny-list | timestamp / errorCode / httpMethod / normalizedRoute (UUID/숫자 ID 마스킹) / status / userId(nullable) / stackHash(prod) / stack(dev only, 4096 자 truncate) — request body / headers / query string 캡처 금지 | `lib/analytics/track.ts` 의 PII 정책 ("user-identifying / 본문 데이터 deny") 과 동일. monitoring.service 의 normalize 패턴(UUID/numeric ID 마스킹) 재사용. |
| Backlog 데이터 소스 | `MetricsService.pendingApprovalsGauge + activeCheckoutsGauge` (이미 prom-client 가 추적) 의 현재 값 합산 | BullMQ 등 외부 큐 미도입. "처리 대기 작업의 양" 은 pendingApprovals(승인 대기) + 시간 만료가 임박한 activeCheckouts 로 충분히 의미 있는 지표. BullMQ 는 미래 strategy 로 plug-in. |
| BullMQ adapter | 도입 안 함, future strategy 자리만 마련 | 현재 의존성 0, infra(Redis) 도입 비용 크고 현재 트래픽에 불필요. 인터페이스만 열어두고 실제 구현은 트리거(큐 도입 sprint) 시. |
| Sentry adapter | 옵션, env-gated `SENTRY_DSN` + `@sentry/node` lazy import | 자체 호스팅 SSOT 는 system_error_events 테이블. Sentry 는 관측 sink (alert/triage), 데이터 소스 아님. SENTRY_DSN 미설정 시 no-op. |
| DTO 신규 필드 | `dbSizeBytes` (number), `storagePct` 의미 변경 (host-disk 기준), `storageBackend` (enum), `queueBackend` (enum), `errorSource` (enum) — 5 신규 | (a) `dbSizeBytes` 는 admin 진단 + 기존 측정값을 버리지 않음. (b) 3 개 backend 필드는 운영자가 "왜 이 숫자인가" 추적 가능 — 관측성 가치로 채택. (c) frontend 표시 deferred (SHOULD). |
| 신규 backend enum SSOT 위치 | `packages/shared-constants/src/system-health-backends.ts` (신규) | dashboard-thresholds.ts 가 frontend/backend 공유 SSOT 패턴. 동일 위치에 추가 → 하드코딩 회귀 차단. |
| Frontend 영향 | 본 sprint 에서 SystemHealthCard 표시 변경 없음 — 신규 필드는 optional 추가만 (DTO breaking 없음) | 기존 6 필드는 그대로 보존. 새 필드 표시 + i18n 은 별도 sprint (SHOULD tech-debt 등록). |
| 마이그레이션 | manual SQL `0054_add_system_error_events.sql` + `_journal.json` 수동 append | 프로젝트 메모리 `feedback_drizzle_kit_interactive_prompt.md` — drizzle-kit interactive prompt 는 non-TTY 환경에서 실패. snapshot 누락된 baseline 이후 패턴. |
| 인덱스 | `(created_at DESC)` 기본 + `(error_code, created_at DESC)` 보조 | 24h count + future per-code aggregation. 작은 테이블이지만 운영 누적 시 seq scan 회피. |
| 보존 정책 | 본 sprint scope 외. tech-debt 등록 (운영 누적 후 vacuum/partition sprint) | DDL 추가 = scope 폭증. 24h 쿼리 자체는 인덱스로 안전. |
| 캐시 무효화 | system_error_events insert 시 cache invalidation 이벤트 emit 안 함 | dashboard `getSystemHealth` MEDIUM(5min) TTL 이 freshness 보장. fire-and-forget insert 마다 cache wipe 하면 매 요청 cache miss → pg_database_size 재실행 부하. |
| 트랜잭션 컨텍스트 | GlobalExceptionFilter 의 insert 는 새 connection (외부 트랜잭션과 분리) + try/catch 로 모든 예외 swallow | DB 연결 자체가 죽었을 때 insert 실패 → 응답 흐름 차단되면 안 됨. fire-and-forget Promise + logger.error 로만 기록. |
| 테스트 전략 | (1) provider 단위 spec 신규 — 각 strategy 의 fallback 경로 / (2) dashboard.service.spec 의 getSystemHealth 5 케이스를 provider mock 기반으로 재작성 / (3) GlobalExceptionFilter spec 신규 — 5xx 캡처 + 4xx swallow + body 미캡처 검증 | 기존 spec 의 `mockDb.select` 호출 순서 의존을 제거. provider mock 만 주입하면 setup 5 줄로 축소. |

## 구현 Phase

### Phase 1: 마이그레이션 & DB 스키마

**목표:** `system_error_events` 테이블 + 인덱스 + Drizzle schema 등록.

**변경 파일:**
1. `apps/backend/drizzle/0054_add_system_error_events.sql` — **신규** — manual SQL: `CREATE TABLE system_error_events (id uuid PK default gen_random_uuid(), created_at timestamptz default now() not null, error_code varchar(50) not null, http_method varchar(10) not null, normalized_route varchar(255) not null, status_code smallint not null, user_id uuid null references users(id) on delete set null, stack_hash varchar(64) null, stack_preview text null)` + `CREATE INDEX system_error_events_created_at_idx ON system_error_events (created_at DESC)` + `CREATE INDEX system_error_events_code_created_at_idx ON system_error_events (error_code, created_at DESC)`. idempotent: `IF NOT EXISTS` 가드 적용.
2. `apps/backend/drizzle/meta/_journal.json` — **수정** — idx=54 entry append (tag `0054_add_system_error_events`, version `7`, `breakpoints: true`). drizzle-kit 호출 금지 (memory: feedback_drizzle_kit_interactive_prompt.md).
3. `packages/db/src/schema/system-error-events.ts` — **신규** — `pgTable('system_error_events', { id, createdAt, errorCode (varchar 50), httpMethod, normalizedRoute, statusCode, userId (FK users SET NULL), stackHash, stackPreview }, { createdAtIdx, codeCreatedAtIdx })`. `auditLogs` 의 SET NULL FK 패턴 차용.
4. `packages/db/src/schema/index.ts` — **수정** — `export * from './system-error-events'` 추가.

**검증:**
- `pnpm --filter backend run db:migrate` 1 회 성공 + 재실행 시 no-op (idempotent)
- `pnpm tsc --noEmit` 백엔드 + db 패키지

### Phase 2: SSOT enum & Provider 컨트랙트

**목표:** backend identity enum 을 shared-constants 에 등록 + 3 개 provider interface + DI Symbol 토큰 정의.

**변경 파일:**
1. `packages/shared-constants/src/system-health-backends.ts` — **신규** — `SYSTEM_HEALTH_STORAGE_BACKENDS`, `SYSTEM_HEALTH_QUEUE_BACKENDS`, `SYSTEM_HEALTH_ERROR_SOURCES` const tuples + `SystemHealthStorageBackend` / `SystemHealthQueueBackend` / `SystemHealthErrorSource` 유니언 타입 export. 값:
   - storage: `'host-disk' | 'configured-capacity' | 'pg-database'`
   - queue: `'pending-work-aggregate' | 'bullmq'`
   - error: `'system-error-events' | 'audit-rejection-proxy'`
2. `packages/shared-constants/src/index.ts` — **수정** — re-export.
3. `apps/backend/src/modules/dashboard/health-providers/tokens.ts` — **신규** — `STORAGE_HEALTH_PROVIDER`, `ASYNC_WORK_BACKLOG_PROVIDER`, `SYSTEM_ERROR_EVENT_PROVIDER` 3 개 `Symbol` 토큰.
4. `apps/backend/src/modules/dashboard/health-providers/types.ts` — **신규** — 인터페이스 정의:
   - `interface StorageHealthProvider { read(): Promise<{ dbSizeBytes: number; diskUsedBytes: number | null; diskTotalBytes: number | null; storagePct: number | null; backend: SystemHealthStorageBackend }> }`
   - `interface AsyncWorkBacklogProvider { read(): Promise<{ queueSize: number; backend: SystemHealthQueueBackend }> }`
   - `interface SystemErrorEventProvider { count24h(): Promise<{ errorCount24h: number; source: SystemHealthErrorSource }>; record(event: SystemErrorEventInput): Promise<void> }`
   - `SystemErrorEventInput` 타입 (PII deny-list 적용된 형태): `{ errorCode: string; httpMethod: string; normalizedRoute: string; statusCode: number; userId: string | null; stackHash: string | null; stackPreview: string | null }`.

**검증:** tsc 백엔드 + shared-constants 빌드.

### Phase 3: Production strategy 구현

**목표:** 3 개 인터페이스의 production 구현체 작성 + 단위 테스트.

**변경 파일:**
1. `apps/backend/src/modules/dashboard/health-providers/storage-health.provider.ts` — **신규** — `MonitoringService` (host disk) + `db.execute(pg_database_size)` + ConfigService 조합. 우선순위 결정 로직:
   - env `DASHBOARD_STORAGE_CAPACITY_BYTES` 가 명시 설정 (제로/undefined 가 아님) + 운영자 의도 표시 → `configured-capacity` (`pg_database_size / capacity`).
   - 그 외 + monitoring `diskTotal > 0` → `host-disk` (`diskUsed / diskTotal`).
   - 둘 다 실패 → `pg-database` (`dbSizeBytes` 만 반환, `storagePct = null`).
   `storagePct` 는 100 클램프, capacity=0 방어 코드 유지.
2. `apps/backend/src/modules/dashboard/health-providers/async-work-backlog.provider.ts` — **신규** — `MetricsService` 의 `pendingApprovalsGauge.get()` + `activeCheckoutsGauge.get()` (prom-client `get()` API) 합산. backend = `'pending-work-aggregate'`. prom-client 호출 실패 시 0 + logger.warn.
3. `apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` — **신규** — `count24h()` 는 system_error_events 24h COUNT 쿼리. 테이블이 비어 있으면 0 반환, source = `'system-error-events'`. `record(event)` 는 fire-and-forget INSERT (caller 가 await 하지 않아도 logger.error 만 남음). audit_logs proxy fallback 은 별도 옵션 path 로 남김 (env `SYSTEM_HEALTH_ERROR_FALLBACK=audit-proxy` 시에만 활성화 — 본 sprint 에서는 default false, fallback 코드만 작성).
4. `apps/backend/src/modules/dashboard/health-providers/__tests__/storage-health.provider.spec.ts` — **신규** — 3 우선순위 분기 + capacity=0 + monitoring 실패 시나리오.
5. `apps/backend/src/modules/dashboard/health-providers/__tests__/async-work-backlog.provider.spec.ts` — **신규** — gauge get 정상 / get throw → 0+warn.
6. `apps/backend/src/modules/dashboard/health-providers/__tests__/system-error-event.provider.spec.ts` — **신규** — count24h 0/N + record 호출 시 INSERT 호출 + DB error swallow.

**검증:**
- `pnpm --filter backend run test -- health-providers`

### Phase 4: GlobalExceptionFilter 5xx 캡처 통합

**목표:** 5xx 응답 시 `SystemErrorEventProvider.record()` fire-and-forget 호출 + PII deny-list + route 정규화 + dev-only stack 캡처.

**변경 파일:**
1. `apps/backend/src/common/filters/error.filter.ts` — **수정** —
   - 생성자에 `@Inject(SYSTEM_ERROR_EVENT_PROVIDER) systemErrorEventProvider` 추가.
   - `catch()` 의 (a) "미처리 예외" 분기 + (b) `HttpException` 이고 `status >= 500` 분기 + (c) `AppError.statusCode >= 500` 분기 에서 `void this.maybeRecordSystemErrorEvent(...)` 호출. 4xx / ZodError / `access_denied` 보안 이벤트는 기록 안 함.
   - 신규 private 메서드 `maybeRecordSystemErrorEvent(exception, request, errorResponse, statusCode)`:
     - normalized route = `request.route?.path ?? request.url.split('?')[0]` 에서 UUID/숫자 ID 마스킹 (monitoring.service 의 `UUID_PATTERN` / `NUMERIC_ID_PATTERN` 재사용 또는 동등 정규식).
     - userId = `(request as AuthenticatedRequest).user?.userId ?? null`.
     - stack: production 은 SHA-256 hash 만 (`crypto.createHash('sha256')`), development 는 stack 첫 4096 자 truncate.
     - **금지**: request.body / request.headers / request.query 어떤 필드도 캡처 금지.
2. `apps/backend/src/common/filters/__tests__/error.filter.spec.ts` — **신규 또는 수정** — (a) 5xx 시 record 호출 + (b) 4xx 시 record 호출 안 됨 + (c) ZodError record 안 됨 + (d) PII 미캡처 (record 인자에 body/headers 없음) 검증.

**검증:** `pnpm --filter backend run test -- filters/error.filter`

### Phase 5: Optional Sentry sink (env-gated)

**목표:** `SENTRY_DSN` 설정 시 `record()` 가 system_error_events INSERT 와 동시에 Sentry 로 emit. 미설정 시 no-op.

**변경 파일:**
1. `apps/backend/src/config/env.validation.ts` — **수정** — `SENTRY_DSN: z.string().url().optional()` 추가. `.env.example` drift 검증을 위해 `ENV_SYNC_SCENARIOS` 는 변경 불필요 (production 강제 X).
2. `apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` — **신규** — `SentryErrorSink` 클래스: 생성자에서 `ConfigService.get('SENTRY_DSN')` 확인, 없으면 `enabled=false`. `emit(event)` 는 `enabled` 체크 후 dynamic `import('@sentry/node')` lazy. 의존성 미설치 시 catch 후 logger.warn(1 회) + `enabled=false` 영구 전환.
3. `apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` — **수정 (Phase 3 결과)** — 생성자에 `SentryErrorSink` 주입 (optional), `record()` 에서 INSERT 후 `void this.sentrySink.emit(event)` 호출.
4. `apps/backend/src/modules/dashboard/health-providers/__tests__/sentry-error-sink.spec.ts` — **신규** — DSN 미설정 시 `enabled=false` + emit no-op + dependency missing 시 catch.

**의존성 정책:** `@sentry/node` 는 본 sprint 에서 **package.json 에 추가하지 않음** (선택적 sink). DSN 설정 + 의존성 직접 설치 시에만 활성화. 테스트는 dynamic import 의 mock module 로 검증.

**검증:** `pnpm --filter backend run test -- sentry-error-sink`

### Phase 6: dashboard.service.getSystemHealth orchestrator 리팩토링

**목표:** 5 개 inline DB 쿼리 → 3 개 provider 호출. 측정 책임 자체를 위임.

**변경 파일:**
1. `apps/backend/src/modules/dashboard/dashboard.service.ts` — **수정** —
   - 생성자에 3 개 provider 주입 (Symbol 토큰 기반).
   - `getSystemHealth()` 는: dbResponseMs(SELECT 1) + activeUsers(audit) + maxUsers(users) 만 inline 으로 유지 (이건 진짜 메트릭). storage/backlog/error 는 `Promise.all([storage.read(), backlog.read(), error.count24h()])` 로 병렬 호출.
   - `storagePct === null` 일 때 overallStatus 판정 시 storage 조건 skip.
   - DTO 매핑 시 `dbSizeBytes`, `storageBackend`, `queueBackend`, `errorSource` 신규 필드 채움.
   - 인라인 `queueSize = 0`, 인라인 `pg_database_size`, 인라인 `audit_logs reject/cancel` 쿼리 **모두 제거**.
2. `apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` — **수정** — `SystemHealthMetricsDto` 에 5 신규 필드 추가:
   - `dbSizeBytes: number` (@ApiProperty)
   - `storagePct: number | null` (기존이 number 였음 — null 허용으로 격상, frontend 영향 검토 필수)
   - `storageBackend: SystemHealthStorageBackend` (@ApiProperty enum)
   - `queueBackend: SystemHealthQueueBackend`
   - `errorSource: SystemHealthErrorSource`
3. `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts` — **수정** — `setupHealthMocks` 를 provider mock 주입 형태로 재작성. 8 케이스 (storagePct 비율 / 100 cap / capacity=0 / overallStatus 4 분기 / users count) 보존 + null storagePct 시 healthy 분기 신규 케이스 1 개 추가.

**Frontend 비호환 회피 결정:** `storagePct: number | null` 격상은 SystemHealthCard 가 `safe.storagePct` (number 가정) 사용. Generator 는 다음 중 하나 선택:
- (a) DTO 는 `storagePct: number` 유지 + null 케이스는 `0` 으로 폴백 + `storageBackend = 'pg-database'` 신호로 frontend 구분 (호환).
- (b) DTO 격상 + frontend null guard 추가 (SystemHealthCard.tsx 1 줄 변경).

**기본 권고: (a)** — 본 sprint 의 frontend 표시 deferred 원칙과 일치. (b) 는 frontend 표시 sprint 와 한꺼번에.

**검증:**
- `pnpm --filter backend run test -- dashboard.service`
- `pnpm tsc --noEmit` 양쪽

### Phase 7: 모듈 wiring & 의존성 정리

**목표:** DI 그래프 연결 + 순환 의존성 회피 검증.

**변경 파일:**
1. `apps/backend/src/modules/dashboard/dashboard.module.ts` — **수정** — `imports: [DrizzleModule, ApprovalsModule, MonitoringModule, MetricsModule]` 로 확장. providers 에 3 strategy 클래스 + `{ provide: STORAGE_HEALTH_PROVIDER, useExisting: StorageHealthProviderImpl }` 등 토큰 매핑 + `SentryErrorSink` 등록.
2. `apps/backend/src/modules/monitoring/monitoring.module.ts` — **수정 (필요 시)** — `MonitoringService` 가 이미 `exports` 됨, 추가 변경 없을 가능성 큼. 단 `MonitoringService.getMetrics()` 가 dashboard 에서 호출 가능한 public API 인지 확인 후 필요하면 메서드 추가 export.
3. `apps/backend/src/common/filters/error.filter.ts` — **수정 (Phase 4 결과)** — DashboardModule import 가 GlobalExceptionFilter 에 닿게 하기 위해 app.module.ts wiring 점검. GlobalExceptionFilter 는 APP_FILTER 로 등록되어 있어 Dashboard provider 주입을 위해 module 선언이 필요할 수 있음.
4. `apps/backend/src/app.module.ts` — **수정 (필요 시)** — `SYSTEM_ERROR_EVENT_PROVIDER` 토큰을 GlobalExceptionFilter 가 주입받을 수 있도록 DashboardModule 에서 export + AppModule 에서 imports.

**순환 의존성 점검:** Dashboard → Monitoring (단방향) + Dashboard → Metrics (단방향). MonitoringService 는 Dashboard 에 의존하지 않아야 함 (역방향 import 금지). `apps/backend/src/modules/monitoring/monitoring.service.ts` 를 grep 으로 검증.

**검증:**
- `pnpm --filter backend run build` (NestJS DI 그래프 검증)
- `pnpm --filter backend run test:e2e -- monitoring` (smoke)

### Phase 8: 환경 변수 문서화 & .env.example 동기화

**목표:** 신규 env (`SENTRY_DSN`) + 기존 env (`DASHBOARD_STORAGE_CAPACITY_BYTES`) 의 의미 변경 (override 격하) 문서화.

**변경 파일:**
1. `.env.example` — **수정** — `SENTRY_DSN=` (주석 포함) + `DASHBOARD_STORAGE_CAPACITY_BYTES=` 의 주석 수정 (host-disk fallback 설명).
2. `apps/backend/.env.example` — **수정 (있는 경우)** — 동일.
3. `docs/operations/system-health-data-sources.md` — **신규** — storage / queue / error 3 메트릭의 backend 우선순위 + override 방법 + Sentry 활성화 절차 1 페이지.

**검증:**
- `pnpm --filter backend run verify:env-sync` (있는 경우) 또는 `pnpm --filter backend run test -- env`

### Phase 9: tech-debt-tracker 종결 처리

**목표:** 3 개 항목 closure + 후속 항목 등록.

**변경 파일:**
1. `.claude/exec-plans/tech-debt-tracker.md` — **수정** — 3 항목 strikethrough + 신규 후속 등록:
   - `[ ] system-health-frontend-transparency-fields` — SystemHealthCard 가 storageBackend/queueBackend/errorSource 표시 + i18n. 트리거: 디자인 sprint.
   - `[ ] system-error-events-retention-policy` — 90 일 보존 + monthly partition. 트리거: 운영 누적 후.
   - `[ ] bullmq-async-work-backlog-strategy` — Redis/BullMQ 도입 후 새 strategy 추가. 트리거: 큐 인프라 sprint.
   - `[ ] sentry-node-dependency-formal-add` — 의존성 직접 설치 + production DSN 정책. 트리거: 운영 모니터링 정비.

**검증:** 마크다운 lint (없으면 skip).

## 전체 변경 파일 요약

### 신규 생성

| 파일 | 목적 |
|------|------|
| `apps/backend/drizzle/0054_add_system_error_events.sql` | system_error_events 테이블 + 2 인덱스 |
| `packages/db/src/schema/system-error-events.ts` | Drizzle schema + relations |
| `packages/shared-constants/src/system-health-backends.ts` | backend identity enum SSOT |
| `apps/backend/src/modules/dashboard/health-providers/tokens.ts` | DI Symbol 토큰 3 개 |
| `apps/backend/src/modules/dashboard/health-providers/types.ts` | provider 3 인터페이스 + input type |
| `apps/backend/src/modules/dashboard/health-providers/storage-health.provider.ts` | host-disk / configured / pg-database 우선순위 strategy |
| `apps/backend/src/modules/dashboard/health-providers/async-work-backlog.provider.ts` | prom-client gauge 합산 strategy |
| `apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` | count24h + record fire-and-forget |
| `apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` | optional Sentry sink (lazy import) |
| `apps/backend/src/modules/dashboard/health-providers/__tests__/storage-health.provider.spec.ts` | 우선순위/fallback 케이스 |
| `apps/backend/src/modules/dashboard/health-providers/__tests__/async-work-backlog.provider.spec.ts` | gauge 정상/실패 |
| `apps/backend/src/modules/dashboard/health-providers/__tests__/system-error-event.provider.spec.ts` | count + record swallow |
| `apps/backend/src/modules/dashboard/health-providers/__tests__/sentry-error-sink.spec.ts` | DSN 미설정 no-op |
| `apps/backend/src/common/filters/__tests__/error.filter.spec.ts` | 5xx record + PII 미캡처 |
| `docs/operations/system-health-data-sources.md` | 운영 가이드 |

### 수정

| 파일 | 변경 의도 |
|------|----------|
| `apps/backend/drizzle/meta/_journal.json` | idx=54 entry append (수동) |
| `packages/db/src/schema/index.ts` | system-error-events re-export |
| `packages/shared-constants/src/index.ts` | system-health-backends re-export |
| `apps/backend/src/config/env.validation.ts` | SENTRY_DSN optional 추가 |
| `apps/backend/src/common/filters/error.filter.ts` | 5xx → record() fire-and-forget + PII deny-list |
| `apps/backend/src/modules/dashboard/dashboard.service.ts` | getSystemHealth orchestrator 리팩토링 (3 provider 호출) |
| `apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` | SystemHealthMetricsDto 5 신규 필드 (storagePct는 옵션 a 권장) |
| `apps/backend/src/modules/dashboard/dashboard.module.ts` | imports + providers + token 매핑 |
| `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts` | provider mock 기반 재작성 |
| `apps/backend/src/app.module.ts` | DashboardModule export 의 SYSTEM_ERROR_EVENT_PROVIDER 가 GlobalExceptionFilter 에 도달 |
| `.env.example` (+ apps/backend/.env.example) | SENTRY_DSN + storage capacity 주석 |
| `.claude/exec-plans/tech-debt-tracker.md` | 3 항목 종결 + 4 후속 등록 |

## 의사결정 로그

1. **2026-05-05 #1**: 3 SHOULD 를 개별 sprint 가 아닌 1 sprint 로 통합 closure — 공통 root cause (data-source SSOT 결손) 가 동일하므로 분리 패치는 단편 누적 (memory: feedback_repeated_self_audit).
2. **#2**: BullMQ 도입 거부 — 의존성/Redis 인프라 추가 비용 > 현 sprint 가치. interface 만 열어두는 strategy pattern 으로 미래 도입 가능성 보존.
3. **#3**: Sentry 의존성 본 sprint 에 추가 안 함 — `@sentry/node` 는 lazy dynamic import 로 옵션화. DSN+의존성 모두 갖춰진 환경에서만 활성화. 본 sprint 종료 시 system_error_events 테이블이 SSOT.
4. **#4**: storage capacity env 의 의미 격하 — "default 100 GiB" 는 misleading 한 fallback (운영자가 설정 안 했어도 100 GiB 로 측정). env 가 명시적으로 설정되면 override 모드로만 사용, 미설정 시 monitoring 의 host-disk 가 진실. backwards-compat 은 기존 env 값을 그대로 존중하는 방식으로 유지.
5. **#5**: pg_database_size 는 storagePct 분모에서 분리 + 별도 dbSizeBytes 필드. 의미 혼동 해결 + admin 진단 가치 보존.
6. **#6**: GlobalExceptionFilter 의 5xx 캡처는 fire-and-forget + 새 connection (외부 트랜잭션과 분리). DB 자체 장애 시 응답 흐름이 차단되는 회귀 차단.
7. **#7**: PII deny-list 는 `lib/analytics/track.ts` 정책 (user-identifying / 본문 deny) 과 동일 원칙. body / headers / query 캡처 금지를 grep 으로 강제 (contract).
8. **#8**: backend identity enum SSOT 를 shared-constants 에 — dashboard-thresholds.ts 가 frontend/backend 양쪽 import 패턴. 동일 위치 + Record 강제로 하드코딩 회귀 차단.
9. **#9**: storagePct null 격상 vs 0 폴백 결정은 frontend 호환 비용 차이로 옵션 (a) 권고 (Generator 판단 가능).
10. **#10**: tech-debt 후속 등록 4 건 — 본 sprint scope 보호, 다음 sprint 트리거 명시.
