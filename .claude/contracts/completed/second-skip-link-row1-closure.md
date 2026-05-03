# second-skip-link-row1-closure

## Scope

Close the stale dashboard accessibility tracker item for a second skip link to `#dashboard-row1`.

## Acceptance Criteria

- `DashboardShell` renders a second `SkipLink` whose `href` is `#dashboard-row1`.
- The second link uses a localized navigation label instead of hardcoded copy.
- The dashboard row target exists and is programmatically focusable.
- The existing `#main-content` skip link remains unchanged.

## Verification

- `rg -n "SkipLink href=\"#dashboard-row1\"|id=\"dashboard-row1\"|skipToDashboard" apps/frontend`
- Manual source inspection of `DashboardShell.tsx`, `DashboardClient.tsx`, and `messages/{ko,en}/navigation.json`.
