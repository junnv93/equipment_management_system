/**
 * 팀 관리 Server API
 *
 * Server Component에서 사용하는 API 함수들
 * Next.js 16 패턴: cookies()는 Promise를 반환하므로 await 필요
 *
 * @see packages/schemas/src/team.ts
 */
import type { Team, TeamDetail, TeamQuery } from '../teams-api';
import { API_BASE_URL } from '../../config/api-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { getServerAuthHeaders as getAuthHeaders } from '@/lib/auth/server-session';

/**
 * 팀 목록 조회 (Server)
 */
export async function getTeams(query: TeamQuery = {}): Promise<{
  data: Team[];
  meta: {
    pagination: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}> {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `${API_BASE_URL}${API_ENDPOINTS.TEAMS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;

  const response = await fetch(url, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch teams: ${response.status}`);
  }

  const data = await response.json();

  // 백엔드 응답 형식에 맞게 변환
  if (data.data && 'data' in data) {
    return {
      data: data.data || [],
      meta: {
        pagination: {
          total: data.meta?.pagination?.total || 0,
          pageSize: data.meta?.pagination?.pageSize || 20,
          currentPage: data.meta?.pagination?.page || 1,
          totalPages: data.meta?.pagination?.totalPages || 1,
        },
      },
    };
  }

  return {
    data: data.data || data || [],
    meta: {
      pagination: {
        total: data.meta?.pagination?.total || data.length || 0,
        pageSize: query.pageSize || 20,
        currentPage: query.page || 1,
        totalPages: Math.ceil(
          (data.meta?.pagination?.total || data.length || 0) / (query.pageSize || 20)
        ),
      },
    },
  };
}

/**
 * 팀 상세 조회 (Server)
 */
export async function getTeam(id: string): Promise<TeamDetail | null> {
  const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.TEAMS.GET(id)}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch team: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data;
}

/**
 * 팀 멤버 조회 (Server)
 */
export async function getTeamMembers(teamId: string): Promise<
  Array<{
    id: string;
    name: string;
    email?: string;
    role: string;
    position?: string;
    avatarUrl?: string;
  }>
> {
  const response = await fetch(`${API_BASE_URL}/api/v1/users?teamId=${teamId}`, {
    headers: await getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch team members: ${response.status}`);
  }

  const data = await response.json();
  return data.data || data.items || [];
}

/**
 * 팀 장비 수 조회 (Server)
 */
export async function getTeamEquipmentCount(teamId: string): Promise<number> {
  const response = await fetch(
    `${API_BASE_URL}${API_ENDPOINTS.EQUIPMENT.LIST}?teamId=${teamId}&pageSize=1`,
    {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    }
  );

  if (!response.ok) {
    return 0;
  }

  const data = await response.json();
  return data.meta?.pagination?.total || data.meta?.totalItems || 0;
}

const teamApiServer = {
  getTeams,
  getTeam,
  getTeamMembers,
  getTeamEquipmentCount,
};

export default teamApiServer;
