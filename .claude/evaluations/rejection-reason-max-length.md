# rejection-reason-max-length Evaluation

## Result

PASS

## Evidence

- `apps/backend/src/modules/non-conformances/dto/reject-correction.dto.ts` already enforces:
  - `.trim()`
  - `.min(VALIDATION_RULES.REJECTION_REASON_MIN_LENGTH, VM.string.min(...))`
  - `.max(VALIDATION_RULES.LONG_TEXT_MAX_LENGTH, VM.string.max(...))`
- Added max-length regression coverage to `apps/backend/src/modules/non-conformances/__tests__/reject-correction.dto.spec.ts`.
- Test asserts `VALIDATION_RULES.LONG_TEXT_MAX_LENGTH + 1` fails with `VM.string.max('반려 사유', VALIDATION_RULES.LONG_TEXT_MAX_LENGTH)`.

## Commands

- `pnpm --filter backend exec prettier --write src/modules/non-conformances/__tests__/reject-correction.dto.spec.ts`
- `pnpm --filter backend exec eslint src/modules/non-conformances/__tests__/reject-correction.dto.spec.ts src/modules/non-conformances/dto/reject-correction.dto.ts`
- `pnpm --filter backend test -- reject-correction.dto.spec.ts --runInBand`
