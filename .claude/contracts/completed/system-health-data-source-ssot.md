# 스프린트 계약: System Health Data Source SSOT

## 생성 시점
2026-05-05T00:00:00+09:00

## slug
`system-health-data-source-ssot`

## 모드
Mode 2 — system-wide refactor + new persistence + DI re-wiring + cross-module integration.

## 범위 (in-scope)
- `apps/backend/src/modules/dashboard/health-providers/` 신규 디렉토리 (interface + 3 strategy + sentry sink + tests)
- `apps/backend/src/modules/dashboard/dashboard.service.ts` `getSystemHealth()` orchestrator 리팩토링
- `apps/backend/src/modules/dashboard/dashboard.module.ts` DI wiring
- `apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` `SystemHealthMetricsDto` 신규 필드
- `apps/backend/src/common/filters/error.filter.ts` 5xx system_error_events 캡처
- `packages/db/src/schema/system-error-events.ts` 신규 + `index.ts` re-export
- `packages/shared-constants/src/system-health-backends.ts` 신규 + `index.ts` re-export
- `apps/backend/drizzle/0054_add_system_error_events.sql` + `_journal.json` idx=54 append
- `apps/backend/src/config/env.validation.ts` `SENTRY_DSN` optional
- `.env.example` (root + apps/backend) + `docs/operations/system-health-data-sources.md`
- `.claude/exec-plans/tech-debt-tracker.md` 3 항목 closure + 4 후속 등록
- 기존 `apps/backend/src/modules/dashboard/__tests__/dashboard.service.spec.ts` provider mock 기반 재작성

## 범위 외 (out-of-scope, deferred → tech-debt)
- SystemHealthCard 의 frontend 신규 필드 표시 + i18n (별도 sprint)
- `@sentry/node` 패키지 의존성 추가 (DSN 운영 결정 후)
- BullMQ adapter (Redis/큐 인프라 sprint)
- system_error_events 보존 정책 (vacuum/partition)
- audit-rejection-proxy fallback 의 production 활성화 (코드만 유지, default off)

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

#### A. 빌드 & 타입
- [ ] **A1**. `pnpm --filter backend run tsc --noEmit` 에러 0
- [ ] **A2**. `pnpm --filter db run tsc --noEmit` (또는 packages/db 빌드) 에러 0
- [ ] **A3**. `pnpm --filter shared-constants run tsc --noEmit` (또는 build) 에러 0
- [ ] **A4**. `pnpm --filter backend run build` (NestJS DI 그래프) 성공
- [ ] **A5**. 프론트엔드는 본 sprint 비변경. 그러나 DTO 가 `SystemHealthMetricsDto` 의 `storagePct: number` 호환을 깨면 안 됨 → `pnpm --filter frontend run tsc --noEmit` 에러 0 (격하 옵션 (a) 채택 시 자동 통과).

#### B. 마이그레이션
- [ ] **B1**. `apps/backend/drizzle/0054_add_system_error_events.sql` 존재.
- [ ] **B2**. `apps/backend/drizzle/meta/_journal.json` 의 `entries` 배열 마지막 element 가 `tag: "0054_add_system_error_events"`.
- [ ] **B3**. `pnpm --filter backend run db:migrate` 1 회 성공 (테이블 생성).
- [ ] **B4**. 동일 명령 재실행 시 idempotent — `system_error_events` 가 이미 존재해도 에러 없이 종료 (SQL 에 `IF NOT EXISTS` 가드).
- [ ] **B5**. 검증: `docker compose exec postgres psql -U postgres -d equipment_management -c "\d system_error_events"` 출력에 `system_error_events_created_at_idx` + `system_error_events_code_created_at_idx` 둘 다 포함.

#### C. 테스트
- [ ] **C1**. `pnpm --filter backend run test -- dashboard.service` PASS — 기존 8 케이스 모두 보존 + provider mock 기반으로 재작성됨.
- [ ] **C2**. `pnpm --filter backend run test -- health-providers` PASS — 3 신규 spec + sentry sink spec 모두.
- [ ] **C3**. `pnpm --filter backend run test -- filters/error.filter` PASS — 5xx 캡처 + 4xx swallow + PII 미캡처 검증 케이스 포함.
- [ ] **C4**. `pnpm --filter backend run test` 전체 회귀 0 (기존 테스트 모두 PASS).

#### D. SSOT 검증 (verify-ssot 스킬 + grep 가드)
- [ ] **D1**. `apps/backend/src/modules/dashboard/dashboard.service.ts` 의 `getSystemHealth` 메서드 본체에서 다음 패턴 0 매치 (audit-rejection-proxy 제거 검증). 단 `getRecentActivities` 메서드의 audit-feed 활동 분류 사용은 본 sprint scope 외 — `schema.auditLogs.action`/`'reject'`/`'cancel'`/`'create'`/`'update'`/`'approve'` 인라인 리터럴이 activity-feed 매핑용으로 정상 사용됨. 검증 명령:
  - `grep -c "queueSize = 0" apps/backend/src/modules/dashboard/dashboard.service.ts` → 0 (전체 파일 스캔 OK)
  - `awk '/async getSystemHealth/,/^  }$/' apps/backend/src/modules/dashboard/dashboard.service.ts | grep -c "pg_database_size"` → 0 (메서드 scope)
  - `awk '/async getSystemHealth/,/^  }$/' apps/backend/src/modules/dashboard/dashboard.service.ts | grep -cE "schema\\.auditLogs\\.action|inArray.*'reject'.*'cancel'"` → 0 (메서드 scope)
- [ ] **D2**. `pg_database_size` 호출은 **`storage-health.provider.ts` 한 파일에만** 존재 — `grep -rn "pg_database_size" apps/backend/src/modules/dashboard/` → 정확히 1 파일 (그 파일).
- [ ] **D3**. `Symbol(` 으로 정의된 DI 토큰이 `tokens.ts` 에 정확히 3 개:
  - `grep -c "Symbol(" apps/backend/src/modules/dashboard/health-providers/tokens.ts` ≥ 3
  - 각 토큰 string label 분리 카운트: `'STORAGE_HEALTH_PROVIDER'` / `'ASYNC_WORK_BACKLOG_PROVIDER'` / `'SYSTEM_ERROR_EVENT_PROVIDER'` 각각 `grep -c` ≥ 1.
- [ ] **D4**. `getSystemHealth()` 가 3 provider 모두를 호출:
  - `grep -c "STORAGE_HEALTH_PROVIDER\|storageHealthProvider" apps/backend/src/modules/dashboard/dashboard.service.ts` ≥ 1
  - `grep -c "ASYNC_WORK_BACKLOG_PROVIDER\|asyncWorkBacklogProvider" apps/backend/src/modules/dashboard/dashboard.service.ts` ≥ 1
  - `grep -c "SYSTEM_ERROR_EVENT_PROVIDER\|systemErrorEventProvider" apps/backend/src/modules/dashboard/dashboard.service.ts` ≥ 1
- [ ] **D5**. `verify-ssot` 스킬 PASS (자동 적용 — Step 신설 권고: "SystemHealthProvider 컨트랙트 우회 금지").

#### E. 하드코딩 검증 (verify-hardcoding 스킬 + grep 가드)
- [ ] **E1**. backend identity 리터럴은 다음 정당 위치에서만 등장:
  - **production 런타임 코드 (각 metric 1 파일)**: `storage-health.provider.ts` / `async-work-backlog.provider.ts` / `system-error-event.provider.ts` (정책 결정 분기)
  - **interface SSOT**: `health-providers/types.ts` (union 타입에 backend 식별자가 포함될 수 있음 — 단순 type import 만으로도 grep 매치 가능)
  - **spec 파일** (mock 설정): `*.spec.ts` (테스트 가독성을 위해 enum import 대신 string literal 사용 — 표준 jest 패턴)
  - **JSDoc/주석**: `dashboard.service.ts` / `env.validation.ts` 의 backend 식별자 설명 (런타임 로직 아님 — `/storageBackend (가|는|=)/` 같은 설명 문맥)
  - 검증: production 런타임 코드(.ts, .spec/.test 제외, JSDoc 주석 라인 제외)에서 식별자 리터럴이 strategy 파일 1개 외에 사용되지 않음:
    - `grep -rn "^[^/]*'host-disk'\|^[^/]*'configured-capacity'" apps/backend/src/modules/dashboard/health-providers/*.provider.ts | wc -l` ≥ 1 (provider impl 만)
    - `grep -rln "'pending-work-aggregate'\|'bullmq'" apps/backend/src/ --include='*.ts' --exclude='*.spec.ts'` 결과는 provider impl + types.ts(union) 두 곳만
- [ ] **E2**. 100 GiB 하드코딩이 production 코드 (테스트/주석 제외) 에서 0 매치:
  - `grep -rn "100 \* 1024 \* 1024 \* 1024" apps/backend/src/modules/ | grep -v "__tests__\|\.spec\." | wc -l` → 0 (test 디렉토리는 허용).
- [ ] **E3**. `verify-hardcoding` 스킬 PASS.

#### F. Zod / DTO 검증
- [ ] **F1**. `SystemHealthMetricsDto` 의 5 신규 필드 모두 `@ApiProperty` 데코레이터 부여 — 필드명을 description 에 포함하여 단일라인 grep 으로 데코레이터+필드 페어 매칭. (Prettier 멀티라인 안티패턴 회피, memory `feedback_prettier_multiline_grep`):
  - `grep -c "dbSizeBytes" apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` ≥ 2 (description 내 필드명 + 프로퍼티)
  - `grep -c "storageBackend" apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` ≥ 2
  - `grep -c "queueBackend" apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` ≥ 2
  - `grep -c "errorSource" apps/backend/src/modules/dashboard/dto/dashboard-response.dto.ts` ≥ 2
- [ ] **F2**. `SystemErrorEventInput` 타입 정의에 `body` / `headers` / `query` 필드 0 매치:
  - `grep -c '\bbody\b\|\bheaders\b\|\bquery\b' apps/backend/src/modules/dashboard/health-providers/types.ts` → 0
- [ ] **F3**. `verify-zod` 스킬 PASS (변경된 DTO 영역).

#### G. Security (PII deny-list)
- [ ] **G1**. `error.filter.ts` 의 `maybeRecordSystemErrorEvent` 함수 본체에서 PII 필드 캡처 없음 (sed/awk 함수 scope, 주석/JSDoc 라인 제외, 기존 audit-IP 추출 `getClientIp` 의 `request.headers['x-forwarded-for']` 은 본 sprint scope 외 — 감사 시스템의 사전-기존 정상 사용):
  - `awk '/maybeRecordSystemErrorEvent/,/^  }$/' apps/backend/src/common/filters/error.filter.ts | grep -vE "^\\s*\\*|^\\s*//" | grep -cE "request\\.body|request\\.headers|request\\.query"` → 0
  - 정적 검증 보강: error.filter.spec 의 "PII deny-list — record 호출 인자에 body/headers/query 필드 없음" 케이스 PASS (실 런타임 인자 검증).
- [ ] **G2**. stack 캡처는 production 에서 hash 만 — `grep -c "createHash\|sha256" apps/backend/src/common/filters/error.filter.ts` ≥ 1.
- [ ] **G3**. `verify-security` 스킬 PASS.

#### H. 도메인 특화
- [ ] **H1**. GlobalExceptionFilter 가 4xx 응답에서는 `systemErrorEventProvider.record` 를 호출하지 않음 — error.filter.spec 케이스로 검증.
- [ ] **H2**. `record()` 실패가 응답 흐름을 깨지 않음 — `void this.systemErrorEventProvider.record(...).catch(...)` 패턴 — `grep -c "record(.*).catch\|void this.systemErrorEventProvider" apps/backend/src/common/filters/error.filter.ts` ≥ 1.
- [ ] **H3**. fire-and-forget INSERT 가 별도 connection 또는 try/catch swallow 로 보호 — `system-error-event.provider.ts` 의 `record()` 내부에 `try { await db.insert ... } catch (e) { logger.error ... }` 패턴 존재. `grep -c "logger.error\|this.logger.error" apps/backend/src/modules/dashboard/health-providers/system-error-event.provider.ts` ≥ 1.
- [ ] **H4**. `dashboard.service.getSystemHealth` 가 storagePct null 케이스에서 overallStatus 판정 시 storage 조건 skip — spec 신규 케이스로 검증 (옵션 (b) 채택 시) 또는 옵션 (a) 채택 시 항상 number 반환 + 폴백 0 검증.
- [ ] **H5**. 캐시 TTL 변경 없음 — `grep -c "CACHE_TTL.MEDIUM" apps/backend/src/modules/dashboard/dashboard.service.ts` ≥ 1 (기존 5min TTL 보존).

#### I. 의존성 / 모듈 그래프
- [ ] **I1**. `monitoring.service.ts` 가 dashboard 모듈을 import 하지 않음 (역방향 의존 차단):
  - `grep -c "from.*dashboard\|from.*health-providers" apps/backend/src/modules/monitoring/monitoring.service.ts` → 0
- [ ] **I2**. `@sentry/node` 가 정적 `import` 가 아닌 dynamic `import()` 로만 참조 — ESLint ImportExpression 룰 회피를 위해 string variable 경유 패턴 (memory `feedback_eslint_importexpression_selector`):
  - `grep -c "from '@sentry/node'" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` → 0 (정적 import 금지)
  - `grep -c "await import" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` ≥ 1 (dynamic import 호출 존재)
  - `grep -c "@sentry/node" apps/backend/src/modules/dashboard/health-providers/sentry-error-sink.ts` ≥ 1 (string literal 식별자 존재 — variable 또는 직접)
- [ ] **I3**. `package.json` (apps/backend + root) 에 `@sentry/node` 추가 안 됨 — `grep -c "@sentry/node" apps/backend/package.json` → 0.

#### J. Env 동기화
- [ ] **J1**. `env.validation.ts` 에 `SENTRY_DSN: z.string().url().optional()` 존재 — `grep -c "SENTRY_DSN" apps/backend/src/config/env.validation.ts` ≥ 1.
- [ ] **J2**. `.env.example` (root) 에 `SENTRY_DSN=` 라인 존재.
- [ ] **J3**. `pnpm --filter backend run verify:env-sync` (스크립트 존재 시) PASS.

#### K. verify-implementation
- [ ] **K1**. `verify-implementation` 스킬 전체 PASS — 변경 영역 자동 선택 (verify-ssot, verify-hardcoding, verify-zod, verify-security, verify-cache-events 포함).

### 권장 (SHOULD) — 실패 시 tech-debt-tracker 등록, 루프 차단 없음

- [ ] **S1**. `review-architecture` Critical 이슈 0 — provider boundary clean / 순환 의존성 없음 / DI 그래프 NestJS forwardRef 미필요 검증.
- [ ] **S2**. SystemHealthCard 의 frontend 표시 변경 없이 기존 6 필드 렌더링 unbroken — `pnpm --filter frontend run tsc --noEmit` 통과 + (선택) `pnpm --filter frontend run test -- SystemHealthCard` 회귀 0.
- [ ] **S3**. `playwright-e2e` 대시보드 시스템 상태 카드 smoke (system_admin 로그인 → /dashboard → SystemHealthCard 가 렌더링되고 storagePct/queueSize/errorCount24h 모두 number 로 노출) PASS. 실패 시 manual 검증 노트 + tech-debt 등록.
- [ ] **S4**. Sentry sink 의 DSN 미설정 시 no-op 검증 spec 추가 (Phase 5 spec).
- [ ] **S5**. `system-error-events` 보존 정책 후속 항목이 tech-debt-tracker 에 등록.
- [ ] **S6**. `audit-rejection-proxy` fallback path 가 dead code 가 아니라 spec 1 케이스로 커버.
- [ ] **S7**. `manage-skills` 검토 — SystemHealthProvider SSOT 가 verify-ssot 의 Step 으로 신설될 만한지 평가 + 신설 (orphan skill 회피).

### 적용 verify 스킬

- `verify-ssot` (D-block) — SystemHealthProvider 컨트랙트 + backend enum SSOT
- `verify-hardcoding` (E-block) — 100 GiB / backend 리터럴 가드
- `verify-zod` (F-block) — DTO 5 신규 필드 + SystemErrorEventInput PII deny
- `verify-security` (G-block) — request body/headers/query 미캡처 + stack hash
- `verify-cache-events` — system_error_events insert 가 cache invalidation 이벤트 발행 안 함을 확인 (의도적 결정)
- `verify-implementation` (K-block, orchestrator)
- `review-architecture` (S1)

### contract grep 패턴 작성 규칙 적용

본 contract 의 모든 D/E/F/G/I/J 블록 grep 은 **단일라인 `A.*B` 패턴 금지 + 각 키 분리 카운트** 원칙 (handoff-formats.md + memory `feedback_prettier_multiline_grep`) 을 준수한다. 예:

| 안티패턴 | 본 contract 채택 패턴 |
|----------|---------------------|
| `grep "queueSize.*0"` | `grep -c "queueSize = 0"` (정확 매칭) |
| `grep "STORAGE.*ASYNC.*ERROR"` | 3 개 토큰 각각 `grep -c "토큰명"` 분리 후 AND |
| `grep "body\|headers\|query"` 한 줄 | 단일 alternation 은 OK (grep -c 가 라인 카운트). 단 토큰별 의미 추적이 중요하면 분리. |

---

## 종료 조건
- 필수 기준 전체 PASS → 성공 (commit + tech-debt-tracker 종결 처리)
- 동일 이슈 2 회 연속 FAIL → 설계 문제 (수동 개입 요청 — Planner 재호출)
- 3 회 반복 초과 → 수동 개입 요청
- SHOULD 실패는 종료 조건에 영향 없음 — tech-debt-tracker.md 에 후속 항목으로 등록 + Generator 응답에 명시

## Generator 가 결정해야 할 트레이드오프 (Planner 가 위임)

1. **DTO `storagePct` 시그니처** — `number` 유지 + null→0 폴백 (옵션 a, frontend 호환) vs `number | null` 격상 + frontend null guard 1 줄 추가 (옵션 b). 본 sprint 의 frontend 표시 deferred 원칙상 (a) 권고이나 Generator 가 실제 SystemHealthCard 코드를 보고 더 안전한 쪽 결정 가능.
2. **MetricsService gauge 값 read API** — prom-client `Gauge.get()` 의 hashMap 형태가 NestJS DI 환경에서 sync vs async 인지 실제 import + 실측 후 결정. 비동기일 경우 `read()` 의 Promise return 그대로 OK.
3. **error.filter.ts DI 주입** — GlobalExceptionFilter 가 `APP_FILTER` 로 등록되어 있을 때 dashboard 모듈 provider 를 주입하기 위한 wiring (forwardRef? Global module?). NestJS DI 그래프에서 가장 cleanest 한 방식 선택. 본 plan 은 의도만 명시.
