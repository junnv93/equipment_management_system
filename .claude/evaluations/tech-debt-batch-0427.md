# Evaluation Report: tech-debt-batch-0427
Date: 2026-04-27
Iteration: 1

## MUST Criteria

| Criterion | Verdict | Notes |
|-----------|---------|-------|
| M1 — Frontend tsc passes (only pre-existing AlertBanner.test.tsx error allowed) | PASS | Only error: `AlertBanner.test.tsx(96,3): error TS2322: Type 'null' is not assignable to type 'string \| undefined'` — pre-existing, within allowed exception |
| M2 — Backend tsc passes with 0 errors | PASS | `pnpm exec tsc --noEmit` returned no output (exit 0) |
| M3 — ExportFormButton.tsx does NOT import `useAuth` | PASS | File verified line-by-line; no `useAuth` import or call present. Only imports: `useState`, `Download`, `Loader2`, `Button`, `useToast`, `exportFormTemplate`, `getDownloadErrorToast` |
| M4a — SelfInspectionTab.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 374 confirmed |
| M4b — CheckoutHistoryTab.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 547 confirmed |
| M4c — EquipmentPageHeader.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 64 confirmed |
| M4d — TestSoftwareListContent.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 142 confirmed |
| M4e — EquipmentImportDetail.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 533 confirmed |
| M4f — CableListContent.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 160 confirmed |
| M4g — ValidationDetailContent.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 118 confirmed |
| M4h — CheckoutDetailClient.tsx has `canAct={can(Permission.EXPORT_REPORTS)}` | PASS | Line 492 confirmed |
| M5 — PageHeader.tsx `OnboardingHintBanner` does NOT call `useAuth()` | PASS | `grep -n "useAuth"` returned no output. Banner accesses permission via `hint.canShowPrimaryAction` prop (line 70: `const showAction = hint.canShowPrimaryAction !== false`) |
| M6 — CheckoutsContent.tsx passes `canShowPrimaryAction: canCreateCheckout` to PageHeader | PASS | Line 275: `canShowPrimaryAction: canCreateCheckout` where `canCreateCheckout = can(Permission.CREATE_CHECKOUT)` (line 113). No legacy `permission:` key present. |
| M7 — CheckoutListSkeleton.tsx does NOT import or use shadcn `<Skeleton>` | PASS | Only imports: `Card` from `@/components/ui/card` and `CHECKOUT_LOADING_SKELETON_TOKENS, getStaggerDelay` from `@/lib/design-tokens`. No Skeleton component imported or used. |
| M8 — CheckoutGroupCard.tsx uses `UserSelectableCheckoutPurpose` not literal string cast | PASS | Line 33: `type UserSelectableCheckoutPurpose` imported from `@equipment-management/schemas`. Line 122: `as UserSelectableCheckoutPurpose`. No `as 'calibration' \| 'repair' \| 'rental'` literal cast found. |
| M9 — Backend test `borrowerReject (d)` exists and passes | PASS | Test output confirmed: `✓ (d) req.user.teamId != requester.teamId → ForbiddenException(BORROWER_TEAM_ONLY)`. Suite: 37 passed, 0 failed. |
| M10 — workflow-panel.ts `action.blocked` contains `FOCUS_TOKENS.classes.default` | PASS | Lines 49-52: `blocked: [` block contains `FOCUS_TOKENS.classes.default` at line 52 |
| M11 — workflow-panel.ts critical urgency uses `animate-pulse-soft` NOT `animate-pulse-hard` | PASS | Line 164: `motion-safe:animate-pulse-soft`. `animate-pulse-hard` not found anywhere in file. |
| M12a — ko/non-conformances.json contains `list.chip.arrow` key | PASS | Lines 112-113: nested under `"list"` (line 60), `"chip": { "arrow": " →" }` |
| M12b — en/non-conformances.json contains `list.chip.arrow` key | PASS | Lines 112-113: same structure, `"chip": { "arrow": " →" }` |
| M13 — NonConformancesContent.tsx MiniWorkflow passes `stepLabel` at call site | PASS | Line 529: `stepLabel={t('ncStatus.' + nc.status)}`. Local `MiniWorkflow` component accepts and renders it as `<span className="sr-only">` (lines 612, 616). |
| M14 — Frontend tsc passes (no new ExportFormButton-related type errors) | PASS | Same run as M1 — only AlertBanner.test.tsx pre-existing error, no ExportFormButton errors |

## Summary

**PASS**

All 14 MUST criteria (M1–M14) pass. The tech-debt-batch-0427 session delivered every contracted change correctly:

- ExportFormButton is fully decoupled from `useAuth` — permission gate is prop-injected at all 8 call sites via `can(Permission.EXPORT_REPORTS)`.
- PageHeader's `OnboardingHintBanner` is decoupled from `useAuth` — uses `canShowPrimaryAction?: boolean` prop; CheckoutsContent injects `canCreateCheckout`.
- CheckoutListSkeleton uses only `CHECKOUT_LOADING_SKELETON_TOKENS.base` raw divs (no shadcn Skeleton import).
- CheckoutGroupCard casts via `UserSelectableCheckoutPurpose` named type (SSOT import from `@equipment-management/schemas`).
- workflow-panel.ts: `blocked` action has `FOCUS_TOKENS.classes.default`; critical urgency uses `animate-pulse-soft`.
- Both i18n locale files (ko + en) have `list.chip.arrow`.
- NonConformancesContent MiniWorkflow passes `stepLabel` with sr-only rendering.
- Backend borrowerReject (d) test passes (37 total, 0 failures).
- Both frontend and backend TypeScript compilations are clean.

## Repair Instructions

None required — all criteria passed.
