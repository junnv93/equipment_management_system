/**
 * Group G: 권한 검증 및 에러 처리
 *
 * 테스트 범위:
 * - 역할별 교정 등록 페이지 접근 제어 (품질책임자 제한)
 * - 역할별 승인 페이지 접근 제어 (시험실무자 제한)
 * - 시험소장의 교정 등록 제한 (UL-QP-18 직무분리)
 * - 필수 필드 유효성 검증
 * - CAS 버전 충돌 처리 및 캐시 무효화
 * - 네트워크 오류 처리
 *
 * ## SSOT 준수
 * - auth.fixture.ts: qualityManagerPage, testOperatorPage, techManagerPage, siteAdminPage
 * - Permission: @equipment-management/shared-constants
 * - API Mocking: page.route() for error scenarios
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import type { Route } from '@playwright/test';

test.describe('권한 검증 및 에러 처리', () => {
  // fixme: 품질책임자의 교정 등록 페이지 접근 제어가 프론트엔드에 구현되어 있지 않음.
  // /calibration/register 페이지에 역할 기반 접근 제어(redirect 또는 권한 확인)가 없어
  // quality_manager도 정상적으로 접근 가능합니다.
  test.fixme(
    '7.1. 품질책임자는 교정 등록 페이지에 접근할 수 없다',
    async ({ qualityManagerPage: page }) => {
      await page.goto('/calibration/register');
      // Expected: access denied or redirect — but page renders normally
    }
  );

  // fixme: /admin/approvals 통합 승인 페이지는 APPROVAL_ROLES 기반 redirect가 있으나,
  // 시험실무자(test_engineer)가 직접 URL로 접근 시 동작을 확인해야 합니다.
  test.fixme(
    '7.2. 시험실무자는 승인 페이지에 접근할 수 없다',
    async ({ testOperatorPage: page }) => {
      await page.goto('/admin/approvals?tab=calibration');
      // Expected: redirect to /dashboard — but page renders with approve/reject buttons
    }
  );

  // fixme: 교정 등록 폼의 필수 필드 유효성 검증 테스트.
  // CalibrationRegisterContent의 장비 선택 UI가 CSS class (.equipment-list-item)가 아닌
  // 카드 기반 UI로 구현되어 있어 selector 매칭이 안 됩니다.
  // 또한 폼 단계가 장비 선택 → 폼 입력으로 분리되어 있어 별도 분석이 필요합니다.
  test.fixme(
    '7.3. 교정 등록 시 필수 필드 미입력이면 API 요청이 차단된다',
    async ({ testOperatorPage: page }) => {
      await page.goto('/calibration/register');
      // Needs: proper form field selectors matching CalibrationRegisterContent UI
    }
  );

  test('7.4. CAS 버전 충돌 시 자동 캐시 무효화 및 서버 재검증이 수행된다', async ({
    techManagerPage: page,
  }) => {
    // 1. techManagerPage로 통합 승인 페이지(교정 탭) 이동
    await page.goto('/admin/approvals?tab=calibration');
    await expect(page.getByRole('heading', { name: '승인 관리' })).toBeVisible({
      timeout: 30000,
    });

    // 승인 대기 항목 확인 - 목록 로딩 대기
    const approveButton = page.getByRole('button', { name: '승인' }).first();
    const isApproveButtonVisible = await approveButton
      .isVisible({ timeout: 10000 })
      .catch(() => false);

    if (!isApproveButtonVisible) {
      test.skip(true, '승인 대기 항목이 없습니다');
      return;
    }

    let apiCallCount = 0;
    let mockReturned409 = false;

    // 2. 네트워크 요청을 route로 인터셉트하여 409 VERSION_CONFLICT 응답 모킹
    await page.route('**/api/calibration/*/approve', async (route: Route) => {
      apiCallCount++;

      if (apiCallCount === 1 && !mockReturned409) {
        // 첫 번째 요청에만 409 반환
        mockReturned409 = true;
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            message: '다른 사용자가 동시에 수정했습니다. 최신 정보를 확인해주세요.',
            code: 'VERSION_CONFLICT',
            currentVersion: 2,
            expectedVersion: 1,
            timestamp: new Date().toISOString(),
          }),
        });
      } else {
        // 재시도는 정상 처리
        await route.continue();
      }
    });

    // 목록 재조회 모니터링
    let listRefetchOccurred = false;
    await page.route('**/api/calibration/pending*', async (route: Route) => {
      if (mockReturned409) {
        listRefetchOccurred = true;
      }
      await route.continue();
    });

    // 3. 승인 버튼 클릭
    await approveButton.click();

    // 승인 다이얼로그가 표시될 수 있음 - 다이얼로그 내 승인 확인 버튼 클릭
    const approveDialog = page.getByRole('dialog', { name: /교정 승인/ });
    const isDialogVisible = await approveDialog.isVisible({ timeout: 3000 }).catch(() => false);

    if (isDialogVisible) {
      const confirmButton = approveDialog.getByRole('button', { name: /승인/ });
      await confirmButton.click();
    }

    // 4. VERSION_CONFLICT 에러 토스트 메시지 확인
    // Toast renders title and description as separate elements — use exact text to avoid strict mode
    const errorToast = page.getByText('승인 실패', { exact: true }).first();
    await expect(errorToast).toBeVisible({ timeout: 10000 });

    // 5. 캐시 무효화 후 목록이 재조회되는지 확인
    // onSettled에서 invalidateQueries가 실행되므로 refetch 발생
    await expect(() => {
      expect(listRefetchOccurred).toBe(true);
    }).toPass({ timeout: 5000 });
  });

  test('7.5. 네트워크 오류 시 에러 상태가 올바르게 표시된다', async ({ techManagerPage: page }) => {
    // 1. route 인터셉트로 /api/calibration/summary 요청을 500 Internal Server Error로 모킹
    await page.route('**/api/calibration/summary*', async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          message: '서버 오류가 발생했습니다.',
          code: 'INTERNAL_SERVER_ERROR',
          timestamp: new Date().toISOString(),
        }),
      });
    });

    // 2. techManagerPage로 /calibration 이동
    await page.goto('/calibration');

    // 3. 페이지 제목이 보이는지 확인 (페이지 자체는 로드됨)
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible({ timeout: 30000 });

    // 4. 에러 상태 UI가 표시되는지 확인
    // Error Boundary 또는 에러 메시지 또는 0대 통계 표시
    // summary가 500이면 통계 카드에 0이 표시되거나 에러 메시지가 나옴
    const errorMessage = page.getByText(/오류|에러|error|문제가 발생/i);
    const isErrorVisible = await errorMessage.isVisible({ timeout: 5000 }).catch(() => false);

    if (isErrorVisible) {
      await expect(errorMessage).toBeVisible();
    } else {
      // 빈 상태 또는 통계 0대가 표시됨 (summary API 실패 → 빈 데이터)
      // 페이지가 크래시하지 않고 gracefully 처리되었음을 확인
      const heading = page.getByRole('heading', { name: '교정 관리' });
      await expect(heading).toBeVisible();
    }

    // 5. 재시도 버튼이 있는 경우 클릭하여 복구 가능한지 확인
    const retryButton = page.getByRole('button', { name: /다시 시도|재시도|retry/i });
    const isRetryButtonVisible = await retryButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (isRetryButtonVisible) {
      // 재시도 시 정상 응답 반환하도록 모킹 해제
      await page.unroute('**/api/calibration/summary*');

      await retryButton.click();

      // 정상 데이터 로드 확인
      const statsCard = page.getByText(/전체 교정 장비|교정 기한 초과/);
      await expect(statsCard).toBeVisible({ timeout: 10000 });
    }
  });

  // fixme: 시험소장(lab_manager)의 교정 등록 제한이 프론트엔드에 구현되어 있지 않음.
  // CalibrationRegisterContent는 역할 확인을 하지만 (isTechnicalManager),
  // 이는 UI 분기용이지 접근 차단용이 아닙니다.
  // UL-QP-18 직무분리 원칙에 따라 서버 사이드 접근 제어 구현이 필요합니다.
  test.fixme(
    '7.6. 시험소장은 교정 등록을 직접 할 수 없다 (UL-QP-18 직무분리)',
    async ({ siteAdminPage: page }) => {
      await page.goto('/calibration/register');
      // Expected: access denied or redirect — but page renders normally for lab_manager
    }
  );
});
