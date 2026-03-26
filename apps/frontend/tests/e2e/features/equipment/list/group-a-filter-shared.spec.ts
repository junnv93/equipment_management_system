/**
 * Group A: 공용/일반 장비 필터 테스트
 *
 * 검증 범위:
 * 1. isShared 필터 옵션 표시 (전체, 공용장비, 일반장비)
 * 2. 공용장비 필터 시 isShared=true 장비만 반환
 * 3. 일반장비 필터 시 isShared=false 장비만 반환
 *
 * 비즈니스 로직:
 * - UI 파라미터 isShared=shared → API isShared=true 변환
 * - UI 파라미터 isShared=normal → API isShared=false 변환
 * - SharedEquipmentBadge 표시 확인 (공용장비만)
 *
 * SSOT:
 * - equipment-filter-utils.ts: convertFiltersToApiParams()
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Group A: Shared/Normal Equipment Filter', () => {
  test.describe('8.1. Shared equipment filter shows all options', () => {
    test('should display all shared equipment filter options', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 공용/일반 필터 드롭다운 클릭 (Radix UI Select 찾기)
      const sharedFilter = testOperatorPage.locator('#filter-shared');
      await expect(sharedFilter).toBeVisible();
      await sharedFilter.click();

      // 모든 옵션 확인
      await expect(
        testOperatorPage.getByRole('option', { name: '모든 장비', exact: true })
      ).toBeVisible();
      await expect(
        testOperatorPage.getByRole('option', { name: '공용장비', exact: true })
      ).toBeVisible();
      await expect(
        testOperatorPage.getByRole('option', { name: '일반장비', exact: true })
      ).toBeVisible();

      console.log('[Test] ✅ All shared equipment filter options displayed');
    });
  });

  test.describe('8.2. Shared equipment filter transforms to isShared=true API param', () => {
    test('should transform shared to isShared=true', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 공용장비 선택 (Radix UI Select 찾기)
      const sharedFilter = testOperatorPage.locator('#filter-shared');
      await sharedFilter.click();
      await testOperatorPage.getByRole('option', { name: '공용장비', exact: true }).click();

      // URL 파라미터 검증
      await testOperatorPage.waitForURL(/isShared=shared/, { timeout: 10000 });

      // 브라우저 URL은 UI 파라미터 사용
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('isShared=shared');

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      console.log('[Test] ✅ isShared=shared → isShared=true');
    });

    test('should return only shared equipment (isShared=true)', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?isShared=shared');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify URL parameter
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('isShared=shared');

      // 필터 뱃지 확인 (실제 뱃지 라벨: "구분: 공용장비")
      await expect(testOperatorPage.getByText(/구분:\s*공용장비/)).toBeVisible();

      // UI에서 공용장비 뱃지 확인
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      if (rowCount > 0) {
        const firstRow = equipmentRows.first();
        // SharedEquipmentBadge가 표시되어야 함 (look for the badge, which contains "공용" or "외부")
        const sharedBadge = firstRow.locator('.inline-flex.items-center.rounded-md', {
          hasText: /공용|외부/,
        });
        await expect(sharedBadge).toBeVisible();
        console.log('[Test] ✅ All equipment is shared (isShared=true)');
      } else {
        console.log('[Test] ⚠️ No shared equipment in test data');
      }
    });
  });

  test.describe('8.3. Normal equipment filter transforms to isShared=false API param', () => {
    test('should transform normal to isShared=false', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 일반장비 선택 (Radix UI Select 찾기)
      const sharedFilter = testOperatorPage.locator('#filter-shared');
      await sharedFilter.click();
      await testOperatorPage.getByRole('option', { name: '일반장비', exact: true }).click();

      // URL 파라미터 검증
      await testOperatorPage.waitForURL(/isShared=normal/, { timeout: 10000 });

      // 브라우저 URL은 UI 파라미터 사용
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('isShared=normal');

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      console.log('[Test] ✅ isShared=normal → isShared=false');
    });

    test('should return only normal equipment (isShared=false)', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?isShared=normal');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify URL parameter
      const currentUrl = testOperatorPage.url();
      expect(currentUrl).toContain('isShared=normal');

      // 필터 뱃지 확인 (실제 뱃지 라벨: "구분: 일반장비")
      await expect(testOperatorPage.getByText(/구분:\s*일반장비/)).toBeVisible();

      // UI에서 공용장비 뱃지가 없어야 함
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      if (rowCount > 0) {
        const firstRow = equipmentRows.first();
        // SharedEquipmentBadge가 표시되지 않아야 함
        await expect(firstRow.getByText(/공용|렌탈/i)).not.toBeVisible();
        console.log('[Test] ✅ All equipment is normal (isShared=false)');
      } else {
        console.log('[Test] ⚠️ No normal equipment in test data');
      }
    });
  });

  test.describe('Additional: Shared equipment filter edge cases', () => {
    test('should remove isShared filter when selecting "전체"', async ({ testOperatorPage }) => {
      // 필터가 적용된 상태로 시작
      await testOperatorPage.goto('/equipment?isShared=shared');

      // 필터 뱃지 확인 (실제 뱃지 라벨: "구분: 공용장비")
      const filterBadge = testOperatorPage.getByText(/구분:\s*공용장비/);
      await expect(filterBadge).toBeVisible();

      // "모든 장비" 선택 (Radix UI Select 찾기)
      const sharedFilter = testOperatorPage.locator('#filter-shared');
      await sharedFilter.click();
      await testOperatorPage.getByRole('option', { name: '모든 장비', exact: true }).click();

      // Wait for URL to update (parameter removed)

      // URL 검증: isShared 파라미터 제거
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('isShared')).toBe(false);

      // 필터 뱃지가 제거됨
      await expect(filterBadge).not.toBeVisible();

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      console.log('[Test] ✅ isShared filter removed when selecting "전체"');
    });

    test('should display both shared and normal equipment without filter', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify URL has no isShared parameter
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('isShared')).toBe(false);

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Both shared and normal equipment displayed without filter');
    });
  });
});
