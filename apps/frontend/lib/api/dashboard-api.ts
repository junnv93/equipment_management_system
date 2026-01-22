import { apiClient } from './api-client';

export interface DashboardSummary {
  totalEquipment: number;
  availableEquipment: number;
  activeRentals: number;
  activeCheckouts: number;
  upcomingCalibrations: number;
}

export type EquipmentByTeam = {
  id: string;
  name: string;
  count: number;
};

export type OverdueCalibration = {
  id: string;
  name: string;
  dueDate: string;
  equipmentId: string;
  equipmentName?: string;
  daysOverdue?: number;
};

export interface UpcomingCalibration {
  id: string;
  equipmentId: string;
  equipmentName: string;
  dueDate: string;
  daysUntilDue: number;
}

// ✅ Rental 타입과 일관성 유지: 중첩 객체 구조 사용
export interface OverdueRental {
  id: string;
  equipmentId: string;
  equipment?: {
    id: string;
    name: string;
    managementNumber: string;
  };
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  expectedReturnDate: string;
  daysOverdue: number;
  startDate: string;
  status: string;
}

export interface RecentActivity {
  id: string;
  type: string;
  equipmentId: string;
  equipmentName: string;
  userId: string;
  userName: string;
  timestamp: string;
  details: string;
  entityId: string;
  entityName: string;
}

export interface PendingApprovalCounts {
  equipment: number;
  calibration: number;
  rental: number;
  checkout: number;
  calibrationFactor: number;
  software: number;
  total: number;
}

export type UserRole = 'test_engineer' | 'technical_manager' | 'lab_manager' | 'system_admin';

class DashboardApi {
  async getSummary(): Promise<DashboardSummary> {
    const response = await apiClient.get('/api/dashboard/summary');
    return response.data;
  }

  // 별칭 메서드들 (컴포넌트 호환성)
  async getDashboardSummary(): Promise<DashboardSummary> {
    return this.getSummary();
  }

  async getEquipmentSummary(): Promise<DashboardSummary> {
    return this.getSummary();
  }

  async getEquipmentList(): Promise<unknown[]> {
    const response = await apiClient.get('/api/equipment?limit=10');
    return response.data?.items || [];
  }

  async getCalibrationSchedule(): Promise<UpcomingCalibration[]> {
    return this.getUpcomingCalibrations(30);
  }

  async getOverdueLoans(): Promise<OverdueRental[]> {
    return this.getOverdueRentals();
  }

  async getEquipmentByTeam(): Promise<EquipmentByTeam[]> {
    const response = await apiClient.get('/api/dashboard/equipment-by-team');
    return response.data;
  }

  async getOverdueCalibrations(): Promise<OverdueCalibration[]> {
    const response = await apiClient.get('/api/dashboard/overdue-calibrations');
    return response.data;
  }

  async getUpcomingCalibrations(days: number): Promise<UpcomingCalibration[]> {
    const response = await apiClient.get(`/api/dashboard/upcoming-calibrations?days=${days}`);
    return response.data;
  }

  async getOverdueRentals(): Promise<OverdueRental[]> {
    const response = await apiClient.get('/api/dashboard/overdue-rentals');
    return response.data;
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    const response = await apiClient.get('/api/dashboard/recent-activities');
    return response.data;
  }

  async getEquipmentStatusStats(): Promise<Record<string, number>> {
    const response = await apiClient.get('/api/dashboard/equipment-status-stats');
    return response.data;
  }

  /**
   * 승인 대기 카운트 조회
   * 역할에 따라 다른 범위의 데이터 반환
   */
  async getPendingApprovalCounts(role?: string): Promise<PendingApprovalCounts> {
    try {
      const response = await apiClient.get('/api/dashboard/pending-approval-counts', {
        params: role ? { role } : undefined,
      });
      return response.data;
    } catch {
      // API 실패 시 기본값 반환
      return {
        equipment: 0,
        calibration: 0,
        rental: 0,
        checkout: 0,
        calibrationFactor: 0,
        software: 0,
        total: 0,
      };
    }
  }

  /**
   * 역할별 최근 활동 조회
   * - test_engineer: 본인 활동만
   * - technical_manager: 팀 내 활동
   * - lab_manager/system_admin: 전체 활동
   */
  async getRecentActivitiesByRole(role?: string, limit = 20): Promise<RecentActivity[]> {
    try {
      const response = await apiClient.get('/api/dashboard/recent-activities', {
        params: { role, limit },
      });
      return response.data;
    } catch {
      return [];
    }
  }
}

export const dashboardApi = new DashboardApi();
export default dashboardApi;
