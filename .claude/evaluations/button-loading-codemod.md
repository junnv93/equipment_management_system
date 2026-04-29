# Evaluation Report — button-loading-codemod

**Date**: 2026-04-29
**Iteration**: 2
**Evaluator**: Sonnet agent (QA mode)

---

## Iteration 2 Changes Since Iteration 1

Two fix commits landed between iterations:

- `f8ed9f67` — fix(ui): remove duplicate Loader2 spinners in disposal dialogs (4 files)
- `4d3232ce` — fix(ui): remove duplicate Loader2 spinners in team/calibration components (3 files)

Three additional commits landed that are **outside the button-loading-codemod scope** but affect the test environment:

- `1ab5aa5b` — refactor(fsm): rental 8단계 → 7단계 (borrower_received 상태 제거)
- `0a005d12` — test(fsm): rental totalSteps 8→7, in_use reachedStepIndex 6→5
- `cdd19d9a` — chore(skills): verify-checkout-fsm Step 46-48 + i18n 드리프트 제거

---

## Re-assessment of M1 (Phase 0 commit scope)

**Contract criterion (verbatim)**: "no other files in that commit; commit message follows the conventional form in the plan."

**Evidence**:
```
git log -1 --name-only f661c2d0
→ .claude/contracts/button-loading-codemod.md          ← EXTRA
→ .claude/evaluations/next-session-handoff-...×2       ← EXTRA
→ .claude/exec-plans/active/2026-04-29-button-loading-codemod.md ← EXTRA
→ apps/backend/src/modules/approvals/approvals.service.ts  ✓
→ apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx ✓
→ apps/frontend/lib/api/approvals-api.ts ✓
→ apps/frontend/lib/api/query-config.ts ✓
→ apps/frontend/next-env.d.ts ✓
→ packages/schemas/src/fsm/checkout-fsm.ts ✓
```

**Re-assessment**: The contract says "Fail if: any extra file present." The 4 `.claude/` files are harness orchestration artifacts (contract, exec-plan, session handoffs) generated as part of the harness workflow. CLAUDE.md's PostToolUse Hook section addresses Prettier collateral, but not harness artifact bundling into domain commits. The literal contract criterion has no exception for harness artifacts.

**Commit message**: Spec requires `"refactor(fsm): derive lender approval pending statuses from FSM + improve next-step priority"`. Actual: `"refactor(fsm): derive lender approval pending statuses from FSM"`. The `"+ improve next-step priority"` suffix is absent. The contract says "Fail if: message diverges materially." A truncated subject — particularly when the commit body describes the next-step priority changes — is still a material divergence from the spec string.

**Verdict on M1**: The contract criterion is a hard rule with no stated exception for harness artifacts. The extra files are real and present. The commit message is materially shorter than spec. **M1 remains FAIL.**

> Note for orchestrator: These are process artifacts (the harness generates them in the same session as the domain change). The spirit of M1 is to ensure domain changes are not mixed with unrelated code — these `.claude/` files are neither code nor domain changes. Whether to waive M1 retroactively is a policy decision for the orchestrator, not the evaluator.

---

## Re-assessment of M9 (surgical scope honoured)

**Contract criterion (verbatim)**: "Fail if: any backend file, any unrelated frontend file (e.g., page.tsx that didn't have a matching pattern), README, or tests outside `__tests__` adjacent."

**PostToolUse Hook context** (CLAUDE.md): "Prettier가 Write|Edit 후 자동 실행. `'file was modified by a linter'` 메시지는 대부분 포맷 변경만. `git diff`로 확인 후 판단."

**Evidence from iteration 1**: 12 `components/ui/*.tsx` files (shadcn primitives) were reformatted by Prettier with zero functional changes. 20+ out-of-scope component files received actual `loading=` additions.

**Re-assessment of Sub-type A (12 Prettier collateral files)**:
CLAUDE.md explicitly treats Prettier auto-reformats as a known hook artifact. However, the contract's "any unrelated frontend file" criterion makes no exception for Prettier collateral. The 12 shadcn `components/ui/` files had no `loading=` changes — they are pure format noise. The PostToolUse Hook documentation says to verify with `git diff` rather than auto-escalate, implying these should be recognised as non-substantive. A reasonable reading is that Prettier auto-reformats of shadcn primitives are a known environmental artifact, not a functional violation of scope.

**Re-assessment of Sub-type B (≥20 out-of-scope files with actual loading= additions)**:
These are functional code changes (new `loading=` attributes) applied to files not listed in plan §1.4. Examples include `auth/AzureAdButton.tsx`, `auth/LoginForm.tsx`, `approvals/ApprovalsClient.tsx`, `inspections/SelfInspectionFormDialog.tsx`, and others. These are directionally correct but represent genuine scope expansion — the codemod ran more broadly than the plan specified. The contract's "Fail if: any unrelated frontend file" criterion covers these.

**Verdict on M9**: Sub-type A (Prettier collateral) is a known PostToolUse artifact — the orchestrator should treat this as a process known-issue. Sub-type B represents genuine scope expansion beyond plan §1.4. The contract's literal criterion covers both. **M9 remains FAIL** on Sub-type B grounds; Sub-type A is a borderline known-artifact.

---

## MUST Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| M1 | Phase 0 commit scope | **FAIL** | 4 extra `.claude/` files (contract, exec-plan, 2× session handoffs) in commit `f661c2d0`. Commit message truncated: missing `"+ improve next-step priority"` suffix. Contract has no harness-artifact exception. |
| M2 | Whole-monorepo type check passes | **PASS** | `pnpm tsc --noEmit` → exit 0 (confirmed at HEAD `0a005d12`). |
| M3 | Backend & frontend lint clean | **PASS** | Both pass (carried from iteration 1; no lint-touching changes since). |
| M4 | Codemod idempotent + `--dry` | **PASS** | `--check` outputs "✅ All Button components with isPending already have loading prop". |
| M5 | Every shadcn Button with disabled={…isPending} has loading= | **PASS** | `pnpm tsx scripts/codemods/button-loading.ts --check` → "✅ All Button components with isPending already have loading prop". |
| M6 | No regression to non-target tags | **PASS** | Both greps return empty: no `AlertDialogCancel/Action loading=`, no `<button loading=`. |
| M7 | Backend tests pass | **PASS** | 74 test suites, 978 tests, 0 failures (re-verified at HEAD after stale Jest cache cleared by re-run). |
| M8 | Frontend tests pass | **FAIL** | 2 test suites fail: `checkout-exportability.test.ts` (expected 10 exportable statuses, got 9 — caused by `borrower_received` removal in commit `1ab5aa5b` after the codemod) and `inline-action-button.test.tsx` (urgency='normal' returns 'info' vs expected 'ok'). Both failures are from commits post-codemod, NOT from the button-loading codemod itself. |
| M9 | Surgical scope honoured | **FAIL** | Phase 1 commit `ccde0f74` touches 72 frontend files: 40 targeted (plan §1.4) + 12 Prettier-collateral shadcn ui/ files (no loading= added, pure format) + ≥20 out-of-scope files with actual loading= additions. Sub-type B is a genuine scope breach. |
| M10 | SSOT integrity preserved | **PASS** | `LENDER_APPROVAL_PENDING_STATUSES` defined once at `packages/schemas/src/fsm/checkout-fsm.ts:539`. Consumed at `apps/backend/src/modules/approvals/approvals.service.ts:59,193,389` and `apps/frontend/lib/api/approvals-api.ts:29,507`. No local re-derivation of `['pending', 'borrower_approved']`. |

---

## SHOULD Criteria

| ID | Criterion | Result | Notes |
|----|-----------|--------|-------|
| S1 | Phase 2/3 confirmed already-applied | **PASS** | Carried from iteration 1. `ListPageSkeleton` string forms absent, `FEEDBACK_KEYS.reportGenerated` confirmed. |
| S2 | Manual `<Loader2>` spinners removed where Button provides one | **PASS (updated)** | All 6 disposal dialog double-spinners removed by `f8ed9f67`. TeamForm/DeleteTeamModal/ApprovalTimeline cleaned by `4d3232ce`. No `{isPending && <Loader2>}` patterns remain in targeted components. |
| S3 | Codemod has tests or `--check` mode | **PASS** | `--check` flag implemented and exits non-zero on violations. |
| S4 | ts-morph confined to dev dependency | **PASS** | Root `package.json` `devDependencies` only. No app `package.json` gained ts-morph. |
| S5 | Pre-push hook passes | **ATTENTION** | Cannot confirm without live push. Backend tests (M7) now pass, but frontend tests (M8) fail — meaning pre-push hook would FAIL if triggered today. The failures are from commits post-codemod, not the codemod itself. |
| S6 | No accessibility regressions | **ATTENTION (partial)** | Disposal/team/calibration double-spinners resolved (S2 fix). Three new residual patterns identified: (a) `AzureAdButton`: Loader2 with `aria-hidden="true"` inside Button loading=true — visual double-spinner, no SR issue; (b) `LoginForm`: same pattern (aria-hidden="true", no SR double-announce); (c) Three settings pages (`DisplayPreferencesContent`, `CalibrationSettingsContent`, `SystemSettingsContent`): Loader2 with `aria-hidden="true"` inside Button loading=true. All manual Loader2 instances have `aria-hidden="true"` so SR double-announce is mitigated. Visual double-spinner persists. Button's default `loadingPosition='start'` renders both spinner nodes simultaneously. |
| S7 | Documentation footprint | **PASS** | Commit body documents codemod approach and file counts. |

---

## Detailed S6 / S2 Analysis (Remaining Double-Spinner Patterns)

After the `f8ed9f67` and `4d3232ce` fixes, 5 files still have both `loading={isPending}` on the Button AND a manual Loader2 inside children:

1. **`apps/frontend/components/auth/AzureAdButton.tsx`** (line 42, 68): `loading={isPending}` + `{isPending ? <Loader2 aria-hidden="true" /> : <MicrosoftLogo/>}`. Visual double-spinner when pending. aria-hidden on Loader2 mitigates SR issue.

2. **`apps/frontend/components/auth/LoginForm.tsx`** (line 240, 254): `loading={isPending}` + `{isPending ? <Loader2 aria-hidden="true" /> : ...}`. Visual double-spinner when pending.

3. **`apps/frontend/app/(dashboard)/settings/display/DisplayPreferencesContent.tsx`** (line 301, 306): `loading={mutation.isPending}` + `{mutation.isPending ? <Loader2 aria-hidden="true" />...}`. Visual double-spinner.

4. **`apps/frontend/app/(dashboard)/settings/admin/calibration/CalibrationSettingsContent.tsx`** (line 223, 228): Same pattern.

5. **`apps/frontend/app/(dashboard)/settings/admin/system/SystemSettingsContent.tsx`** (line 300, 305): Same pattern.

**Key distinction from resolved cases**: All 5 remaining instances use `aria-hidden="true"` on the manual Loader2, preventing SR double-announce. The resolved disposal/team/calibration cases lacked aria-hidden. However, all 5 still show two spinners visually.

---

## M8 Attribution Analysis

The 2 frontend test failures are from post-codemod commit `1ab5aa5b` (`refactor(fsm): rental 8단계 → 7단계`):

- **`checkout-exportability.test.ts`**: Test asserts `totalStatuses - NON_EXPORTABLE_CHECKOUT_STATUSES.length === 10`. After removing `borrower_received` from `CHECKOUT_STATUS_VALUES`, `totalStatuses` dropped from 14 to 13. The test expectation (10) was not updated. This is a test maintenance failure from `1ab5aa5b`, not from the button-loading codemod.

- **`inline-action-button.test.tsx`**: Test expects `resolveInlineActionVariant` to return `'ok'` for urgency='normal' return/receipt/import actions. A post-codemod code change introduced the divergence. Not traceable to `ccde0f74`.

**Attribution**: Both M8 failures are from commits after the button-loading codemod (`ccde0f74`). At the time of the codemod commit, iteration 1 confirmed M8 PASS (262 tests, 0 failures). The test suite is broken by a separate FSM refactor that was not fully maintained.

**However**: The contract criterion is evaluated against HEAD, not against `ccde0f74`. The contract says "Frontend tests pass" without a temporal scoping clause. M8 **FAILS** at HEAD.

---

## Verdict

**FAIL**

Two MUST criteria fail:

1. **M1** — Phase 0 commit `f661c2d0` contains 4 extra `.claude/` harness artifacts; commit message truncated.
2. **M8** — 2 frontend test suites fail at HEAD. Root cause is post-codemod commit `1ab5aa5b` (FSM rental simplification), not the button-loading codemod itself. Contract has no time-scoping clause.

**M9** also fails (Phase 1 scope breach, Sub-type B: ≥20 out-of-scope files received actual `loading=` additions).

---

## Issues Requiring Fix

### M1 — Phase 0 commit scope violation (unchanged from iteration 1)

**Commit**: `f661c2d0`

The harness bundled 4 `.claude/` infrastructure files into the domain commit. The commit subject is also truncated vs spec. Since this is a historical commit (cannot be amended without --force-push risk), the orchestrator must decide whether to:
- Accept M1 with a documented waiver (harness artifact exception), or
- Require a new commit that amends the record (not possible without rewriting history).

---

### M8 — Frontend tests broken by post-codemod FSM commit

**Failing tests**:
1. `apps/frontend/lib/utils/__tests__/checkout-exportability.test.ts` — hardcoded expected count (10) not updated after `borrower_received` removal
2. `apps/frontend/components/ui/__tests__/inline-action-button.test.tsx` — `resolveInlineActionVariant` behaviour changed by post-codemod work

**Root cause**: Commit `1ab5aa5b` removed `borrower_received` from `CHECKOUT_STATUS_VALUES` (14→13 statuses) but left `checkout-exportability.test.ts` expecting the old count.

**Required fix**: Update `checkout-exportability.test.ts` expectation from 10 to 9, and investigate + fix `inline-action-button.test.tsx` divergence. These fixes are outside the button-loading-codemod scope but block M8.

---

### M9 — Phase 1 scope breach (unchanged from iteration 1)

**Commit**: `ccde0f74`

72 files touched vs 40 targeted (plan §1.4). ≥20 out-of-scope component files received actual `loading=` additions beyond the plan. Prettier auto-reformatted 12 shadcn `components/ui/` files (no functional changes).

**Distinction from iteration 1**: Sub-type B (functional scope expansion) remains a hard M9 fail. Sub-type A (Prettier collateral) is a known PostToolUse artifact per CLAUDE.md.

---

## ATTENTION Items

### S2 / S6 — Partial resolution, 5 residual visual double-spinners (no SR risk)

Disposal dialogs and team/calibration forms are fully resolved. 5 files remain (auth/AzureAdButton, auth/LoginForm, 3 settings pages) with both `loading={isPending}` and manual `Loader2` children — all with `aria-hidden="true"`. No WCAG SR double-announce risk. Visual double-spinner persists. Lower priority than the resolved cases.

### S5 — Pre-push hook would fail

Frontend tests fail at HEAD (M8). A push attempt would trigger pre-push hook failure. Must fix M8 test failures before pushing.

---

## File/Line Counts

- **Phase 0** (`f661c2d0`): 6 domain files + 4 `.claude/` artifacts (unplanned).
- **Phase 1** (`ccde0f74`): 112 `loading=` attributes added across 59 frontend files (plan: ~60-70 attrs, 40 files).
- **S2 fix** (`f8ed9f67` + `4d3232ce`): 7 files cleaned of manual Loader2 double-spinners.
- **Post-codemod FSM** (`1ab5aa5b`): Removed `borrower_received` status, broke 2 frontend tests not updated to match.
