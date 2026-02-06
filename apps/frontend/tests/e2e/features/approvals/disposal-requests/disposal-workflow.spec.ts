/**
 * 장비 폐기 워크플로우 E2E 테스트
 *
 * 테스트 범위:
 * - 폐기 요청 (시험실무자)
 * - 폐기 검토 (기술책임자)
 * - 폐기 최종 승인 (시험소장)
 * - 반려 및 취소 플로우
 *
 * 상태 전이:
 * available → pending_disposal → disposed
 *    ↑_________________________|
 *              rejected
 *
 * ⚠️ 주의: 이 테스트는 백엔드 disposal API 구현이 완료되어야 실행 가능합니다.
 * 현재는 프론트엔드만 구현된 상태이므로, API 응답을 받기 전까지 SKIP 됩니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Disposal Workflow', () => {
  // Chromium에서만 실행 (일관된 테스트 환경)
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  // 백엔드 API 미구현으로 인한 임시 skip
  test.beforeEach(() => {
    test.skip(true, 'Disposal API endpoints not yet implemented in backend');
  });

  test.describe('폐기 요청 (Request)', () => {
    test('시험실무자는 사용 가능한 장비에 대해 폐기 요청할 수 있다', async ({
      testOperatorPage,
    }) => {
      // 장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      // 사용 가능한 장비 선택 (첫 번째 available 상태 장비)
      const equipmentCard = testOperatorPage.locator('article').first();
      await equipmentCard.click();
      await testOperatorPage.waitForLoadState('networkidle');

      // 폐기 요청 버튼 확인
      const disposalButton = testOperatorPage.getByRole('button', {
        name: /폐기 요청/i,
      });
      await expect(disposalButton).toBeVisible();

      // 폐기 요청 다이얼로그 열기
      await disposalButton.click();

      // 다이얼로그 제목 확인
      await expect(testOperatorPage.getByRole('heading', { name: '장비 폐기 요청' })).toBeVisible();

      // 폐기 사유 선택 (노후화)
      await testOperatorPage.click('input[value="obsolete"]');

      // 상세 사유 입력 (10자 이상)
      await testOperatorPage.fill(
        'textarea#reasonDetail',
        '장비 노후화로 인한 성능 저하가 심각합니다. 교정도 불가능한 상태이며, 더 이상 사용이 어렵습니다.'
      );

      // 문자 수 힌트 확인
      await expect(testOperatorPage.locator('p#reasonDetail-hint')).toContainText(/현재: \d+자/);

      // 폐기 요청 제출
      await testOperatorPage.click('button:has-text("폐기 요청")');

      // Toast 알림 확인
      await expect(testOperatorPage.locator('.toast')).toContainText('폐기 요청 완료');

      // 상태 변경 확인: '폐기 진행 중' 버튼으로 변경
      await testOperatorPage.waitForTimeout(1000);
      await expect(testOperatorPage.getByRole('button', { name: /폐기 진행 중/i })).toBeVisible();
    });

    test('폐기 요청 시 첨부 파일을 추가할 수 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 요청")');

      // 파일 선택 버튼 접근성 확인
      const fileButton = testOperatorPage.getByRole('button', {
        name: '파일 선택',
      });
      await expect(fileButton).toBeVisible();

      // 파일 입력 필드 숨김 처리 확인
      const fileInput = testOperatorPage.locator('input#attachments');
      await expect(fileInput).toHaveClass(/hidden/);

      // 파일 선택 (실제 파일 업로드는 mock)
      // Note: Playwright file upload test would go here
    });

    test('상세 사유가 10자 미만이면 제출 버튼이 비활성화된다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 요청")');

      // 사유 선택
      await testOperatorPage.click('input[value="obsolete"]');

      // 9자만 입력
      await testOperatorPage.fill('textarea#reasonDetail', '123456789');

      // 제출 버튼 비활성화 확인
      const submitButton = testOperatorPage.getByRole('button', {
        name: '폐기 요청',
      });
      await expect(submitButton).toBeDisabled();

      // 10자 입력
      await testOperatorPage.fill('textarea#reasonDetail', '1234567890');

      // 제출 버튼 활성화 확인
      await expect(submitButton).toBeEnabled();
    });
  });

  test.describe('폐기 검토 (Review)', () => {
    test('기술책임자는 같은 팀의 폐기 요청을 검토할 수 있다', async ({ techManagerPage }) => {
      // 폐기 진행 중인 장비로 이동 (URL은 테스트 데이터에 따라 변경 필요)
      await techManagerPage.goto('/equipment?status=pending_disposal');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      await equipmentCard.click();

      // '폐기 진행 중' 버튼 클릭하여 상세 다이얼로그 열기
      await techManagerPage.click('button:has-text("폐기 진행 중")');

      // 폐기 검토하기 버튼 확인
      await expect(techManagerPage.getByText('폐기 검토하기')).toBeVisible();

      await techManagerPage.click('text=폐기 검토하기');

      // 검토 다이얼로그 확인
      await expect(techManagerPage.getByRole('heading', { name: '폐기 검토' })).toBeVisible();

      // 폐기 요청 정보 카드 확인
      await expect(techManagerPage.getByText('폐기 요청 정보')).toBeVisible();

      // 장비 이력 요약 확인 (접힌 상태)
      await expect(techManagerPage.getByText('장비 이력 요약')).toBeVisible();

      // 검토 의견 입력
      await techManagerPage.fill(
        'textarea#opinion',
        '폐기 요청 내용을 검토하였으며, 노후화로 인한 성능 저하가 명확하여 승인 가능합니다.'
      );

      // 문자 수 힌트 aria-describedby 연결 확인
      const opinionTextarea = techManagerPage.locator('textarea#opinion');
      await expect(opinionTextarea).toHaveAttribute('aria-describedby', 'opinion-hint');

      // 검토 완료 버튼 클릭
      await techManagerPage.click('button:has-text("검토 완료")');

      // Toast 알림 확인
      await expect(techManagerPage.locator('.toast')).toContainText('검토 완료');

      // 진행 카드 상태 변경 확인
      await techManagerPage.waitForTimeout(1000);
      await expect(techManagerPage.locator('.bg-orange-50')).toContainText('시험소장 승인 대기');
    });

    test('기술책임자는 폐기 요청을 반려할 수 있다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/equipment?status=pending_disposal');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      await equipmentCard.click();

      await techManagerPage.click('button:has-text("폐기 진행 중")');
      await techManagerPage.click('text=폐기 검토하기');

      // 반려 사유 입력
      await techManagerPage.fill(
        'textarea#opinion',
        '추가 점검이 필요하여 반려합니다. 수리 후 재사용 가능성을 확인해주세요.'
      );

      // 반려 버튼 클릭 (첫 번째 클릭은 확인 모드 활성화)
      await techManagerPage.click('button:has-text("반려")');

      // 반려 안내 메시지 확인
      await expect(techManagerPage.getByText(/구체적인 사유를 입력하고/)).toBeVisible();

      // 두 번째 클릭으로 반려 확정
      await techManagerPage.click('button:has-text("반려")');

      // Toast 알림 확인
      await expect(techManagerPage.locator('.toast')).toContainText('요청 반려');

      // 상태가 available로 복구되었는지 확인
      await techManagerPage.waitForTimeout(1000);
      await expect(techManagerPage.getByRole('button', { name: '폐기 요청' })).toBeVisible();
    });
  });

  test.describe('폐기 최종 승인 (Approval)', () => {
    test('시험소장은 검토 완료된 폐기 요청을 최종 승인할 수 있다', async ({ siteAdminPage }) => {
      // 검토 완료 상태(pending_approval)의 장비로 이동
      await siteAdminPage.goto('/equipment?status=pending_disposal');
      await siteAdminPage.waitForLoadState('networkidle');

      const equipmentCard = siteAdminPage.locator('article').first();
      await equipmentCard.click();

      await siteAdminPage.click('button:has-text("폐기 진행 중")');

      // 최종 승인하기 버튼 확인
      await expect(siteAdminPage.getByText('최종 승인하기')).toBeVisible();

      await siteAdminPage.click('text=최종 승인하기');

      // 승인 다이얼로그 확인
      await expect(siteAdminPage.getByRole('heading', { name: '폐기 최종 승인' })).toBeVisible();

      // 3단계 스테퍼 확인
      await expect(siteAdminPage.getByText('1. 폐기 요청')).toBeVisible();
      await expect(siteAdminPage.getByText('2. 기술책임자 검토')).toBeVisible();
      await expect(siteAdminPage.getByText('3. 시험소장 승인')).toBeVisible();

      // 검토 의견 카드 확인
      await expect(siteAdminPage.getByText('검토 의견')).toBeVisible();

      // 승인 코멘트 입력 (선택사항)
      await siteAdminPage.fill(
        'textarea#comment',
        '폐기 승인합니다. 환경 규정에 따라 처리해주세요.'
      );

      // 최종 승인 버튼 클릭
      await siteAdminPage.click('button:has-text("최종 승인")');

      // 확인 다이얼로그 표시 확인
      await expect(siteAdminPage.getByRole('heading', { name: /최종 승인 확인/i })).toBeVisible();

      // 경고 메시지 확인
      await expect(siteAdminPage.getByText(/이 작업은 되돌릴 수 없습니다/)).toBeVisible();

      // 확인 버튼 클릭
      const confirmButton = siteAdminPage.getByRole('button', {
        name: '최종 승인',
      });
      await confirmButton.last().click();

      // Toast 알림 확인
      await expect(siteAdminPage.locator('.toast')).toContainText('최종 승인 완료');

      // 폐기 완료 상태 확인
      await siteAdminPage.waitForTimeout(1000);
      await expect(siteAdminPage.getByRole('button', { name: '폐기 완료' })).toBeDisabled();

      // '장비 폐기 완료' 배너 확인
      await expect(siteAdminPage.locator('.bg-gray-100')).toContainText('장비 폐기 완료');
    });

    test('시험소장은 폐기 요청을 반려할 수 있다', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/equipment?status=pending_disposal');
      await siteAdminPage.waitForLoadState('networkidle');

      const equipmentCard = siteAdminPage.locator('article').first();
      await equipmentCard.click();

      await siteAdminPage.click('button:has-text("폐기 진행 중")');
      await siteAdminPage.click('text=최종 승인하기');

      // 반려 사유 입력
      await siteAdminPage.fill(
        'textarea#comment',
        '재검토가 필요하여 반려합니다. 대체 장비 구매 계획을 먼저 수립해주세요.'
      );

      // 반려 버튼 클릭
      await siteAdminPage.click('button:has-text("반려")');

      // 반려 안내 메시지 확인
      await expect(siteAdminPage.getByText(/구체적인 사유를 입력하고/)).toBeVisible();

      // 두 번째 클릭으로 반려 확정
      await siteAdminPage.click('button:has-text("반려")');

      // Toast 알림 확인
      await expect(siteAdminPage.locator('.toast')).toContainText('요청 반려');

      // 상태 복구 확인
      await siteAdminPage.waitForTimeout(1000);
      await expect(siteAdminPage.getByRole('button', { name: '폐기 요청' })).toBeVisible();
    });
  });

  test.describe('폐기 요청 취소', () => {
    test('요청자는 본인의 폐기 요청을 취소할 수 있다', async ({ testOperatorPage }) => {
      // 본인이 요청한 폐기 진행 중인 장비로 이동
      await testOperatorPage.goto('/equipment?status=pending_disposal');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 진행 중")');

      // 요청 취소 버튼 확인
      await expect(testOperatorPage.getByText('요청 취소')).toBeVisible();

      await testOperatorPage.click('text=요청 취소');

      // 확인 다이얼로그 표시
      await expect(testOperatorPage.getByText(/폐기 요청을 취소하시겠습니까/)).toBeVisible();

      // 확인 버튼 클릭
      await testOperatorPage.click('button:has-text("확인")');

      // Toast 알림 확인
      await expect(testOperatorPage.locator('.toast')).toContainText('취소 완료');

      // 상태 복구 확인
      await testOperatorPage.waitForTimeout(1000);
      await expect(testOperatorPage.getByRole('button', { name: '폐기 요청' })).toBeVisible();
    });

    test('요청자가 아닌 사용자는 취소 버튼을 볼 수 없다', async ({ techManagerPage }) => {
      // 다른 사용자가 요청한 폐기 진행 중인 장비로 이동
      await techManagerPage.goto('/equipment?status=pending_disposal');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      await equipmentCard.click();

      await techManagerPage.click('button:has-text("폐기 진행 중")');

      // 요청 취소 버튼이 없어야 함
      await expect(techManagerPage.getByText('요청 취소')).not.toBeVisible();
    });
  });

  test.describe('폐기 상세 내역 조회', () => {
    test('모든 사용자는 폐기 진행 상세 내역을 조회할 수 있다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=pending_disposal');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      await equipmentCard.click();

      // '폐기 진행 중' 버튼 클릭
      await testOperatorPage.click('button:has-text("폐기 진행 중")');

      // 폐기 상세 내역 다이얼로그 확인
      await expect(testOperatorPage.getByRole('heading', { name: '폐기 상세 내역' })).toBeVisible();

      // 진행 상태 배지 확인
      await expect(testOperatorPage.locator('.badge')).toBeVisible();

      // 3단계 타임라인 확인
      await expect(testOperatorPage.getByText('폐기 요청')).toBeVisible();
      await expect(testOperatorPage.getByText('기술책임자 검토')).toBeVisible();
      await expect(testOperatorPage.getByText('시험소장 최종 승인')).toBeVisible();

      // 요청 정보 카드 확인
      await expect(testOperatorPage.locator('.bg-gray-50')).toBeVisible();

      // 첨부 파일 다운로드 링크 접근성 확인 (있는 경우)
      const downloadLinks = testOperatorPage.locator('a[aria-label^="다운로드:"]');
      if ((await downloadLinks.count()) > 0) {
        await expect(downloadLinks.first()).toHaveAttribute('download');
      }
    });

    test('폐기 완료된 장비는 DisposedBanner를 표시한다', async ({ testOperatorPage }) => {
      // 폐기 완료 상태의 장비로 이동
      await testOperatorPage.goto('/equipment?status=disposed');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      await equipmentCard.click();

      // DisposedBanner 확인
      await expect(testOperatorPage.locator('.bg-gray-100')).toContainText('장비 폐기 완료');

      // 폐기 완료 버튼 비활성화 확인
      const disposedButton = testOperatorPage.getByRole('button', {
        name: '폐기 완료',
      });
      await expect(disposedButton).toBeDisabled();
    });
  });
});
