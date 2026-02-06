// spec: equipment-create test plan - group-4-history-save
// seed: apps/frontend/tests/e2e/equipment-create/seed.spec.ts

/**
 * Test: 임시 이력 삭제 후 등록
 *
 * Verifies that deleting a temporary location history entry using tempId
 * safely removes it from pendingHistory state and prevents it from being saved:
 * - tempId based safe deletion
 * - Deleted entry is removed from pendingHistory
 * - Only remaining entries are saved to database
 * - Detail page shows only saved entries
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';

test.describe('이력 데이터 병렬 저장', () => {
  test('임시 이력 삭제 후 등록', async ({ techManagerPage }) => {
    // 1. techManagerPage로 /equipment/create 페이지 이동
    await techManagerPage.goto('/equipment/create');
    await techManagerPage.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(techManagerPage.locator('h1')).toContainText('장비 등록');
    console.log('✓ Navigated to equipment create page');

    // 2. 필수 정보 입력: 장비명: '임시 이력 삭제 테스트'
    const nameInput = techManagerPage.locator('input[name="name"]');
    await nameInput.fill('임시 이력 삭제 테스트');

    // 사이트/팀: 기술책임자는 자동 설정 (disabled)
    await expect(techManagerPage.getByRole('combobox', { name: '사이트 *' })).toBeDisabled();
    await techManagerPage.waitForTimeout(1000); // Wait for teams to load and auto-set
    await expect(techManagerPage.getByRole('combobox', { name: '팀 *' })).toBeDisabled();

    // 관리번호: '4004'
    const serialInput = techManagerPage.locator('input[name="managementSerialNumberStr"]');
    await serialInput.fill('4004');

    // 모델명: 'Test Model 4004'
    const modelInput = techManagerPage.locator('input[name="modelName"]');
    await modelInput.fill('Test Model 4004');

    // 제조사: 'Test Manufacturer'
    const manufacturerInput = techManagerPage.locator(
      'input[name="manufacturer"][placeholder*="Anritsu"]'
    );
    await manufacturerInput.fill('Test Manufacturer');

    // 시리얼번호: 'SN-4004'
    const serialNumberInput = techManagerPage.locator(
      'input[name="serialNumber"][placeholder*="SN123456"]'
    );
    await serialNumberInput.fill('SN-4004');

    // 현재 위치: 'Test Location'
    const locationInput = techManagerPage.locator('input[name="location"]');
    await locationInput.fill('Test Location');

    // 기술책임자 선택 (첫 번째 옵션) - shadcn/ui Select component
    await techManagerPage.getByRole('combobox', { name: '기술책임자 *' }).click();
    await techManagerPage.getByRole('option').first().click();

    console.log('✓ All required fields filled');

    // 3. 위치 변동 이력 3건 추가
    // Find the LocationHistorySection by its heading (use role to avoid strict mode)
    await techManagerPage.getByRole('heading', { name: '위치 변동 이력' }).scrollIntoViewIfNeeded();
    // Find the Card containing the heading
    const historySection = techManagerPage
      .locator('section, div')
      .filter({
        has: techManagerPage.getByRole('heading', { name: '위치 변동 이력' }),
      })
      .first();

    // Add first history entry
    const addButton = historySection.locator('button', { hasText: '추가' });
    await addButton.click();

    // Wait for dialog to open - use specific selector to avoid mobile nav dialog
    const dialog = techManagerPage.getByRole('dialog', { name: '위치 변동 이력 추가' });
    await expect(dialog).toBeVisible();

    // Fill first entry
    await dialog.locator('input[name="changedAt"]').fill('2024-01-01');
    await dialog.locator('input[name="newLocation"]').fill('Location 1');
    await dialog.locator('button[type="submit"]', { hasText: '저장' }).click();
    await expect(dialog).not.toBeVisible();
    console.log('✓ Added first history entry');

    // Add second history entry
    await addButton.click();
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="changedAt"]').fill('2024-02-01');
    await dialog.locator('input[name="newLocation"]').fill('Location 2');
    await dialog.locator('button[type="submit"]', { hasText: '저장' }).click();
    await expect(dialog).not.toBeVisible();
    console.log('✓ Added second history entry');

    // Add third history entry
    await addButton.click();
    await expect(dialog).toBeVisible();
    await dialog.locator('input[name="changedAt"]').fill('2024-03-01');
    await dialog.locator('input[name="newLocation"]').fill('Location 3');
    await dialog.locator('button[type="submit"]', { hasText: '저장' }).click();
    await expect(dialog).not.toBeVisible();
    console.log('✓ Added third history entry');

    // Verify 3 entries in the table - find table with "변동 일시" header
    const historyTable = techManagerPage
      .locator('table')
      .filter({ has: techManagerPage.locator('text=변동 일시') });
    const historyRows = historyTable.locator('tbody tr');
    // Wait for all entries to render
    await techManagerPage.waitForTimeout(500);
    await expect(historyRows).toHaveCount(3, { timeout: 5000 });
    console.log('✓ 3 history entries displayed in table');

    // 4. 2번째 이력 항목의 '삭제' 버튼 클릭
    const secondRow = historyRows.nth(1);
    const deleteButton = secondRow
      .locator('button', { hasText: '' })
      .filter({ has: techManagerPage.locator('svg') });

    // Click delete and confirm
    techManagerPage.on('dialog', async (dialog) => {
      expect(dialog.message()).toContain('이 위치 변동 이력을 삭제하시겠습니까?');
      await dialog.accept();
    });
    await deleteButton.click();
    await techManagerPage.waitForTimeout(500);
    console.log('✓ Deleted second history entry');

    // 5. 이력 목록에서 2건만 표시 확인
    await expect(historyRows).toHaveCount(2);

    // Verify the deleted entry (Location 2) is not visible
    await expect(historyTable).not.toContainText('Location 2');

    // Verify remaining entries are visible
    await expect(historyTable).toContainText('Location 1');
    await expect(historyTable).toContainText('Location 3');
    console.log('✓ Only 2 history entries remain after deletion');

    // 6. '등록' 버튼 클릭
    const submitButton = techManagerPage
      .locator('button[type="submit"]')
      .filter({ hasText: '등록' });
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // 7. 이력 2건만 저장됨 확인 - Wait for redirect (not toast, as redirect happens immediately)
    await expect(techManagerPage).toHaveURL(/\/equipment/, { timeout: 15000 });
    console.log('✓ Redirected to equipment list after successful registration');

    // 8. 상세 페이지에서 2건의 이력만 표시 확인
    // Search for the created equipment
    const searchInput = techManagerPage.locator('input[placeholder*="검색"]').first();
    await searchInput.fill('임시 이력 삭제 테스트');
    await techManagerPage.waitForTimeout(1000);

    // Click on the equipment card to go to detail page
    const equipmentCard = techManagerPage.locator('text=임시 이력 삭제 테스트');
    await expect(equipmentCard).toBeVisible({ timeout: 5000 });
    await equipmentCard.click();

    // Wait for detail page to load
    await techManagerPage.waitForLoadState('networkidle');
    await expect(techManagerPage).toHaveURL(/\/equipment\/[^/]+$/);
    console.log('✓ Navigated to equipment detail page');

    // Find the location history tab or section
    // Try clicking the tab if it exists
    const historyTab = techManagerPage
      .locator('button', { hasText: '위치 변동 이력' })
      .or(techManagerPage.locator('text=위치 변동 이력'));

    if (await historyTab.isVisible()) {
      if ((await historyTab.getAttribute('role')) === 'tab') {
        await historyTab.click();
        await techManagerPage.waitForTimeout(500);
      }
    }

    // Verify only 2 history entries are visible on detail page
    const detailHistorySection = techManagerPage
      .locator('text=위치 변동 이력')
      .locator('..')
      .locator('..');
    const detailHistoryTable = detailHistorySection.locator('table');
    const detailHistoryRows = detailHistoryTable.locator('tbody tr');

    await expect(detailHistoryRows).toHaveCount(2);
    console.log('✓ Only 2 history entries displayed on detail page');

    // Verify deleted entry is not saved
    await expect(detailHistoryTable).not.toContainText('Location 2');

    // Verify saved entries
    await expect(detailHistoryTable).toContainText('Location 1');
    await expect(detailHistoryTable).toContainText('Location 3');
    console.log('✓ Deleted entry was not saved to database');

    console.log('✅ Test complete: 임시 이력 삭제 후 등록');
  });
});
