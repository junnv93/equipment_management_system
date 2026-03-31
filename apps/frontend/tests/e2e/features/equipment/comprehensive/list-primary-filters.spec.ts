// spec: apps/frontend/tests/e2e/features/equipment/equipment-comprehensive.plan.md
// seed: apps/frontend/tests/e2e/shared/seed/equipment-seed.spec.ts

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - Primary 필터 (사이트/상태/교정기한)', () => {
  test('사이트 필터 선택 시 URL 반영 및 결과 필터링', async ({ techManagerPage: page }) => {
    // 기술책임자로 테스트 (사이트 기본 필터가 적용되지만 변경 가능)
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 사이트 필터 클릭
    const siteFilter = page.getByRole('combobox', { name: '사이트 필터 선택' });
    await siteFilter.click();

    // 사이트 옵션 확인
    await expect(page.getByRole('option', { name: '모든 사이트' })).toBeVisible();
    await expect(page.getByRole('option', { name: '수원랩' })).toBeVisible();
    await expect(page.getByRole('option', { name: '의왕랩' })).toBeVisible();
    await expect(page.getByRole('option', { name: '평택랩' })).toBeVisible();

    // 의왕랩 선택 (기본 수원랩에서 변경)
    await page.getByRole('option', { name: '의왕랩' }).click();
    await expect(page).toHaveURL(/site=uiwang/);

    // 필터 배지 표시
    await expect(page.getByText('사이트: 의왕랩')).toBeVisible();
  });

  test('상태 필터 선택 시 URL 반영 및 결과 필터링', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 상태 필터 클릭
    const statusFilter = page.getByRole('combobox', { name: '장비 상태 필터 선택' });
    await statusFilter.click();

    // '사용 가능' 선택
    await page.getByRole('option', { name: '사용 가능' }).click();
    await expect(page).toHaveURL(/status=available/);

    // 필터 배지 표시
    await expect(page.getByText('상태: 사용 가능')).toBeVisible();

    // 결과 테이블에 장비 표시
    await expect(page.getByRole('grid', { name: '장비 목록' })).toBeVisible();
  });

  test('교정기한 필터 선택 시 URL 반영', async ({ techManagerPage: page }) => {
    await page.goto('/equipment');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 교정기한 필터 클릭
    const calDueFilter = page.getByRole('combobox', { name: '교정 기한 필터 선택' });
    await calDueFilter.click();

    // '교정 임박' 선택
    await page.getByRole('option', { name: '교정 임박' }).click();
    await expect(page).toHaveURL(/calibrationDueFilter=due_soon/);

    // 필터 배지 표시
    await expect(page.getByText(/교정기한:.*교정 임박/)).toBeVisible();
  });

  test('필터 배지 X 버튼으로 개별 필터 제거', async ({ techManagerPage: page }) => {
    await page.goto('/equipment?status=available');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 필터 배지 확인
    await expect(page.getByText('상태: 사용 가능')).toBeVisible();

    // 필터 제거 버튼 클릭
    await page.getByRole('button', { name: '상태: 사용 가능 필터 제거' }).click();

    // URL에서 status 파라미터 제거
    await expect(page).not.toHaveURL(/status=available/);
    await expect(page.getByText('상태: 사용 가능')).not.toBeVisible();
  });

  test('초기화 버튼으로 모든 필터 제거', async ({ techManagerPage: page }) => {
    await page.goto('/equipment?status=available&calibrationDueFilter=overdue');
    await expect(page.getByRole('heading', { name: '장비 관리' })).toBeVisible();

    // 필터 배지들 확인
    await expect(page.getByText('상태: 사용 가능')).toBeVisible();

    // 초기화 버튼 클릭 (strict mode: 여러 초기화 버튼 중 필터 영역의 것 선택)
    await page.getByRole('button', { name: '초기화' }).first().click();

    // 모든 필터 제거 확인
    await expect(page.getByText('상태: 사용 가능')).not.toBeVisible();
  });
});
