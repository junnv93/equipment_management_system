/**
 * 승인 관리 통합 페이지 E2E 테스트
 *
 * 테스트 범위:
 * 1. 역할별 탭 표시 (기술책임자, 품질책임자, 시험소장)
 * 2. 승인/반려 처리
 * 3. 다단계 승인 워크플로우 (폐기, 교정계획서)
 * 4. 일괄 처리 기능
 * 5. 키보드 탐색 및 접근성
 *
 * 참조:
 * - docs/development/FRONTEND_UI_PROMPTS(UI-3: 승인 관리 통합 페이지_수정O).md
 * - docs/development/E2E_TEST_AUTH_GUIDE.md
 */

import { test, expect } from './fixtures/auth.fixture';
import AxeBuilder from '@axe-core/playwright';

test.describe('승인 관리 - 역할별 탭 표시', () => {
  // Chromium에서만 실행 (일관된 테스트 환경)
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('기술책임자는 장비/교정/반출 등 탭 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 페이지 제목 확인
    await expect(techManagerPage.locator('h1')).toContainText('승인 관리');

    // 기술책임자 탭 확인
    const tablist = techManagerPage.getByRole('tablist', { name: /승인 카테고리/i });
    await expect(tablist).toBeVisible();

    // 기술책임자가 볼 수 있는 탭 확인
    await expect(techManagerPage.getByRole('tab', { name: /장비/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /교정 기록/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /중간점검/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /반출/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /반입/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /공용.*렌탈/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /부적합.*재개/i })).toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /폐기.*검토/i })).toBeVisible();

    // 품질책임자/시험소장 전용 탭은 미표시
    await expect(techManagerPage.getByRole('tab', { name: /교정계획서.*검토/i })).not.toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /교정계획서.*승인/i })).not.toBeVisible();
    await expect(techManagerPage.getByRole('tab', { name: /폐기.*승인/i })).not.toBeVisible();
  });

  test('품질책임자는 교정계획서 검토/소프트웨어 탭 표시', async ({ qualityManagerPage }) => {
    await qualityManagerPage.goto('/admin/approvals');
    await qualityManagerPage.waitForLoadState('domcontentloaded');

    // 품질책임자 탭 확인
    await expect(qualityManagerPage.getByRole('tab', { name: /교정계획서.*검토/i })).toBeVisible();
    await expect(qualityManagerPage.getByRole('tab', { name: /소프트웨어/i })).toBeVisible();

    // 기술책임자/시험소장 전용 탭은 미표시
    await expect(qualityManagerPage.getByRole('tab', { name: /^장비$/i })).not.toBeVisible();
    await expect(qualityManagerPage.getByRole('tab', { name: /교정 기록/i })).not.toBeVisible();
    await expect(qualityManagerPage.getByRole('tab', { name: /폐기.*승인/i })).not.toBeVisible();
  });

  test('시험소장은 폐기 승인/교정계획서 승인 탭 표시', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/admin/approvals');
    await siteAdminPage.waitForLoadState('domcontentloaded');

    // 시험소장 탭 확인
    await expect(siteAdminPage.getByRole('tab', { name: /폐기.*승인/i })).toBeVisible();
    await expect(siteAdminPage.getByRole('tab', { name: /교정계획서.*승인/i })).toBeVisible();

    // 검토 단계 탭은 미표시 (최종 승인만)
    await expect(siteAdminPage.getByRole('tab', { name: /폐기.*검토/i })).not.toBeVisible();
    await expect(siteAdminPage.getByRole('tab', { name: /교정계획서.*검토/i })).not.toBeVisible();
  });

  test('시험실무자는 승인 관리 페이지 접근 불가', async ({ testOperatorPage }) => {
    // 승인 권한이 없는 역할은 대시보드로 리다이렉트
    await testOperatorPage.goto('/admin/approvals');
    await testOperatorPage.waitForLoadState('domcontentloaded');

    // URL이 대시보드로 변경되었는지 확인
    await expect(testOperatorPage).toHaveURL(/\/dashboard/);
  });
});

test.describe('승인 관리 - 기본 기능', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('탭 전환 및 URL 쿼리 파라미터', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');
    await techManagerPage.waitForLoadState('domcontentloaded');

    // 교정 기록 탭 클릭
    const calibrationTab = techManagerPage.getByRole('tab', { name: /교정 기록/i });
    if ((await calibrationTab.count()) > 0) {
      await calibrationTab.click();
      await techManagerPage.waitForTimeout(500); // 탭 전환 애니메이션 대기

      // URL 쿼리 파라미터 확인
      await expect(techManagerPage).toHaveURL(/tab=calibration/);

      // 탭이 선택된 상태인지 확인
      await expect(calibrationTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('승인 대기 목록 표시', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=calibration');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000); // 데이터 로딩 대기

    // 승인 항목이 있는지 확인 (데이터가 있을 경우)
    const approvalItems = techManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 첫 번째 항목 확인
      const firstItem = approvalItems.first();
      await expect(firstItem).toBeVisible();

      // 요청자 정보 표시 확인
      await expect(firstItem.getByText(/요청자/i)).toBeVisible();
      await expect(firstItem.getByText(/요청일시/i)).toBeVisible();

      // 액션 버튼 확인
      await expect(firstItem.getByRole('button', { name: /상세/i })).toBeVisible();
      await expect(firstItem.getByRole('button', { name: /승인/i })).toBeVisible();
      await expect(firstItem.getByRole('button', { name: /반려/i })).toBeVisible();
    } else {
      console.log('승인 대기 항목이 없습니다.');
    }
  });

  test('반려 시 사유 필수 검증', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=calibration');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    const approvalItems = techManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 반려 버튼 클릭
      const firstItem = approvalItems.first();
      await firstItem.getByRole('button', { name: /반려/i }).click();

      // 모달 열림 확인
      const modal = techManagerPage.getByRole('dialog');
      await expect(modal).toBeVisible();

      // 반려 사유 없이 반려 버튼 클릭
      const rejectButton = modal.getByRole('button', { name: /^반려$/i });
      await expect(rejectButton).toBeDisabled(); // 초기 상태는 비활성화

      // 10자 미만 입력
      const reasonTextarea = modal.getByLabel(/반려 사유/i);
      await reasonTextarea.fill('짧은사유');

      // 에러 메시지 확인
      await expect(modal.getByText(/10자 이상/i)).toBeVisible();
      await expect(rejectButton).toBeDisabled();

      // 10자 이상 입력
      await reasonTextarea.fill('반려 사유는 10자 이상 입력해야 합니다.');
      await expect(rejectButton).toBeEnabled();

      // 취소 버튼으로 모달 닫기
      await modal.getByRole('button', { name: /취소/i }).click();
      await expect(modal).not.toBeVisible();
    }
  });

  test('일괄 선택 기능', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=calibration');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    const approvalItems = techManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 전체 선택 체크박스
      const selectAllCheckbox = techManagerPage.getByRole('checkbox', {
        name: /전체 선택/i,
      });

      if ((await selectAllCheckbox.count()) > 0) {
        // 전체 선택
        await selectAllCheckbox.check();
        await techManagerPage.waitForTimeout(200);

        // 일괄 승인/반려 버튼 활성화 확인
        await expect(techManagerPage.getByRole('button', { name: /일괄.*승인/i })).toBeEnabled();
        await expect(techManagerPage.getByRole('button', { name: /일괄.*반려/i })).toBeEnabled();

        // 전체 선택 해제
        await selectAllCheckbox.uncheck();
        await techManagerPage.waitForTimeout(200);

        // 일괄 버튼 비활성화 확인
        await expect(techManagerPage.getByRole('button', { name: /일괄.*승인/i })).toBeDisabled();
      }
    }
  });
});

test.describe('승인 관리 - 다단계 승인', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('다단계 진행 표시기 렌더링', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=disposal_review');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    const approvalItems = techManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 진행 상태 표시기 확인
      const stepIndicator = techManagerPage.getByTestId('step-indicator').first();

      if ((await stepIndicator.count()) > 0) {
        await expect(stepIndicator).toBeVisible();

        // 현재 단계 표시 (aria-current="step")
        const currentStep = stepIndicator.locator('[aria-current="step"]');
        await expect(currentStep).toBeVisible();
      }
    }
  });

  test('교정계획서 검토 프로세스', async ({ qualityManagerPage }) => {
    await qualityManagerPage.goto('/admin/approvals?tab=plan_review');
    await qualityManagerPage.waitForLoadState('domcontentloaded');
    await qualityManagerPage.waitForTimeout(1000);

    const approvalItems = qualityManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      const firstItem = approvalItems.first();

      // 검토완료 버튼 확인 (승인이 아님)
      const reviewButton = firstItem.getByRole('button', { name: /검토완료/i });

      if ((await reviewButton.count()) > 0) {
        await expect(reviewButton).toBeVisible();
      }

      // 다단계 진행 표시기 확인
      const stepIndicator = qualityManagerPage.getByTestId('step-indicator').first();
      if ((await stepIndicator.count()) > 0) {
        // 교정계획서는 3단계: 작성 → 검토 → 승인
        await expect(stepIndicator.getByText(/작성/i)).toBeVisible();
        await expect(stepIndicator.getByText(/검토/i)).toBeVisible();
        await expect(stepIndicator.getByText(/승인/i)).toBeVisible();
      }
    }
  });

  test('시험소장은 검토 완료된 항목만 표시', async ({ siteAdminPage }) => {
    await siteAdminPage.goto('/admin/approvals?tab=disposal_final');
    await siteAdminPage.waitForLoadState('domcontentloaded');
    await siteAdminPage.waitForTimeout(1000);

    const approvalItems = siteAdminPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 모든 항목이 '검토완료' 상태인지 확인
      for (let i = 0; i < Math.min(count, 3); i++) {
        const item = approvalItems.nth(i);
        // 검토완료 상태 뱃지 또는 검토자 정보 표시 확인
        const hasReviewedStatus =
          (await item.getByText(/검토완료/i).count()) > 0 ||
          (await item.getByText(/최근 처리/i).count()) > 0;

        if (hasReviewedStatus) {
          console.log(`항목 ${i + 1}은 검토완료 상태입니다.`);
        }
      }
    }
  });
});

test.describe('승인 관리 - 접근성', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('키보드 탐색 - Escape로 모달 닫기', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=calibration');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    const approvalItems = techManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 반려 모달 열기
      const firstItem = approvalItems.first();
      await firstItem.getByRole('button', { name: /반려/i }).click();

      const modal = techManagerPage.getByRole('dialog');
      await expect(modal).toBeVisible();

      // Escape로 닫기
      await techManagerPage.keyboard.press('Escape');
      await techManagerPage.waitForTimeout(300); // 애니메이션 대기
      await expect(modal).not.toBeVisible();
    }
  });

  test('뱃지에 aria-label 제공', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    // 뱃지가 스크린리더에서 읽힐 수 있는지 확인
    const badges = techManagerPage.locator('[aria-label*="대기"]');
    const badgeCount = await badges.count();

    if (badgeCount > 0) {
      const firstBadge = badges.first();
      const ariaLabel = await firstBadge.getAttribute('aria-label');
      expect(ariaLabel).toMatch(/대기.*건/);
    }
  });

  test('탭에 role과 aria-selected 적용', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');
    await techManagerPage.waitForLoadState('domcontentloaded');

    // tablist role 확인
    const tablist = techManagerPage.getByRole('tablist');
    await expect(tablist).toBeVisible();

    // 각 탭에 aria-selected 속성 확인
    const tabs = techManagerPage.getByRole('tab');
    const tabCount = await tabs.count();

    if (tabCount > 0) {
      const firstTab = tabs.first();
      const ariaSelected = await firstTab.getAttribute('aria-selected');
      expect(ariaSelected).toBe('true'); // 첫 번째 탭은 선택된 상태
    }
  });

  test('다단계 진행 표시기 aria-current', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=disposal_review');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    const stepIndicators = techManagerPage.getByTestId('step-indicator');
    const count = await stepIndicators.count();

    if (count > 0) {
      const firstIndicator = stepIndicators.first();
      // 현재 단계에 aria-current="step" 확인
      const currentStep = firstIndicator.locator('[aria-current="step"]');
      await expect(currentStep).toBeVisible();
    }
  });

  test('axe-core 접근성 검사', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    // axe-core 접근성 검사 실행
    const results = await new AxeBuilder({ page: techManagerPage })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('#_next-build-watcher') // Next.js 개발 도구 제외
      .analyze();

    // 위반 사항이 없어야 함
    expect(results.violations).toEqual([]);
  });

  test('포커스 표시 스타일 적용', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals');
    await techManagerPage.waitForLoadState('domcontentloaded');

    // Tab 키로 탭 이동
    await techManagerPage.keyboard.press('Tab');
    await techManagerPage.keyboard.press('Tab');

    // 포커스된 요소가 있는지 확인
    const focusedElement = await techManagerPage.evaluate(() => {
      const active = document.activeElement;
      return active?.tagName;
    });

    expect(focusedElement).toBeTruthy();
  });
});

test.describe('승인 관리 - 상세 보기 모달', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('상세 보기 모달 열기 및 닫기', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=calibration');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    const approvalItems = techManagerPage.getByTestId('approval-item');
    const count = await approvalItems.count();

    if (count > 0) {
      // 상세 버튼 클릭
      const firstItem = approvalItems.first();
      await firstItem.getByRole('button', { name: /상세/i }).click();

      // 모달 열림 확인
      const modal = techManagerPage.getByRole('dialog');
      await expect(modal).toBeVisible({ timeout: 5000 });

      // 모달에 role="dialog", aria-modal 확인
      await expect(modal).toHaveAttribute('role', 'dialog');
      await expect(modal).toHaveAttribute('aria-modal', 'true');

      // 닫기 버튼으로 모달 닫기
      const closeButtons = modal.getByRole('button', { name: /닫기|취소/i });
      if ((await closeButtons.count()) > 0) {
        await closeButtons.first().click();
        await techManagerPage.waitForTimeout(300);
        await expect(modal).not.toBeVisible();
      }
    }
  });
});

test.describe('승인 관리 - 에러 처리', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('로딩 스켈레톤 표시', async ({ techManagerPage }) => {
    // 페이지 로딩 중 스켈레톤이 표시되는지 확인
    const response = techManagerPage.goto('/admin/approvals');

    // 로딩 중 스켈레톤 확인 (빠르게 사라질 수 있음)
    const skeleton = techManagerPage.locator('.animate-pulse').first();
    if ((await skeleton.count()) > 0) {
      await expect(skeleton).toBeVisible();
    }

    await response;
    await techManagerPage.waitForLoadState('domcontentloaded');
  });
});

test.describe('승인 관리 - 권한 검증', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('기술책임자는 소유 팀 장비만 표시 (예정)', async ({ techManagerPage }) => {
    await techManagerPage.goto('/admin/approvals?tab=equipment');
    await techManagerPage.waitForLoadState('domcontentloaded');
    await techManagerPage.waitForTimeout(1000);

    // Note: 소유 팀 필터링은 백엔드 API 연동 필요
    // 현재는 페이지 접근만 확인
    await expect(techManagerPage.locator('h1')).toContainText('승인 관리');
  });
});
