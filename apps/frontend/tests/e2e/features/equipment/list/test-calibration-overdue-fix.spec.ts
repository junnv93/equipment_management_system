/**
 * 교정 기한 초과 필터 수정 검증 테스트
 *
 * 버그 수정: Drizzle ORM lte() 함수 사용
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Calibration Overdue Filter Fix', () => {
  test('should return overdue equipment when calibrationOverdue filter is applied', async ({
    testOperatorPage,
  }) => {
    // Navigate to equipment list with overdue filter
    await testOperatorPage.goto('/equipment?calibrationDueFilter=overdue');

    // Wait for page to load
    await testOperatorPage.waitForLoadState('networkidle');

    // Check that we have results (should be at least 3-6 equipment)
    const equipmentRows = testOperatorPage.locator('[data-testid="equipment-row"]');
    const count = await equipmentRows.count();

    console.log(`[Test] Found ${count} overdue equipment`);

    // Should have at least 3 equipment with overdue calibration
    expect(count).toBeGreaterThanOrEqual(3);

    // Verify that these are actually overdue equipment
    // Expected equipment: SUW-E0001, SUW-R0001, SUW-E0008, etc.
    const managementNumbers = ['SUW-E0001', 'SUW-R0001', 'SUW-E0008', 'UIW-W0004'];

    // Check that at least some of these are visible
    let foundCount = 0;
    for (const mn of managementNumbers) {
      const row = equipmentRows.filter({ hasText: mn });
      if ((await row.count()) > 0) {
        foundCount++;
        console.log(`[Test] ✅ Found overdue equipment: ${mn}`);
      }
    }

    expect(foundCount).toBeGreaterThanOrEqual(2);

    console.log('[Test] ✅ Calibration overdue filter is working correctly');
  });
});
