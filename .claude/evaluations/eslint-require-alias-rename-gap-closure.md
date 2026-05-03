# Evaluation: eslint-require-alias-rename-gap-closure

Result: PASS

## Evidence

- Inspected `apps/backend/.eslintrc.js`.
- Global `no-restricted-syntax` includes a CommonJS destructuring guard for `require('node:crypto')` and `require('crypto')`:
  - `VariableDeclarator[init.type='CallExpression'][init.callee.name='require'][init.arguments.0.value=/^(node:crypto|crypto)$/] Property[key.name='randomUUID']`
- Controller override also includes the same selector. This is required because the controller override replaces the global `no-restricted-syntax` rule array.
- The selector blocks both direct and alias destructuring because it matches the object property key `randomUUID`, including patterns like:
  - `const { randomUUID } = require('node:crypto')`
  - `const { randomUUID: alias } = require('crypto')`

## Searches

- `rg -n "const\s*\{[^}]*randomUUID\s*:|const\s*\{[^}]*randomUUID[^}]*\}\s*=\s*require\(['\"](?:node:crypto|crypto)['\"]\)" apps/backend --glob '!node_modules'`
  - No matches.
- `rg -n "require\(['\"](?:node:crypto|crypto)['\"]\)|randomUUID" apps/backend --glob '!node_modules' --glob '!dist'`
  - Matches only the documented identifier SSOT implementation and its test mock:
    - `apps/backend/src/common/identifiers/identifier.service.ts`
    - `apps/backend/src/common/identifiers/identifier.service.spec.ts`

## Verification

- `pnpm --filter backend run type-check`
  - Passed.

## Conclusion

PASS. The backend ESLint policy closes the CommonJS `randomUUID` alias destructuring gap, including controller files, and no active backend source/test bypass was found outside documented identifier SSOT exceptions.
