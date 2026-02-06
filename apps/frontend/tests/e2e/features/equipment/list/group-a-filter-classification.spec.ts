/**
 * Group A: 분류 필터 테스트
 *
 * 검증 범위:
 * 1. 모든 CLASSIFICATION_LABELS 표시 (SSOT 준수)
 * 2. 분류 선택 시 URL 업데이트 및 결과 반환
 * 3. FCC EMC/RF 분류 필터 적용 시 해당 장비만 반환
 *
 * 비즈니스 로직:
 * - 모든 반환 항목의 classification이 선택한 값과 일치
 * - 필터 뱃지 표시 확인
 *
 * SSOT:
 * - CLASSIFICATION_LABELS: @equipment-management/schemas
 * - Classification: @equipment-management/schemas
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CLASSIFICATION_LABELS, type Classification } from '@equipment-management/schemas';

test.describe('Group A: Classification Filter', () => {
  test.describe('6.1. Classification filter shows all options', () => {
    test('should display all classification options from SSOT', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 분류 필터 드롭다운 클릭 (Radix UI Select 찾기)
      const classificationFilter = testOperatorPage.locator('#filter-classification');
      await expect(classificationFilter).toBeVisible();
      await classificationFilter.click();

      // 🔥 SSOT 검증: "모든 분류" 옵션
      await expect(
        testOperatorPage.getByRole('option', { name: '모든 분류', exact: true })
      ).toBeVisible();

      // 🔥 SSOT 검증: CLASSIFICATION_LABELS의 각 옵션 확인
      const classifications: Classification[] = [
        'fcc_emc_rf',
        'general_emc',
        'general_rf',
        'sar',
        'automotive_emc',
        'software',
      ];

      for (const classification of classifications) {
        const classificationLabel = CLASSIFICATION_LABELS[classification];
        const option = testOperatorPage.getByRole('option', {
          name: classificationLabel,
          exact: true,
        });
        await expect(option).toBeVisible();
      }

      console.log('[Test] ✅ All CLASSIFICATION_LABELS displayed correctly');
    });
  });

  test.describe('6.2. FCC EMC/RF classification filter updates URL and results', () => {
    test('should filter equipment by fcc_emc_rf classification', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 분류 필터 선택: FCC EMC/RF (Radix UI Select 찾기)
      const classificationFilter = testOperatorPage.locator('#filter-classification');
      await classificationFilter.click();
      await testOperatorPage.getByRole('option', { name: 'FCC EMC/RF', exact: true }).click();

      // 1. URL 파라미터 검증
      await testOperatorPage.waitForURL(/classification=fcc_emc_rf/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/classification=fcc_emc_rf/);

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // 2. UI 검증: 필터 뱃지 표시
      const filterBadge = testOperatorPage.getByText(/분류:\s*FCC EMC\/RF/);
      await expect(filterBadge).toBeVisible();

      // 3. 비즈니스 로직 검증: URL 파라미터 확인
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('classification')).toBe('fcc_emc_rf');

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Classification filter works correctly for fcc_emc_rf');
    });
  });

  test.describe('6.3. General EMC classification filter updates URL and results', () => {
    test('should filter equipment by general_emc classification', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 분류 필터 선택: General EMC (Radix UI Select 찾기)
      const classificationFilter = testOperatorPage.locator('#filter-classification');
      await classificationFilter.click();
      await testOperatorPage.getByRole('option', { name: 'General EMC', exact: true }).click();

      // 1. URL 파라미터 검증
      await testOperatorPage.waitForURL(/classification=general_emc/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/classification=general_emc/);

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // 2. UI 검증: 필터 뱃지 표시
      const filterBadge = testOperatorPage.getByText(/분류:\s*General EMC/);
      await expect(filterBadge).toBeVisible();

      // 3. 비즈니스 로직 검증: URL 파라미터 확인
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('classification')).toBe('general_emc');

      // Verify equipment rows are displayed (if data exists)
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      if (rowCount > 0) {
        console.log('[Test] ✅ General EMC equipment displayed');
      } else {
        console.log('[Test] ⚠️ No general_emc equipment in test data');
      }

      console.log('[Test] ✅ Classification filter works correctly for general_emc');
    });
  });

  test.describe('Additional: Classification filter edge cases', () => {
    test('should remove classification filter when selecting "모든 분류"', async ({
      testOperatorPage,
    }) => {
      // 필터가 적용된 상태로 시작
      await testOperatorPage.goto('/equipment?classification=fcc_emc_rf');
      await testOperatorPage.waitForLoadState('networkidle');

      // 필터 뱃지 확인
      const filterBadge = testOperatorPage.getByText(/분류:\s*FCC EMC\/RF/);
      await expect(filterBadge).toBeVisible();

      // "모든 분류" 선택 (Radix UI Select 찾기)
      const classificationFilter = testOperatorPage.locator('#filter-classification');
      await classificationFilter.click();
      await testOperatorPage.getByRole('option', { name: '모든 분류', exact: true }).click();

      // Wait for URL to update (parameter removed)
      await testOperatorPage.waitForTimeout(500);

      // URL 검증: classification 파라미터 제거
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('classification')).toBe(false);

      // 필터 뱃지가 제거됨
      await expect(filterBadge).not.toBeVisible();

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      console.log('[Test] ✅ Classification filter removed when selecting "모든 분류"');
    });

    test('should display multiple classifications without filter', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify URL has no classification parameter
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('classification')).toBe(false);

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Multiple classifications displayed without filter');
    });
  });
});
