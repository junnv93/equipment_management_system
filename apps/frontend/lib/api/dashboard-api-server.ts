/**
 * 대시보드 Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/page.tsx (Server Component - PPR 프리페치)
 *
 * 절대로 'use client' 컴포넌트에서 import하지 마세요!
 * 클라이언트에서는 dashboard-api.ts를 사용하세요.
 *
 * @see lib/api/dashboard-api.ts (Client-side API)
 */

import { createServerApiClient } from './server-api-client';
import { transformArrayResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type {
  DashboardSummary,
  EquipmentByTeam,
  OverdueCalibration,
  UpcomingCalibration,
  OverdueCheckout,
} from './dashboard-api';

/**
 * 대시보드 요약 조회 (Server Component용)
 */
export async function getDashboardSummary(teamId?: string): Promise<DashboardSummary> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY, {
    params: teamId ? { teamId } : undefined,
  });
  return response.data;
}

/**
 * 팀별 장비 현황 조회 (Server Component용)
 */
export async function getDashboardEquipmentByTeam(teamId?: string): Promise<EquipmentByTeam[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.EQUIPMENT_BY_TEAM, {
    params: teamId ? { teamId } : undefined,
  });
  return transformArrayResponse<EquipmentByTeam>(response);
}

/**
 * 교정 지연 장비 조회 (Server Component용)
 */
export async function getDashboardOverdueCalibrations(
  teamId?: string
): Promise<OverdueCalibration[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.OVERDUE_CALIBRATIONS, {
    params: teamId ? { teamId } : undefined,
  });
  return transformArrayResponse<OverdueCalibration>(response);
}

/**
 * 교정 예정 장비 조회 (Server Component용)
 */
export async function getDashboardUpcomingCalibrations(
  days = 30,
  teamId?: string
): Promise<UpcomingCalibration[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.UPCOMING_CALIBRATIONS, {
    params: { days, ...(teamId ? { teamId } : {}) },
  });
  return response.data;
}

/**
 * 반출 지연 목록 조회 (Server Component용)
 */
export async function getDashboardOverdueCheckouts(teamId?: string): Promise<OverdueCheckout[]> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.OVERDUE_RENTALS, {
    params: teamId ? { teamId } : undefined,
  });
  return response.data;
}

/**
 * 장비 상태별 통계 조회 (Server Component용)
 */
export async function getDashboardEquipmentStatusStats(
  teamId?: string
): Promise<Record<string, number>> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.EQUIPMENT_STATUS_STATS, {
    params: teamId ? { teamId } : undefined,
  });
  return response.data;
}
