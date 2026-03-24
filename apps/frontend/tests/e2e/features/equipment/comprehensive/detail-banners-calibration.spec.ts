/**
 * 장비 상세 - 배너 표시 + 교정 상태 표시 테스트
 *
 * Part B-2: 교정 상태 표시 특수 로직
 * - calibration_overdue → "부적합" 라벨
 * - D-day 배지 숨김 상태 (retired, non_conforming, spare 등)
 *
 * Part B-3: 배너 표시 (우선순위 순)
 * - non_conforming 장비 → NC 배너 표시
 * - calibration_overdue 장비 → 경고 Alert
 * - 공용장비 → 공용장비 안내 Alert
 *
 * Auth: techManagerPage (기술책임자), testOperatorPage (시험실무자)
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  TEST_EQUIPMENT_IDS,
  TEST_DISPOSAL_EQUIPMENT_IDS,
} from '../../../shared/constants/shared-test-data';

// === B-3: 배너 표시 테스트 ===

test.describe('장비 상세 - 배너 및 교정 상태 표시', () => {
  test.describe('B-3: 부적합(NC) 배너', () => {
    test('non_conforming 장비에 부적합 배너가 표시된다', async ({ techManagerPage: page }) => {
      // POWER_METER_SUW_E: non_conforming 상태, NC_001 존재
      await page.goto(`/equipment/${TEST_EQUIPMENT_IDS.POWER_METER_SUW_E}`);

      // 상태 배지 확인
      await expect(page.getByText('부적합').first()).toBeVisible();

      // NC 배너 또는 경고 Alert 확인 (openNCs 존재 시 NonConformanceBanner, 없으면 Alert)
      const ncBanner = page
        .locator('[data-testid="nc-banner"]')
        .or(page.getByText(/부적합.*관리/).first())
        .or(page.getByRole('alert').filter({ hasText: /부적합/ }));
      await expect(ncBanner.first()).toBeVisible({ timeout: 10000 });
    });

    test('available 장비에는 부적합 배너가 표시되지 않는다', async ({ techManagerPage: page }) => {
      // SPECTRUM_ANALYZER_SUW_E: available 상태
      await page.goto(`/equipment/${TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E}`);

      await expect(page.getByText('사용 가능').first()).toBeVisible();

      // NC 배너가 없어야 함
      const ncAlerts = page.getByRole('alert').filter({ hasText: /부적합/ });
      await expect(ncAlerts).toHaveCount(0);
    });
  });

  test.describe('B-3: 폐기 진행 배너', () => {
    test('pending_disposal 장비에 DisposalProgressCard가 표시된다', async ({
      techManagerPage: page,
    }) => {
      // PERM_A4_PENDING: pending_disposal 상태, reviewStatus=pending
      await page.goto(`/equipment/${TEST_DISPOSAL_EQUIPMENT_IDS.PERM_A4_PENDING}`);

      // 장비 상세 페이지 로드 대기 (장비명 또는 KPI 스트립)
      await expect(page.getByRole('button', { name: /탭으로 이동/ }).first()).toBeVisible({
        timeout: 15000,
      });

      // 폐기 진행 카드가 표시되어야 함 (DisposalProgressCard)
      // 스크린샷 기반: "폐기 진행 단계" 또는 DisposalProgressStepper 텍스트 확인
      const disposalCard = page
        .getByText(/폐기.*진행/)
        .or(page.getByText(/폐기.*단계/))
        .or(page.getByText(/폐기 요청/));
      await expect(disposalCard.first()).toBeVisible({ timeout: 10000 });
    });
  });

  // === B-2: 교정 상태 표시 특수 로직 ===

  test.describe('B-2: 교정 기한 초과 표시', () => {
    test('calibration_overdue 장비에 "부적합" 라벨이 표시된다', async ({
      techManagerPage: page,
    }) => {
      // COUPLER_SUW_E: calibration_overdue 상태
      await page.goto(`/equipment/${TEST_EQUIPMENT_IDS.COUPLER_SUW_E}`);

      // calibration_overdue → 프론트엔드에서 "부적합" 라벨로 표시
      // 또는 "교정 기한 초과" 텍스트가 표시될 수 있음
      const overdueLabel = page.getByText('부적합').or(page.getByText('교정 기한 초과'));
      await expect(overdueLabel.first()).toBeVisible({ timeout: 10000 });

      // 경고 Alert 또는 NC 배너 표시 확인
      const warningAlert = page.getByRole('alert').first();
      await expect(warningAlert).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('B-2: D-day 배지 숨김 로직', () => {
    test('non_conforming 장비에는 Sticky Header에 D-day 배지가 숨겨진다', async ({
      techManagerPage: page,
    }) => {
      await page.goto(`/equipment/${TEST_EQUIPMENT_IDS.POWER_METER_SUW_E}`);

      // 장비 로드 대기
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 10000 });

      // Sticky Header 내부의 교정 D-day 배지만 확인 (KPI strip의 D-day 값은 별도 영역)
      const badges = page.locator('#equipment-sticky-header [role="status"]');
      const totalBadges = await badges.count();
      for (let i = 0; i < totalBadges; i++) {
        const text = await badges.nth(i).textContent();
        // non_conforming에서 교정 D-day 배지가 없어야 함
        expect(text).not.toMatch(/D[-+]\d+|일 후 교정 만료/);
      }
    });

    test('spare 장비에는 Sticky Header에 D-day 배지가 숨겨진다', async ({
      techManagerPage: page,
    }) => {
      // FILTER_SUW_E: spare 상태
      await page.goto(`/equipment/${TEST_EQUIPMENT_IDS.FILTER_SUW_E}`);

      // 장비 상세 로드 대기 (KPI 스트립 버튼)
      await expect(page.getByRole('button', { name: /탭으로 이동/ }).first()).toBeVisible({
        timeout: 15000,
      });

      // Sticky Header 내부에서 교정 배지 확인 (KPI strip의 D-day 값은 별도 영역으로 정상 표시됨)
      // STATUS_SKIP_CALIBRATION_DISPLAY에 spare 포함 → Header 교정 배지 숨김
      const headerDdayBadge = page.locator('#equipment-sticky-header [role="status"]').filter({
        hasText: /D[-+]\d+|교정|만료/,
      });
      // 상태 배지(role="status")는 있지만, 교정 D-day 배지는 없어야 함
      // 상태 배지 1개만 있어야 함 (장비 상태 배지만)
      const ddayCount = await headerDdayBadge.count();
      // spare에서 교정 배지는 최대 1개 (장비 상태 배지) — D-day 배지는 0개
      const badges = page.locator('#equipment-sticky-header [role="status"]');
      const totalBadges = await badges.count();
      // 교정 D-day 관련 배지가 없는지 확인
      for (let i = 0; i < totalBadges; i++) {
        const text = await badges.nth(i).textContent();
        expect(text).not.toMatch(/D[-+]\d+|일 후 교정 만료/);
      }
    });
  });

  // === B-1: 404 처리 ===

  test.describe('B-1: 존재하지 않는 장비 404', () => {
    test('존재하지 않는 UUID로 접근하면 not-found 페이지가 표시된다', async ({
      techManagerPage: page,
    }) => {
      await page.goto('/equipment/00000000-0000-0000-0000-000000000000');

      // not-found 페이지 요소 확인
      const notFoundContent = page
        .getByText(/찾을 수 없/)
        .or(page.getByText(/존재하지 않/))
        .or(page.getByRole('heading', { name: /not found/i }));
      await expect(notFoundContent.first()).toBeVisible({ timeout: 10000 });

      // 목록으로 돌아가는 링크 확인
      const backLink = page
        .getByRole('link', { name: /목록/ })
        .or(page.getByRole('link', { name: /돌아가/ }));
      await expect(backLink.first()).toBeVisible();
    });
  });

  // === G: QM 읽기 전용 확인 ===

  test.describe('G: QM 읽기 전용', () => {
    test('QM은 장비 상세에서 수정/반출/폐기 버튼이 보이지 않는다', async ({
      qualityManagerPage: page,
    }) => {
      await page.goto(`/equipment/${TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E}`);

      // 장비명 로딩 대기
      await expect(page.getByRole('heading', { name: '스펙트럼 분석기' })).toBeVisible({
        timeout: 15000,
      });

      // QM은 UPDATE_EQUIPMENT 권한 없음 → 수정 버튼 미표시
      await expect(page.getByRole('button', { name: /수정/ })).not.toBeVisible();

      // QM은 CREATE_CHECKOUT 권한 없음 → 반출 버튼 미표시
      await expect(page.getByRole('button', { name: /반출 신청/ })).not.toBeVisible();

      // QM은 REQUEST_DISPOSAL 권한 없음 → 폐기 버튼 영역 미표시
      await expect(page.getByRole('button', { name: /폐기 요청/ })).not.toBeVisible();
    });
  });
});
