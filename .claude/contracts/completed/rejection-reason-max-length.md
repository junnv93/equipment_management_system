# rejection-reason-max-length

## Scope

- Close the NC R5 stale debt item for `rejectionReason` max length.
- Use the existing project validation SSOT instead of inventing a new domain limit.

## Acceptance

- `rejectCorrectionSchema.rejectionReason` trims input.
- It enforces `VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH`.
- It enforces `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH`.
- A focused DTO test covers the max-length rejection and expected VM message.

## Verification

- `pnpm --filter backend exec prettier --write src/modules/non-conformances/__tests__/reject-correction.dto.spec.ts`
- `pnpm --filter backend exec eslint src/modules/non-conformances/__tests__/reject-correction.dto.spec.ts src/modules/non-conformances/dto/reject-correction.dto.ts`
- `pnpm --filter backend test -- reject-correction.dto.spec.ts --runInBand`
