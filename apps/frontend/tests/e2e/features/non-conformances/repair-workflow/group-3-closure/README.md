# Group C: Repair History Form Validation Tests

## Overview

This test group verifies React Hook Form + Zod validation for the repair history form. These tests ensure that the form validation logic works correctly for both required and optional fields, and that the form properly resets after submission.

## Test Files

### C-1: Required Field Validation

**File:** `required-field-validation.spec.ts`

Tests that required fields (repairDate, repairDescription) show validation errors when left empty.

**Key Validations:**

- `repairDate`: z.string().min(1, '수리 일자를 입력하세요')
- `repairDescription`: z.string().min(10, '수리 내용은 최소 10자 이상 입력해야 합니다')

### C-2: Min Length Validation

**File:** `min-length-validation.spec.ts`

Tests that repairDescription must be at least 10 characters long.

**Key Behaviors:**

- Shows error with < 10 characters
- Clears error when >= 10 characters
- Form submission blocked until valid

### C-3: Optional Fields Empty

**File:** `optional-fields-empty.spec.ts`

Tests that form submits successfully with only required fields filled, and that empty optional fields are converted to undefined (not empty strings).

**Optional Fields Tested:**

- repairedBy
- repairCompany
- cost
- repairResult
- notes
- nonConformanceId

### C-4: Cost Validation

**File:** `cost-validation.spec.ts`

Tests that cost field only accepts non-negative numbers (>= 0).

**Key Validations:**

- HTML5: `type='number'` with `min='0'`
- Zod: `z.number().min(0, '수리 비용은 0 이상이어야 합니다').optional()`

### C-5: Form Reset After Submit

**File:** `form-reset-after-submit.spec.ts`

Tests that React Hook Form's `reset()` is called after successful submission.

**Expected Reset Values:**

- repairDate: Today's date (yyyy-MM-dd format)
- repairDescription: Empty string
- Optional fields: Empty/undefined
- nonConformanceId: 'None selected' placeholder

### C-6: NC Dropdown Format

**File:** `nc-dropdown-format.spec.ts`

Tests that the NC dropdown displays correct label format and filtering logic.

**Expected Format:**

- Format: `[TYPE_LABEL] cause_text (YYYY-MM-DD)`
- TYPE_LABEL from SSOT: NON_CONFORMANCE_TYPE_LABELS
  - damage: '손상'
  - malfunction: '오작동'
  - calibration_failure: '교정 실패'
  - measurement_error: '측정 오류'
  - other: '기타'

**Filtering Logic:**

- Only open/analyzing/corrected NCs appear (not closed)
- NCs already linked to repair do not appear

## Running the Tests

```bash
# Run all Group C tests
pnpm test:e2e tests/e2e/nc-repair-workflow/group-c

# Run individual test
pnpm test:e2e tests/e2e/nc-repair-workflow/group-c/required-field-validation.spec.ts

# Run with UI mode
pnpm test:e2e --ui tests/e2e/nc-repair-workflow/group-c
```

## Dependencies

- **Seed:** `tests/e2e/fixtures/auth.fixture.ts`
- **Component:** `components/equipment/RepairHistoryClient.tsx`
- **API:** `lib/api/repair-history-api.ts`
- **SSOT:** `lib/api/non-conformances-api.ts` (NON_CONFORMANCE_TYPE_LABELS)

## Test Architecture

All tests use the `testOperatorPage` fixture which logs in as a `test_engineer` role. This role has permission to:

- View repair history
- Add repair history records
- Link repair records to non-conformances

## Key Testing Patterns

### 1. React Hook Form Validation

Tests verify that Zod schema validation messages appear via FormMessage components:

```typescript
const descriptionError = dialog.locator('text=/수리 내용.*10자|description.*10/i');
await expect(descriptionError).toBeVisible();
```

### 2. Empty Optional Fields

Tests verify that empty optional fields are converted to undefined (not empty strings) before API submission:

```typescript
// Clear optional fields
await repairedByInput.clear();
await repairCompanyInput.clear();
// Backend should receive undefined, not ""
```

### 3. Form Reset Verification

Tests verify that form.reset() is called with default values after successful submission:

```typescript
// After submission
const newDialog = testOperatorPage.getByRole('dialog');
const repairDateValue = await newRepairDateInput.inputValue();
expect(repairDateValue).toBe(new Date().toISOString().split('T')[0]);
```

## Critical Business Rules

1. **Required Fields**: repairDate and repairDescription (10+ chars) must always be filled
2. **Cost Validation**: Must be non-negative (>= 0) if provided
3. **Empty Optionals**: Empty strings converted to undefined for API consistency
4. **Form Reset**: Form resets to default values after successful submission
5. **NC Filtering**: Only unlinked, non-closed NCs appear in dropdown
6. **SSOT Compliance**: NC type labels must use NON_CONFORMANCE_TYPE_LABELS from shared constants

## Troubleshooting

### Test Fails: "Could not extract equipment ID from URL"

- Ensure backend is running: `pnpm --filter backend run dev`
- Ensure database has seed data: `pnpm --filter backend run db:seed`

### Test Fails: "No NC options available"

- This is expected if all NCs are closed or already linked to repairs
- Test creates a new NC if none exist

### Test Fails: "Validation error not visible"

- React Hook Form may debounce validation
- Add `await testOperatorPage.waitForTimeout(500)` after input changes
- Check that FormMessage components are properly rendered

## Migration Notes

These tests were migrated from manual form state management to React Hook Form + Zod validation. Key changes:

- **Before**: Manual state with `setErrors` and inline validation
- **After**: Zod schema with `zodResolver` and `FormMessage` components
- **Benefit**: Type-safe validation, better error messages, automatic form reset

## Related Documentation

- [NC Repair Workflow Plan](../nc-repair-workflow.plan.md)
- [React Hook Form Migration Guide](../../../docs/development/react-hook-form-migration.md)
- [Equipment Management Skill](../../../../../.claude/skills/equipment-management/SKILL.md)
