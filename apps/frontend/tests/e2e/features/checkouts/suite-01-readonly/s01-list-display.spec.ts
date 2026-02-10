/**
 * Suite 01: 반출 목록 조회 (Read-Only, Parallel)
 *
 * 기존 시드 데이터를 조회만 하므로 상태 변경 없음.
 * fullyParallel: true (기본값) 사용 가능.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { BACKEND_URL } from '../helpers/checkout-constants';
import { navigateToCheckoutList, getBackendToken } from '../helpers/checkout-helpers';

test.describe('Suite 01: 반출 목록 조회', () => {
  test('S01-01: 목록 페이지 로드 + API totalItems > 0', async ({ techManagerPage: page }) => {
    await navigateToCheckoutList(page);

    // UI: 페이지 제목 확인
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // API: 목록 데이터 확인
    const token = await getBackendToken(page, 'technical_manager');
    const response = await page.request.get(`${BACKEND_URL}/api/checkouts?pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.meta.totalItems).toBeGreaterThan(0);
  });

  test('S01-02: 상태별 필터링 (API ?statuses=pending)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const response = await page.request.get(
      `${BACKEND_URL}/api/checkouts?statuses=pending&pageSize=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    // 모든 결과가 pending 상태
    for (const item of data.items) {
      expect(item.status).toBe('pending');
    }
  });

  test('S01-03: 목적별 필터링 (API ?purpose=calibration)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');
    const response = await page.request.get(
      `${BACKEND_URL}/api/checkouts?purpose=calibration&pageSize=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    for (const item of data.items) {
      expect(item.purpose).toBe('calibration');
    }
  });

  test('S01-04: 페이지네이션 (API ?page=2)', async ({ techManagerPage: page }) => {
    const token = await getBackendToken(page, 'technical_manager');

    // 1페이지
    const res1 = await page.request.get(`${BACKEND_URL}/api/checkouts?page=1&pageSize=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data1 = await res1.json();

    if (data1.meta.totalPages > 1) {
      // 2페이지
      const res2 = await page.request.get(`${BACKEND_URL}/api/checkouts?page=2&pageSize=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      expect(res2.ok()).toBeTruthy();
      const data2 = await res2.json();
      expect(data2.meta.currentPage).toBe(2);

      // 1페이지와 2페이지 ID가 다름
      const ids1 = data1.items.map((i: { id: string }) => i.id);
      const ids2 = data2.items.map((i: { id: string }) => i.id);
      const overlap = ids1.filter((id: string) => ids2.includes(id));
      expect(overlap.length).toBe(0);
    }
  });
});
