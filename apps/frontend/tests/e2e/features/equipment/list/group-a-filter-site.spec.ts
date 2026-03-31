/**
 * Group A: 사이트 필터 테스트
 *
 * 검증 범위:
 * 1. lab_manager의 사이트 필터 옵션 표시
 * 2. 사이트 필터 선택 시 URL 업데이트 및 결과 표시
 * 3. test_engineer의 사이트 필터 표시 및 기본값 적용
 * 4. 사이트 필터 제거 시 URL 파라미터 제거
 *
 * SSOT:
 * - Site: @equipment-management/schemas
 * - SITE_OPTIONS: EquipmentFilters.tsx (프론트엔드 UI 전용)
 *
 * 기본 필터 동작:
 * - 모든 역할: 초기 접속 시 사용자 소속 사이트/팀이 기본 필터로 적용됨
 * - 모든 역할: 사이트 필터 드롭다운을 통해 사이트 변경 가능
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import type { Site } from '@equipment-management/schemas';

test.describe('Group A: Site Filter', () => {
  test.describe('2.1. Site filter shows all options for lab_manager', () => {
    test.fixme(
      'should display all site options including "모든 사이트"',
      async ({ siteAdminPage }) => {
        // lab_manager(siteAdminPage)의 사이트 필터는 EQUIPMENT_DATA_SCOPE(type: 'site')에 따라
        // disabled 상태로 고정됨 — 드롭다운 클릭 불가
        await siteAdminPage.goto('/equipment');

        // 사이트 필터 드롭다운 클릭 (1차 필터 - 항상 표시)
        const siteFilter = siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' });
        await expect(siteFilter).toBeVisible();
        await siteFilter.click();

        // 모든 사이트 옵션 확인
        await expect(
          siteAdminPage.getByRole('option', { name: '모든 사이트', exact: true })
        ).toBeVisible();
        await expect(
          siteAdminPage.getByRole('option', { name: '수원랩', exact: true })
        ).toBeVisible();
        await expect(
          siteAdminPage.getByRole('option', { name: '의왕랩', exact: true })
        ).toBeVisible();
        await expect(
          siteAdminPage.getByRole('option', { name: '평택랩', exact: true })
        ).toBeVisible();

        console.log('[Test] ✅ All site options displayed for lab_manager');
      }
    );
  });

  test.describe('2.2. Selecting site filter updates URL and displays results', () => {
    test.fixme(
      'should filter equipment by selected site and update URL',
      async ({ siteAdminPage }) => {
        // lab_manager(siteAdminPage)의 사이트 필터는 EQUIPMENT_DATA_SCOPE(type: 'site')에 따라
        // disabled 상태로 고정됨 — 드롭다운 클릭 불가
        // ✅ ?site= 로 기본 필터 우회하여 "모든 사이트" 상태에서 시작
        await siteAdminPage.goto('/equipment?site=');

        // 사이트 필터 선택: 수원랩 (1차 필터 - 항상 표시)
        const siteFilter = siteAdminPage.getByRole('combobox', { name: '사이트 필터 선택' });
        await siteFilter.click();
        await siteAdminPage.getByRole('option', { name: '수원랩', exact: true }).click();

        // 1. URL 파라미터 검증 (✅ SSOT: lowercase site names)
        await siteAdminPage.waitForURL(/site=suwon/, { timeout: 10000 });
        await expect(siteAdminPage).toHaveURL(/site=suwon/);

        // Wait for table to reload
        await siteAdminPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

        // 2. 비즈니스 로직 검증: URL 파라미터 확인
        const currentUrl = siteAdminPage.url();
        const urlObj = new URL(currentUrl);
        expect(urlObj.searchParams.get('site')).toBe('suwon');

        // 3. UI 검증: 필터 뱃지 표시
        const filterBadge = siteAdminPage.getByText(/사이트:\s*수원랩/);
        await expect(filterBadge).toBeVisible();

        // 4. 테이블 행 검증: 모든 장비가 수원랩
        const equipmentRows = siteAdminPage.locator('[data-testid="equipment-row"]');
        const rowCount = await equipmentRows.count();
        expect(rowCount).toBeGreaterThan(0);

        for (let i = 0; i < rowCount; i++) {
          const row = equipmentRows.nth(i);
          const locationText = await row.locator('td').nth(5).textContent();
          expect(locationText).toContain('SUWON'); // SUW = SUWON Lab
        }

        console.log('[Test] ✅ Site filter works correctly for lab_manager');
      }
    );
  });

  test.describe('2.3. Site filter is visible for test_engineer with user default applied', () => {
    test('should display site filter for test_engineer with default site', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // ✅ 모든 역할에 사이트 필터가 표시됨 (1차 필터 - 항상 표시)
      const siteFilter = testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' });
      await expect(siteFilter).toBeVisible();

      // ✅ 기본 필터: 사용자 소속 사이트가 자동 적용됨
      await testOperatorPage.waitForURL(/site=suwon/, { timeout: 10000 });

      // 필터 뱃지 확인: 사용자 소속 사이트로 필터링됨
      const filterBadge = testOperatorPage.getByText(/사이트:\s*수원랩/);
      await expect(filterBadge).toBeVisible();

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Site filter visible for test_engineer with default site applied');
    });

    test('should allow test_engineer to change site filter', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 사이트 필터가 표시되는지 확인 (1차 필터 - 항상 표시)
      const siteFilter = testOperatorPage.getByRole('combobox', { name: '사이트 필터 선택' });
      await expect(siteFilter).toBeVisible();

      // 드롭다운 클릭 - 모든 사이트 옵션이 표시되어야 함
      await siteFilter.click();
      await expect(
        testOperatorPage.getByRole('option', { name: '모든 사이트', exact: true })
      ).toBeVisible();
      await expect(
        testOperatorPage.getByRole('option', { name: '수원랩', exact: true })
      ).toBeVisible();
      await expect(
        testOperatorPage.getByRole('option', { name: '의왕랩', exact: true })
      ).toBeVisible();
      await expect(
        testOperatorPage.getByRole('option', { name: '평택랩', exact: true })
      ).toBeVisible();

      console.log('[Test] ✅ test_engineer can see and interact with all site options');
    });
  });

  test.describe('2.4. Removing site filter changes applied filter', () => {
    test.fixme(
      'should remove non-default site filter and update URL',
      async ({ siteAdminPage }) => {
        // lab_manager(siteAdminPage)는 isSiteFixed=true이므로 사이트 배지가 표시되지 않음
        // ({filters.site && !isSiteFixed && ...} 조건으로 배지 숨김)
        // 사용자 기본 사이트가 아닌 다른 사이트로 시작 (의왕랩)
        await siteAdminPage.goto('/equipment?site=uiwang');

        // 필터 뱃지 확인
        const filterBadge = siteAdminPage.getByText(/사이트:\s*의왕랩/);
        await expect(filterBadge).toBeVisible();

        // 필터 제거 버튼 클릭
        const removeButton = filterBadge.locator('xpath=..').getByRole('button', {
          name: /필터 제거/i,
        });
        await removeButton.click();

        // URL에서 uiwang 필터가 제거되기를 기다림
        await siteAdminPage.waitForURL((url) => !url.toString().includes('site=uiwang'), {
          timeout: 10000,
        });

        // 1. URL 파라미터 검증: uiwang 필터가 제거됨
        const currentUrl = siteAdminPage.url();
        expect(currentUrl).not.toContain('site=uiwang');

        // 2. UI 검증: 의왕랩 필터 뱃지가 제거됨
        await expect(filterBadge).not.toBeVisible();

        // Wait for table to reload
        await siteAdminPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

        // Verify equipment rows are displayed
        const equipmentRows = siteAdminPage.locator('[data-testid="equipment-row"]');
        const rowCount = await equipmentRows.count();
        expect(rowCount).toBeGreaterThan(0);

        console.log('[Test] ✅ Non-default site filter removed successfully');
      }
    );
  });
});
