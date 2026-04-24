/**
 * Suite UX: 온보딩 pulse 힌트 (NextStepPanel CTA)
 *
 * useOnboardingHint('checkout-next-step') 연동을 검증합니다.
 * - localStorage 미설정 → primary CTA에 pulse 클래스 적용
 * - CTA 클릭 → localStorage에 dismiss 저장
 * - prefers-reduced-motion: reduce → pulse 미적용
 *
 * Feature Flag 의존: NEXT_PUBLIC_CHECKOUT_NEXT_STEP_PANEL=true
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { CHECKOUT_001_ID } from '../../../shared/constants/test-checkout-ids';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';

const ONBOARDING_KEY = 'onboarding-dismissed:checkout-next-step';
const CHECKOUT_DETAIL_URL = `${BASE_URLS.FRONTEND}/checkouts/${CHECKOUT_001_ID}`;

test.describe('UX: 온보딩 pulse 힌트', () => {
  test('최초 진입 시 primary CTA에 pulse 클래스가 적용된다', async ({ techManagerPage: page }) => {
    // localStorage에서 dismiss 키 제거 (최초 상태 시뮬레이션)
    await page.goto(CHECKOUT_DETAIL_URL);
    await page.evaluate((key) => localStorage.removeItem(key), ONBOARDING_KEY);
    await page.reload();

    // NextStepPanel primary CTA 대기
    const ctaButton = page.locator('[data-testid$="-action"]').first();
    await expect(ctaButton).toBeVisible({ timeout: 5000 });

    // pulse 관련 클래스 확인 (motion-safe:animate-pulse-hard 또는 animate-pulse)
    const className = await ctaButton.getAttribute('class');
    expect(className).toMatch(/pulse/);
  });

  test('CTA 클릭 후 localStorage에 dismiss가 저장된다', async ({ techManagerPage: page }) => {
    await page.goto(CHECKOUT_DETAIL_URL);
    await page.evaluate((key) => localStorage.removeItem(key), ONBOARDING_KEY);
    await page.reload();

    const ctaButton = page.locator('[data-testid$="-action"]').first();
    await expect(ctaButton).toBeVisible({ timeout: 5000 });
    await ctaButton.click();

    // dismiss 저장 확인
    const stored = await page.evaluate((key) => localStorage.getItem(key), ONBOARDING_KEY);
    expect(stored).toBe('true');
  });

  test('prefers-reduced-motion: reduce 환경에서는 pulse 클래스가 무효화된다', async ({
    techManagerPage: page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(CHECKOUT_DETAIL_URL);
    await page.evaluate((key) => localStorage.removeItem(key), ONBOARDING_KEY);
    await page.reload();

    const ctaButton = page.locator('[data-testid$="-action"]').first();
    await expect(ctaButton).toBeVisible({ timeout: 5000 });

    // motion-reduce:animate-none 이 적용되어 실제 pulse가 발생하지 않음 (CSS 레벨)
    // 클래스 자체는 남아있지만 motion-reduce 접두어로 비활성화
    const className = await ctaButton.getAttribute('class');
    // pulse 클래스가 없거나, motion-reduce:animate-none이 함께 포함되어야 함
    if (className?.includes('pulse')) {
      expect(className).toContain('motion-reduce:animate-none');
    }
  });
});
