/**
 * 접근성 게이트 — 교정계획서 (WCAG 2.1 AA)
 *
 * 대상: list / detail / create / reject dialog
 * critical + serious violation 0이 게이트 조건.
 *
 * @axe-core/playwright 사용.
 * color-contrast는 CI 다크모드 설정 의존 — 제외.
 *
 * 임계값 SSOT: docs/operations/performance-budgets.md
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';
import { TEST_CALIBRATION_PLAN_IDS } from '../shared/constants/shared-test-data';

const LIST_PAGE = '/calibration-plans';
const CREATE_PAGE = '/calibration-plans/create';

function detailPage(id: string) {
  return `${LIST_PAGE}/${id}`;
}

function runAxe(page: import('@playwright/test').Page) {
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .disableRules(['color-contrast'])
    .analyze();
}

function assertNoHighImpact(results: Awaited<ReturnType<typeof runAxe>>) {
  const violations = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious'
  );
  if (violations.length > 0) {
    const summary = violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
      help: v.helpUrl,
    }));
    console.error('접근성 위반:', JSON.stringify(summary, null, 2));
  }
  expect(violations).toHaveLength(0);
}

test.describe('접근성 — 교정계획서 목록 (WCAG 2.1 AA)', () => {
  test('violation 0 — TM 인증 상태', async ({ techManagerPage: page }) => {
    await page.goto(LIST_PAGE);
    await expect(page.getByRole('heading', { name: '교정계획서' })).toBeVisible({
      timeout: 15000,
    });

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});

test.describe('접근성 — 교정계획서 상세 (WCAG 2.1 AA)', () => {
  test('violation 0 — approved 계획서 (CPLAN_004)', async ({ techManagerPage: page }) => {
    await page.goto(detailPage(TEST_CALIBRATION_PLAN_IDS.CPLAN_004_APPROVED));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });

  test('violation 0 — draft 계획서 (CPLAN_001)', async ({ techManagerPage: page }) => {
    await page.goto(detailPage(TEST_CALIBRATION_PLAN_IDS.CPLAN_001_DRAFT));
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15000 });

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});

test.describe('접근성 — 교정계획서 작성 (WCAG 2.1 AA)', () => {
  test('violation 0 — create 페이지', async ({ techManagerPage: page }) => {
    await page.goto(CREATE_PAGE);
    await expect(page.getByText('교정계획서 작성').first()).toBeVisible({ timeout: 15000 });

    const results = await runAxe(page);
    assertNoHighImpact(results);
  });
});

test.describe('접근성 — 반려 다이얼로그 열린 상태 (WCAG 2.1 AA)', () => {
  test('violation 0 — QM 반려 다이얼로그 (CPLAN_006)', async ({ qualityManagerPage: page }) => {
    await page.goto(detailPage(TEST_CALIBRATION_PLAN_IDS.CPLAN_006_RESUBMITTED));
    await expect(page.getByText(/확인 대기|검토 대기|pending/i).first()).toBeVisible({
      timeout: 15000,
    });

    const rejectButton = page.getByRole('button', { name: /반려/ });
    const isVisible = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await rejectButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 반려 다이얼로그 열린 상태에서 axe 실행
    const results = await runAxe(page);
    assertNoHighImpact(results);

    await dialog.getByRole('button', { name: /취소/ }).click();
  });

  test('violation 0 — LM 반려 다이얼로그 (CPLAN_003)', async ({ siteAdminPage: page }) => {
    await page.goto(detailPage(TEST_CALIBRATION_PLAN_IDS.CPLAN_003_PENDING_APPROVAL));
    await expect(page.getByText(/승인 대기|pending/i).first()).toBeVisible({ timeout: 15000 });

    const rejectButton = page.getByRole('button', { name: /반려/ });
    const isVisible = await rejectButton.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) {
      test.skip();
      return;
    }

    await rejectButton.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const results = await runAxe(page);
    assertNoHighImpact(results);

    await dialog.getByRole('button', { name: /취소/ }).click();
  });
});
