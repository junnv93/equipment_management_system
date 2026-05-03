# Contract: review-architecture-defense-in-depth-audit

## Scope

Close tech-debt item `review-architecture-defense-in-depth-audit`.

## MUST

- Produce an architecture review report for the ErrorCode defense-in-depth chain introduced by `error-codes-ssot-system-wide`.
- Review must cover the five layers named in the tracker item:
  - Zod DTO validation
  - Service fail-close
  - Controller/API response path
  - GlobalExceptionFilter
  - Frontend mapper/i18n routing
- Review must explicitly cover disposal and calibration-plan rejection/fail-close paths.
- Findings must be severity-labeled; if no issues are found, the report must state residual risk/test gaps.

## SHOULD

- Do not change production code.
- Keep tracker/contract bookkeeping scoped to this review item.
