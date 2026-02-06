# Group C3: Checkout Rejection Flow Tests

## Overview

This test group verifies checkout rejection workflows with `technical_manager` permissions.

## Test Coverage

- **C-9**: Reject calibration checkout
- **C-10**: Reject repair checkout
- **C-13**: Rejection reason required (validation)
- **C-14**: Rejection notification
- **C-9 (additional)**: Reject rental checkout
- **C-12**: Cannot modify after rejection

## Prerequisites

These tests require checkouts to be in **'pending' status**. If tests have been run before, the checkouts will be in 'approved' or 'rejected' status and need to be reset.

## Setup

### Option 1: Use the convenience script (recommended)

```bash
cd apps/frontend
./run-rejection-tests.sh
```

This script will:

1. Reset checkout statuses to 'pending'
2. Run the rejection flow tests

### Option 2: Manual setup

1. **Reset checkout statuses:**

   ```bash
   cd apps/backend
   npx ts-node scripts/reset-test-checkouts.ts
   ```

2. **Run the tests:**
   ```bash
   cd apps/frontend
   npx playwright test tests/e2e/checkouts/group-c/c3-rejection-flow.spec.ts
   ```

## Affected Checkouts

The following checkouts are reset to 'pending' status by the reset script:

- `CHECKOUT_001_ID` (10000000-0000-0000-0000-000000000001) - For C-14: notification test
- `CHECKOUT_002_ID` (10000000-0000-0000-0000-000000000002) - For C-9: calibration rejection
- `CHECKOUT_003_ID` (10000000-0000-0000-0000-000000000003) - For C-13: validation test
- `CHECKOUT_004_ID` (10000000-0000-0000-0000-000000000004) - For C-10: repair rejection

## Troubleshooting

### Error: "Checkout is not in 'pending' status"

**Cause:** The checkout has been modified by a previous test run and is no longer in 'pending' status.

**Solution:** Run the reset script before the tests:

```bash
cd apps/backend && npx ts-node scripts/reset-test-checkouts.ts
```

### Error: "反려 button not visible" or timeout

**Cause:** Same as above - checkout is not in 'pending' status.

**Solution:** Reset the checkouts as described above.

### Backend authentication errors (401)

**Note:** The tests use NextAuth session cookies for frontend authentication, but direct backend API calls require JWT tokens. This is why we use a backend script to reset checkout statuses instead of doing it within the test setup.

## Architecture Notes

- **Frontend Auth:** NextAuth session cookies (`next-auth.session-token`)
- **Backend Auth:** JWT tokens in `Authorization: Bearer <token>` header
- **Why separate reset script?** Playwright tests don't have backend JWT tokens, so we can't make authenticated API calls to reset data. The backend TypeScript script has direct database access.

## Related Files

- Test file: `group-c/c3-rejection-flow.spec.ts`
- Reset script: `apps/backend/scripts/reset-test-checkouts.ts`
- Runner script: `apps/frontend/run-rejection-tests.sh`
- Seed data: `apps/backend/src/database/seed-data/operations/checkouts.seed.ts`
