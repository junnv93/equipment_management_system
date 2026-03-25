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
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
// DashboardAggregate는 dashboard-api.ts에서 정의 (SSOT: SSR/CSC 공유 타입)
import type { DashboardAggregate } from './dashboard-api';
export type { DashboardAggregate };

/**
 * 대시보드 전체 집계 조회 (Server Component용)
 *
 * 7개 개별 API 호출 대신 단일 HTTP 요청으로 전체 대시보드 데이터를 가져옵니다.
 * - HTTP 왕복: 7 → 1
 * - JWT 파싱: 7회 → 1회
 * - 부분 실패 지원: 백엔드에서 Promise.allSettled 처리
 *
 * @param teamId 팀 필터 (선택)
 * @param days 교정 예정 조회 기간 (기본 30일)
 * @param activitiesLimit 최근 활동 조회 개수 (기본 20개)
 */
export async function getDashboardAggregate(
  teamId?: string,
  days = 30,
  activitiesLimit = 20
): Promise<DashboardAggregate> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.AGGREGATE, {
    params: {
      ...(teamId && { teamId }),
      days,
      activitiesLimit,
    },
  });
  return transformSingleResponse<DashboardAggregate>(response);
}
