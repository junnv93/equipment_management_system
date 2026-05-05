# 시스템 상태 데이터 소스 운영 가이드

`SystemHealthMetricsDto` (대시보드 §3.9) 의 데이터 소스 SSOT 와 환경별 우선순위 정책.

## 아키텍처

`getSystemHealth` 응답은 3 개 metric provider 의 합성:

| Provider                   | 인터페이스               | 데이터 소스                                                  |
| -------------------------- | ------------------------ | ------------------------------------------------------------ |
| `StorageHealthProvider`    | `read()`                 | host-disk(`df`) / configured env / pg_database_size          |
| `AsyncWorkBacklogProvider` | `read()`                 | prom-client gauge (pendingApprovals + activeCheckouts)       |
| `SystemErrorEventProvider` | `count24h()`, `record()` | `system_error_events` 테이블 / audit-rejection-proxy(legacy) |

각 provider 는 응답에 `*Backend` / `errorSource` 식별자를 포함하여 운영자가 "어떤 데이터로부터 답했는가" 를 추적 가능.

---

## Storage 메트릭 우선순위

```
1. DASHBOARD_STORAGE_CAPACITY_BYTES (env)        →  storageBackend = 'configured-capacity'
   storagePct = pg_database_size / capacity * 100   (100 cap)

2. monitoring 서비스 host disk (`df -B1 /`)      →  storageBackend = 'host-disk'   ← 권장 (default)
   storagePct = diskUsed / diskTotal * 100

3. 둘 다 실패                                     →  storageBackend = 'pg-database'
   storagePct = null (DTO 응답에선 0 폴백)
   dbSizeBytes 만 admin 진단용 노출
```

### 환경별 권고

| 환경                                             | 권고                                         |
| ------------------------------------------------ | -------------------------------------------- |
| Bare metal / VM                                  | env 미설정 → host-disk 자동 사용             |
| Docker Compose (host volume bind)                | env 미설정 → host-disk 자동 사용             |
| Docker Compose (named volume on small host disk) | env 명시 — volume capacity 또는 reserve 만큼 |
| Kubernetes (PV 기반)                             | env 명시 — PV size 또는 PVC requests 값      |
| Serverless / 컨테이너 (디스크 추상화)            | env 명시 — 비용 한도 환산값                  |

### env 예시

```bash
# 500 GiB capacity override
DASHBOARD_STORAGE_CAPACITY_BYTES=536870912000
```

---

## Async-work backlog 메트릭

기본값: `pending-work-aggregate` (외부 큐 미도입 환경).

`MetricsCollector` 가 주기적으로 `pendingApprovalsGauge` + `activeCheckoutsGauge` 를 갱신.
`AsyncWorkBacklogProviderImpl.read()` 가 두 gauge 의 현재 값을 합산.

### BullMQ 등 외부 큐 도입 시

새 strategy 클래스 (`BullmqBacklogProvider`) 작성 후 `DashboardModule` providers 의
`{ provide: ASYNC_WORK_BACKLOG_PROVIDER, useExisting: ... }` 만 교체.
`dashboard.service.getSystemHealth` 변경 불필요 — backend = `'bullmq'` 응답으로 운영자가 확인.

---

## Error count 메트릭

기본값: `system-error-events` (테이블 SSOT).

`GlobalExceptionFilter` 가 5xx 응답 시 fire-and-forget INSERT.
캡처 범위:

- `AppError` statusCode >= 500
- `HttpException` status >= 500
- 미처리 일반 예외 (uncaught) — 항상 500

**캡처 안 함**: 4xx (`BadRequest`, `Forbidden`, `NotFound` 등), `ZodError`, 보안 거절.

### PII deny-list (강제)

캡처 필드 화이트리스트:

- `errorCode` (varchar(100), 마이그레이션 0055 이후 — 53자 ErrorCode + 47자 마진), `httpMethod`, `normalizedRoute` (UUID/숫자 ID 마스킹), `statusCode`
- `userId` (인증된 요청에 한해, FK SET NULL — 사용자 삭제 후 감사 보존)
- `stackHash` (production: SHA-256 hex), `stackPreview` (development only, 4096 자 truncate)

**절대 캡처 금지**: `request.body`, `request.headers`, `request.query`. 이는 `error.filter.ts` 코드와 spec
PII 검증 케이스에 의해 강제됨 (verify-security 가드).

### stack_hash 의 운영 의미 — privacy + grouping trade-off

`stack_hash` 는 SHA-256 단방향 함수로 **그루핑 식별자**:

- **그루핑 OK**: 동일 코드 라인에서 발생한 5xx 들이 같은 hash → admin 이 "같은 버그" 묶기 가능.
- **PII 노출 X**: hash 자체로는 stack 원문 복원 불가능. 다른 사용자 ID 와 같은 hash 라도 user 정보 누출 X.
- **production 운영 권고**: hash 카운트 기준 상위 N 그룹을 alert. 원문 stack 은 dev 환경 reproducer 로만.

### Rate limiting 정책

`SystemErrorEventProviderImpl` 에 다음 보호:

- **Per-instance 분당 INSERT 상한 60건** — 5xx 폭주 시 DB INSERT 폭주 차단.
- **(errorCode, normalizedRoute) 1분 dedupe** — 동일 패턴 중복 캡처 차단.
- **errorCode 100자 silent truncate + warn** — DB column 한계 초과 시 데이터 유실 방지.

### Multi-process 환경 한계 (cluster 모드)

본 sprint 의 in-memory rate limiter 는 **NestJS singleton scope** — 단일 프로세스 가정.
PM2 cluster 또는 K8s replicas 환경에서는 인스턴스별로 분당 60건이 적용되어 실제 한도가 N배.

**권고**:

- 단일 컨테이너 / 단일 워커 운영: 본 sprint 구현 충분.
- 다중 인스턴스 운영: 후속 sprint 에서 Redis-backed rate limiter 도입 (tech-debt: `system-health-cluster-aware-rate-limiter`).

### Observability — drop counter

현재 rate-limit drop 은 분당 1회 `logger.warn` 으로만 노출. Prometheus metric counter
(`system_error_events_drops_total`) 추가는 후속 sprint (tech-debt: `system-health-drops-prom-counter`).

### Sentry 옵션 sink

system_error_events 테이블이 진실의 소스이며, Sentry 는 외부 alert/triage 용 sink 로만 사용.

활성화 절차:

```bash
# 1. 의존성 설치 (운영자 직접 — package.json 에 추가 안 됨)
pnpm --filter backend add @sentry/node

# 2. DSN 환경 변수 설정
export SENTRY_DSN="https://your-key@sentry.io/your-project"

# 3. 백엔드 재시작 — SentryErrorSink 가 자동 lazy-load
```

DSN 미설정 또는 `@sentry/node` 미설치 시 emit 은 no-op (1 회 logger.warn 후 영구 비활성화).

### Legacy fallback (audit-proxy)

system_error_events 도입 직후 회귀 검증 시에만 활성화:

```bash
SYSTEM_HEALTH_ERROR_FALLBACK=audit-proxy
```

이 모드에서는 `audit_logs.action IN ('reject','cancel')` 합산을 errorCount24h 로 사용 + `errorSource = 'audit-rejection-proxy'`.

---

## 운영 모니터링 후속 작업

| 트리거                                      | 후속                                                                                                     |
| ------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| system_error_events 테이블 누적 N개월 후    | retention 정책 (`docs/operations/system-health-data-retention.md` 신설) — 90 일 보존 + monthly partition |
| BullMQ/Redis 큐 인프라 도입                 | `BullmqBacklogProvider` strategy 추가                                                                    |
| frontend SystemHealthCard transparency 표시 | `storageBackend` / `queueBackend` / `errorSource` 배지 + i18n                                            |
| 의존성 정식 추가 결정                       | `@sentry/node` 를 `apps/backend/package.json` 에 명시                                                    |

상세 트래킹: `.claude/exec-plans/tech-debt-tracker.md`.
