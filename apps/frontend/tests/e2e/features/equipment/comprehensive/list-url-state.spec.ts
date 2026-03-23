// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - URL 상태 유지', () => {
  test('필터 상태가 URL 파라미터에 동기화됨', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 검색어 입력
    const searchBox = page.getByPlaceholder('장비명, 모델명, 관리번호로 검색');
    await searchBox.fill('분석기');
    await searchBox.press('Enter');
    await expect(page).toHaveURL(/search=/);

    // 상태 필터 적용
    const statusFilter = page.getByRole('combobox', { name: '장비 상태 필터 선택' });
    await statusFilter.click();
    await page.getByRole('option', { name: '사용 가능' }).click();
    await expect(page).toHaveURL(/status=available/);

    // URL에 검색어 + 상태 모두 포함
    const url = page.url();
    expect(url).toContain('search=');
    expect(url).toContain('status=available');
  });

  test('URL 파라미터로 직접 접근 시 필터 복원', async ({ techManagerPage: page }) => {
    // URL에 필터 파라미터를 직접 설정하여 접근
    await page.goto('/equipment?status=available&calibrationDueFilter=due_soon');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 필터 배지가 올바르게 표시되는지 확인
    await expect(page.getByText('상태: 사용 가능')).toBeVisible();
    await expect(page.getByText(/교정기한:.*교정 임박/)).toBeVisible();
  });

  test('정렬 상태가 URL 파라미터에 반영됨', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 장비명 컬럼 헤더 정렬 클릭
    const nameHeader = page.getByRole('columnheader').filter({ hasText: '장비명' });
    await nameHeader.getByRole('button').click();
    await expect(page).toHaveURL(/sortBy=name/);

    // 같은 컬럼 다시 클릭 → 정렬 방향 토글
    await nameHeader.getByRole('button').click();
    await expect(page).toHaveURL(/sortOrder=desc/);
  });

  test('페이지네이션 상태가 URL에 반영됨', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    const page2Button = page.getByRole('button', { name: '2 페이지로 이동' });
    if (await page2Button.isVisible()) {
      await page2Button.click();
      await expect(page).toHaveURL(/page=2/);
    }
  });

  test('역할별 기본 필터 자동 적용', async ({ testOperatorPage: page }) => {
    // test_engineer는 소속 사이트/팀이 기본 필터로 적용됨
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 사이트 기본 필터가 URL에 반영
    await expect(page).toHaveURL(/site=suwon/);

    // 필터 배지 표시 확인
    await expect(page.getByText('사이트: 수원랩')).toBeVisible();
  });
});
