# Contract: checkout-zone2-status-truncate-closure

## Scope

Close stale tech-debt item `zone2-status-text-truncate`.

## MUST

- Checkout row Zone 2 must constrain the status/D-day column to the intended fixed width.
- The status badge rendered in Zone 2 must include truncation classes for long labels.
- Closure must be evidence-only if current code already satisfies the item.

## SHOULD

- Avoid runtime code changes when current implementation already satisfies the contract.
