# Contract: approval-detail-modal-mobile-fullscreen

## Scope

Close tech-debt item `mobile-detail-modal-fullscreen`.

## MUST

- `ApprovalDetailModal` must render as a fullscreen dialog below the `sm` breakpoint.
- The centered desktop/tablet modal layout must be preserved at `sm` and above.
- Modal body content must remain scrollable within the fullscreen layout.
- A focused regression test must pin the responsive token contract.

## SHOULD

- Keep responsive layout classes in the approval detail modal design-token SSOT.
