/**
 * Equipment Create - Form Validation Tests
 *
 * Test Suite: 폼 유효성 검사
 * Seed File: apps/frontend/tests/e2e/equipment-create/seed.spec.ts
 *
 * spec: Test management number serial format validation
 *
 * Format Rules:
 * - Must be 4-digit number (0001-9999)
 * - Non-numeric characters are auto-filtered by input handler
 * - maxLength=4 enforces length constraint
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폼 유효성 검사', () => {
  test('관리번호 일련번호 형식 검증', async ({ techManagerPage: page }) => {
    // 1. Navigate to equipment create page
    await page.goto('/equipment/create');
    await expect(page.getByRole('heading', { name: '장비 등록' })).toBeVisible();

    // 2. 사이트/팀: 기술책임자는 자동 설정 (disabled)
    await expect(page.getByRole('combobox', { name: '사이트 *' })).toBeDisabled();
    await expect(page.getByRole('combobox', { name: '팀 *' })).toBeDisabled();

    const serialNumberInput = page
      .getByLabel(/일련번호.*4자리/i)
      .or(page.locator('input[name="managementSerialNumberStr"]'));

    // 3. Test: Non-numeric input 'abc' should be filtered out
    await serialNumberInput.fill('abc');
    await expect(serialNumberInput).toHaveValue(''); // Auto-filtered by onChange handler
    console.log('✓ Non-numeric input correctly filtered');

    // 4. Verify helper text is visible
    const formDescription = page.locator('text=/0001.*9999/i');
    await expect(formDescription).toBeVisible();

    // 5. Test: 5-digit input '12345' should be truncated to '1234'
    await serialNumberInput.fill('12345');
    await expect(serialNumberInput).toHaveValue('1234'); // maxLength=4 enforces this
    console.log('✓ Length constraint enforced (maxLength=4)');

    // 6. Verify preview shows truncated value
    await page.getByLabel('장비명').click(); // Blur to update preview
    await expect(page.getByText('→ SUW-E1234')).toBeVisible();

    // 7. Test: Valid 4-digit input '0123' should work
    await serialNumberInput.click();
    await serialNumberInput.clear();
    await serialNumberInput.fill('0123');
    await expect(serialNumberInput).toHaveValue('0123');
    console.log('✓ Valid 4-digit input accepted');

    // 8. Verify preview updates to new value
    await page.getByLabel('장비명').click();
    await expect(page.getByText('→ SUW-E0123')).toBeVisible();

    console.log('✅ Management number serial format validation test passed');
    console.log('   - Non-numeric input: Filtered ✓');
    console.log('   - 5-digit input: Truncated to 4 digits ✓');
    console.log('   - Valid 4-digit input: Accepted ✓');
  });
});
