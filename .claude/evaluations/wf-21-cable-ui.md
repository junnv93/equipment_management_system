---
slug: wf-21-cable-ui
mode: 1
iteration: 1
verdict: PASS
evaluated_at: 2026-04-08
---

# Evaluation — WF-21 Cable Path Loss UI Spec

## Verdict: PASS

## MUST Criteria
| # | Criterion | Result | Evidence |
|---|-----------|--------|----------|
| M1 | Only new spec file added | PASS | `git status` shows only `.claude/contracts/wf-21-cable-ui.md` + `apps/frontend/tests/e2e/workflows/wf-21-cable-ui.spec.ts` as new; `next-env.d.ts` / `tsconfig.tsbuildinfo` are pre-existing modified files unrelated to this task. No production `.tsx` touched. |
| M2 | tsc --noEmit exit 0 | PASS | Pre-run reported exit 0. |
| M3 | Playwright spec passes | PASS | 14 passed / 0 failed / 34.1s. |
| M4 | Management number slot isolated from API spec | PASS | API spec: `Date.now() % 1000`; UI spec: `(Date.now() + 333) % 1000`. Non-overlapping slots; even if Date.now aligns, +333 offset produces distinct modulo values. |
| M5 | Zero CSS selectors | PASS | Grep `page\.locator\(['"][.#]` → 0 hits. Only semantic locators (`getByRole`, `getByText`, `getByPlaceholder`) used. |
| M6 | i18n labels match `messages/ko/cables.json` | PASS | All 17 `L.*` strings verified verbatim: listTitle/createButton/exportButton/searchPlaceholder/mgmtNumberPlaceholder/lengthPlaceholder/createTitle/createSuccess/submitButton/measurementAddButton/measurementFormTitle/measurementSave/measurementSuccess/measurementsTitle/freqPlaceholder/lossPlaceholder — all exact matches (submitButton uses `create.submitButton` "등록", measurementSave uses `measurement.save` "저장"). |
| M7 | No fabricated domain data | PASS | Format `ELLLX-NNN`; dB dummy `0.5`, freq `1000`. No invented form numbers/labels. |
| M8 | 8-step scenario implemented | PASS | 8 `test(...)` blocks matching contract steps 1–8. |
| M9 | cleanupSharedPool in afterAll | PASS | Line 52–54. |

## SHOULD Criteria
- S1 serial `test.describe.configure({ mode: 'serial' })` present — PASS
- S2 Step 3 asserts URL unchanged + `createSuccess` toast has count 0, no assertion on non-existent Korean validation message — PASS (does not fabricate UI)
- S3 Export filename regex `/UL-QP-18-08/` — PASS

## Concerns / Observations
- `getByPlaceholder` used 9 times. Justified: production Labels lack `htmlFor` per contract "Known constraints". `getByPlaceholder` is a semantic Playwright locator, not CSS. Acceptable.
- Step 3 `waitForTimeout(500)` is the only hard-wait. Justified: test must prove absence of navigation/toast, which requires a bounded wait before asserting count 0. Acceptable tradeoff; mild flakiness risk on heavily loaded CI but 14/14 passed in 34s run.
- Serial mode shares `managementNumber` across steps 4→5→6→7; Step 5/6/7 re-enter via search rather than retaining detail URL — correct pattern, avoids cross-step state coupling.
- Step 7 asserts absence of empty-state text rather than concrete row content, avoiding locale/format assumptions — good.

## Recommendations (non-blocking)
- Consider `page.waitForLoadState('networkidle')` instead of `waitForTimeout(500)` in Step 3 for slightly more deterministic negative assertion.
- If production later adds `htmlFor` to labels, migrate `getByPlaceholder` → `getByLabel` for stronger semantics.
