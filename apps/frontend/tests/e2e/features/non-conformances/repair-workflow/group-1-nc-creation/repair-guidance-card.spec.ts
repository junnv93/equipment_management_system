/**
 * Group A-3: Repair Guidance Card Display in NC Management Page
 *
 * Tests repair guidance cards for NCs without repair links.
 * These tests are READ-ONLY and can run in parallel.
 *
 * SSOT Compliance:
 * - NON_CONFORMANCE_TYPE_LABELS from schemas
 * - Never hardcode NC type labels
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import {
  TEST_EQUIPMENT_ID,
  NC_WITHOUT_REPAIR_ID,
  NC_WITH_REPAIR_ID,
  UI_CLASSES,
} from '../constants/test-data';
import { NON_CONFORMANCE_TYPE_LABELS } from '@equipment-management/schemas';

test.describe('Group A-3: Repair Guidance Card Display', () => {
  test('A-3.1. 수리 기록 없는 damage/malfunction NC에 경고 카드 표시', async ({
    testOperatorPage,
  }) => {
    // Navigate to NC management page
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}/non-conformance`);

    // Wait for page to load
    await testOperatorPage.waitForSelector('.bg-white.border', { timeout: 10000 });

    // Find NC card by its cause text (unique identifier in seed data)
    const ncCard = testOperatorPage
      .locator('.bg-white.border')
      .filter({ hasText: '측정값 불안정성 발생' });

    // Verify warning card exists (yellow background)
    const warningCard = ncCard.locator(UI_CLASSES.WARNING_CARD);
    await expect(warningCard).toBeVisible();

    // Verify alert icon (triangle)
    const alertIcon = warningCard.locator('svg').first();
    await expect(alertIcon).toBeVisible();

    // Verify warning text includes "수리 기록 필요"
    await expect(warningCard).toContainText(/수리 기록 필요/i);

    // Verify NC type label using SSOT
    await expect(warningCard).toContainText(NON_CONFORMANCE_TYPE_LABELS.malfunction);

    // Verify repair registration button/link exists
    const repairButton = warningCard.getByRole('link', { name: /수리 이력 등록하기/i });
    await expect(repairButton).toBeVisible();

    // Verify button links to repair history page
    await expect(repairButton).toHaveAttribute('href', /repair-history/);
  });

  test('A-3.2. 수리 연결된 NC에 성공 메시지 표시', async ({ testOperatorPage }) => {
    // Find NC with repair link (use seed data)
    // Navigate to equipment that has NC_007 (EQUIP_CURRENT_PROBE_SUW_A_ID) - damage type with repair link
    const equipmentWithRepairedNC = 'eeee4002-0002-4002-8002-000000000002';
    await testOperatorPage.goto(`/equipment/${equipmentWithRepairedNC}/non-conformance`);

    // Wait for page to load
    await testOperatorPage.waitForSelector('.bg-white.border', { timeout: 10000 });

    // Find NC card by its cause text (from seed data: NC_007 cause is "BNC 커넥터 불량")
    const ncCard = testOperatorPage
      .locator('.bg-white.border')
      .filter({ hasText: 'BNC 커넥터 불량' });

    // Verify success message (green text) - it's in a div with flex items-center
    // The success div contains the full message with "종료 승인 가능"
    const successDiv = ncCard
      .locator('div.text-sm')
      .filter({ hasText: /수리 기록 연결됨.*종료 승인 가능/i });
    await expect(successDiv).toBeVisible();
    await expect(successDiv).toContainText(/수리 기록 연결됨/i);
    await expect(successDiv).toContainText(/종료 승인 가능/i);

    // Verify CheckCircle icon
    const checkIcon = successDiv.locator('svg').first();
    await expect(checkIcon).toBeVisible();

    // Verify repair details link
    const viewLink = ncCard.getByRole('link', { name: /수리 내역 보기/i });
    await expect(viewLink).toBeVisible();
  });

  test('A-3.3. 다른 NC 유형에는 수리 안내 카드 미표시', async ({ testOperatorPage }) => {
    // Navigate to equipment with measurement_error NC (NC_005 - closed, no repair needed)
    const equipmentId = 'eeee1003-0003-4003-8003-000000000003'; // EQUIP_NETWORK_ANALYZER_SUW_E_ID
    await testOperatorPage.goto(`/equipment/${equipmentId}/non-conformance`);

    // Find NC_005 card (measurement_error, closed, no repair required)
    const ncCard = testOperatorPage
      .getByText(/주파수 응답 편차/i)
      .locator('..')
      .locator('..');

    // Verify NO warning card for measurement_error type
    const warningCard = ncCard.locator(UI_CLASSES.WARNING_CARD);
    await expect(warningCard).not.toBeVisible();

    // Verify no "수리 기록 필요" text
    await expect(ncCard).not.toContainText(/수리 기록 필요/i);
  });

  test('A-3.4. 경고 카드에 적절한 색상 스타일 적용', async ({ testOperatorPage }) => {
    await testOperatorPage.goto(`/equipment/${TEST_EQUIPMENT_ID}/non-conformance`);

    // Wait for page to load
    await testOperatorPage.waitForSelector('.bg-white.border', { timeout: 10000 });

    // Find NC card with warning
    const ncCard = testOperatorPage
      .locator('.bg-white.border')
      .filter({ hasText: '측정값 불안정성 발생' });
    const warningCard = ncCard.locator(UI_CLASSES.WARNING_CARD);

    // Verify warning card has appropriate background color
    await expect(warningCard).toBeVisible();

    // Verify card has border (for emphasis)
    const borderClass = await warningCard.evaluate((el) => el.className);
    expect(borderClass).toMatch(/border/); // Should have border styling
  });
});
