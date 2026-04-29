# Contract — button-loading-codemod (2026-04-29)

**Slug**: `button-loading-codemod`
**Plan**: `.claude/exec-plans/active/2026-04-29-button-loading-codemod.md`
**Mode**: Mode 2 (Harness, multi-phase)

The Evaluator MUST run every check below. A single MUST failure ⇒ overall FAIL.
SHOULD failures ⇒ ATTENTION (orchestrator decides whether to land).

---

## MUST (P1 — production blockers)

### M1. Phase 0 dirty files committed without alteration

- **Check**: `git log -1 --name-only` lists exactly:
  - `packages/schemas/src/fsm/checkout-fsm.ts`
  - `apps/backend/src/modules/approvals/approvals.service.ts`
  - `apps/frontend/lib/api/approvals-api.ts`
  - `apps/frontend/lib/api/query-config.ts`
  - `apps/frontend/app/(dashboard)/checkouts/[id]/CheckoutDetailClient.tsx`
  - `apps/frontend/next-env.d.ts`
- **Check**: no other files in that commit; commit message follows the conventional form in the plan.
- **Fail if**: any extra file present, any missing, or message diverges materially.

### M2. Whole-monorepo type check passes

```bash
pnpm tsc --noEmit
```

- **Pass**: exit 0.
- **Fail**: any TS error in any package.

### M3. Backend & frontend lint clean (changed files)

```bash
pnpm --filter backend run lint -- --max-warnings=0
pnpm --filter frontend run lint -- --max-warnings=0
```

- **Pass**: exit 0 on both.
- Scope is full lint runs; warnings introduced by codemod are blocking.

### M4. Codemod script exists, is idempotent, and supports `--dry`

- **Check**: `scripts/codemods/button-loading.ts` exists.
- **Check**: re-running `pnpm tsx scripts/codemods/button-loading.ts` after Phase 1 produces ZERO file modifications (idempotency).
- **Check**: `pnpm tsx scripts/codemods/button-loading.ts --dry` exits 0 with no writes (verify via `git status` afterwards).

### M5. Every shadcn Button with `disabled={…isPending}` also has `loading={…isPending}`

```bash
# Files matching the predicate (false-positive list = AlertDialogCancel/Action):
node scripts/codemods/button-loading.ts --check
```

If the codemod ships a `--check` mode, prefer it. Otherwise:

```bash
# Heuristic check — file must NOT contain a <Button …disabled={X.isPending}…> without a sibling loading={X.isPending}.
# Manually inspect any flagged file; AlertDialogCancel rows are allowed.
```

- **Pass**: 0 unflagged occurrences.
- **Fail**: any shadcn `<Button>` with `disabled={X.isPending}` lacking `loading={…}`.

### M6. No regression to non-target tags

- **Check**: no `<AlertDialogCancel loading=` / `<AlertDialogAction loading=` / `<button loading=` (lowercase HTML) anywhere.

```bash
grep -rn "AlertDialogCancel.*loading=\|AlertDialogAction.*loading=" apps/frontend --include="*.tsx"
grep -rn "<button [^>]*loading=" apps/frontend --include="*.tsx"
```

- **Pass**: empty output.
- **Fail**: any hit.

### M7. Backend tests pass (covers approvals.service signature change)

```bash
pnpm --filter backend run test
```

- **Pass**: exit 0.
- **Fail**: red tests, especially in `approvals/`.

### M8. Frontend tests pass

```bash
pnpm --filter frontend run test
```

- **Pass**: exit 0.
- **Fail**: red tests touching Button, Checkouts, Approvals.

### M9. Surgical scope honoured

- **Check**: `git diff --stat` for the codemod commit lists ONLY:
  - `scripts/codemods/button-loading.ts` (new)
  - `pnpm-lock.yaml` (ts-morph add only — verify ts-morph is the only top-level addition)
  - `package.json` (workspace root devDependencies +ts-morph)
  - `apps/frontend/**/*.tsx` files from the targeted list (Phase 1 §1.4)
- **Fail if**: any backend file, any unrelated frontend file (e.g., page.tsx that didn't have a matching pattern), README, or tests outside `__tests__` adjacent.

### M10. SSOT integrity preserved

- **Check**: `LENDER_APPROVAL_PENDING_STATUSES` is the only producer of the lender-pending status set:

```bash
grep -rn "LENDER_APPROVAL_PENDING_STATUSES" apps/backend apps/frontend packages/schemas --include="*.ts" --include="*.tsx"
```

Should show: 1 definition (schemas) + ≥2 consumers (backend approvals.service, frontend approvals-api).

- **Fail**: any local re-derivation of `['pending', 'borrower_approved']`.

---

## SHOULD (P2 — quality bar, ATTENTION on miss)

### S1. Phase 2 / Phase 3 confirmed already-applied

- **Check**: no `<ListPageSkeleton title="` / `<ListPageSkeleton description="` (string forms):

```bash
grep -rn "ListPageSkeleton.*title=\"\|ListPageSkeleton.*description=\"\|TablePageSkeleton.*title=\"\|TablePageSkeleton.*description=\"" apps/frontend --include="*.tsx"
```
Should be empty.

- **Check**: `useGenerateReport` uses `FEEDBACK_KEYS.reportGenerated` (not `created`):

```bash
grep -n "FEEDBACK_KEYS" apps/frontend/hooks/use-reports.ts
```
Line in `onSuccess.title` ≡ `reportGenerated`.

### S2. Manual `<Loader2>` spinners removed where Button now provides one

- **Heuristic**: file count of `Loader2` + `<Button` co-occurrence after Phase 1 ≤ count before.
- ATTENTION (not block) if `STRIP_MANUAL_SPINNERS=1` second pass was not run; the orchestrator may schedule a follow-up.

### S3. Codemod has tests or a self-check mode

- A `--check` flag that exits non-zero when violations remain is sufficient.
- Inline assertions or a snapshot-style test under `scripts/codemods/__tests__/` is preferred but not required for landing.

### S4. ts-morph confined to dev dependency

- Verify `package.json` (root) places `ts-morph` in `devDependencies`, not `dependencies`.
- Verify no app `package.json` (`apps/frontend`, `apps/backend`) gained `ts-morph`.

### S5. Pre-push hook passes

- `git push` (or `node .husky/pre-push`) returns 0.

### S6. No accessibility regressions

- Manual / smoke: a Button with `loading={true}` exposes `aria-busy="true"` and the spinner has `aria-hidden="true"` — confirmed by reading button.tsx but should not be invalidated by codemod.
- ATTENTION if any Button now renders an additional non-aria-hidden Loader2 inside (would cause SR double-announce).

### S7. Documentation footprint

- ATTENTION (do not block): mention the new codemod in the Plan + commit body. README / docs/ updates not required.

---

## Forbidden behaviours (auto-FAIL on observation)

- F1. Editing files outside `apps/frontend/{components,app}/` during Phase 1 (e.g., touching `packages/`, backend, or frontend `lib/api/`).
- F2. Removing the `disabled` attribute from any Button (we ADD `loading`, do not REPLACE `disabled`).
- F3. Rewriting `<AlertDialogCancel>`, `<AlertDialogAction>`, or `<Button asChild>`.
- F4. Adding `any` casts.
- F5. Using `--no-verify` on commit / push.
- F6. Generating tests, stories, or docs not requested.
- F7. Touching `next-env.d.ts` manually outside the Phase 0 ratified diff.
- F8. Bumping unrelated dependencies in `pnpm-lock.yaml` (ts-morph + its transitives only).

---

## Evaluation flow

1. Run M1 → M10 in order. Stop on first MUST fail and report it.
2. If all MUST pass, evaluate S1 → S7. Collect ATTENTION items.
3. Render verdict:
   - **PASS** = all MUST pass + 0 ATTENTION.
   - **PASS-with-ATTENTION** = all MUST pass + ≥1 ATTENTION (orchestrator decides next step).
   - **FAIL** = any MUST fail OR any forbidden behaviour.
4. Output the file/line counts:
   - Phase 0: 6 files committed.
   - Phase 1: N buttons rewritten across M files (N expected ≈ 60-70, M ≈ 40).
