/**
 * E2E — CheckoutGroupCard 헤더 indeterminate 격리 검증 (Sprint 4.5 S3, TR-5 v2)
 *
 * 부모 통합(OutboundCheckoutsTab/InboundCheckoutsTab)이 선행되어야 하는 시나리오를
 * 격리 fixture page로 대체하여, 헤더 체크박스 3-state 동작을 런타임에서 증명한다.
 *
 * Fixture: app/(dashboard)/__visual__/group-indeterminate/page.tsx (dev-only)
 *
 * 실행:
 *   pnpm --filter frontend exec playwright test group-indeterminate --project=chromium
 *
 * Auth: storageState (test-engineer) — fixture page는 dashboard 그룹 내부라 인증 의존.
 */

import { test, expect } from '@playwright/test';
import path from 'node:path';

const AUTH_DIR = path.join(__dirname, '../../.auth');
const FIXTURE_PATH = '/__visual__/group-indeterminate';

test.use({
  storageState: path.join(AUTH_DIR, 'test-engineer.json'),
});

test.describe('CheckoutGroupCard 헤더 indeterminate', () => {
  test('A. 진입 직후 미선택 → 헤더 data-state=unchecked, aria-checked=false', async ({ page }) => {
    await page.goto(FIXTURE_PATH);
    const header = page.getByTestId('group-header-checkbox');
    await expect(header).toBeVisible();
    await expect(header).toHaveAttribute('data-state', 'unchecked');
    await expect(header).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('selected-count')).toHaveAttribute('data-count', '0');
  });

  test('B. 일부 선택 → 헤더 data-state=indeterminate, aria-checked=mixed', async ({ page }) => {
    await page.goto(FIXTURE_PATH);
    await page.getByTestId('toggle-row-fixture-c1').click();
    const header = page.getByTestId('group-header-checkbox');
    await expect(header).toHaveAttribute('data-state', 'indeterminate');
    await expect(header).toHaveAttribute('aria-checked', 'mixed');
    await expect(page.getByTestId('selected-count')).toHaveAttribute('data-count', '1');
  });

  test('C. 헤더 토글 사이클 (none → all → none)', async ({ page }) => {
    await page.goto(FIXTURE_PATH);
    const header = page.getByTestId('group-header-checkbox');

    // 초기: 미선택
    await expect(page.getByTestId('selected-count')).toHaveAttribute('data-count', '0');

    // 1차 클릭: 전체 선택
    await header.click();
    await expect(header).toHaveAttribute('data-state', 'checked');
    await expect(header).toHaveAttribute('aria-checked', 'true');
    await expect(page.getByTestId('selected-count')).toHaveAttribute('data-count', '3');

    // 2차 클릭: 전체 해제
    await header.click();
    await expect(header).toHaveAttribute('data-state', 'unchecked');
    await expect(header).toHaveAttribute('aria-checked', 'false');
    await expect(page.getByTestId('selected-count')).toHaveAttribute('data-count', '0');
  });
});
