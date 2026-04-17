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

/**
 * 응답 body에서 version 필드 추출 (일반 CAS 테이블: equipment, checkouts, disposal 등).
 *
 * calibration_plans는 casVersion 필드 별도 사용 — extractCasVersion 사용.
 */
export function extractVersion(body: Record<string, unknown>): number {
  const data = (body.data ?? body) as Record<string, unknown>;
  const version = data.version;
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
  if (resp.status() !== 201) {
    const errorBody = await resp.text();
    throw new Error(`createCheckout failed: ${resp.status()} — ${errorBody}`);
  }
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

/** 반출 시작 (TM) — CAS-Aware */
export async function startCheckout(page: Page, checkoutId: string, role = 'technical_manager') {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPost(page, `/api/checkouts/${checkoutId}/start`, { version }, role);
  if (!resp.ok()) {
    const errorBody = await resp.text();
    throw new Error(`startCheckout failed: ${resp.status()} — ${errorBody}`);
  }
  return resp.json();
}

/** ��입 처리 (TM) — CAS-Aware */
export async function returnCheckout(
  page: Page,
  checkoutId: string,
  checks: {
    calibrationChecked?: boolean;
    repairChecked?: boolean;
    workingStatusChecked?: boolean;
  } = {},
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPost(
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
  if (!resp.ok()) {
    const errorBody = await resp.text();
    throw new Error(`returnCheckout failed: ${resp.status()} — ${errorBody}`);
  }
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
      managementMethod: 'external_calibration',
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
  if (resp.status() !== 201) {
    const errorBody = await resp.text();
    throw new Error(`createNonConformance failed: ${resp.status()} — ${errorBody}`);
  }
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
    `/api/non-conformances/${ncId}`,
    { version, status: 'corrected', ...correction },
    role
  );
  if (!resp.ok()) {
    const errorBody = await resp.text();
    throw new Error(`correctNonConformance failed: ${resp.status()} — ${errorBody}`);
  }
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

  // 1. 해당 장비의 모든 active checkout 취소 (시드 포함)
  await pool.query(
    `UPDATE checkouts SET status = 'canceled', updated_at = NOW()
     WHERE status NOT IN ('canceled', 'return_approved', 'rejected')
       AND id IN (
         SELECT c.id FROM checkouts c
         JOIN checkout_items ci ON c.id = ci.checkout_id
         WHERE ci.equipment_id = $1
       )`,
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

  // 3. 동적 생성된 교정 기록 삭제 (calibrations는 soft-delete 없으므로 hard delete)
  await pool.query(
    `DELETE FROM calibrations
     WHERE equipment_id = $1
       AND id::text NOT LIKE 'bbbb%'`,
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

/**
 * casVersion 추출 (calibration_plans 전용).
 *
 * calibration_plans는 `version`(개정번호, createNewVersion에서만 증가)과
 * `casVersion`(낙관적 락, 모든 상태 변경에서 증가) 을 분리 사용한다.
 * 상태 변경 API는 casVersion을 요구하므로 이 헬퍼를 사용해야 한다.
 */
export function extractCasVersion(body: Record<string, unknown>): number {
  const data = (body.data ?? body) as Record<string, unknown>;
  const casVersion = data.casVersion;
  if (typeof casVersion !== 'number') {
    throw new Error(`casVersion 필드 없음: ${JSON.stringify(body).slice(0, 300)}`);
  }
  return casVersion;
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
// Test Software API (UL-QP-18-07 관리대장)
// ============================================================================

/** 시험용 소프트웨어 등록 (TE) — WF-14a */
export async function createTestSoftware(
  page: Page,
  overrides: Record<string, unknown> = {},
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    '/api/test-software',
    {
      name: `WF 테스트 소프트웨어 ${Date.now() % 10000}`,
      softwareVersion: '1.0.0',
      testField: 'EMC',
      manufacturer: 'WF Test Vendor',
      location: 'EMC',
      availability: 'available',
      requiresValidation: true,
      ...overrides,
    },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 시험용 소프트웨어 조회 (any role) */
export async function getTestSoftware(page: Page, softwareId: string, role = 'test_engineer') {
  const resp = await apiGet(page, `/api/test-software/${softwareId}`, role);
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// Software Validation API (UL-QP-18-09 유효성확인)
// ============================================================================

/** 유효성 확인 양식 생성 — draft (TE) — WF-14b */
export async function createSoftwareValidation(
  page: Page,
  softwareId: string,
  validationType: 'vendor' | 'self',
  data: Record<string, unknown> = {},
  role = 'test_engineer'
) {
  const vendorDefaults =
    validationType === 'vendor'
      ? {
          vendorName: 'WF Test Vendor',
          vendorSummary: 'WF 테스트: 공급자 검증 정보 요약',
          softwareVersion: '1.0.0',
        }
      : {
          referenceDocuments: 'WF 테스트 참고 문서',
          operatingUnitDescription: 'WF 테스트 운용 환경',
          softwareComponents: 'SW Component A',
          hardwareComponents: 'HW Component B',
          softwareVersion: '1.0.0',
        };

  const resp = await apiPost(
    page,
    `/api/test-software/${softwareId}/validations`,
    { validationType, ...vendorDefaults, ...data },
    role
  );
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 유효성 확인 제출 (TE) */
export async function submitSoftwareValidation(
  page: Page,
  validationId: string,
  role = 'test_engineer'
) {
  const detail = await apiGet(page, `/api/software-validations/${validationId}`, role);
  const body = await detail.json();
  const version = extractVersion(body);
  const resp = await apiPatch(
    page,
    `/api/software-validations/${validationId}/submit`,
    { version },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 기술책임자 승인 (TM) — CAS-Aware */
export async function approveSoftwareValidation(
  page: Page,
  validationId: string,
  role = 'technical_manager'
) {
  const detail = await apiGet(page, `/api/software-validations/${validationId}`, role);
  const body = await detail.json();
  const version = extractVersion(body);
  const resp = await apiPatch(
    page,
    `/api/software-validations/${validationId}/approve`,
    { version, comment: 'WF 테스트: 기술책임자 승인' },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 품질책임자 등록 (QM) — CAS-Aware */
export async function qualityApproveSoftwareValidation(
  page: Page,
  validationId: string,
  role = 'quality_manager'
) {
  const detail = await apiGet(page, `/api/software-validations/${validationId}`, role);
  const body = await detail.json();
  const version = extractVersion(body);
  const resp = await apiPatch(
    page,
    `/api/software-validations/${validationId}/quality-approve`,
    { version, comment: 'WF 테스트: 품질책임자 등록' },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 유효성 확인 반려 (TM/QM) — CAS-Aware */
export async function rejectSoftwareValidation(
  page: Page,
  validationId: string,
  rejectionReason: string,
  role = 'technical_manager'
) {
  const detail = await apiGet(page, `/api/software-validations/${validationId}`, role);
  const body = await detail.json();
  const version = extractVersion(body);
  const resp = await apiPatch(
    page,
    `/api/software-validations/${validationId}/reject`,
    { version, rejectionReason },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// Legacy Software Change API (deprecated — kept for backward compat)
// ============================================================================

/** @deprecated Use createTestSoftware instead */
export async function createSoftwareChangeRequest(
  page: Page,
  equipmentId: string,
  role = 'test_engineer'
) {
  // Legacy endpoint no longer exists — redirect to test-software
  return createTestSoftware(page, { name: 'WF 레거시 소프트웨어' }, role);
}

/** @deprecated Use approveSoftwareValidation instead */
export async function approveSoftwareChange(
  page: Page,
  softwareId: string,
  role = 'technical_manager'
) {
  const resp = await getTestSoftware(page, softwareId, role);
  return resp;
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

// ============================================================================
// Generic: apiDelete
// ============================================================================

export async function apiDelete(page: Page, path: string, role: string) {
  const token = await getBackendToken(page, role);
  return page.request.delete(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============================================================================
// WF-17: Checkout Overdue Helpers
// ============================================================================

/** checkout을 overdue 상태로 DB 직접 전환 (스케줄러 대체) */
export async function setCheckoutOverdue(checkoutId: string): Promise<void> {
  const pool = getSharedPool();
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 7);
  await pool.query(
    `UPDATE checkouts SET status = 'overdue', expected_return_date = $2, updated_at = NOW()
     WHERE id = $1`,
    [checkoutId, pastDate.toISOString()]
  );
  await clearBackendCache();
}

// ============================================================================
// WF-18: NC Correction Rejection Helpers
// ============================================================================

/** 부적합 조치 반려 (TM) — CAS-Aware */
export async function rejectCorrection(
  page: Page,
  ncId: string,
  rejectionReason: string,
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/non-conformances/${ncId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/non-conformances/${ncId}/reject-correction`,
    { version, rejectionReason },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

// ============================================================================
// WF-19: Intermediate Inspection 3-Step Approval Helpers
// ============================================================================

/** 중간점검표 생성 (TE — UPDATE_CALIBRATION 권한 보유) */
export async function createIntermediateInspection(
  page: Page,
  calibrationId: string,
  data: Record<string, unknown>,
  role = 'test_engineer'
) {
  const resp = await apiPost(
    page,
    `/api/calibration/${calibrationId}/intermediate-inspections`,
    { calibrationId, ...data },
    role
  );
  if (resp.status() !== 201) {
    const errorBody = await resp.text();
    throw new Error(`createIntermediateInspection failed: ${resp.status()} — ${errorBody}`);
  }
  return resp.json();
}

/** CAS-Aware 상태 전이 헬퍼 (중간점검) */
async function transitionIntermediateInspection(
  page: Page,
  inspectionId: string,
  action: string,
  role: string,
  extraData: Record<string, unknown> = {}
) {
  const detailResp = await apiGet(page, `/api/intermediate-inspections/${inspectionId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/intermediate-inspections/${inspectionId}/${action}`,
    { version, ...extraData },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 중간점검 제출 (TE — UPDATE_CALIBRATION 권한 보유) */
export async function submitIntermediateInspection(
  page: Page,
  inspectionId: string,
  role = 'test_engineer'
) {
  return transitionIntermediateInspection(page, inspectionId, 'submit', role);
}

/** 중간점검 검토 (TM) */
export async function reviewIntermediateInspection(
  page: Page,
  inspectionId: string,
  role = 'technical_manager'
) {
  return transitionIntermediateInspection(page, inspectionId, 'review', role);
}

/** 중간점검 승인 (LM) */
export async function approveIntermediateInspection(
  page: Page,
  inspectionId: string,
  role = 'lab_manager'
) {
  return transitionIntermediateInspection(page, inspectionId, 'approve', role);
}

/** 중간점검 반려 (TM/LM) */
export async function rejectIntermediateInspection(
  page: Page,
  inspectionId: string,
  rejectionReason: string,
  role = 'technical_manager'
) {
  return transitionIntermediateInspection(page, inspectionId, 'reject', role, {
    rejectionReason,
  });
}

/** 동적 생성된 중간점검 삭제 (리셋) */
export async function resetIntermediateInspections(calibrationId: string): Promise<void> {
  const pool = getSharedPool();
  await pool.query(
    `DELETE FROM intermediate_inspections WHERE calibration_id = $1
     AND id::text NOT LIKE 'ffff%'`,
    [calibrationId]
  );
  await clearBackendCache();
}

// ============================================================================
// WF-20: Self-Inspection Confirmation Helpers
// ============================================================================

/** 자체점검 생성 (TE) */
export async function createSelfInspection(
  page: Page,
  equipmentId: string,
  data: Record<string, unknown>,
  role = 'test_engineer'
) {
  const resp = await apiPost(page, `/api/equipment/${equipmentId}/self-inspections`, data, role);
  expect(resp.status()).toBe(201);
  return resp.json();
}

/** 자체점검 수정 (TE) — CAS-Aware */
export async function updateSelfInspection(
  page: Page,
  inspectionId: string,
  data: Record<string, unknown>,
  role = 'test_engineer'
) {
  const detailResp = await apiGet(page, `/api/self-inspections/${inspectionId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/self-inspections/${inspectionId}`,
    { version, ...data },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 자체점검 제출 (TE: draft → submitted) — CAS-Aware */
export async function submitSelfInspection(
  page: Page,
  inspectionId: string,
  role = 'test_engineer'
) {
  const detailResp = await apiGet(page, `/api/self-inspections/${inspectionId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/self-inspections/${inspectionId}/submit`,
    { version },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 자체점검 승인 (TM: submitted → approved) — CAS-Aware */
export async function approveSelfInspection(
  page: Page,
  inspectionId: string,
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/self-inspections/${inspectionId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/self-inspections/${inspectionId}/approve`,
    { version },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 자체점검 반려 (TM: submitted → rejected) — CAS-Aware */
export async function rejectSelfInspection(
  page: Page,
  inspectionId: string,
  rejectionReason: string,
  role = 'technical_manager'
) {
  const detailResp = await apiGet(page, `/api/self-inspections/${inspectionId}`, role);
  const detail = await detailResp.json();
  const version = extractVersion(detail);
  const resp = await apiPatch(
    page,
    `/api/self-inspections/${inspectionId}/reject`,
    { version, rejectionReason },
    role
  );
  expect(resp.ok()).toBeTruthy();
  return resp.json();
}

/** 자체점검 삭제 */
export async function deleteSelfInspection(
  page: Page,
  inspectionId: string,
  role = 'test_engineer'
) {
  return apiDelete(page, `/api/self-inspections/${inspectionId}`, role);
}

/** 동적 생성된 자체점검 삭제 (리셋) */
export async function resetSelfInspections(equipmentId: string): Promise<void> {
  const pool = getSharedPool();
  await pool.query(
    `DELETE FROM equipment_self_inspections WHERE equipment_id = $1
     AND id::text NOT LIKE 'ffff%'`,
    [equipmentId]
  );
  await clearBackendCache();
}

export { clearBackendCache, cleanupSharedPool, getSharedPool };
