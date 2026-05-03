# Contract: approval-stepper-disposal-start-node-label

## Scope

Close tech-debt item `stepper-disposal-start-node-label`.

## MUST

- Disposal `ApprovalStepIndicator` must visually distinguish the first/start node.
- Calibration-plan `ApprovalStepIndicator` must not receive the disposal-only visual marker.
- Existing screen-reader start-node label must remain available.
- Focused regression coverage must pin the disposal-only behavior.

## SHOULD

- Keep styling in `APPROVAL_STEPPER_TOKENS`.
