# Contract: i18n-disposal-rename-static-closure

## Scope

Close tracker item `i18n-disposal-rename-e2e-snapshot` when the old copy path is no longer present and current static/e2e coverage proves the minimum character hint copy.

## MUST

- Disposal request/review/approval dialogs MUST use `CharsCounter` in minimum-length mode for rejection/request rationale hints.
- The old disposal dialog `common.charCount` call path MUST NOT remain.
- Korean and English common character-counter messages MUST define the minimum-length copy used by `CharsCounter`.
- Existing disposal validation E2E specs MUST assert the visible character hint copy for request/review/approval flows, or equivalent focused tests MUST cover it.
- Focused frontend tests/type-check MUST pass.

## SHOULD

- Keep this as a stale/manual-snapshot closure. Do not create new copy or change product wording.

## Verification

- Search disposal dialogs for old `common.charCount` usage.
- Inspect `CharsCounter` and `messages/{ko,en}/common.json`.
- Run focused `CharsCounter` tests and frontend type-check.
- Harness evaluator must return PASS before moving this contract to `completed/`.
