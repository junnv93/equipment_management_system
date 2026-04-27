/**
 * AP-02: BulkActionBar Floating Sticky — 가시성·접근성·Esc 핸들러
 *
 * 검증:
 * - 선택 0건 → bar 시각적 숨김 (aria-hidden="true")
 * - 선택 ≥1건 → bar 표시 + 카운트 chip
 * - × 선택 해제 버튼 클릭 → bar 다시 숨김
 * - data-testid="bulk-action-bar" 존재
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';

const APPROVALS_PAGE = '/admin/approvals';

test.describe('BulkActionBar Floating Sticky (AP-02)', () => {
  test.beforeEach(async ({}, testInfo) => {
    if (testInfo.project.name !== 'chromium') {
      test.skip();
    }
  });

  test('선택 0건 상태에서 bulk bar는 시각적으로 숨겨진다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    const bar = labManagerPage.getByTestId('bulk-action-bar');
    await expect(bar).toBeAttached();
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  test('승인 항목 선택 시 bulk bar가 표시되고 카운트 chip이 업데이트된다', async ({
    labManagerPage,
  }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    const items = labManagerPage.locator('[data-testid="approval-item"]');
    const itemCount = await items.count();
    if (itemCount === 0) {
      test.skip();
      return;
    }

    // 첫 번째 항목 체크박스 클릭
    const firstCheckbox = items.first().locator('input[type="checkbox"]').first();
    await firstCheckbox.click();

    const bar = labManagerPage.getByTestId('bulk-action-bar');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    const countChip = labManagerPage.getByTestId('bulk-selection-count');
    await expect(countChip).toBeVisible();
    const chipText = await countChip.textContent();
    expect(chipText).toContain('1');
  });

  test('선택 해제 버튼 클릭 시 bar가 다시 숨겨진다', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    const items = labManagerPage.locator('[data-testid="approval-item"]');
    const itemCount = await items.count();
    if (itemCount === 0) {
      test.skip();
      return;
    }

    // 선택
    const firstCheckbox = items.first().locator('input[type="checkbox"]').first();
    await firstCheckbox.click();

    // bar 표시 확인
    const bar = labManagerPage.getByTestId('bulk-action-bar');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    // × 선택 해제 클릭
    await bar.locator('button[aria-label]').first().click();

    // bar 숨김 확인
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  test('bulk bar는 DOM에 항상 존재한다 (스크린리더 접근성)', async ({ labManagerPage }) => {
    await labManagerPage.goto(APPROVALS_PAGE);
    await labManagerPage.waitForLoadState('networkidle');

    // fixed bar는 항상 DOM에 존재 (return null 패턴 폐기)
    await expect(labManagerPage.getByTestId('bulk-action-bar')).toBeAttached();
  });
});
