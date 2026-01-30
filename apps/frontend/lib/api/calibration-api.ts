import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import { transformArrayResponse } from './utils/response-transformers';
import type {
  CalibrationResult,
  CalibrationApprovalStatus,
  CalibrationRegisteredByRole,
} from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

export interface Calibration {
  id: string;
  equipmentId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  calibrationCycle: number;
  certificateNumber?: string; // 교정성적서 번호
  certificatePath?: string; // 교정성적서 파일 경로
  calibrationResult: CalibrationResult | 'PASS' | 'FAIL' | 'CONDITIONAL'; // SSOT + 레거시 지원
  notes?: string;
  // 승인 프로세스 필드
  approvalStatus?: CalibrationApprovalStatus;
  registeredBy?: string;
  approvedBy?: string;
  registeredByRole?: CalibrationRegisteredByRole;
  registrarComment?: string;
  approverComment?: string;
  rejectionReason?: string;
  intermediateCheckDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalibrationHistory {
  id: string;
  equipmentId: string;
  equipmentName: string;
  managementNumber: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  certificateNumber?: string;
  calibrationResult: CalibrationResult | 'PASS' | 'FAIL' | 'CONDITIONAL';
  team?: string;
  teamId?: string; // ✅ Team ID for filtering
  approvalStatus?: CalibrationApprovalStatus;
  registeredByRole?: CalibrationRegisteredByRole;
  createdAt: string;
}

export interface CalibrationQuery {
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  result?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  approvalStatus?: string;
}

export interface CreateCalibrationDto {
  equipmentId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  certificateNumber?: string; // 교정성적서 번호
  calibrationCycle: number;
  calibrationResult: CalibrationResult;
  notes?: string;
  // 승인 프로세스 필드
  registeredBy?: string;
  registeredByRole?: CalibrationRegisteredByRole;
  registrarComment?: string;
  intermediateCheckDate?: string;
}

export interface UpdateCalibrationDto extends Partial<CreateCalibrationDto> {}

export interface ApproveCalibrationDto {
  approverId: string;
  approverComment: string;
}

export interface RejectCalibrationDto {
  approverId: string;
  rejectionReason: string;
}

export interface CalibrationSummary {
  total: number;
  overdueCount: number;
  dueInMonthCount: number;
  passCount: number;
  failCount: number;
}

// 교정 API 객체
const calibrationApi = {
  // 교정 이력 목록 조회
  getCalibrationHistory: async (
    query: CalibrationQuery = {}
  ): Promise<PaginatedResponse<CalibrationHistory>> => {
    const params = new URLSearchParams();

    // 쿼리 파라미터 설정
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `${API_ENDPOINTS.CALIBRATIONS.HISTORY_LIST}${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);

    // ✅ CRITICAL FIX: axios returns AxiosResponse, need to access response.data
    // Transform backend format { items, meta } to frontend format { data, meta.pagination }
    const responseData = response.data;

    if (responseData && 'items' in responseData) {
      return {
        data: responseData.items,
        meta: {
          pagination: {
            total: responseData.meta?.totalItems || 0,
            pageSize: responseData.meta?.itemsPerPage || 20,
            currentPage: responseData.meta?.currentPage || 1,
            totalPages: responseData.meta?.totalPages || 1,
          },
        },
      };
    }

    return responseData;
  },

  // 장비별 교정 이력 조회
  // ✅ transformArrayResponse: 다양한 백엔드 응답 형태 자동 처리
  getEquipmentCalibrations: async (equipmentId: string): Promise<Calibration[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.HISTORY(equipmentId));
    return transformArrayResponse<Calibration>(response);
  },

  // 교정 상세 조회
  getCalibration: async (id: string): Promise<Calibration> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.GET(id));
    return response.data;
  },

  // 교정 정보 등록
  createCalibration: async (data: CreateCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.post(API_ENDPOINTS.CALIBRATIONS.CREATE, data);
    return response.data;
  },

  // 교정 정보 수정
  updateCalibration: async (id: string, data: UpdateCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.patch(API_ENDPOINTS.CALIBRATIONS.UPDATE(id), data);
    return response.data;
  },

  // 교정 정보 삭제
  deleteCalibration: async (id: string): Promise<void> => {
    const response = await apiClient.delete(API_ENDPOINTS.CALIBRATIONS.DELETE(id));
    return response.data;
  },

  // 교정 요약 통계
  getCalibrationSummary: async (): Promise<CalibrationSummary> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.SUMMARY);
    return response.data;
  },

  // 교정 기한 초과 장비
  getOverdueCalibrations: async (): Promise<CalibrationHistory[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.OVERDUE);
    return response.data;
  },

  // 곧 교정이 필요한 장비
  getUpcomingCalibrations: async (days: number = 30): Promise<CalibrationHistory[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.UPCOMING(days));
    return response.data;
  },

  // 승인 대기 교정 목록 조회
  getPendingCalibrations: async (): Promise<{ items: Calibration[] }> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.PENDING);
    return response.data;
  },

  // 교정 승인
  approveCalibration: async (id: string, data: ApproveCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.patch(API_ENDPOINTS.CALIBRATIONS.APPROVE(id), data);
    return response.data;
  },

  // 교정 반려
  rejectCalibration: async (id: string, data: RejectCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.patch(API_ENDPOINTS.CALIBRATIONS.REJECT(id), data);
    return response.data;
  },

  // 중간점검 예정 조회
  getUpcomingIntermediateChecks: async (days: number = 7): Promise<Calibration[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.LIST(days));
    return response.data;
  },

  // 교정성적서 파일 업로드
  uploadCertificate: async (
    calibrationId: string,
    file: File
  ): Promise<{ filePath: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post(API_ENDPOINTS.CALIBRATIONS.CERTIFICATE(calibrationId), formData);
  },
};

export default calibrationApi;
