/**
 * WF-12: 장비 폐기 2단계 승인 ★P1
 *
 * 폐기 신청 → 기술책임자 검토 → 시험소장 최종 승인 → 장비 disposed.
 *
 * @see docs/workflows/critical-workflows.md WF-12
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';
import {
  requestDisposal,
  reviewDisposal,
  approveDisposal,
  expectEquipmentStatus,
  resetDisposalAndEquipment,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_DISPOSAL_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** 워크플로우 전용 — WORKFLOW_B1 (폐기 테스트 전용 장비) */
const WF_EQUIPMENT_ID = TEST_DISPOSAL_EQUIPMENT_IDS.WORKFLOW_B1;

test.describe('WF-12: 장비 폐기 2단계 승인', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeAll(async () => {
    await resetDisposalAndEquipment(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetDisposalAndEquipment(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 폐기 신청 → pending_disposal', async ({ testOperatorPage: page }) => {
    await requestDisposal(
      page,
      WF_EQUIPMENT_ID,
      'obsolete',
      'WF-12 테스트: 노후화로 인한 폐기 신청, 정확도 저하 심각'
    );

    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.PENDING_DISPOSAL);
  });

  test('Step 2: TM이 검토 완료 → reviewed', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    await reviewDisposal(page, WF_EQUIPMENT_ID, 'approve', 'WF-12: 노후화 확인, 폐기 적합');
  });

  test('Step 3: LM이 최종 승인 → disposed', async ({ siteAdminPage: page }) => {
    await clearBackendCache();
    await approveDisposal(page, WF_EQUIPMENT_ID, 'approve', 'WF-12: 최종 폐기 승인');

    // ★ 장비 disposed
    await clearBackendCache();
    await expectEquipmentStatus(page, WF_EQUIPMENT_ID, ESVal.DISPOSED, 'lab_manager');
  });

  test('Step 4: UI에서 폐기 상태 확인', async ({ testOperatorPage: page }) => {
    await page.goto(`/equipment/${WF_EQUIPMENT_ID}`);
    await expect(page.getByText('폐기').first()).toBeVisible({ timeout: 10000 });
  });
});
