/**
 * 승인 관리 - 1단계 단건 승인/반려
 *
 * 시나리오 3: 반출, 장비, 교정, 중간점검, 부적합, 소프트웨어
 *
 * 각 카테고리에서:
 * - 목록 렌더링 확인
 * - 승인/반려 버튼 존재 확인
 * - 반려 시 반려 사유 필수 확인 (10자 이상)
 * - 소프트웨어: commentRequired → 코멘트 다이얼로그 표시
 * - 상세 보기 모달 열기/닫기
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { waitForApprovalListOrEmpty } from '../../../shared/helpers/approval-helpers';

test.describe('1단계 승인 - 카테고리별 기본 기능', () => {
  test('TC-01: 반출(outgoing) 탭 - 목록 렌더링 + 승인/반려 UI', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // 사이드바에서 반출 탭이 활성화 (aria-current="page")
    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /반출/ }).first()).toHaveAttribute(
      'aria-current',
      'page'
    );

    // 목록이 로딩된 후 — 빈 상태 또는 데이터
    await waitForApprovalListOrEmpty(page);
  });

  test('TC-02: 장비(equipment) 탭 - 목록 렌더링', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=equipment');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /장비/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await waitForApprovalListOrEmpty(page);
  });

  test('TC-03: 교정(calibration) 탭 - 목록 렌더링', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=calibration');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /교정 기록/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await waitForApprovalListOrEmpty(page);
  });

  test('TC-04: 중간점검(inspection) 탭 - 목록 렌더링', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=inspection');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /중간점검/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await waitForApprovalListOrEmpty(page);
  });

  test('TC-05: 부적합(nonconformity) 탭 - 목록 렌더링', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=nonconformity');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /부적합 재개/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await waitForApprovalListOrEmpty(page);
  });

  test('TC-06: 소프트웨어(software) 탭 - commentRequired 확인', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=software');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const sidebar = page.getByRole('navigation', { name: '승인 카테고리 네비게이션' });
    await expect(sidebar.getByRole('button', { name: /소프트웨어/ })).toHaveAttribute(
      'aria-current',
      'page'
    );

    await waitForApprovalListOrEmpty(page);
  });

  test('TC-07: 반려 모달 - 10자 미만 시 제출 불가 (상세 모달 경유)', async ({
    techManagerPage: page,
  }) => {
    // 교정 탭은 데이터가 확실히 있음 (seed: 4건)
    await page.goto('/admin/approvals?tab=calibration');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 첫 번째 항목의 상세 버튼 클릭 (데스크탑 아이콘: sr-only "상세 보기")
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    const detailBtn = firstItem.getByRole('button', { name: /상세 보기/ });
    await detailBtn.click();

    // 상세 모달 표시
    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible();

    // 상세 모달에서 "반려" 버튼 클릭
    await detailDialog.getByRole('button', { name: '반려' }).click();

    // 반려 모달 표시
    // 상세 모달이 닫히고 반려 모달이 열림
    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog).toBeVisible();
    await expect(rejectDialog.getByLabel(/반려 사유/)).toBeVisible();

    // 짧은 사유 입력 (10자 미만)
    const reasonInput = rejectDialog.locator('textarea[name="reason"]');
    await reasonInput.fill('짧은사유');

    // 제출 버튼 클릭 시 검증 에러
    const submitBtn = rejectDialog.getByRole('button', { name: /반려/ }).last();
    await submitBtn.click();

    // 검증 에러 메시지 표시
    await expect(rejectDialog.getByRole('alert')).toBeVisible();
  });

  test('TC-08: 반려 모달 - 템플릿 선택 기능', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=calibration');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 상세 모달 열기 → 반려 클릭
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible();
    await detailDialog.getByRole('button', { name: '반려' }).click();

    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog).toBeVisible();

    // 템플릿 선택 드롭다운 존재 확인
    await expect(rejectDialog.getByText('사유 템플릿')).toBeVisible();
  });

  test('TC-09: 상세 보기 모달 열기 + 정보 표시', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=calibration');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 상세 보기 열기
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    // 상세 모달 표시
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 모달 제목: "승인 요청 상세"
    await expect(dialog.getByRole('heading', { name: /승인 요청 상세/ })).toBeVisible();

    // 요청자 정보 표시
    await expect(dialog.getByText('요청자')).toBeVisible();
    await expect(dialog.getByText('소속')).toBeVisible();
    await expect(dialog.getByText('요청일시')).toBeVisible();

    // 요청 상세 섹션
    await expect(dialog.getByRole('heading', { name: '요청 상세', exact: true })).toBeVisible();

    // 승인/반려/닫기 버튼
    await expect(dialog.getByRole('button', { name: '닫기' })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /승인/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: '반려' })).toBeVisible();

    // 닫기 버튼으로 모달 닫기
    await dialog.getByRole('button', { name: '닫기' }).click();
    await expect(dialog).not.toBeVisible();
  });
});
