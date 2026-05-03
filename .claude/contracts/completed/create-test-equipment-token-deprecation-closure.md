# Contract: create-test-equipment-token-deprecation-closure

## Scope

Close stale tracker item `createTestEquipment-token-인자-deprecation-cleanup` by verification.

## MUST

- `createTestEquipment` signature MUST be `createTestEquipment(app, overrides?)` with no token argument.
- The helper MUST internally create equipment with the setup-only `systemAdmin` token.
- All `createTestEquipment(...)` call sites under `apps/backend/test` MUST use the simplified signature and MUST NOT pass an auth token.
- No product behavior changes are required for this closure beyond already-present code.

## Verification

- Search helper definition and call sites with `rg`.
- Run backend type-check.
- Harness evaluator must return PASS before moving this contract to `completed/`.
