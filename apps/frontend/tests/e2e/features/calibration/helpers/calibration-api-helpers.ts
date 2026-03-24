/**
 * Calibration E2E Test API Helpers
 *
 * Backend API를 직접 호출하는 헬퍼 함수들.
 * UI 테스트의 사전/사후 조건 설정에 사용.
 */

import { APIRequestContext } from '@playwright/test';
import { BASE_URLS } from '../../../shared/constants/shared-test-data';

const BACKEND_URL = BASE_URLS.BACKEND;

/** 토큰 캐시 — rate limit(100/분) 방지 */
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getBackendToken(
  request: APIRequestContext,
  role: 'test_engineer' | 'technical_manager' | 'quality_manager' | 'lab_manager'
): Promise<string> {
  const cached = tokenCache.get(role);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.token;
  }

  const response = await request.get(`${BACKEND_URL}/api/auth/test-login?role=${role}`);
  if (!response.ok()) {
    throw new Error(`Failed to login as ${role}: ${response.status()}`);
  }
  const data = await response.json();
  const token = data.access_token;

  // 캐시: 10분
  tokenCache.set(role, { token, expiresAt: Date.now() + 10 * 60 * 1000 });
  return token;
}

export async function clearBackendCache(request: APIRequestContext): Promise<void> {
  const token = await getBackendToken(request, 'lab_manager');
  await request.post(`${BACKEND_URL}/api/monitoring/clear-cache`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** 교정 기록 상세 조회 */
export async function getCalibration(
  request: APIRequestContext,
  calibrationId: string,
  role:
    | 'test_engineer'
    | 'technical_manager'
    | 'quality_manager'
    | 'lab_manager' = 'technical_manager'
) {
  const token = await getBackendToken(request, role);
  const response = await request.get(`${BACKEND_URL}/api/calibration/${calibrationId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) return null;
  const body = await response.json();
  return body.data ?? body;
}

/** 교정 승인 */
export async function approveCalibration(
  request: APIRequestContext,
  calibrationId: string,
  version: number,
  comment?: string
) {
  const token = await getBackendToken(request, 'technical_manager');
  const response = await request.patch(`${BACKEND_URL}/api/calibration/${calibrationId}/approve`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { version, approverComment: comment ?? '승인 완료' },
  });
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 교정 반려 */
export async function rejectCalibration(
  request: APIRequestContext,
  calibrationId: string,
  version: number,
  reason: string
) {
  const token = await getBackendToken(request, 'technical_manager');
  const response = await request.patch(`${BACKEND_URL}/api/calibration/${calibrationId}/reject`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { version, rejectionReason: reason },
  });
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 교정계획서 상세 조회 */
export async function getCalibrationPlan(
  request: APIRequestContext,
  planId: string,
  role: 'technical_manager' | 'quality_manager' | 'lab_manager' = 'technical_manager'
) {
  const token = await getBackendToken(request, role);
  const response = await request.get(`${BACKEND_URL}/api/calibration-plans/${planId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) return null;
  const body = await response.json();
  return body.data ?? body;
}

/** 교정계획서 검토 요청 (TM → QM) */
export async function submitPlanForReview(
  request: APIRequestContext,
  planId: string,
  casVersion: number
) {
  const token = await getBackendToken(request, 'technical_manager');
  const response = await request.post(
    `${BACKEND_URL}/api/calibration-plans/${planId}/submit-for-review`,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { casVersion },
    }
  );
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 교정계획서 검토 완료 (QM → LM) */
export async function reviewPlan(
  request: APIRequestContext,
  planId: string,
  casVersion: number,
  comment?: string
) {
  const token = await getBackendToken(request, 'quality_manager');
  const response = await request.patch(`${BACKEND_URL}/api/calibration-plans/${planId}/review`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { casVersion, reviewComment: comment ?? '검토 완료' },
  });
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 교정계획서 최종 승인 (LM) */
export async function approvePlan(request: APIRequestContext, planId: string, casVersion: number) {
  const token = await getBackendToken(request, 'lab_manager');
  const response = await request.patch(`${BACKEND_URL}/api/calibration-plans/${planId}/approve`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { casVersion },
  });
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 교정계획서 반려 */
export async function rejectPlan(
  request: APIRequestContext,
  planId: string,
  casVersion: number,
  reason: string,
  role: 'quality_manager' | 'lab_manager' = 'quality_manager'
) {
  const token = await getBackendToken(request, role);
  const response = await request.patch(`${BACKEND_URL}/api/calibration-plans/${planId}/reject`, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    data: { casVersion, rejectionReason: reason },
  });
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 보정계수 목록 조회 */
export async function getCalibrationFactors(
  request: APIRequestContext,
  role:
    | 'test_engineer'
    | 'technical_manager'
    | 'quality_manager'
    | 'lab_manager' = 'technical_manager'
) {
  const token = await getBackendToken(request, role);
  const response = await request.get(`${BACKEND_URL}/api/calibration-factors`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok()) return null;
  const body = await response.json();
  return body.data ?? body;
}

/** 보정계수 승인 */
export async function approveCalibrationFactor(
  request: APIRequestContext,
  factorId: string,
  version: number,
  comment?: string
) {
  const token = await getBackendToken(request, 'technical_manager');
  const response = await request.patch(
    `${BACKEND_URL}/api/calibration-factors/${factorId}/approve`,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { version, approverComment: comment ?? '보정계수 승인' },
    }
  );
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}

/** 보정계수 반려 */
export async function rejectCalibrationFactor(
  request: APIRequestContext,
  factorId: string,
  version: number,
  reason: string
) {
  const token = await getBackendToken(request, 'technical_manager');
  const response = await request.patch(
    `${BACKEND_URL}/api/calibration-factors/${factorId}/reject`,
    {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: { version, rejectionReason: reason },
    }
  );
  return { ok: response.ok(), status: response.status(), data: await response.json() };
}
