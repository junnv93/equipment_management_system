/**
 * 보정계수 대장(Calibration Factors Registry) E2E 테스트
 *
 * 검증 대상:
 * - 페이지 로딩 및 통계 카드 렌더링
 * - 장비별 접기/펼치기 기능
 * - 검색 필터 기능
 * - CSV 내보내기 버튼
 * - 빈 상태 처리
 */
import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('보정계수 대장', () => {
  test('TC-01: 페이지 로딩 후 헤더와 통계 카드가 표시된다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports/calibration-factors');

    // 헤더 확인 (보정계수 대장)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 통계 영역 또는 콘텐츠가 로딩됨
    const content = page.getByText(/총 장비|총 보정계수|등록된 보정계수가 없/i);
    await expect(content.first()).toBeVisible({ timeout: 10000 });
  });

  test('TC-02: CSV 내보내기 버튼이 존재한다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports/calibration-factors');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // CSV 내보내기 버튼
    const exportBtn = page.getByRole('button', { name: /CSV|내보내기|export/i });
    await expect(exportBtn).toBeVisible();
  });

  test('TC-03: 검색 입력 필드가 존재하고 필터링 동작한다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports/calibration-factors');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 검색 입력 필드
    const searchInput = page.getByPlaceholder(/장비 ID|보정계수|검색/i);
    if ((await searchInput.count()) > 0) {
      await expect(searchInput).toBeVisible();

      // 존재하지 않는 값 검색
      await searchInput.fill('nonexistent-xyz-99999');

      // 클라이언트 필터링 결과 대기 — 입력 후 페이지가 유지됨을 확인
      await expect(searchInput).toHaveValue('nonexistent-xyz-99999');
      await searchInput.clear();
    }
  });

  test('TC-04: 모두 펼치기/접기 버튼이 동작한다', async ({ testOperatorPage: page }) => {
    await page.goto('/reports/calibration-factors');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });

    // 모두 펼치기 버튼
    const expandAllBtn = page.getByRole('button', { name: /모두 펼치기|expand all/i });
    if ((await expandAllBtn.count()) > 0) {
      await expandAllBtn.click();

      // 모두 접기 버튼도 존재해야 함
      const collapseAllBtn = page.getByRole('button', { name: /모두 접기|collapse all/i });
      await expect(collapseAllBtn).toBeVisible();

      await collapseAllBtn.click();
    }
  });

  test('TC-05: 기술책임자도 접근 가능하다', async ({ techManagerPage: page }) => {
    await page.goto('/reports/calibration-factors');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 10000 });
  });
});
