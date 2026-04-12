# Evaluation: tech-debt-hardcoding-typesafety

**Date**: 2026-04-12
**Evaluator**: QA Agent (skeptical mode)
**Contract**: `.claude/contracts/tech-debt-hardcoding-typesafety.md`

---

## MUST Criteria

### M1: Hardcoded DB URLs removed (4 files) — PASS

| File | Before | After | Verdict |
|------|--------|-------|---------|
| `fix-i18n-keys-in-db.ts` | `process.env.DATABASE_URL ?? 'postgresql://...'` | `loadMonorepoEnv()` + `resolveDatabaseUrl()` | PASS |
| `push-schema.ts` | `process.env.DATABASE_URL \|\| 'postgresql://...:5433/...'` | `loadMonorepoEnv()` + `resolveDatabaseUrl()` | PASS |
| `migrate-user-roles.ts` | `process.env.DATABASE_URL \|\| 'postgres://...'` | `loadMonorepoEnv()` + `resolveDatabaseUrl()` | PASS |
| `seed-test-new.ts` | `process.env.DATABASE_URL \|\| 'postgresql://...'` | Inline env var composition (`DB_USER`, `DB_HOST`, etc.) | PASS |

Note: `seed-test-new.ts` uses inline env composition instead of `resolveDatabaseUrl()` because it's excluded from tsconfig. The comment explains this. The inline logic mirrors `resolveDatabaseUrl` — acceptable.

`resolveDatabaseUrl` confirmed to exist at `packages/db/src/load-env.ts:50`.

### M2: @ts-ignore removed (2 files) — PASS

- `digest-email-scheduler.ts`: Both `eslint-disable-next-line` + `@ts-ignore` lines removed. Import now resolves cleanly.
- `email-template.service.ts`: Same pattern removed.
- `tsconfig.json`: `@equipment-management/shared-constants` path added to `paths` mapping.

No residual `@ts-ignore` in `apps/backend/src/modules/notifications/`.

### M3: teams.controller.ts Promise\<unknown\> fixed — PASS

- `findAll` → `Promise<TeamListResponse>` (local interface matching the controller's manually-constructed return shape)
- `findOne` → `Promise<Team>` (imported from `@equipment-management/schemas`)
- `create` → `Promise<Team>`
- `update` → `Promise<Team>`

Service returns `PaginatedResponseType<Team>` from `findAll`, but controller remaps it into `{items, meta: {...}}` shape — so the local `TeamListResponse` interface correctly describes the actual return value. `findOne` returns `Team | null` from service, but controller throws 404 on null before returning — so `Promise<Team>` is correct.

### M4: calibration-plans.controller.ts Promise\<unknown\> fixed — PASS

All 14 `Promise<unknown>` occurrences replaced with concrete types imported from `./calibration-plans.types`:

| Method | Return Type | Service Match |
|--------|-------------|---------------|
| `create` | `CalibrationPlanDetail` | matches |
| `findAll` | `CalibrationPlanListResult` | matches |
| `findExternalEquipment` | `ExternalCalibrationEquipment[]` | matches |
| `findOne` | `CalibrationPlanDetail` | matches |
| `update` | `CalibrationPlanDetail` | matches |
| `remove` | `CalibrationPlanDeleteResult` | matches |
| `submit` | `CalibrationPlanDetail` | matches |
| `submitForReview` | `CalibrationPlanDetail` | matches |
| `review` | `CalibrationPlanDetail` | matches |
| `approve` | `CalibrationPlanDetail` | matches |
| `reject` | `CalibrationPlanDetail` | matches |
| `confirmItem` | `CalibrationPlanItem` | matches |
| `updateItem` | `CalibrationPlanItem` | matches |
| `createNewVersion` | `CalibrationPlanDetail` | matches |
| `getVersionHistory` | `CalibrationPlanVersionHistoryItem[]` | matches |

Types are derived from `$inferSelect` (Drizzle schema inference) — no hardcoded primitives.

### M5: pnpm tsc --noEmit — PASS

Exit code 0, no output (clean).

### M6: pnpm lint — PASS

Only error: `intermediate-inspections.service.ts:568` (`'userId' is defined but never used`) — pre-existing, not introduced by these changes. No new errors.

### M7: No inspection/document domain files modified — PASS

`git diff --name-only` shows zero files matching `inspection` or `document` patterns.

---

## SHOULD Criteria

### S1: main.ts '10mb' magic number extracted — PASS

`'10mb'` replaced with `configService.get<string>('BODY_SIZE_LIMIT') || '10mb'`. `BODY_SIZE_LIMIT` added to `env.validation.ts` with `z.string().default('10mb')`.

### S2: monitoring.service.ts 30000 extracted — PASS

`30000` replaced with `MONITORING_THRESHOLDS.METRICS_UPDATE_INTERVAL_MS` (value `30_000`). Constant added to `packages/shared-constants/src/business-rules.ts` with JSDoc comment.

### S3: simple-cache.service.ts constants already at file top — PASS

`DEFAULT_MAX_SIZE` (line 11) and `CLEANUP_INTERVAL_MS` (line 12) confirmed as file-level constants. File was NOT modified in this change set — correct behavior.

### S4: create-redis-client.ts magic numbers extracted — PASS

`100` → `RETRY_BASE_DELAY_MS` and `3000` → `RETRY_MAX_DELAY_MS` as file-level constants declared above the function.

---

## Summary

| Criterion | Verdict |
|-----------|---------|
| M1 | PASS |
| M2 | PASS |
| M3 | PASS |
| M4 | PASS |
| M5 | PASS |
| M6 | PASS |
| M7 | PASS |
| S1 | PASS |
| S2 | PASS |
| S3 | PASS |
| S4 | PASS |

**Overall: ALL PASS (7/7 MUST, 4/4 SHOULD)**

### Issues Found

1. **BUG (non-contract, but real)**: `migrate-user-roles.ts` has Korean text corruption (mojibake) in comments AND a console.log string. The original file had correct Korean ("사용자 역할 시스템 마이그레이션 스크립트", "새로운 역할 시스템으로 변환", "사용자 역할 시스템 마이그레이션 시작..."), but the current file has corrupted characters at lines 7, 9, and 16 (e.g., "마이그레이션 ���크립트", "���로운", "사용�� 역할 시��템"). The line 16 corruption affects a runtime `console.log` string — this is a functional bug, not just a comment issue. **This does not violate any MUST/SHOULD criterion** (M1 is about DB URL replacement, which is correct), but it is collateral damage that should be fixed.
