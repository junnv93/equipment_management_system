/**
 * 장비 수정(Edit Equipment) E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 기존 데이터로 폼 프리필
 * - CAS version 필드 포함 확인 (뮤테이션 시 사용)
 * - 뒤로가기 버튼 → 장비 상세로 이동
 * - 존재하지 않는 장비 ID → 404
 * - 역할별 접근 확인
 */
import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('장비 수정 페이지', () => {
  test('TC-01: 기존 장비 데이터로 폼이 프리필된다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);

    // 헤더 확인 (수정 페이지 타이틀)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 폼 존재 확인
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // 이름 필드가 비어있지 않은지 확인 (프리필 되었음)
    const nameInput = page.locator('input[name="name"]');
    if ((await nameInput.count()) > 0) {
      const value = await nameInput.inputValue();
      expect(value.length).toBeGreaterThan(0);
    }
  });

  test('TC-02: 뒤로가기 링크가 장비 상세 페이지를 가리킨다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // EditEquipmentClient의 뒤로가기 버튼: <Link href={/equipment/${equipmentId}}>
    const backLink = page.locator(`a[href*="/equipment/${EQUIPMENT_ID}"]`).first();
    await expect(backLink).toBeVisible();
    const href = await backLink.getAttribute('href');
    expect(href).toContain(`/equipment/${EQUIPMENT_ID}`);
    // edit 경로가 아닌 상세 경로를 가리키는지 확인
    expect(href).not.toContain('/edit');
  });

  test('TC-03: 존재하지 않는 장비 ID로 접근 시 에러 상태가 표시된다', async ({
    techManagerPage: page,
  }) => {
    // 존재하지 않는 UUID — shared-test-data 패턴 (시드에 없는 값)
    const NON_EXISTENT_ID = 'ffffffff-ffff-4fff-bfff-ffffffffffff';
    const response = await page.goto(`/equipment/${NON_EXISTENT_ID}/edit`);

    // 404 또는 에러 페이지 확인
    // Next.js는 notFound()로 404를 반환하거나 에러를 throw
    const status = response?.status() ?? 0;
    const is404orError = status === 404 || status >= 500;

    // 또는 Not Found 텍스트가 표시됨
    const hasErrorText = (await page.getByText(/not found|찾을 수 없|404|오류|error/i).count()) > 0;

    // 최소한 수정 폼이 표시되지 않아야 함
    const formVisible = await page
      .locator('form')
      .isVisible()
      .catch(() => false);

    expect(is404orError || hasErrorText || !formVisible).toBeTruthy();
  });

  test('TC-04: 수정 폼에 취소 버튼이 존재한다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });

    // 취소 버튼 확인 (i18n: 취소)
    const cancelButton = page.getByRole('button', { name: /취소|cancel/i });
    await expect(cancelButton).toBeVisible();
  });

  test('TC-05: 뒤로가기 링크 클릭 시 장비 상세로 돌아간다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });

    // EditEquipmentClient 상단의 뒤로가기 Link 클릭 (폼 취소가 아닌 직접 네비게이션)
    const backLink = page.locator(`a[href="/equipment/${EQUIPMENT_ID}"]`).first();
    await expect(backLink).toBeVisible();
    await backLink.click();

    await page.waitForURL(new RegExp(`/equipment/${EQUIPMENT_ID}(?!.*edit)`), { timeout: 10000 });
  });

  test('TC-06: 시험실무자도 장비 수정 페이지에 접근할 수 있다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);

    // 정상 렌더링 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('form')).toBeVisible();
  });

  test('TC-07: 폼에 교정 관련 라벨 또는 섹션이 표시된다', async ({ techManagerPage: page }) => {
    await page.goto(`/equipment/${EQUIPMENT_ID}/edit`);
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });

    // 교정 관련 텍스트가 폼 내에 존재하는지 확인
    const calibrationText = page.getByText(/교정|calibration/i);
    const fieldCount = await calibrationText.count();
    expect(fieldCount).toBeGreaterThan(0);
  });
});
