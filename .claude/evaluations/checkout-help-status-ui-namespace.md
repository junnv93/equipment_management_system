# Evaluation: checkout-help-status-ui-namespace

## Verdict

PASS — non-enum help statuses were moved to `help.statusUi`, leaving `help.status` aligned with `CheckoutStatusValues`.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `help.status` enum-only | PASS | `checkout-help-status-messages.test.ts` compares `Object.keys(messages.help.status)` with `Object.values(CheckoutStatusValues)`. |
| UI-only keys separated | PASS | `completed` and `return_rejected` now live under `help.statusUi` in ko/en checkout messages. |
| Locale alignment | PASS | The same test covers both `messages/ko/checkouts.json` and `messages/en/checkouts.json`. |
| Runtime behavior unchanged | PASS | `CheckoutStatusBadge` still reads `help.status.${status}.description` for typed checkout statuses only. |

## Verification

- `pnpm --filter frontend test -- checkout-help-status-messages.test.ts`
- `pnpm --filter frontend run type-check`
