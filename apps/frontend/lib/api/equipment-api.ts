import apiClient from './api-client';

export interface Equipment {
  id: string;
  uuid?: string; // 백엔드에서 반환하는 UUID
  name: string;
  model?: string; // 하위 호환성
  modelName?: string; // 백엔드 스키마 필드명
  serialNumber: string;
  managementNumber: string;
  assetNumber?: string;
  status:
    | 'AVAILABLE'
    | 'IN_USE'
    | 'MAINTENANCE'
    | 'CALIBRATION'
    | 'DISPOSAL'
    | 'available'
    | 'in_use'
    | 'under_maintenance'
    | 'calibrating'
    | 'retired';
  purchaseDate?: string | Date | null;
  purchaseYear?: number;
  category?: string;
  manufacturer?: string;
  location?: string;
  teamId?: string | number;
  teamName?: string;
  calibrationCycle?: number;
  lastCalibrationDate?: string | Date | null;
  nextCalibrationDate?: string | Date | null;
  calibrationAgency?: string;
  calibrationMethod?: string;
  needsIntermediateCheck?: boolean;
  maintenancePeriod?: number; // 점검 주기 (개월)
  description?: string | null;
  image?: string;
  supplier?: string;
  contactInfo?: string;
  softwareVersion?: string;
  firmwareVersion?: string;
  manualLocation?: string;
  accessories?: string;
  mainFeatures?: string;
  technicalManager?: string;
  managerId?: string;
  price?: number | null;
  isActive?: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface PaginatedResponse<T> {
  items: T[];
  data?: T[]; // 일부 API는 data 속성을 반환
  meta: {
    totalItems: number;
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
  };
  // 하위 호환성을 위한 레거시 필드
  total?: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
}

export interface EquipmentQuery {
  search?: string;
  status?: string;
  category?: string;
  teamId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface CreateEquipmentDto {
  name: string;
  model: string;
  serialNumber: string;
  managementNumber: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'CALIBRATION' | 'DISPOSAL';
  purchaseDate: string;
  category: string;
  manufacturer: string;
  location: string;
  teamId?: string;
  calibrationCycle?: number;
  lastCalibrationDate?: string;
  description?: string;
  image?: File | null;
}

export interface UpdateEquipmentDto extends Partial<CreateEquipmentDto> {}

// 장비 API 객체
const equipmentApi = {
  // 장비 목록 조회
  getEquipmentList: async (query: EquipmentQuery = {}): Promise<PaginatedResponse<Equipment>> => {
    const params = new URLSearchParams();

    // 쿼리 파라미터 설정
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const url = `/api/equipment${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiClient.get(url);

    // 백엔드 응답 구조에 맞게 변환
    // 백엔드는 { items, meta } 구조를 반환하지만, 하위 호환성을 위해 레거시 필드도 추가
    if (response.data && response.data.items && response.data.meta) {
      return {
        ...response.data,
        // 레거시 필드 추가 (하위 호환성)
        total: response.data.meta.totalItems,
        page: response.data.meta.currentPage,
        pageSize: response.data.meta.itemsPerPage,
        totalPages: response.data.meta.totalPages,
      };
    }

    return response.data;
  },

  // 장비 상세 조회
  getEquipment: async (id: string): Promise<Equipment> => {
    const response = await apiClient.get(`/api/equipment/${id}`);
    return response.data;
  },

  // 장비 생성
  createEquipment: async (data: CreateEquipmentDto): Promise<Equipment> => {
    // 이미지 파일이 포함된 경우 FormData로 처리
    if (data.image) {
      const formData = new FormData();

      // FormData에 데이터 추가
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      return apiClient.post('/api/equipment', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // 일반 JSON 데이터인 경우
    return apiClient.post('/api/equipment', data);
  },

  // 장비 수정
  updateEquipment: async (id: string, data: UpdateEquipmentDto): Promise<Equipment> => {
    // 이미지 파일이 포함된 경우 FormData로 처리
    if (data.image) {
      const formData = new FormData();

      // FormData에 데이터 추가
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      return apiClient.patch(`/api/equipment/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    }

    // 일반 JSON 데이터인 경우
    return apiClient.patch(`/api/equipment/${id}`, data);
  },

  // 장비 삭제
  deleteEquipment: async (id: string): Promise<void> => {
    return apiClient.delete(`/api/equipment/${id}`);
  },

  // 장비 상태 변경
  updateEquipmentStatus: async (id: string, status: Equipment['status']): Promise<Equipment> => {
    return apiClient.patch(`/api/equipment/${id}/status`, { status });
  },

  // 교정 예정 장비 조회
  getCalibrationDueEquipment: async (days: number = 30): Promise<Equipment[]> => {
    return apiClient.get(`/api/equipment/calibration/due?days=${days}`);
  },

  // 팀별 장비 조회
  getTeamEquipment: async (teamId: string): Promise<Equipment[]> => {
    return apiClient.get(`/api/equipment/team/${teamId}`);
  },
};

export default equipmentApi;
