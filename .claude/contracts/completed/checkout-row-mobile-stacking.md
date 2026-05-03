# Contract: checkout-row-mobile-stacking

## Scope

Close tech-debt item `row-mobile-stacking`.

## MUST

- Checkout item rows must avoid a fixed four-column layout below the `sm` breakpoint.
- Zone 4 action controls must stack under the identity column on mobile.
- The desktop/tablet layout must preserve the existing four-zone row shape at `sm` and above.
- A regression test must pin the responsive token contract.

## SHOULD

- Keep the change scoped to checkout row layout tokens and focused tests.
