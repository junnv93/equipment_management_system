# Group E: End-to-End Integration Tests - Summary

## Test File Location

`/home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`

## Test Coverage

### Subgroup E1-E2: Main Workflows (Sequential - 3 tests)

These tests must run sequentially as they involve complex multi-step workflows with dependencies.

#### Test 5.1: Complete Full Overdue Detection to Resolution Workflow

- **Purpose**: End-to-end test from detection to resolution
- **Equipment ID**: `equip-e1-${timestamp}`
- **Flow**:
  1. Create equipment with overdue calibration (7 days ago)
  2. Trigger manual overdue check (API)
  3. Verify status changed to `non_conforming`
  4. Navigate to equipment detail page (UI)
  5. Verify NonConformanceBanner is displayed
  6. Create and approve calibration record
  7. Verify NC auto-corrected to 'corrected' status
  8. Verify equipment calibration dates updated
- **Assertions**:
  - Equipment status: `available` → `non_conforming`
  - NC created with type: `calibration_overdue`, status: `open`
  - After calibration approval: NC status: `corrected`, resolutionType: `recalibration`
  - Equipment nextCalibrationDate updated to future date
  - UI shows NonConformanceBanner
  - NC linked to calibration record

#### Test 5.2: Maintain Data Consistency Across Multiple Overdue Equipment

- **Purpose**: Verify correct processing of multiple equipment with different states
- **Equipment**:
  - Equipment A (`equip-e2a-${timestamp}`): available, no existing NC → should be processed
  - Equipment B (`equip-e2b-${timestamp}`): available, existing open calibration_overdue NC → should be skipped
  - Equipment C (`equip-e2c-${timestamp}`): non_conforming status, different cause → should be skipped
- **Flow**:
  1. Create 3 equipment with different states
  2. Trigger manual overdue check
  3. Verify each equipment processed correctly
- **Assertions**:
  - Equipment A: status changed to `non_conforming`, NC created
  - Equipment B: status unchanged, no duplicate NC created
  - Equipment C: status unchanged, no calibration_overdue NC created
  - Response categorizes each correctly (created/skipped)

#### Test 5.3: Handle Calibration Approval for Equipment with Multiple Non-Conformances

- **Purpose**: Verify selective auto-correction when equipment has multiple NCs
- **Equipment ID**: `equip-e3-${timestamp}`
- **Flow**:
  1. Create equipment with two NCs:
     - calibration_overdue (status: open)
     - damage (status: analyzing)
  2. Create pending calibration record
  3. Approve calibration
  4. Verify only calibration_overdue NC is auto-corrected
- **Assertions**:
  - calibration_overdue NC: status changed to 'corrected', resolutionType: 'recalibration'
  - damage NC: status remains 'analyzing' (unchanged)
  - Equipment may still have `non_conforming` status (due to other open NC)

### Subgroup E3: Concurrency Tests (Parallel - 2 tests)

These tests can run in parallel as they are independent and test different aspects.

#### Test 5.4: Verify UI Updates After Backend State Changes

- **Purpose**: Verify UI reflects backend state changes after refresh
- **Equipment ID**: `equip-e4-${timestamp}`
- **Flow**:
  1. Open equipment detail page in browser
  2. Verify initial status: 'available'
  3. Trigger manual overdue check via API (separate request)
  4. Refresh the equipment detail page
  5. Verify UI reflects new state
- **Assertions**:
  - Status badge updates to 'Non-conforming'
  - NonConformanceBanner appears
  - Incident History tab shows new `calibration_overdue` entry
  - Checkout button disabled/hidden

#### Test 5.5: Handle Rapid Successive Overdue Checks Without Creating Duplicates

- **Purpose**: Verify duplicate prevention in concurrent scenarios
- **Equipment ID**: `equip-e5-${timestamp}`
- **Flow**:
  1. Create equipment with overdue calibration
  2. Trigger manual overdue check (first call)
  3. Immediately trigger again (second call)
  4. Query non-conformances and incident history
- **Assertions**:
  - First call: NC created successfully
  - Second call: Equipment skipped (existing NC detected)
  - Only one NC record exists (no duplicates)
  - Only one incident history record exists

## Test Execution Strategy

### Sequential Tests (E1-E2)

```bash
# Run with workers=1 to ensure sequential execution
pnpm --filter frontend run test:e2e --grep "Subgroup E1-E2" --workers=1
```

### Parallel Tests (E3)

```bash
# Can run with multiple workers
pnpm --filter frontend run test:e2e --grep "Subgroup E3" --workers=2
```

### All Tests

```bash
# Run all Group E tests
pnpm --filter frontend run test:e2e tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts
```

## SSOT Compliance

The test file strictly follows SSOT principles:

```typescript
// ✅ Import from SSOT packages
import { EquipmentStatus, NonConformanceStatus } from '@equipment-management/schemas';
import { Permission } from '@equipment-management/shared-constants';

// ✅ Use backend test-login endpoint for authentication
const token = await loginAsRole(request, 'lab_manager');

// ✅ Use NextAuth callback for frontend login
await loginToFrontend(page, 'lab_manager');
```

## Key Features

1. **Hybrid API + UI Testing**: Combines API requests for setup/verification with UI testing for user-facing features
2. **Realistic Workflows**: Tests complete user journeys from detection to resolution
3. **Data Consistency**: Verifies system handles multiple equipment states correctly
4. **Concurrency Safety**: Tests duplicate prevention and rapid successive calls
5. **Auto-Correction Logic**: Verifies calibration approval triggers NC auto-correction
6. **Selective Correction**: Tests that only calibration_overdue NCs are auto-corrected, not other NC types

## Helper Functions

The test file includes comprehensive helper functions:

- `loginAsRole()`: Get JWT token from backend
- `createTestEquipment()`: Create test equipment with specific properties
- `createNonConformance()`: Create NC records
- `createCalibration()`: Create calibration records
- `approveCalibration()`: Approve calibration records
- `getEquipment()`: Fetch equipment by ID
- `getNonConformances()`: Fetch NCs by equipment ID
- `loginToFrontend()`: Login to frontend using NextAuth

## Expected Test Outcomes

All 5 tests should pass with the following characteristics:

- **Test 5.1**: Longest test (~10-15 seconds) - full workflow
- **Test 5.2**: Medium test (~8-10 seconds) - multiple equipment
- **Test 5.3**: Medium test (~8-10 seconds) - multiple NCs
- **Test 5.4**: Medium test (~8-10 seconds) - UI refresh verification
- **Test 5.5**: Fast test (~5-7 seconds) - duplicate prevention

## Error Handling

The test file includes robust error handling:

- All API requests check response status
- Failed requests throw descriptive errors
- Console logging for debugging
- Proper timeout handling for UI elements

## Next Steps

1. Run the tests to verify functionality:

   ```bash
   cd apps/frontend
   pnpm run test:e2e tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts
   ```

2. Review test results and fix any failures

3. Add to CI/CD pipeline for automated testing

4. Create seed file if needed for consistent test data

## Related Files

- Main test file: `tests/e2e/calibration-overdue-auto-nc/e2e-workflow.spec.ts`
- Other test groups:
  - Group A: API Manual Trigger Tests
  - Group B: Auto-Scheduler Tests (if implemented)
  - Group C: Auto-Correction Tests (if implemented)
  - Group D: Incident History UI Tests
