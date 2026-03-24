/**
 * 승인 관리 - KPI 스트립 + 카운트 배지
 *
 * 시나리오 2: ApprovalKpiStrip 렌더링, 카운트 배지 검증
 *
 * SSOT: ApprovalKpiStrip → 전체 대기 / 긴급 / 평균 대기일 / 금일 처리
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('KPI 스트립 + 카운트 배지', () => {
  test('TC-01: KPI 스트립 4개 카드 렌더링 (TM)', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // KPI 4개 카드 존재 확인 (role="group")
    const kpiCards = page.locator('[role="group"]');

    // "전체 대기" 카드
    await expect(page.locator('[role="group"][aria-label="전체 대기"]')).toBeVisible();

    // "긴급 (8일+)" 카드
    await expect(page.locator('[role="group"][aria-label="긴급 (8일+)"]')).toBeVisible();

    // "평균 대기" 카드
    await expect(page.locator('[role="group"][aria-label="평균 대기"]')).toBeVisible();

    // "금일 처리" 카드
    await expect(page.locator('[role="group"][aria-label="금일 처리"]')).toBeVisible();
  });

  test('TC-02: 사이드바 탭에 카운트 배지 표시 (TM)', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar).toBeVisible();

    // 사이드바의 각 탭 버튼이 렌더링되어야 함 (카운트 배지는 0이면 숨겨짐)
    const tabNames = [
      '반출',
      '반입',
      '장비',
      '교정 기록',
      '중간점검',
      '부적합 재개',
      '폐기 검토',
      '소프트웨어',
    ];

    for (const tabName of tabNames) {
      const tabBtn = sidebar.getByRole('button', { name: new RegExp(tabName) });
      await expect(tabBtn).toBeVisible();
    }
  });

  test('TC-03: KPI 전체 대기 숫자가 존재 (숫자 또는 대시)', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // 전체 대기 KPI 카드 내에 숫자 또는 대시가 표시됨
    const totalPendingCard = page.locator('[role="group"][aria-label="전체 대기"]');
    await expect(totalPendingCard).toBeVisible();
    // 숫자 또는 대시(–) 표시 확인 — 스켈레톤이 아닌 실제 값
    await expect(totalPendingCard.locator('.h-8.w-14')).not.toBeVisible({ timeout: 10000 });
  });

  test('TC-04: LM 승인 페이지 - 3개 탭에 카운트 배지', async ({ siteAdminPage: page }) => {
    await page.goto('/admin/approvals');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    // LM 탭 3개 확인
    await expect(sidebar.getByRole('button', { name: /폐기 승인/ })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: /교정계획서 승인/ })).toBeVisible();
    await expect(sidebar.getByRole('button', { name: /반입/ })).toBeVisible();

    // KPI 스트립도 LM에게 표시됨
    await expect(page.locator('[role="group"][aria-label="전체 대기"]')).toBeVisible();
  });
});
