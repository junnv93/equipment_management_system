# Contract: db-fk-sweep

## MUST (pass criteria)

- [ ] `pnpm tsc --noEmit` exit 0 (all packages)
- [ ] `pnpm --filter backend run test` exit 0
- [ ] `pnpm --filter backend run db:generate` produces exactly one new migration SQL file under `apps/backend/drizzle/` whose ALTER TABLE / ADD CONSTRAINT set matches the exec-plan
- [ ] Generated migration (hand-augmented with orphan backfill where needed) applies cleanly via `pnpm --filter backend run db:migrate` against dev DB with zero data loss
- [ ] `/verify-implementation` (at minimum `verify-ssot`) reports PASS
- [ ] `review-architecture` Critical == 0

## Scope (touches only)

- `packages/db/src/schema/equipment.ts` — convert `requestedBy/approvedBy` to `uuid` + `.references(users.id, { onDelete: 'set null' })`
- `packages/db/src/schema/checkouts.ts` — add `.references(() => teams.id, { onDelete: 'restrict' })` to `lenderTeamId`
- `packages/db/src/schema/calibrations.ts` — add `.references(() => users.id, { onDelete: 'set null' })` to `registeredBy` and `approvedBy`
- `packages/db/src/schema/notifications.ts` — add `.references(() => users.id, { onDelete: 'cascade' })` to `notificationPreferences.userId`
- `apps/backend/drizzle/0006_db_fk_sweep.sql` (new) — migration + orphan backfill

## MUST NOT

- No changes to any frontend file
- No changes to files listed as parallel-session locked (use-toast.ts, disposal/**, toast-helpers.ts, all modified frontend files)
- No `db:push` — migration must go through `db:generate` + `db:migrate`
- No modifications to existing `relations()` blocks (they already cover these references)
- No "while I'm here" refactors
