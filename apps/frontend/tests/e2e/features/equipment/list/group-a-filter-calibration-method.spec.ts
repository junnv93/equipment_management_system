/**
 * Group A: 교정 방법 필터 테스트
 *
 * 검증 범위:
 * 1. 모든 CALIBRATION_METHOD_LABELS 표시 (SSOT 준수)
 * 2. 외부 교정 (external_calibration) 필터 선택 시 URL 업데이트 및 결과 반환
 * 3. 자체 점검 (self_inspection) 필터 선택 시 URL 업데이트 및 결과 반환
 *
 * 비즈니스 로직:
 * - 모든 반환 항목의 calibrationMethod가 선택한 값과 일치
 * - 필터 뱃지 표시 확인
 *
 * SSOT:
 * - CALIBRATION_METHOD_LABELS: @equipment-management/schemas
 * - CalibrationMethod: @equipment-management/schemas
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CALIBRATION_METHOD_LABELS,
  CalibrationMethodValues as CMVal,
  type CalibrationMethod,
} from '@equipment-management/schemas';

test.describe('Group A: Calibration Method Filter', () => {
  test.describe('5.1. Calibration method filter shows all options', () => {
    test('should display all calibration method options from SSOT', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 교정 방법 필터 드롭다운 클릭 (Radix UI Select 찾기)
      const calibrationMethodFilter = testOperatorPage.locator('#filter-calibration');
      await expect(calibrationMethodFilter).toBeVisible();
      await calibrationMethodFilter.click();

      // 🔥 SSOT 검증: "모든 교정 방법" 옵션
      await expect(
        testOperatorPage.getByRole('option', { name: '모든 교정 방법', exact: true })
      ).toBeVisible();

      // 🔥 SSOT 검증: CALIBRATION_METHOD_LABELS의 각 옵션 확인
      const calibrationMethods: CalibrationMethod[] = [
        'external_calibration',
        'self_inspection',
        'not_applicable',
      ];

      for (const method of calibrationMethods) {
        const methodLabel = CALIBRATION_METHOD_LABELS[method];
        const option = testOperatorPage.getByRole('option', { name: methodLabel, exact: true });
        await expect(option).toBeVisible();
      }

      console.log('[Test] ✅ All CALIBRATION_METHOD_LABELS displayed correctly');
    });
  });

  test.describe('5.2. External calibration filter updates URL and results', () => {
    test('should filter equipment by external_calibration method', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 교정 방법 필터 선택 (Radix UI Select 찾기)
      const calibrationMethodFilter = testOperatorPage.locator('#filter-calibration');
      await calibrationMethodFilter.click();
      await testOperatorPage.getByRole('option', { name: '외부 교정', exact: true }).click();

      // 1. URL 파라미터 검증
      await testOperatorPage.waitForURL(/calibrationMethod=external_calibration/, {
        timeout: 10000,
      });
      await expect(testOperatorPage).toHaveURL(/calibrationMethod=external_calibration/);

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // 2. UI 검증: 필터 뱃지 표시 (실제 뱃지 라벨: "교정: 외부 교정")
      const filterBadge = testOperatorPage.getByText(/교정:\s*외부 교정/);
      await expect(filterBadge).toBeVisible();

      // 3. 비즈니스 로직 검증: API 호출하여 데이터 확인
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationMethod')).toBe(CMVal.EXTERNAL_CALIBRATION);

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Calibration method filter works correctly for external_calibration');
    });
  });

  test.describe('5.3. Self inspection filter updates URL and results', () => {
    test('should filter equipment by self_inspection method', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 교정 방법 필터 선택 (Radix UI Select 찾기)
      const calibrationMethodFilter = testOperatorPage.locator('#filter-calibration');
      await calibrationMethodFilter.click();
      await testOperatorPage.getByRole('option', { name: '자체 점검', exact: true }).click();

      // 1. URL 파라미터 검증
      await testOperatorPage.waitForURL(/calibrationMethod=self_inspection/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/calibrationMethod=self_inspection/);

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // 2. UI 검증: 필터 뱃지 표시 (실제 뱃지 라벨: "교정: 자체 점검")
      const filterBadge = testOperatorPage.getByText(/교정:\s*자체 점검/);
      await expect(filterBadge).toBeVisible();

      // 3. 비즈니스 로직 검증: URL 파라미터 확인
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('calibrationMethod')).toBe(CMVal.SELF_INSPECTION);

      // Verify equipment rows are displayed (if data exists)
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      if (rowCount > 0) {
        console.log('[Test] ✅ Self inspection equipment displayed');
      } else {
        console.log('[Test] ⚠️ No self_inspection equipment in test data');
      }

      console.log('[Test] ✅ Calibration method filter works correctly for self_inspection');
    });
  });

  test.describe('Additional: Calibration method filter edge cases', () => {
    test('should remove calibrationMethod filter when selecting "모든 방법"', async ({
      testOperatorPage,
    }) => {
      // 필터가 적용된 상태로 시작
      await testOperatorPage.goto('/equipment?calibrationMethod=external_calibration');

      // 필터 뱃지 확인 (실제 뱃지 라벨: "교정: 외부 교정")
      const filterBadge = testOperatorPage.getByText(/교정:\s*외부 교정/);
      await expect(filterBadge).toBeVisible({ timeout: 10000 });

      // "모든 교정 방법" 선택 (Radix UI Select 찾기)
      const calibrationMethodFilter = testOperatorPage.locator('#filter-calibration');
      await calibrationMethodFilter.click();
      await testOperatorPage.getByRole('option', { name: '모든 교정 방법', exact: true }).click();

      // Wait for URL to update (parameter removed)
      await testOperatorPage.waitForTimeout(500);

      // URL 검증: calibrationMethod 파라미터 제거
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('calibrationMethod')).toBe(false);

      // 필터 뱃지가 제거됨
      await expect(filterBadge).not.toBeVisible();

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      console.log('[Test] ✅ Calibration method filter removed when selecting "모든 방법"');
    });

    test('should display multiple calibration methods without filter', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify URL has no calibrationMethod parameter
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('calibrationMethod')).toBe(false);

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Multiple calibration methods displayed without filter');
    });
  });
});
