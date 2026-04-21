import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';
import {
  transformArrayResponse,
  transformSingleResponse,
  transformPaginatedResponse,
} from './utils/response-transformers';
import type {
  CalibrationApprovalStatus,
  CalibrationRegisteredByRole,
  InspectionApprovalStatus,
  InspectionResult,
  InspectionJudgment,
  EquipmentClassification,
  InspectionResultSectionType,
  InspectionType,
  DocumentJson,
} from '@equipment-management/schemas';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

export type CalibrationDocumentRecord = DocumentJson;

export interface CalibrationCreateResponse {
  calibration: Calibration;
  documents: CalibrationDocumentRecord[];
}

export interface Calibration {
  id: string;
  equipmentId: string;
  calibrationManagerId?: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status?: string;
  calibrationAgency: string;
  certificateNumber?: string;
  certificatePath?: string;
  result?: string; // lowercase: 'pass', 'fail', 'conditional'
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
  // Optimistic locking
  version: number;
  createdAt: string;
  updatedAt: string;
  // 조인 필드 (목록 조회 시)
  equipmentName?: string;
  managementNumber?: string;
  team?: string;
  teamId?: string;
  teamName?: string;
  // Relation 필드 (pending approvals 등 join 포함 응답)
  registeredByUser?: {
    id: string;
    name: string;
    email: string;
    team: { id: string; name: string } | null;
  } | null;
  approvedByUser?: { id: string; name: string; email: string } | null;
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
  result?: string; // lowercase: 'pass', 'fail', 'conditional'
  notes?: string;
  team?: string;
  teamId?: string;
  teamName?: string;
  approvalStatus?: CalibrationApprovalStatus;
  registeredByRole?: CalibrationRegisteredByRole;
  createdAt: string;
}

export interface CalibrationQuery {
  equipmentId?: string;
  startDate?: string;
  endDate?: string;
  result?: string;
  calibrationDueStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  approvalStatus?: string;
  teamId?: string;
  site?: string;
}

export interface CreateCalibrationDto {
  equipmentId: string;
  calibrationDate: string;
  nextCalibrationDate?: string;
  calibrationAgency: string;
  certificateNumber?: string;
  result?: string; // lowercase: 'pass', 'fail', 'conditional'
  notes?: string;
  calibrationManagerId?: string;
  // 승인 프로세스 필드
  registeredBy?: string;
  registeredByRole?: CalibrationRegisteredByRole;
  registrarComment?: string;
  intermediateCheckDate?: string;
}

export interface UpdateCalibrationDto extends Partial<CreateCalibrationDto> {}

export interface ApproveCalibrationDto {
  version: number;
  approverComment?: string;
}

export interface RejectCalibrationDto {
  version: number;
  rejectionReason: string;
}

export interface CalibrationSummary {
  total: number;
  overdueCount: number;
  dueInMonthCount: number;
  passCount: number;
  failCount: number;
}

// ============================================================================
// 중간점검 타입 (SSOT: CalibrationContent에서 이동)
// ============================================================================

/**
 * 중간점검 항목 타입
 *
 * CalibrationRecord SSOT 기반 + 플래튼된 조인 필드
 */
export interface IntermediateCheckItem {
  id: string;
  equipmentId: string;
  calibrationManagerId: string;
  intermediateCheckDate: string;
  calibrationDate: string;
  nextCalibrationDate: string;
  status: string;
  calibrationAgency: string;
  notes: string | null;
  version: number;
  // 플래튼된 조인 필드 (백엔드에서 equipment → flat)
  equipmentName?: string;
  managementNumber?: string;
  team?: string;
  teamId?: string;
  teamName?: string;
}

/**
 * 중간점검 목록 응답 타입
 */
export interface IntermediateChecksResponse {
  items: IntermediateCheckItem[];
  meta: {
    totalItems: number;
    overdueCount: number;
    pendingCount: number;
  };
}

// ============================================================================
// 중간점검표 타입 (UL-QP-18-03)
// ============================================================================

export interface IntermediateInspection {
  id: string;
  calibrationId: string;
  equipmentId: string;
  inspectionDate: string;
  inspectorId: string;
  classification: EquipmentClassification | null;
  inspectionCycle: string | null;
  calibrationValidityPeriod: string | null;
  overallResult: InspectionResult | null;
  remarks: string | null;
  approvalStatus: InspectionApprovalStatus;
  submittedAt: string | null;
  submittedBy: string | null;
  reviewedAt: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
  items?: IntermediateInspectionItem[];
  inspectionEquipment?: IntermediateInspectionEquipmentRef[];
}

export interface IntermediateInspectionItem {
  id: string;
  inspectionId: string;
  itemNumber: number;
  checkItem: string;
  checkCriteria: string | null;
  checkResult: string | null;
  judgment: InspectionJudgment | null;
}

export interface IntermediateInspectionEquipmentRef {
  id: string;
  inspectionId: string;
  equipmentId: string;
  calibrationDate: string | null;
}

// ============================================================================
// 결과 섹션 (동적 콘텐츠)
// ============================================================================

export type RichCell =
  | { type: 'text'; value: string }
  | { type: 'image'; documentId: string; widthCm?: number; heightCm?: number };

export interface ResultSection {
  id: string;
  inspectionId: string;
  inspectionType: InspectionType;
  sectionType: InspectionResultSectionType;
  sortOrder: number;
  title: string | null;
  content: string | null;
  tableData: { headers: string[]; rows: string[][] } | null;
  richTableData: { headers: string[]; rows: RichCell[][] } | null;
  documentId: string | null;
  imageWidthCm: string | null;
  imageHeightCm: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateResultSectionDto {
  sortOrder: number;
  sectionType: InspectionResultSectionType;
  title?: string;
  content?: string;
  tableData?: { headers: string[]; rows: string[][] };
  richTableData?: { headers: string[]; rows: RichCell[][] };
  documentId?: string;
  imageWidthCm?: number;
  imageHeightCm?: number;
}

export interface CreateInspectionDto {
  inspectionDate: string;
  classification?: EquipmentClassification;
  inspectionCycle?: string;
  calibrationValidityPeriod?: string;
  overallResult?: InspectionResult;
  remarks?: string;
  items?: {
    itemNumber: number;
    checkItem: string;
    checkCriteria: string;
    checkResult?: string;
    judgment?: InspectionJudgment;
  }[];
  measurementEquipment?: {
    equipmentId: string;
    calibrationDate?: string;
  }[];
  resultSections?: CreateResultSectionDto[];
}

export interface UpdateInspectionDto extends Partial<CreateInspectionDto> {
  version: number;
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
    return transformPaginatedResponse<CalibrationHistory>(response);
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
    return transformSingleResponse<Calibration>(response);
  },

  // 교정 기록 등록 (multipart: 성적서 파일 + 메타데이터 원자 전송)
  createCalibrationWithFile: async (formData: FormData): Promise<CalibrationCreateResponse> => {
    const response = await apiClient.post(API_ENDPOINTS.CALIBRATIONS.CREATE, formData);
    return transformSingleResponse<CalibrationCreateResponse>(response);
  },

  // 교정 정보 수정
  updateCalibration: async (id: string, data: UpdateCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.patch(API_ENDPOINTS.CALIBRATIONS.UPDATE(id), data);
    return transformSingleResponse<Calibration>(response);
  },

  // 교정 정보 삭제
  deleteCalibration: async (id: string): Promise<void> => {
    await apiClient.delete(API_ENDPOINTS.CALIBRATIONS.DELETE(id));
  },

  // 교정 요약 통계
  getCalibrationSummary: async (teamId?: string, site?: string): Promise<CalibrationSummary> => {
    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);
    if (site) params.set('site', site);
    const qs = params.toString();
    const response = await apiClient.get(
      `${API_ENDPOINTS.CALIBRATIONS.SUMMARY}${qs ? `?${qs}` : ''}`
    );
    return transformSingleResponse<CalibrationSummary>(response);
  },

  // 교정 기한 초과 장비
  getOverdueCalibrations: async (teamId?: string, site?: string): Promise<CalibrationHistory[]> => {
    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);
    if (site) params.set('site', site);
    const qs = params.toString();
    const response = await apiClient.get(
      `${API_ENDPOINTS.CALIBRATIONS.OVERDUE}${qs ? `?${qs}` : ''}`
    );
    return transformArrayResponse<CalibrationHistory>(response);
  },

  // 곧 교정이 필요한 장비
  getUpcomingCalibrations: async (
    days: number = 30,
    teamId?: string,
    site?: string
  ): Promise<CalibrationHistory[]> => {
    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);
    if (site) params.set('site', site);
    const qs = params.toString();
    const baseUrl = API_ENDPOINTS.CALIBRATIONS.UPCOMING(days);
    const separator = baseUrl.includes('?') ? '&' : '?';
    const response = await apiClient.get(`${baseUrl}${qs ? `${separator}${qs}` : ''}`);
    return transformArrayResponse<CalibrationHistory>(response);
  },

  // 승인 대기 교정 목록 조회
  getPendingCalibrations: async (): Promise<PaginatedResponse<Calibration>> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.PENDING);
    return transformPaginatedResponse<Calibration>(response);
  },

  // 교정 승인
  approveCalibration: async (id: string, data: ApproveCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.patch(API_ENDPOINTS.CALIBRATIONS.APPROVE(id), data);
    return transformSingleResponse<Calibration>(response);
  },

  // 교정 반려
  rejectCalibration: async (id: string, data: RejectCalibrationDto): Promise<Calibration> => {
    const response = await apiClient.patch(API_ENDPOINTS.CALIBRATIONS.REJECT(id), data);
    return transformSingleResponse<Calibration>(response);
  },

  // 전체 중간점검 목록 조회 (팀/사이트 필터 지원)
  getAllIntermediateChecks: async (
    teamId?: string,
    site?: string
  ): Promise<IntermediateChecksResponse> => {
    const params = new URLSearchParams();
    if (teamId) params.set('teamId', teamId);
    if (site) params.set('site', site);
    const qs = params.toString();
    const url = `${API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.ALL}${qs ? `?${qs}` : ''}`;
    const response = await apiClient.get(url);
    return transformSingleResponse<IntermediateChecksResponse>(response);
  },

  // 중간점검 예정 조회
  getUpcomingIntermediateChecks: async (days: number = 7): Promise<Calibration[]> => {
    const response = await apiClient.get(API_ENDPOINTS.CALIBRATIONS.INTERMEDIATE_CHECKS.LIST(days));
    return transformArrayResponse<Calibration>(response);
  },

  // 교정성적서 파일 업로드
  uploadCertificate: async (
    calibrationId: string,
    file: File
  ): Promise<{ filePath: string; message: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(
      API_ENDPOINTS.CALIBRATIONS.CERTIFICATE(calibrationId),
      formData
    );
    return transformSingleResponse<{ filePath: string; message: string }>(response);
  },

  // ============================================================================
  // 중간점검표 API (UL-QP-18-03)
  // ============================================================================
  intermediateInspections: {
    listByEquipment: async (equipmentId: string): Promise<IntermediateInspection[]> => {
      const response = await apiClient.get(
        API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.BY_EQUIPMENT(equipmentId)
      );
      return transformArrayResponse<IntermediateInspection>(response);
    },

    createByEquipment: async (
      equipmentId: string,
      data: CreateInspectionDto
    ): Promise<IntermediateInspection> => {
      const response = await apiClient.post(
        API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.BY_EQUIPMENT(equipmentId),
        data
      );
      return transformSingleResponse<IntermediateInspection>(response);
    },

    list: async (calibrationId: string): Promise<IntermediateInspection[]> => {
      const response = await apiClient.get(
        API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.BY_CALIBRATION(calibrationId)
      );
      return transformArrayResponse<IntermediateInspection>(response);
    },

    detail: async (id: string): Promise<IntermediateInspection> => {
      const response = await apiClient.get(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.GET(id));
      return transformSingleResponse<IntermediateInspection>(response);
    },

    create: async (
      calibrationId: string,
      data: CreateInspectionDto
    ): Promise<IntermediateInspection> => {
      const response = await apiClient.post(
        API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.BY_CALIBRATION(calibrationId),
        data
      );
      return transformSingleResponse<IntermediateInspection>(response);
    },

    update: async (id: string, data: UpdateInspectionDto): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(
        API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.UPDATE(id),
        data
      );
      return transformSingleResponse<IntermediateInspection>(response);
    },

    submit: async (id: string, version: number): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.SUBMIT(id), {
        version,
      });
      return transformSingleResponse<IntermediateInspection>(response);
    },

    review: async (id: string, version: number): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.REVIEW(id), {
        version,
      });
      return transformSingleResponse<IntermediateInspection>(response);
    },

    approve: async (id: string, version: number): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.APPROVE(id), {
        version,
      });
      return transformSingleResponse<IntermediateInspection>(response);
    },

    reject: async (
      id: string,
      version: number,
      rejectionReason: string
    ): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.REJECT(id), {
        version,
        rejectionReason,
      });
      return transformSingleResponse<IntermediateInspection>(response);
    },

    withdraw: async (id: string, version: number): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.WITHDRAW(id), {
        version,
      });
      return transformSingleResponse<IntermediateInspection>(response);
    },

    resubmit: async (id: string, version: number): Promise<IntermediateInspection> => {
      const response = await apiClient.patch(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.RESUBMIT(id), {
        version,
      });
      return transformSingleResponse<IntermediateInspection>(response);
    },

    delete: async (id: string): Promise<{ success: boolean }> => {
      const response = await apiClient.delete(API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.DELETE(id));
      return response.data as { success: boolean };
    },

    resultSections: {
      list: async (inspectionId: string): Promise<ResultSection[]> => {
        const response = await apiClient.get(
          API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.RESULT_SECTIONS.LIST(inspectionId)
        );
        return transformArrayResponse<ResultSection>(response);
      },
      create: async (inspectionId: string, dto: CreateResultSectionDto): Promise<ResultSection> => {
        const response = await apiClient.post(
          API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.RESULT_SECTIONS.CREATE(inspectionId),
          dto
        );
        return transformSingleResponse<ResultSection>(response);
      },
      update: async (
        inspectionId: string,
        sectionId: string,
        dto: Partial<CreateResultSectionDto>
      ): Promise<ResultSection> => {
        const response = await apiClient.patch(
          API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.RESULT_SECTIONS.UPDATE(inspectionId, sectionId),
          dto
        );
        return transformSingleResponse<ResultSection>(response);
      },
      delete: async (inspectionId: string, sectionId: string): Promise<void> => {
        await apiClient.delete(
          API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.RESULT_SECTIONS.DELETE(inspectionId, sectionId)
        );
      },
      /**
       * 결과 섹션 순서 재할당 (단일 원자 트랜잭션).
       * @param sectionIds 변경 후 순서대로 정렬된 전체 섹션 ID 배열
       */
      reorder: async (inspectionId: string, sectionIds: string[]): Promise<ResultSection[]> => {
        const response = await apiClient.patch(
          API_ENDPOINTS.INTERMEDIATE_INSPECTIONS.RESULT_SECTIONS.REORDER(inspectionId),
          { sectionIds }
        );
        return transformArrayResponse<ResultSection>(response);
      },
    },
  },
};

export default calibrationApi;
