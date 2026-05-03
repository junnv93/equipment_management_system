# Evaluation Report: user-error-mapper-routing

## Verdict

PASS

## Contract Status

| Criterion | Verdict | Evidence |
|-----------|---------|----------|
| `mapBackendErrorCode()` goes through `USER_ERROR_I18N_KEYS` | PASS | `apps/frontend/lib/errors/user-errors.ts:44` returns `USER_ERROR_I18N_KEYS[normalizedCode] ?? 'UNKNOWN_ERROR'`. |
| Existing public API is preserved: `mapBackendErrorCode(code?: string): string` | PASS | Signature remains `export function mapBackendErrorCode(code?: string): string`. |
| Unknown/undefined fallback remains `'UNKNOWN_ERROR'` | PASS | `!code` returns `'UNKNOWN_ERROR'`; unknown normalized codes fall back with nullish coalescing. Focused tests assert both undefined and unknown custom code. |
| `mapUserErrorToToast()` keeps i18n toast routing | PASS | Known user error codes route title through `t('errors.title')` and description through `t(USER_ERROR_I18N_KEYS[errorCode]!)`; focused test covers `UserCannotChangeOwnRole`. |
| Focused frontend tests PASS | PASS | `pnpm --filter frontend test -- user-errors.test.ts` passed: 1 suite, 4 tests. |
| Frontend type-check PASS | PASS | `pnpm --filter frontend type-check` exited 0. |
| verify-implementation target static checks PASS | PASS | Scoped verify-ssot, verify-hardcoding, and verify-i18n checks found no blocker in the two target files. |

## Mechanical Checks

```bash
rg -n "function mapBackendErrorCode|USER_ERROR_I18N_KEYS\[normalizedCode\]|UNKNOWN_ERROR" apps/frontend/lib/errors/user-errors.ts apps/frontend/lib/errors/__tests__/user-errors.test.ts
```

PASS. Required function, shared lookup, and fallback literals are present.

```bash
pnpm --filter frontend test -- user-errors.test.ts
```

PASS. 1 test suite passed, 4 tests passed.

```bash
pnpm --filter frontend type-check
```

PASS. `tsc --noEmit` exited 0.

## Verify-Implementation Notes

- verify-ssot: PASS. Backend-owned user error codes are imported from `@equipment-management/schemas` as `ErrorCode`; the user mapper table uses `ErrorCode.*` computed keys rather than duplicate backend string constants.
- verify-hardcoding: PASS. The remaining string literals in scope are translation keys and the contract-required compatibility fallback `'UNKNOWN_ERROR'`; tests assert public behavior rather than introducing a second routing table.
- verify-i18n: PASS. User-facing known errors route through `users` namespace i18n keys (`errors.*`), and matching keys exist in `apps/frontend/messages/en/users.json` and `apps/frontend/messages/ko/users.json`.

## Repair Instructions

None. No MUST criteria failed.

## Residual Risk

Focused evaluation only. I did not modify or evaluate `team-errors.ts` / `notification-errors.ts` beyond noting the contract lists them as SHOULD follow-up candidates.
