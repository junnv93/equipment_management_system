# Contract: csp-report-endpoint-violation-monitoring

> **Slug**: `csp-report-endpoint-violation-monitoring`
> **Created**: 2026-05-03
> **Mode**: stale tech-debt closure harness

## Scope

Close the Open tracker item for CSP report endpoint violation monitoring. Current backend already provides a public, throttled CSP report endpoint, structured logging, persistence, and focused tests for legacy and Reporting API payloads.

## MUST

| ID | Requirement | Evidence |
|----|-------------|----------|
| M1 | Backend exposes a CSP report collection endpoint. | `SecurityController` has `@Controller('security')` + `@Post('csp-report')`. |
| M2 | Endpoint accepts browser reports without authentication and without response wrapping. | `@Public()`, `@HttpCode(HttpStatus.NO_CONTENT)`, `@SkipResponseTransform()`. |
| M3 | Endpoint is throttled because it is public. | `@Throttle(throttleAllNamed(THROTTLE_PRESETS.CSP_REPORT))`. |
| M4 | Endpoint handles both legacy `csp-report` and Reporting API `csp-violation` payloads. | `SecurityController.handleReport()` branches on both shapes and supports arrays. |
| M5 | Violations are structurally logged and persisted for production monitoring. | `Logger('CspReport').warn(...)` and `SecurityService.saveReport()` inserting `cspReports`. |
| M6 | Focused tests cover parsing, logging, persistence handoff, unknown payloads, batch reports, and line number normalization. | `security.controller.spec.ts` and `security.service.spec.ts`. |

## SHOULD

| ID | Requirement | Evidence |
|----|-------------|----------|
| S1 | Persistence failures do not break browser report submission. | `SecurityService.saveReport()` catches and logs insert errors. |
| S2 | Tracker closes the stale Open item with evidence. | `tech-debt-tracker.md` marks `csp-report-endpoint-violation-monitoring` `[x]`. |

## Verification Commands

```bash
pnpm --filter backend test -- security.controller.spec.ts security.service.spec.ts --runInBand
```
