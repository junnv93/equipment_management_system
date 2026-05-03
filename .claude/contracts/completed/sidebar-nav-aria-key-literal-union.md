# Contract: sidebar-nav-aria-key-literal-union

## Scope

Close tech-debt item `filtered-nav-secondary-action-aria-key-literal-union`.

## MUST

- `FilteredNavSecondaryAction.ariaKey` must no longer be a broad `string`.
- `FilteredNavSecondaryAction.primaryAriaKey` must no longer be a broad `string`.
- Static `count-with-action` nav config must use literal navigation i18n key types.
- `NavRowWithSecondaryAction` must call `t()` without casting secondary action keys to `Parameters<typeof t>[0]`.
- Focused frontend test passes.
- Frontend type-check passes.

## SHOULD

- Preserve current checkout secondary action behavior and href generation.
- Avoid changing user-visible navigation copy.
