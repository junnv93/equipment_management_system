/**
 * ✅ Single Source of Truth: schemas 패키지에서 타입 import
 *
 * 모든 타입은 @equipment-management/schemas 패키지에서 가져옵니다.
 * 하드코딩된 타입 정의는 제거하고 schemas 패키지의 타입을 사용합니다.
 *
 * @see packages/schemas/src/equipment.ts
 * @see docs/development/API_STANDARDS.md
 */
import { apiClient } from './api-client';
import type {
  Equipment as SchemaEquipment,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  EquipmentFilter,
  EquipmentStatus,
} from '@equipment-management/schemas';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';

/**
 * 프론트엔드에서 사용하는 Equipment 타입
 *
 * schemas 패키지의 Equipment 타입을 기본으로 하되,
 * 프론트엔드에서 필요한 추가 필드만 확장합니다.
 *
 * 주의: id는 백엔드에서 number로 반환되지만, 프론트엔드에서는 string으로 처리합니다.
 */
export type Equipment = Omit<SchemaEquipment, 'id' | 'createdAt' | 'updatedAt'> & {
  id: string | number; // 백엔드에서 number로 반환되지만 string으로도 처리 가능
  uuid: string; // 백엔드에서 반환하는 UUID (필수)
  // 프론트엔드 전용 추가 필드
  model?: string; // 하위 호환성 (modelName의 별칭)
  teamName?: string; // 팀 이름 (조회 시 조인된 데이터)
  image?: string; // 이미지 URL
  createdAt: string | Date;
  updatedAt: string | Date;
};

/**
 * 장비 쿼리 파라미터 타입
 *
 * schemas 패키지의 EquipmentFilter를 기본으로 사용하되,
 * 프론트엔드에서 필요한 추가 필드만 확장합니다.
 *
 * 주의: EquipmentFilter의 page, pageSize는 기본값이 있으므로 선택적입니다.
 */
export type EquipmentQuery = Partial<EquipmentFilter> & {
  category?: string; // 레거시 호환성
  sortBy?: string; // 레거시 호환성
  sortOrder?: 'asc' | 'desc'; // 레거시 호환성
};

/**
 * 장비 생성 DTO
 *
 * schemas 패키지의 CreateEquipmentInput을 기본으로 사용하되,
 * 프론트엔드에서 필요한 추가 필드(image 파일)만 확장합니다.
 */
export type CreateEquipmentDto = CreateEquipmentInput & {
  image?: File | null; // 프론트엔드에서 파일 업로드용
};

/**
 * 장비 수정 DTO
 *
 * schemas 패키지의 UpdateEquipmentInput을 기본으로 사용하되,
 * 프론트엔드에서 필요한 추가 필드(image 파일)만 확장합니다.
 */
export type UpdateEquipmentDto = UpdateEquipmentInput & {
  image?: File | null; // 프론트엔드에서 파일 업로드용
};

/**
 * 장비 생성/수정 응답 타입
 *
 * 승인 프로세스가 필요한 경우 requestUuid가 반환되고,
 * 직접 승인되는 경우 Equipment가 반환됩니다.
 */
export type EquipmentMutationResponse = Equipment & {
  requestUuid?: string; // 승인 요청이 생성된 경우 반환되는 UUID
};

// 이력 관리 타입
export interface LocationHistoryItem {
  id: string;
  equipmentId: string;
  changedAt: string | Date;
  newLocation: string;
  notes?: string;
  changedBy?: string;
  changedByName?: string;
  createdAt: string | Date;
}

export interface MaintenanceHistoryItem {
  id: string;
  equipmentId: string;
  performedAt: string | Date;
  content: string;
  performedBy?: string;
  performedByName?: string;
  createdAt: string | Date;
}

export type IncidentType = 'damage' | 'malfunction' | 'change' | 'repair';

export interface IncidentHistoryItem {
  id: string;
  equipmentId: string;
  occurredAt: string | Date;
  incidentType: IncidentType;
  content: string;
  reportedBy?: string;
  reportedByName?: string;
  createdAt: string | Date;
}

export interface CreateLocationHistoryInput {
  changedAt: string;
  newLocation: string;
  notes?: string;
}

export interface CreateMaintenanceHistoryInput {
  performedAt: string;
  content: string;
}

export interface CreateIncidentHistoryInput {
  occurredAt: string;
  incidentType: IncidentType;
  content: string;
}

// 장비 API 객체
const equipmentApi = {
  // 장비 목록 조회
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  getEquipmentList: async (
    query: EquipmentQuery = {} as EquipmentQuery
  ): Promise<PaginatedResponse<Equipment>> => {
    const params = new URLSearchParams();

    // 쿼리 파라미터 설정
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `/api/equipment${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);
    // ✅ 공통 유틸리티 사용: 백엔드 응답을 프론트엔드 형식으로 변환
    return transformPaginatedResponse<Equipment>(response);
  },

  // 장비 상세 조회
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  getEquipment: async (id: string): Promise<Equipment> => {
    const response = await apiClient.get(`/api/equipment/${id}`);
    return transformSingleResponse<Equipment>(response);
  },

  // 장비 상세 조회 (별칭 - 하위 호환성)
  getById: async (id: string): Promise<Equipment> => {
    const response = await apiClient.get(`/api/equipment/${id}`);
    return transformSingleResponse<Equipment>(response);
  },

  // 장비 생성
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  // ✅ schemas 패키지의 CreateEquipmentInput 타입 사용
  createEquipment: async (
    data: CreateEquipmentDto,
    files?: File[]
  ): Promise<EquipmentMutationResponse> => {
    let response;

    // 파일이 포함된 경우 FormData로 처리
    const { image, ...equipmentData } = data;
    const allFiles = [...(image ? [image] : []), ...(files || [])];

    if (allFiles.length > 0) {
      const formData = new FormData();

      // FormData에 장비 데이터 추가
      Object.entries(equipmentData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Date 객체는 ISO 문자열로 변환
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // 파일 추가
      allFiles.forEach((file) => {
        formData.append('files', file);
      });

      response = await apiClient.post('/api/equipment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // 일반 JSON 데이터인 경우
      response = await apiClient.post('/api/equipment', equipmentData);
    }

    return transformSingleResponse<EquipmentMutationResponse>(response);
  },

  // 장비 수정
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  updateEquipment: async (
    id: string,
    data: UpdateEquipmentDto,
    files?: File[]
  ): Promise<EquipmentMutationResponse> => {
    let response;

    // 파일이 포함된 경우 FormData로 처리
    const { image, ...equipmentData } = data;
    const allFiles = [...(image ? [image] : []), ...(files || [])];

    if (allFiles.length > 0) {
      const formData = new FormData();

      // FormData에 장비 데이터 추가
      Object.entries(equipmentData).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Date 객체는 ISO 문자열로 변환
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // 파일 추가
      allFiles.forEach((file) => {
        formData.append('files', file);
      });

      response = await apiClient.patch(`/api/equipment/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // 일반 JSON 데이터인 경우
      response = await apiClient.patch(`/api/equipment/${id}`, equipmentData);
    }

    return transformSingleResponse<EquipmentMutationResponse>(response);
  },

  // 장비 삭제
  deleteEquipment: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/equipment/${id}`);
  },

  // 장비 상태 변경
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  // ✅ API_STANDARDS 준수: EquipmentStatus 타입 사용
  updateEquipmentStatus: async (id: string, status: EquipmentStatus): Promise<Equipment> => {
    const response = await apiClient.patch(`/api/equipment/${id}/status`, { status });
    return transformSingleResponse<Equipment>(response);
  },

  // 교정 예정 장비 조회
  getCalibrationDueEquipment: async (days: number = 30): Promise<Equipment[]> => {
    return apiClient.get(`/api/equipment/calibration/due?days=${days}`);
  },

  // 팀별 장비 조회
  getTeamEquipment: async (teamId: string): Promise<Equipment[]> => {
    return apiClient.get(`/api/equipment/team/${teamId}`);
  },

  // ========== 승인 프로세스 API ==========

  // 승인 대기 요청 목록 조회
  getPendingRequests: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/equipment/requests/pending');
    return response.data || [];
  },

  // 요청 상세 조회
  getRequestByUuid: async (requestUuid: string): Promise<any> => {
    const response = await apiClient.get(`/api/equipment/requests/${requestUuid}`);
    return response.data;
  },

  // 요청 승인
  approveRequest: async (requestUuid: string): Promise<any> => {
    const response = await apiClient.post(`/api/equipment/requests/${requestUuid}/approve`);
    return response.data;
  },

  // 요청 반려
  rejectRequest: async (requestUuid: string, rejectionReason: string): Promise<any> => {
    const response = await apiClient.post(`/api/equipment/requests/${requestUuid}/reject`, {
      rejectionReason,
    });
    return response.data;
  },

  // 파일 업로드
  uploadAttachment: async (
    file: File,
    attachmentType: 'inspection_report' | 'history_card' | 'other',
    description?: string
  ): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachmentType', attachmentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post('/api/equipment/attachments', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ========== 공용장비 API ==========

  // 공용장비 등록
  createSharedEquipment: async (
    data: {
      name: string;
      managementNumber: string;
      sharedSource: 'safety_lab' | 'external';
      site: 'suwon' | 'uiwang';
      modelName?: string;
      manufacturer?: string;
      serialNumber?: string;
      location?: string;
      description?: string;
      calibrationCycle?: number;
      lastCalibrationDate?: Date | string;
      calibrationAgency?: string;
      calibrationMethod?: string;
    },
    files?: File[]
  ): Promise<Equipment> => {
    let response;

    if (files && files.length > 0) {
      const formData = new FormData();

      // FormData에 장비 데이터 추가
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (value instanceof Date) {
            formData.append(key, value.toISOString());
          } else {
            formData.append(key, String(value));
          }
        }
      });

      // 파일 추가
      files.forEach((file) => {
        formData.append('files', file);
      });

      response = await apiClient.post('/api/equipment/shared', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      response = await apiClient.post('/api/equipment/shared', data);
    }

    // 응답에서 equipment 객체 추출
    const responseData = response.data || response;
    return responseData.equipment || transformSingleResponse<Equipment>(response);
  },

  // ========== 이력 관리 API ==========

  // 위치 변동 이력 조회
  getLocationHistory: async (equipmentUuid: string): Promise<LocationHistoryItem[]> => {
    const response = await apiClient.get(`/api/equipment/${equipmentUuid}/location-history`);
    return response.data || response;
  },

  // 위치 변동 이력 추가
  createLocationHistory: async (
    equipmentUuid: string,
    data: CreateLocationHistoryInput
  ): Promise<LocationHistoryItem> => {
    const response = await apiClient.post(`/api/equipment/${equipmentUuid}/location-history`, data);
    return response.data || response;
  },

  // 위치 변동 이력 삭제
  deleteLocationHistory: async (historyId: string): Promise<void> => {
    return apiClient.delete(`/api/equipment/location-history/${historyId}`);
  },

  // 유지보수 내역 조회
  getMaintenanceHistory: async (equipmentUuid: string): Promise<MaintenanceHistoryItem[]> => {
    const response = await apiClient.get(`/api/equipment/${equipmentUuid}/maintenance-history`);
    return response.data || response;
  },

  // 유지보수 내역 추가
  createMaintenanceHistory: async (
    equipmentUuid: string,
    data: CreateMaintenanceHistoryInput
  ): Promise<MaintenanceHistoryItem> => {
    const response = await apiClient.post(
      `/api/equipment/${equipmentUuid}/maintenance-history`,
      data
    );
    return response.data || response;
  },

  // 유지보수 내역 삭제
  deleteMaintenanceHistory: async (historyId: string): Promise<void> => {
    return apiClient.delete(`/api/equipment/maintenance-history/${historyId}`);
  },

  // 손상/오작동/변경/수리 내역 조회
  getIncidentHistory: async (equipmentUuid: string): Promise<IncidentHistoryItem[]> => {
    const response = await apiClient.get(`/api/equipment/${equipmentUuid}/incident-history`);
    return response.data || response;
  },

  // 손상/오작동/변경/수리 내역 추가
  createIncidentHistory: async (
    equipmentUuid: string,
    data: CreateIncidentHistoryInput
  ): Promise<IncidentHistoryItem> => {
    const response = await apiClient.post(`/api/equipment/${equipmentUuid}/incident-history`, data);
    return response.data || response;
  },

  // 손상/오작동/변경/수리 내역 삭제
  deleteIncidentHistory: async (historyId: string): Promise<void> => {
    return apiClient.delete(`/api/equipment/incident-history/${historyId}`);
  },

  // 교정 이력 조회 (기존 Calibrations API 활용)
  getCalibrationHistory: async (equipmentUuid: string): Promise<any[]> => {
    const response = await apiClient.get(`/api/calibrations?equipmentId=${equipmentUuid}`);
    const responseData = response as any;
    return responseData.data?.items || responseData.items || responseData.data || [];
  },
};

export default equipmentApi;
