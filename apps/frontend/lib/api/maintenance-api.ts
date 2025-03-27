import axios from 'axios';

export interface Maintenance {
  id: string;
  equipmentId: string;
  equipment?: {
    id: string;
    name: string;
    managementNumber: string;
    status: string;
  };
  maintenanceType: 'regular' | 'repair' | 'inspection' | 'other';
  maintenanceDate: string;
  nextMaintenanceDate?: string;
  maintenancePeriod?: number; // 개월 단위
  performedBy: string;
  performedByContact?: string;
  cost?: number;
  result: 'completed' | 'pending' | 'failed';
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  parts?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    pagination: {
      total: number;
      pageSize: number;
      currentPage: number;
      totalPages: number;
    };
  };
}

export interface MaintenanceQuery {
  page?: number;
  pageSize?: number;
  equipmentId?: string;
  maintenanceType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface CreateMaintenanceDto {
  equipmentId: string;
  maintenanceType: 'regular' | 'repair' | 'inspection' | 'other';
  maintenanceDate: string;
  nextMaintenanceDate?: string;
  maintenancePeriod?: number;
  performedBy: string;
  performedByContact?: string;
  cost?: number;
  result?: 'completed' | 'pending' | 'failed';
  status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  parts?: string[];
  notes?: string;
}

export interface UpdateMaintenanceDto {
  maintenanceType?: 'regular' | 'repair' | 'inspection' | 'other';
  maintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenancePeriod?: number;
  performedBy?: string;
  performedByContact?: string;
  cost?: number;
  result?: 'completed' | 'pending' | 'failed';
  status?: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
  parts?: string[];
  notes?: string;
}

export interface MaintenanceSummary {
  total: number;
  scheduled: number;
  inProgress: number;
  completed: number;
  upcoming: number; // 다음 7일 내 예정된 점검
  overdue: number;  // 기한이 지났지만 완료되지 않은 점검
}

// maintenanceType, status, result 타입을 export
export type MaintenanceType = 'regular' | 'repair' | 'inspection' | 'other';
export type MaintenanceStatus = 'scheduled' | 'in_progress' | 'completed' | 'canceled';
export type MaintenanceResult = 'completed' | 'pending' | 'failed';

/**
 * 장비 점검 관리 API 클라이언트
 */
const maintenanceApi = {
  /**
   * 점검 목록을 조회합니다.
   */
  async getMaintenances(query: MaintenanceQuery = {}): Promise<PaginatedResponse<Maintenance>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/maintenances${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 특정 점검 정보를 조회합니다.
   */
  async getMaintenance(id: string): Promise<Maintenance> {
    const response = await axios.get(`/api/maintenances/${id}`);
    return response.data.data;
  },

  /**
   * 특정 장비의 점검 이력을 조회합니다.
   */
  async getEquipmentMaintenances(equipmentId: string, query: MaintenanceQuery = {}): Promise<PaginatedResponse<Maintenance>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/equipment/${equipmentId}/maintenances?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 새 점검 정보를 등록합니다.
   */
  async createMaintenance(data: CreateMaintenanceDto): Promise<Maintenance> {
    const response = await axios.post('/api/maintenances', data);
    return response.data.data;
  },

  /**
   * 점검 정보를 업데이트합니다.
   */
  async updateMaintenance(id: string, data: UpdateMaintenanceDto): Promise<Maintenance> {
    const response = await axios.patch(`/api/maintenances/${id}`, data);
    return response.data.data;
  },

  /**
   * 점검 정보를 삭제합니다.
   */
  async deleteMaintenance(id: string): Promise<void> {
    await axios.delete(`/api/maintenances/${id}`);
  },

  /**
   * 점검 요약 정보를 조회합니다.
   */
  async getMaintenanceSummary(): Promise<MaintenanceSummary> {
    const response = await axios.get('/api/maintenances/summary');
    return response.data.data;
  },

  /**
   * 다가오는 점검 일정을 조회합니다.
   */
  async getUpcomingMaintenances(query: MaintenanceQuery = {}): Promise<PaginatedResponse<Maintenance>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/maintenances/upcoming?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 기한이 지난 점검 목록을 조회합니다.
   */
  async getOverdueMaintenances(query: MaintenanceQuery = {}): Promise<PaginatedResponse<Maintenance>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });
    
    const url = `/api/maintenances/overdue?${queryParams.toString()}`;
    const response = await axios.get(url);
    return response.data;
  },

  /**
   * 장비의 다음 점검 일정을 계산합니다.
   */
  async calculateNextMaintenanceDate(equipmentId: string, maintenanceDate: string, period: number): Promise<{ nextMaintenanceDate: string }> {
    const response = await axios.post('/api/maintenances/calculate-next-date', {
      equipmentId,
      maintenanceDate,
      period
    });
    return response.data.data;
  },

  /**
   * 장비의 점검 주기를 설정합니다.
   */
  async setMaintenancePeriod(equipmentId: string, period: number): Promise<{ success: boolean }> {
    const response = await axios.post(`/api/equipment/${equipmentId}/maintenance-period`, { period });
    return response.data;
  }
};

export default maintenanceApi; 