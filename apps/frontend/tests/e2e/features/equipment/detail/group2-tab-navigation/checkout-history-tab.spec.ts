/**
 * Equipment Detail Page - Checkout History Tab
 *
 * Checkout 타임라인 UI 및 UL-QP-18-06 export 버튼 접근성 검증.
 * - Approved 이상 이력 → 버튼 노출: wf-03/wf-04 워크플로 스펙에서 full-cycle로 커버.
 * - Pending 이력 → 버튼 미노출: 이 스펙에서 검증 (스펙트럼 분석기 = pending 이력만).
 */

import { test, expect } from '../../../../shared/fixtures/auth.fixture';
import { EQUIP_SPECTRUM_ANALYZER_SUW_E_ID } from '../../../../shared/constants/test-equipment-ids';

test.describe('Tab Navigation — Checkout History', () => {
  test('반출이력 탭이 타임라인 카드 또는 빈 상태를 렌더한다', async ({
    testOperatorPage: page,
  }) => {
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`);

    const checkoutTab = page.locator('[role="tab"][aria-label="반출 이력 탭"]');
    await checkoutTab.click();

    const checkoutPanel = page.locator('[role="tabpanel"][aria-label="반출 이력 탭 패널"]');
    await expect(checkoutPanel).toBeVisible();

    // 타임라인 카드(이력 있음) 또는 빈 상태(이력 없음) 중 하나가 반드시 존재
    const hasTimeline = (await page.locator('[data-timeline-card]').count()) > 0;
    const hasEmptyState = (await page.locator('text=/반출 이력이 없습니다/i').count()) > 0;
    expect(hasTimeline || hasEmptyState).toBeTruthy();
  });

  test('pending 반출 이력은 양식 내보내기 버튼을 렌더하지 않는다', async ({
    testOperatorPage: page,
  }) => {
    // 스펙트럼 분석기는 seed에서 pending 이력(CHECKOUT_065_ID)만 포함됨
    await page.goto(`/equipment/${EQUIP_SPECTRUM_ANALYZER_SUW_E_ID}`);

    const checkoutTab = page.locator('[role="tab"][aria-label="반출 이력 탭"]');
    await checkoutTab.click();

    const checkoutPanel = page.locator('[role="tabpanel"][aria-label="반출 이력 탭 패널"]');
    await expect(checkoutPanel).toBeVisible();

    // pending 상태는 isCheckoutExportable() = false → 버튼 미렌더
    const exportButtons = page.locator('[role="tabpanel"] button:has-text("양식 내보내기")');
    await expect(exportButtons).toHaveCount(0);
  });
});
