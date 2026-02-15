/**
 * 팀 관리 API 클라이언트
 *
 * ✅ Single Source of Truth: schemas 패키지에서 타입 import
 * ✅ Client Component에서 사용하는 API 함수들
 *
 * @see packages/schemas/src/team.ts
 */
import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type {
  Team as SchemaTeam,
  CreateTeamInput,
  UpdateTeamInput,
} from '@equipment-management/schemas';
import {
  transformPaginatedResponse,
  transformSingleResponse,
  transformArrayResponse,
} from './utils/response-transformers';
import type { PaginatedResponse } from './types';

/**
 * 프론트엔드에서 사용하는 Team 타입
 */
export type Team = Omit<SchemaTeam, 'createdAt' | 'updatedAt' | 'deletedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  deletedAt: string | Date | null;
  // 추가 필드 (조회 시 포함될 수 있음)
  leaderName?: string;
};

/**
 * 팀 유형 정의 — SSOT from @equipment-management/schemas
 */
import type { TeamType } from '@equipment-management/schemas';
export type { TeamType };

/**
 * 팀 유형 → 분류코드 매핑
 */
export const TEAM_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  FCC_EMC_RF: 'E', // FCC EMC/RF
  GENERAL_EMC: 'R', // General EMC
  GENERAL_RF: 'W', // General RF
  SAR: 'S', // SAR
  AUTOMOTIVE_EMC: 'A', // Automotive EMC
  SOFTWARE: 'P', // Software Program
  // 레거시 호환성
  RF: 'E',
  EMC: 'R',
  AUTO: 'A',
};

/**
 * 팀 유형별 메타데이터 (UL 색상 팔레트 기반)
 * ✅ 팀 이름 = 분류 이름 (통일)
 */
export const TEAM_TYPE_CONFIG: Record<
  string,
  {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    label: string;
    classificationCode: string;
  }
> = {
  FCC_EMC_RF: {
    color: '#122C49', // UL Midnight Blue
    bgColor: 'bg-[#122C49]/10',
    borderColor: 'border-[#122C49]',
    icon: 'Radio',
    label: 'FCC EMC/RF',
    classificationCode: 'E',
  },
  GENERAL_EMC: {
    color: '#577E9E', // UL Fog
    bgColor: 'bg-[#577E9E]/10',
    borderColor: 'border-[#577E9E]',
    icon: 'Zap',
    label: 'General EMC',
    classificationCode: 'R',
  },
  GENERAL_RF: {
    color: '#4A90D9', // Blue
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'Radio',
    label: 'General RF',
    classificationCode: 'W',
  },
  SAR: {
    color: '#FF9D55', // UL Warning
    bgColor: 'bg-[#FF9D55]/10',
    borderColor: 'border-[#FF9D55]',
    icon: 'Smartphone',
    label: 'SAR',
    classificationCode: 'S',
  },
  AUTOMOTIVE_EMC: {
    color: '#00A451', // UL Green
    bgColor: 'bg-[#00A451]/10',
    borderColor: 'border-[#00A451]',
    icon: 'Car',
    label: 'Automotive EMC',
    classificationCode: 'A',
  },
  SOFTWARE: {
    color: '#8B5CF6', // Purple
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    icon: 'Code',
    label: 'Software Program',
    classificationCode: 'P',
  },
  // 레거시 호환성 (기존 타입 지원)
  RF: {
    color: '#122C49',
    bgColor: 'bg-[#122C49]/10',
    borderColor: 'border-[#122C49]',
    icon: 'Radio',
    label: 'FCC EMC/RF',
    classificationCode: 'E',
  },
  EMC: {
    color: '#577E9E',
    bgColor: 'bg-[#577E9E]/10',
    borderColor: 'border-[#577E9E]',
    icon: 'Zap',
    label: 'General EMC',
    classificationCode: 'R',
  },
  AUTO: {
    color: '#00A451',
    bgColor: 'bg-[#00A451]/10',
    borderColor: 'border-[#00A451]',
    icon: 'Car',
    label: 'Automotive EMC',
    classificationCode: 'A',
  },
};

/**
 * 사이트 정보
 */
export const SITE_CONFIG = {
  suwon: { label: '수원', code: 'SUW' },
  uiwang: { label: '의왕', code: 'UIW' },
  pyeongtaek: { label: '평택', code: 'PYT' },
} as const;

export type Site = keyof typeof SITE_CONFIG;

/**
 * 팀 조회 쿼리 파라미터
 */
export interface TeamQuery {
  ids?: string;
  search?: string;
  site?: Site;
  type?: TeamType;
  sort?: string;
  page?: number;
  pageSize?: number;
}

/**
 * 팀 멤버 타입
 */
export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  role: string;
  position?: string;
  department?: string;
  phoneNumber?: string;
  employeeId?: string;
  managerName?: string;
  isActive?: boolean;
  site?: string;
  teamId?: string;
  avatarUrl?: string;
}

/**
 * 팀 상세 정보 (멤버, 장비 수 포함)
 */
export interface TeamDetail extends Team {
  members?: TeamMember[];
  equipmentCount?: number;
  memberCount?: number;
}

// 팀 API 객체
const teamsApi = {
  /**
   * 팀 목록 조회
   */
  getTeams: async (query: TeamQuery = {}): Promise<PaginatedResponse<Team>> => {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.TEAMS.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);
    return transformPaginatedResponse<Team>(response);
  },

  /**
   * 팀 상세 조회
   */
  getTeam: async (id: string): Promise<TeamDetail> => {
    const response = await apiClient.get(API_ENDPOINTS.TEAMS.GET(id));
    return transformSingleResponse<TeamDetail>(response);
  },

  /**
   * 팀 생성
   */
  createTeam: async (data: CreateTeamInput): Promise<Team> => {
    const response = await apiClient.post(API_ENDPOINTS.TEAMS.CREATE, data);
    return transformSingleResponse<Team>(response);
  },

  /**
   * 팀 수정
   */
  updateTeam: async (id: string, data: UpdateTeamInput): Promise<Team> => {
    const response = await apiClient.put(API_ENDPOINTS.TEAMS.UPDATE(id), data);
    return transformSingleResponse<Team>(response);
  },

  /**
   * 팀 삭제
   */
  deleteTeam: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.TEAMS.DELETE(id));
  },

  /**
   * 팀 멤버 조회
   */
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.USERS.LIST}?teams=${teamId}`);
    return transformArrayResponse<TeamMember>(response);
  },

  /**
   * 팀에 소속된 장비 수 조회
   */
  getTeamEquipmentCount: async (teamId: string): Promise<number> => {
    const response = await apiClient.get(
      `${API_ENDPOINTS.EQUIPMENT.LIST}?teamId=${teamId}&pageSize=1`
    );
    const result = transformPaginatedResponse<unknown>(response);
    return result.meta.pagination.total;
  },

  /**
   * 사용자 검색 (LeaderCombobox용)
   */
  searchUsers: async (params: {
    search?: string;
    site?: string;
    teams?: string; // Comma-separated team IDs
  }): Promise<TeamMember[]> => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.site) qs.set('site', params.site);
    if (params.teams) qs.set('teams', params.teams); // NEW: Filter by teams
    qs.set('pageSize', '20');
    const response = await apiClient.get(`${API_ENDPOINTS.USERS.LIST}?${qs.toString()}`);
    return transformArrayResponse<TeamMember>(response);
  },

  /**
   * 사용자 역할 변경
   *
   * Conditional WHERE CAS:
   * - currentRole이 서버의 실제 역할과 불일치 시 409 VERSION_CONFLICT
   * - 자기 자신, 범위 외 사용자 시도 시 403
   */
  changeUserRole: async (
    userId: string,
    newRole: string,
    currentRole: string,
    reason?: string
  ): Promise<TeamMember> => {
    const response = await apiClient.patch(API_ENDPOINTS.USERS.CHANGE_ROLE(userId), {
      newRole,
      currentRole,
      ...(reason && { reason }),
    });
    return transformSingleResponse<TeamMember>(response);
  },
};

export default teamsApi;
