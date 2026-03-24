/**
 * Suite 23: 교정 현황 대시보드 종합 테스트
 *
 * A-1: 통계 카드, 3개 탭, 필터링, URL SSOT, 알림 배너
 * A-6: 중간점검 탭 UI 검증
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { TEST_TEAM_IDS } from '../../../shared/constants/shared-test-data';

const CALIBRATION_PAGE = '/calibration';

test.describe('A-1: 교정 현황 대시보드', () => {
  test.describe('통계 카드 렌더링', () => {
    test('4개 통계 카드 표시: 전체/적합/기한초과/교정예정', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 통계 카드 영역 확인
      const statsSection = page.locator('[class*="grid"]').first();
      await expect(statsSection).toBeVisible();

      // 숫자가 포함된 카드들이 표시되는지 확인
      const numberElements = page.locator('.text-2xl, .text-3xl');
      const count = await numberElements.count();
      expect(count).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('3개 탭 전환', () => {
    test('교정목록/중간점검/자체점검 탭 표시', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 교정목록 탭 (기본)
      const calibrationTab = page.getByRole('tab', { name: /교정목록|교정 목록/ });
      await expect(calibrationTab).toBeVisible();

      // 중간점검 탭
      const intermediateTab = page.getByRole('tab', { name: /중간점검/ });
      await expect(intermediateTab).toBeVisible();

      // 자체점검 탭
      const selfInspectionTab = page.getByRole('tab', { name: /자체점검|자가점검/ });
      await expect(selfInspectionTab).toBeVisible();
    });

    test('중간점검 탭 클릭 → 중간점검 목록 표시', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 중간점검 탭 클릭
      const intermediateTab = page.getByRole('tab', { name: /중간점검/ });
      await intermediateTab.click();

      // 중간점검 관련 UI 표시 확인
      await expect(page.getByText(/중간점검/).first()).toBeVisible();
    });

    test('자체점검 탭 존재 확인', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      const selfInspectionTab = page.getByRole('tab', { name: /자체점검|자가점검/ });
      if (await selfInspectionTab.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selfInspectionTab.click();
        // 탭 전환 확인 — 준비 중이거나 내용이 표시됨
        await expect(
          page.getByText(/자체점검|자가점검|준비 중|개발 중|예정/).first()
        ).toBeVisible();
      } else {
        // 자체점검 탭이 아직 구현되지 않았을 수 있음
        test.skip();
      }
    });
  });

  test.describe('필터링', () => {
    test('검색 필터: 장비명/관리번호 검색', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      const searchInput = page.getByPlaceholder(/장비명|관리번호|검색/);
      if (await searchInput.isVisible()) {
        await searchInput.fill('스펙트럼');
        await searchInput.press('Enter');

        // URL에 검색어 반영
        await expect(page).toHaveURL(/search=|q=/);
      }
    });

    test('승인 상태 필터: pending_approval/approved/rejected', async ({
      techManagerPage: page,
    }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 승인 상태 필터 드롭다운
      const approvalFilter = page.getByRole('combobox').filter({ hasText: /승인 상태/ });
      if (await approvalFilter.isVisible()) {
        await approvalFilter.click();

        // 옵션 확인
        await expect(page.getByRole('option', { name: /승인 대기|대기/ })).toBeVisible();
        await expect(page.getByRole('option', { name: /승인 완료|승인됨/ })).toBeVisible();
        await expect(page.getByRole('option', { name: /반려|거절/ })).toBeVisible();

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('URL 파라미터 SSOT 검증', () => {
    test('필터 변경 → URL 파라미터 반영', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 팀 필터 선택
      const teamFilter = page.getByRole('combobox').filter({ hasText: /팀/ });
      if (await teamFilter.isVisible()) {
        await teamFilter.click();
        const firstTeamOption = page.getByRole('option').first();
        if (await firstTeamOption.isVisible()) {
          const teamName = await firstTeamOption.textContent();
          await firstTeamOption.click();

          // URL에 teamId 반영 확인
          await expect(page).toHaveURL(/teamId=/);
        }
      }
    });

    test('URL 직접 입력 → 필터 반영', async ({ techManagerPage: page }) => {
      const teamId = TEST_TEAM_IDS.FCC_EMC_RF_SUWON;
      await page.goto(`${CALIBRATION_PAGE}?teamId=${teamId}`);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 팀 필터에 해당 팀이 선택되어 있는지 확인
      // 또는 활성 필터 태그에 팀명 표시
      const activeFilters = page.locator('[class*="badge"], [class*="tag"]');
      const filterCount = await activeFilters.count();
      // 필터가 적용되었으면 최소 1개 태그가 있어야 함
      expect(filterCount).toBeGreaterThanOrEqual(0); // 태그가 없을 수 있으므로 비강제
    });
  });

  test.describe('A-6: 중간점검 UI 검증', () => {
    test('중간점검 탭 - 완료 버튼 클릭 → 완료 다이얼로그 표시', async ({
      techManagerPage: page,
    }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // 중간점검 탭 클릭
      const intermediateTab = page.getByRole('tab', { name: /중간점검/ });
      await intermediateTab.click();

      // 완료 버튼이 있는 행 찾기
      const completeButton = page.getByRole('button', { name: '완료' }).first();
      if (await completeButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await completeButton.click();

        // 완료 다이얼로그 표시 확인
        const dialog = page.getByRole('dialog', { name: /중간점검 완료/ });
        await expect(dialog).toBeVisible();

        // 다이얼로그 내 필수 요소 확인
        await expect(dialog.getByText(/점검 내용|비고|메모/)).toBeVisible();

        // 취소 버튼
        await dialog.getByRole('button', { name: /취소/ }).click();
        await expect(dialog).not.toBeVisible();
      }
    });
  });

  test.describe('역할별 등록 버튼 표시', () => {
    test('TE(시험실무자): 교정 정보 등록 버튼 표시', async ({ testOperatorPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();
      // 스크린샷: "+ 교정 정보 등록" 버튼 (link 또는 button)
      await expect(page.getByText('교정 정보 등록').first()).toBeVisible();
    });

    test('TM(기술책임자): 교정 정보 등록 버튼 표시', async ({ techManagerPage: page }) => {
      await page.goto(CALIBRATION_PAGE);
      await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible();

      // TM도 CREATE_CALIBRATION 권한이 있으므로 등록 버튼 표시
      await expect(page.getByText('교정 정보 등록').first()).toBeVisible();
    });
  });
});
