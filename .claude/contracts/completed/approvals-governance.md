# Contract: approvals-governance

**Slug**: approvals-governance
**Mode**: 2
**Date**: 2026-05-04

## MUST Criteria

| # | Criterion | Evidence |
|---|-----------|----------|
| M1 | `lab_manager` has `AC.SELF_INSPECTION` in `ROLE_APPROVAL_CATEGORIES` | `packages/shared-constants/src/approval-categories.ts` |
| M2 | role approval categories can be loaded from DB-backed `system_settings` with static SSOT fallback | `SettingsService.getRoleApprovalCategories()` |
| M3 | role approval settings are Zod-validated against `UserRoleEnum` and `ApprovalCategoryEnum` | `packages/schemas/src/settings.ts` |
| M4 | approval delegation records persist in a DB table with delegator/delegatee/category/date/status indexes | `packages/db/src/schema/approval-delegations.ts`, migration |
| M5 | approvals backend exposes authenticated delegation create/list/revoke APIs | `ApprovalsController` |
| M6 | approvals backend exposes analytics aggregation API using audit logs and scoped user context | `ApprovalsService.getAnalytics()` |
| M7 | frontend approvals API exposes role categories, delegations, and analytics through one barrel | `apps/frontend/lib/api/approvals-api.ts` and submodules |
| M8 | approvals page renders analytics dashboard data without hardcoded metrics | `ApprovalsClient` + analytics component |
| M9 | existing role/category counts continue to return every `PendingCountsByCategory` key | backend unit test |
| M10 | tech-debt items for approvals-ui-r2 section are marked complete or removed with evidence | `tech-debt-tracker.md` |

## SHOULD Criteria

| # | Criterion |
|---|-----------|
| S1 | Future role-category settings UI can be built without changing backend contract |
| S2 | Delegation action authorization can be hardened further per-domain without schema churn |
| S3 | Analytics can be expanded to processed-duration joins when source requested timestamps are normalized |
