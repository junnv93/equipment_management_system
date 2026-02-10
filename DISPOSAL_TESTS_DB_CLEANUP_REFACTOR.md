# Disposal Permission Tests DB Cleanup Refactor

## Summary

Successfully refactored all disposal permission tests (02, 03, 04, 05) to use shared database cleanup helpers instead of creating individual Pool instances per test file.

## Changes Made

### 1. Added New Helper Function to `db-cleanup.ts`

**File**: `apps/frontend/tests/e2e/disposal/helpers/db-cleanup.ts`

Added `resetEquipmentToPendingDisposal()` function:

- Resets equipment to `pending_disposal` status
- Creates or updates disposal request with `review_status = 'pending'`
- Clears any review/approval fields
- Uses INSERT ... ON CONFLICT pattern for idempotency

### 2. Updated Test Files

#### Test 02: `02-technical-manager-can-review.spec.ts`

- **Before**: Created local Pool instance in `ensureEquipmentA4HasPendingDisposalRequest()`
- **After**: Uses `resetEquipmentToPendingDisposal()` from shared helpers
- **Changes**:
  - Removed local Pool import and cleanup function
  - Replaced with `resetEquipmentToPendingDisposal()` call
  - Added `afterAll` hook to call `cleanupPool()`

#### Test 03: `03-technical-manager-cannot-review-different-team.spec.ts`

- **Before**: No cleanup (was relying on seed data)
- **After**: Uses `resetEquipmentToPendingDisposal()` from shared helpers
- **Changes**:
  - Added `beforeEach` hook with cleanup
  - Added imports for UUID constants (DISP_REQ_A7_ID, USER_TECHNICAL_MANAGER_UIWANG_ID)
  - Added `afterAll` hook to call `cleanupPool()`

#### Test 04: `04-lab-manager-can-approve.spec.ts`

- **Before**: Created local Pool instance in `ensureEquipmentA5HasReviewedDisposalRequest()`
- **After**: Uses `resetEquipmentToReviewedDisposal()` from shared helpers
- **Changes**:
  - Removed local Pool import and cleanup function
  - Replaced with `resetEquipmentToReviewedDisposal()` call
  - Added `afterAll` hook to call `cleanupPool()`

#### Test 05: `05-shared-equipment-no-disposal.spec.ts`

- **Before**: Created local Pool instance in `cleanupEquipmentA8()`
- **After**: Uses `resetEquipmentToShared()` from shared helpers
- **Changes**:
  - Removed local cleanup function
  - Replaced with `resetEquipmentToShared()` call
  - Kept local Pool import only for in-test verification
  - Added `afterAll` hook to call `cleanupPool()`

## Benefits

1. **Prevents Connection Pool Exhaustion**: Single shared Pool instance instead of 4+ separate instances
2. **Consistent Cleanup Logic**: All tests use the same well-tested helpers
3. **Better Maintainability**: Changes to cleanup logic only need to be made in one place
4. **Proper Resource Cleanup**: `afterAll` hooks ensure Pool is closed after all tests complete
5. **Type Safety**: All changes pass TypeScript type checking

## Shared Helper Functions Available

| Function                             | Purpose                                         |
| ------------------------------------ | ----------------------------------------------- |
| `resetEquipmentToAvailable()`        | Reset to available status, no disposal requests |
| `resetEquipmentToPendingDisposal()`  | Reset to pending_disposal with pending review   |
| `resetEquipmentToReviewedDisposal()` | Reset to pending_disposal with reviewed status  |
| `resetEquipmentToShared()`           | Reset to available + isShared=true              |
| `resetEquipmentToDisposed()`         | Reset to disposed with approved request         |
| `cleanupPool()`                      | Close shared Pool (call in afterAll)            |

## Test Verification

All files pass TypeScript type checking:

```bash
pnpm tsc --noEmit tests/e2e/disposal/permissions/*.spec.ts tests/e2e/disposal/helpers/db-cleanup.ts
# ✅ No errors
```

## File Paths

- `apps/frontend/tests/e2e/disposal/helpers/db-cleanup.ts` (shared helpers)
- `apps/frontend/tests/e2e/disposal/permissions/02-technical-manager-can-review.spec.ts`
- `apps/frontend/tests/e2e/disposal/permissions/03-technical-manager-cannot-review-different-team.spec.ts`
- `apps/frontend/tests/e2e/disposal/permissions/04-lab-manager-can-approve.spec.ts`
- `apps/frontend/tests/e2e/disposal/permissions/05-shared-equipment-no-disposal.spec.ts`
