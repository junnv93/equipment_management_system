# Exec Plan — button-loading-codemod (2026-04-29)

**Slug**: `button-loading-codemod`
**Mode**: Mode 2 (Harness, multi-phase, Planner→Generator→Evaluator)
**Status**: ACTIVE
**Owner**: Generator (post Planner approval)

---

## Context Snapshot (from Planner audit)

### Phase 0 — Dirty files inherited from prior session

```
M apps/backend/src/modules/approvals/approvals.service.ts
M apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx
M apps/frontend/lib/api/approvals-api.ts
M apps/frontend/lib/api/query-config.ts
M apps/frontend/next-env.d.ts                        # auto-regen, bundle into commit
M packages/schemas/src/fsm/checkout-fsm.ts
```

Audit confirmed:
- `LENDER_APPROVAL_PENDING_STATUSES` exported from `packages/schemas/src/fsm/checkout-fsm.ts:555` (FSM-derived, frozen).
- `inArray` import already present in `approvals.service.ts:11` and used on lines 431/880 with the new `statuses` parameter.
- Frontend `approvals-api.ts:29,507` consumes the SSOT for outgoing query.
- `query-config.ts:347-350` flips `CHECKOUT_DETAIL.refetchOnMount: true`.
- `CheckoutDetailClient.tsx` migrates to `useCheckoutNextStep`, gates on `meta.canCancel` + `availableToCurrentUser`, and improves reason display.
- 4-tier escape-action prioritisation in `getNextStep` (checkout-fsm.ts:802-826).

→ No code changes required. **Verify (tsc + lint) → commit only.**

### Phase 1 — Button `loading` prop codemod (PRIMARY)

`apps/frontend/components/ui/button.tsx` already exposes a fully-featured `loading` prop:
- Auto-applies `aria-busy="true"` + `disabled`.
- Spinner with `pendingDelayMs=200ms` flicker guard.
- Click-swallow during pending (double-submit prevention) — line 116-123.
- `loadingPosition='start'|'end'|'replace'`.
- BC: omitted ⇒ false ⇒ identical legacy behaviour.

**Scope discovered**: 79 occurrences of `disabled={X.isPending}` across 40 files in `apps/frontend/`. ~26 of them additionally render a manual `<Loader2 className="...animate-spin" />` next to the label — these can be removed as the Button now provides the spinner natively.

`<AlertDialogCancel>` / `<AlertDialogAction>` (Radix wrappers in `components/ui/alert-dialog.tsx`) do not accept `loading` and MUST be excluded from rewrite.

### Phase 2 — ListPageSkeleton API ✅ ALREADY DONE

Audit confirmed:
- `list-page-skeleton.tsx:35-56` already declares `showTitle?: boolean` / `showDescription?: boolean`.
- All 10 consumer sites (loading.tsx + page.tsx fallback) already use the boolean form.
- No deprecated `title="..."` / `description="..."` string props remain.

→ **No-op**. Documented here for orchestrator confirmation; no action required.

### Phase 3 — FEEDBACK_KEYS semantic ✅ ALREADY DONE

Audit confirmed:
- `feedback-keys.ts:74-75` already defines `reportGenerated` + `reportFileDownloaded`.
- `hooks/use-reports.ts:176` already uses `FEEDBACK_KEYS.reportGenerated` (not `created`).

→ **No-op**. Documented here; no action required.

---

## Phase Details

### Phase 0 — Verify + Commit dirty files

**Goal**: ratify the 5 inherited modifications without introducing additional code.

| Step | Command | Pass Criteria |
|------|---------|---------------|
| 0.1 | `pnpm --filter @equipment-management/schemas run build` | tsc clean (FSM schema is upstream of both apps) |
| 0.2 | `pnpm --filter backend run tsc --noEmit` | 0 errors — confirms `inArray(schema.checkouts.status, statuses)` types |
| 0.3 | `pnpm --filter frontend run tsc --noEmit` | 0 errors — confirms approvals-api + query-config + CheckoutDetailClient |
| 0.4 | `pnpm --filter backend run lint -- --max-warnings=0` (scoped to changed file) | clean |
| 0.5 | `pnpm --filter frontend run lint -- --max-warnings=0` (scoped to changed files) | clean |
| 0.6 | `git add packages/schemas/src/fsm/checkout-fsm.ts apps/backend/src/modules/approvals/approvals.service.ts apps/frontend/lib/api/approvals-api.ts apps/frontend/lib/api/query-config.ts apps/frontend/app/\(dashboard\)/checkouts/\[id\]/CheckoutDetailClient.tsx apps/frontend/next-env.d.ts && git commit -m "<see commit message below>"` | pre-commit + pre-push hooks pass |

**Commit message** (single conventional commit):

```
refactor(fsm): derive lender approval pending statuses from FSM + improve next-step priority

- Add LENDER_APPROVAL_PENDING_STATUSES (FSM-derived) to packages/schemas
- ApprovalsService.getCheckoutCount/getCheckoutKpiQuery accept CheckoutStatus[] (was scalar) and consume the SSOT
- approvals-api.ts getPendingOutgoing reuses SSOT for status filter
- getNextStep: 4-tier priority (fully-available primary > permitted-only primary > first primary > escape) so escape actions never hide the in-progress workflow context
- query-config: CHECKOUT_DETAIL.refetchOnMount=true (CAS coherence on focus return)
- CheckoutDetailClient: migrate to useCheckoutNextStep, gate cancel on meta.canCancel + availableToCurrentUser, surface reason text
```

**Out-of-scope**: any additional refactors, tests added, or unrelated files. If lint surfaces warnings on adjacent code, leave them — surgical rule.

---

### Phase 1 — Button `loading` prop codemod (PRIMARY)

**Goal**: forward `mutation.isPending` to the Button's `loading` prop everywhere a submit/action button currently uses `disabled={…isPending}`.

**Approach**: ts-morph script. ts-morph is not currently in `package.json`; install as repo-root devDep.

#### 1.1 Tooling install

```bash
pnpm add -D -w ts-morph@^23
```

(`-w` = workspace root, since the codemod is a one-shot dev tool, not a runtime dep of any package.)

Verify it does not perturb any other workspace lockfile entries via `pnpm-lock.yaml` diff inspection (only `ts-morph` + transitives should change).

#### 1.2 Script: `scripts/codemods/button-loading.ts`

Algorithm:
1. Load `apps/frontend/tsconfig.json` via `Project`.
2. For each `.tsx` source file under `apps/frontend/components/**` and `apps/frontend/app/**`:
   - Locate every `JsxOpeningElement` / `JsxSelfClosingElement` whose tag-name is `Button` (identifier match).
   - **Skip** when the tag identifier resolves to a non-Button import (heuristic: only rewrite files whose `Button` import comes from `@/components/ui/button`).
   - Read its attributes:
     - `disabledAttr` = attribute named `disabled` whose initialiser is a `JsxExpression`.
     - `loadingAttr` = attribute named `loading` (skip the file if already present — idempotent).
     - Identify a `mutation.isPending` token inside `disabledAttr`'s expression: any `PropertyAccessExpression` whose right-hand identifier is `isPending`.
   - **Rewrite rules** (in order):
     - **Pure pattern** — `disabled={X.isPending}` (single token):
       - Add `loading={X.isPending}` after the existing `disabled` attribute.
       - Leave `disabled` intact (Button OR-merges `disabled || loading`, so behaviour is preserved and any future condition added to `disabled` keeps working).
     - **Compound pattern** — `disabled={X.isPending || …other}` or `disabled={X.isPending && …}`:
       - Insert `loading={X.isPending}` (mirroring just the pending token).
       - Leave the compound `disabled` untouched.
     - **Multi-mutation pattern** — `disabled={a.isPending || b.isPending}`:
       - Insert `loading={a.isPending || b.isPending}` (preserves OR-of-pending semantics).
3. **Manual-spinner cleanup (optional, gated)**: if the Button's children contain `{X.isPending && <Loader2 …animate-spin… />}` immediately preceding a label, **remove** that JSX expression. Driven by env flag `STRIP_MANUAL_SPINNERS=1` so the codemod stays surgical by default; orchestrator can run a second pass.
4. **Exclude list** (do NOT rewrite):
   - `<AlertDialogCancel>`, `<AlertDialogAction>` — Radix wrappers, no `loading` prop.
   - Any `<Button asChild>` — `loading` prop is no-op when `asChild` (Button warns in dev).
   - Tag rendered through `as` / `component` indirection — skip.
5. After file modifications, save and exit. Print `[file] +N loading attrs added`.

#### 1.3 Run

```bash
pnpm tsx scripts/codemods/button-loading.ts --dry        # diff preview, exits 0
pnpm tsx scripts/codemods/button-loading.ts              # in-place
pnpm prettier --write "apps/frontend/{components,app}/**/*.tsx"
```

`--dry` MUST land in the script.

#### 1.4 Targeted file list (40 files, generated by initial scan)

```
apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx
apps/frontend/app/(dashboard)/checkouts/create/CreateCheckoutContent.tsx
apps/frontend/app/(dashboard)/cables/[id]/CableDetailContent.tsx
apps/frontend/app/(dashboard)/equipment/[id]/non-conformance/NonConformanceManagementClient.tsx
apps/frontend/app/(dashboard)/notifications/NotificationsListContent.tsx
apps/frontend/app/(dashboard)/settings/admin/system/SystemSettingsContent.tsx
apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx
apps/frontend/app/(dashboard)/software/[id]/TestSoftwareDetailContent.tsx
apps/frontend/app/(dashboard)/software/[id]/validation/SoftwareValidationContent.tsx
apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/DocumentUploadButton.tsx
apps/frontend/app/(dashboard)/software/[id]/validation/[validationId]/_components/ValidationEditDialog.tsx
apps/frontend/components/calibration/CalibrationForm.tsx
apps/frontend/components/calibration-plans/ApprovalTimeline.tsx
apps/frontend/components/calibration-plans/CalibrationPlanDetailClient.tsx
apps/frontend/components/calibration-plans/PlanItemsTable.tsx
apps/frontend/components/checkouts/CheckoutGroupCard.tsx
apps/frontend/components/data-migration/FileUploadStep.tsx
apps/frontend/components/data-migration/PreviewStep.tsx
apps/frontend/components/equipment/CalibrationFactorsClient.tsx
apps/frontend/components/equipment/CheckoutHistoryTab.tsx
apps/frontend/components/equipment/IncidentHistoryTab.tsx
apps/frontend/components/equipment/LocationHistoryTab.tsx
apps/frontend/components/equipment/MaintenanceHistoryTab.tsx
apps/frontend/components/equipment/RepairHistoryClient.tsx
apps/frontend/components/equipment/SelfInspectionTab.tsx
apps/frontend/components/equipment/SoftwareTab.tsx
apps/frontend/components/equipment/disposal/DisposalApprovalDialog.tsx
apps/frontend/components/equipment/disposal/DisposalCancelDialog.tsx
apps/frontend/components/equipment/disposal/DisposalRequestDialog.tsx
apps/frontend/components/equipment/disposal/DisposalReviewDialog.tsx
apps/frontend/components/equipment-imports/CreateEquipmentImportForm.tsx
apps/frontend/components/equipment-imports/EquipmentImportDetail.tsx
apps/frontend/components/equipment-imports/ReceiveEquipmentImportForm.tsx
apps/frontend/components/non-conformances/CreateNonConformanceForm.tsx
apps/frontend/components/non-conformances/NCDetailClient.tsx
apps/frontend/components/non-conformances/NCEditDialog.tsx
apps/frontend/components/non-conformances/NCRepairDialog.tsx
apps/frontend/components/notifications/IntermediateCheckAlert.tsx
apps/frontend/components/notifications/notifications-dropdown.tsx
apps/frontend/components/teams/DeleteTeamModal.tsx
```

Expected attribute additions: 60-70 (the 79 occurrences include `<AlertDialogCancel>` rows that will be skipped).

#### 1.5 Verification

| Step | Command | Pass Criteria |
|------|---------|---------------|
| 1.5.1 | `pnpm --filter frontend run tsc --noEmit` | 0 errors |
| 1.5.2 | `pnpm --filter frontend run lint -- --max-warnings=0` (changed files) | clean |
| 1.5.3 | `grep -rln "disabled={[a-zA-Z_.]*\.isPending" apps/frontend/components apps/frontend/app --include="*.tsx" \| xargs grep -L "loading={"` | empty (every disabled-isPending file gained a loading prop) — caveats: `<AlertDialogCancel>` files allowed, manually filter |
| 1.5.4 | `pnpm --filter frontend run test -- --run --silent` (jest unit tests if any touch Button) | green |
| 1.5.5 | Manual smoke (skip if 1.5.1-1.5.4 green): boot dev, click a submit button, observe spinner + click-swallow | spinner appears after ~200ms, double-click ignored |

#### 1.6 Commit

```
feat(ui): forward mutation.isPending to Button loading prop across submit actions

- Add scripts/codemods/button-loading.ts (ts-morph) — idempotent, --dry mode
- Apply to 40 files / ~65 buttons under apps/frontend
- Button already provides built-in spinner + click-swallow + aria-busy
- Excludes: AlertDialogCancel/Action, Button asChild
- BC preserved: disabled stays, loading is additive (Button OR-merges)
```

---

### Phase 2 — ListPageSkeleton API

**Status**: ALREADY APPLIED. No code change. Mention in summary.

If a regression is later discovered (a string `title="..."` somehow reintroduced) the rewrite would be a 2-line edit; out of scope today.

---

### Phase 3 — FEEDBACK_KEYS semantic

**Status**: ALREADY APPLIED. No code change. Mention in summary.

---

## Cross-cutting verification (final gate)

After Phase 0 + Phase 1 commits land:

```bash
pnpm tsc --noEmit                       # whole monorepo
pnpm --filter backend run test          # backend unit (covers approvals.service)
pnpm --filter frontend run test         # frontend tests
git status                              # clean tree
```

Optional skill invocations:
- `verify-frontend-state` — confirms loading-state plumbing.
- `verify-ssot` — confirms `LENDER_APPROVAL_PENDING_STATUSES` not bypassed.
- `verify-checkout-fsm` — covers the `getNextStep` priority change.

---

## Risk register

| Risk | Mitigation |
|------|-----------|
| ts-morph rewrites a non-shadcn Button (custom wrapper) | File-level filter: only files importing `Button` from `@/components/ui/button` |
| Codemod keeps `disabled` AND adds `loading={…isPending}` causing double aria-busy | Button internally OR-merges; `aria-busy` only emitted from `loading`. Verified by reading button.tsx lines 174-188 |
| Manual `<Loader2>` left in children → double spinner | `STRIP_MANUAL_SPINNERS=1` second pass available; default off (surgical) |
| Prettier reorders attributes after codemod | Run prettier after ts-morph; commit single hunk |
| `<AlertDialogCancel disabled={…isPending}>` accidentally rewritten | Tag-name allowlist = exact `Button` only |
| ts-morph dev-dep bloats lockfile | `-w` + `-D` keeps it dev-only; verify `pnpm-lock.yaml` diff |
| Phase 0 commit fails pre-push hook | Hook runs tsc + tests; we already pre-verified locally in 0.1-0.5 |

---

## Out-of-scope (do NOT touch)

- Any handler logic, mutation flow, or query invalidation beyond the inherited diff.
- New `loadingLabel` / `loadingPosition` configuration (defaults are fine).
- shadcn AlertDialog wrappers — separate workstream.
- Form components that use HTMLButton (not the shadcn Button) directly.
- Storybook / docs.

---

## Definition of Done

- Phase 0: clean tree after ratifying commit; `pnpm tsc --noEmit` clean across monorepo.
- Phase 1: `loading={…isPending}` present on every shadcn `<Button>` whose `disabled` references `.isPending`; codemod script committed and re-runnable; `pnpm tsc --noEmit` clean.
- Phase 2 / Phase 3: confirmed already done — no commits.
- Final summary delivered to orchestrator with file/line counts.
