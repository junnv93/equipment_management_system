# Disposal Request Approval Tests

## Overview

Tests for the 3-step disposal approval workflow: Request (test_engineer) -> Review (technical_manager) -> Final Approval (lab_manager).

## Test Groups

| Group       | Name                    | Description                                 | Files  |
| ----------- | ----------------------- | ------------------------------------------- | ------ |
| review/     | Review Stage            | Technical manager reviews disposal requests | 4      |
| final/      | Final Approval          | Lab manager final approve/reject            | 4      |
| approval/   | Cross-team Approval     | Cross-team approval scenarios               | 3      |
| workflow/   | Full Workflow           | End-to-end disposal workflow                | 3+     |
| role/       | Role-based Access       | Permission checks per role                  | 7+     |
| bulk/       | Bulk Operations         | Multi-select approve/reject                 | 4      |
| validation/ | Validation & Edge Cases | Reject flows, duplicate prevention, cancel  | 13     |
| db/         | Database State          | DB state verification after actions         | 5      |
| navigation/ | Tab Navigation          | Tab switching, selection state, UI/UX       | 10     |
| exceptions/ | Exception Handling      | Error scenarios and edge cases              | varies |

## Prerequisites

- Backend running on `http://localhost:3001`
- Test data seeded (disposal-specific equipment and requests)
- DB cleanup helpers available for state reset between tests

## Key Helpers

- `helpers/db-cleanup.ts`: Reset equipment to pending/reviewed disposal state
- `../../shared/fixtures/auth.fixture.ts`: Role-based auth (techManagerPage, siteAdminPage)

## Running

```bash
# All disposal approval tests
pnpm --filter frontend exec npx playwright test features/approvals/disposal-requests

# Specific group
pnpm --filter frontend exec npx playwright test features/approvals/disposal-requests/review
pnpm --filter frontend exec npx playwright test features/approvals/disposal-requests/final
```

## Approval Workflow

```
[test_engineer] → Request Disposal → [pending]
                                         ↓
[technical_manager] → Review → [reviewed]
                                    ↓
[lab_manager] → Final Approve → [disposed] (equipment status: retired)
             → Final Reject  → [rejected] (equipment status: available)
```
