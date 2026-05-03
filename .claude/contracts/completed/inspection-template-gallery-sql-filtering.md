# Contract: inspection-template-gallery-sql-filtering

## Scope

Close tech-debt item `gallery-query-sql-side-filtering`.

## MUST

- `findGallery()` must avoid fetching every active template when no matching criteria are present.
- `findGallery()` must push model/classification matching into SQL `WHERE`.
- `findGallery()` must preserve modelName priority over classificationCode.
- `findGallery()` must apply DB-level limit.
- Focused backend service tests pass.
- Backend type-check passes.

## SHOULD

- Keep gallery response shape unchanged.
- Avoid schema changes.
