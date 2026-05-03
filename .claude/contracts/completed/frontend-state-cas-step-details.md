# Contract: frontend-state-cas-step-details

## Scope

Close tech-debt item `frontend-state-cas-step-details`.

## MUST

- `verify-frontend-state/SKILL.md` no longer contains the full Step 39/40 bash commands and long code examples inline.
- `verify-frontend-state/references/step-details.md` contains the detailed Step 39/40 guidance.
- The main SKILL still mentions Step 39 and Step 40 and points readers to `references/step-details.md`.
- Existing Step 39/40 semantics are preserved: mutation version forwarding, `useCasGuardedMutation`, and 2-step confirm pre-version recheck.

## SHOULD

- Keep changes scoped to verify-frontend-state documentation and harness bookkeeping.
