# Group D: Frontend UI Tests - Incident History Tab Integration

## Overview

This test group validates the **Incident History Registration Dialog UI**, specifically focusing on the `calibration_overdue` incident type integration with the non-conformance creation workflow.

## Test Files

- **Seed File**: `seed-data/seed-incident-history.spec.ts`
- **Test File**: `incident-history-ui.spec.ts`

## Test Suite Structure

### Test 4.1: Incident Type Dropdown Options

**Validates**: All 5 incident types appear in the dropdown selector

- ✅ 손상 (Damage)
- ✅ 오작동 (Malfunction)
- ✅ 변경 (Change)
- ✅ 수리 (Repair)
- ✅ 교정 기한 초과 (Calibration Overdue)

**SSOT Compliance**: Uses `INCIDENT_TYPE_LABELS` from `@equipment-management/schemas`

### Test 4.2: Non-Conformance Checkbox Visibility

**Validates**: Checkbox appears for `calibration_overdue` incident type

- ✅ Checkbox labeled '부적합으로 등록' is visible
- ✅ Yellow background styling (`bg-yellow-50`) applied
- ✅ Description text explains status change

### Test 4.3: Action Plan Field Display

**Validates**: Action plan textarea appears when checkbox is checked

- ✅ '조치 계획' field appears after checkbox selection
- ✅ Marked as optional
- ✅ Placeholder text present

### Test 4.4: Checkbox Hidden for Non-NC Types

**Validates**: Checkbox is hidden for 'Change' and 'Repair' types

- ✅ Hidden for '변경' (Change)
- ✅ Hidden for '수리' (Repair)
- ✅ Only visible for: Damage, Malfunction, Calibration Overdue

### Test 4.5: Successful Incident Creation

**Validates**: Complete workflow from form fill to success confirmation

1. Fill occurred date (today)
2. Select '교정 기한 초과' type
3. Enter content: '교정 기한 7일 초과됨'
4. Check '부적합으로 등록'
5. Enter action plan: '외부 교정기관 교정 예약'
6. Submit form
7. ✅ Success toast: '사고 이력 등록 완료'
8. ✅ Dialog closes
9. ✅ New incident appears in timeline

### Test 4.6: Badge Styling for Calibration Overdue

**Validates**: Purple badge styling for `calibration_overdue` incidents

- ✅ Badge shows '교정 기한 초과'
- ✅ Purple background (`bg-purple-500`)
- ✅ AlertTriangle icon displayed

### Test 4.7: Required Field Validation

**Validates**: Form validation prevents empty submission

- ✅ Error for empty occurred date
- ✅ Error for empty incident type
- ✅ Error for empty content
- ✅ Dialog remains open on validation failure

### Test 4.8: Content Length Limit

**Validates**: 500 character limit enforcement

- ✅ Validation error: '500자 이하로 입력하세요'
- ✅ Form cannot submit until content is shortened

## Running the Tests

### Prerequisites

1. **Start backend and frontend servers**:

   ```bash
   pnpm dev
   ```

2. **Ensure database has test data** (run seed first):
   ```bash
   npx playwright test apps/frontend/tests/e2e/calibration-overdue-auto-nc/seed-data/seed-incident-history.spec.ts
   ```

### Run All Group D Tests

```bash
# Run all 8 UI tests (parallel execution)
npx playwright test apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts --workers=8
```

### Run Specific Tests

```bash
# Run single test
npx playwright test incident-history-ui.spec.ts -g "4.1"

# Run multiple tests
npx playwright test incident-history-ui.spec.ts -g "4.1|4.2|4.3"

# Run with UI mode for debugging
npx playwright test incident-history-ui.spec.ts --ui
```

### Browser Selection

```bash
# Chromium only (default, recommended for CI)
npx playwright test incident-history-ui.spec.ts --project=chromium

# All browsers (Firefox, Safari, Mobile)
npx playwright test incident-history-ui.spec.ts
```

## Parallel Execution

**✅ All 8 tests are parallel-safe** because:

- Each test uses independent browser contexts
- UI rendering tests don't modify shared database state
- Tests validate form behavior, not backend logic

**Recommended worker count**: 8 (one per test)

```bash
npx playwright test incident-history-ui.spec.ts --workers=8
```

## Expected Execution Time

| Execution Mode | Workers | Estimated Time |
| -------------- | ------- | -------------- |
| Sequential     | 1       | ~4 minutes     |
| Parallel       | 8       | ~1 minute      |

## Test Data Requirements

### Equipment Requirements

- At least **1 equipment** in the database
- Status: `available`, `in_use`, or any active status
- Tests use the first available equipment from the list

### No Specific Equipment Needed

- Tests are UI-focused and work with any equipment
- The seed file validates that at least one equipment exists
- Tests automatically select the first available equipment

## Authentication

**Role Used**: `technical_manager` (기술책임자)

**Permissions Required**:

- View equipment details
- Register incident history
- Create non-conformances

**Fixture Used**: `techManagerPage` from `fixtures/auth.fixture.ts`

## Component Under Test

**File**: `apps/frontend/components/equipment/IncidentHistoryTab.tsx`

**Key UI Elements**:

- Incident type dropdown (Select component)
- Non-conformance checkbox (conditional rendering)
- Action plan textarea (conditional rendering)
- Form validation (Zod schema)
- Toast notifications

## Locator Strategy

### Primary Locators (Recommended)

```typescript
// Use role-based locators for accessibility
techManagerPage.getByRole('button', { name: /사고 등록/i });
techManagerPage.getByRole('option', { name: '교정 기한 초과' });
techManagerPage.getByRole('tab', { name: /사고 이력/i });
```

### Fallback Locators

```typescript
// CSS selectors when role-based fails
techManagerPage.locator('button:has-text("사고 등록")');
techManagerPage.locator('button[role="combobox"]').first();
techManagerPage.locator('input[type="checkbox"]').first();
```

### Text-based Locators

```typescript
// For Korean UI elements
techManagerPage.getByText('부적합으로 등록');
techManagerPage.getByText(/500자 이하로 입력하세요/i);
```

## Troubleshooting

### Test Skips (No Equipment Found)

**Symptom**: Tests skip with message "테스트할 장비가 없습니다"

**Solution**:

```bash
# Run database seed to create test equipment
pnpm --filter backend run db:seed
```

### Dialog Not Opening

**Symptom**: "사고 등록 버튼을 찾을 수 없습니다"

**Possible Causes**:

1. Incident History tab not clicked
2. Component not fully loaded
3. Permission issues (wrong role)

**Solution**: Check `beforeEach` hook completes successfully

### Validation Errors Not Showing

**Symptom**: Test 4.7 or 4.8 fails because validation messages don't appear

**Possible Causes**:

1. Form submission prevented by other errors
2. Validation message selector changed
3. React Query mutation in progress

**Solution**: Add `waitForTimeout` after form interaction

### Success Toast Not Appearing

**Symptom**: Test 4.5 fails on toast verification

**Possible Causes**:

1. Backend API error
2. Toast timeout (disappears too quickly)
3. Network latency

**Solution**: Increase timeout in `toBeVisible({ timeout: 5000 })`

## Code Quality Standards

### SSOT Compliance

✅ **Uses shared constants**:

```typescript
import { INCIDENT_TYPE_LABELS } from '@equipment-management/schemas';
expect(INCIDENT_TYPE_LABELS.calibration_overdue).toBe('교정 기한 초과');
```

❌ **Avoid hardcoding values**:

```typescript
// WRONG - hardcoded enum values
expect(incidentType).toBe('calibration_overdue'); // Use INCIDENT_TYPE_LABELS instead
```

### Async/Await Pattern

✅ **All Playwright actions are awaited**:

```typescript
await techManagerPage.click(...);
await techManagerPage.waitForTimeout(500);
await expect(element).toBeVisible();
```

### Error Handling

✅ **Graceful test skips**:

```typescript
if ((await element.count()) === 0) {
  test.skip();
  return;
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
- name: Run Group D Tests
  run: |
    npx playwright test apps/frontend/tests/e2e/calibration-overdue-auto-nc/incident-history-ui.spec.ts \
      --workers=4 \
      --project=chromium \
      --reporter=html
```

### Expected CI Behavior

- **Duration**: ~1-2 minutes (parallel execution)
- **Retries**: 2 (configured in `playwright.config.ts`)
- **Artifacts**: HTML report, screenshots on failure

## Related Documentation

- **Test Plan**: `calibration-overdue-auto-nc.plan.md`
- **Test Groups**: `TEST_GROUPS.md`
- **Auth Fixture**: `fixtures/auth.fixture.ts`
- **Component**: `components/equipment/IncidentHistoryTab.tsx`
- **SSOT Enums**: `packages/schemas/src/enums.ts`

## Success Criteria

All 8 tests should pass with:

- ✅ No test skips (equipment available)
- ✅ No flaky behavior (consistent results)
- ✅ Proper SSOT usage (no hardcoded values)
- ✅ Accessible locators (role-based)
- ✅ Fast execution (< 2 minutes parallel)

## Next Steps

After Group D completion, proceed to:

- **Group A**: Manual Trigger API Tests
- **Group B**: Non-Conformance Creation Tests
- **Group C**: Auto-Correction API Tests
- **Group E**: End-to-End Integration Tests

Total: 29 tests across 5 groups
