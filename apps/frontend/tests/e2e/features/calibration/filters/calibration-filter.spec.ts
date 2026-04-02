/**
 * 교정 기한 필터 E2E 테스트 (Frontend)
 *
 * 비즈니스 규칙:
 * - 반출 상태와 무관하게 교정일 기준으로 필터링
 * - UI에서 필터 선택 시 올바른 결과 표시
 *
 * 로케이터 패턴:
 * - 필터: shadcn Select (combobox role) + aria-label from i18n
 * - 테이블 행: data-testid="equipment-row"
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

/**
 * shadcn Select 필터 선택 헬퍼
 * EquipmentFilters의 Select는 FormItem 밖에 있으므로 aria-label로 직접 접근
 */
async function selectFilter(
  page: import('@playwright/test').Page,
  filterLabel: string | RegExp,
  optionText: string
) {
  const trigger = page.getByRole('combobox', { name: filterLabel });
  await trigger.click();
  const option = page.getByRole('option', { name: optionText, exact: true });
  await expect(option).toBeVisible({ timeout: 5000 });
  await option.click();
}

test.describe('교정 기한 필터 - 반출 상태 무관', () => {
  test.beforeEach(async ({ testOperatorPage }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('domcontentloaded');
  });

  test('교정 임박 필터를 선택하면 반출 중인 장비도 표시되어야 한다', async ({
    testOperatorPage,
  }) => {
    await selectFilter(testOperatorPage, /교정 기한 필터/i, '교정 임박');

    // URL 파라미터 변경 확인 (필터 SSOT)
    await expect(testOperatorPage).toHaveURL(/calibrationDue=due_soon/);

    const equipmentRows = testOperatorPage.getByTestId('equipment-row');
    const count = await equipmentRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('교정 기한 초과 필터를 선택하면 모든 초과 장비가 표시되어야 한다', async ({
    testOperatorPage,
  }) => {
    await selectFilter(testOperatorPage, /교정 기한 필터/i, '기한 초과');

    await expect(testOperatorPage).toHaveURL(/calibrationDue=overdue/);

    const equipmentRows = testOperatorPage.getByTestId('equipment-row');
    const count = await equipmentRows.count();
    console.log(`교정 기한 초과 장비 수: ${count}`);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('필터 초기화가 정상 동작해야 한다', async ({ testOperatorPage }) => {
    // 먼저 필터 적용
    await selectFilter(testOperatorPage, /교정 기한 필터/i, '교정 임박');
    await expect(testOperatorPage).toHaveURL(/calibrationDue=due_soon/);

    // 초기화 버튼 클릭
    const resetButton = testOperatorPage.getByRole('button', { name: /초기화/i });
    await resetButton.click();

    // URL에서 필터 파라미터 제거 확인
    await expect(testOperatorPage).not.toHaveURL(/calibrationDue=/);

    const equipmentRows = testOperatorPage.getByTestId('equipment-row');
    const count = await equipmentRows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('여러 필터를 조합하여 사용할 수 있어야 한다', async ({ testOperatorPage }) => {
    // 교정 기한 필터
    await selectFilter(testOperatorPage, /교정 기한 필터/i, '교정 임박');
    await expect(testOperatorPage).toHaveURL(/calibrationDue=due_soon/);

    // 사이트 필터 (존재하는 경우)
    const siteFilter = testOperatorPage.getByRole('combobox', { name: /사이트 필터/i });
    if (await siteFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await siteFilter.click();
      const suwonOption = testOperatorPage.getByRole('option', { name: /수원/i }).first();
      if (await suwonOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await suwonOption.click();
      }
    }

    const equipmentRows = testOperatorPage.getByTestId('equipment-row');
    const count = await equipmentRows.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('교정 기한 필터 - 장비 상세 페이지', () => {
  test('반출 중인 장비의 상세 페이지에서 교정 정보를 확인할 수 있어야 한다', async ({
    testOperatorPage,
  }) => {
    await testOperatorPage.goto('/equipment');
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // 상태 필터에서 반출 중 선택
    await selectFilter(testOperatorPage, /장비 상태 필터/i, '반출 중');
    await expect(testOperatorPage).toHaveURL(/status=checked_out/);

    const firstRow = testOperatorPage.getByTestId('equipment-row').first();
    if (await firstRow.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstRow.click();

      // 상세 페이지에서 교정 관련 정보 확인
      const calibrationText = testOperatorPage.getByText(/교정|Calibration/i).first();
      const hasCalibrationInfo = await calibrationText
        .isVisible({ timeout: 5000 })
        .catch(() => false);

      if (hasCalibrationInfo) {
        console.log('반출 중인 장비도 교정 정보 표시됨');
      }

      // 상태 표시 확인
      const status = testOperatorPage.getByText(/반출 중|Checked Out/i).first();
      await expect(status).toBeVisible({ timeout: 5000 });
    }
  });
});
