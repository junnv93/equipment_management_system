---
slug: monitoring-type-ssot
mode: 1
scope: monitoring 모듈 타입 SSOT 통합 + 미측정 DB 메트릭 nullable 처리
created: 2026-04-12
---

# 스프린트 계약: 모니터링 타입 SSOT 통합

## 생성 시점
2026-04-12T10:00:00+09:00

## 배경

`apps/backend/src/modules/monitoring/monitoring.service.ts` 와 `monitoring.controller.ts`, `apps/frontend/lib/api/monitoring-api.ts` 세 곳에 동일한 DB metrics / Health / HTTP / Cache shape 이 **인라인 객체 타입 리터럴** 로 중복 정의되어 있다. 이는 3-way drift 위험이며, 신규 필드 추가 시 한 곳만 수정해 세 타입이 어긋날 수 있다.

또한 `monitoring.service.ts:353, 436` 에 `avgQueryTime: 0` 하드코딩이 존재 — pg Pool 은 쿼리 실행 시간을 측정하지 않으므로 의미론적으로 "미측정" 이어야 하는 값이 "0 ms" 로 프론트엔드에 노출되어 사용자가 잘못 해석할 수 있다. 유사 필드(slowQueries / queryCacheHitRate / indexUsage / deadlocks / lockWaitTime / replicationLag) 도 동일.

`ConnectionPoolMetrics` 는 `packages/db/src/index.ts:63` 에 이미 SSOT 로 존재하고 `DrizzleService.getMetrics()` 가 올바른 타입을 반환하므로 base 는 이미 마련되어 있다. 본 스프린트는 이 위에 application-level API 타입을 `packages/schemas` 로 끌어올린다.

## 성공 기준

### 필수 (MUST) — 실패 시 루프 재진입

- [ ] **MUST1**: `pnpm --filter backend exec tsc --noEmit` exit 0
- [ ] **MUST2**: `pnpm --filter frontend exec tsc --noEmit` exit 0
- [ ] **MUST3**: `pnpm --filter backend run build` exit 0
- [ ] **MUST4**: `pnpm --filter frontend run build` exit 0
- [ ] **MUST5**: `pnpm --filter backend run test` exit 0 — 회귀 0
- [ ] **MUST6**: `packages/schemas/src/monitoring.ts` 신규 파일 존재, 다음 인터페이스 export:
    - `DatabaseMetrics` — 미측정 numeric 필드는 `number | null`
    - `DatabaseDiagnostics`
    - `HealthStatus`
    - `HttpStats`
    - `CacheStats`
    - `SystemDiagnostics` (getDiagnostics 복합 응답)
- [ ] **MUST7**: `packages/schemas/src/index.ts` 에서 위 인터페이스 re-export (`export * from './monitoring'`)
- [ ] **MUST8**: `monitoring.service.ts` 의 다음 5개 메서드가 **SSOT 타입 어노테이션** 사용 — 인라인 object type literal 0개:
    - `getDatabaseDiagnostics(): DatabaseDiagnostics`
    - `getHealthStatus(): HealthStatus`
    - `getHttpStats(): HttpStats`
    - `getCacheStats(): CacheStats`
    - `getDiagnostics(): SystemDiagnostics`
  grep 검증: `getDatabaseDiagnostics\(\): \{` 형태가 0건
- [ ] **MUST9**: `monitoring.controller.ts` 의 4개 엔드포인트 핸들러도 동일하게 SSOT 타입 사용. 인라인 object type literal 0건
- [ ] **MUST10**: `monitoring.service.ts` 에서 `avgQueryTime: 0` 문자열 0 매치 (grep)
- [ ] **MUST11**: `monitoring.service.ts` 에서 `avgQueryTime: null` 문자열 ≥ 2 매치 (getDatabaseDiagnostics + getHealthStatus 둘 다 `null` 반환)
- [ ] **MUST12**: 아래 "항상 0" 이었던 DB 메트릭 필드도 `null` 로 반환: `slowQueries`, `queryCacheHitRate`, `indexUsage`, `deadlocks`, `lockWaitTime`, `replicationLag`. 각 필드에 대해 grep `<field>: 0$` 가 service.ts 에서 0 매치여야 함
- [ ] **MUST13**: `apps/frontend/lib/api/monitoring-api.ts` 에 `@equipment-management/schemas` import 존재 (`DatabaseDiagnostics` / `HealthStatus` / `SystemDiagnostics` 중 하나 이상) + 로컬 inline `database: { metrics: { ... } }` 형태 타입 제거
- [ ] **MUST14**: `apps/frontend/components/monitoring/MonitoringDashboardClient.tsx` 에서 nullable numeric 필드(`avgQueryTime`, `slowQueries`, `queryCacheHitRate`, `indexUsage`, `deadlocks`, `lockWaitTime`, `replicationLag`) 렌더링 경로가 **null-safe**:
    - 직접 `.toLocaleString()` / `.toFixed()` 호출 전 null 체크 또는 `?? ...` fallback 존재
    - `formatMs(avgQueryTime)` 같은 헬퍼가 null 을 허용하거나 호출 전 가드가 있음
- [ ] **MUST15**: `queriesExecuted: poolMetrics.connectionsAcquired` 라인 위 / 아래에 JSDoc 또는 인라인 주석으로 "connectionsAcquired ≈ 쿼리 실행 근사치 (pg Pool 한계)" 명시 존재
- [ ] **MUST16**: `ConnectionPoolMetrics` 는 `packages/db/src/index.ts` 에서만 정의 — 새 파일에서 재정의 금지. `packages/schemas/src/monitoring.ts` 는 re-export 또는 composition 만 허용
- [ ] **MUST17**: blacklist 파일 수정 0건:
    - `apps/backend/src/modules/audit/**`
    - `apps/frontend/components/audit-logs/**`
    - `apps/backend/src/modules/checkouts/**`
    - `apps/backend/src/modules/notifications/**`
    - `apps/backend/src/modules/intermediate-inspections/**`
    - `apps/backend/src/modules/self-inspections/**`
    - `apps/backend/src/modules/reports/form-template-export.service.ts`
    - `apps/frontend/lib/api/calibration-api.ts`
    - `apps/frontend/components/inspections/result-sections/**`
    - `apps/frontend/components/equipment/SelfInspectionTab.tsx`
    - `packages/db/src/schema/checkouts.ts`
    - `apps/backend/drizzle/**`
    - `apps/frontend/next-env.d.ts`
    - `apps/frontend/messages/ko/calibration.json`, `equipment.json`
    - `apps/frontend/messages/en/calibration.json`, `equipment.json`
- [ ] **MUST18**: `queriesExecuted` 필드 rename 없음 — i18n 키 / dashboard 라벨 / API payload 필드명 전부 기존 유지. 타입만 SSOT 통합.

### 권장 (SHOULD) — 실패 시 tech-debt 기록

- [ ] **SHOULD1**: `verify-ssot` Rule 0 위반 0건 (변경 영역)
- [ ] **SHOULD2**: `verify-hardcoding` violation 0건 (변경 영역)
- [ ] **SHOULD3**: `verify-implementation` PASS
- [ ] **SHOULD4**: `review-architecture` Critical 0개 (변경 영역)
- [ ] **SHOULD5**: `queriesExecuted` → `connectionsAcquired` 시맨틱 rename 후속 기술부채 tracker 등재 (UX + i18n 연쇄 때문에 본 스프린트에서는 의도적 제외)

## 종료 조건
- 필수 기준 전체 PASS → 성공 → /git-commit + main push (solo trunk-based)
- 동일 이슈 2회 연속 FAIL → 수동 개입
- 3회 반복 초과 → 수동 개입
- SHOULD 실패는 tech-debt-tracker 기록

## 비고
- **Mode 1**: lightweight — 단일 도메인(monitoring), ~7 파일, 기존 SSOT 패턴(`@equipment-management/schemas` import) 재사용.
- **수정 방식**: main 브랜치 직접 작업 (1인 프로젝트 기본).
- **의존성 체인**: `schemas ← (backend, frontend)`. `packages/db` 의 `ConnectionPoolMetrics` 는 `packages/schemas` 가 import 할 수 없으므로(의존성 레이어) — 대신 schemas 가 동일 shape 을 재선언하거나, schemas 가 백엔드-전용 composite 타입만 정의하고 `ConnectionPoolMetrics` 는 직접 `@equipment-management/db` 에서 import 한다. 전자가 더 깔끔하지만 drift 를 유발하므로 후자(direct import) 권장.
- **Nullable 필드 fallback**: 프론트엔드 dashboard 에서 null 렌더링은 '—' 또는 `tCommon('errors.notMeasured')` 키 신설.
