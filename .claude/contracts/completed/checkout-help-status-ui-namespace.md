# Contract: checkout-help-status-ui-namespace

## Scope

Close tech-debt item `help.status.completed / help.status.return_rejected`.

## MUST

- `checkouts.help.status` must contain only real `CheckoutStatusValues` keys.
- UI-only or legacy display states must be moved out of the enum tooltip namespace.
- Korean and English checkout messages must remain aligned.
- Focused regression coverage must prevent non-enum keys from being reintroduced under `help.status`.

## SHOULD

- Avoid changing `CheckoutStatusBadge` runtime behavior; it already receives typed checkout statuses.
