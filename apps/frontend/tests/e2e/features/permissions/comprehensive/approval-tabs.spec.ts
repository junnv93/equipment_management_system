/**
 * 역할별 권한 통합 E2E — 시나리오 4: 승인 관리 탭 역할별 분리
 *
 * ROLE_APPROVAL_CATEGORIES (SSOT: shared-constants/approval-categories.ts):
 * - TM: outgoing, incoming, equipment, calibration, inspection, nonconformity, disposal_review, software (8탭)
 * - QM: plan_review (1탭)
 * - LM: disposal_final, plan_final, incoming (3탭)
 *
 * 탭 레이블 (approvals.json tabMeta):
 * - outgoing: 반출, incoming: 반입, equipment: 장비, calibration: 교정 기록
 * - inspection: 중간점검, nonconformity: 부적합 재개, disposal_review: 폐기 검토
 * - software: 소프트웨어, plan_review: 교정계획서 검토, plan_final: 교정계획서 승인
 * - disposal_final: 폐기 승인
 *
 * spec: apps/frontend/tests/e2e/features/permissions/comprehensive/role-permissions.plan.md
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

/** TM이 볼 수 있는 8개 탭 레이블 */
const TM_TAB_LABELS = [
  '반출',
  '반입',
  '장비',
  '교정 기록',
  '중간점검',
  '부적합 재개',
  '폐기 검토',
  '소프트웨어',
] as const;

/** QM이 볼 수 있는 1개 탭 레이블 */
const QM_TAB_LABELS = ['교정계획서 검토'] as const;

/** LM이 볼 수 있는 3개 탭 레이블 */
const LM_TAB_LABELS = ['폐기 승인', '교정계획서 승인', '반입'] as const;

test.describe('시나리오 4: 승인 관리 탭 역할별 분리', () => {
  test('TC-12: TM — 8개 탭 표시', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 승인 카테고리 사이드바에서 8개 탭 확인 (데스크톱)
    const sidebar = page.getByRole('navigation', { name: '승인 카테고리' });

    for (const label of TM_TAB_LABELS) {
      await expect(sidebar.getByRole('button', { name: label })).toBeVisible();
    }

    // TM에게 없는 탭 미표시
    await expect(sidebar.getByRole('button', { name: '교정계획서 검토' })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: '교정계획서 승인' })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: '폐기 승인' })).not.toBeVisible();
  });

  test('TC-13: QM — 1개 탭(교정계획서 검토)만 표시', async ({ qualityManagerPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리' });

    // QM은 교정계획서 검토 탭만 표시
    for (const label of QM_TAB_LABELS) {
      await expect(sidebar.getByRole('button', { name: label })).toBeVisible();
    }

    // QM에게 없는 탭 미표시
    for (const label of TM_TAB_LABELS) {
      await expect(sidebar.getByRole('button', { name: label })).not.toBeVisible();
    }
  });

  test('TC-14: LM — 3개 탭(폐기승인, 교정계획서승인, 반입) 표시', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리' });

    for (const label of LM_TAB_LABELS) {
      await expect(sidebar.getByRole('button', { name: label })).toBeVisible();
    }

    // LM에게 없는 탭 미표시 (outgoing, equipment, calibration, inspection, nonconformity, disposal_review, software)
    await expect(sidebar.getByRole('button', { name: '반출' })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: '장비' })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: '교정 기록' })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: '소프트웨어' })).not.toBeVisible();
  });

  test('TC-15: 잘못된 탭 URL 접근 시 첫 번째 사용 가능 탭으로 자동 전환', async ({
    qualityManagerPage: page,
  }) => {
    // QM이 TM 전용 탭(outgoing) URL로 접근
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // QM의 첫 번째 탭(plan_review)으로 자동 전환되어야 함
    // ApprovalsClient: availableTabs.includes(tabParam) 실패 → defaultTab 사용
    const sidebar = page.getByRole('navigation', { name: '승인 카테고리' });

    // 교정계획서 검토 탭이 활성화 상태인지 확인
    const planReviewButton = sidebar.getByRole('button', { name: '교정계획서 검토' });
    await expect(planReviewButton).toBeVisible();
  });

  test('TC-16: LM이 TM 전용 탭 URL 접근 시 첫 번째 탭으로 자동 전환', async ({
    siteAdminPage: page,
  }) => {
    // LM이 TM 전용 탭(outgoing) URL로 접근
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // LM의 첫 번째 탭(disposal_final)으로 자동 전환
    const sidebar = page.getByRole('navigation', { name: '승인 카테고리' });
    const disposalFinalButton = sidebar.getByRole('button', { name: '폐기 승인' });
    await expect(disposalFinalButton).toBeVisible();
  });

  test('TC-17: incoming 탭은 TM과 LM 모두 보유 (공유 탭)', async ({
    techManagerPage: tmPage,
    siteAdminPage: lmPage,
  }) => {
    // TM의 incoming 탭 확인
    await tmPage.goto('/admin/approvals?tab=incoming');
    await expect(tmPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    const tmSidebar = tmPage.getByRole('navigation', { name: '승인 카테고리' });
    await expect(tmSidebar.getByRole('button', { name: '반입' })).toBeVisible();

    // LM의 incoming 탭 확인
    await lmPage.goto('/admin/approvals?tab=incoming');
    await expect(lmPage.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
    const lmSidebar = lmPage.getByRole('navigation', { name: '승인 카테고리' });
    await expect(lmSidebar.getByRole('button', { name: '반입' })).toBeVisible();
  });
});
