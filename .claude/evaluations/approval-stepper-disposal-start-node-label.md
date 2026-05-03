# Evaluation: approval-stepper-disposal-start-node-label

## Verdict

PASS — disposal approval steppers now render a disposal-only start-node micro label.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| Disposal start marker | PASS | `ApprovalStepIndicator` renders `▸` only when `type === 'disposal' && index === 0`. |
| Plan flow unchanged | PASS | `ApprovalStepIndicator.test.tsx` rerenders `calibration_plan` and asserts `▸` is absent. |
| SR label preserved | PASS | The first node still has `aria-label={t('steps.startNodeLabel')}`. |
| Tokenized styling | PASS | Visual marker classes live in `APPROVAL_STEPPER_TOKENS.startNodeLabel.visual`. |

## Verification

- `pnpm --filter frontend test -- ApprovalStepIndicator.test.tsx`
- `pnpm --filter frontend run type-check`
