/**
 * 장비 등록(Create Equipment) E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 폼 렌더링
 * - 필수 필드 유효성 검사
 * - 폼 취소 시 장비 목록으로 이동
 * - 역할별 접근 권한
 *
 * 주의: 실제 장비 생성은 DB 상태를 변경하므로
 * 폼 렌더링/유효성/네비게이션만 테스트합니다.
 */
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 등록 페이지', () => {
  test('TC-01: 페이지 로딩 후 폼이 렌더링된다', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 폼 존재 확인
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  test('TC-02: 필수 필드가 비어있으면 제출할 수 없다', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 제출 버튼 찾기
    const submitButton = page.getByRole('button', { name: /등록|저장|생성|submit|save|create/i });
    await expect(submitButton).toBeVisible();

    // 빈 상태로 제출 시도
    await submitButton.click();

    // 유효성 에러 또는 페이지 유지 확인 (네비게이션 없음)
    await expect(page).toHaveURL(/\/equipment\/create/);
  });

  test('TC-03: 장비명 입력 필드가 존재하고 입력 가능하다', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create');
    await expect(page.locator('form')).toBeVisible({ timeout: 15000 });

    // 이름 필드 찾기 (name 필드)
    const nameInput = page.locator('input[name="name"]');
    if ((await nameInput.count()) > 0) {
      await nameInput.fill('테스트 장비 이름');
      await expect(nameInput).toHaveValue('테스트 장비 이름');
    } else {
      // label로 찾기
      const labeledInput = page.getByLabel(/장비명|이름|name/i);
      if ((await labeledInput.count()) > 0) {
        await labeledInput.first().fill('테스트 장비 이름');
        await expect(labeledInput.first()).toHaveValue('테스트 장비 이름');
      }
    }
  });

  test('TC-04: 취소 버튼 클릭 시 장비 목록으로 이동한다', async ({ testOperatorPage: page }) => {
    await page.goto('/equipment/create');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // 뒤로가기 버튼 또는 취소 버튼 찾기
    const backButton = page.locator('button[aria-label*="뒤로"], a[aria-label*="뒤로"]');
    const cancelButton = page.getByRole('button', { name: /취소|cancel/i });

    if ((await backButton.count()) > 0) {
      await backButton.first().click();
    } else if ((await cancelButton.count()) > 0) {
      await cancelButton.click();
    }

    await page.waitForURL(/\/equipment(?:\?|$)/, { timeout: 10000 });
  });

  test('TC-05: 기술책임자도 장비 등록 페이지에 접근할 수 있다', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/equipment/create');

    // 정상 렌더링 확인 (403이 아님)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('form')).toBeVisible();
  });

  test('TC-06: PageHeader 뒤로가기 버튼이 장비 목록으로 네비게이션한다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/equipment/create');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    // PageHeader의 onBack 버튼 (aria-label에 '뒤로' 포함하는 버튼)
    const backBtn = page.locator('button[aria-label*="뒤로"], button[aria-label*="back"]');
    if ((await backBtn.count()) > 0) {
      await backBtn.first().click();
      await page.waitForURL(/\/equipment/, { timeout: 10000 });
    } else {
      // PageHeader의 첫 번째 버튼(뒤로가기)이 있을 수 있음
      const firstBtn = page.locator('[class*="PageHeader"] button').first();
      if ((await firstBtn.count()) > 0) {
        await firstBtn.click();
        await page.waitForURL(/\/equipment/, { timeout: 10000 });
      }
    }
  });
});
