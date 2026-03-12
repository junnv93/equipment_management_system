/**
 * 팀 관리 Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/teams/page.tsx (Server Component)
 * - 기타 Server Component에서 팀 데이터 fetch가 필요한 경우
 *
 * 절대로 'use client' 컴포넌트에서 import하지 마세요!
 * 클라이언트에서는 teams-api.ts를 사용하세요.
 *
 * @see lib/api/teams-api.ts (Client-side API)
 */

import { createServerApiClient } from './server-api-client';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { PaginatedResponse } from './types';
import type { Team, TeamQuery, TeamDetail } from './teams-api';

/**
 * 팀 목록 조회 (Server Component용)
 *
 * @param query - 팀 조회 쿼리 파라미터
 * @returns 페이지네이션된 팀 목록
 */
export async function getTeamsList(query: TeamQuery = {}): Promise<PaginatedResponse<Team>> {
  const apiClient = await createServerApiClient();
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `${API_ENDPOINTS.TEAMS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<Team>(response);
}

/**
 * 팀 상세 조회 (Server Component용)
 *
 * @param id - 팀 ID
 * @returns 팀 상세 정보
 */
export async function getTeamDetail(id: string): Promise<TeamDetail> {
  const apiClient = await createServerApiClient();
  const response = await apiClient.get(API_ENDPOINTS.TEAMS.GET(id));
  return transformSingleResponse<TeamDetail>(response);
}
