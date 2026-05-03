# Contract: disposal-opinion-comment-zod-min10-defense-closure

## Scope

Close stale tracker item `disposal-opinion-comment-zod-min10-defense` by verification only.

## MUST

- `reviewDisposalSchema.opinion` MUST use `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH` with `.trim().min(...)`.
- `approveDisposal()` reject branch MUST fail-close in the service layer with `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`.
- The reject branch fail-close MUST use `ErrorCode.DisposalRejectCommentRequired`.
- Existing focused tests MUST cover both review opinion DTO boundaries and approve reject service fail-close boundaries.
- No product behavior changes are required for this closure beyond already-present code.

## Verification

- Run `pnpm --filter backend test -- disposal.service.spec.ts`.
- Run `pnpm --filter backend run type-check`.
- Harness evaluator must return PASS before moving this contract to `completed/`.
