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
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type {
  EquipmentResponse as SchemaEquipmentResponse,
  CreateEquipmentInput,
  UpdateEquipmentInput,
  EquipmentFilter,
  EquipmentStatus,
  EquipmentRequest,
  EquipmentAttachment,
  IncidentType,
} from '@equipment-management/schemas';
import {
  transformPaginatedResponse,
  transformSingleResponse,
  transformArrayResponse,
} from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import { createFormData as createFormDataUtil } from '../utils/form-data-utils';

/**
 * 프론트엔드에서 사용하는 Equipment 타입
 *
 * ✅ schemas 패키지의 EquipmentResponse 타입을 기본으로 사용
 * - teamName 필드가 포함되어 있음 (백엔드에서 팀 테이블 조인)
 * - 프론트엔드에서 필요한 추가 필드만 확장
 *
 * ✅ Phase 1: Equipment Module - 2026-02-11
 * - version 필드 추가 (Optimistic Locking)
 *
 * @see packages/schemas/src/equipment.ts - EquipmentResponse
 */
export type Equipment = Omit<SchemaEquipmentResponse, 'id' | 'createdAt' | 'updatedAt'> & {
  id: string | number; // 백엔드에서 UUID로 반환되지만 레거시 호환성 유지
  // 프론트엔드 전용 추가 필드
  model?: string; // 하위 호환성 (modelName의 별칭)
  image?: string; // 이미지 URL
  createdAt: string | Date;
  updatedAt: string | Date;
  // 임시등록 장비 전용 필드 (공용/렌탈)
  usagePeriodStart?: string | Date;
  usagePeriodEnd?: string | Date;
  // Optimistic locking (Phase 1)
  version: number;
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
 * ✅ Phase 1: Equipment Module - 2026-02-11
 * ✅ Optimistic Locking: version 필드 필수
 *
 * schemas 패키지의 UpdateEquipmentInput을 기본으로 사용하되,
 * 프론트엔드에서 필요한 추가 필드(image 파일, version)만 확장합니다.
 */
export type UpdateEquipmentDto = UpdateEquipmentInput & {
  image?: File | null; // 프론트엔드에서 파일 업로드용
  version: number; // Optimistic locking version (필수)
};

/**
 * 장비 생성/수정 응답 타입 (discriminated union)
 *
 * 직접 승인되는 경우 Equipment가 반환되고,
 * 승인 프로세스가 필요한 경우 { message, requestUuid, request }가 반환됩니다.
 */
export type EquipmentMutationResponse =
  | Equipment
  | { message: string; requestUuid: string; request: Record<string, unknown> };

/**
 * 승인 요청 응답인지 판별하는 타입 가드
 */
export function isApprovalResponse(
  res: EquipmentMutationResponse
): res is { message: string; requestUuid: string; request: Record<string, unknown> } {
  return 'requestUuid' in res;
}

// 이력 관리 타입
export interface LocationHistoryItem {
  id: string;
  equipmentId: string;
  changedAt: string | Date;
  previousLocation?: string;
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

export type { IncidentType };

export interface IncidentHistoryItem {
  id: string;
  equipmentId: string;
  occurredAt: string | Date;
  incidentType: IncidentType;
  content: string;
  reportedBy?: string;
  reportedByName?: string;
  createdAt: string | Date;
  nonConformanceId?: string; // 연결된 부적합 ID (부적합 생성된 경우)
}

export interface CreateLocationHistoryInput {
  changedAt: string;
  newLocation: string;
  notes?: string;
  version?: number;
}

export interface CreateMaintenanceHistoryInput {
  performedAt: string;
  content: string;
}

export interface CreateIncidentHistoryInput {
  occurredAt: string;
  incidentType: IncidentType;
  content: string;
  // 부적합 생성 관련 필드 (선택)
  createNonConformance?: boolean;
  changeEquipmentStatus?: boolean;
  actionPlan?: string;
}

// 장비 API 객체
/**
 * 관리번호 중복 검사 결과 타입
 */
export interface ManagementNumberCheckResult {
  /** 사용 가능 여부 */
  available: boolean;
  /** 안내 메시지 */
  message: string;
  /** 중복된 장비 정보 (중복 시에만) */
  existingEquipment?: {
    id: string;
    name: string;
    managementNumber: string;
  };
}

const equipmentApi = {
  /**
   * 관리번호 중복 검사
   *
   * 장비 등록/수정 시 실시간으로 관리번호 중복 여부를 확인합니다.
   *
   * @param managementNumber - 검사할 관리번호
   * @param excludeId - 제외할 장비 ID (수정 시 현재 장비)
   * @returns 사용 가능 여부와 메시지
   *
   * @example
   * // 등록 시
   * const result = await equipmentApi.checkManagementNumber('SUW-E0001');
   * if (!result.available) {
   *   console.log(result.message); // "관리번호 'SUW-E0001'은(는) 이미 '스펙트럼 분석기' 장비에서 사용 중입니다."
   * }
   *
   * @example
   * // 수정 시 (현재 장비 제외)
   * const result = await equipmentApi.checkManagementNumber('SUW-E0001', 'current-equipment-uuid');
   */
  checkManagementNumber: async (
    managementNumber: string,
    excludeId?: string
  ): Promise<ManagementNumberCheckResult> => {
    const params = new URLSearchParams({ managementNumber });
    if (excludeId) {
      params.append('excludeId', excludeId);
    }

    const response = await apiClient.get(
      `${API_ENDPOINTS.EQUIPMENT.CHECK_MANAGEMENT_NUMBER}?${params.toString()}`
    );
    return transformSingleResponse<ManagementNumberCheckResult>(response);
  },

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

    const url = `${API_ENDPOINTS.EQUIPMENT.LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);
    // ✅ 공통 유틸리티 사용: 백엔드 응답을 프론트엔드 형식으로 변환
    return transformPaginatedResponse<Equipment>(response);
  },

  // 장비 상세 조회
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  getEquipment: async (id: string): Promise<Equipment> => {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.GET(id));
    return transformSingleResponse<Equipment>(response);
  },

  // 장비 상세 조회 (별칭 - 하위 호환성)
  getById: async (id: string): Promise<Equipment> => {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.GET(id));
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
      /**
       * ✅ SSOT: createFormDataUtil 사용
       * - Date → ISO 문자열 자동 변환
       * - undefined/null/빈 문자열 자동 제거
       * - 일관된 타입 변환 로직
       */
      const formData = createFormDataUtil(equipmentData, allFiles);

      response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.CREATE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // 일반 JSON 데이터인 경우
      response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.CREATE, equipmentData);
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
      /**
       * ✅ SSOT: createFormDataUtil 사용
       * - Date → ISO 문자열 자동 변환
       * - undefined/null/빈 문자열 자동 제거
       * - 일관된 타입 변환 로직
       */
      const formData = createFormDataUtil(equipmentData, allFiles);

      response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT.UPDATE(id), formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      // 일반 JSON 데이터인 경우
      response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT.UPDATE(id), equipmentData);
    }

    return transformSingleResponse<EquipmentMutationResponse>(response);
  },

  // 장비 삭제 — CAS version 전달 (동시 수정 방지)
  deleteEquipment: async (id: string, version?: number): Promise<void> => {
    const url =
      version !== undefined
        ? `${API_ENDPOINTS.EQUIPMENT.DELETE(id)}?version=${version}`
        : API_ENDPOINTS.EQUIPMENT.DELETE(id);
    return apiClient.delete(url);
  },

  // 장비 상태 변경
  // ✅ 공통 유틸리티 사용: 중복 제거 및 일관성 보장
  // ✅ API_STANDARDS 준수: EquipmentStatus 타입 사용
  // ✅ Phase 1: Equipment Module - 2026-02-11
  // ✅ Optimistic Locking: version 필드 추가
  updateEquipmentStatus: async (
    id: string,
    status: EquipmentStatus,
    version: number
  ): Promise<Equipment> => {
    const response = await apiClient.patch(API_ENDPOINTS.EQUIPMENT.STATUS(id), { status, version });
    return transformSingleResponse<Equipment>(response);
  },

  // 교정 예정 장비 조회
  getCalibrationDueEquipment: async (days: number = 30): Promise<Equipment[]> => {
    const response = await apiClient.get(`${API_ENDPOINTS.EQUIPMENT.CALIBRATION_DUE}?days=${days}`);
    return transformArrayResponse<Equipment>(response);
  },

  // 팀별 장비 조회
  getTeamEquipment: async (teamId: string): Promise<Equipment[]> => {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.TEAM(teamId));
    return transformArrayResponse<Equipment>(response);
  },

  // ========== 승인 프로세스 API ==========

  /**
   * 장비 요청 타입 (승인 대기 목록, 요청 상세 등)
   */
  // 승인 대기 요청 목록 조회
  getPendingRequests: async (): Promise<EquipmentRequest[]> => {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.PENDING);
    return transformArrayResponse<EquipmentRequest>(response);
  },

  // 요청 상세 조회
  getRequestByUuid: async (requestUuid: string): Promise<EquipmentRequest> => {
    const response = await apiClient.get(API_ENDPOINTS.EQUIPMENT.REQUESTS.GET(requestUuid));
    return transformSingleResponse<EquipmentRequest>(response);
  },

  // 요청 승인 (CAS: version 필수)
  approveRequest: async (requestUuid: string, version: number): Promise<EquipmentRequest> => {
    const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.APPROVE(requestUuid), {
      version,
    });
    return transformSingleResponse<EquipmentRequest>(response);
  },

  // 요청 반려 (CAS: version 필수)
  rejectRequest: async (
    requestUuid: string,
    rejectionReason: string,
    version: number
  ): Promise<EquipmentRequest> => {
    const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.REQUESTS.REJECT(requestUuid), {
      rejectionReason,
      version,
    });
    return transformSingleResponse<EquipmentRequest>(response);
  },

  // 파일 업로드
  uploadAttachment: async (
    file: File,
    attachmentType: string,
    description?: string
  ): Promise<EquipmentAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('attachmentType', attachmentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.ATTACHMENTS, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return transformSingleResponse<EquipmentAttachment>(response);
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
      /**
       * ✅ SSOT: createFormDataUtil 사용
       * - Date → ISO 문자열 자동 변환
       * - undefined/null/빈 문자열 자동 제거
       */
      const formData = createFormDataUtil(data, files);

      response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.SHARED, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } else {
      response = await apiClient.post(API_ENDPOINTS.EQUIPMENT.SHARED, data);
    }

    // 응답에서 equipment 객체 추출 (백엔드가 { equipment: {...} } 형태로 반환하는 경우 처리)
    const responseData = response.data as { equipment?: Equipment } | Equipment | undefined;
    if (responseData && typeof responseData === 'object' && 'equipment' in responseData) {
      return responseData.equipment as Equipment;
    }
    return transformSingleResponse<Equipment>(response);
  },

  // ========== 이력 관리 API ==========

  // 위치 변동 이력 조회
  getLocationHistory: async (equipmentUuid: string): Promise<LocationHistoryItem[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.LIST(equipmentUuid)
    );
    return transformArrayResponse<LocationHistoryItem>(response);
  },

  // 위치 변동 이력 추가
  createLocationHistory: async (
    equipmentUuid: string,
    data: CreateLocationHistoryInput
  ): Promise<LocationHistoryItem> => {
    const response = await apiClient.post(
      API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.CREATE(equipmentUuid),
      data
    );
    return transformSingleResponse<LocationHistoryItem>(response);
  },

  // 위치 변동 이력 삭제 (version: CAS 동시 수정 방지)
  deleteLocationHistory: async (historyId: string, version?: number): Promise<void> => {
    const url =
      version !== undefined
        ? `${API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(historyId)}?version=${version}`
        : API_ENDPOINTS.EQUIPMENT.LOCATION_HISTORY.DELETE(historyId);
    return apiClient.delete(url);
  },

  // 유지보수 내역 조회
  getMaintenanceHistory: async (equipmentUuid: string): Promise<MaintenanceHistoryItem[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.LIST(equipmentUuid)
    );
    return transformArrayResponse<MaintenanceHistoryItem>(response);
  },

  // 유지보수 내역 추가
  createMaintenanceHistory: async (
    equipmentUuid: string,
    data: CreateMaintenanceHistoryInput
  ): Promise<MaintenanceHistoryItem> => {
    const response = await apiClient.post(
      API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.CREATE(equipmentUuid),
      data
    );
    return transformSingleResponse<MaintenanceHistoryItem>(response);
  },

  // 유지보수 내역 삭제
  deleteMaintenanceHistory: async (historyId: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.EQUIPMENT.MAINTENANCE_HISTORY.DELETE(historyId));
  },

  // 손상/오작동/변경/수리 내역 조회
  getIncidentHistory: async (equipmentUuid: string): Promise<IncidentHistoryItem[]> => {
    const response = await apiClient.get(
      API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.LIST(equipmentUuid)
    );
    return transformArrayResponse<IncidentHistoryItem>(response);
  },

  // 손상/오작동/변경/수리 내역 추가
  createIncidentHistory: async (
    equipmentUuid: string,
    data: CreateIncidentHistoryInput
  ): Promise<IncidentHistoryItem> => {
    const response = await apiClient.post(
      API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.CREATE(equipmentUuid),
      data
    );
    return transformSingleResponse<IncidentHistoryItem>(response);
  },

  // 손상/오작동/변경/수리 내역 삭제
  deleteIncidentHistory: async (historyId: string): Promise<void> => {
    return apiClient.delete(API_ENDPOINTS.EQUIPMENT.INCIDENT_HISTORY.DELETE(historyId));
  },
};

export default equipmentApi;
