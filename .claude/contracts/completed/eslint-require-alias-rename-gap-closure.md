# Contract: eslint-require-alias-rename-gap-closure

## Scope

Close stale tracker item `eslint-require-alias-rename-gap` by verification.

## MUST

- Backend ESLint config MUST block destructuring `randomUUID` from `require('node:crypto')` or `require('crypto')`, including alias patterns.
- Backend source/test code MUST NOT contain an active `const { randomUUID: alias } = require('node:crypto'|'crypto')` bypass.
- Existing identifier SSOT exception files may keep their documented direct `node:crypto` access.
- No product behavior changes are required for this closure beyond already-present lint policy.

## Verification

- Inspect `apps/backend/.eslintrc.js`.
- Search backend source/tests for `require(...)` and `randomUUID` bypass patterns.
- Run backend type-check.
- Harness evaluator must return PASS before moving this contract to `completed/`.
