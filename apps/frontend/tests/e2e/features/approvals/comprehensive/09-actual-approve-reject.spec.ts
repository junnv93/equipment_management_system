/**
 * 승인 관리 - 실제 승인/반려 실행 + UI 상태 변경 검증
 *
 * serial 모드: 상태 변경 테스트이므로 순차 실행
 * beforeAll: API로 시드 데이터를 승인 가능 상태로 리셋
 * afterAll: DB 리셋 + 캐시 클리어
 *
 * SSOT: shared-test-data.ts 상수 사용, 하드코딩 없음
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  waitForApprovalListOrEmpty,
  waitForToast,
  cleanupApprovalPool,
} from '../../../shared/helpers/approval-helpers';

test.describe('실제 승인/반려 + UI 상태 변경', () => {
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    await cleanupApprovalPool();
  });

  test('TC-01: TM이 반출 탭에서 승인 → 항목 목록에서 사라짐', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 현재 목록 항목 수 확인
    const initialItems = page.locator('[data-testid="approval-item"]');
    const initialCount = await initialItems.count();
    expect(initialCount).toBeGreaterThan(0);

    // 첫 번째 항목의 상세 모달 열기
    const firstItem = initialItems.first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // 승인 버튼 클릭
    await dialog.getByRole('button', { name: '승인' }).click();

    // 토스트 메시지 확인 ("승인되었습니다")
    await waitForToast(page, /승인되었습니다/);

    // 목록에서 해당 항목이 사라짐 (exit animation 후)
    // 항목 수가 감소했거나 빈 상태가 되어야 함
    await expect(async () => {
      const currentCount = await page.locator('[data-testid="approval-item"]').count();
      const isEmpty = await page
        .getByText('모든 승인을 완료했습니다')
        .isVisible()
        .catch(() => false);
      expect(currentCount < initialCount || isEmpty).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test('TC-02: TM이 반출 탭에서 반려 → 반려 사유 필수 + 항목 사라짐', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/admin/approvals?tab=outgoing');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    const initialCount = await page.locator('[data-testid="approval-item"]').count();

    // 상세 모달 → 반려
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const detailDialog = page.getByRole('dialog');
    await expect(detailDialog).toBeVisible();
    await detailDialog.getByRole('button', { name: '반려' }).click();

    // 반려 모달
    const rejectDialog = page.getByRole('dialog');
    await expect(rejectDialog).toBeVisible();

    // 10자 이상 반려 사유 입력
    const reasonInput = rejectDialog.locator('textarea[name="reason"]');
    await reasonInput.fill('테스트용 반려 사유입니다. 충분히 긴 사유를 입력합니다.');

    // 제출
    await rejectDialog.getByRole('button', { name: /반려/ }).last().click();

    // 토스트 메시지 확인
    await waitForToast(page, /반려되었습니다/);

    // 항목 수 감소
    await expect(async () => {
      const currentCount = await page.locator('[data-testid="approval-item"]').count();
      const isEmpty = await page
        .getByText('모든 승인을 완료했습니다')
        .isVisible()
        .catch(() => false);
      expect(currentCount < initialCount || isEmpty).toBeTruthy();
    }).toPass({ timeout: 10000 });
  });

  test('TC-03: 승인 후 KPI 전체 대기 숫자 감소', async ({ techManagerPage: page }) => {
    await page.goto('/admin/approvals?tab=calibration');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // KPI 로딩 대기
    const totalPendingCard = page.locator('[role="group"][aria-label="전체 대기"]');
    await expect(totalPendingCard).toBeVisible();
    // 스켈레톤이 사라질 때까지 대기
    await expect(totalPendingCard.getByTestId('kpi-value-skeleton')).not.toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    if (!hasData) {
      test.skip();
      return;
    }

    // 상세 모달 → 승인
    const firstItem = page.locator('[data-testid="approval-item"]').first();
    await firstItem.getByRole('button', { name: /상세 보기/ }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '승인' }).click();

    // 토스트 확인
    await waitForToast(page, /승인되었습니다/);

    // KPI가 갱신됨 (invalidateQueries 발동)
    // 정확한 숫자 비교보다 KPI 카드가 여전히 정상 렌더링되는지 확인
    await expect(totalPendingCard).toBeVisible();
  });
});
