# Equipment Create Tests

## Overview

Tests for equipment registration and creation workflows, including form validation, file uploads, approval workflows, and shared equipment.

## Test Groups

| Group   | Name              | Description                      |
| ------- | ----------------- | -------------------------------- |
| group-1 | Approval Workflow | Registration → approval flow     |
| group-2 | Validation        | Form field validation            |
| group-3 | File Upload       | Attachment handling              |
| group-4 | History Save      | Equipment history card creation  |
| group-5 | Shared Equipment  | Shared/rental equipment creation |
| group-9 | DB Verification   | Database state verification      |

## Running

```bash
pnpm --filter frontend exec npx playwright test features/equipment/create
pnpm --filter frontend exec npx playwright test features/equipment/create/group-1-approval-workflow
```
