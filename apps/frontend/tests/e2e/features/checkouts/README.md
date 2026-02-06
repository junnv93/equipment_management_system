# Checkout E2E Tests

This directory contains comprehensive E2E tests for the equipment checkout workflow, following UL-QP-18 procedures.

## Test Structure

```
features/checkouts/
├── README.md                        # This file
├── helpers/
│   ├── checkout-helpers.ts          # Reusable helper functions
│   └── assertions.ts                # Custom assertion utilities
├── group-1-read-only/               # List and detail page tests
├── group-2-create/                  # Checkout creation tests
├── group-3-approval/                # Approval/rejection flow tests
├── group-4-processing/              # Checkout processing lifecycle
│   └── 4d-full-flow.spec.ts         # CRITICAL: Full checkout lifecycle test
├── group-5-rental/                  # Rental 4-step workflow
└── group-6-constraints/             # Edge cases and constraints
```

## Test Groups

### Group 4: Checkout Processing (CRITICAL)

#### Group 4D: Full Flow Tests

- **4d-full-flow.spec.ts**: Complete checkout lifecycle validation
  - Tests the entire workflow from creation to return approval
  - Validates all state transitions
  - Verifies equipment status changes
  - Ensures data persistence

## Prerequisites

### 1. Start Backend Server

```bash
cd apps/backend
pnpm dev
```

The backend must be running on `http://localhost:3001` with:

- PostgreSQL database seeded with test data
- Test users configured
- NODE_ENV set to "development"

### 2. Start Frontend Server

```bash
cd apps/frontend
pnpm dev
```

The frontend must be running on `http://localhost:3000`.

### 3. Seed Test Data

```bash
cd apps/backend
pnpm db:seed:test
```

This creates:

- Test users (test_engineer, technical_manager, lab_manager)
- Test equipment (SUW-E0001, SUW-E0002, etc.)
- Test teams (FCC EMC/RF, General EMC, etc.)

## Running Tests

### Run All Checkout Tests

```bash
cd apps/frontend
pnpm test:e2e tests/e2e/checkouts
```

### Run Specific Test

```bash
pnpm test:e2e tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

### Run in UI Mode (Recommended for Development)

```bash
pnpm test:e2e --ui tests/e2e/checkouts
```

### Run in Debug Mode

```bash
pnpm test:e2e --debug tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

## Test Architecture

### SSOT Principles

All tests follow Single Source of Truth (SSOT) principles:

1. **Status Labels**: Import from `@equipment-management/schemas`

   ```typescript
   import {
     CHECKOUT_STATUS_LABELS,
     EQUIPMENT_STATUS_LABELS,
     CHECKOUT_PURPOSE_LABELS,
   } from '@equipment-management/schemas';
   ```

2. **Helper Functions**: Use from `helpers/checkout-helpers.ts`

   ```typescript
   import {
     createCheckoutRequest,
     approveCheckout,
     startCheckout,
     returnCheckout,
     approveReturn,
     verifyCheckoutStatus,
     verifyEquipmentStatus,
   } from '../helpers/checkout-helpers';
   ```

3. **Assertions**: Use from `helpers/assertions.ts`

   ```typescript
   import {
     expectStatusBadge,
     expectSuccessMessage,
     expectButtonVisible,
   } from '../helpers/assertions';
   ```

4. **Test Equipment IDs**: Import from `constants/test-equipment-ids.ts`
   ```typescript
   import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../constants/test-equipment-ids';
   ```

### Authentication

Tests use role-based authentication fixtures from `fixtures/auth.fixture.ts`:

- `testOperatorPage`: 시험실무자 (Test Engineer)
- `techManagerPage`: 기술책임자 (Technical Manager)
- `siteAdminPage`: 시험소장 (Lab Manager)

Each fixture provides an authenticated browser context for that role.

### Test Data

Test equipment IDs must match `apps/backend/src/database/utils/uuid-constants.ts`:

| Equipment         | ID                 | Management Number | Initial Status |
| ----------------- | ------------------ | ----------------- | -------------- |
| Spectrum Analyzer | `eeee1001-...0001` | SUW-E0001         | available      |
| Signal Generator  | `eeee1002-...0002` | SUW-E0002         | available      |
| Network Analyzer  | `eeee1003-...0003` | SUW-E0003         | available      |
| Power Meter       | `eeee1004-...0004` | SUW-E0004         | non_conforming |

## Test Case: 4D Full Flow

### Objective

Validate the complete checkout lifecycle from creation to return approval.

### Workflow Under Test

```
[available] → CREATE → [pending]
              ↓ APPROVE
           [approved]
              ↓ START
           [checked_out] (equipment status: checked_out)
              ↓ RETURN
           [returned]
              ↓ APPROVE RETURN
        [return_approved] (equipment status: available)
```

### State Transitions Tested

#### Checkout Status

1. `pending` → Creation by test_engineer
2. `approved` → Approved by technical_manager
3. `checked_out` → Started by technical_manager
4. `returned` → Returned with inspections
5. `return_approved` → Final approval by technical_manager

#### Equipment Status

1. `available` → Initial state
2. `checked_out` → When checkout starts
3. `available` → Restored when return approved

### Critical Validations

✅ **Database State**: Uses API calls to verify actual DB state
✅ **UI State**: Verifies status badges using SSOT labels
✅ **Data Persistence**: Confirms all form data is saved correctly
✅ **Permission Model**: Tests role-based access control
✅ **Business Logic**: Validates UL-QP-18 approval workflow

### Test Steps

1. **Create Checkout** (as test_engineer)

   - Navigate to `/checkouts/create`
   - Select equipment: Spectrum Analyzer (SUW-E0001)
   - Fill form: Purpose=교정, Destination=한국교정시험연구원
   - Submit and verify status=`pending`

2. **Approve Checkout** (as technical_manager)

   - Navigate to checkout detail page
   - Click "승인" button
   - Verify status=`approved`

3. **Start Checkout** (as technical_manager)

   - Click "반출 시작" button
   - Verify status=`checked_out`
   - Verify equipment status=`checked_out`

4. **Return Checkout** (as technical_manager)

   - Click "반입 신청" button
   - Check calibration inspection
   - Check working status inspection
   - Fill notes: "교정 완료, 정상 작동 확인"
   - Submit and verify status=`returned`

5. **Approve Return** (as technical_manager)
   - Click "반입 승인" button
   - Verify status=`return_approved`
   - Verify equipment status=`available` (restored)

### Expected Duration

- Typical runtime: ~30-45 seconds
- Timeout: 60 seconds (configured in playwright.config.ts)

## Debugging

### Common Issues

#### 1. "Backend server is not accessible"

```bash
# Ensure backend is running
cd apps/backend
pnpm dev

# Verify health endpoint
curl http://localhost:3001/api/monitoring/health
```

#### 2. "Test users not found"

```bash
# Re-seed test data
cd apps/backend
pnpm db:seed:test
```

#### 3. "Login failed: redirected to login page"

```bash
# Check backend NODE_ENV
echo $NODE_ENV  # Should be "development" or "test"

# Verify test-login endpoint
curl http://localhost:3001/api/auth/test-login?role=test_engineer
```

#### 4. "Equipment not found"

```bash
# Verify equipment IDs in database
psql -d postgres_equipment -c "SELECT id, management_number, status FROM equipment LIMIT 5;"
```

### Debug Logs

Enable verbose logging by setting environment variable:

```bash
DEBUG=pw:api pnpm test:e2e tests/e2e/checkouts
```

### Visual Debugging

Use Playwright Inspector to step through tests:

```bash
PWDEBUG=1 pnpm test:e2e tests/e2e/checkouts/group-4-processing/4d-full-flow.spec.ts
```

## Best Practices

### ✅ DO

- Use SSOT imports for all status labels
- Use helper functions from `helpers/`
- Verify DB state via API calls
- Use role-based fixtures for authentication
- Add explicit waits for UI state changes
- Log progress with `console.log()`

### ❌ DON'T

- Hardcode status labels (use SSOT)
- Bypass helper functions
- Only verify UI without checking DB
- Use `page.waitForTimeout()` excessively
- Rely on network interception (use UI state)
- Test implementation details instead of business logic

## Contributing

When adding new checkout tests:

1. Follow the existing test structure
2. Add helpers to `helpers/checkout-helpers.ts` if reusable
3. Add assertions to `helpers/assertions.ts` if generic
4. Update this README with new test cases
5. Ensure SSOT principles are followed
6. Add inline comments for complex flows

## References

- **CLAUDE.md**: Project guidelines and architecture
- **UL-QP-18**: Equipment management procedures
- **packages/schemas**: SSOT for enums and labels
- **apps/backend/src/database/utils/uuid-constants.ts**: Test data IDs
- **apps/frontend/lib/auth.ts**: NextAuth configuration

## Maintenance

### When Backend Schema Changes

1. Update `apps/backend/src/database/seed-test-new.ts`
2. Update `apps/frontend/tests/e2e/constants/test-equipment-ids.ts`
3. Re-seed database: `pnpm db:seed:test`
4. Update affected tests

### When UI Changes

1. Update `helpers/checkout-helpers.ts` selectors
2. Update `helpers/assertions.ts` expectations
3. Re-run tests to verify

### When Business Logic Changes

1. Review affected test cases
2. Update test steps to match new workflow
3. Update expected results
4. Add new test cases if needed

---

Last updated: 2026-02-05
Test coverage: Full checkout lifecycle (create → approve → start → return → approve return)
