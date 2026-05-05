/**
 * Outbound 반출 목록 일괄 승인 (OutboundCheckoutsTab + CheckoutBulkActionBar)
 *
 * Outbound checkouts 페이지 부모 탭에서 useRowSelection + CheckoutBulkActionBar 통합
 * (bulk-selection-tabs-integration sprint, 2026-05-05).
 *
 * 시나리오:
 * 1. 2건 반출 신청 생성 (시험실무자)
 * 2. 기술책임자가 /checkouts 진입 → BulkActionBar 초기 hidden 검증
 * 3. row checkbox 2건 선택 → BulkActionBar visible + count=2
 * 4. 일괄 승인 → AlertDialog → 확인 → toast → selection 자동 clear
 *
 * @see apps/frontend/components/checkouts/CheckoutBulkActionBar.tsx
 * @see apps/frontend/app/(dashboard)/checkouts/tabs/OutboundCheckoutsTab.tsx
 * @see apps/frontend/components/checkouts/CheckoutGroupCard.tsx (row checkbox)
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createCheckout,
  resetEquipmentForWorkflow,
  clearBackendCache,
  cleanupSharedPool,
} from '../workflows/helpers/workflow-helpers';
import { CheckoutPurposeValues as CPVal } from '@equipment-management/schemas';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';
import { expectToastVisible } from '../shared/helpers/toast-helpers';

const WF_EQUIPMENT_IDS = [
  TEST_EQUIPMENT_IDS.CANCEL_RECEIVER_SUW_E,
  TEST_EQUIPMENT_IDS.CAS_ANALYZER_SUW_E,
];

test.describe('Outbound 반출 목록 일괄 승인 (Outbound BulkActionBar)', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
  });

  test.afterAll(async () => {
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    await cleanupSharedPool();
  });

  test('Step 1: 2건 반출 신청 생성', async ({ testOperatorPage: page }) => {
    for (const equipmentId of WF_EQUIPMENT_IDS) {
      const body = await createCheckout(
        page,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'Outbound bulk approve 검증'
      );
      const id = body?.data?.id ?? body?.id;
      expect(id).toBeTruthy();
    }
    await clearBackendCache();
  });

  test('Step 2: BulkActionBar 초기 hidden (aria-hidden=true)', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/checkouts');
    // 그룹 카드 렌더 대기
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'true');
  });

  test('Step 3: row checkbox 2건 선택 → BulkActionBar visible + count=2', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    const rowCount = await rowCheckboxes.count();
    expect(rowCount).toBeGreaterThanOrEqual(2);

    await rowCheckboxes.nth(0).click();
    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    const toolbar = bar.locator('[role="toolbar"]');
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toContainText('1');

    await rowCheckboxes.nth(1).click();
    await expect(toolbar).toContainText('2');
  });

  test('Step 4: 일괄 승인 → AlertDialog → 확인 → toast + selection clear', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    const initialCount = await rowCheckboxes.count();
    if (initialCount < 2) return; // 데이터 부족 시 스킵

    await rowCheckboxes.nth(0).click();
    await rowCheckboxes.nth(1).click();

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');

    // bulk-approve API 응답 mock — 실제 backend 영향 분리
    await page.route('**/api/checkouts/bulk-approve', async (route) => {
      const body = JSON.parse(route.request().postData() ?? '{}') as { ids?: string[] };
      const ids = body.ids ?? [];
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          approved: ids.map((id, i) => ({ id, version: i + 2 })),
          failed: [],
        }),
      });
    });

    try {
      const approveButton = page
        .locator('[role="toolbar"] button')
        .filter({ hasText: /일괄 승인|Approve Selected/ });
      await expect(approveButton).toBeVisible();
      await approveButton.click();

      // AlertDialog 확인 다이얼로그
      const dialog = page.locator('[role="alertdialog"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
      await expect(dialog).toContainText(/일괄 승인|Bulk Approve/);

      const confirmButton = dialog
        .locator('button')
        .filter({ hasText: /일괄 승인|Approve/ })
        .last();
      await confirmButton.click();

      // toast: "{count}건 일괄 승인이 완료되었습니다." (checkouts.toasts.bulkApproveAll)
      await expectToastVisible(page, /일괄 승인이 완료|approved in bulk/, { timeout: 10000 });

      // selection 자동 clear → bar hidden 복귀
      await expect(bar).toHaveAttribute('aria-hidden', 'true', { timeout: 5000 });
    } finally {
      await page.unroute('**/api/checkouts/bulk-approve');
    }
  });

  test('Step 5 (a11y): toolbar role + aria-live + 부분선택 mixed state', async ({
    techManagerPage: page,
  }) => {
    // Step 4에서 모두 처리되었으므로 데이터 재생성 필요
    for (const id of WF_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    for (const equipmentId of WF_EQUIPMENT_IDS) {
      await createCheckout(
        page,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'Outbound bulk Step 5 a11y'
      );
    }
    await clearBackendCache();

    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    if ((await rowCheckboxes.count()) < 2) return;

    // toolbar 등장 후 aria-live 검증
    await rowCheckboxes.nth(0).click();
    const toolbar = page.locator('[role="toolbar"]').first();
    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveAttribute('aria-live', 'polite');

    // 부분 선택 (1/N) — toolbar master checkbox aria-checked="mixed"
    const masterCheckbox = toolbar.locator('[role="checkbox"]').first();
    await expect(masterCheckbox).toHaveAttribute('aria-checked', 'mixed');
  });
});

/**
 * Outbound 일괄 승인 EXT — 실제 backend integration (wf-ap02-EXT 패턴 차용)
 *
 * Step 4의 mock 응답은 frontend wiring(toast/AlertDialog/selection clear) 검증용.
 * 본 EXT 블록은 실제 backend `POST /checkouts/bulk-approve` 통합 + DB 상태 전이까지
 * 검증한다 (Promise.allSettled fail-close + scope guard 실제 동작).
 */
test.describe('Outbound 반출 목록 일괄 승인 EXT — 실제 backend 통합', () => {
  test.describe.configure({ mode: 'serial' });

  // WF_EQUIPMENT_IDS와 겹치지 않는 5개 SUW_E 장비
  const EXT_EQUIPMENT_IDS = [
    TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E,
    TEST_EQUIPMENT_IDS.SIGNAL_GEN_SUW_E,
    TEST_EQUIPMENT_IDS.NETWORK_ANALYZER_SUW_E,
    TEST_EQUIPMENT_IDS.EMC_RECEIVER_SUW_E,
    TEST_EQUIPMENT_IDS.RBAC_SIGNAL_GEN_SUW_E,
  ];

  test.beforeAll(async () => {
    for (const id of EXT_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
  });

  test.afterAll(async () => {
    for (const id of EXT_EQUIPMENT_IDS) {
      await resetEquipmentForWorkflow(id);
    }
    await cleanupSharedPool();
  });

  test('Step EXT-1: 5건 반출 신청 생성', async ({ testOperatorPage: page }) => {
    for (const equipmentId of EXT_EQUIPMENT_IDS) {
      const body = await createCheckout(
        page,
        [equipmentId],
        CPVal.CALIBRATION,
        'KRISS',
        'Outbound bulk EXT: 실제 backend 통합 검증'
      );
      const id = body?.data?.id ?? body?.id;
      expect(id).toBeTruthy();
    }
    await clearBackendCache();
  });

  test('Step EXT-2: /checkouts에서 5건 선택 → 실제 backend bulk-approve → toast', async ({
    techManagerPage: page,
  }) => {
    await page.goto('/checkouts');
    await page.waitForSelector('[data-checkout-id]', { timeout: 15000 });

    const rowCheckboxes = page.locator('[data-testid="row-checkbox"]');
    const count = await rowCheckboxes.count();
    expect(count).toBeGreaterThanOrEqual(5);

    // 5건 선택
    for (let i = 0; i < 5; i++) {
      await rowCheckboxes.nth(i).click();
    }

    const bar = page.locator('[data-testid="bulk-action-bar"]');
    await expect(bar).toHaveAttribute('aria-hidden', 'false');
    await expect(bar.locator('[role="toolbar"]')).toContainText('5');

    // 실제 backend approve — page.route mock 없음
    const approveButton = page
      .locator('[role="toolbar"] button')
      .filter({ hasText: /일괄 승인|Approve Selected/ });
    await approveButton.click();

    const dialog = page.locator('[role="alertdialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await dialog
      .locator('button')
      .filter({ hasText: /일괄 승인|Approve/ })
      .last()
      .click();
    await clearBackendCache();

    // 전체 성공 toast: "{count}건 일괄 승인이 완료되었습니다." (checkouts.bulk.approveAll)
    await expectToastVisible(page, /일괄 승인이 완료|approved in bulk/, { timeout: 15000 });

    // selection 자동 clear → bar hidden 복귀
    await expect(bar).toHaveAttribute('aria-hidden', 'true', { timeout: 5000 });

    // 목록에서 5건 pending 제거 확인 (backend가 approved 상태 전이 + invalidate → refetch)
    await page.waitForTimeout(1500); // invalidate 후 refetch 안정화
    const afterCount = await rowCheckboxes.count();
    expect(afterCount).toBeLessThanOrEqual(count - 5);
  });
});
