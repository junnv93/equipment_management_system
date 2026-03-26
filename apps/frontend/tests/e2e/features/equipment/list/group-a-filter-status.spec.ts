/**
 * Group A: 상태 필터 테스트
 *
 * 🔥 SSOT 검증의 핵심!
 *
 * 검증 범위:
 * 1. 모든 EQUIPMENT_STATUS_FILTER_OPTIONS 표시 (SSOT 준수)
 * 2. 상태 필터 선택 시 URL 업데이트 및 결과 반환
 * 3. calibration_overdue 상태 필터 적용 시 D+N 뱃지 표시
 *
 * SSOT:
 * - EQUIPMENT_STATUS_FILTER_OPTIONS: @equipment-management/schemas
 * - EQUIPMENT_STATUS_LABELS: @equipment-management/schemas
 *
 * 주의사항:
 * - EQUIPMENT_STATUS_FILTER_OPTIONS는 UI 필터용 상태 목록 (일부 상태 제외)
 * - deprecated(retired), 시스템생성(calibration_scheduled), 내부전용(temporary, inactive) 제외
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  EQUIPMENT_STATUS_FILTER_OPTIONS,
  EQUIPMENT_STATUS_LABELS,
  EquipmentStatusValues as ESVal,
  type EquipmentStatus,
} from '@equipment-management/schemas';

test.describe('Group A: Status Filter', () => {
  test.describe('3.1. Status filter shows all EQUIPMENT_STATUS_FILTER_OPTIONS', () => {
    test('should display all status options from SSOT', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 상태 필터 드롭다운 클릭 (Radix UI Select는 button 역할 사용)
      const statusFilter = testOperatorPage.locator('#filter-status');
      await expect(statusFilter).toBeVisible();
      await statusFilter.click();

      // 🔥 SSOT 검증: EQUIPMENT_STATUS_FILTER_OPTIONS의 모든 옵션 확인
      // "모든 상태" 옵션
      await expect(
        testOperatorPage.getByRole('option', { name: '모든 상태', exact: true })
      ).toBeVisible();

      // EQUIPMENT_STATUS_FILTER_OPTIONS의 각 상태 옵션 확인
      for (const statusValue of EQUIPMENT_STATUS_FILTER_OPTIONS) {
        const statusLabel = EQUIPMENT_STATUS_LABELS[statusValue];
        const option = testOperatorPage.getByRole('option', { name: statusLabel });
        await expect(option).toBeVisible();
      }

      // 제외된 상태들이 없는지 확인
      const excludedStatuses: EquipmentStatus[] = [
        'retired', // deprecated
        'calibration_scheduled', // 시스템 자동 생성
        'temporary', // 내부 공용/렌탈 전용
        'inactive', // 내부 공용/렌탈 전용
      ];

      for (const excludedStatus of excludedStatuses) {
        const excludedLabel = EQUIPMENT_STATUS_LABELS[excludedStatus];
        const option = testOperatorPage.getByRole('option', { name: excludedLabel, exact: true });
        await expect(option).not.toBeVisible();
      }

      console.log('[Test] ✅ All EQUIPMENT_STATUS_FILTER_OPTIONS displayed correctly');
    });
  });

  test.describe('3.2. Selecting status filter updates URL and results', () => {
    test('should filter equipment by "available" status', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 상태 필터 선택: 사용 가능 (Radix UI Select는 button 역할 사용)
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '사용 가능' }).click();

      // 1. URL 파라미터 검증
      await testOperatorPage.waitForURL(/status=available/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/status=available/);

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // 2. 비즈니스 로직 검증: URL 파라미터 확인
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('status')).toBe(ESVal.AVAILABLE);

      // 3. UI 검증: 필터 뱃지 표시
      const filterBadge = testOperatorPage.getByText(/상태:\s*사용 가능/);
      await expect(filterBadge).toBeVisible();

      // 4. 테이블 행 검증: 모든 장비가 "사용 가능" 상태
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      for (let i = 0; i < rowCount; i++) {
        const row = equipmentRows.nth(i);
        const statusCell = row.locator('td').nth(3); // 상태 컬럼
        const statusText = await statusCell.textContent();
        expect(statusText).toContain('사용 가능');
      }

      console.log('[Test] ✅ Status filter works correctly for "available"');
    });
  });

  test.describe('3.3. Status filter for calibration_overdue equipment', () => {
    test('should display D+N badge for overdue equipment', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');

      // 상태 필터 선택: 교정 기한 초과 (Radix UI Select는 button 역할 사용)
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '교정 기한 초과' }).click();

      // 1. URL 파라미터 검증
      await testOperatorPage.waitForURL(/status=calibration_overdue/, { timeout: 10000 });
      await expect(testOperatorPage).toHaveURL(/status=calibration_overdue/);

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // 2. UI 검증: 필터 뱃지 표시
      const filterBadge = testOperatorPage.getByText(/상태:\s*교정 기한 초과/);
      await expect(filterBadge).toBeVisible();

      // 3. 비즈니스 로직 검증: URL 파라미터 확인
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.get('status')).toBe(ESVal.CALIBRATION_OVERDUE);

      // 4. D+N 뱃지 검증: 교정 기한 초과 장비는 D+N 형식의 뱃지를 표시해야 함
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();

      if (rowCount > 0) {
        const firstRow = equipmentRows.first();

        // D+N 형식의 뱃지 확인 (예: D+5, D+10)
        const dPlusBadge = firstRow.locator('text=/D\\+\\d+/');
        await expect(dPlusBadge).toBeVisible();

        const badgeText = await dPlusBadge.textContent();
        console.log('[Test] Overdue badge text:', badgeText);
        expect(badgeText).toMatch(/^D\+\d+$/);

        console.log('[Test] ✅ calibration_overdue filter displays D+N badge correctly');
      } else {
        console.log('[Test] ⚠️ No calibration_overdue equipment in test data');
      }
    });
  });

  test.describe('Additional: Status filter edge cases', () => {
    test('should remove status filter when selecting "모든 상태"', async ({ testOperatorPage }) => {
      // 상태 필터가 적용된 상태로 시작
      await testOperatorPage.goto('/equipment?status=available');

      // 필터 뱃지 확인
      const filterBadge = testOperatorPage.getByText(/상태:\s*사용 가능/);
      await expect(filterBadge).toBeVisible();

      // "모든 상태" 선택 (Radix UI Select는 button 역할 사용)
      const statusFilter = testOperatorPage.locator('#filter-status');
      await statusFilter.click();
      await testOperatorPage.getByRole('option', { name: '모든 상태', exact: true }).click();

      // Wait for URL to update (parameter removed)

      // URL 검증: status 파라미터 제거
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('status')).toBe(false);

      // 필터 뱃지가 제거됨
      await expect(filterBadge).not.toBeVisible();

      // Wait for table to reload
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      console.log('[Test] ✅ Status filter removed when selecting "모든 상태"');
    });

    test('should display multiple equipment statuses without filter', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment');

      // Wait for table to load
      await testOperatorPage.waitForSelector('[data-testid="equipment-row"]', { timeout: 10000 });

      // Verify URL has no status parameter
      const currentUrl = testOperatorPage.url();
      const urlObj = new URL(currentUrl);
      expect(urlObj.searchParams.has('status')).toBe(false);

      // Verify equipment rows are displayed
      const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
      const rowCount = await equipmentRows.count();
      expect(rowCount).toBeGreaterThan(0);

      console.log('[Test] ✅ Multiple statuses displayed without filter');
    });
  });
});
