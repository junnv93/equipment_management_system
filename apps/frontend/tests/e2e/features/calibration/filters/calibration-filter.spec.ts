/**
 * 교정 기한 필터 E2E 테스트 (Frontend)
 *
 * 비즈니스 규칙:
 * - 반출 상태와 무관하게 교정일 기준으로 필터링
 * - UI에서 필터 선택 시 올바른 결과 표시
 *
 * ⚠️ FIXME: 전체 테스트 비활성화 (2026-02-12)
 * 이유:
 *   1. UI 로케이터가 실제 UI와 완전히 불일치:
 *      - `select#filter-calibration-due` → 실제 UI는 shadcn/ui Select (Radix)
 *      - `select#filter-status` → 실제 UI는 shadcn/ui Select
 *      - `data-testid="equipment-card"` → 실제 UI는 테이블 `[data-testid="equipment-row"]`
 *   2. 테스트 재작성 시 EquipmentFilters.tsx의 실제 컴포넌트 구조를 참조해야 함
 *   3. 재작성 범위: 전체 5개 테스트 (로케이터 전면 교체 필요)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('교정 기한 필터 - 반출 상태 무관', () => {
  test.fixme(
    true,
    'UI 로케이터 전면 불일치 - select#filter-calibration-due, data-testid="equipment-card" 등 미존재'
  );

  test('교정 임박 필터를 선택하면 반출 중인 장비도 표시되어야 한다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    // TODO: shadcn/ui Select 컴포넌트의 실제 로케이터로 교체 필요
    // 실제 UI: EquipmentFilters.tsx → <Select> 컴포넌트 → Trigger → Content → Item
    const calibrationDueFilter = testOperatorPage.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon');

    await testOperatorPage.waitForLoadState('networkidle');

    const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
    const count = await equipmentRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('교정 기한 초과 필터를 선택하면 모든 초과 장비가 표시되어야 한다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const calibrationDueFilter = testOperatorPage.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('overdue');

    await testOperatorPage.waitForLoadState('networkidle');

    const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
    const count = await equipmentRows.count();
    console.log(`교정 기한 초과 장비 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('필터 초기화가 정상 동작해야 한다', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const calibrationDueFilter = testOperatorPage.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon');
    await testOperatorPage.waitForLoadState('networkidle');

    const resetButton = testOperatorPage.locator('button', { hasText: '초기화' });
    await resetButton.click();
    await testOperatorPage.waitForLoadState('networkidle');

    const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
    const count = await equipmentRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('여러 필터를 조합하여 사용할 수 있어야 한다', async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const calibrationDueFilter = testOperatorPage.locator('select#filter-calibration-due');
    await calibrationDueFilter.selectOption('due_soon');

    const siteFilter = testOperatorPage.locator('select#filter-site');
    if (await siteFilter.isVisible()) {
      await siteFilter.selectOption('suwon');
    }

    await testOperatorPage.waitForLoadState('networkidle');

    const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
    const count = await equipmentRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('교정 기한 필터 - 장비 상세 페이지', () => {
  test.fixme(
    true,
    'UI 로케이터 전면 불일치 - select#filter-status, data-testid="equipment-card" 등 미존재'
  );

  test('반출 중인 장비의 상세 페이지에서 교정 정보를 확인할 수 있어야 한다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('networkidle');

    const statusFilter = testOperatorPage.locator('select#filter-status');
    await statusFilter.selectOption('checked_out');
    await testOperatorPage.waitForLoadState('networkidle');

    const firstEquipment = testOperatorPage.locator('[data-testid="equipment-row"]').first();
    if (await firstEquipment.isVisible()) {
      await firstEquipment.click();
      await testOperatorPage.waitForLoadState('networkidle');

      const calibrationInfo = testOperatorPage.locator('text=/교정|Calibration/i');
      const hasCalibrationInfo = (await calibrationInfo.count()) > 0;

      if (hasCalibrationInfo) {
        console.log('반출 중인 장비도 교정 정보 표시됨');
      }

      const status = testOperatorPage.locator('text=/반출 중|Checked Out/i');
      await expect(status).toBeVisible();
    }
  });
});
