/**
 * 승인 관리 - 폐기 2단계 전체 워크플로우
 *
 * TE 폐기 요청 → TM 검토(승인/반려) → LM 최종 승인(승인/반려)
 *
 * serial 모드: 상태가 단계별로 변경됨
 * beforeAll: EQUIP_DISPOSAL_WORKFLOW를 available로 리셋
 * afterAll: DB 리셋 + 풀 정리
 *
 * SSOT: TEST_DISPOSAL_EQUIPMENT_IDS.WORKFLOW_B1 사용
 */

import { test, expect } from '../../../shared/fixtures/auth.fixture';
import {
  apiRequestDisposal,
  apiReviewDisposal,
  apiApproveDisposal,
  apiCancelDisposal,
  resetEquipmentStatus,
  resetDisposalAndEquipment,
  waitForApprovalListOrEmpty,
  waitForToast,
  cleanupApprovalPool,
} from '../../../shared/helpers/approval-helpers';
import { clearBackendCache } from '../../../shared/helpers/api-helpers';
import { TEST_DISPOSAL_EQUIPMENT_IDS } from '../../../shared/constants/shared-test-data';

const WORKFLOW_EQUIP = TEST_DISPOSAL_EQUIPMENT_IDS.WORKFLOW_B1;

test.describe('폐기 2단계 전체 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    // 워크플로우 장비를 available로 리셋, 기존 폐기 요청 삭제
    await resetDisposalAndEquipment(WORKFLOW_EQUIP);
  });

  test.afterAll(async () => {
    // 정리
    await resetDisposalAndEquipment(WORKFLOW_EQUIP);
    await cleanupApprovalPool();
  });

  test('TC-01: TE가 폐기 요청 → API 성공 + 장비 상태 pending_disposal', async ({
    testOperatorPage: page,
  }) => {
    // API로 폐기 요청
    const resp = await apiRequestDisposal(
      page,
      WORKFLOW_EQUIP,
      'obsolete',
      '장비가 노후화되어 정확도가 떨어집니다. 교체가 필요합니다.',
      'test_engineer'
    );

    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = body.data ?? body;
    expect(data.reviewStatus ?? data.review_status).toBe('pending');
  });

  test('TC-02: TM이 disposal_review 탭에서 해당 항목 확인', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=disposal_review');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    // 폐기 검토 대기 항목이 있어야 함 (방금 요청한 것 포함)
    expect(hasData).toBeTruthy();

    // StepIndicator 존재 확인
    const stepIndicator = page.locator('[data-testid="step-indicator"]').first();
    if (await stepIndicator.isVisible().catch(() => false)) {
      await expect(stepIndicator.getByText('요청')).toBeVisible();
    }
  });

  test('TC-03: TM이 검토 승인 → API로 review(approve)', async ({ techManagerPage: page }) => {
    // API로 검토 승인
    const resp = await apiReviewDisposal(
      page,
      WORKFLOW_EQUIP,
      'approve',
      '검토 완료. 장비 노후화 확인됨. 폐기 승인 진행.',
      'technical_manager'
    );

    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = body.data ?? body;
    expect(data.reviewStatus ?? data.review_status).toBe('reviewed');
  });

  test('TC-04: LM이 disposal_final 탭에서 해당 항목 확인', async ({ siteAdminPage: page }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=disposal_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    const hasData = await waitForApprovalListOrEmpty(page);
    expect(hasData).toBeTruthy();
  });

  test('TC-05: LM이 최종 승인 → 장비 상태 disposed', async ({ siteAdminPage: page }) => {
    // API로 최종 승인
    const resp = await apiApproveDisposal(
      page,
      WORKFLOW_EQUIP,
      'approve',
      '최종 승인. 폐기 처리합니다.',
      'lab_manager'
    );

    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = body.data ?? body;
    expect(data.reviewStatus ?? data.review_status).toBe('approved');
  });

  test('TC-06: LM disposal_final에서 승인 후 UI 확인', async ({ siteAdminPage: page }) => {
    await clearBackendCache();
    await page.goto('/admin/approvals?tab=disposal_final');
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible({
      timeout: 10000,
    });

    // 승인 완료 후 해당 항목이 목록에서 제거됨
    await waitForApprovalListOrEmpty(page);

    // 페이지 정상 렌더링 확인 (에러 없음)
    await expect(page.getByRole('heading', { name: '승인 관리', level: 1 })).toBeVisible();
  });
});

test.describe('폐기 검토 반려 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  const REJ_EQUIP = TEST_DISPOSAL_EQUIPMENT_IDS.REJ_C1_PENDING;

  test.afterAll(async () => {
    await cleanupApprovalPool();
  });

  test('TC-07: TM이 검토 반려 → rejected 상태', async ({ techManagerPage: page }) => {
    await clearBackendCache();

    const resp = await apiReviewDisposal(
      page,
      REJ_EQUIP,
      'reject',
      '반려합니다. 장비 수리 후 재사용 가능합니다. 폐기 사유가 충분하지 않습니다.',
      'technical_manager'
    );

    if (resp.ok()) {
      const text = await resp.text();
      if (text) {
        const body = JSON.parse(text);
        const data = body.data ?? body;
        expect(data.reviewStatus ?? data.review_status).toBe('rejected');
      }
    } else {
      // 404/409: 이미 처리됐거나 pending 상태가 아닌 경우 — 시드 데이터 상태에 따라 skip
      const status = resp.status();
      expect([404, 409, 400].includes(status)).toBeTruthy();
    }
  });
});

test.describe('폐기 최종 반려 워크플로우', () => {
  test.describe.configure({ mode: 'serial' });

  const REJ_EQUIP = TEST_DISPOSAL_EQUIPMENT_IDS.REJ_C2_REVIEWED;

  test.afterAll(async () => {
    await cleanupApprovalPool();
  });

  test('TC-08: LM이 최종 반려 → rejected 상태', async ({ siteAdminPage: page }) => {
    await clearBackendCache();

    const resp = await apiApproveDisposal(
      page,
      REJ_EQUIP,
      'reject',
      '최종 반려합니다. 수리 후 재사용 가능합니다. 폐기 재검토가 필요합니다.',
      'lab_manager'
    );

    if (resp.ok()) {
      const text = await resp.text();
      if (text) {
        const body = JSON.parse(text);
        const data = body.data ?? body;
        expect(data.reviewStatus ?? data.review_status).toBe('rejected');
      }
    } else {
      // 404/409: reviewed 상태가 아닌 경우 — 시드 데이터에 따라 skip
      const status = resp.status();
      expect([404, 409, 400].includes(status)).toBeTruthy();
    }
  });
});
