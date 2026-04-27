/**
 * AP-01: URL tab 파라미터 Zod 검증 — 잘못된 값 → fallback redirect (AR-5)
 *
 * 검증:
 * - 유효하지 않은 tab 파라미터 → 기본 탭으로 redirect
 * - 유효한 tab 파라미터 → 해당 탭 활성화 유지
 * - tab 파라미터 없음 → 기본 탭 표시
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const APPROVALS_PAGE = '/admin/approvals';

test.describe('Approval Tab Zod Fallback (AP-01 AR-5)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('유효하지 않은 tab 파라미터는 기본 탭으로 redirect된다', async ({ labManagerPage }) => {
    await labManagerPage.goto(`${APPROVALS_PAGE}?tab=invalid_tab_xyz`);
    await labManagerPage.waitForLoadState('networkidle');

    // redirect 후 URL에 invalid_tab_xyz가 없어야 함
    const url = labManagerPage.url();
    expect(url).not.toContain('tab=invalid_tab_xyz');

    // 페이지가 정상 로드되어야 함
    await expect(labManagerPage.getByTestId('kpi-value-urgent')).toBeVisible();
  });

  test('tab 파라미터 없이 접근하면 기본 탭이 표시된다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    // 페이지가 정상 로드되어야 함
    await expect(labManagerPage.getByTestId('kpi-value-urgent')).toBeVisible();
  });

  test('유효한 tab 파라미터는 해당 탭을 활성화한다', async ({ labManagerPage }) => {
    // equipment는 lab_manager 기본 탭
    await labManagerPage.goto(`${APPROVALS_PAGE}?tab=equipment`);
    await labManagerPage.waitForLoadState('networkidle');

    // URL에 tab=equipment 유지
    await expect(labManagerPage).toHaveURL(/tab=equipment/);
    await expect(labManagerPage.getByTestId('kpi-value-urgent')).toBeVisible();
  });

  test('품질책임자도 탭 fallback이 정상 동작한다', async ({ qualityManagerPage }) => {
    await qualityManagerPage.goto(`${APPROVALS_PAGE}?tab=__invalid__`);
    await qualityManagerPage.waitForLoadState('networkidle');

    const url = qualityManagerPage.url();
    expect(url).not.toContain('tab=__invalid__');
    await expect(qualityManagerPage.getByTestId('kpi-value-urgent')).toBeVisible();
  });
});
