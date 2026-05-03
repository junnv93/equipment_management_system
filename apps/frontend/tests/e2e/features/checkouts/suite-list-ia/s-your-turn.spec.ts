/**
 * Suite List-IA: S10 — YourTurnBadge role-based visibility
 *
 * 검증 대상:
 * - NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 환경에서 feature flag 감지
 * - technical_manager: lender 차례 rental 반입 row에 data-testid="your-turn-badge" 표시
 * - test_engineer: approved checkout 시작 차례에 data-testid="your-turn-badge" 표시
 * - terminal 상태: data-my-turn="false" + your-turn-badge 미표시
 *
 * Feature Flag 감지 방식:
 *   process.env는 테스트 러너(Node.js) 환경 변수로, Next.js 빌드 타임에 번들된
 *   NEXT_PUBLIC_* 값을 반영하지 않는다.
 *   beforeAll에서 실제 브라우저로 상세 페이지를 방문해 DOM에 data-variant="hero"인
 *   NextStepPanel이 존재하는지 확인하는 방식으로 플래그 활성 여부를 판단한다.
 */
import path from 'path';
import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  CHECKOUT_009_ID,
  CHECKOUT_036_ID,
  CHECKOUT_062_ID,
} from '../../../shared/constants/test-checkout-ids';

test.describe.configure({ mode: 'serial' });

test.describe('Suite List-IA S10: YourTurnBadge', () => {
  let flagEnabled = false;

  const heroPanel = (page: import('@playwright/test').Page) =>
    page.locator('[data-variant="hero"]').first();

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
      storageState: path.join(__dirname, '../../../.auth/technical-manager.json'),
    });
    try {
      const probe = await context.newPage();
      await probe.goto(`/checkouts/${CHECKOUT_009_ID}`);
      await probe.waitForLoadState('domcontentloaded');
      flagEnabled = await heroPanel(probe).isVisible();
    } finally {
      await context.close();
    }
  });

  test('technical_manager: lender 차례 rental 반입 상세에서 your-turn-badge 표시', async ({
    techManagerPage: page,
  }, testInfo) => {
    if (!flagEnabled) {
      testInfo.skip(true, 'NextStepPanel feature flag 비활성 — 건너뜀');
      return;
    }

    await page.goto(`/checkouts/${CHECKOUT_036_ID}`);
    await page.waitForLoadState('domcontentloaded');

    const panel = heroPanel(page);
    await expect(panel).toBeVisible({ timeout: 10000 });
    await expect(panel).toHaveAttribute('data-my-turn', 'true');

    const badge = panel.getByTestId('your-turn-badge');
    await expect(badge).toBeVisible({ timeout: 10000 });
    await expect(badge).toContainText(/내 차례|Your Turn/);
  });

  test('test_engineer: approved checkout 시작 차례에서 your-turn-badge 표시', async ({
    testOperatorPage: page,
  }, testInfo) => {
    if (!flagEnabled) {
      testInfo.skip(true, 'NextStepPanel feature flag 비활성 — 건너뜀');
      return;
    }

    await page.goto(`/checkouts/${CHECKOUT_009_ID}`);
    await page.waitForLoadState('domcontentloaded');

    const panel = heroPanel(page);
    await expect(panel).toBeVisible({ timeout: 10000 });
    await expect(panel).toHaveAttribute('data-my-turn', 'true');

    const badge = panel.getByTestId('your-turn-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toContainText(/내 차례|Your Turn/);
  });

  test('terminal canceled checkout: data-my-turn=false이고 your-turn-badge 미표시', async ({
    testOperatorPage: page,
  }, testInfo) => {
    if (!flagEnabled) {
      testInfo.skip(true, 'NextStepPanel feature flag 비활성 — 건너뜀');
      return;
    }

    await page.goto(`/checkouts/${CHECKOUT_062_ID}`);
    await page.waitForLoadState('domcontentloaded');

    const panel = heroPanel(page);
    await expect(panel).toBeVisible({ timeout: 10000 });
    await expect(panel).toHaveAttribute('data-my-turn', 'false');
    await expect(panel.getByTestId('your-turn-badge')).toHaveCount(0);
  });
});
