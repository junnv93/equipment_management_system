# Contract: backfill-inspection-templates-unit-test

## Scope

Close tech-debt item `backfill-script-unit-test`.

## MUST

- `scripts/backfill-inspection-templates.ts` can be imported by unit tests without executing `main()`.
- Unit tests cover option parsing without mutating `process.argv`.
- Unit tests cover dry-run behavior without opening a write transaction.
- Unit tests cover idempotent skip when a current template already exists.
- Unit tests cover transaction rejection/failure reporting.
- Focused backend Jest test passes.
- Backend type-check passes.

## SHOULD

- Keep the production script behavior unchanged when executed directly.
- Avoid changing database schema or runtime backfill semantics.
