/**
 * 승인 관리 - 접근 제어 + 탭 URL 동기화
 *
 * 시나리오 1: 역할별 접근 제어
 * 시나리오 9: 탭 URL 동기화
 *
 * SSOT: shared-constants ROLE_APPROVAL_CATEGORIES, APPROVAL_ROLES
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('승인 페이지 접근 제어', () => {
  test('TC-01: test_engineer는 /admin/approvals 접근 시 /dashboard로 리다이렉트', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/admin/approvals');
    // APPROVAL_ROLES에 포함되지 않으므로 redirect('/dashboard')
    await page.waitForURL('**/dashboard**', { timeout: 10000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-02: technical_manager는 8개 사이드바 탭 표시', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // 사이드바 네비게이션 (lg+ 데스크탑)
    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar).toBeVisible();

    // TM은 8개 탭: outgoing, incoming, equipment, calibration, inspection, nonconformity, disposal_review, software
    const expectedTabs = [
      '반출',
      '반입',
      '장비',
      '교정 기록',
      '중간점검',
      '부적합 재개',
      '폐기 검토',
      '소프트웨어',
    ];

    for (const tabName of expectedTabs) {
      await expect(sidebar.getByRole('button', { name: new RegExp(tabName) })).toBeVisible();
    }

    // TM에게 보이면 안 되는 탭
    await expect(sidebar.getByRole('button', { name: /폐기 승인/ })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: /교정계획서 승인/ })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: /교정계획서 검토/ })).not.toBeVisible();
  });

  test('TC-03: quality_manager는 1개 탭만 표시 (plan_review)', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar).toBeVisible();

    // QM은 plan_review 1개 탭만 표시
    await expect(sidebar.getByRole('button', { name: /교정계획서 검토/ })).toBeVisible();

    // 다른 탭은 보이면 안 됨
    await expect(sidebar.getByRole('button', { name: /반출/ })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: /장비/ })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: /교정 기록/ })).not.toBeVisible();
  });

  test('TC-04: lab_manager는 3개 탭 표시 (incoming, disposal_final, plan_final)', async ({
    siteAdminPage: page,
  }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar).toBeVisible();

    // LM은 3개: disposal_final, plan_final, incoming
    const expectedTabs = ['폐기 승인', '교정계획서 승인', '반입'];

    for (const tabName of expectedTabs) {
      await expect(sidebar.getByRole('button', { name: new RegExp(tabName) })).toBeVisible();
    }

    // LM에게 보이면 안 되는 탭
    await expect(sidebar.getByRole('button', { name: /반출/ })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: /교정 기록/ })).not.toBeVisible();
    await expect(sidebar.getByRole('button', { name: /폐기 검토/ })).not.toBeVisible();
  });

  test('TC-05: system_admin은 "승인 권한이 없습니다" 메시지 표시', async ({
    systemAdminPage: page,
  }) => {
    await page.goto('/admin/approvals');

    // system_admin은 APPROVAL_ROLES에 포함되지만 ROLE_TABS가 빈 배열
    // → availableTabs.length === 0 → "승인 권한이 없습니다"
    // 또는 APPROVAL_ROLES에 포함되지 않아 redirect
    // 코드 확인: APPROVAL_ROLES = ['technical_manager', 'quality_manager', 'lab_manager', 'system_admin']
    // system_admin은 포함 → 페이지 진입은 가능하지만 탭이 없음

    await expect(page.getByText('승인 권한이 없습니다')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('탭 URL 동기화', () => {
  test('TC-06: ?tab=equipment → 장비 탭 활성화', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=equipment');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    // 장비 버튼이 활성 상태 (aria-current="page")
    const equipmentBtn = sidebar.getByRole('button', { name: /장비/ });
    await expect(equipmentBtn).toHaveAttribute('aria-current', 'page');
  });

  test('TC-07: 탭 변경 시 URL 파라미터 업데이트 + 선택 초기화', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });

    // 교정 기록 탭 클릭
    await sidebar.getByRole('button', { name: /교정 기록/ }).click();

    // URL이 업데이트되는지 확인
    await expect(page).toHaveURL(/tab=calibration/);

    // 교정 기록 버튼이 활성 상태
    await expect(sidebar.getByRole('button', { name: /교정 기록/ })).toHaveAttribute(
      'aria-current',
      'page'
    );
  });
});
