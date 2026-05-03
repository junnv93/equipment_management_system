# Contract: charscounter-min-mode-disposal

## Scope

Close tech-debt item `charscounter-disposal-extension`.

## MUST

- `CharsCounter` must support minimum-length hint semantics.
- Disposal request/review/approval dialogs must use `CharsCounter` for min-hint counters instead of local `<p>` counters.
- Korean and English common i18n must include the min-hint counter copy.
- Focused `CharsCounter` tests pass.
- Frontend type-check passes.

## SHOULD

- Preserve existing disposal min-hint text.
- Preserve `aria-describedby` connections.
