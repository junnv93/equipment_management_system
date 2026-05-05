# Approvals Governance Deferred Closure

## Objective

Close the 2026-04-27 approvals-ui-r2 deferred items with architecture-level changes:

- lab_manager self-inspection approval category alignment
- DB-backed role approval category overrides
- approval delegation workflow primitives
- approval analytics dashboard data path

## Scope

### Shared SSOT

- `packages/shared-constants/src/approval-categories.ts`
  - Include `AC.SELF_INSPECTION` for `lab_manager`.
- `packages/schemas/src/settings.ts`
  - Add role approval category settings schema/default typing.

### DB

- Add `approval_delegations` schema and migration.
- Use `system_settings` for role approval category overrides to avoid a parallel config table.

### Backend

- `SettingsService` exposes validated role approval category settings with static defaults fallback.
- `ApprovalsService` resolves role categories through settings, uses active delegation records for read/count governance primitives, and exposes analytics aggregation from audit logs.
- `ApprovalsController` exposes role-category, delegation, and analytics endpoints guarded by existing auth context.

### Frontend

- `approvals-api` exposes governance fetchers/actions.
- `ApprovalsClient` renders an analytics panel backed by the new endpoint.

## Verification

- `pnpm --filter backend exec tsc --noEmit`
- `pnpm --filter frontend exec tsc --noEmit`
- `pnpm --filter backend exec jest src/modules/approvals/__tests__/approvals.service.spec.ts --runInBand`
- targeted grep checks for `ROLE_APPROVAL_CATEGORIES.lab_manager` and active tech-debt closure.
