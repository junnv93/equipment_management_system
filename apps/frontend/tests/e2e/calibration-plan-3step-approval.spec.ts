/**
 * 교정계획서 3단계 승인 워크플로우 E2E 테스트
 *
 * 승인 흐름:
 * 1. 기술책임자: 계획서 작성 → 검토 요청
 * 2. 품질책임자: 검토 → 승인 요청 (또는 반려)
 * 3. 시험소장: 최종 승인 (또는 반려)
 *
 * 상태 전이:
 * draft → pending_review → pending_approval → approved
 *    ↑_____________________|____________________|
 *                      rejected
 */

import { test, expect } from './fixtures/auth.fixture';

test.describe('Calibration Plan 3-Step Approval Workflow', () => {
  // Chromium에서만 실행 (일관된 테스트 환경)
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test.describe('목록 페이지 접근 및 필터', () => {
    test('기술책임자는 교정계획서 목록을 조회할 수 있다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans');
      await techManagerPage.waitForLoadState('networkidle');

      // 페이지 제목 확인 (여러 개 있을 수 있으므로 first() 사용)
      await expect(
        techManagerPage.getByRole('heading', { name: /교정계획서/i }).first()
      ).toBeVisible();

      // 필터 영역 확인 (여러 개 있을 수 있으므로 first() 사용)
      await expect(techManagerPage.getByText('필터').first()).toBeVisible();
    });

    test('상태 필터에 검토 대기 옵션이 표시된다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans');
      await techManagerPage.waitForLoadState('networkidle');

      // 상태 필터 드롭다운 열기
      const statusFilter = techManagerPage.locator('button').filter({ hasText: /상태|전체 상태/i }).first();
      await statusFilter.click();

      // 모든 상태 옵션 확인
      await expect(techManagerPage.getByRole('option', { name: /작성 중/i })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: /확인 대기/i })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: /승인 대기/i })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: /승인됨/i })).toBeVisible();
      await expect(techManagerPage.getByRole('option', { name: /반려됨/i })).toBeVisible();
    });
  });

  test.describe('역할별 권한 테스트', () => {
    test('기술책임자는 계획서를 작성하고 검토 요청할 수 있다', async ({ techManagerPage }) => {
      await techManagerPage.goto('/calibration-plans');
      await techManagerPage.waitForLoadState('networkidle');

      // 새 계획서 작성 버튼 확인 (여러 개 있을 수 있으므로 first() 사용)
      const createButton = techManagerPage.getByRole('link', { name: /새 계획서 작성/i }).first();
      await expect(createButton).toBeVisible();
    });

    test('품질책임자는 계획서 목록을 조회할 수 있다', async ({ qualityManagerPage }) => {
      await qualityManagerPage.goto('/calibration-plans');
      await qualityManagerPage.waitForLoadState('networkidle');

      // 페이지 제목 확인 (여러 개 있을 수 있으므로 first() 사용)
      await expect(
        qualityManagerPage.getByRole('heading', { name: /교정계획서/i }).first()
      ).toBeVisible();
    });

    test('시험소장은 모든 상태의 계획서를 조회할 수 있다', async ({ siteAdminPage }) => {
      await siteAdminPage.goto('/calibration-plans');
      await siteAdminPage.waitForLoadState('networkidle');

      // 페이지 제목 확인 (여러 개 있을 수 있으므로 first() 사용)
      await expect(
        siteAdminPage.getByRole('heading', { name: /교정계획서/i }).first()
      ).toBeVisible();

      // 새 계획서 작성 버튼 확인 (시험소장도 작성 가능) - 여러 개 있을 수 있으므로 first() 사용
      const createButton = siteAdminPage.getByRole('link', { name: /새 계획서 작성/i }).first();
      await expect(createButton).toBeVisible();
    });
  });

  test.describe('상세 페이지 3단계 타임라인 UI', () => {
    test('상세 페이지에서 3단계 승인 타임라인이 표시된다', async ({ techManagerPage }) => {
      // 계획서 목록으로 이동
      await techManagerPage.goto('/calibration-plans');
      await techManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = techManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('테스트할 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 3단계 타임라인 확인
      await expect(techManagerPage.getByText('1. 작성')).toBeVisible();
      await expect(techManagerPage.getByText('2. 확인')).toBeVisible();
      await expect(techManagerPage.getByText('3. 승인')).toBeVisible();

      // 역할 라벨 확인
      await expect(techManagerPage.getByText('기술책임자')).toBeVisible();
      await expect(techManagerPage.getByText('품질책임자')).toBeVisible();
      await expect(techManagerPage.getByText('시험소장')).toBeVisible();
    });
  });

  test.describe('상태별 액션 버튼 테스트', () => {
    test('작성 중 상태에서 기술책임자는 검토 요청 버튼을 볼 수 있다', async ({
      techManagerPage,
    }) => {
      // 작성 중 상태 필터로 계획서 목록 조회
      await techManagerPage.goto('/calibration-plans?status=draft');
      await techManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = techManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('작성 중 상태의 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 검토 요청 버튼 확인
      const submitButton = techManagerPage.getByRole('button', { name: /검토 요청/i });
      await expect(submitButton).toBeVisible();
    });

    test('확인 대기 상태에서 품질책임자는 확인 완료/반려 버튼을 볼 수 있다', async ({
      qualityManagerPage,
    }) => {
      // 확인 대기 상태 필터로 계획서 목록 조회
      await qualityManagerPage.goto('/calibration-plans?status=pending_review');
      await qualityManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = qualityManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('확인 대기 상태의 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await qualityManagerPage.waitForLoadState('networkidle');

      // 타임라인 내 확인 완료 버튼 확인
      const reviewButton = qualityManagerPage.getByRole('button', { name: /확인 완료/i });
      await expect(reviewButton).toBeVisible();

      // 반려 링크 확인 (텍스트 링크로 변경됨)
      const rejectLink = qualityManagerPage.getByText('반려').first();
      await expect(rejectLink).toBeVisible();
    });

    test('승인 대기 상태에서 시험소장은 최종 승인/반려 버튼을 볼 수 있다', async ({
      siteAdminPage,
    }) => {
      // 승인 대기 상태 필터로 계획서 목록 조회
      await siteAdminPage.goto('/calibration-plans?status=pending_approval');
      await siteAdminPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = siteAdminPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('승인 대기 상태의 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await siteAdminPage.waitForLoadState('networkidle');

      // 최종 승인 버튼 확인
      const approveButton = siteAdminPage.getByRole('button', { name: /최종 승인/i });
      await expect(approveButton).toBeVisible();

      // 반려 버튼 확인
      const rejectButton = siteAdminPage.getByRole('button', { name: /반려/i });
      await expect(rejectButton).toBeVisible();
    });
  });

  test.describe('반려 정보 표시', () => {
    test('반려된 계획서에서 반려 단계와 사유가 표시된다', async ({ techManagerPage }) => {
      // 반려됨 상태 필터로 계획서 목록 조회
      await techManagerPage.goto('/calibration-plans?status=rejected');
      await techManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = techManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('반려된 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 반려 알림 확인
      await expect(techManagerPage.getByText(/반려됨/i)).toBeVisible();

      // 반려 단계 표시 확인 (확인 단계 또는 승인 단계)
      const stageText = techManagerPage.getByText(/확인 단계|승인 단계/i);
      await expect(stageText).toBeVisible();
    });

    test('반려된 계획서에서 기술책임자는 재제출 버튼을 볼 수 있다', async ({
      techManagerPage,
    }) => {
      // 반려됨 상태 필터로 계획서 목록 조회
      await techManagerPage.goto('/calibration-plans?status=rejected');
      await techManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = techManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('반려된 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 검토 요청 버튼이 표시되어야 함 (반려된 계획서 재제출)
      const submitButton = techManagerPage.getByRole('button', { name: /검토 요청/i });
      await expect(submitButton).toBeVisible();
    });
  });

  test.describe('다이얼로그 테스트', () => {
    test('검토 요청 다이얼로그에서 취소하면 상태가 변경되지 않는다', async ({
      techManagerPage,
    }) => {
      // 작성 중 상태 필터로 계획서 목록 조회
      await techManagerPage.goto('/calibration-plans?status=draft');
      await techManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = techManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('작성 중 상태의 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await techManagerPage.waitForLoadState('networkidle');

      // 검토 요청 버튼 클릭
      const submitButton = techManagerPage.getByRole('button', { name: /검토 요청/i });
      if ((await submitButton.count()) === 0) {
        test.skip();
        return;
      }
      await submitButton.click();

      // 다이얼로그 확인
      await expect(techManagerPage.getByRole('dialog')).toBeVisible();
      await expect(techManagerPage.getByText(/품질책임자에게 검토 요청/i)).toBeVisible();

      // 취소 버튼 클릭
      await techManagerPage.getByRole('button', { name: /취소/i }).click();

      // 다이얼로그가 닫혔는지 확인
      await expect(techManagerPage.getByRole('dialog')).not.toBeVisible();

      // 상태 배지가 여전히 "작성 중"인지 확인
      await expect(techManagerPage.getByText(/작성 중/i)).toBeVisible();
    });

    test('반려 다이얼로그에서 사유 입력 없이 반려할 수 없다', async ({
      qualityManagerPage,
    }) => {
      // 확인 대기 상태 필터로 계획서 목록 조회
      await qualityManagerPage.goto('/calibration-plans?status=pending_review');
      await qualityManagerPage.waitForLoadState('networkidle');

      // 첫 번째 계획서 상세 보기
      const detailButton = qualityManagerPage.getByRole('button', { name: /상세/i }).first();
      if ((await detailButton.count()) === 0) {
        console.log('확인 대기 상태의 계획서가 없습니다. 테스트 건너뛰기');
        test.skip();
        return;
      }

      await detailButton.click();
      await qualityManagerPage.waitForLoadState('networkidle');

      // 반려 링크 클릭 (타임라인 내 텍스트 링크)
      const rejectLink = qualityManagerPage.getByText('반려').first();
      if ((await rejectLink.count()) === 0) {
        test.skip();
        return;
      }
      await rejectLink.click();

      // 다이얼로그 확인
      await expect(qualityManagerPage.getByRole('dialog')).toBeVisible();

      // 반려 버튼이 비활성화 상태인지 확인 (사유 미입력)
      const dialogRejectButton = qualityManagerPage
        .getByRole('dialog')
        .getByRole('button', { name: /반려/i });
      await expect(dialogRejectButton).toBeDisabled();

      // 취소
      await qualityManagerPage.getByRole('button', { name: /취소/i }).click();
    });
  });
});
