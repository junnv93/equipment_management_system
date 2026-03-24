/**
 * Approval E2E Test Helpers
 *
 * 승인 관리 E2E 테스트를 위한 SSOT 기반 유틸리티.
 * 백엔드 API 직접 호출, 상태 검증, DB 리셋을 제공한다.
 *
 * 아키텍처 원칙:
 * - SSOT: 모든 상수는 shared-test-data.ts 또는 @equipment-management/schemas에서 임포트
 * - CAS-Aware: 모든 상태 변경 API에서 현재 version을 자동 조회 후 전달
 * - 캐시 일관성: DB 직접 리셋 후 clearBackendCache() 자동 호출
 *
 * @see apps/frontend/tests/e2e/shared/helpers/api-helpers.ts - 토큰/캐시 헬퍼
 * @see apps/frontend/tests/e2e/shared/constants/shared-test-data.ts - 테스트 데이터 SSOT
 */

import { Page } from '@playwright/test';
import {
  EquipmentStatusValues as ESVal,
  CalibrationPlanStatusValues as CPSVal,
} from '@equipment-management/schemas';
import {
  getBackendToken,
  clearBackendCache,
  getSharedPool,
  cleanupSharedPool,
} from './api-helpers';
import { BASE_URLS, TEST_USER_IDS } from '../constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

/** CAS 초기 version — DB 스키마 DEFAULT 값과 동기화 */
const INITIAL_VERSION = 1;

// ============================================================================
// Generic API Helpers (CAS-Aware)
// ============================================================================

/**
 * 인증된 GET 요청
 *
 * @param page - Playwright Page (page.request 사용)
 * @param path - API 경로 (e.g., '/api/equipment/xxx/disposal/current')
 * @param role - 인증 역할
 */
export async function apiGet(page: Page, path: string, role: string) {
  const token = await getBackendToken(page, role);
  return page.request.get(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/**
 * 인증된 POST 요청
 */
export async function apiPost(
  page: Page,
  path: string,
  data: Record<string, unknown>,
  role: string
) {
  const token = await getBackendToken(page, role);
  return page.request.post(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

/**
 * 인증된 PATCH 요청
 */
export async function apiPatch(
  page: Page,
  path: string,
  data: Record<string, unknown>,
  role: string
) {
  const token = await getBackendToken(page, role);
  return page.request.patch(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    data,
  });
}

/**
 * 인증된 DELETE 요청
 */
export async function apiDelete(page: Page, path: string, role: string) {
  const token = await getBackendToken(page, role);
  return page.request.delete(`${BACKEND_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

// ============================================================================
// Version Extraction (CAS 패턴 공통)
// ============================================================================

/**
 * API 응답에서 version 필드를 추출한다.
 * ResponseTransformInterceptor의 { success, data } 래핑을 자동 처리.
 */
export function extractVersion(body: Record<string, unknown>): number {
  const data = (body.data ?? body) as Record<string, unknown>;
  const version = data.version ?? data.casVersion;
  if (typeof version !== 'number') {
    throw new Error(`version 필드 없음: ${JSON.stringify(body).slice(0, 200)}`);
  }
  return version;
}

/**
 * 409 VERSION_CONFLICT 응답인지 확인
 */
export function isConflictError(status: number, body: Record<string, unknown>): boolean {
  return status === 409 && (body.code === 'VERSION_CONFLICT' || body.statusCode === 409);
}

// ============================================================================
// Disposal API Helpers (2단계 승인)
// ============================================================================

/**
 * 현재 폐기 요청 조회 → version 포함
 */
export async function getDisposalRequest(
  page: Page,
  equipmentId: string,
  role = 'technical_manager'
) {
  const resp = await apiGet(page, `/api/equipment/${equipmentId}/disposal/current`, role);
  return resp.json();
}

/**
 * 폐기 요청 (TE) — POST /api/equipment/:id/disposal/request
 */
export async function apiRequestDisposal(
  page: Page,
  equipmentId: string,
  reason: string,
  reasonDetail: string,
  role = 'test_engineer'
) {
  return apiPost(
    page,
    `/api/equipment/${equipmentId}/disposal/request`,
    {
      reason,
      reasonDetail,
    },
    role
  );
}

/**
 * 폐기 검토 (TM) — POST /api/equipment/:id/disposal/review
 * CAS-Aware: 현재 version을 자동 조회
 */
export async function apiReviewDisposal(
  page: Page,
  equipmentId: string,
  decision: 'approve' | 'reject',
  opinion: string,
  role = 'technical_manager'
) {
  const current = await getDisposalRequest(page, equipmentId, role);
  const data = (current.data ?? current) as Record<string, unknown>;
  const version = extractVersion(data);
  return apiPost(
    page,
    `/api/equipment/${equipmentId}/disposal/review`,
    {
      version,
      decision,
      opinion,
    },
    role
  );
}

/**
 * 폐기 최종 승인 (LM) — POST /api/equipment/:id/disposal/approve
 * CAS-Aware: 현재 version을 자동 조회
 */
export async function apiApproveDisposal(
  page: Page,
  equipmentId: string,
  decision: 'approve' | 'reject',
  comment?: string,
  role = 'lab_manager'
) {
  const current = await getDisposalRequest(page, equipmentId, role);
  const data = (current.data ?? current) as Record<string, unknown>;
  const version = extractVersion(data);
  return apiPost(
    page,
    `/api/equipment/${equipmentId}/disposal/approve`,
    {
      version,
      decision,
      comment: comment ?? '',
    },
    role
  );
}

/**
 * 폐기 요청 취소 (요청자) — DELETE /api/equipment/:id/disposal/request
 */
export async function apiCancelDisposal(page: Page, equipmentId: string, role = 'test_engineer') {
  return apiDelete(page, `/api/equipment/${equipmentId}/disposal/request`, role);
}

// ============================================================================
// Calibration Plans API Helpers (3단계 승인)
// ============================================================================

/**
 * 교정계획서 상세 조회 → version(casVersion) 포함
 */
export async function getCalibrationPlan(page: Page, planId: string, role = 'technical_manager') {
  const resp = await apiGet(page, `/api/calibration-plans/${planId}`, role);
  return resp.json();
}

/**
 * 교정계획서 검토 요청 (TM) — POST /api/calibration-plans/:id/submit-for-review
 * CAS-Aware
 */
export async function apiSubmitPlanForReview(
  page: Page,
  planId: string,
  memo?: string,
  role = 'technical_manager'
) {
  const plan = await getCalibrationPlan(page, planId, role);
  const data = (plan.data ?? plan) as Record<string, unknown>;
  const casVersion = data.casVersion ?? data.version;
  if (typeof casVersion !== 'number') {
    throw new Error(`casVersion 필드 없음: ${JSON.stringify(plan).slice(0, 200)}`);
  }
  return apiPost(
    page,
    `/api/calibration-plans/${planId}/submit-for-review`,
    {
      casVersion,
      memo: memo ?? '',
    },
    role
  );
}

/**
 * 교정계획서 검토 (QM) — PATCH /api/calibration-plans/:id/review
 * CAS-Aware
 */
export async function apiReviewCalibrationPlan(
  page: Page,
  planId: string,
  reviewComment?: string,
  role = 'quality_manager'
) {
  const plan = await getCalibrationPlan(page, planId, role);
  const data = (plan.data ?? plan) as Record<string, unknown>;
  const casVersion = data.casVersion ?? data.version;
  if (typeof casVersion !== 'number') {
    throw new Error(`casVersion 필드 없음: ${JSON.stringify(plan).slice(0, 200)}`);
  }
  return apiPatch(
    page,
    `/api/calibration-plans/${planId}/review`,
    {
      casVersion,
      reviewComment: reviewComment ?? '검토 완료',
    },
    role
  );
}

/**
 * 교정계획서 최종 승인 (LM) — PATCH /api/calibration-plans/:id/approve
 * CAS-Aware
 */
export async function apiApproveCalibrationPlan(page: Page, planId: string, role = 'lab_manager') {
  const plan = await getCalibrationPlan(page, planId, role);
  const data = (plan.data ?? plan) as Record<string, unknown>;
  const casVersion = data.casVersion ?? data.version;
  if (typeof casVersion !== 'number') {
    throw new Error(`casVersion 필드 없음: ${JSON.stringify(plan).slice(0, 200)}`);
  }
  return apiPatch(
    page,
    `/api/calibration-plans/${planId}/approve`,
    {
      casVersion,
    },
    role
  );
}

/**
 * 교정계획서 반려 (QM or LM) — PATCH /api/calibration-plans/:id/reject
 * CAS-Aware
 */
export async function apiRejectCalibrationPlan(
  page: Page,
  planId: string,
  rejectionReason: string,
  role = 'quality_manager'
) {
  const plan = await getCalibrationPlan(page, planId, role);
  const data = (plan.data ?? plan) as Record<string, unknown>;
  const casVersion = data.casVersion ?? data.version;
  if (typeof casVersion !== 'number') {
    throw new Error(`casVersion 필드 없음: ${JSON.stringify(plan).slice(0, 200)}`);
  }
  return apiPatch(
    page,
    `/api/calibration-plans/${planId}/reject`,
    {
      casVersion,
      rejectionReason,
    },
    role
  );
}

// ============================================================================
// Checkout Approval API Helpers (1단계 승인)
// ============================================================================

/**
 * 체크아웃 상세 조회 → version 포함
 */
export async function getCheckout(page: Page, checkoutId: string, role = 'technical_manager') {
  const resp = await apiGet(page, `/api/checkouts/${checkoutId}`, role);
  return resp.json();
}

/**
 * 체크아웃 승인 (TM) — PATCH /api/checkouts/:id/approve
 * CAS-Aware
 */
export async function apiApproveCheckout(
  page: Page,
  checkoutId: string,
  role = 'technical_manager'
) {
  const detail = await getCheckout(page, checkoutId, role);
  const data = (detail.data ?? detail) as Record<string, unknown>;
  const version = extractVersion(data);
  return apiPatch(page, `/api/checkouts/${checkoutId}/approve`, { version }, role);
}

/**
 * 체크아웃 반려 (TM) — PATCH /api/checkouts/:id/reject
 * CAS-Aware
 */
export async function apiRejectCheckout(
  page: Page,
  checkoutId: string,
  reason: string,
  role = 'technical_manager'
) {
  const detail = await getCheckout(page, checkoutId, role);
  const data = (detail.data ?? detail) as Record<string, unknown>;
  const version = extractVersion(data);
  return apiPatch(page, `/api/checkouts/${checkoutId}/reject`, { version, reason }, role);
}

// ============================================================================
// Database Direct Reset (캐시 클리어 포함)
// 공유 Pool 사용 — api-helpers.ts의 getSharedPool() 싱글턴
// ============================================================================

/**
 * DB 풀 정리 (afterAll에서 호출)
 * 공유 Pool을 정리한다. 마지막 테스트 스위트에서만 호출해야 한다.
 */
export const cleanupApprovalPool = cleanupSharedPool;

/**
 * 장비 상태를 available로 리셋 + 캐시 클리어
 */
export async function resetEquipmentStatus(
  equipmentId: string,
  status: string = ESVal.AVAILABLE
): Promise<void> {
  const p = getSharedPool();
  await p.query(
    `UPDATE equipment SET status = $2, version = ${INITIAL_VERSION}, updated_at = NOW() WHERE id = $1`,
    [equipmentId, status]
  );
  await clearBackendCache();
}

/**
 * 폐기 요청을 pending 상태로 리셋 + 장비 상태 pending_disposal + 캐시 클리어
 */
export async function resetDisposalToPending(
  equipmentId: string,
  requestId: string
): Promise<void> {
  const p = getSharedPool();
  await p.query(
    `UPDATE disposal_requests
     SET review_status = 'pending',
         version = ${INITIAL_VERSION},
         reviewed_by = NULL, reviewed_at = NULL,
         approved_by = NULL, approved_at = NULL,
         review_opinion = NULL, approval_comment = NULL,
         rejected_by = NULL, rejected_at = NULL,
         rejection_reason = NULL, rejection_step = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [requestId]
  );
  await p.query(
    `UPDATE equipment SET status = $2, version = ${INITIAL_VERSION}, updated_at = NOW() WHERE id = $1`,
    [equipmentId, ESVal.PENDING_DISPOSAL]
  );
  await clearBackendCache();
}

/**
 * 폐기 요청을 reviewed 상태로 리셋 + 장비 상태 유지 + 캐시 클리어
 */
export async function resetDisposalToReviewed(
  equipmentId: string,
  requestId: string,
  reviewerId = TEST_USER_IDS.TECHNICAL_MANAGER_SUWON
): Promise<void> {
  const p = getSharedPool();
  await p.query(
    `UPDATE disposal_requests
     SET review_status = 'reviewed',
         version = 2,
         reviewed_by = $2, reviewed_at = NOW(),
         approved_by = NULL, approved_at = NULL,
         review_opinion = '검토 완료 (리셋)',
         rejection_reason = NULL,
         updated_at = NOW()
     WHERE id = $1`,
    [requestId, reviewerId]
  );
  await p.query(
    `UPDATE equipment SET status = $2, version = ${INITIAL_VERSION}, updated_at = NOW() WHERE id = $1`,
    [equipmentId, ESVal.PENDING_DISPOSAL]
  );
  await clearBackendCache();
}

/**
 * 폐기 요청 삭제 + 장비 available 복원 + 캐시 클리어
 */
export async function resetDisposalAndEquipment(equipmentId: string): Promise<void> {
  const p = getSharedPool();
  // 동적 생성된 폐기 요청만 삭제 (시드 데이터 보존)
  await p.query(
    `DELETE FROM disposal_requests WHERE equipment_id = $1 AND id::text NOT LIKE 'dddd%'`,
    [equipmentId]
  );
  await resetEquipmentStatus(equipmentId);
}

/**
 * 교정계획서를 특정 상태로 리셋 + 캐시 클리어
 */
export async function resetCalibrationPlanStatus(
  planId: string,
  status: string,
  casVersion = INITIAL_VERSION
): Promise<void> {
  const p = getSharedPool();
  const resetFields: Record<string, string> = {
    [CPSVal.DRAFT]: `status = '${CPSVal.DRAFT}', submitted_at = NULL, reviewed_by = NULL, reviewed_at = NULL, review_comment = NULL, approved_by = NULL, approved_at = NULL, rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL, rejection_stage = NULL`,
    [CPSVal.PENDING_REVIEW]: `status = '${CPSVal.PENDING_REVIEW}', submitted_at = NOW(), reviewed_by = NULL, reviewed_at = NULL, review_comment = NULL, approved_by = NULL, approved_at = NULL, rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL, rejection_stage = NULL`,
    [CPSVal.PENDING_APPROVAL]: `status = '${CPSVal.PENDING_APPROVAL}', reviewed_by = '${TEST_USER_IDS.QUALITY_MANAGER_SUWON}', reviewed_at = NOW(), review_comment = '검토 완료 (리셋)', approved_by = NULL, approved_at = NULL, rejected_by = NULL, rejected_at = NULL, rejection_reason = NULL, rejection_stage = NULL`,
  };

  const fields = resetFields[status];
  if (!fields) {
    throw new Error(
      `지원하지 않는 교정계획서 상태: ${status}. 지원: ${Object.keys(resetFields).join(', ')}`
    );
  }

  await p.query(
    `UPDATE calibration_plans SET ${fields}, cas_version = $2, updated_at = NOW() WHERE id = $1`,
    [planId, casVersion]
  );
  await clearBackendCache();
}

// ============================================================================
// UI Assertion Helpers
// ============================================================================

/**
 * 승인 목록 또는 빈 상태 로딩 완료 대기
 * @returns true = 목록에 데이터 있음, false = 빈 상태
 */
export async function waitForApprovalListOrEmpty(page: Page): Promise<boolean> {
  const { expect } = await import('@playwright/test');
  const approvalList = page.locator('[data-testid="approval-list"]');
  const emptyState = page.getByText('모든 승인을 완료했습니다');
  await expect(emptyState.or(approvalList)).toBeVisible({ timeout: 15000 });
  return approvalList.isVisible().catch(() => false);
}

/**
 * 토스트 메시지 대기
 */
export async function waitForToast(
  page: Page,
  textPattern: RegExp,
  timeout = 10000
): Promise<void> {
  const { expect } = await import('@playwright/test');
  await expect(page.getByText(textPattern).first()).toBeVisible({ timeout });
}
