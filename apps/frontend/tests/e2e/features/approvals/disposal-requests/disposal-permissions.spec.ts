/**
 * 장비 폐기 권한 검증 E2E 테스트
 *
 * 테스트 범위:
 * - 역할별 폐기 버튼 표시 여부
 * - 팀별 검토 권한
 * - 요청자 외 취소 불가
 * - 임시장비 폐기 불가
 *
 * 권한 매트릭스:
 * | 역할            | 폐기 요청 | 검토 (같은 팀) | 최종 승인 | 요청 취소 (본인) |
 * | --------------- | --------- | -------------- | --------- | ---------------- |
 * | test_engineer   | ✅        | ❌             | ❌        | ✅               |
 * | technical_manager| ✅       | ✅             | ❌        | ✅               |
 * | lab_manager     | ✅        | ✅             | ✅        | ✅               |
 *
 * ⚠️ 주의: 이 테스트는 백엔드 disposal API 구현이 완료되어야 실행 가능합니다.
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

test.describe('Disposal Permissions', () => {
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

  test.describe('폐기 요청 권한', () => {
    test('시험실무자는 사용 가능한 장비에 대해 폐기 요청 버튼을 볼 수 있다', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment?status=available');
      await testOperatorPage.waitForLoadState('networkidle');

      // 첫 번째 사용 가능한 장비 선택
      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '사용 가능한 장비가 없습니다');
        return;
      }

      await equipmentCard.click();
      await testOperatorPage.waitForLoadState('networkidle');

      // 폐기 요청 버튼 확인
      const disposalButton = testOperatorPage.getByRole('button', {
        name: /폐기 요청/i,
      });
      await expect(disposalButton).toBeVisible();
      await expect(disposalButton).toBeEnabled();
    });

    test('기술책임자는 사용 가능한 장비에 대해 폐기 요청 버튼을 볼 수 있다', async ({
      techManagerPage,
    }) => {
      await techManagerPage.goto('/equipment?status=available');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '사용 가능한 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      const disposalButton = techManagerPage.getByRole('button', {
        name: /폐기 요청/i,
      });
      await expect(disposalButton).toBeVisible();
    });

    test('시험소장은 사용 가능한 장비에 대해 폐기 요청 버튼을 볼 수 있다', async ({
      siteAdminPage,
    }) => {
      await siteAdminPage.goto('/equipment?status=available');
      await siteAdminPage.waitForLoadState('networkidle');

      const equipmentCard = siteAdminPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '사용 가능한 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      const disposalButton = siteAdminPage.getByRole('button', {
        name: /폐기 요청/i,
      });
      await expect(disposalButton).toBeVisible();
    });

    test('임시장비는 폐기 요청 버튼이 표시되지 않는다', async ({ testOperatorPage }) => {
      // 임시장비 목록 페이지로 이동
      await testOperatorPage.goto('/equipment?classification=temporary');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '임시장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      // 폐기 관련 버튼이 없어야 함
      await expect(testOperatorPage.getByRole('button', { name: /폐기/i })).not.toBeVisible();
    });

    test('이미 폐기 진행 중인 장비는 폐기 요청 버튼이 표시되지 않는다', async ({
      testOperatorPage,
    }) => {
      await testOperatorPage.goto('/equipment?status=pending_disposal');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      // '폐기 요청' 버튼이 아닌 '폐기 진행 중' 버튼이 표시되어야 함
      await expect(testOperatorPage.getByRole('button', { name: /폐기 요청/i })).not.toBeVisible();

      await expect(testOperatorPage.getByRole('button', { name: /폐기 진행 중/i })).toBeVisible();
    });
  });

  test.describe('폐기 검토 권한 (팀 기반)', () => {
    test('기술책임자는 같은 팀의 폐기 요청만 검토할 수 있다', async ({ techManagerPage }) => {
      // 같은 팀의 폐기 진행 중인 장비로 이동
      await techManagerPage.goto('/equipment?status=pending_disposal&team=same');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '같은 팀의 폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      // '폐기 진행 중' 버튼 클릭하여 상세 다이얼로그 열기
      await techManagerPage.click('button:has-text("폐기 진행 중")');

      // '폐기 검토하기' 버튼이 표시되어야 함
      await expect(techManagerPage.getByText('폐기 검토하기')).toBeVisible();
    });

    test('기술책임자는 다른 팀의 폐기 요청을 검토할 수 없다', async ({ techManagerPage }) => {
      // 다른 팀의 폐기 진행 중인 장비로 이동
      await techManagerPage.goto('/equipment?status=pending_disposal&team=different');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '다른 팀의 폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await techManagerPage.click('button:has-text("폐기 진행 중")');

      // '폐기 검토하기' 버튼이 표시되지 않아야 함
      await expect(techManagerPage.getByText('폐기 검토하기')).not.toBeVisible();

      // 대신 '검토 권한 없음' 메시지가 표시되어야 함
      await expect(techManagerPage.getByText(/팀의 장비만 검토 가능/)).toBeVisible();
    });

    test('시험실무자는 폐기 검토 권한이 없다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=pending_disposal');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 진행 중")');

      // '폐기 검토하기' 버튼이 표시되지 않아야 함
      await expect(testOperatorPage.getByText('폐기 검토하기')).not.toBeVisible();
    });

    test('시험소장은 모든 팀의 폐기 요청을 검토할 수 있다', async ({ siteAdminPage }) => {
      // 모든 팀의 폐기 진행 중인 장비
      await siteAdminPage.goto('/equipment?status=pending_disposal');
      await siteAdminPage.waitForLoadState('networkidle');

      const equipmentCard = siteAdminPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await siteAdminPage.click('button:has-text("폐기 진행 중")');

      // 시험소장은 항상 최종 승인 권한을 가짐
      // 검토 완료 전이라도 '최종 승인하기' 또는 '폐기 검토하기' 버튼이 표시되어야 함
      const hasReviewButton = await siteAdminPage.getByText('폐기 검토하기').isVisible();
      const hasApprovalButton = await siteAdminPage.getByText('최종 승인하기').isVisible();

      expect(hasReviewButton || hasApprovalButton).toBeTruthy();
    });
  });

  test.describe('폐기 최종 승인 권한', () => {
    test('시험소장만 최종 승인 버튼을 볼 수 있다', async ({ siteAdminPage }) => {
      // 검토 완료 상태(pending_approval)의 장비로 이동
      await siteAdminPage.goto('/equipment?status=pending_disposal&reviewStatus=reviewed');
      await siteAdminPage.waitForLoadState('networkidle');

      const equipmentCard = siteAdminPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '검토 완료 상태의 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await siteAdminPage.click('button:has-text("폐기 진행 중")');

      // '최종 승인하기' 버튼 확인
      await expect(siteAdminPage.getByText('최종 승인하기')).toBeVisible();
    });

    test('기술책임자는 최종 승인 버튼을 볼 수 없다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/equipment?status=pending_disposal&reviewStatus=reviewed');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '검토 완료 상태의 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await techManagerPage.click('button:has-text("폐기 진행 중")');

      // '최종 승인하기' 버튼이 표시되지 않아야 함
      await expect(techManagerPage.getByText('최종 승인하기')).not.toBeVisible();
    });

    test('시험실무자는 최종 승인 버튼을 볼 수 없다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=pending_disposal&reviewStatus=reviewed');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '검토 완료 상태의 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 진행 중")');

      await expect(testOperatorPage.getByText('최종 승인하기')).not.toBeVisible();
    });
  });

  test.describe('폐기 요청 취소 권한', () => {
    test('요청자는 본인의 폐기 요청을 취소할 수 있다', async ({ testOperatorPage }) => {
      // 본인이 요청한 폐기 진행 중인 장비
      await testOperatorPage.goto('/equipment?status=pending_disposal&requester=me');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '본인이 요청한 폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 진행 중")');

      // '요청 취소' 버튼 확인
      await expect(testOperatorPage.getByText('요청 취소')).toBeVisible();
    });

    test('요청자가 아닌 사용자는 취소 버튼을 볼 수 없다', async ({ techManagerPage }) => {
      // 다른 사용자가 요청한 폐기 진행 중인 장비
      await techManagerPage.goto('/equipment?status=pending_disposal&requester=others');
      await techManagerPage.waitForLoadState('networkidle');

      const equipmentCard = techManagerPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '다른 사용자가 요청한 폐기 진행 중인 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await techManagerPage.click('button:has-text("폐기 진행 중")');

      // '요청 취소' 버튼이 표시되지 않아야 함
      await expect(techManagerPage.getByText('요청 취소')).not.toBeVisible();
    });

    test('검토 완료 후에는 취소할 수 없다', async ({ testOperatorPage }) => {
      // 검토 완료 상태의 본인 요청 장비
      await testOperatorPage.goto(
        '/equipment?status=pending_disposal&reviewStatus=reviewed&requester=me'
      );
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '검토 완료 상태의 본인 요청 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      await testOperatorPage.click('button:has-text("폐기 진행 중")');

      // '요청 취소' 버튼이 표시되지 않거나 비활성화되어야 함
      const cancelButton = testOperatorPage.getByText('요청 취소');
      const isVisible = await cancelButton.isVisible();

      if (isVisible) {
        await expect(cancelButton).toBeDisabled();
      } else {
        await expect(cancelButton).not.toBeVisible();
      }
    });
  });

  test.describe('폐기 완료 장비 권한', () => {
    test('폐기 완료된 장비는 모든 사용자가 조회만 가능하다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=disposed');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '폐기 완료된 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      // DisposedBanner 확인
      await expect(testOperatorPage.locator('.bg-gray-100')).toContainText('장비 폐기 완료');

      // '폐기 완료' 버튼이 비활성화되어 있어야 함
      const disposedButton = testOperatorPage.getByRole('button', {
        name: '폐기 완료',
      });
      await expect(disposedButton).toBeDisabled();

      // 어떤 액션 버튼도 표시되지 않아야 함
      await expect(testOperatorPage.getByText('폐기 요청')).not.toBeVisible();
      await expect(testOperatorPage.getByText('요청 취소')).not.toBeVisible();
      await expect(testOperatorPage.getByText('폐기 검토하기')).not.toBeVisible();
      await expect(testOperatorPage.getByText('최종 승인하기')).not.toBeVisible();
    });

    test('폐기 완료된 장비의 상세 내역은 조회 가능하다', async ({ testOperatorPage }) => {
      await testOperatorPage.goto('/equipment?status=disposed');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '폐기 완료된 장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      // '폐기 완료' 버튼 클릭 (비활성화되어 있지만 클릭 가능한 경우)
      // 또는 별도의 '상세 내역' 버튼이 있을 수 있음
      const detailButton = testOperatorPage.getByRole('button', {
        name: /폐기 완료|상세 내역/i,
      });

      if (await detailButton.isEnabled()) {
        await detailButton.click();

        // 폐기 상세 내역 다이얼로그 확인
        await expect(
          testOperatorPage.getByRole('heading', { name: '폐기 상세 내역' })
        ).toBeVisible();

        // 타임라인 확인
        await expect(testOperatorPage.getByText('폐기 요청')).toBeVisible();
        await expect(testOperatorPage.getByText('기술책임자 검토')).toBeVisible();
        await expect(testOperatorPage.getByText('시험소장 최종 승인')).toBeVisible();
      }
    });
  });

  test.describe('권한 기반 버튼 표시', () => {
    test('useDisposalPermissions 훅이 올바른 권한을 반환한다', async ({ testOperatorPage }) => {
      // 이 테스트는 권한 로직이 올바르게 작동하는지 간접적으로 확인
      // 프론트엔드 로직 검증용

      await testOperatorPage.goto('/equipment?status=available');
      await testOperatorPage.waitForLoadState('networkidle');

      const equipmentCard = testOperatorPage.locator('article').first();
      if ((await equipmentCard.count()) === 0) {
        test.skip(true, '장비가 없습니다');
        return;
      }

      await equipmentCard.click();

      // 시험실무자는 폐기 요청만 가능
      await expect(testOperatorPage.getByRole('button', { name: /폐기 요청/i })).toBeVisible();

      // 다른 버튼들은 표시되지 않아야 함
      await expect(testOperatorPage.getByText('폐기 검토하기')).not.toBeVisible();
      await expect(testOperatorPage.getByText('최종 승인하기')).not.toBeVisible();
    });

    test('시험소장은 모든 단계의 버튼을 볼 수 있다', async ({ siteAdminPage }) => {
      // 사용 가능한 장비: 폐기 요청 버튼
      await siteAdminPage.goto('/equipment?status=available');
      await siteAdminPage.waitForLoadState('networkidle');

      let equipmentCard = siteAdminPage.locator('article').first();
      if ((await equipmentCard.count()) > 0) {
        await equipmentCard.click();
        await expect(siteAdminPage.getByRole('button', { name: /폐기 요청/i })).toBeVisible();
      }

      // 폐기 진행 중인 장비: 검토/승인 버튼
      await siteAdminPage.goto('/equipment?status=pending_disposal');
      await siteAdminPage.waitForLoadState('networkidle');

      equipmentCard = siteAdminPage.locator('article').first();
      if ((await equipmentCard.count()) > 0) {
        await equipmentCard.click();
        await siteAdminPage.click('button:has-text("폐기 진행 중")');

        // 시험소장은 검토 또는 최종 승인 버튼을 볼 수 있음
        const hasReviewButton = await siteAdminPage.getByText('폐기 검토하기').isVisible();
        const hasApprovalButton = await siteAdminPage.getByText('최종 승인하기').isVisible();

        expect(hasReviewButton || hasApprovalButton).toBeTruthy();
      }
    });
  });
});
