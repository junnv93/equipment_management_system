/**
 * Workflow E2E Test Helpers
 *
 * 크로스 기능 워크플로우 테스트를 위한 API 호출 + DB 리셋 유틸리티.
 * 개별 기능 테스트와 달리 여러 모듈의 API를 순차적으로 호출하며,
 * 각 단계 간 상태 전이와 부수 효과를 검증한다.
 *
 * @see docs/workflows/critical-workflows.md - 워크플로우 체크리스트
 */

import { Page, expect } from '@playwright/test';
import { EquipmentStatusValues as ESVal } from '@equipment-management/schemas';
import {
  getBackendToken,
  clearBackendCache,
  getSharedPool,
  cleanupSharedPool,
} from '../../shared/helpers/api-helpers';
import { BASE_URLS } from '../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

// ============================================================================
// Generic API Helpers
// ============================================================================

export async function apiGet(page: Page, path: string, role: string) {
  const token = await getBackendToken(page, role);
  return page.request.get(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function apiPost(
  page: Page,
  path: string,
  data: Record<string, unknown>,
  role: string
) {
  const token = await getBackendToken(page, role);
  return page.request.post(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data,
  });
}

export async function apiPatch(
  page: Page,
  path: string,
  data: Record<string, unknown>,
  role: string
) {
  const token = await getBackendToken(page, role);
  return page.request.patch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data,
  });
}

/** 응답 body에서 version(또는 casVersion) 추출 */
export function extractVersion(body: Record<string, unknown>): number {
  const data = (body.data ?? body) as Record<string, unknown>;
  const version = data.version ?? data.casVersion;
  if (typeof version !== 'number') {
    throw new Error(`version 필드 없음: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return version;
}

/** 응답 body에서 id 추출 */
export function extractId(body: Record<string, unknown>): string {
  const data = (body.data ?? body) as Record<string, unknown>;
  const id = data.id ?? data.uuid;
  if (typeof id !== 'string') {
    throw new Error(`id 필드 없음: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return id;
}

// ============================================================================
// Checkout Workflow API (반출 → 승인 → 반출시작 → 반입 → 반입승인)
// ============================================================================

/** 반출 신청 (TE) */
export async function createCheckout(
  page: Page,
  equipmentIds: string[],
  purpose: string,
  destination: string,
  reason: string,
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    '/api/checkouts',
    {
      equipmentIds,
      purpose,
      destination,
      reason,
      expectedReturnDate: '2026-12-31T00:00:00.000Z',
    },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 반출 승인 (TM) — CAS-Aware */
export async function approveCheckout(page: Page, checkoutId: string, role = 'technical_manager') {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(page, `/api/checkouts/${checkoutId}/approve`, { version }, role);
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 반출 시작 (TE) — CAS-Aware */
export async function startCheckout(page: Page, checkoutId: string, role = 'test_engineer') {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(page, `/api/checkouts/${checkoutId}/start`, { version }, role);
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 반입 처리 (TE) — CAS-Aware */
export async function returnCheckout(
  page: Page,
  checkoutId: string,
  checks: {
    calibrationChecked?: boolean;
    repairChecked?: boolean;
    workingStatusChecked?: boolean;
  } = {},
  role = 'test_engineer'
) {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/checkouts/${checkoutId}/return`,
    {
      version,
      calibrationChecked: checks.calibrationChecked ?? true,
      repairChecked: checks.repairChecked ?? true,
      workingStatusChecked: checks.workingStatusChecked ?? true,
      inspectionNotes: 'E2E 워크플로우 테스트 반입 검사',
    },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 반입 승인 (TM) — CAS-Aware */
export async function approveReturn(page: Page, checkoutId: string, role = 'technical_manager') {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/checkouts/${checkoutId}/approve-return`,
    { version },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ============================================================================
// Calibration API (교정 기록 등록 → 승인)
// ============================================================================

/** 교정 기록 등록 (TE) */
export async function createCalibration(
  page: Page,
  equipmentId: string,
  calibrationDate: string,
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    '/api/calibration',
    {
      equipmentId,
      calibrationDate,
      calibrationMethod: 'external_calibration',
      calibrationResult: 'pass',
      calibrationAgency: 'KRISS 한국표준과학연구원',
      certificateNumber: `WF-CERT-${Date.now()}`,
      remarks: 'E2E 워크플로우 테스트 교정 기록',
    },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 교정 승인 (TM) — CAS-Aware */
export async function approveCalibration(
  page: Page,
  calibrationId: string,
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/calibration/${calibrationId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/calibration/${calibrationId}/approve`,
    { version, approverComment: 'E2E 워크플로우 테스트 승인' },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ============================================================================
// Non-Conformance API (부적합 생성 → 조치 → 종결)
// ============================================================================

/** 부적합 등록 (TE) */
export async function createNonConformance(
  page: Page,
  equipmentId: string,
  ncType: string,
  cause: string,
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    '/api/non-conformances',
    {
      equipmentId,
      ncType,
      discoveryDate: new Date().toISOString().split('T')[0],
      cause,
    },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 부적합 조치 완료 (TE) — CAS-Aware */
export async function correctNonConformance(
  page: Page,
  ncId: string,
  correction: {
    resolutionType: string;
    correctionContent: string;
    correctionDate: string;
    repairHistoryId?: string;
    calibrationId?: string;
  },
  role = 'test_engineer'
) {
  const detailResp = await apiGet(page, `/api/non-conformances/${ncId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/non-conformances/${ncId}/correct`,
    { version, ...correction },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 부적합 종결 (TM) — CAS-Aware */
export async function closeNonConformance(page: Page, ncId: string, role = 'technical_manager') {
  const detailResp = await apiGet(page, `/api/non-conformances/${ncId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(page, `/api/non-conformances/${ncId}/close`, { version }, role);
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ============================================================================
// Equipment Status Verification
// ============================================================================

/** 장비 상태 확인 */
export async function getEquipmentStatus(
  page: Page,
  equipmentId: string,
  role = 'test_engineer'
): Promise<string> {
  const resp = await apiGet(page, `/api/equipment/${equipmentId}`, role);
  const body = await resp.json();
  const data = (body.data ?? body) as Record<string, unknown>;
  return data.status as string;
}

/** 장비 상태가 기대값인지 단언 */
export async function expectEquipmentStatus(
  page: Page,
  equipmentId: string,
  expectedStatus: string,
  role = 'test_engineer'
) {
  const status = await getEquipmentStatus(page, equipmentId, role);
  expect(status).toBe(expectedStatus);
}

/** 장비 교정일 확인 */
export async function getEquipmentCalibrationDates(
  page: Page,
  equipmentId: string,
  role = 'test_engineer'
): Promise<{ lastCalibrationDate: string | null; nextCalibrationDate: string | null }> {
  const resp = await apiGet(page, `/api/equipment/${equipmentId}`, role);
  const body = await resp.json();
  const data = (body.data ?? body) as Record<string, unknown>;
  return {
    lastCalibrationDate: data.lastCalibrationDate as string | null,
    nextCalibrationDate: data.nextCalibrationDate as string | null,
  };
}

// ============================================================================
// DB Reset (beforeAll/afterAll)
// ============================================================================

/**
 * 장비를 available 상태로 리셋 + 관련 active checkout/NC/calibration 정리.
 * 각 SQL 변경 후 개별 캐시 클리어 — 백엔드 캐시가 중간 상태를 반영하도록 보장.
 */
export async function resetEquipmentForWorkflow(equipmentId: string): Promise<void> {
  const pool = getSharedPool();

  // 1. 동적 생성된 active checkout 취소
  await pool.query(
    `UPDATE checkouts SET status = 'canceled', updated_at = NOW()
     WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
       AND id IN (
         SELECT c.id FROM checkouts c
         JOIN checkout_items ci ON c.id = ci.checkout_id
         WHERE ci.equipment_id = $1
       )
       AND id::text NOT LIKE '10000000-%'`,
    [equipmentId]
  );

  // 2. 동적 생성된 NC 삭제
  await pool.query(
    `UPDATE non_conformances SET deleted_at = NOW()
     WHERE equipment_id = $1
       AND id::text NOT LIKE 'aaaa%'
       AND deleted_at IS NULL`,
    [equipmentId]
  );

  // 3. 동적 생성된 교정 기록 삭제
  await pool.query(
    `UPDATE calibrations SET deleted_at = NOW()
     WHERE equipment_id = $1
       AND id::text NOT LIKE 'bbbb%'
       AND deleted_at IS NULL`,
    [equipmentId]
  );

  // 4. 장비 상태 available로 리셋
  await pool.query(
    `UPDATE equipment SET status = $2, version = 1, updated_at = NOW() WHERE id = $1`,
    [equipmentId, ESVal.AVAILABLE]
  );

  // 모든 DB 변경 완료 후 캐시 클리어 (단일 호출로 충분 — SQL은 동기적 순차 실행)
  await clearBackendCache();
}

// ============================================================================
// Checkout Rejection API
// ============================================================================

/** 반출 반려 (TM) — CAS-Aware */
export async function rejectCheckout(
  page: Page,
  checkoutId: string,
  reason: string,
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/checkouts/${checkoutId}/reject`,
    { version, reason },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 반입 반려 (TM) — CAS-Aware */
export async function rejectReturn(
  page: Page,
  checkoutId: string,
  reason: string,
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/checkouts/${checkoutId}/reject-return`,
    { version, reason },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ============================================================================
// Rental Condition Check API (대여 4단계)
// ============================================================================

/** 대여 상태 확인 (condition-check) */
export async function conditionCheck(
  page: Page,
  checkoutId: string,
  step: 'lender_checkout' | 'borrower_receive' | 'borrower_return' | 'lender_return',
  role: string
) {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPost(
    page,
    `/api/checkouts/${checkoutId}/condition-check`,
    {
      version,
      step,
      appearanceStatus: 'normal',
      operationStatus: 'normal',
      accessoriesStatus: 'complete',
      notes: `WF 테스트: ${step}`,
    },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ============================================================================
// Calibration Plan API (3단계 승인)
// ============================================================================

/** casVersion 추출 (교정계획서 전용) */
export function extractCasVersion(body: Record<string, unknown>): number {
  const data = (body.data ?? body) as Record<string, unknown>;
  const ver = data.casVersion ?? data.version;
  if (typeof ver !== 'number') {
    throw new Error(`casVersion 필드 없음: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return ver;
}

/** 교정계획서 검토 요청 (TM → QM) — CAS-Aware */
export async function submitPlanForReview(page: Page, planId: string, role = 'technical_manager') {
  const resp = await apiGet(page, `/api/calibration-plans/${planId}`, role);
  const body = await resp.json();
  const casVersion = extractCasVersion(body);
  const result = await apiPost(
    page,
    `/api/calibration-plans/${planId}/submit-for-review`,
    { casVersion, memo: 'WF 테스트: 검토 요청' },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

/** 교정계획서 검토 완료 (QM) — CAS-Aware */
export async function reviewCalibrationPlan(page: Page, planId: string, role = 'quality_manager') {
  const resp = await apiGet(page, `/api/calibration-plans/${planId}`, role);
  const body = await resp.json();
  const casVersion = extractCasVersion(body);
  const result = await apiPatch(
    page,
    `/api/calibration-plans/${planId}/review`,
    { casVersion, reviewComment: 'WF 테스트: 검토 완료' },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

/** 교정계획서 최종 승인 (LM) — CAS-Aware */
export async function approveCalibrationPlan(page: Page, planId: string, role = 'lab_manager') {
  const resp = await apiGet(page, `/api/calibration-plans/${planId}`, role);
  const body = await resp.json();
  const casVersion = extractCasVersion(body);
  const result = await apiPatch(
    page,
    `/api/calibration-plans/${planId}/approve`,
    { casVersion },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

/** 교정계획서 반려 (QM or LM) — CAS-Aware */
export async function rejectCalibrationPlan(
  page: Page,
  planId: string,
  rejectionReason: string,
  role = 'quality_manager'
) {
  const resp = await apiGet(page, `/api/calibration-plans/${planId}`, role);
  const body = await resp.json();
  const casVersion = extractCasVersion(body);
  const result = await apiPatch(
    page,
    `/api/calibration-plans/${planId}/reject`,
    { casVersion, rejectionReason },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

// ============================================================================
// Disposal API (2단계 승인)
// ============================================================================

/** 폐기 요청 (TE) */
export async function requestDisposal(
  page: Page,
  equipmentId: string,
  reason: string,
  reasonDetail: string,
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    `/api/equipment/${equipmentId}/disposal/request`,
    { reason, reasonDetail },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 폐기 검토 (TM) — CAS-Aware */
export async function reviewDisposal(
  page: Page,
  equipmentId: string,
  decision: 'approve' | 'reject',
  opinion: string,
  role = 'technical_manager'
) {
  const resp = await apiGet(page, `/api/equipment/${equipmentId}/disposal/current`, role);
  const body = await resp.json();
  const version = extractVersion(body);
  const result = await apiPost(
    page,
    `/api/equipment/${equipmentId}/disposal/review`,
    { version, decision, opinion },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

/** 폐기 최종 승인 (LM) — CAS-Aware */
export async function approveDisposal(
  page: Page,
  equipmentId: string,
  decision: 'approve' | 'reject',
  comment: string,
  role = 'lab_manager'
) {
  const resp = await apiGet(page, `/api/equipment/${equipmentId}/disposal/current`, role);
  const body = await resp.json();
  const version = extractVersion(body);
  const result = await apiPatch(
    page,
    `/api/equipment/${equipmentId}/disposal/approve`,
    { version, decision, comment },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

// ============================================================================
// Equipment Import API (대여 반입)
// ============================================================================

/** 장비 반입 신청 (TE) */
export async function createEquipmentImport(
  page: Page,
  data: Record<string, unknown>,
  role = 'test_engineer'
) {
  const resp = await apiPost(page, '/api/equipment-imports', data, role);
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 반입 승인 (TM) — CAS-Aware */
export async function approveEquipmentImport(
  page: Page,
  importId: string,
  role = 'technical_manager'
) {
  const resp = await apiGet(page, `/api/equipment-imports/${importId}`, role);
  const body = await resp.json();
  const version = extractVersion(body);
  const result = await apiPatch(
    page,
    `/api/equipment-imports/${importId}/approve`,
    { version, comment: 'WF 테스트: 반입 승인' },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

/** 수령 처리 (TE) — CAS-Aware */
export async function receiveEquipmentImport(page: Page, importId: string, role = 'test_engineer') {
  const resp = await apiGet(page, `/api/equipment-imports/${importId}`, role);
  const body = await resp.json();
  const version = extractVersion(body);
  const result = await apiPost(
    page,
    `/api/equipment-imports/${importId}/receive`,
    {
      version,
      receivingCondition: {
        appearance: 'normal',
        operation: 'normal',
        accessories: 'complete',
        notes: 'WF 테스트: 수령 확인',
      },
    },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

/** 반납 요청 (TE) — CAS-Aware */
export async function initiateImportReturn(page: Page, importId: string, role = 'test_engineer') {
  const resp = await apiGet(page, `/api/equipment-imports/${importId}`, role);
  const body = await resp.json();
  const version = extractVersion(body);
  const result = await apiPost(
    page,
    `/api/equipment-imports/${importId}/initiate-return`,
    { version },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

// ============================================================================
// Software Change API (1단계 승인)
// ============================================================================

/** 소프트웨어 변경 요청 (TE) */
export async function createSoftwareChangeRequest(
  page: Page,
  equipmentId: string,
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    '/api/software/change-request',
    {
      equipmentId,
      softwareName: 'WF 테스트 측정 소프트웨어',
      newVersion: `2.0.${Date.now() % 10000}`,
      previousVersion: '1.0.0',
      verificationRecord: 'WF 테스트: 검증 완료, 정상 작동 확인',
    },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 소프트웨어 변경 승인 (TM) — CAS-Aware */
export async function approveSoftwareChange(
  page: Page,
  softwareId: string,
  role = 'technical_manager'
) {
  const resp = await apiGet(page, `/api/software/${softwareId}`, role);
  const body = await resp.json();
  const version = extractVersion(body);
  const result = await apiPatch(
    page,
    `/api/software/${softwareId}/approve`,
    { version, approverComment: 'WF 테스트: 승인' },
    role
  );
  expect(result.ok()).toBeTruthy();
  return result.json();
}

// ============================================================================
// Approvals Dashboard API
// ============================================================================

/** 승인 대기 카운트 조회 */
export async function getApprovalCounts(
  page: Page,
  role = 'technical_manager'
): Promise<Record<string, number>> {
  const resp = await apiGet(page, '/api/approvals/counts', role);
  expect(resp.ok()).toBeTruthy();
  const body = await resp.json();
  return (body.data ?? body) as Record<string, number>;
}

// ============================================================================
// DB Reset Helpers (추가)
// ============================================================================

/** 교정계획서를 특정 상태로 리셋 */
export async function resetCalibrationPlanStatus(
  planId: string,
  status: string,
  casVersion = 1
): Promise<void> {
  const pool = getSharedPool();
  await pool.query(
    `UPDATE calibration_plans
     SET status = $2, cas_version = $3,
         submitted_at = NULL, reviewed_by = NULL, reviewed_at = NULL, review_comment = NULL,
         approved_by = NULL, approved_at = NULL,
         rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL, rejection_stage = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [planId, status, casVersion]
  );
  await clearBackendCache();
}

/** 폐기 요청 삭제 + 장비 상태 복원 */
export async function resetDisposalAndEquipment(equipmentId: string): Promise<void> {
  const pool = getSharedPool();
  await pool.query(
    `DELETE FROM disposal_requests WHERE equipment_id = $1 AND id::text NOT LIKE 'dddd%'`,
    [equipmentId]
  );
  await pool.query(
    `UPDATE equipment SET status = $2, version = 1, updated_at = NOW() WHERE id = $1`,
    [equipmentId, ESVal.AVAILABLE]
  );
  await clearBackendCache();
}

/** 동적 생성된 장비 반입 삭제 */
export async function resetEquipmentImports(): Promise<void> {
  const pool = getSharedPool();
  // 동적 생성된 import만 삭제 (WF 테스트 프리픽스로 구분)
  await pool.query(
    `DELETE FROM equipment_imports WHERE vendor_name LIKE 'WF%' OR vendor_name LIKE '%WF 테스트%'`
  );
  await clearBackendCache();
}

export { clearBackendCache, cleanupSharedPool, getSharedPool };
