/**
 * WF-14: 소프트웨어 변경 승인 ★P3
 *
 * 측정/분석 소프트웨어 변경 신청 → 기술책임자 승인.
 *
 * @see docs/workflows/critical-workflows.md WF-14
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createSoftwareChangeRequest,
  approveSoftwareChange,
  extractId,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.SPECTRUM_ANALYZER_SUW_E;

test.describe('WF-14: 소프트웨어 변경 승인', () => {
  test.describe.configure({ mode: 'serial' });

  let softwareId: string;

  test.afterAll(async () => {
    await cleanupSharedPool();
  });

  test('Step 1: TE가 소프트웨어 변경 신청', async ({ testOperatorPage: page }) => {
    const body = await createSoftwareChangeRequest(page, WF_EQUIPMENT_ID);
    softwareId = extractId(body);
    expect(softwareId).toBeTruthy();
  });

  test('Step 2: TM이 변경 승인', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await approveSoftwareChange(page, softwareId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.approvalStatus).toBe('approved');
  });
});
