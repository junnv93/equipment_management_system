/**
 * WF-20: 자체점검 결재 워크플로우 (UL-QP-18-05) ★P3
 *
 * 워크플로우: draft → submitted(TE) → approved(TM)
 *              submitted → rejected(TM) → resubmit(TE) → draft
 * 역할 기반 권한:
 *   - SUBMIT_SELF_INSPECTION: TE (생성/수정/제출/취소/재제출)
 *   - APPROVE_SELF_INSPECTION: TM (승인)
 *   - REJECT_SELF_INSPECTION: TM (반려)
 *
 * @see docs/workflows/critical-workflows.md WF-20
 */

import { test, expect } from '../shared/fixtures/auth.fixture';
import {
  createSelfInspection,
  updateSelfInspection,
  submitSelfInspection,
  approveSelfInspection,
  rejectSelfInspection,
  deleteSelfInspection,
  extractId,
  extractVersion,
  apiGet,
  apiPatch,
  resetSelfInspections,
  clearBackendCache,
  cleanupSharedPool,
} from './helpers/workflow-helpers';
import { TEST_EQUIPMENT_IDS } from '../shared/constants/shared-test-data';

/** WF-20 전용 — TRANSMITTER_UIW_W (다른 WF 미사용) */
const WF_EQUIPMENT_ID = TEST_EQUIPMENT_IDS.TRANSMITTER_UIW_W;

const today = new Date().toISOString().split('T')[0];

test.describe('WF-20: 자체점검 결재 워크플로우 (draft → submitted → approved)', () => {
  test.describe.configure({ mode: 'serial' });

  let inspectionId: string;

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE가 자체점검 생성 — draft 상태', async ({ testOperatorPage: page }) => {
    const body = await createSelfInspection(page, WF_EQUIPMENT_ID, {
      inspectionDate: today,
      items: [
        { itemNumber: 1, checkItem: '외관검사', checkResult: 'pass' },
        { itemNumber: 2, checkItem: '출력 특성 점검', checkResult: 'pass' },
        { itemNumber: 3, checkItem: '안전 점검', checkResult: 'pass' },
        { itemNumber: 4, checkItem: '기능 점검', checkResult: 'pass' },
      ],
      overallResult: 'pass',
      inspectionCycle: 6,
    });
    inspectionId = extractId(body);

    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.approvalStatus).toBe('draft');
    // items 배열 반환 검증
    const items = (data.items as Array<Record<string, unknown>>) ?? [];
    expect(items.length).toBe(4);
  });

  test('Step 2: nextInspectionDate 자동 산출 검증', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const resp = await apiGet(page, `/api/self-inspections/${inspectionId}`, 'test_engineer');
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.nextInspectionDate).toBeTruthy();
    // 6개월 후 날짜 범위 확인 (대략적)
    const next = new Date(data.nextInspectionDate as string);
    const expected = new Date(today);
    expected.setMonth(expected.getMonth() + 6);
    const diffDays = Math.abs(next.getTime() - expected.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeLessThan(3); // 월말 보정 고려 ±3일
  });

  test('Step 3: TE가 수정 (remarks 추가) — draft 상태에서만 가능', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const body = await updateSelfInspection(page, inspectionId, {
      remarks: 'WF-20: 모든 항목 양호, 특이사항 없음',
    });
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(Number(data.version)).toBeGreaterThanOrEqual(2);
  });

  test('Step 4: TE가 제출 → submitted', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const body = await submitSelfInspection(page, inspectionId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.approvalStatus).toBe('submitted');
    expect(data.submittedBy).toBeTruthy();
    expect(data.submittedAt).toBeTruthy();
  });

  test('Step 5: submitted 상태에서 수정 시도 → 400 에러', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const detailResp = await apiGet(page, `/api/self-inspections/${inspectionId}`, 'test_engineer');
    const detail = await detailResp.json();
    const version = extractVersion(detail);

    const resp = await apiPatch(
      page,
      `/api/self-inspections/${inspectionId}`,
      { version, remarks: '수정 시도' },
      'test_engineer'
    );
    expect(resp.status()).toBe(400);
  });

  test('Step 6: TM이 승인 → approved', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await approveSelfInspection(page, inspectionId);
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.approvalStatus).toBe('approved');
    expect(data.approvedBy).toBeTruthy();
    expect(data.approvedAt).toBeTruthy();
  });

  test('Step 7: approved 후 삭제 시도 → 400 에러 (기본 권한)', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const resp = await deleteSelfInspection(page, inspectionId);
    expect(resp.status()).toBe(400);
  });

  test('Step 8: 권한 테스트 — TE가 approve 시도 → 403', async ({ testOperatorPage: page }) => {
    // 새 점검 생성 → 제출
    const newBody = await createSelfInspection(page, WF_EQUIPMENT_ID, {
      inspectionDate: today,
      items: [
        { itemNumber: 1, checkItem: '외관검사', checkResult: 'pass' },
        { itemNumber: 2, checkItem: '기능 점검', checkResult: 'fail' },
        { itemNumber: 3, checkItem: '안전 점검', checkResult: 'pass' },
      ],
      overallResult: 'fail',
    });
    const newId = extractId(newBody);
    // 먼저 제출 (draft → submitted)
    await submitSelfInspection(page, newId);

    // TE가 approve 시도 → 권한 부족
    const detailResp = await apiGet(page, `/api/self-inspections/${newId}`, 'test_engineer');
    const detail = await detailResp.json();
    const version = extractVersion(detail);
    const resp = await apiPatch(
      page,
      `/api/self-inspections/${newId}/approve`,
      { version },
      'test_engineer'
    );
    expect(resp.status()).toBe(403);
  });
});

test.describe('WF-20: 반려 워크플로우 (submitted → rejected → draft)', () => {
  test.describe.configure({ mode: 'serial' });

  let rejectedId: string;

  test.beforeAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
  });

  test.afterAll(async () => {
    await resetSelfInspections(WF_EQUIPMENT_ID);
    await cleanupSharedPool();
  });

  test('Step 1: TE 생성 + 제출', async ({ testOperatorPage: page }) => {
    const body = await createSelfInspection(page, WF_EQUIPMENT_ID, {
      inspectionDate: today,
      items: [{ itemNumber: 1, checkItem: '외관검사', checkResult: 'pass' }],
      overallResult: 'pass',
    });
    rejectedId = extractId(body);
    await submitSelfInspection(page, rejectedId);
  });

  test('Step 2: TM이 반려 (rejectionReason 필수)', async ({ techManagerPage: page }) => {
    await clearBackendCache();
    const body = await rejectSelfInspection(page, rejectedId, '점검 항목 누락');
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.approvalStatus).toBe('rejected');
    expect(data.rejectionReason).toBe('점검 항목 누락');
  });

  test('Step 3: TE가 rejected 상태에서 수정 시도 → 400 에러', async ({
    testOperatorPage: page,
  }) => {
    await clearBackendCache();
    const detailResp = await apiGet(page, `/api/self-inspections/${rejectedId}`, 'test_engineer');
    const detail = await detailResp.json();
    const version = extractVersion(detail);
    const resp = await apiPatch(
      page,
      `/api/self-inspections/${rejectedId}`,
      { version, remarks: '수정 시도' },
      'test_engineer'
    );
    expect(resp.status()).toBe(400);
  });

  test('Step 4: TE가 resubmit → draft (반려 사유 초기화)', async ({ testOperatorPage: page }) => {
    await clearBackendCache();
    const detailResp = await apiGet(page, `/api/self-inspections/${rejectedId}`, 'test_engineer');
    const detail = await detailResp.json();
    const version = extractVersion(detail);
    const resp = await apiPatch(
      page,
      `/api/self-inspections/${rejectedId}/resubmit`,
      { version },
      'test_engineer'
    );
    expect(resp.ok()).toBeTruthy();
    const body = await resp.json();
    const data = (body.data ?? body) as Record<string, unknown>;
    expect(data.approvalStatus).toBe('draft');
    expect(data.rejectionReason).toBeNull();
  });
});
