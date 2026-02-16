/**
 * Group B: 교정 등록 폼 자동 계산 및 역할별 동작
 *
 * 테스트 대상:
 * - 장비 선택 UI 하이라이트
 * - 교정일/주기 입력 시 다음 교정일 자동 계산
 * - 중간점검일 자동 계산 (교정 주기 50%)
 * - 역할별 Alert 메시지 (시험실무자 vs 기술책임자)
 * - 장비 검색 필터링
 * - 교정 결과 드롭다운 SSOT 검증
 *
 * ## SSOT 준수
 * - CalibrationResult enum: @equipment-management/schemas
 * - auth.fixture.ts: testOperatorPage, techManagerPage
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import type { Page } from '@playwright/test';

/** Equipment list item locator: <li> elements with "관리번호" text in the equipment panel */
function getEquipmentItems(page: Page) {
  return page.locator('li').filter({ hasText: '관리번호' });
}

/** Navigate to calibration register page and wait for equipment list to load */
async function navigateAndWaitForReady(page: Page) {
  await page.goto('/calibration/register');
  await expect(page.getByRole('heading', { name: '교정 정보 등록' })).toBeVisible();
  const items = getEquipmentItems(page);
  await expect(items.first()).toBeVisible({ timeout: 15000 });
  return items;
}

/** Select equipment at given index and wait for the form to appear */
async function selectEquipmentAt(page: Page, index = 0) {
  const items = getEquipmentItems(page);
  const item = items.nth(index);
  await item.click();
  await expect(page.getByText('선택된 장비:')).toBeVisible();
  return item;
}

test.describe('교정 등록 폼 자동 계산 및 역할별 동작', () => {
  test('2.1. 장비 선택 시 좌측 패널에서 선택 하이라이트가 표시된다', async ({
    testOperatorPage: page,
  }) => {
    const items = await navigateAndWaitForReady(page);
    const firstEquipment = items.first();

    // 장비 이름 확보
    const equipmentName = await firstEquipment.locator('.font-medium').textContent();
    if (!equipmentName) {
      test.skip(true, '장비 목록이 비어있습니다');
      return;
    }

    // 첫 번째 장비 클릭 → 하이라이트 확인 (bg-blue-50 border-l-4 border-blue-500)
    await firstEquipment.click();
    await expect(firstEquipment).toHaveClass(/bg-blue-50/);

    // 우측 폼에 장비명 표시 확인
    await expect(page.getByText(`선택된 장비: ${equipmentName.trim()}`)).toBeVisible();

    // 두 번째 장비 클릭 → 이전 해제, 새 하이라이트
    const itemCount = await items.count();
    if (itemCount > 1) {
      const secondEquipment = items.nth(1);
      await secondEquipment.click();
      await expect(firstEquipment).not.toHaveClass(/bg-blue-50/);
      await expect(secondEquipment).toHaveClass(/bg-blue-50/);
    }
  });

  test('2.2. 교정일과 교정 주기 입력 시 다음 교정일이 자동 계산된다', async ({
    testOperatorPage: page,
  }) => {
    await navigateAndWaitForReady(page);
    await selectEquipmentAt(page, 0);

    // 교정일 입력
    await page.locator('#calibrationDate').fill('2026-02-15');
    await expect(page.locator('#calibrationDate')).toHaveValue('2026-02-15');

    // 교정 주기를 6개월로 변경 → 다음 교정일 = 2026-08-15
    const cycleSelect = page.getByRole('combobox', { name: /교정 주기/ });
    await cycleSelect.click();
    await page.getByRole('option', { name: '6개월', exact: true }).click();
    await expect(page.locator('#nextCalibrationDate')).toHaveValue('2026-08-15');

    // 교정 주기를 12개월로 변경 → 다음 교정일 = 2027-02-15
    await cycleSelect.click();
    await page.getByRole('option', { name: '12개월', exact: true }).click();
    await expect(page.locator('#nextCalibrationDate')).toHaveValue('2027-02-15');
  });

  test('2.3. 중간점검일이 교정 주기의 50%로 자동 계산된다', async ({ testOperatorPage: page }) => {
    await navigateAndWaitForReady(page);
    await selectEquipmentAt(page, 0);

    // 교정일 입력
    await page.locator('#calibrationDate').fill('2026-02-15');
    await expect(page.locator('#calibrationDate')).toHaveValue('2026-02-15');

    // 교정 주기 12개월 → 중간점검일 = 6개월 후 = 2026-08-15
    const cycleSelect = page.getByRole('combobox', { name: /교정 주기/ });
    await cycleSelect.click();
    await page.getByRole('option', { name: '12개월', exact: true }).click();
    await expect(page.locator('#intermediateCheckDate')).toHaveValue('2026-08-15');

    // 교정 주기 24개월 → 중간점검일 = 12개월 후 = 2027-02-15
    await cycleSelect.click();
    await page.getByRole('option', { name: '24개월', exact: true }).click();
    await expect(page.locator('#intermediateCheckDate')).toHaveValue('2027-02-15');
  });

  test('2.4. 시험실무자에게 승인 대기 안내 Alert가 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await navigateAndWaitForReady(page);

    // Alert에 '기술책임자' + '승인' 텍스트 확인 (장비 선택 없이도 표시됨)
    // Note: Next.js __next-route-announcer__ also has role="alert", so filter by content
    const alert = page.getByRole('alert').filter({ hasText: '로그인되어 있습니다' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('기술책임자');
    await expect(alert).toContainText('승인');

    // 장비 선택 후 등록자 코멘트 필드가 숨겨져 있는지 확인 (시험실무자에게는 불필요)
    await selectEquipmentAt(page, 0);
    await expect(page.locator('#registrarComment')).not.toBeVisible();
  });

  test('2.5. 기술책임자에게 권한 없음 경고가 표시되고 폼이 비활성화된다', async ({
    techManagerPage: page,
  }) => {
    await navigateAndWaitForReady(page);

    // Alert에 '교정 등록 권한 없음' + '승인만 가능' 텍스트 확인
    // Note: Next.js __next-route-announcer__ also has role="alert", so filter by content
    const alert = page.getByRole('alert').filter({ hasText: '교정 등록 권한 없음' });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText('시험실무자(test_engineer)만');
    await expect(alert).toContainText('승인만 가능');
    await expect(alert).toContainText('technical_manager');

    // 장비 선택
    await selectEquipmentAt(page, 0);

    // 제출 버튼이 비활성화되어 있는지 확인
    const submitButton = page.getByRole('button', { name: /교정 정보 등록/ });
    await expect(submitButton).toBeDisabled();
  });

  test('2.6. 장비 검색으로 좌측 패널 장비 목록이 필터링된다', async ({
    testOperatorPage: page,
  }) => {
    const items = await navigateAndWaitForReady(page);
    const initialCount = await items.count();

    if (initialCount === 0) {
      test.skip(true, '장비 목록이 비어있습니다');
      return;
    }

    // 첫 번째 장비 이름으로 검색 (확실한 검색어)
    const firstEquipmentName = await items.first().locator('.font-medium').textContent();
    const searchTerm = firstEquipmentName?.trim() ?? '';

    const searchInput = page.getByPlaceholder(/검색/);
    await searchInput.fill(searchTerm);

    // 필터링 후 결과 확인
    await expect(items.first()).toBeVisible();
    const filteredCount = await items.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
    expect(filteredCount).toBeGreaterThan(0);

    // 검색어 지우기 → 전체 목록 복원
    await searchInput.clear();
    await expect(items).toHaveCount(initialCount);
  });

  test('2.7. 교정 결과 드롭다운에 SSOT 값 3개가 정확히 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await navigateAndWaitForReady(page);
    await selectEquipmentAt(page, 0);

    // 교정 결과 combobox 클릭
    const resultSelect = page.getByRole('combobox', { name: /교정 결과/ });
    await resultSelect.click();

    // listbox가 나타날 때까지 대기
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible({ timeout: 5000 });

    // 정확히 3개 option 표시 확인
    const options = listbox.getByRole('option');
    await expect(options).toHaveCount(3);

    // SSOT 값 검증: 적합, 부적합, 조건부 적합
    await expect(listbox.getByRole('option', { name: '적합', exact: true })).toBeVisible();
    await expect(listbox.getByRole('option', { name: '부적합', exact: true })).toBeVisible();
    await expect(listbox.getByRole('option', { name: '조건부 적합', exact: true })).toBeVisible();
  });
});
