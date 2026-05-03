# Evaluation: i18n-disposal-rename-static-closure

Status: PASS

## Evidence

- Contract inspected: `.claude/contracts/i18n-disposal-rename-static-closure.md`.
- `DisposalRequestDialog.tsx`, `DisposalReviewDialog.tsx`, and `DisposalApprovalDialog.tsx` render `CharsCounter mode="min"` for the request/review/approval rationale or rejection hint.
- Old disposal dialog `common.charCount` usage is absent from `apps/frontend/components/equipment/disposal`.
- `apps/frontend/messages/ko/common.json` defines `common.charCounter.min` as `{min}자 이상 입력해주세요 (현재: {count}자)`.
- `apps/frontend/messages/en/common.json` defines `common.charCounter.min` as `Min {min} characters required (current: {count})`.
- Disposal validation E2E specs assert visible character hint copy for all three flows:
  - request: `06-request-validation.spec.ts` uses `#reasonDetail-hint` and expects `현재: 5자`.
  - review reject: `12-rejection-validation.spec.ts` uses `#opinion-hint` and expects current-length copy before and after valid input.
  - approval reject: `12-rejection-validation.spec.ts` uses `#comment-hint` and expects current-length copy before and after valid input.
- The prior stale selectors `p#reasonDetail-hint`, `p#opinion-hint`, and `p#comment-hint` were replaced with element-agnostic `#...` selectors matching the current `CharsCounter` `span#...` DOM.

## Commands

- `rg -n "p#(reasonDetail-hint|opinion-hint|comment-hint)|locator\\('#(reasonDetail-hint|opinion-hint|comment-hint)'\\)|common\\.charCount|mode=\\\"min\\\"" apps/frontend/components/equipment/disposal apps/frontend/tests/e2e/features/approvals/disposal-requests/validation`
  - PASS: 3 min-mode dialog call sites, 3 current E2E selectors, no stale `p#...` selector, no old `common.charCount` usage.
- `pnpm --filter frontend test -- CharsCounter.test.tsx`
  - PASS: 14 tests passed.
- `pnpm --filter frontend run type-check`
  - PASS.

## Residual Risks

- The full disposal Playwright suite was not executed in this harness pass because it depends on the local e2e environment and seeded auth state. Static coverage plus focused unit/type gates now point at the current DOM and copy path.
- A separate subagent evaluator could not be started after the fix due to the current session usage limit; this evaluation records the local harness evidence that resolves the prior FAIL blocker.
