# Evaluation: eslint-require-randomuuid-alias-guard

## Verdict

PASS — all MUST criteria satisfied.

## Contract Criteria

| Criterion | Verdict | Evidence |
|---|---|---|
| `require('node:crypto')` alias rejected | PASS | `apps/backend/.eslintrc.js` adds a `VariableDeclarator ... require ... Property[key.name='randomUUID']` selector covering `node:crypto`. |
| `require('crypto')` alias rejected | PASS | The same selector uses `/^(node:crypto|crypto)$/`. |
| Controller override covered | PASS | The selector is repeated in the `**/*.controller.ts` override where global `no-restricted-syntax` is replaced. |
| Backend lint passes | PASS | `pnpm --filter backend run lint` -> PASS after adding an explicit return type to the existing backfill script test helper. |
| Selector smoke test passes | PASS | ESLint `Linter` sample `const { randomUUID: rid } = require('node:crypto')` produced `blocked randomUUID require alias` and exit 0. |

## Notes

`src/common/identifiers/identifier.service.ts` remains the configured exception for the IdentifierService SSOT definition file.
