# Group 1: Equipment Information Display Tests

## Overview

This test group verifies the equipment detail page information display functionality. All tests are **read-only** and can be executed in parallel.

## Test Files

| Test ID | File                              | Description                                     | Dependencies |
| ------- | --------------------------------- | ----------------------------------------------- | ------------ |
| Seed    | `seed.spec.ts`                    | Verifies test equipment exists in database      | None         |
| 1.1     | `basic-information.spec.ts`       | Display basic equipment information             | seed.spec.ts |
| 1.2     | `calibration-display.spec.ts`     | Display calibration information and D-day badge | seed.spec.ts |
| 1.3     | `location-info.spec.ts`           | Display location and management information     | seed.spec.ts |
| 1.4     | `shared-equipment-banner.spec.ts` | Display shared equipment banner                 | seed.spec.ts |
| 1.5     | `non-conformance-banner.spec.ts`  | Display non-conformance warning banner          | seed.spec.ts |
| 1.6     | `not-found-handling.spec.ts`      | Handle non-existent equipment ID (404)          | seed.spec.ts |

## Test Data Requirements

The tests expect the following equipment in the database:

- **EQP-001**: Basic equipment (available status)
- **EQP-002**: Equipment with upcoming calibration (D-5)
- **EQP-003**: Equipment with overdue calibration (D+61)
- **EQP-004**: Equipment with complete location info
- **EQP-005**: Shared equipment (isShared: true)
- **EQP-006**: Non-conforming equipment with open non-conformances

If specific test equipment is not available, tests will attempt to use any available equipment and verify the corresponding UI behavior.

## Running the Tests

### Run all Group 1 tests in parallel:

```bash
cd apps/frontend
npx playwright test tests/e2e/equipment-detail/group1-information/ --workers=6
```

### Run individual tests:

```bash
# Basic information
npx playwright test tests/e2e/equipment-detail/group1-information/basic-information.spec.ts

# Calibration display
npx playwright test tests/e2e/equipment-detail/group1-information/calibration-display.spec.ts

# Location info
npx playwright test tests/e2e/equipment-detail/group1-information/location-info.spec.ts

# Shared equipment banner
npx playwright test tests/e2e/equipment-detail/group1-information/shared-equipment-banner.spec.ts

# Non-conformance banner
npx playwright test tests/e2e/equipment-detail/group1-information/non-conformance-banner.spec.ts

# 404 handling
npx playwright test tests/e2e/equipment-detail/group1-information/not-found-handling.spec.ts
```

### Run only on Chromium (recommended):

```bash
npx playwright test tests/e2e/equipment-detail/group1-information/ --project=chromium
```

## Test Characteristics

- **Type**: Read-only, no state changes
- **Parallel Execution**: ✅ Yes (all tests are independent)
- **Authentication**: Uses `testOperatorPage` or `siteAdminPage` fixtures
- **Browser Support**: Chromium only (skips other browsers)
- **Expected Duration**: 1-2 minutes (parallel execution)

## Test Coverage

### 1.1 Basic Information (basic-information.spec.ts)

- ✅ Page title displays equipment name
- ✅ Header shows name, model, management number, serial number
- ✅ Status badge with correct color and icon
- ✅ Basic information section displays all fields

### 1.2 Calibration Display (calibration-display.spec.ts)

- ✅ Primary status badge shows '사용 가능'
- ✅ Separate calibration D-day badge (e.g., '6일 후 교정 만료')
- ✅ Overdue calibration shows 'D+61' with warning styling
- ✅ No calibration badge for retired/non-conforming/spare status

### 1.3 Location Information (location-info.spec.ts)

- ✅ '위치 및 관리 정보' section exists
- ✅ Site, team, location information displayed
- ✅ Installation date shown (or '-' if empty)
- ✅ Icons present for visual clarity

### 1.4 Shared Equipment Banner (shared-equipment-banner.spec.ts)

- ✅ Blue alert banner with title '공용장비 안내'
- ✅ Banner explains shared equipment restrictions
- ✅ Banner states editing/deletion disabled
- ✅ Banner not displayed for non-shared equipment

### 1.5 Non-conformance Banner (non-conformance-banner.spec.ts)

- ✅ Warning banner displayed for non-conforming equipment
- ✅ Banner shows list of open non-conformances
- ✅ Each NC shows date, severity, description
- ✅ No warning banner for equipment without NCs

### 1.6 404 Handling (not-found-handling.spec.ts)

- ✅ 404 error page displayed
- ✅ Error message explains equipment not found
- ✅ 'Back to Equipment List' button exists
- ✅ Navigation back to /equipment works
- ✅ Page maintains proper layout and styling

## Success Criteria

All tests should pass with:

- ✅ No console errors (except expected 404 errors in test 1.6)
- ✅ All required UI elements visible and accessible
- ✅ Correct text and styling for status badges and banners
- ✅ Proper handling of missing or optional data
- ✅ Accessible navigation and error recovery

## Troubleshooting

### Tests are skipped

- Ensure you're running on Chromium browser: `--project=chromium`
- Check that the application is running on `http://localhost:3000`

### Equipment not found errors

- Run seed file first to verify equipment list is accessible
- Check database has equipment records
- Verify authentication is working (session cookies set)

### Banner tests fail

- Verify test data includes shared and non-conforming equipment
- Check that equipment status is correctly set in database
- Ensure banner components are rendered in EquipmentDetailClient

### 404 test fails

- Verify error page component exists at `/equipment/[id]/error.tsx` or `/equipment/[id]/not-found.tsx`
- Check that error boundary handles missing equipment
- Ensure back navigation link is properly rendered

## Related Documentation

- **Test Plan**: `/home/kmjkds/equipment_management_system/equipment-detail.plan.md`
- **Execution Groups**: `/home/kmjkds/equipment_management_system/specs/test-execution-groups.md`
- **Component**: `/home/kmjkds/equipment_management_system/apps/frontend/components/equipment/EquipmentDetailClient.tsx`
- **Auth Fixture**: `/home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

## Notes

- All tests use the `testOperatorPage` or `siteAdminPage` fixtures for authentication
- Tests are resilient to missing test data - they verify behavior with available equipment
- Each test includes detailed console logging for debugging
- Tests follow Next.js 16 patterns and accessibility best practices
