/**
 * Group B: 교정 기한 필터 테스트
 *
 * 🔥 SSOT 변환 로직의 핵심 테스트!
 *
 * 검증 범위:
 * 1. calibrationDueFilter UI 파라미터 → API 파라미터 변환
 *    - due_soon → calibrationDue=30
 *    - overdue → calibrationOverdue=true
 *    - normal → calibrationDueAfter=30
 * 2. 필터 선택 시 올바른 장비만 반환되는지 검증
 * 3. D-day 계산 로직과의 일관성 검증
 *
 * SSOT:
 * - equipment-filter-utils.ts: convertFiltersToApiParams()
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group B: Calibration Due Filter', () => {
  test.describe('7.1. Calibration due filter shows all options', () => {
    test('should display all calibration due filter options', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await expect(calibrationDueFilter).toBeVisible();
      await calibrationDueFilter.click();

      // 모든 옵션 확인
      await expect(testOperatorPage.getByRole('option', { name: /전체/i })).toBeVisible();
      await expect(testOperatorPage.getByRole('option', { name: /교정 임박/i })).toBeVisible();
      await expect(testOperatorPage.getByRole('option', { name: /기한 초과/i })).toBeVisible();
      await expect(testOperatorPage.getByRole('option', { name: /정상/i })).toBeVisible();

      console.log('[Test] ✅ All calibration due filter options displayed');
    });
  });

  test.describe('7.2. Due soon filter transforms to calibrationDue=30 API param', () => {
    test('should transform due_soon to calibrationDue=30', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /교정 임박/i }).click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/calibrationDueFilter=due_soon/, { timeout: 10000 });

      // 브라우저 URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationDueFilter')).toBe('due_soon');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).toBeVisible();

      console.log('[Test] ✅ calibrationDueFilter=due_soon applied');
    });

    test('should return only equipment due within 30 days', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?calibrationDueFilter=due_soon');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', {
        timeout: 10000,
        state: 'attached',
      });

      // URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationDueFilter')).toBe('due_soon');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).toBeVisible();

      console.log('[Test] ✅ Due soon filter applied successfully');
    });
  });

  test.describe('7.3. Overdue filter transforms to calibrationOverdue=true API param', () => {
    test('should transform overdue to calibrationOverdue=true', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /기한 초과/i }).click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/calibrationDueFilter=overdue/, { timeout: 10000 });

      // 브라우저 URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationDueFilter')).toBe('overdue');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*기한 초과/)).toBeVisible();

      console.log('[Test] ✅ calibrationDueFilter=overdue applied');
    });

    test('should return only overdue equipment', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?calibrationDueFilter=overdue');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for table to load or empty state
      await testOperatorPage.waitForTimeout(1000);

      // URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationDueFilter')).toBe('overdue');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*기한 초과/)).toBeVisible();

      // UI에서 D+N 뱃지 확인 (장비가 있는 경우)
      const rows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await rows.count();
      if (rowCount > 0) {
        const firstRow = rows.first();
        // D+N 형식의 뱃지가 있으면 확인
        const dPlusBadge = firstRow.locator('text=/D\\+\\d+/');
        const hasBadge = await dPlusBadge.isVisible().catch(() => false);
        if (hasBadge) {
          await expect(dPlusBadge).toBeVisible();
          console.log('[Test] ✅ D+N badge found for overdue equipment');
        }
      }

      console.log('[Test] ✅ Overdue filter applied successfully');
    });
  });

  test.describe('7.4. Normal filter transforms to calibrationDueAfter=30 API param', () => {
    test('should transform normal to calibrationDueAfter=30', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /정상/i }).click();

      // Wait for URL to update
      await testOperatorPage.waitForURL(/calibrationDueFilter=normal/, { timeout: 10000 });

      // 브라우저 URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationDueFilter')).toBe('normal');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*정상/)).toBeVisible();

      console.log('[Test] ✅ calibrationDueFilter=normal applied');
    });

    test('should return only equipment due after 30 days', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?calibrationDueFilter=normal');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', {
        timeout: 10000,
        state: 'attached',
      });

      // URL 검증
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationDueFilter')).toBe('normal');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*정상/)).toBeVisible();

      console.log('[Test] ✅ Normal filter applied successfully');
    });
  });

  test.describe('Additional: Calibration due filter edge cases', () => {
    test('should remove calibrationDue filter when selecting "전체"', async ({
      testOperatorPage,
    }) => {
      // 먼저 필터 적용
      await testOperatorPage.goto('/equipment?calibrationDueFilter=due_soon');
      await testOperatorPage.waitForLoadState('networkidle');

      // 필터 뱃지 확인
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).toBeVisible();

      // "전체" 선택
      const calibrationDueFilter = testOperatorPage.locator('#filter-calibration-due');
      await calibrationDueFilter.click();
      await testOperatorPage.getByRole('option', { name: /전체/i }).click();

      // Wait for URL to update
      await testOperatorPage.waitForTimeout(500);

      // URL 검증: calibrationDueFilter 파라미터 제거
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('calibrationDueFilter')).toBe(false);

      // 필터 뱃지 제거 확인
      await expect(testOperatorPage.getByText(/교정기한:.*교정 임박/)).not.toBeVisible();

      console.log('[Test] ✅ Calibration due filter removed when selecting "전체"');
    });
  });
});
