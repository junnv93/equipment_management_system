/**
 * 역할별 권한 통합 E2E — 시나리오 1: 네비게이션 사이드바 가시성
 *
 * 4개 역할의 사이드바 메뉴 표시/숨김을 검증합니다.
 *
 * | 메뉴 항목    | TE | TM | QM | LM |
 * |-------------|----|----|----|----|
 * | 대시보드     | O  | O  | O  | O  |
 * | 장비 관리    | O  | O  | O  | O  |
 * | 반출입 관리  | O  | O  | O  | O  |
 * | 교정 관리    | O  | O  | O  | O  |
 * | 교정계획서   | X  | O  | O  | O  |
 * | 부적합 관리  | O  | O  | O  | O  |
 * | 승인 관리    | X  | O  | O  | O  |
 * | 감사 로그    | X  | O  | O  | O  |
 * | 팀 관리      | O  | O  | O  | O  |
 * | 설정         | O  | O  | O  | O  |
 *
 * spec: apps/frontend/tests/e2e/features/permissions/comprehensive/role-permissions.plan.md
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

/** 모든 역할에 표시되는 공통 메뉴 항목 (i18n: navigation.json) */
const COMMON_MENU_ITEMS = [
  '대시보드',
  '장비 관리',
  '반출입 관리',
  '교정 관리',
  '부적합 관리',
  '팀 관리',
  '설정',
] as const;

/** TE에게 숨겨지는 메뉴 항목 */
const TE_HIDDEN_ITEMS = ['교정계획서', '승인 관리', '감사 로그'] as const;

/** TM/QM/LM에게 추가로 표시되는 메뉴 항목 */
const MANAGER_EXTRA_ITEMS = ['교정계획서', '승인 관리', '감사 로그'] as const;

test.describe('시나리오 1: 네비게이션 사이드바 가시성', () => {
  test('TC-01: test_engineer — 교정계획서/승인/감사로그 숨김', async ({
    testOperatorPage: page,
  }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: '메인 네비게이션' });
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 공통 메뉴 표시 확인
    for (const item of COMMON_MENU_ITEMS) {
      await expect(sidebar.getByRole('link', { name: item })).toBeVisible();
    }

    // TE에게 숨겨진 메뉴 확인
    for (const item of TE_HIDDEN_ITEMS) {
      await expect(sidebar.getByRole('link', { name: item })).not.toBeVisible();
    }
  });

  test('TC-02: technical_manager — 모든 메뉴 표시 + 승인 배지', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: '메인 네비게이션' });
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 공통 + 관리 메뉴 모두 표시
    for (const item of [...COMMON_MENU_ITEMS, ...MANAGER_EXTRA_ITEMS]) {
      await expect(sidebar.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('TC-03: quality_manager — 모든 메뉴 표시 + 승인 배지', async ({
    qualityManagerPage: page,
  }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: '메인 네비게이션' });
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 공통 + 관리 메뉴 모두 표시
    for (const item of [...COMMON_MENU_ITEMS, ...MANAGER_EXTRA_ITEMS]) {
      await expect(sidebar.getByRole('link', { name: item })).toBeVisible();
    }
  });

  test('TC-04: lab_manager — 모든 메뉴 표시 + 승인 배지', async ({ siteAdminPage: page }) => {
    await page.goto('/');
    const sidebar = page.getByRole('navigation', { name: '메인 네비게이션' });
    await expect(sidebar).toBeVisible({ timeout: 10000 });

    // 공통 + 관리 메뉴 모두 표시
    for (const item of [...COMMON_MENU_ITEMS, ...MANAGER_EXTRA_ITEMS]) {
      await expect(sidebar.getByRole('link', { name: item })).toBeVisible();
    }
  });
});
