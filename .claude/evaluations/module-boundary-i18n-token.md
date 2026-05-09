# Evaluation: module-boundary-i18n-token

**Date**: 2026-05-09
**Iteration**: 1
**Evaluator**: sonnet

## Build Status

| Check | Result |
|-------|--------|
| frontend tsc --noEmit | PASS |
| backend tsc --noEmit | PASS |

## Contract Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M-1 | `tsc --noEmit` passes (frontend) | PASS | `pnpm --filter frontend exec tsc --noEmit` — 0 errors, no output |
| M-2 | `tsc --noEmit` passes (backend) | PASS | `pnpm --filter backend exec tsc --noEmit` — 0 errors, no output |
| M-3 | `en/checkouts.json` overdueClear.title = `"No overdue items"` | PASS | `grep -c '"No overdue items"'` = 1 |
| M-4 | `CHECKOUT_PURPOSE_TOKENS.return_to_vendor.badge` contains `brand-temporary`; verification grep `'temporary'` should yield 4 lines | FAIL | `grep -n "'temporary'" ... \| grep -v '//'` returns 2 lines (141, 163 only). Lines 140 and 881 use `bg-brand-temporary` without the single-quoted `'temporary'` token, so they do not match. Contract states 4 lines; actual count = 2. |
| M-5 | `CHECKOUT_ROW_TOKENS.colorBar.return_to_vendor` uses `temporary` | PASS | `grep -c "getSemanticLeftBorderClasses('temporary')"` = 2 (≥ 2) |
| M-6 | `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` = `'bg-brand-temporary'` | PASS | `grep -c "bg-brand-temporary"` = 2 (≥ 2) |
| M-7 | `return_to_vendor` purposeBar no neutral fallback leak | PASS | `awk '/purposeBar: \{/,/\} satisfies/' ... \| grep "return_to_vendor.*neutral"` — 0 lines |
| M-8 | Both module files have forwardRef architectural JSDoc | PASS | `grep -c "forwardRef — 진정한 양방향"` = 1 in `checkouts.module.ts` AND 1 in `equipment-imports.module.ts` |
| M-9 | tech-debt-tracker.md items marked complete | PASS | `grep` on all 3 slugs shows `[x]` on lines 55, 57, 59; `grep ... \| grep "\[ \]"` = 0 lines |
| M-10 | Backend unit tests pass | FAIL | `pnpm --filter backend exec jest --passWithNoTests` — 8 FAIL in `disposal.service.spec.ts` (135 passed, 1 failed suite; 1681 passed, 8 failed tests) |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S-1 | ko/en checkouts.json overdueClear description parity | PASS | ko: `"현재 기한이 초과된 반출 건이 없습니다"`, en: `"All checkouts are within their return dates"` — both meaningful and semantically congruent |
| S-2 | `temporary` color JSDoc reason comment in checkout.ts return_to_vendor section | PASS | Line 138: `// temporary(cyan): 업체에서 임시 대여한 장비를 반납하는 흐름 — "temporary loan ending"` present above return_to_vendor block |

## Issues Found

### M-4 FAIL — Verification grep produces 2 lines, not 4

**Contract states**: `grep -n "'temporary'" apps/frontend/lib/design-tokens/components/checkout.ts | grep -v '//'` — "4개 라인 (badge:140, colorBar:141, CHECKOUT_ROW_TOKENS:163, purposeBar:881)"

**Actual output**:
```
141:    colorBar: getSemanticLeftBorderClasses('temporary'),
163:    return_to_vendor: getSemanticLeftBorderClasses('temporary'),
```

Lines 140 and 881 do NOT contain the literal string `'temporary'` in single quotes:
- Line 140: `badge: 'bg-brand-temporary/10 text-brand-temporary border-brand-temporary/20'` — uses `bg-brand-temporary`, not `'temporary'`
- Line 881: `return_to_vendor: 'bg-brand-temporary'` — uses `bg-brand-temporary`, not `'temporary'`

The substantive criterion (badge contains brand-temporary) is satisfied — line 140 has `bg-brand-temporary`. However, the stated verification command produces 2 lines, not the required 4. Per contract grading rules, this is a criterion FAIL.

---

### M-10 FAIL — 8 backend unit tests failing in disposal.service.spec.ts

**File**: `apps/backend/src/modules/equipment/__tests__/disposal.service.spec.ts`

**Test suite**: `DisposalService — defense-in-depth boundary matrix`

**8 failing tests** (all throwing `ReferenceError` instead of `BadRequestException`):

Opinion validation failures (3 tests):
- `rejects opinion empty`
- `rejects opinion whitespace only 10 chars`
- `rejects opinion 9 chars`

Service layer fail-close failures (5 tests):
- `fail-close undefined opinion — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED`
- `fail-close empty string — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED`
- `fail-close whitespace only 10 chars — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED`
- `fail-close 9 chars — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED`
- `fail-close whitespace + 9 chars (trim 후 below min) — throws BadRequestException with code DISPOSAL_REJECT_COMMENT_REQUIRED`

**Representative error** (from stack trace at `disposal.service.spec.ts:228:21`):
```
Expected constructor: BadRequestException
Received constructor: ReferenceError
```

These failures are pre-existing (not introduced by this sprint — they appear in `disposal.service.spec.ts` which relates to the 2026-05-08 disposal-zod SHOULD residual noted in tech-debt-tracker.md). However, M-10 requires backend tests to pass, and they do not.

**Test summary**: Test Suites: 1 failed (135 passed), 136 total. Tests: 8 failed (1681 passed), 1689 total.

## Verdict

**FAIL**

Reason: Two MUST criteria fail. M-4 verification command produces 2 matching lines instead of the required 4 (the badge and purposeBar entries use `bg-brand-temporary` not the literal token `'temporary'`). M-10 backend unit tests fail with 8 test failures in `disposal.service.spec.ts` — tests expect `BadRequestException` but receive `ReferenceError`, indicating a pre-existing regression unrelated to this sprint but blocking the backend test gate.

---

# Evaluation: module-boundary-i18n-token

**Date**: 2026-05-09
**Iteration**: 2
**Evaluator**: sonnet

## Contract Changes from Iter 1

- **M-4 updated**: verification command changed from `grep -n "'temporary'"` (single-token only) to `grep -n "brand-temporary\|'temporary'"` (OR pattern) — now matches both `bg-brand-temporary` and `'temporary'` forms; threshold remains 4 lines.
- **M-10 updated**: scope narrowed from full backend suite to `apps/backend/src/modules/checkouts/ apps/backend/src/modules/equipment-imports/` only with `--passWithNoTests`; disposal failures explicitly acknowledged as pre-existing from another session's uncommitted changes.

## Build Status

| Check | Result |
|-------|--------|
| frontend tsc --noEmit | PASS |
| backend tsc --noEmit | PASS |

## Contract Criteria

| # | Criterion | Verdict | Evidence |
|---|-----------|---------|---------|
| M-1 | `tsc --noEmit` passes (frontend) | PASS | `pnpm --filter frontend exec tsc --noEmit` — 0 errors, no output |
| M-2 | `tsc --noEmit` passes (backend) | PASS | `pnpm --filter backend exec tsc --noEmit` — 0 errors, no output |
| M-3 | `en/checkouts.json` overdueClear.title = `"No overdue items"` | PASS | `grep -c '"No overdue items"'` = 1 (≥ 1) |
| M-4 | `CHECKOUT_PURPOSE_TOKENS.return_to_vendor.badge` contains `brand-temporary` (updated grep) | PASS | `grep -n "brand-temporary\|'temporary'" checkout.ts \| grep -v '//'` → 4 lines: 140 (badge `bg-brand-temporary/10 …`), 141 (colorBar `getSemanticLeftBorderClasses('temporary')`), 163 (CHECKOUT_ROW_TOKENS `getSemanticLeftBorderClasses('temporary')`), 881 (purposeBar `'bg-brand-temporary'`) — exactly 4 lines (≥ 4) |
| M-5 | `CHECKOUT_ROW_TOKENS.colorBar.return_to_vendor` uses `temporary` | PASS | `grep -c "getSemanticLeftBorderClasses('temporary')"` = 2 (≥ 2) |
| M-6 | `CHECKOUT_ITEM_ROW_TOKENS.purposeBar.return_to_vendor` = `'bg-brand-temporary'` | PASS | `grep -c "bg-brand-temporary"` = 2 (≥ 2) |
| M-7 | `return_to_vendor` purposeBar no neutral fallback leak | PASS | `awk '/purposeBar: \{/,/\} satisfies/' … \| grep "return_to_vendor.*neutral"` — 0 lines |
| M-8 | Both module files have forwardRef architectural JSDoc | PASS | `grep -c "forwardRef — 진정한 양방향"` = 1 in `checkouts.module.ts` AND 1 in `equipment-imports.module.ts` |
| M-9 | tech-debt-tracker.md items marked complete | PASS | Lines 55, 57, 59 all show `[x]`; `grep … \| grep "\[ \]"` = 0 lines |
| M-10 | Changed-scope backend tests pass (checkouts + equipment-imports only) | PASS | `pnpm --filter backend exec jest apps/backend/src/modules/checkouts/ apps/backend/src/modules/equipment-imports/ --passWithNoTests` → Test Suites: 17 passed, 17 total; Tests: 196 passed, 196 total. Disposal failures excluded per updated scope. |

## SHOULD Criteria

| # | Criterion | Verdict | Notes |
|---|-----------|---------|-------|
| S-1 | ko/en checkouts.json overdueClear description parity | PASS | (unchanged from iter 1) ko: `"현재 기한이 초과된 반출 건이 없습니다"`, en: `"All checkouts are within their return dates"` — both meaningful and semantically congruent |
| S-2 | `temporary` color JSDoc reason comment in checkout.ts return_to_vendor section | PASS | (unchanged from iter 1) Line 138 present |

## Issues Found

None. All M-1 through M-10 criteria satisfied with updated verification commands.

## Verdict

**PASS**

All 10 MUST criteria pass under the updated contract. M-4 now correctly captures all four `brand-temporary`/`'temporary'` occurrences (badge at line 140, colorBar at 141, CHECKOUT_ROW_TOKENS at 163, purposeBar at 881) using the broadened OR-pattern grep. M-10 is satisfied with 196/196 tests passing across 17 suites in the `checkouts` and `equipment-imports` modules; disposal failures are correctly excluded as pre-existing from another session's uncommitted changes to `disposal.dto.ts` / `disposal.service.ts`.
