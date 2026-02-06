# Group C: Checkout Approval Flow Tests

## Overview

Group C2 tests cover the checkout approval workflow scenarios with `technical_manager` permissions. These tests verify that approval and rejection workflows function correctly and status transitions are properly persisted.

## Test File

**File**: `apps/frontend/tests/e2e/checkouts/group-c/c2-approval-flow.spec.ts`

## Test Scenarios

### C-3: Approve calibration checkout (P0 - CRITICAL)

**Purpose**: Verify that a technical_manager can approve a pending calibration checkout

**Test Data**:

- Checkout ID: `CHECKOUT_001_ID` (pending calibration - Suwon E)
- Initial Status: `pending`
- Expected Final Status: `approved`

**Workflow**:

1. Login as technical_manager (via `techManagerPage` fixture)
2. Navigate to `/checkouts/10000000-0000-0000-0000-000000000001`
3. Verify initial status shows "승인 대기"
4. Click "승인" button
5. Confirm in dialog by clicking "확인"
6. Verify status changes to "승인됨"
7. Verify success message appears
8. Verify "반출 시작" button becomes visible
9. Verify "승인" button is no longer visible

**SSOT Compliance**:

- Uses `CHECKOUT_STATUS_LABELS` from `@equipment-management/schemas`
- Uses checkout ID from `test-checkout-ids.ts` constants

---

### C-4: Approve repair checkout (P0 - CRITICAL)

**Purpose**: Verify that a technical_manager can approve a pending repair checkout

**Test Data**:

- Checkout ID: `CHECKOUT_003_ID` (pending repair - Suwon E)
- Initial Status: `pending`
- Expected Final Status: `approved`

**Workflow**:

1. Login as technical_manager
2. Navigate to `/checkouts/10000000-0000-0000-0000-000000000003`
3. Click "승인" button and confirm
4. Verify status changes to "승인됨"
5. Verify success message
6. Verify "반출 시작" button appears

**Key Validation**:

- Status transition: `pending` → `approved`
- Workflow progression: Approval buttons removed, start button added

---

### C-5: Approve rental checkout (P0 - CRITICAL)

**Purpose**: Verify that only the lending team's technical_manager can approve rental checkouts

**Test Data**:

- Checkout ID: `CHECKOUT_005_ID` (pending rental - Suwon → Uiwang)
- Lending Team: `TEAM_FCC_EMC_RF_SUWON_ID`
- Initial Status: `pending`
- Expected Final Status: `approved`

**Workflow**:

1. Login as technical_manager from Suwon FCC team (lenderTeamId matches)
2. Navigate to `/checkouts/10000000-0000-0000-0000-000000000005`
3. Verify checkout purpose is "대여" (rental)
4. Approve the checkout
5. Verify status changes to "승인됨"
6. Verify rental-specific workflow buttons appear (e.g., "반출 전 확인")

**Business Logic**:

- Rental checkouts require approval from the **lending team's** technical_manager
- After approval, rental checkouts follow a 4-step verification process
- Different workflow buttons appear compared to calibration/repair

---

### C-6: Status transition after approval (P0 - CRITICAL)

**Purpose**: Verify that status transitions are properly persisted and reflected in UI

**Test Data**:

- Checkout ID: `CHECKOUT_002_ID` (pending calibration - Suwon R)

**Workflow**:

1. Navigate to checkout detail page
2. Verify initial state:
   - Status badge: "승인 대기" (`CHECKOUT_STATUS_LABELS.pending`)
   - Buttons visible: "승인", "반려"
3. Click "승인" and confirm
4. Verify post-approval state:
   - Status badge: "승인됨" (`CHECKOUT_STATUS_LABELS.approved`)
   - Buttons visible: "반출 시작"
   - Buttons hidden: "승인", "반려"
5. Refresh page
6. Verify state persists after page reload

**Critical Validations**:

- Status badge updates immediately
- Workflow buttons change correctly
- Status persists across page reloads
- Old status is no longer visible

---

### C-8: Approve multiple equipment checkout (P2)

**Purpose**: Verify that multi-equipment checkouts are approved as a single unit

**Test Data**:

- Checkout ID: `CHECKOUT_007_ID` (pending calibration multi-equipment - 2 items)

**Workflow**:

1. Navigate to checkout detail page
2. Verify multiple equipment are listed (shows "2" or equipment count)
3. Approve the checkout
4. Verify all equipment transition together
5. Verify success message (may mention multiple equipment)
6. Verify workflow progresses to next step

**Business Logic**:

- Multi-equipment checkouts are treated as a single transaction
- All equipment in the checkout share the same status
- Single approval action affects all equipment

---

### C-11: Status transition after rejection (P0 - CRITICAL)

**Purpose**: Verify that rejection ends the workflow and status transitions to 'rejected'

**Test Data**:

- Checkout ID: `CHECKOUT_008_ID` (pending repair multi-equipment)
- Rejection Reason: "예산 부족"

**Workflow**:

1. Login as technical_manager
2. Navigate to checkout detail page
3. Verify initial status is "승인 대기"
4. Click "반려" (reject) button
5. Enter rejection reason: "예산 부족"
6. Confirm rejection
7. Verify status changes to "거절됨" (`CHECKOUT_STATUS_LABELS.rejected`)
8. Verify rejection reason is displayed on page
9. Verify no action buttons are available (workflow terminated)

**Critical Validations**:

- Status transitions to `rejected`
- Rejection reason is stored and displayed
- Workflow ends (no "승인", "반려", "반출 시작" buttons)
- Success/info message about rejection appears

---

## SSOT Compliance

All tests strictly follow the Single Source of Truth principle:

### 1. Status Labels

```typescript
import { CHECKOUT_STATUS_LABELS } from '@equipment-management/schemas';

// ✅ CORRECT
await expect(page.getByText(CHECKOUT_STATUS_LABELS.approved)).toBeVisible();

// ❌ WRONG
await expect(page.getByText('승인됨')).toBeVisible();
```

### 2. Checkout IDs

```typescript
import { CHECKOUT_001_ID } from '../../constants/test-checkout-ids.ts';

// ✅ CORRECT
await page.goto(`/checkouts/${CHECKOUT_001_ID}`);

// ❌ WRONG
await page.goto('/checkouts/10000000-0000-0000-0000-000000000001');
```

### 3. Purpose Labels

```typescript
import { CHECKOUT_PURPOSE_LABELS } from '@equipment-management/schemas';

// ✅ CORRECT
await page.getByText(CHECKOUT_PURPOSE_LABELS.calibration).click();
```

## Test Data

All test data is seeded via:

- **Backend Seed**: `apps/backend/src/database/seed-data/operations/checkouts.seed.ts`
- **UUID Constants**: `apps/backend/src/database/utils/uuid-constants.ts`
- **Frontend Constants**: `apps/frontend/tests/e2e/constants/test-checkout-ids.ts`

### Checkout Test Data

| ID              | Status  | Purpose     | Team           | Description                   |
| --------------- | ------- | ----------- | -------------- | ----------------------------- |
| CHECKOUT_001_ID | pending | calibration | Suwon E        | Standard calibration checkout |
| CHECKOUT_002_ID | pending | calibration | Suwon R        | For status transition test    |
| CHECKOUT_003_ID | pending | repair      | Suwon E        | Standard repair checkout      |
| CHECKOUT_005_ID | pending | rental      | Suwon → Uiwang | Rental with lenderTeamId      |
| CHECKOUT_007_ID | pending | calibration | Suwon E        | Multi-equipment (2 items)     |
| CHECKOUT_008_ID | pending | repair      | Uiwang W       | For rejection test            |

## Fixtures

Tests use the `techManagerPage` fixture from `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`:

```typescript
test('C-3: Approve calibration checkout', async ({ techManagerPage }) => {
  // techManagerPage is already logged in as technical_manager
  // with TEAM_FCC_EMC_RF_SUWON_ID team membership
  await techManagerPage.goto('/checkouts/...');
});
```

**Fixture Details**:

- **Role**: `technical_manager`
- **Team**: `TEAM_FCC_EMC_RF_SUWON_ID` (Suwon FCC EMC/RF)
- **Permissions**:
  - Approve checkouts (calibration, repair, rental)
  - Reject checkouts
  - Manage calibration plans
  - Approve returns

## Helper Functions

Reusable helper functions are available in `apps/frontend/tests/e2e/checkouts/helpers/checkout-helpers.ts`:

```typescript
import { approveCheckout, rejectCheckout } from '../helpers/checkout-helpers';

// Approve a checkout
await approveCheckout(page, CHECKOUT_001_ID);

// Reject a checkout
await rejectCheckout(page, CHECKOUT_001_ID, '예산 부족');
```

## Running Tests

```bash
# Run all Group C2 tests
pnpm --filter frontend test:e2e apps/frontend/tests/e2e/checkouts/group-c/c2-approval-flow.spec.ts

# Run a specific test
pnpm --filter frontend test:e2e -g "C-3: Approve calibration checkout"

# Run with UI
pnpm --filter frontend test:e2e --ui apps/frontend/tests/e2e/checkouts/group-c/c2-approval-flow.spec.ts

# Debug mode
pnpm --filter frontend test:e2e --debug apps/frontend/tests/e2e/checkouts/group-c/c2-approval-flow.spec.ts
```

## Prerequisites

1. **Backend Running**: `pnpm --filter backend run dev`
2. **Frontend Running**: `pnpm --filter frontend run dev`
3. **Database Seeded**: Test data must be seeded via `pnpm --filter backend exec npx ts-node src/database/seed-test-new.ts`

## Expected Results

All tests should pass with the following validations:

- ✅ Status transitions work correctly (pending → approved/rejected)
- ✅ Workflow buttons change appropriately
- ✅ Success/error messages appear
- ✅ Status persists across page reloads
- ✅ Rental checkouts show rental-specific workflow
- ✅ Multi-equipment checkouts approved as single unit
- ✅ Rejection reason stored and displayed
- ✅ SSOT labels used throughout

## Known Issues

None at this time.

## Related Documentation

- [CLAUDE.md](../../../../../CLAUDE.md) - Project instructions
- [Checkout Seed Data](../../../../backend/src/database/seed-data/operations/checkouts.seed.ts) - Backend seed data
- [Auth Fixture](../../fixtures/auth.fixture.ts) - Authentication fixture
- [Checkout Helpers](../helpers/checkout-helpers.ts) - Reusable helper functions
