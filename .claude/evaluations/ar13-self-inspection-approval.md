# Evaluation: ar13-self-inspection-approval

**Date**: 2026-04-27
**Contract**: `.claude/contracts/ar13-self-inspection-approval.md`
**Evaluator**: QA Agent (Sonnet 4.6)

---

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm --filter frontend tsc --noEmit` | PASS (no output = zero errors) |
| `pnpm --filter backend tsc --noEmit` | PASS (no output = zero errors) |
| `pnpm --filter backend run test` | PASS — 947 tests, 0 failures, 73 test suites |

---

## MUST Criteria Verdict

| # | Criterion | Evidence | Verdict |
|---|-----------|----------|---------|
| M1 | `APPROVAL_CATEGORY_VALUES` includes `'self_inspection'` | `packages/schemas/src/enums/approval.ts` L69 | PASS |
| M2 | `ApprovalCategoryValues.SELF_INSPECTION` = `'self_inspection'` | same file L86 | PASS |
| M3 | `SELF_INSPECTION_DATA_SCOPE` exported from shared-constants | `packages/shared-constants/src/index.ts` L232 | PASS |
| M4 | `ROLE_APPROVAL_CATEGORIES.technical_manager` includes `'self_inspection'` | `approval-categories.ts` L40: `AC.SELF_INSPECTION` | PASS |
| M5 | `PendingCountsByCategory.self_inspection: number` in backend | `approvals.service.ts` L101 | PASS |
| M6 | `getSelfInspectionCount()` exists and uses `SELF_INSPECTION_DATA_SCOPE` | `approvals.service.ts` L1036, L1041 | PASS |
| M7 | `getSelfInspectionKpi()` exists | `approvals.service.ts` L1075 | PASS |
| M8 | `getApprovalCountsByScope` integrates `AC.SELF_INSPECTION` branch | `approvals.service.ts` L227-L229: `shouldQuery(AC.SELF_INSPECTION)` → `getSelfInspectionCount()` | PASS |
| M9 | `getKpiByCategory` switch has `case AC.SELF_INSPECTION` | `approvals.service.ts` L335: `case AC.SELF_INSPECTION:` | PASS |
| M10 | `GET /api/self-inspections/pending-approval` endpoint exists | `self-inspections.controller.ts` L131: `@Get('pending-approval')` | PASS |
| M11 | Route ordering: pending-approval before `:uuid` | Controller L131 (`@Get('pending-approval')`) at line 131, `@Get(':uuid')` at line 143 — static route first | PASS |
| M12 | `TAB_META.self_inspection` defined with section='equipment', canReject=true | `approvals-api.ts` L260-L267 | PASS |
| M13 | Frontend approve case for `'self_inspection'` calls correct endpoint | `approvals-api.ts` L843-L849: `API_ENDPOINTS.SELF_INSPECTIONS.APPROVE(id)` | PASS |
| M14 | Frontend reject case for `'self_inspection'` calls correct endpoint | `approvals-api.ts` L952-L958: `API_ENDPOINTS.SELF_INSPECTIONS.REJECT(id)` | PASS |
| M15 | ko/en approvals.json `tabMeta.self_inspection.*` keys exist | `ko/approvals.json` L50: `"self_inspection"`, `en/approvals.json` L50 | PASS |
| M16 | `pnpm --filter backend tsc --noEmit` passes | See above | PASS |
| M17 | `pnpm --filter frontend tsc --noEmit` passes | See above | PASS |
| M18 | `pnpm --filter backend run test` passes | 947 passed, 0 failed | PASS |

**MUST result: 18/18 PASS**

---

## Security Checklist

| Item | Evidence | Verdict |
|------|----------|---------|
| Route has `@RequirePermissions(Permission.VIEW_SELF_INSPECTIONS)` | `self-inspections.controller.ts` L132 | PASS |
| `findPendingApproval` uses SELF_INSPECTION_DATA_SCOPE (site/team scope) | `self-inspections.service.ts` L741 via `buildScopePredicate` | PASS |
| userId extracted from JWT (`req.user`), not body | Controller L135-138: `req.user?.roles?.[0]`, `req.user.site`, `req.user.teamId` | PASS |

---

## SSOT Checklist

| Item | Evidence | Verdict |
|------|----------|---------|
| `self_inspection` string not locally redefined — uses `ApprovalCategoryValues.SELF_INSPECTION` | `approvals.service.ts` L63: `const AC = ApprovalCategoryValues` | PASS |
| `ROLE_APPROVAL_CATEGORIES` modified only in shared-constants | Only `approval-categories.ts` modified | PASS |
| API endpoint via `API_ENDPOINTS.SELF_INSPECTIONS.PENDING_APPROVAL` | `api-endpoints.ts` L478; frontend uses it at `approvals-api.ts` L681-682 | PASS |

---

## SHOULD Criteria

| # | Criterion | Verdict |
|---|-----------|---------|
| S1 | `lab_manager` has `AC.SELF_INSPECTION` in `ROLE_APPROVAL_CATEGORIES` | **NOT MET** — `approval-categories.ts` L46: `lab_manager: [AC.DISPOSAL_FINAL, AC.PLAN_FINAL, AC.INCOMING]` — `AC.SELF_INSPECTION` absent. Contract states `lab_manager: APPROVE_SELF_INSPECTION (전체 권한)` |
| S2 | E2E test for self-inspection approval flow | NOT MET (no test added) |
| S3 | KPI `todayProcessed` includes `self_inspection` actions from audit_logs | PARTIAL — `todayProcessed` is role-agnostic (all approve/reject actions for the user). No category-specific audit filter added for `self_inspection`, consistent with how all other categories handle `todayProcessed`. |

---

## Additional Observations (non-blocking for MUST, but noted)

1. **`approve` case version cast is weakly typed**: `(selfInspDetail as { version?: number }).version` at `approvals-api.ts` L845. If the backend response structure wraps the body (e.g., `{ data: { version: N } }`) the cast silently yields `undefined`, causing the backend Zod `version` validator to reject the request at runtime. Other category approvals use typed API client methods (e.g. `checkoutApi.getCheckout(id)` → structured type). This is a pre-existing pattern inconsistency with no MUST coverage but is a latent runtime failure path. The same pattern appears in the reject case at L953.

2. **`findPendingApproval` in service has no cache**: All other list/count methods use `cacheService.getOrSet`. This pending-approval endpoint performs an unbounded JOIN query on every call. Consistent with the contract (no caching requirement stated), so not a MUST failure.

3. **S1 gap is real**: The contract background section explicitly states `lab_manager: APPROVE_SELF_INSPECTION (전체 권한)`. The implementation omits `lab_manager` from `ROLE_APPROVAL_CATEGORIES.lab_manager`. A `lab_manager` user will see 0 count and no self-inspection tab in the unified approval view, which contradicts the stated permission model.

---

## Summary

All 18 MUST criteria PASS. Build and test suite green. Security and SSOT checklists fully satisfied.

One SHOULD criterion (S1: `lab_manager` permission) is not met and matches the explicit capability statement in the contract background. This is a non-blocking omission per the contract's grading rules but represents a real functional gap.
