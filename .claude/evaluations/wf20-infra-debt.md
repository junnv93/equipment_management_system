# Evaluation: wf20-infra-debt
Date: 2026-04-08
Iteration: 1
Verdict: PASS

## MUST Criteria
| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | tsc --noEmit 0 error | PASS | Generator: EXIT 0 |
| 2 | frontend lint 0 on touched | PASS | ESLint clean on SelfInspectionTab.tsx (e2e gitignored) |
| 3 | frontend unit tests 0 fail | PASS | 99 passed |
| 4 | backend unit tests 0 fail | PASS | 486 passed |
| 5 | WF-20 spec: no `force: true`, no `window.scrollBy` | PASS | grep 0 matches in spec file |
| 6 | `.first()` toast usage via helper | PASS | All toast asserts use `expectToastVisible`; remaining `.first()` usages are structural row/button narrowing |
| 7 | ko+en i18n 3 keys w/ `{date}` placeholder | PASS | ko:340-342 ("{date} 자체점검 기록 …"), en:340-342 ("… from {date}") |
| 8 | SelfInspectionTab 3 row buttons have dynamic aria-label | PASS | Lines 229, 243, 257 — all use `t('selfInspection.actions.*AriaLabel', { date: ... })` |
| 9 | Helpers in shared/helpers/ with JSDoc | PASS | sticky-helpers.ts + toast-helpers.ts both carry block JSDoc and `@example`; re-exported via index.ts |
| 10 | example-prompts.md #4 archived w/ note | PASS | Line 118 archive note referencing verification.ts:268-272 and seed-test-new.ts:103 |
| 11 | No magic numbers in helpers (sticky reads CSS var) | PASS | sticky-helpers reads `--sticky-header-height` via getComputedStyle; only named const is `STICKY_CLEARANCE_PX = 12` (documented clearance buffer) |
| 12 | SSOT: aria-label in i18n, no inline Korean | PASS | Component uses `t(...)`; no inline Korean literals on the 3 buttons |

## Issues Found
(none)

## Notes
- sticky-helpers: calls `locator.click()` without `{ force: true }` as required. Uses `window.scrollBy` INSIDE the helper (page.evaluate), which is correct — contract bans magic-number scrollBy in the spec, not the helper implementation.
- toast-helpers: filters strictly to `li[role="status"]`, does NOT touch Toaster component. SR mirror preserved.
- WF-20 spec `.first()` remaining usages (line 79, 171, 198, 210, 229) are all structural (combobox filter after text mutation, row button narrowing, status text) — permitted by MUST #6.
- Helper re-exports present in index.ts (lines 5-6); spec imports via barrel `'../shared/helpers'` resolve correctly.
- SHOULD criteria (actual e2e run) not executed — best-effort per contract.
