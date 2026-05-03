# Contract: harness-contract-collateral-exceptions

## Scope

Close tracker items:

- `harness-contract-M1-extra-claude-files`
- `harness-contract-M9-prettier-collateral`

## MUST

- Project harness rules MUST document how `.claude/` planner/contract/evaluation artifacts are treated when a domain change commit also includes harness artifacts.
- Project harness rules MUST prefer separate `chore(harness)` commits for planner artifacts when feasible.
- Project harness rules MUST document that PostToolUse Prettier collateral can be exempt from surgical scope only when it is formatting-only, explicitly listed, and verified as no semantic change.
- The tracker MUST mark both items complete with the contract/evaluation slug.

## Verification

- Inspect `.claude/PROJECT_RULES.md`.
- Inspect tracker rows.
