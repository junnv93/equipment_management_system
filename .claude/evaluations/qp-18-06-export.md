# Evaluation: qp-18-06-export

Date: 2026-04-07
Branch: feat/qp-18-06-export
Verdict: **ALL MUST PASS**

## MUST Criteria

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | backend tsc --noEmit | PASS | exit 0, no output |
| 2 | backend build | PASS | `nest build` exit 0 |
| 3 | backend tests | PASS | 38 suites / 473 tests passed |
| 4 | frontend tsc --noEmit | PASS | exit 0, no output |
| 5 | Catalog implemented:true | PASS | form-catalog.ts:69-76 `'UL-QP-18-06'` block, line 74 `implemented: true` |
| 6 | exporters map registered + exportCheckout method | PASS | form-template-export.service.ts:116 map entry; :702 method def |
| 7 | exportCheckout private async exists | PASS | line 702 `private async exportCheckout(` |
| 8 | DB joins (checkouts/checkoutItems/conditionChecks/sequenceNumber/quantity + users x2) | PASS | imports L24,29; checkouts L717-718; checkoutItems L731,740-743; sequenceNumber L731,743,803; quantity L732,815; conditionChecks L756-757; users select L761-763 (requester) + L769-771 (approver) = 2 |
| 9 | formatQp1806Date helper | PASS | def L692; called L787, L825 (≥2) |
| 10 | No new .ts files | PASS | `git diff --name-status` has 0 'A' entries; no untracked non-.claude files |
| 11 | insertDocxSignature reuse + '(서명)' fallback | PASS | 4 calls in exportCheckout (L834,842,852,860); '(서명)' L840,848,858,866 |
| 12 | E2E assertion flipped (no 501; wordprocessingml x2) | PASS | wf-20b spec: 0 hits for `toBe(501)`; `wordprocessingml.document` at L64 + L90 (=2); `UL-QP-18-06` at L84 |
| 13 | reports.controller.ts unchanged | PASS | `git diff` lines = 0 |
| 14 | No CAS/cache additions | PASS | grep `CacheInvalidationHelper\|\.version` = 0 hits in service file |

## SHOULD Criteria

| Criterion | Result | Notes |
|---|---|---|
| review-architecture critical 0 | not run | code structure consistent with existing exporter patterns |
| verify-ssot | PASS (spot) | uses `FORM_CATALOG`, db schema imports from `@equipment-management/db/schema/*` |
| verify-sql-safety | PASS (spot) | items query is single innerJoin (no per-row equipment fetch) |
| Surgical changes | PARTIAL | service +192, spec +30, catalog 1 line — within scope. Note: working tree also has unrelated edits to `.claude/skills/verify-design-tokens/SKILL.md` and `references/step-details.md`. These are NOT part of the qp-18-06-export change scope and should be excluded from the commit (or moved to a separate branch). Does not block MUST. |
| e2e single spec passing | not run | not required by MUST |

## Out-of-Scope Drift (advisory only)

Working tree contains modifications to:
- `.claude/skills/verify-design-tokens/SKILL.md`
- `.claude/skills/verify-design-tokens/references/step-details.md`

These are unrelated to QP-18-06 export. Recommend `git restore` or stash before commit, per Surgical Changes guideline.

## Repair Instructions

None — proceed to commit step. Stage only:
- `apps/backend/src/modules/reports/form-template-export.service.ts`
- `apps/frontend/tests/e2e/workflows/wf-20b-self-inspection-export.spec.ts`
- `packages/shared-constants/src/form-catalog.ts`
