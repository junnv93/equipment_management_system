/**
 * 장비 목록 - 빈 상태 + URL 필터 테스트 (Part A-1, A-8 보완)
 *
 * Auth: systemAdminPage (SA) — 기본 필터 리다이렉트 없음
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('장비 목록 - 빈 상태 및 URL 필터', () => {
  test.describe('A-1: 검색 결과 없음', () => {
    test('존재하지 않는 장비명 검색 시 빈 상태가 표시된다', async ({ systemAdminPage: page }) => {
      // SA는 기본 리다이렉트 없음 → URL 파라미터가 그대로 적용
      await page.goto('/equipment?search=ZZZZNOTEXIST999XYZABC');

      // 검색 결과 없음 상태 직접 대기 (필터 UI가 없는 빈 상태 레이아웃일 수 있음)
      const emptyMessage = page
        .getByText(/검색 결과가 없습니다/)
        .or(page.getByText(/결과가 없습니다/))
        .or(page.getByText(/표시할 장비가 없습니다/));
      await expect(emptyMessage.first()).toBeVisible({ timeout: 30000 });

      // 검색어가 설명에 표시되는지 확인
      await expect(page.getByText(/ZZZZNOTEXIST999XYZABC/).first()).toBeVisible();
    });
  });

  test.describe('A-8: URL 파라미터 SSOT', () => {
    test('URL에 사이트 필터를 직접 입력하면 필터 뱃지가 표시된다', async ({
      systemAdminPage: page,
    }) => {
      await page.goto('/equipment?site=suwon');

      // 필터 UI 로드 대기
      const filterOrTable = page
        .locator('#filter-site')
        .or(page.locator('[data-testid="equipment-row"]'));
      await expect(filterOrTable.first()).toBeVisible({ timeout: 30000 });

      // 필터 뱃지 확인
      const siteBadge = page.getByText(/사이트:.*수원/);
      await expect(siteBadge.first()).toBeVisible({ timeout: 10000 });
    });

    test('URL에 상태 필터를 직접 입력하면 필터 뱃지가 표시된다', async ({
      systemAdminPage: page,
    }) => {
      await page.goto('/equipment?status=available');

      const filterOrTable = page
        .locator('#filter-site')
        .or(page.locator('[data-testid="equipment-row"]'));
      await expect(filterOrTable.first()).toBeVisible({ timeout: 30000 });

      // 상태 필터 뱃지 확인
      const statusBadge = page.getByText(/상태:.*사용/);
      await expect(statusBadge.first()).toBeVisible({ timeout: 10000 });
    });

    test('새로고침 후 필터 상태가 유지된다', async ({ systemAdminPage: page }) => {
      await page.goto('/equipment?site=suwon&status=available');

      const filterOrTable = page
        .locator('#filter-site')
        .or(page.locator('[data-testid="equipment-row"]'));
      await expect(filterOrTable.first()).toBeVisible({ timeout: 30000 });

      // 필터 뱃지 확인
      await expect(page.getByText(/사이트:.*수원/).first()).toBeVisible({ timeout: 10000 });

      // 새로고침
      await page.reload();

      await expect(filterOrTable.first()).toBeVisible({ timeout: 30000 });

      // URL 파라미터 유지 확인
      expect(page.url()).toContain('site=suwon');
      expect(page.url()).toContain('status=available');
    });
  });
});
