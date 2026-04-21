---
slug: nc-p4-guidance
evaluated: 2026-04-22
iteration: 1
verdict: FAIL
---

# NC-P4 Evaluation Report

## MUST Criteria

| # | Criterion | Command Result | Verdict |
|---|-----------|----------------|---------|
| M1 | `tsc --noEmit --skipLibCheck` → 0 errors | No output (0 errors) | PASS |
| M2 | eslint → 0 errors/warnings | No errors/warnings output | PASS |
| M3 | `guidance.ts` exports `deriveGuidance` pure function | `export function deriveGuidance(` found at line 5 | PASS |
| M4 | GuidanceCallout has `role="status" aria-live="polite"` | `aria-live="polite"` at line 51; `role="status"` on `<aside>` at line 49 | PASS |
| M5 | GuidanceCallout has `data-testid="nc-guidance-callout" data-guidance-key` | Both attributes present at lines 53–54 | PASS |
| M6 | GuidanceCallout `h2` has `tabIndex={-1}` | `tabIndex={-1}` at line 78 (on the `h2`) | PASS |
| M7 | NCDetailClient raw `space-y-5` wrapper removed → count 0 | `grep -c '"space-y-5"'` → 0 | PASS |
| M8 | `NC_INFO_NOTICE_TOKENS` prerequisite block removed → count 0 | `grep -c 'NC_INFO_NOTICE_TOKENS'` → 0 | PASS |
| M9 | `NC_URGENT_BADGE_TOKENS` replaced with `URGENT_BADGE_TOKENS.solid` → count 0 | `grep -c 'NC_URGENT_BADGE_TOKENS'` → 0; `URGENT_BADGE_TOKENS.solid` confirmed at line 337 | PASS |
| M10 | ActionBar `roleHint`/`waitingGuidance` removed → count 0 | `grep -c 'waitingGuidance\|roleHint'` → 0 | PASS |
| M11 | markCorrected button disables when `correctionContent` empty | `!nc.correctionContent?.trim()` found at lines 963 and 967 | PASS |
| M12 | `EmptyState` used for correction empty state → count ≥ 1 | Count = 3 (correction EmptyState at line 466, closure EmptyState at line 507, plus import) | PASS |
| M13 | `GuidanceCallout` tag present in JSX → count ≥ 1 | Count = 2 (import + JSX usage at line 402) | PASS |
| M14 | `deriveGuidance` used with `useMemo` in NCDetailClient | `useMemo(` wrapping `deriveGuidance(nc, canCloseNC)` at lines 285–288 | PASS |
| M15 | No hardcoded Korean text in NCDetailClient (excluding comments) | Python scan: all Korean content is in `//`, `/** */`, or `{/* */}` comments only | PASS |
| M16 | No `: any` type in new/modified files | `grep -n ": any\b"` → no output | PASS |
| M17 | No `dark:` prefix in GuidanceCallout | `grep -rn "dark:"` → no output | PASS |
| M18 | s36 test does not use removed patterns (`NC_INFO_NOTICE\|prerequisite.*→`) | `grep` → no output | PASS |
| M19 | `NC_SPACING_TOKENS.detail` used in NCDetailClient → count ≥ 3 | Count = 5 | PASS |

## SHOULD Criteria

| # | Criterion | Verdict |
|---|-----------|---------|
| S1 | E2E test file created with 5 scenarios | PASS — 5 test cases (G-01 through G-05) present in nc-guidance.spec.ts |
| S2 | `staggerFadeInItem` applied to context group elements | PASS — 4 usages at lines 413, 418, 484, 520 covering InfoCards, correction, closure, documents sections |
| S3 | `scrollToActionBar` smooth scroll + focus implemented | PASS — `scrollIntoView({ behavior: 'smooth' })` at line 279 + `querySelector<HTMLElement>('button')?.focus()` at line 281 |
| S4 | Focus restoration `useEffect` for `nc.status` changes | PASS — `useEffect` at lines 291–295 watches `guidance?.key` and calls `title?.focus()` |

## Issues Found

### ISSUE-1 (FAIL): E2E test file created at wrong path

**Severity**: Contract violation — the contract's Scope table specifies the file at:
```
apps/frontend/tests/e2e/non-conformances/nc-guidance.spec.ts
```
The file was actually created at:
```
apps/frontend/tests/e2e/features/non-conformances/nc-guidance.spec.ts
```

The path `apps/frontend/tests/e2e/non-conformances/` does not exist. The file lives under `features/non-conformances/`. This means the contract deliverable path does not match what was implemented. The contract's MOD line for the file `apps/frontend/tests/e2e/features/non-conformances/comprehensive/s36-nc-edit-repair-modals.spec.ts` (which is correct) uses `features/` — the nc-guidance.spec.ts path was inconsistently specified without `features/`.

**Impact**: If any CI runner, test configuration, or documentation references the contract path, the test file would not be found. The contract verification command path mismatch also means automated contract verification against the contract-literal path would fail.

## Summary

The NC-P4 implementation passes all 19 MUST criteria: tsc and ESLint are clean, `deriveGuidance` is correctly exported as a pure function delegating to `resolveNCGuidanceKey` from design-tokens, `GuidanceCallout` has all required accessibility attributes (`role="status"`, `aria-live="polite"`, `data-testid`, `data-guidance-key`, `tabIndex={-1}` on the `h2`), `NCDetailClient` correctly removes all deprecated tokens (`NC_INFO_NOTICE_TOKENS`, `NC_URGENT_BADGE_TOKENS`, `waitingGuidance`, `roleHint`, raw `space-y-5`), and all domain rules are satisfied including `React.memo`, `EmptyState` with proper `canAct` values, and conditional `NCRepairDialog` from `deriveGuidance`. All 4 SHOULD criteria are also met. The sole failure is a path discrepancy: the contract specifies the new E2E test at `apps/frontend/tests/e2e/non-conformances/nc-guidance.spec.ts`, but the file was delivered at `apps/frontend/tests/e2e/features/non-conformances/nc-guidance.spec.ts` — a location that is consistent with the project's existing test layout, but does not match the contract's stated Scope.
