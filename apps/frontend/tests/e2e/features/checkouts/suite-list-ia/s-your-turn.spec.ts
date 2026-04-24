/**
 * Suite List-IA: S10 — YourTurnBadge role-based visibility
 *
 * 검증 대상:
 * - NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true 환경에서 feature flag 감지
 * - technical_manager: APPROVED 반출 row에 data-testid="your-turn-badge" 표시
 * - test_engineer: 동일 목록에서 badge 미표시
 *
 * Feature Flag 감지 방식:
 *   process.env는 테스트 러너(Node.js) 환경 변수로, Next.js 빌드 타임에 번들된
 *   NEXT_PUBLIC_* 값을 반영하지 않는다.
 *   beforeAll에서 실제 브라우저로 페이지를 방문해 DOM에 section[data-checkout-id]가
 *   존재하는지 확인하는 방식으로 플래그 활성 여부를 판단한다.
 */
import path from 'path';
import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_009_ID } from '../../../shared/constants/test-checkout-ids';

test.describe.configure({ mode: 'serial' });

test.describe('Suite List-IA S10: YourTurnBadge', () => {
  let flagEnabled = false;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
      storageState: path.join(__dirname, '../../../.auth/technical-manager.json'),
    });
    const probe = await context.newPage();
    await probe.goto(`/checkouts/${CHECKOUT_009_ID}`);
    await probe.waitForLoadState('domcontentloaded');
    flagEnabled = await probe.locator('section[data-checkout-id]').isVisible();
    await context.close();
  });

  test('technical_manager: APPROVED 반출 row에 your-turn-badge 표시', async ({
    techManagerPage: page,
  }, testInfo) => {
    if (!flagEnabled) {
      testInfo.skip(true, 'NextStepPanel feature flag 비활성 — 건너뜀');
      return;
    }

    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // APPROVED 반출 그룹이 화면에 보일 때까지 대기
    const badge = page.locator('[data-testid="your-turn-badge"]').first();
    await expect(badge).toBeVisible({ timeout: 10000 });
    await expect(badge).toContainText(/내 차례|Your Turn/);
  });

  test('test_engineer: 동일 목록에서 your-turn-badge 미표시', async ({ browser }, testInfo) => {
    if (!flagEnabled) {
      testInfo.skip(true, 'NextStepPanel feature flag 비활성 — 건너뜀');
      return;
    }

    const context = await browser.newContext({
      baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
      storageState: path.join(__dirname, '../../../.auth/test-engineer.json'),
    });
    const page = await context.newPage();
    await page.goto('/checkouts');
    await page.waitForLoadState('domcontentloaded');

    // test_engineer는 badge 미표시
    const badge = page.locator('[data-testid="your-turn-badge"]');
    await expect(badge).toHaveCount(0);
    await context.close();
  });
});
