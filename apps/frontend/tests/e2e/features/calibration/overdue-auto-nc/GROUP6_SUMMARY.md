# Group 6: Non-Conformance Banner UI Tests - Summary

## Files Created

### 1. Seed File

**Path:** `/home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-nc-banner.spec.ts`

**Purpose:** Verifies that test equipment with non-conforming status exists in the database before running UI tests.

**Key Features:**

- Filters equipment list by `non_conforming` status
- Ensures at least one equipment item is available for testing
- Uses Lab Manager role (`siteAdminPage`) for full access

### 2. Test File

**Path:** `/home/kmjkds/equipment_management_system/apps/frontend/tests/e2e/calibration-overdue-auto-nc/nc-banner-ui.spec.ts`

**Purpose:** Validates the Non-Conformance Banner display on equipment detail pages with calibration_overdue non-conformances.

## Test Coverage (3 Tests)

### Test 6.1: Display NC Banner on Equipment Detail Page

**Verifies:**

- Alert banner appears with '부적합 상태' heading
- Banner shows count of non-conformances (e.g., '1건')
- Banner shows cause text containing '교정 기한 초과' (Calibration Overdue)
- Banner shows discovery date in YYYY-MM-DD format
- Banner has warning/destructive styling

**Steps:**

1. Navigate to equipment detail page with non_conforming status
2. Locate alert banner with '부적합 상태' text
3. Verify heading, count badge, cause text, and discovery date are visible

### Test 6.2: Show '부적합 관리' Link to NC Management

**Verifies:**

- '부적합 관리' button/link is visible in the banner
- Clicking navigates to `/equipment/{id}/non-conformance` page
- Non-conformance management page loads correctly

**Steps:**

1. Locate non-conformance banner on equipment detail page
2. Find and click '부적합 관리' button/link
3. Verify URL contains '/non-conformance'
4. Verify page heading contains '부적합'

### Test 6.3: Display Equipment Status as '부적합' in Header

**Verifies:**

- Equipment status badge shows '부적합'
- Calibration status badge shows D+X (days overdue) if applicable
- Both badges are visible in the equipment header section

**Steps:**

1. Locate equipment header section
2. Verify '부적합' status badge is displayed
3. Verify calibration D+X badge is displayed (if calibration overdue)
4. Confirm both badges are in the status area

## Test Architecture

### Authentication

- Uses NextAuth test fixture (`siteAdminPage`) for Lab Manager role
- Fixture handles CSRF token and session management
- See: `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`

### Test Data Strategy

- Tests use existing equipment with `non_conforming` status
- Seed file verifies equipment availability before test execution
- Filter by status to find suitable test equipment dynamically

### SSOT (Single Source of Truth) Compliance

- Equipment status values imported from `@equipment-management/schemas`
- Korean labels match domain terminology from UL-QP-18
- No hardcoded enums or magic strings

### Browser Compatibility

- Tests run on Chromium only (`test.beforeEach` skip for other browsers)
- Prevents duplicate test execution across multiple browsers
- Configurable via `testInfo.project.name`

## Running the Tests

### Prerequisites

1. Start backend server: `pnpm --filter backend run dev` (port 3001)
2. Start frontend server: `pnpm --filter frontend run dev` (port 3000)
3. Ensure database has equipment with `non_conforming` status

### Execution Commands

```bash
# Run seed file first
cd apps/frontend
pnpm exec playwright test seed-nc-banner.spec.ts

# Run all Group 6 tests
pnpm exec playwright test nc-banner-ui.spec.ts

# Run specific test
pnpm exec playwright test nc-banner-ui.spec.ts -g "6.1"

# Run with UI mode for debugging
pnpm exec playwright test nc-banner-ui.spec.ts --ui

# Run with headed browser
pnpm exec playwright test nc-banner-ui.spec.ts --headed
```

### Expected Results

- All 3 tests should pass if equipment with calibration_overdue NC exists
- Tests will skip gracefully if no suitable equipment is found
- Console logs provide debugging information for each step

## Test Dependencies

### Required Equipment State

- Equipment `status` = `'non_conforming'`
- Non-conformance record with `ncType` = `'calibration_overdue'`
- Non-conformance `status` = `'open'` or `'analyzing'`
- Equipment `nextCalibrationDate` < today (overdue)

### Component Under Test

- Equipment Detail Page: `apps/frontend/app/(dashboard)/equipment/[id]/page.tsx`
- NonConformance Banner Component (location TBD)
- Equipment Header Component: `apps/frontend/components/equipment/EquipmentHeader.tsx`

### Related Backend APIs

- `GET /api/equipment/{id}` - Equipment details
- `GET /api/non-conformances?equipmentId={id}` - NC records
- `POST /api/notifications/trigger-overdue-check` - Manual overdue check

## Troubleshooting

### Issue: No NC banner visible

**Solution:**

- Verify equipment has active non-conformance: `status IN ('open', 'analyzing')`
- Check banner component is rendering alert role
- Run manual overdue check to create NC: `POST /api/notifications/trigger-overdue-check`

### Issue: Tests skipped

**Reason:** No equipment with `non_conforming` status found in database
**Solution:**

- Create test equipment via API or UI
- Run calibration overdue scheduler manually
- Check equipment filter criteria (status, calibrationRequired, isActive)

### Issue: Navigation to NC management fails

**Reason:** Link selector not matching actual component structure
**Solution:**

- Inspect page HTML to verify button/link text
- Update selector in test if component changed
- Check for conditional rendering based on permissions

## Next Steps

After verifying these tests pass:

1. Integrate with CI/CD pipeline
2. Add visual regression testing for banner styling
3. Test accessibility compliance (ARIA roles, keyboard navigation)
4. Add test for multiple concurrent non-conformances
5. Verify banner behavior when NC is resolved (should disappear)

## References

- Test Plan: `apps/frontend/tests/e2e/calibration-overdue-auto-nc-v2.plan.md`
- Auth Fixture: `apps/frontend/tests/e2e/fixtures/auth.fixture.ts`
- CLAUDE.md: `/home/kmjkds/equipment_management_system/CLAUDE.md`
- NextAuth Setup: `apps/frontend/lib/auth.ts`
