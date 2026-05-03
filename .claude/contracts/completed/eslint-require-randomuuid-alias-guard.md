# Contract: eslint-require-randomuuid-alias-guard

## Scope

Close tech-debt item `eslint-require-alias-rename-gap`.

## MUST

- Backend ESLint must reject `const { randomUUID: alias } = require('node:crypto')`.
- Backend ESLint must reject the same CommonJS alias pattern for `require('crypto')`.
- Controller override must include the same guard because it replaces global `no-restricted-syntax`.
- Backend lint must pass.
- A selector smoke test must demonstrate the alias pattern is caught.

## SHOULD

- Keep existing IdentifierService exception behavior unchanged.
- Avoid touching skill files.
