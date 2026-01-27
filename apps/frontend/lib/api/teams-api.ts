/**
 * 팀 관리 API 클라이언트
 *
 * ✅ Single Source of Truth: schemas 패키지에서 타입 import
 * ✅ Client Component에서 사용하는 API 함수들
 *
 * @see packages/schemas/src/team.ts
 */
import { apiClient } from './api-client';
import type {
  Team as SchemaTeam,
  CreateTeamInput,
  UpdateTeamInput,
} from '@equipment-management/schemas';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
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
 * 팀 유형 정의 (분류와 1:1 매핑)
 * ✅ 팀 이름 = 분류 이름 (통일)
 */
export type TeamType = 'FCC_EMC_RF' | 'GENERAL_EMC' | 'GENERAL_RF' | 'SAR' | 'AUTOMOTIVE_EMC' | 'SOFTWARE';

/**
 * 팀 유형 → 분류코드 매핑
 */
export const TEAM_TYPE_TO_CLASSIFICATION: Record<string, string> = {
  FCC_EMC_RF: 'E',     // FCC EMC/RF
  GENERAL_EMC: 'R',    // General EMC
  GENERAL_RF: 'W',     // General RF
  SAR: 'S',            // SAR
  AUTOMOTIVE_EMC: 'A', // Automotive EMC
  SOFTWARE: 'P',       // Software Program
  // 레거시 호환성
  RF: 'E',
  EMC: 'R',
  AUTO: 'A',
};

/**
 * 팀 유형별 메타데이터 (UL 색상 팔레트 기반)
 * ✅ 팀 이름 = 분류 이름 (통일)
 */
export const TEAM_TYPE_CONFIG: Record<string, {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
  label: string;
  classificationCode: string;
}> = {
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

    const url = `/api/teams${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);

    // 백엔드 응답 형식에 맞게 변환
    if (response.data && 'data' in response.data) {
      const backendData = response.data;
      return {
        data: backendData.data || [],
        meta: {
          pagination: {
            total: backendData.meta?.pagination?.total || 0,
            pageSize: backendData.meta?.pagination?.pageSize || 20,
            currentPage: backendData.meta?.pagination?.page || 1,
            totalPages: backendData.meta?.pagination?.totalPages || 1,
          },
        },
      };
    }

    return transformPaginatedResponse<Team>(response);
  },

  /**
   * 팀 상세 조회
   */
  getTeam: async (id: string): Promise<TeamDetail> => {
    const response = await apiClient.get(`/api/teams/${id}`);
    return transformSingleResponse<TeamDetail>(response);
  },

  /**
   * 팀 생성
   */
  createTeam: async (data: CreateTeamInput): Promise<Team> => {
    const response = await apiClient.post('/api/teams', data);
    return transformSingleResponse<Team>(response);
  },

  /**
   * 팀 수정
   */
  updateTeam: async (id: string, data: UpdateTeamInput): Promise<Team> => {
    const response = await apiClient.put(`/api/teams/${id}`, data);
    return transformSingleResponse<Team>(response);
  },

  /**
   * 팀 삭제
   */
  deleteTeam: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/teams/${id}`);
  },

  /**
   * 팀 멤버 조회
   */
  getTeamMembers: async (teamId: string): Promise<TeamMember[]> => {
    const response = await apiClient.get(`/api/v1/users?teamId=${teamId}`);
    const data = response.data;
    return data?.data || data?.items || [];
  },

  /**
   * 팀에 소속된 장비 수 조회
   */
  getTeamEquipmentCount: async (teamId: string): Promise<number> => {
    const response = await apiClient.get(`/api/equipment?teamId=${teamId}&pageSize=1`);
    const data = response.data;
    return data?.meta?.pagination?.total || data?.meta?.totalItems || 0;
  },
};

export default teamsApi;
