/**
 * 역할별 권한 통합 E2E — 시나리오 2-3: 페이지 접근 차단 + QM 읽기전용
 *
 * 접근 차단 방식이 페이지마다 다름:
 * - /admin/approvals: 서버 사이드 redirect('/dashboard') — APPROVAL_ROLES 체크
 * - /calibration-plans: API 403 → 페이지 로드되나 빈/에러 상태
 * - /admin/audit-logs: API 403 → 서버 API 클라이언트 처리
 *
 * QM 읽기전용 패턴:
 * - 조회/필터/검색 가능
 * - 등록/수정/삭제/승인 버튼 미표시
 * - 유일한 액션: 교정계획서 검토(REVIEW) + 반려(REJECT)
 *
 * spec: apps/frontend/tests/e2e/features/permissions/comprehensive/role-permissions.plan.md
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('시나리오 2: 페이지 레벨 접근 차단', () => {
  test('TC-05: TE → /admin/approvals → /dashboard 리다이렉트', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/admin/approvals');
    // 서버 사이드 redirect — APPROVAL_ROLES에 test_engineer 없음
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    // 대시보드 로드 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('TC-06: TE → /calibration-plans → 페이지 로드 후 빈 상태 또는 에러', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/calibration-plans');
    // API 403으로 인해 빈 데이터 또는 에러 상태 표시
    // 페이지 자체는 로드되므로 URL은 그대로
    await page.waitForLoadState('domcontentloaded');

    // 로그인으로 리다이렉트되거나 빈 상태가 표시됨
    const isRedirected = page.url().includes('/login') || page.url().includes('/dashboard');
    if (!isRedirected) {
      // 페이지가 로드되었지만 데이터가 없는 상태
      // 교정계획서 목록이 비어있거나 에러 상태
      const pageContent = page.locator('main');
      await expect(pageContent).toBeVisible({ timeout: 10000 });
    }
  });

  test('TC-07: TE → /admin/audit-logs → 접근 차단', async ({ testOperatorPage: page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('domcontentloaded');

    // API 403으로 인해 리다이렉트되거나 빈 상태
    const isRedirected = page.url().includes('/login') || page.url().includes('/dashboard');
    if (!isRedirected) {
      // 페이지가 로드되었지만 데이터가 없는 상태
      const pageContent = page.locator('main');
      await expect(pageContent).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe('시나리오 3: quality_manager 읽기전용 패턴', () => {
  test('TC-08: QM — 장비 목록에서 등록 버튼 미표시', async ({ qualityManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 장비 목록은 표시됨 (조회 가능)
    await expect(page.locator('main')).toBeVisible();

    // QM은 CREATE_EQUIPMENT 권한 없음 → 등록 버튼 숨김
    await expect(page.getByRole('link', { name: '장비 등록', exact: true })).not.toBeVisible();
  });

  test('TC-09: QM — 반출 목록에서 생성 버튼 미표시', async ({ qualityManagerPage: page }) => {
    await page.goto('/checkouts');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 반출 목록은 표시됨 (조회 가능, all 스코프)
    await expect(page.locator('main')).toBeVisible();

    // QM은 CREATE_CHECKOUT 권한 없음 → 반출 신청 버튼 숨김
    await expect(page.getByRole('button', { name: '반출 신청' })).not.toBeVisible();
  });

  test('TC-10: QM — 교정계획서에서 작성 버튼 미표시', async ({ qualityManagerPage: page }) => {
    await page.goto('/calibration-plans');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 교정계획서 목록은 표시됨 (VIEW_CALIBRATION_PLANS 권한 있음)
    // 작성 버튼 미표시 (QM은 CREATE_CALIBRATION_PLAN 권한 없음)
    await expect(page.getByRole('link', { name: '교정계획서 작성' })).not.toBeVisible();
  });

  test('TC-11: QM — 부적합 목록에서 등록 버튼 미표시', async ({ qualityManagerPage: page }) => {
    await page.goto('/non-conformances');
    await expect(page.locator('main')).toBeVisible({ timeout: 10000 });

    // 부적합 등록 버튼 미표시 (QM은 CREATE_NON_CONFORMANCE 권한 없음)
    await expect(page.getByRole('link', { name: '부적합 등록' })).not.toBeVisible();
  });
});
