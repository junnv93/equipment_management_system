# bulk-action-bar-wrapper-dedup-verification

## Scope

Resolve the stale `BulkActionBar` dedup debt by verifying the current implementation boundary.

## MUST

- Confirm `components/common/BulkActionBar.tsx` is the generic SSOT for selection UI.
- Confirm `components/approvals/BulkActionBar.tsx` imports the common component and only owns approval-specific behavior.
- Do not collapse domain dialogs and approval-specific fixed positioning into the generic component.

## SHOULD

- Treat the approvals file as a wrapper, not a duplicate implementation, when it delegates checkbox/count/clear/actions-slot layout to the common component.

## Verification

- Static inspection:
  - `apps/frontend/components/common/BulkActionBar.tsx`
  - `apps/frontend/components/approvals/BulkActionBar.tsx`
  - BulkActionBar import/callsite search
