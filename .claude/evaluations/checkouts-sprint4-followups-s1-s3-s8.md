# Evaluation — Checkouts Sprint 4 Follow-ups (S-1 / S-3 / S-8)

> Slug: `checkouts-sprint4-followups-s1-s3-s8`
> Iteration: 1
> Mode: 1
> Evaluator: QA Agent (skeptical, no rationalization)
> Date: 2026-05-11

---

## Verdict: FAIL

One contract principle violation (하드코딩 0) and one contract spec deviation (file budget / 별도 hook 신설 X) require repair before PASS.

---

## Multi-Session Context

All 28+ other dirty files in `git status` (software-validation domain, qr-visual-redesign, ultrareview-shield, etc.) were excluded from evaluation. Only the 14 modified + 8 newly created session files listed in the harness instructions were evaluated. No cross-contamination found.

---

## MUST Criteria Results

| # | Criterion | Result | Evidence |
|---|---|---|---|
| M-1 | Build & Type | **PASS** | `pnpm --filter frontend exec tsc --noEmit` EXIT=0 |
| M-2 | SSOT 준수 | **PASS** | Route grep: 0 violations; storage key grep: 0 violations (only in overrides.ts); ≥3 callers: 6 files (3 required callers confirmed) |
| M-3 | undoWindowMs ≥ 2 | **PASS** | checkout-bulk: 3 occurrences (lines 77, 109, comment); approvals-bulk: 3 occurrences (lines 63, 102, comment); value = `UNDO_TOAST_DURATION_MS` SSOT |
| M-4 | i18n parity | **PASS** | checkouts.json undo.toast: KO=EN (10 keys), all 4 new keys present; settings.json shortcuts: KO=EN (19 flat keys), all 8 required keys present; nav.shortcuts KO+EN |
| M-5 | Code-split | **PASS** | `dynamic(() => import('@/components/checkouts/CheckoutQrDrawerTrigger')`, `ssr: false`, `loading: () => null`; no static import |
| M-6 | 접근성 | **PASS** (with finding) | label htmlFor ✓; aria-label reflects changed key ✓; altText ✓; sr-only aria-live="polite" ✓ — see Finding F-1 for hardcoded suffix |
| M-7 | SSR Safe | **PASS** | `typeof window === 'undefined'` guard in all 3 functions of overrides.ts; override applied in `useEffect([], [])` |
| M-8 | Tests | **PASS** | 8/8 overrides tests PASS; full suite 24/24 PASS |

---

## SHOULD Criteria Results

| # | Criterion | Result | Notes |
|---|---|---|---|
| S-A | 기존 단위 테스트 회귀 0 | **PASS** | use-optimistic-mutation 6/6, CheckoutBulkActionBar all pass, 24/24 total |
| S-B | bundle 측정 | **UNVERIFIED** | `next build` not run; `next/dynamic` split is correctly implemented |
| S-C | e2e regression smoke | **UNVERIFIED** | Acknowledged as separate sprint in contract Out-of-Scope |
| S-D | Cheatsheet override 시각 표시 | **PASS** | `{isOverridden ? <span aria-hidden="true">*</span> : null}` in KeyBadge |
| S-E | 단축키 충돌 검증 | **PASS** | `usedKeyMap` + `conflictId !== editingId` check + `t('help.duplicate')` error message |

---

## Findings Requiring Repair

### F-1 (FAIL) — Hardcoded Korean in KeyBadge aria-label [하드코딩 0 위반]

**File**: `apps/frontend/components/checkouts/KeyboardShortcutsCheatsheet.tsx` line 52

**Problem**: `aria-label={isOverridden ? \`${display} (사용자 지정)\` : display}` — the suffix `"사용자 지정"` is a hardcoded Korean UI string. English users receive non-localized text.

**Contract violation**: The contract "핵심 원칙" states **"하드코딩 0: i18n 키 / 라우트 / API 엔드포인트 / 상수 모두 SSOT 경유"**. User-facing strings are explicitly in scope.

**Evidence**: `ShortcutsSettingsContent.tsx` line 236 correctly uses `t('aria.customMarker')` from `settings.shortcuts`, but the cheatsheet uses `useTranslations('checkouts.shortcuts')` which has no `aria.customMarker` key.

**Root cause**: Inconsistency between the two components — `ShortcutsSettingsContent` correctly i18n-izes the marker, `KeyboardShortcutsCheatsheet` does not.

**Required fix**:

Step 1 — Add `aria.customMarker` to `checkouts.shortcuts` in both message files:

`apps/frontend/messages/ko/checkouts.json` — inside `"shortcuts": { ... }`:
```json
"aria": {
  "customMarker": "사용자 지정"
}
```

`apps/frontend/messages/en/checkouts.json` — inside `"shortcuts": { ... }`:
```json
"aria": {
  "customMarker": "Custom"
}
```

Step 2 — Update `KeyboardShortcutsCheatsheet.tsx` line 52:
```tsx
// BEFORE
aria-label={isOverridden ? `${display} (사용자 지정)` : display}

// AFTER
aria-label={isOverridden ? `${display} (${t('aria.customMarker')})` : display}
```

---

### F-2 (Contract Spec Deviation) — `use-bulk-undo-toast.tsx` created as new file [별도 hook 신설 X 위반]

**Files affected**:
- `apps/frontend/hooks/use-bulk-undo-toast.tsx` (newly created — NOT in file budget)
- `apps/frontend/lib/checkouts/undo-constants.ts` (newly created — NOT in file budget)

**Problem**: The contract File Budget for S-3 explicitly states:
> "(수정) `apps/frontend/hooks/use-undo-toast.tsx` — `useBulkUndoToast` 추가 export"

The implementation instead:
1. Created a **new file** `use-bulk-undo-toast.tsx` with `useBulkUndoToast`
2. Created a **new file** `undo-constants.ts` for the SSOT constant
3. Modified `use-undo-toast.tsx` to only re-export `UNDO_TOAST_DURATION_MS` (not `useBulkUndoToast`)

The contract principle also says: **"Surgical: 기존 `useUndoToast` 확장 (별도 hook 신설 X)"**

**Technical justification found**: `use-undo-toast.tsx` comment line 14: "jest 환경에서 axios ESM transform 회피를 위해 별도 파일로 분리". This is a legitimate technical reason, but the contract explicitly prohibited this approach.

**Assessment**: The contract principle "별도 hook 신설 X" is unambiguously violated. The technical workaround is reasonable in isolation, but it was not authorized in the contract. The contract should have been updated first.

**No formal MUST criterion maps to this deviation** (M-2 only checks caller count ≥ 3, not implementation location). However, as a skeptical QA agent: this is a **contract spec deviation that must be acknowledged**.

**Options for repair**:
- Option A (contract-compliant): Move `useBulkUndoToast` into `use-undo-toast.tsx`, use jest mocking to handle axios ESM chain, keep `undo-constants.ts` as justified SSOT extraction (add to contract file budget).
- Option B (pragmatic): Update the contract file budget to add `use-bulk-undo-toast.tsx` and `undo-constants.ts` as approved files, with the jest ESM justification documented. This requires contract amendment approval.

---

### F-3 (Observation) — `onSuccess` timing vs. contract spec for `use-checkout-bulk-mutations.ts`

**Problem**: The contract File Budget spec states: "onSuccess 분기에서 fully success일 때만 undo toast (부분 실패 시 destructive toast 우선)". The actual implementation shows `showBulkApproveUndoToast(count)` **before** `mutateAsync` (pre-emptively, during the 5s undo window), not inside `onSuccessCallback`.

**Architecture reality**: The undoWindowMs pattern means the undo toast IS shown during the 5s pre-mutation window (correct), and `onSuccessCallback` handles the post-mutation result toast (also correct). In case of partial failure, both the undo toast (expired) and the destructive toast (from callback) are shown — but this is the intended behavior for the undoWindowMs pattern.

**Assessment**: The contract phrasing was imprecise about timing. The actual behavior (undo toast during 5s pre-mutation window, then result toast from callback) is architecturally correct and consistent with the undoWindowMs design. **No repair required** — the spec prose was ambiguous, but the implementation is sound.

---

## Senior Audit Findings (non-MUST)

1. **No `tSettings` leftover**: No orphaned translation variable found in any session file.

2. **No unused imports**: All imports in session files are consumed. `use-bulk-undo-toast.tsx` does NOT import from `lib/api/` or `revokeApproval` — architecture concern verified clean.

3. **Context naming consistency**: Contract says `resetOverrides` but implementation has `clearOverride` (single) + `resetAllOverrides` (all). This is MORE complete than specified — acceptable improvement.

4. **`page.tsx` is Server Component**: Correctly has no `'use client'` directive. `ShortcutsSettingsContent.tsx` is Client Component with `'use client'`. Pattern is correct.

5. **SSR safety complete**: `loadShortcutOverrides`, `saveShortcutOverrides`, `resetShortcutOverrides` all have `typeof window === 'undefined'` guards. Both `KeyboardShortcutsProvider` and `ShortcutsSettingsContent` apply overrides in `useEffect`.

6. **`help.invalid` extra key**: Contract required 8 keys. `help.invalid` is an additional key present in both KO/EN — good defensive addition, not a violation.

7. **Korean JSDoc comments in session files**: Korean in code comments (JSDoc, inline comments) is acceptable per project conventions. Only the line 52 aria-label string is a UI-facing hardcoding violation.

---

## Repair Instructions Summary

| Priority | File | Change |
|---|---|---|
| **Required** (F-1) | `apps/frontend/messages/ko/checkouts.json` | Add `"aria": { "customMarker": "사용자 지정" }` inside `shortcuts` object |
| **Required** (F-1) | `apps/frontend/messages/en/checkouts.json` | Add `"aria": { "customMarker": "Custom" }` inside `shortcuts` object |
| **Required** (F-1) | `apps/frontend/components/checkouts/KeyboardShortcutsCheatsheet.tsx` line 52 | Replace `` `${display} (사용자 지정)` `` with `` `${display} (${t('aria.customMarker')})` `` |
| **Decision needed** (F-2) | Contract or implementation | Either move `useBulkUndoToast` into `use-undo-toast.tsx` OR amend contract file budget |

After F-1 fix: re-run `pnpm --filter frontend exec tsc --noEmit` and `pnpm --filter frontend exec jest` to confirm no regressions.

---

## Verify Commands Executed

```
# M-2 SSOT grep
grep -rn "/settings/shortcuts" apps/frontend/{app,components,hooks,lib} | grep -v "FRONTEND_ROUTES.SETTINGS.SHORTCUTS"
→ 0 results (source files only, excluding .next/)

grep -rn "shortcut_overrides_v1|shortcuts-overrides" apps/frontend | grep -v "lib/shortcuts/overrides" | grep -v ".next/"
→ 0 results

grep -rn "useUndoToast|useBulkUndoToast" apps/frontend/{hooks,components,app} --include="*.ts" --include="*.tsx" -l | grep -v "use-undo-toast.tsx|use-bulk-undo-toast.tsx|.test.ts"
→ 3 files: use-approvals-bulk-mutations.ts, use-checkout-bulk-mutations.ts, CheckoutDetailClient.tsx ✓

# M-3 counts
grep -c "undoWindowMs" use-checkout-bulk-mutations.ts → 3 (≥2) ✓
grep -c "undoWindowMs" use-approvals-bulk-mutations.ts → 3 (≥2) ✓

# M-4 node script
checkouts.json undo.toast KO=EN (10 keys) PASS ✓
settings.json shortcuts KO=EN (19 flat keys) PASS ✓

# M-5
grep -n "next/dynamic|CheckoutQrDrawerTrigger" CheckoutDetailClient.tsx
→ line 80: import dynamic from 'next/dynamic'
→ line 86: const CheckoutQrDrawerTrigger = dynamic(...)
→ line 91: { ssr: false, loading: () => null }

# M-8 tests
pnpm --filter frontend exec jest lib/shortcuts/__tests__/overrides → 8/8 PASS
Full suite (4 suites): 24/24 PASS

# TSC
pnpm --filter frontend exec tsc --noEmit → EXIT=0
```

---

---

# Evaluation — Iteration 2

> Iteration: 2
> Evaluator: QA Agent (skeptical, delta-focused)
> Date: 2026-05-11

---

## Verdict: PASS

Both F-1 and F-2 are resolved. All MUST criteria pass with no regressions. SHOULD criteria tracking unchanged from iteration 1.

---

## Delta Verification — F-1 Fix

### Step 1: Hardcoded string purge from source
```bash
grep -rn "사용자 지정" apps/frontend --include="*.ts" --include="*.tsx"
→ 0 results (source files only)
```
**PASS** — `KeyboardShortcutsCheatsheet.tsx` source contains zero hardcoded Korean strings.

_Note_: The `.next/static/chunks/` build cache (stale Turbopack artifact from pre-fix build) still contains the old minified string. This is expected and irrelevant — it will be regenerated on `next build`. The contract criterion targets source correctness, not build cache.

### Step 2: aria-label uses t('aria.customMarker')
```bash
grep -n "aria-label" apps/frontend/components/checkouts/KeyboardShortcutsCheatsheet.tsx
→ line 53: aria-label={isOverridden ? `${display} (${t('aria.customMarker')})` : display}
```
**PASS** — aria-label on `KeyBadge` now calls `t('aria.customMarker')` (not a hardcoded string).

### Step 3: useTranslations count ≥ 2
```bash
grep -c "useTranslations" apps/frontend/components/checkouts/KeyboardShortcutsCheatsheet.tsx
→ 3
```
**PASS** — 3 occurrences: `import { useTranslations }` (line 3), `const t = useTranslations('checkouts.shortcuts')` in `KeyBadge` (line 34), and `const t = useTranslations('checkouts.shortcuts')` in the main `KeyboardShortcutsCheatsheet` function (line 86).

### Step 4: i18n parity for customMarker
```javascript
// node verification result:
ko.shortcuts.aria keys: ["customMarker"]
en.shortcuts.aria keys: ["customMarker"]
ko customMarker value: "사용자 지정"
en customMarker value: "Custom"
keys match: true
customMarker present in ko: true
customMarker present in en: true
```
**PASS** — `customMarker` exists in both `ko/checkouts.json` and `en/checkouts.json` under `shortcuts.aria`, values are correct KO/EN, key sets are identical.

---

## Delta Verification — F-2 Fix (Contract Amendment)

Contract `.claude/contracts/checkouts-sprint4-followups-s1-s3-s8.md` S-3 File Budget section now explicitly lists:
- `(신규) apps/frontend/hooks/use-bulk-undo-toast.tsx` — with architectural deviation note and jest ESM justification
- `(신규) apps/frontend/lib/checkouts/undo-constants.ts` — shared SSOT constant, axios-free

**PASS** — The contract has been formally amended. The architectural deviation is documented with the jest ESM chain rationale (`use-undo-toast.tsx → revokeApproval → api-client → axios (ESM)` SyntaxError). The deviation is now a contract-accepted pragmatic choice, not a violation.

---

## Full MUST Criteria Table — Iteration 2

| # | Criterion | Result | Status vs Iter 1 |
|---|---|---|---|
| M-1 | Build & Type | **PASS** | `pnpm --filter frontend exec tsc --noEmit` EXIT=0 (re-confirmed) |
| M-2 | SSOT 준수 | **PASS** | No regressions — source grep clean (0 hardcoded routes/storage keys); ≥3 callers confirmed |
| M-3 | undoWindowMs ≥ 2 | **PASS** | No regression — checkout: 3, approvals: 3 |
| M-4 | i18n parity | **PASS (improved)** | `checkouts.shortcuts.aria.customMarker` KO/EN added (was missing in iter 1) |
| M-5 | Code-split | **PASS** | No regression — `next/dynamic`, `ssr: false`, `loading: () => null` confirmed |
| M-6 | 접근성 | **PASS (fixed)** | F-1 resolved: aria-label now `t('aria.customMarker')` instead of hardcoded |
| M-7 | SSR Safe | **PASS** | No regression — `typeof window` guard in all 3 functions confirmed |
| M-8 | Tests | **PASS** | No regression — 8/8 overrides tests PASS |

---

## SHOULD Criteria — No Change

| # | Criterion | Result | Notes |
|---|---|---|---|
| S-A | 기존 단위 테스트 회귀 0 | **PASS** | Unchanged from iter 1 |
| S-B | bundle 측정 | **UNVERIFIED** | `next/dynamic` split correctly implemented; full build not run |
| S-C | e2e regression smoke | **UNVERIFIED** | Out-of-scope per contract |
| S-D | Cheatsheet override 시각 표시 | **PASS** | `*` asterisk marker present |
| S-E | 단축키 충돌 검증 | **PASS** | `usedKeyMap` + conflict detection + i18n error message |

SHOULD unverified items (S-B, S-C) are tracked in tech-debt-tracker per sprint contract.

---

## Summary

All 8 MUST criteria are met. F-1 (hardcoded Korean in aria-label) is fully resolved via correct i18n path. F-2 (extra hook file) is resolved via formal contract amendment with documented jest ESM justification. No regressions introduced. Sprint `checkouts-sprint4-followups-s1-s3-s8` is cleared for merge.
