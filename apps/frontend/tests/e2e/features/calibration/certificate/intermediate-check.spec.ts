/**
 * Group E: 중간점검 완료 워크플로우
 *
 * 테스트 대상:
 * - 중간점검 완료 다이얼로그 표시
 * - 중간점검 완료 처리 및 상태 업데이트
 * - D-day별 상태 배지 색상 검증
 *
 * ## SSOT 준수
 * - auth.fixture.ts: techManagerPage
 * - 중간점검 탭은 /calibration 페이지의 "중간점검" TabsTrigger
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import { expectToastVisible } from '../../../shared/helpers/toast-helpers';

test.describe('중간점검 완료 워크플로우', () => {
  test.describe.configure({ mode: 'serial' }); // 상태 변경 테스트

  test('5.1. 중간점검 탭에서 완료 버튼 클릭 시 확인 다이얼로그가 표시된다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 목록 페이지 이동
    await page.goto('/calibration');

    // Wait for page heading to load
    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible({ timeout: 15000 });

    // 2. 중간점검 탭 클릭 (tab text includes count: "중간점검 (N)")
    await page.getByRole('tab', { name: /중간점검/ }).click();

    // 3. 중간점검 항목이 있는지 확인
    // Wait for the tab content to load - either items or empty state
    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });

    // Check if there are items with "완료" buttons
    const completeButtons = page.getByRole('button', { name: '완료' });
    const count = await completeButtons.count();

    if (count === 0) {
      test.skip(true, '중간점검 항목이 없습니다');
      return;
    }

    // 4. 첫 번째 항목의 '완료' 버튼 클릭
    await completeButtons.first().click();

    // 5. 확인 다이얼로그가 표시되는지 확인 (title: "중간점검 완료")
    const dialog = page.getByRole('dialog', { name: '중간점검 완료' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // 6. 다이얼로그에 점검 내용 입력 필드가 있는지 확인
    const noteInput = dialog.getByLabel(/점검 내용/);
    await expect(noteInput).toBeVisible();

    // 7. 취소 버튼 클릭 시 다이얼로그가 닫히는지 확인
    const cancelButton = dialog.getByRole('button', { name: '취소' });
    await cancelButton.click();

    await expect(dialog).not.toBeVisible();
  });

  test('5.2. 중간점검 완료 처리 후 해당 항목의 상태가 업데이트된다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 목록 페이지 이동
    await page.goto('/calibration');

    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible({ timeout: 15000 });

    // 2. 중간점검 탭 클릭
    await page.getByRole('tab', { name: /중간점검/ }).click();

    // Wait for tab content to load
    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });

    // 3. 중간점검 항목이 있는지 확인
    const completeButtons = page.getByRole('button', { name: '완료' });
    const count = await completeButtons.count();

    if (count === 0) {
      test.skip(true, '중간점검 항목이 없습니다');
      return;
    }

    // 4. 첫 번째 '완료' 버튼 클릭
    await completeButtons.first().click();

    // 5. 확인 다이얼로그에서 점검 내용 입력
    const dialog = page.getByRole('dialog', { name: '중간점검 완료' });
    await expect(dialog).toBeVisible({ timeout: 5000 });

    const noteInput = dialog.getByLabel(/점검 내용/);
    await noteInput.fill('중간점검 완료 - E2E 테스트');

    // 6. '완료 처리' 확인 버튼 클릭
    const confirmButton = dialog.getByRole('button', { name: '완료 처리' });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    // 7. 성공 토스트 — 시각 토스트(li[role="status"])만 매칭하여 다이얼로그 헤딩과 충돌 회피
    await expectToastVisible(page, '중간점검이 완료 처리되었습니다.', { timeout: 10000 });

    // 8. 다이얼로그가 닫히는지 확인
    await expect(dialog).not.toBeVisible({ timeout: 5000 });

    // 9. Note: 중간점검 완료 시 항목이 목록에서 사라지지 않고 다음 6개월 후로 재스케줄됨
    // Backend completeIntermediateCheck sets intermediateCheckDate to +6 months
    // 따라서 count 감소를 검증하는 대신 toast 메시지로 성공 확인
  });

  test('5.3. 중간점검 상태 배지가 D-day에 따라 올바른 색상으로 표시된다', async ({
    techManagerPage: page,
  }) => {
    // 1. 교정 목록 페이지 이동
    await page.goto('/calibration');

    await expect(page.getByRole('heading', { name: '교정 관리' })).toBeVisible({ timeout: 15000 });

    // 2. 중간점검 탭 클릭
    await page.getByRole('tab', { name: /중간점검/ }).click();

    // Wait for tab content to load
    const tableOrEmpty = page.locator('table, .text-center');
    await expect(tableOrEmpty.first()).toBeVisible({ timeout: 10000 });

    // 3. 중간점검 테이블의 상태 배지 확인
    // The badges are rendered as <Badge className={style.badge}>{style.text}</Badge>
    // inside the table's "상태" column with text like "N일 초과", "오늘", "D-N"
    const statusColumn = page.locator('table tbody tr td:first-child');
    const rowCount = await statusColumn.count();

    if (rowCount === 0) {
      test.skip(true, '중간점검 항목이 없습니다');
      return;
    }

    // 각 행의 상태 배지를 검증
    for (let i = 0; i < Math.min(rowCount, 5); i++) {
      const cell = statusColumn.nth(i);
      const badge = cell.locator('.inline-flex, [class*="badge"]').first();
      const badgeVisible = await badge.isVisible().catch(() => false);

      if (!badgeVisible) continue;

      const badgeText = await badge.textContent();
      if (!badgeText) continue;

      // 4. 기한 초과 항목: 빨간색 배지 (bg-red-100) "N일 초과"
      if (badgeText.includes('초과')) {
        await expect(badge).toHaveClass(/red/);
      }
      // 5. 오늘 예정 항목: 주황색 배지 (bg-orange-100) "오늘"
      else if (badgeText.includes('오늘')) {
        await expect(badge).toHaveClass(/orange/);
      }
      // 6. 7일 이내 항목: 노란색 배지 (bg-yellow-100) "D-N"
      else if (badgeText.match(/D-[1-7]$/)) {
        await expect(badge).toHaveClass(/yellow/);
      }
      // 7. 7일 초과 항목: 파란색 배지 (bg-blue-100) "D-N"
      else if (badgeText.match(/D-\d+/) && !badgeText.match(/D-[1-7]$/)) {
        await expect(badge).toHaveClass(/blue/);
      }
    }
  });
});
