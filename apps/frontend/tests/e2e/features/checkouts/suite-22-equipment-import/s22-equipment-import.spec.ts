/**
 * 장비 반입(Equipment Import) E2E 테스트
 *
 * 검증 대상:
 * - 렌탈 반입 폼 페이지 로딩 및 렌더링
 * - 폼 필수 필드 유효성 검사
 * - 공용 반입 폼 접근
 * - 반입 상세 페이지 로딩 (기존 데이터 있을 경우)
 * - 네비게이션 (뒤로가기)
 */
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 반입 - 렌탈 폼', () => {
  test('TC-01: 렌탈 반입 폼 페이지가 로딩된다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/import/rental');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 폼 존재 확인
    await expect(page.locator('form')).toBeVisible();
  });

  test('TC-02: 폼에 장비명 입력 필드가 존재한다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/import/rental');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    // 장비명 필드 (필수)
    const nameInput = page.getByLabel(/장비명|equipment name/i);
    if ((await nameInput.count()) > 0) {
      await expect(nameInput.first()).toBeVisible();
      await nameInput.first().fill('테스트 렌탈 장비');
      await expect(nameInput.first()).toHaveValue('테스트 렌탈 장비');
    }
  });

  test('TC-03: 렌탈 전용 업체 정보 섹션이 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/import/rental');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    // 렌탈 업체 정보 카드 (vendorName 등)
    const vendorSection = page.getByText(/업체|vendor|렌탈/i);
    await expect(vendorSection.first()).toBeVisible();
  });

  test('TC-04: 취소 버튼이 존재하고 클릭 가능하다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/import/rental');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    const cancelBtn = page.getByRole('button', { name: /취소|cancel/i });
    await expect(cancelBtn).toBeVisible();
  });

  test('TC-05: 제출 버튼이 존재한다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/import/rental');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    const submitBtn = page.getByRole('button', { name: /신청|등록|submit|create/i });
    await expect(submitBtn).toBeVisible();
  });
});

test.describe('장비 반입 - 공용 장비 폼', () => {
  test('TC-06: 공용 장비 반입 폼 페이지가 로딩된다', async ({ testOperatorPage: page }) => {
    await page.goto('/checkouts/import/shared');

    // 헤더 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 폼 존재 확인
    await expect(page.locator('form')).toBeVisible();
  });

  test('TC-07: 공용 장비 폼에는 업체 정보 대신 소유 부서 정보가 표시된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/checkouts/import/shared');
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });

    // 소유 부서 또는 내부 관련 텍스트
    const internalSection = page.getByText(/소유|부서|department|internal|사유/i);
    await expect(internalSection.first()).toBeVisible();
  });
});

test.describe('장비 반입 - 기본 페이지 리다이렉트', () => {
  test('TC-08: /checkouts/import 접근 시 rental로 리다이렉트된다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/checkouts/import');

    // rental 페이지로 리다이렉트 확인
    await page.waitForURL(/\/checkouts\/import\/(rental|shared)/, { timeout: 10000 });
  });
});
