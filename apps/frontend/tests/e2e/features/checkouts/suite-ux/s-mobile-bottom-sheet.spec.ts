/**
 * Suite UX: 모바일 Bottom Sheet (Drawer)
 *
 * 375px 모바일 viewport에서 CheckoutDetailClient의
 * vaul Drawer peek + expand 동작을 검증합니다.
 *
 * Feature Flag 의존: NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true
 * 조건: nextStepDescriptor.nextAction !== null (pending 상태 반출)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_001_ID } from '../../../shared/constants/test-checkout-ids';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';

const CHECKOUT_DETAIL_URL = `${BASE_URLS.FRONTEND}/checkouts/${CHECKOUT_001_ID}`;

const MOBILE_VIEWPORT = { width: 375, height: 812 };

test.describe('UX: 모바일 Bottom Sheet', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('모바일 viewport에서 Drawer peek 버튼이 표시된다', async ({ techManagerPage: page }) => {
    await page.goto(CHECKOUT_DETAIL_URL);

    const peekButton = page.locator('[data-testid="checkout-mobile-peek"]');
    await expect(peekButton).toBeVisible({ timeout: 5000 });

    // peek 영역 높이 64px 근처 확인
    const boundingBox = await peekButton.boundingBox();
    expect(boundingBox).not.toBeNull();
    if (boundingBox) {
      expect(boundingBox.height).toBeGreaterThanOrEqual(56);
      expect(boundingBox.height).toBeLessThanOrEqual(72);
    }
  });

  test('peek 클릭 시 DrawerContent가 열리고 aria-modal이 적용된다', async ({
    techManagerPage: page,
  }) => {
    await page.goto(CHECKOUT_DETAIL_URL);

    const peekButton = page.locator('[data-testid="checkout-mobile-peek"]');
    await expect(peekButton).toBeVisible({ timeout: 5000 });
    await peekButton.click();

    const drawerContent = page.locator('[data-testid="checkout-mobile-drawer"]');
    await expect(drawerContent).toBeVisible({ timeout: 3000 });
    await expect(drawerContent).toHaveAttribute('aria-modal', 'true');
  });

  test('데스크톱 viewport에서는 peek 버튼이 숨겨진다', async ({ techManagerPage: page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(CHECKOUT_DETAIL_URL);

    const peekButton = page.locator('[data-testid="checkout-mobile-peek"]');
    // md:hidden 클래스로 CSS에서 숨겨짐 (hidden ≠ not in DOM)
    await expect(peekButton).toBeHidden();
  });
});
