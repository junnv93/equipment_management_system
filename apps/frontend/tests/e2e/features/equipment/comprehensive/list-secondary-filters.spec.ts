// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - Secondary 필터 (교정방법/분류/공용/팀)', () => {
  test('추가 필터 버튼 클릭 시 2차 필터 영역 확장', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 추가 필터 버튼 클릭
    const moreFiltersBtn = page.getByRole('button', { name: /추가 필터/ });
    await expect(moreFiltersBtn).toBeVisible();
    await moreFiltersBtn.click();

    // 2차 필터 드롭다운들이 표시됨
    await expect(page.getByRole('combobox', { name: '교정 방법 필터 선택' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: '장비 분류 필터 선택' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: '장비 구분 필터 선택' })).toBeVisible();
    await expect(page.getByRole('combobox', { name: '팀 필터 선택' })).toBeVisible();
  });

  test('교정 방법 필터 선택 시 URL 반영', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 추가 필터 확장
    await page.getByRole('button', { name: /추가 필터/ }).click();

    // 교정 방법 필터 선택
    const calibFilter = page.getByRole('combobox', { name: '교정 방법 필터 선택' });
    await calibFilter.click();
    await page.getByRole('option', { name: '외부 교정' }).click();

    await expect(page).toHaveURL(/calibrationMethod=external_calibration/);
    await expect(page.getByText('교정: 외부 교정')).toBeVisible();
  });

  test('장비 분류 필터 선택 시 URL 반영', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 추가 필터 확장
    await page.getByRole('button', { name: /추가 필터/ }).click();

    // 분류 필터 선택
    const classFilter = page.getByRole('combobox', { name: '장비 분류 필터 선택' });
    await classFilter.click();
    await page.getByRole('option', { name: 'FCC EMC/RF' }).click();

    await expect(page).toHaveURL(/classification=fcc_emc_rf/);
    await expect(page.getByText('분류: FCC EMC/RF')).toBeVisible();
  });

  test('공용장비 필터 선택 시 URL 반영', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 추가 필터 확장
    await page.getByRole('button', { name: /추가 필터/ }).click();

    // 공용장비 필터 선택
    const sharedFilter = page.getByRole('combobox', { name: '장비 구분 필터 선택' });
    await sharedFilter.click();
    await page.getByRole('option', { name: '공용장비' }).click();

    await expect(page).toHaveURL(/isShared=shared/);
    await expect(page.getByText(/장비 구분:.*공용장비/)).toBeVisible();
  });

  test('팀 필터 선택 시 URL 반영', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 추가 필터 확장
    await page.getByRole('button', { name: /추가 필터/ }).click();

    // 팀 필터 클릭 — 옵션이 로드될 때까지 대기
    const teamFilter = page.getByRole('combobox', { name: '팀 필터 선택' });
    await teamFilter.click();

    // 첫 번째 팀 옵션 선택 (모든 팀 제외)
    const firstTeamOption = page.getByRole('option').filter({ hasNotText: '모든 팀' }).first();
    if (await firstTeamOption.isVisible()) {
      const teamName = await firstTeamOption.textContent();
      await firstTeamOption.click();
      await expect(page).toHaveURL(/teamId=/);
      await expect(page.getByText(new RegExp(`팀:.*${teamName}`))).toBeVisible();
    }
  });
});

test.describe('장비 목록 - 복합 필터', () => {
  test('여러 필터 동시 적용 (AND 조건)', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 1차: 상태 필터 (사이트는 기본값 사용)
    const statusFilter = page.getByRole('combobox', { name: '장비 상태 필터 선택' });
    await statusFilter.click();
    await page.getByRole('option', { name: '사용 가능' }).click();
    await expect(page).toHaveURL(/status=available/);

    // 2차: 추가 필터 확장 → 교정 방법
    await page.getByRole('button', { name: /추가 필터/ }).click();
    const calibFilter = page.getByRole('combobox', { name: '교정 방법 필터 선택' });
    await calibFilter.click();
    await page.getByRole('option', { name: '외부 교정' }).click();

    // 필터 배지 표시 확인
    await expect(page.getByText('상태: 사용 가능')).toBeVisible();
    await expect(page.getByText('교정: 외부 교정')).toBeVisible();

    // URL에 필터 파라미터 포함
    const url = page.url();
    expect(url).toContain('status=available');
    expect(url).toContain('calibrationMethod=external_calibration');
  });

  test('개별 필터 제거 시 다른 필터 유지', async ({ techManagerPage: page }) => {
    await page.goto('/equipment?status=available&calibrationDueFilter=due_soon');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 두 필터 배지 확인
    await expect(page.getByText('상태: 사용 가능')).toBeVisible();
    await expect(page.getByText(/교정기한:.*교정 임박/)).toBeVisible();

    // 상태 필터만 제거
    await page.getByRole('button', { name: '상태: 사용 가능 필터 제거' }).click();

    // 상태 필터 제거됨, 교정기한 필터 유지
    await expect(page.getByText('상태: 사용 가능')).not.toBeVisible();
    await expect(page.getByText(/교정기한:.*교정 임박/)).toBeVisible();

    const url = page.url();
    expect(url).not.toContain('status=available');
    expect(url).toContain('calibrationDueFilter=due_soon');
  });
});
