import { apiClient } from './api-client';
import type { SingleResourceResponse } from '@equipment-management/schemas';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';

export interface Calibration {
  id: string;
  equipmentId: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  calibrationAgency: string;
  calibrationCycle: number;
  calibrationResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
  // 승인 프로세스 필드
  approvalStatus?: 'pending_approval' | 'approved' | 'rejected';
  registeredBy?: string;
  approvedBy?: string;
  registeredByRole?: 'test_engineer' | 'technical_manager';
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
  calibrationResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  team?: string;
  approvalStatus?: string;
  registeredByRole?: string;
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
  calibrationCycle: number;
  calibrationResult: 'PASS' | 'FAIL' | 'CONDITIONAL';
  notes?: string;
  // 승인 프로세스 필드
  registeredBy?: string;
  registeredByRole?: 'test_engineer' | 'technical_manager';
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

    const url = `/api/calibration${params.toString() ? `?${params.toString()}` : ''}`;
    return apiClient.get(url);
  },

  // 장비별 교정 이력 조회
  // 백엔드는 페이지네이션 응답 { items: [...], meta: {...} }를 반환
  // 여기서 items 배열만 추출하여 반환
  getEquipmentCalibrations: async (equipmentId: string): Promise<Calibration[]> => {
    const response = await apiClient.get(`/api/calibration/equipment/${equipmentId}`);
    const data = response.data || response;

    // 배열이면 그대로 반환, 페이지네이션 객체면 items 추출
    if (Array.isArray(data)) {
      return data;
    }
    return data.items || [];
  },

  // 교정 상세 조회
  getCalibration: async (id: string): Promise<Calibration> => {
    return apiClient.get(`/api/calibration/${id}`);
  },

  // 교정 정보 등록
  createCalibration: async (data: CreateCalibrationDto): Promise<Calibration> => {
    return apiClient.post('/api/calibration', data);
  },

  // 교정 정보 수정
  updateCalibration: async (id: string, data: UpdateCalibrationDto): Promise<Calibration> => {
    return apiClient.patch(`/api/calibration/${id}`, data);
  },

  // 교정 정보 삭제
  deleteCalibration: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/calibration/${id}`);
  },

  // 교정 요약 통계
  getCalibrationSummary: async (): Promise<CalibrationSummary> => {
    return apiClient.get('/api/calibration/summary');
  },

  // 교정 기한 초과 장비
  getOverdueCalibrations: async (): Promise<CalibrationHistory[]> => {
    return apiClient.get('/api/calibration/overdue');
  },

  // 곧 교정이 필요한 장비
  getUpcomingCalibrations: async (days: number = 30): Promise<CalibrationHistory[]> => {
    return apiClient.get(`/api/calibration/upcoming?days=${days}`);
  },

  // 승인 대기 교정 목록 조회
  getPendingCalibrations: async (): Promise<{ items: Calibration[] }> => {
    return apiClient.get('/api/calibration/pending');
  },

  // 교정 승인
  approveCalibration: async (id: string, data: ApproveCalibrationDto): Promise<Calibration> => {
    return apiClient.patch(`/api/calibration/${id}/approve`, data);
  },

  // 교정 반려
  rejectCalibration: async (id: string, data: RejectCalibrationDto): Promise<Calibration> => {
    return apiClient.patch(`/api/calibration/${id}/reject`, data);
  },

  // 중간점검 예정 조회
  getUpcomingIntermediateChecks: async (days: number = 7): Promise<Calibration[]> => {
    return apiClient.get(`/api/calibration/intermediate-checks?days=${days}`);
  },
};

export default calibrationApi;
