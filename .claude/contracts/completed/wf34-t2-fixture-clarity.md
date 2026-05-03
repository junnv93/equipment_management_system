# Contract: wf34-t2-fixture-clarity

## Scope

Close tech-debt item `T2 fixture 의도 불명확` in WF-34 E2E.

## MUST

- WF-34 T2 must not imply lender TM authentication through the fixture name.
- T2 must continue to authenticate the borrower TM through `getBackendTokenByEmail`.
- The workflow spec must remain TypeScript-valid.

## SHOULD

- Keep the change limited to fixture clarity; do not alter workflow semantics.
