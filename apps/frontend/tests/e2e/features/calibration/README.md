# Calibration Tests

## Overview

Tests for calibration management, registration, filters, and overdue auto-NC workflows.

## Test Groups

| Group            | Name                  | Description                                      | Files |
| ---------------- | --------------------- | ------------------------------------------------ | ----- |
| management/      | Management            | Calibration record CRUD and listing              | 1     |
| registration/    | Registration Approval | Calibration registration approval workflow       | 1     |
| filters/         | Filters               | Calibration list filtering                       | 1     |
| overdue-auto-nc/ | Overdue Auto-NC       | Automatic non-conformance on overdue calibration | 16    |

## Overdue Auto-NC Workflow

The backend scheduler (`CalibrationOverdueScheduler`) automatically:

1. Detects equipment with overdue calibration
2. Changes status to `non_conforming`
3. Creates non-conformance record
4. Registers incident history

Tests verify:

- API trigger (`POST /api/notifications/trigger-overdue-check`)
- Equipment list UI updates
- NC banner display
- Incident history creation
- Permission-based access

## Running

```bash
# All calibration tests
pnpm --filter frontend exec npx playwright test features/calibration

# Specific group
pnpm --filter frontend exec npx playwright test features/calibration/management
pnpm --filter frontend exec npx playwright test features/calibration/overdue-auto-nc
```

## Note

`overdue-auto-nc/` tests are excluded from the default test run via `testIgnore` in `playwright.config.ts` because they require special seed data setup.
