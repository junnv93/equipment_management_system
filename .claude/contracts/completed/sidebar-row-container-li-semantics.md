# Contract: sidebar-row-container-li-semantics

## Scope

Close stale tech-debt item `sidebar-row-container-li-semantics`.

## MUST

- Desktop sidebar nav items must be rendered inside a nav-contained `<ul>`.
- Each desktop sidebar nav item must be wrapped in an `<li>`.
- The rendered list must preserve `NavRowWithSecondaryAction` behavior.
- Existing evidence must show this item is already satisfied.

## SHOULD

- Avoid runtime code changes when current implementation already satisfies the contract.
