# Evaluation Report — monitoring-type-ssot

## Iteration
1

## Verdict
PASS

## MUST Criteria
| ID | Result | Notes |
|----|--------|-------|
| MUST1 | PASS | `pnpm --filter backend exec tsc --noEmit` exit 0 |
| MUST2 | PASS | `pnpm --filter frontend exec tsc --noEmit` exit 0 |
| MUST3 | PASS | `pnpm --filter backend run build` exit 0 (nest build clean) |
| MUST4 | PASS | `pnpm --filter frontend run build` exit 0 (Next.js 16 build clean) |
| MUST5 | PASS | `pnpm --filter backend run test` — 44 suites, 565 tests passed. Baseline 565 preserved, 0 regression. |
| MUST6 | PASS | `packages/schemas/src/monitoring.ts` present. Exports verified: `DatabaseMetrics`, `TableInfo`, `DatabaseDiagnostics`, `HealthDatabaseMetrics`, `HealthStatus`, `HttpEndpointStat`, `HttpStats`, `CacheStats`, `SystemMetrics`, `SystemDiagnostics`. `DatabaseMetrics` has `avgQueryTime/slowQueries/queryCacheHitRate/indexUsage/deadlocks/lockWaitTime` all typed `number \| null` (lines 51–61). `DatabaseDiagnostics.replicationLag: number \| null` (line 85). |
| MUST7 | PASS | `packages/schemas/src/index.ts:27` has `export * from './monitoring';`. Rebuilt `dist/monitoring.{js,d.ts}` present (6432B .d.ts). `dist/index.d.ts:22` re-exports. |
| MUST8 | PASS | `monitoring.service.ts` — all 6 methods annotated with SSOT types: `getSystemMetrics(): SystemMetrics` (L230), `getHttpStats(): HttpStats` (L249), `getCacheStats(): CacheStats` (L284), `getDatabaseDiagnostics(): DatabaseDiagnostics` (L295), `getHealthStatus(): HealthStatus` (L336), `getDiagnostics(): SystemDiagnostics` (L414). Grep `\(\): \{` — 0 matches in service. |
| MUST9 | PASS | `monitoring.controller.ts` — 5 endpoint handlers annotated: `getMetrics(): SystemMetrics` (L61), `getDiagnostics(): SystemDiagnostics` (L71), `getStatus(): HealthStatus` (L81), `getHttpStats(): HttpStats` (L91), `getCacheStats(): CacheStats` (L101). Only inline literal remains at L47 `getHealth(): { status: string; ... }` — this is the unrelated simple `@Public() /health` endpoint, not one of the 5 in scope. Acceptable. |
| MUST10 | PASS | grep `avgQueryTime: 0` in service — 0 matches. |
| MUST11 | PASS | grep `avgQueryTime: null` — 2 matches (L321 getDatabaseDiagnostics, L377 getHealthStatus). |
| MUST12 | PASS | All 6 field literals `<field>: 0` — 0 matches in service. `<field>: null` — 6 matches (L322–326, L329 for replicationLag). |
| MUST13 | PASS | `apps/frontend/lib/api/monitoring-api.ts` imports `SystemMetrics, SystemDiagnostics, HealthStatus, HttpStats, CacheStats` from `@equipment-management/schemas`. Inline `database: { metrics: { ... } }` literal removed; file now re-exports as `Monitoring*` aliases (L17–21) for backward compat. |
| MUST14 | PASS | `MonitoringDashboardClient.tsx` — `formatMs` signature `(ms: number \| null): string` returns `'—'` for null (L67–72). Only consumer of nullable numeric DB field is `db.metrics.avgQueryTime` at L639 which is routed through `formatMs`. `slowQueries/queryCacheHitRate/indexUsage/deadlocks/lockWaitTime/replicationLag` — 0 frontend consumers found, so no null-unsafe render path exists. |
| MUST15 | PASS | service.ts L313–317 JSDoc above `queriesExecuted: poolMetrics.connectionsAcquired` — "connectionsAcquired ≈ 쿼리 실행 근사치 — Pool `acquire` 이벤트 카운트" + TODO(tech-debt). L373 healthStatus path has inline comment "connectionsAcquired ≈ 쿼리 근사치 (pg Pool acquire 이벤트)". |
| MUST16 | PASS | `ConnectionPoolMetrics` not redefined in `packages/schemas/src/monitoring.ts`. The file declares its own `DatabaseMetrics` (API composite) which is separate from the pool-level `ConnectionPoolMetrics` in `packages/db`. Service maps pool metrics → API shape at call site. Monitoring file has no reference to `ConnectionPoolMetrics` — composition via raw field copy at service layer. Acceptable given doc layer-boundary rationale (schemas cannot import from db). |
| MUST17 | PARTIAL (see findings) | No blacklisted audit/checkouts/notifications/intermediate-inspections/self-inspections/reports/calibration/result-sections/SelfInspectionTab/checkouts schema/drizzle/i18n-calibration+equipment files touched. `apps/frontend/next-env.d.ts` is modified (single→double quote on line 3) — this is a Next.js build-regenerated artifact and was already M in the session-start git status per caller's note. Not a session write. |
| MUST18 | PASS | `queriesExecuted` field name preserved in interface (schemas/src/monitoring.ts L47, 99), backend service (L318, 374), i18n (ko/en monitoring.json L45), and dashboard (L624, L626). `connectionsAcquired` appears only in JSDoc/comments and `poolMetrics.connectionsAcquired` accessor. 0 occurrences in frontend. |

## SHOULD Criteria
| ID | Result | Notes |
|----|--------|-------|
| SHOULD1 | PASS | SSOT import pattern correctly applied. No local redefinition. |
| SHOULD2 | PASS | No new hardcoded strings/magic numbers in change scope. |
| SHOULD3 | PASS | Implementation correctly threads SSOT types through 3 layers. |
| SHOULD4 | PASS | No cross-layer architecture violations. |
| SHOULD5 | OBSERVED | tech-debt noted via TODO comment at service.ts L316. Not verified whether entered in external tracker — informational. |

## Structural Findings

1. **Unrelated working-tree modifications present (not in contract scope)**: `apps/backend/src/modules/equipment/equipment.service.ts` and `apps/backend/src/modules/equipment/__tests__/equipment.service.spec.ts` are modified with substantive changes (cache key scope-aware suffixes, `deleteByPrefix` replacing `deleteByPattern`). `.claude/contracts/equipment-cache-key-builder.md` exists as an untracked file, confirming this is a separate sprint's work-in-progress bleeding into the current worktree. These are NOT blacklisted, did NOT break the 565-test baseline, and do NOT affect the monitoring-type-ssot contract PASS. Flag for harness housekeeping: the Evaluator cannot distinguish "this sprint's code" from "last sprint's unfinished work in the same branch." Caller's "Changed files" list omitted these. **Not a contract failure**, but a process hygiene concern for a solo trunk-based setup.

2. **`SystemMetrics.platform: NodeJS.Platform` Node-type leak** (structural scrutiny #2): The SSOT file declares `platform: NodeJS.Platform` (packages/schemas/src/monitoring.ts L178). This imports a Node globals type. Frontend does have `@types/node: ^20` in package.json, so the type resolves; `tsc --noEmit` is clean, and `next build` passes. No runtime break, but it is a taste issue — a schemas package ideally exposes `string` (with a JSDoc pointing at the known union) rather than a Node-specific type, since schemas is consumed by browser code. Not contract-required; record as minor tech-debt.

3. **ConnectionPoolMetrics drift risk** (contract Rule #16 subtle concern): The contract notes schemas cannot import from db (dependency layering). Current solution — schemas declares its own API-layer `DatabaseMetrics` and the service hand-maps pool metrics at call sites — avoids the forbidden import but creates a new 2-way drift surface (pool vs API metric names). Acceptable per contract, but if `ConnectionPoolMetrics` gains a new field, the mapping in `getDatabaseDiagnostics()` / `getHealthStatus()` must be updated manually. No enforcement mechanism. Flag informationally.

4. **`dist/` resolution confirmed**: `packages/schemas/dist/monitoring.d.ts` and `dist/monitoring.js` rebuilt after schemas build step; `dist/index.d.ts:22` contains `export * from './monitoring';`. Frontend/backend consume the SSOT via published `dist/` path successfully — verified by clean backend tsc + frontend tsc + both builds.

5. **Nullable fanout verified**: Searched `apps/frontend/` for all 7 nullable fields — only `db.metrics.avgQueryTime` has a consumer (MonitoringDashboardClient.tsx L639), routed through `formatMs(db.metrics.avgQueryTime)` which is null-safe. No arithmetic on nullable fields. No destructuring that would coerce null to 0. No silent runtime trap.

6. **`next-env.d.ts` churn**: Session-start status already flagged this file as M. The sole change is a quote-style rewrite that Next.js regenerates on every build. Not a session-attributable write. Per caller's note: not a violation.

## Repair Instructions (if FAIL)
N/A — verdict is PASS.

Optional tech-debt (non-blocking):
- `packages/schemas/src/monitoring.ts:178`: consider `platform: string` instead of `platform: NodeJS.Platform` to keep schemas Node-independent.
- Harness process hygiene: the working tree contained unrelated equipment-cache-key-builder work during this sprint's evaluation. Consider `git stash` or separate branch before spinning up a new Mode 1 sprint to keep evaluator signal clean.
