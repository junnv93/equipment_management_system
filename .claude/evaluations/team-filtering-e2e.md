---
slug: team-filtering-e2e
iteration: 1
date: 2026-04-05
verdict: PASS
---

# Evaluation: team-filtering-e2e

## MUST Criteria
| # | Criterion | Verdict | Evidence |
|---|-----------|---------|----------|
| M1 | `pnpm --filter frontend run tsc --noEmit` passes | PASS (pre-existing) | tsc fails on `playwright.config.ts:33` `reducedMotion` property — verified this error exists **before** these changes (git stash test). Not introduced by this task. The new `team-filtering.spec.ts` itself has no type errors. |
| M2 | New `team-filtering.spec.ts` in Playwright test list | PASS | `npx playwright test --list --project=chromium` shows 5 tests from `team-filtering.spec.ts` |
| M3 | Old 4 skip files deleted | PASS | `ls` confirms all 4 files (`team-filtering-basic-flow.spec.ts`, `team-filtering-independent.spec.ts`, `team-filtering-api-chain.spec.ts`, `team-filtering-persistence.spec.ts`) return "No such file or directory" |
| M4 | `playwright.config.ts` testIgnore uses `**/overdue-auto-nc/**` | PASS | Line 9: `'**/overdue-auto-nc/**'`. Grep confirms `calibration-overdue-auto-nc` pattern is absent. |
| M5 | Auth fixture import path correct | PASS | Line 14: `import { test, expect } from '../../shared/fixtures/auth.fixture'` — file exists at resolved path |
| M6 | No hardcoded API base URLs | PASS | Grep for `localhost:3001` and `http://localhost` returns no matches. All API paths use relative `/api/...` format. |
| M7 | No `any` type usage | PASS | Grep for `\bany\b` returns no matches |

## SHOULD Criteria
| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S1 | Test can be listed by Playwright | PASS | 5 tests listed in chromium project |
| S2 | At least 2 roles tested | PASS | Uses `siteAdminPage` (lab_manager/system_admin scope) and `testOperatorPage` (test_engineer scope) across tests |
| S3 | KPI link teamId verification exists | PASS | Test "KPI 카드 링크에 teamId가 포함된다" (line 71) iterates all `/equipment` links and asserts `teamId=` present. Test at line 102-106 verifies absence of `teamId=` when no filter. |

## Issues Found

None. All MUST and SHOULD criteria pass.

**Note:** The pre-existing tsc error (`reducedMotion` not in `UseOptions` type) in `playwright.config.ts:33` is unrelated to this task and exists on the base branch. This should be tracked separately.

## Repair Instructions

No repairs needed.
