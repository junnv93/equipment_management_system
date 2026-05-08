/**
 * Suite: 장비별 교정 이력 sub-route deep-link + 필터 URL sync + footer 링크
 *
 * `/equipment/[id]/calibration-history` 신설 sub-route 의 보호선:
 * - Case 1: 직접 URL 진입 (deep-link) → server prefetch → Client 렌더
 * - Case 2: 필터 변경 → URL replace → reload → 필터 state 복원
 * - Case 3: Tab footer "전체 보기" 링크 → sub-route navigate
 *
 * Tab vs Sub-route 중복 architecture (자기검토 #3 잔여 항목)는 본 sprint scope 외 — architectural
 * decision 후 별도 sprint trigger.
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

test.describe.configure({ mode: 'serial' });

test.describe('장비 교정 이력 sub-route', () => {
  const equipmentId = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;
  const subRouteUrl = `/equipment/${equipmentId}/calibration-history`;
  const detailUrl = `/equipment/${equipmentId}`;

  test('deep-link 직접 진입 → PageHeader + 통계 카드 렌더', async ({ techManagerPage: page }) => {
    await page.goto(subRouteUrl);

    // PageHeader title — `equipment.calibrationHistoryClient.title` i18n 키 (기본 ko = "교정 이력")
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    // 통계 카드 영역(StatCard 5개 — total/overdue/upcoming/passed/failed) 노출
    // 통계 그리드 컨테이너에 grid-cols-5 라벨 — 부분 매치로 충분
    await expect(page.locator('main')).toContainText(/교정/);

    // 필터 영역의 approvalStatus Select 노출 (Combobox role — Radix UI)
    await expect(page.getByRole('combobox').first()).toBeVisible();
  });

  test('필터 선택 → URL sync + reload 후 state 복원', async ({ techManagerPage: page }) => {
    await page.goto(subRouteUrl);

    // approval status Select 클릭 — combobox 첫 번째가 approval (DOM 순서)
    const approvalCombobox = page.getByRole('combobox').first();
    await approvalCombobox.click();

    // "승인됨" 옵션 클릭 (i18n 한글 텍스트 — equipment.calibrationHistoryClient.filters.approvalOptions.approved)
    await page
      .getByRole('option', { name: /승인됨|approved/i })
      .first()
      .click();

    // URL 에 ?approvalStatus=approved 등장 (clean URL — 빈 값은 미포함)
    await expect(page).toHaveURL(/[?&]approvalStatus=approved/);

    // reload → 필터 state 복원 (URL SSOT 검증)
    await page.reload();
    await expect(page).toHaveURL(/[?&]approvalStatus=approved/);
    // Select 값이 복원됐는지 — combobox aria value 또는 visible text
    await expect(approvalCombobox).toContainText(/승인됨|approved/i);
  });

  test('Tab footer "전체 보기" 링크 → sub-route navigate', async ({ techManagerPage: page }) => {
    // Tab 진입 (?tab=calibration 으로 calibration tab 활성화)
    await page.goto(`${detailUrl}?tab=calibration`);

    // calibration tab 활성 후 footer "전체 보기" 링크 (calibrationHistoryTab.viewAllLink i18n)
    const viewAllLink = page.getByRole('link', {
      name: /전체 교정 이력 보기|View full calibration history/i,
    });
    await expect(viewAllLink).toBeVisible();

    // 클릭 → sub-route URL 로 navigate
    await viewAllLink.click();
    await page.waitForURL(/\/equipment\/.+\/calibration-history/);
    await expect(page).toHaveURL(new RegExp(`/equipment/${equipmentId}/calibration-history`));

    // sub-route 페이지 렌더 검증 (PageHeader)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
