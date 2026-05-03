# emptystate-3-file-dedup

## Status

Completed on 2026-05-03.

## Scope

- Deduplicate the repeated EmptyState root/icon/title/description/actions markup that had existed across:
  - `apps/frontend/components/dashboard/atoms/EmptyState.tsx`
  - `apps/frontend/components/shared/EmptyState.tsx`
  - `apps/frontend/components/checkouts/CheckoutEmptyState.tsx`
- Preserve domain-specific behavior:
  - dashboard variants keep compact sizing, computed role, and primary/secondary link/button actions.
  - shared EmptyState keeps design-token styling, permission-gated primary action visibility, and optional test id.
  - checkout EmptyState keeps variant-driven icons, network/offline alert behavior, no-permission role label, retry secondary action synthesis, and stable `empty-state-${variant}` test id.

## Acceptance Criteria

- A shared component owns the common EmptyState layout structure.
- Existing public props remain source-compatible.
- Existing role/aria-live/test id behavior remains equivalent.
- Dashboard callers no longer depend on a separate dashboard-only EmptyState implementation.
- Frontend lint passes for touched files.
- Frontend type-check passes.

## Implementation Notes

- Added `components/shared/EmptyStateLayout.tsx` as a layout-only primitive.
- Extended `components/shared/EmptyState.tsx` to cover optional default icons, role/aria overrides, href secondary actions, disabled primary actions, and domain icon-class overrides.
- Migrated `components/checkouts/CheckoutEmptyState.tsx` to compose `components/shared/EmptyState.tsx` instead of duplicating action/layout markup.
- Migrated dashboard callers to `components/shared/EmptyState.tsx` and removed `components/dashboard/atoms/EmptyState.tsx`.
- Added the missing `id="offline-reason"` target for the checkout network offline button `aria-describedby`.
