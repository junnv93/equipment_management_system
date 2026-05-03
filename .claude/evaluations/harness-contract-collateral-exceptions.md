# Evaluation: harness-contract-collateral-exceptions

Status: PASS

## Evidence

- `.claude/PROJECT_RULES.md` now has `Harness 계약/커밋 범위 예외`.
- The rule prefers separate `chore(harness)` commits for `.claude/` planner/contract/evaluation artifacts.
- The rule requires same-commit `.claude/` artifacts to be listed as `harness collateral` and separated from domain file scope.
- The rule allows PostToolUse Prettier M9 exceptions only for formatting-only diffs that are explicitly listed in the evaluation.
- The rule states semantic changes beyond import ordering, whitespace, or wrapping still count as normal domain changes.

## Verification

- Inspected `.claude/PROJECT_RULES.md`.
- Tracker rows updated for `harness-contract-M1-extra-claude-files` and `harness-contract-M9-prettier-collateral`.

## Residual Risks

- This is a workflow-rule closure. It cannot retroactively split historical commits, but it prevents the same ambiguity in future harness contracts.
