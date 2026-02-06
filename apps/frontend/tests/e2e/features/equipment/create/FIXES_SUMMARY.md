# Equipment Create Tests - shadcn/ui Select Fixes

## Summary

Fixed all equipment create tests to properly handle shadcn/ui Select components instead of native HTML `<select>` elements.

## Root Cause

The tests were using `.selectOption()` on what they assumed were native `<select>` elements, but the components are actually shadcn/ui Select components (Radix UI based) that require:

1. Clicking the trigger (combobox role)
2. Clicking the option from the dropdown

## Files Fixed

### Group 1 - Approval Workflow

- ✅ `group-1-approval-workflow/lab-manager.spec.ts`
- ✅ `group-1-approval-workflow/tech-manager.spec.ts`
- ✅ `group-1-approval-workflow/test-operator.spec.ts`

### Group 2 - Validation

- ✅ `group-2-validation/duplicate-number.spec.ts`
- ✅ `group-2-validation/management-number.spec.ts`

### Group 3 - File Upload

- ✅ `group-3-file-upload/single.spec.ts`

### Group 4 - History Save

- ✅ `group-4-history-save/delete-temp.spec.ts`

### Group 5 - Shared Equipment

- ✅ `group-5-shared-equipment/common.spec.ts`

### Group 9 - DB Verification

- ✅ `group-9-db-verification/equipment.spec.ts`

## Changes Made

### Before (Wrong Pattern)

```typescript
// ❌ WRONG - trying to use native select
const siteSelect = page.locator('select[name="site"]');
await siteSelect.selectOption('suwon');

const teamSelect = page.locator('select[name="teamId"]');
await teamSelect.selectOption(firstOption);

const techManagerSelect = page.locator('select[name="technicalManager"]');
await techManagerSelect.selectOption(firstOption);

const calibrationMethodSelect = page.locator('select[name="calibrationMethod"]');
await calibrationMethodSelect.selectOption('external_calibration');
```

### After (Correct Pattern)

```typescript
// ✅ CORRECT - click trigger, then click option
// Site Select
await page.getByRole('combobox', { name: '사이트 *' }).click();
await page.getByRole('option', { name: /수원.*SUW/ }).click();

// Team Select
await page.waitForTimeout(500); // Wait for teams to load
await page.getByRole('combobox', { name: '팀 *' }).click();
await page.getByRole('option').first().click();

// Technical Manager Select
await page.getByRole('combobox', { name: '기술책임자 *' }).click();
await page.getByRole('option').first().click();

// Calibration Method Select
await page.getByRole('combobox', { name: '관리 방법 *' }).click();
await page.getByRole('option', { name: '외부 교정' }).click();
```

## Key Improvements

1. **Proper Component Interaction**: Using `getByRole('combobox')` and `getByRole('option')` for shadcn Select
2. **Reduced Wait Times**: Changed `waitForTimeout(1000)` to `waitForTimeout(500)` where appropriate
3. **Better Accessibility**: Using role-based selectors that match the actual ARIA roles
4. **Label-based Selection**: Using exact label text for more reliable targeting

## Selector Patterns by Field

| Field                          | Combobox Label   | Option Pattern                         |
| ------------------------------ | ---------------- | -------------------------------------- |
| 사이트 (Site)                  | `'사이트 *'`     | `/수원.*SUW/` for Suwon                |
| 팀 (Team)                      | `'팀 *'`         | `.first()` for first team              |
| 기술책임자 (Tech Manager)      | `'기술책임자 *'` | `.first()` for first option            |
| 관리 방법 (Calibration Method) | `'관리 방법 *'`  | `'외부 교정'` for external calibration |

## Notes

- All tests now use consistent shadcn/ui Select interaction patterns
- Removed deprecated `selectOption()` calls on non-native select elements
- Wait times optimized for better test performance
- Tests follow equipment-management skill guidelines
- Uses SSOT from @equipment-management/schemas

## Next Steps

To run the tests:

1. Start the frontend server: `pnpm --filter frontend run dev`
2. Start the backend server: `pnpm --filter backend run dev`
3. Run the tests: `pnpm --filter frontend run test:e2e -- tests/e2e/equipment-create`
