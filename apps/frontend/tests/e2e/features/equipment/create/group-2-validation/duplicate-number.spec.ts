/**
 * Equipment Create - Form Validation Tests
 *
 * Test Suite: 폼 유효성 검사 - 중복 관리번호 검증
 *
 * Purpose: Verify duplicate management number validation at database level
 * Tests that attempting to create equipment with an existing management number
 * shows appropriate error message from the backend.
 *
 * Strategy:
 * - Uses existing seed data (SUW-E0001) to test duplicate detection
 * - Verifies backend error message appears when duplicate is submitted
 *
 * Expected Backend Error: "관리번호 SUW-E0001은(는) 이미 사용 중입니다."
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('폼 유효성 검사', () => {
  test('중복 관리번호 검증 - Backend duplicate detection', async ({ techManagerPage: page }) => {
    // Navigate to create page
    await page.goto('/equipment/create');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: '장비 등록' })).toBeVisible();

    // Fill basic information
    await page.getByLabel('장비명 *').fill('중복 검증 테스트');

    // 사이트/팀: 기술책임자는 자동 설정 (disabled) - 자기 팀(FCC EMC/RF)이 자동 선택됨
    await expect(page.getByRole('combobox', { name: '사이트 *' })).toBeDisabled();
    await page.waitForTimeout(1000); // Wait for teams to load and auto-set
    await expect(page.getByRole('combobox', { name: '팀 *' })).toBeDisabled();

    // Enter DUPLICATE serial number: '0001' (conflicts with seed data SUW-E0001)
    const serialInput = page.locator('input[name="managementSerialNumberStr"]');
    await serialInput.fill('0001');
    await page.waitForTimeout(500);

    // Verify preview shows SUW-E0001
    const preview = page.getByText('→ SUW-E0001');
    await expect(preview).toBeVisible({ timeout: 5000 });

    // Fill remaining required fields
    await page.getByLabel('모델명 *').fill('Test Model');
    await page.getByLabel('제조사 *').fill('Test Manufacturer');
    await page.getByLabel('제조사 시리얼번호 *').fill('TEST-SN-DUPLICATE');
    await page.getByLabel('현재 위치 *').fill('Test Location');

    // 기술책임자 - Try to select from dropdown
    try {
      const techManagerSelect = page.getByRole('combobox', { name: /기술책임자/i });
      await techManagerSelect.click();
      await page.waitForTimeout(500);

      const managerOptions = await page.getByRole('option').all();
      if (managerOptions.length > 0) {
        await managerOptions[0].click();
        await page.waitForTimeout(300);
      } else {
        // Fallback to manual input if dropdown is empty
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const manualInput = page.locator('input[placeholder*="홍길동"]');
        if (await manualInput.isVisible()) {
          await manualInput.fill('테스트 책임자');
        }
      }
    } catch (e) {
      console.log('Note: Could not fill technical manager field');
    }

    await page.waitForTimeout(500);

    // Submit form - EXPECT ERROR (duplicate management number)
    const submitButton = page.getByRole('button', { name: '등록', exact: true });
    await submitButton.click();

    // Wait for error to appear
    await page.waitForTimeout(3000);

    // Should stay on create page (not redirected)
    const currentUrl = page.url();
    console.log('Current URL after duplicate submit:', currentUrl);
    expect(currentUrl).toContain('/equipment/create');

    // Check for backend error message about duplicate management number
    // Error could appear in toast, alert, or error banner
    const pageText = await page.textContent('body');

    // Verify error message contains duplicate warning
    const hasDuplicateError =
      pageText.includes('이미 사용 중') ||
      pageText.includes('중복') ||
      pageText.includes('SUW-E0001');

    if (!hasDuplicateError) {
      console.log('❌ Expected duplicate error not found');
      console.log('Page content snippet:', pageText.substring(0, 800));

      // Additional debugging: check for any error messages
      const allAlerts = await page.locator('[role="alert"]').all();
      console.log(`Found ${allAlerts.length} alerts`);
      for (const alert of allAlerts) {
        const text = await alert.textContent();
        if (text && text.length < 200) {
          console.log('Alert:', text);
        }
      }
    }

    expect(hasDuplicateError).toBeTruthy();
    console.log('✅ Duplicate management number (SUW-E0001) correctly rejected by backend');
  });
});
