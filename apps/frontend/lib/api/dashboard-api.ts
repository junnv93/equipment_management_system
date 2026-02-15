import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type { UserRole } from '@equipment-management/schemas';
import { transformArrayResponse } from './utils/response-transformers';

export interface DashboardSummary {
  totalEquipment: number;
  availableEquipment: number;
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

/**
 * 반출 지연 데이터 (대여/교정/수리 포함)
 */
export interface OverdueCheckout {
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

/**
 * @deprecated Use OverdueCheckout instead
 */
export type OverdueRental = OverdueCheckout;

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

/**
 * @deprecated Use PendingCountsByCategory from approvals-api.ts instead.
 * This interface uses a different category structure that doesn't match
 * the actual approval page tabs (e.g., 'checkout' vs 'outgoing'/'incoming').
 */
export interface PendingApprovalCounts {
  equipment: number;
  calibration: number;
  checkout: number;
  calibrationFactor: number;
  software: number;
  total: number;
}

// UserRole은 @equipment-management/schemas에서 import (SSOT)
export type { UserRole };

class DashboardApi {
  async getSummary(teamId?: string): Promise<DashboardSummary> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.SUMMARY, {
      params: teamId ? { teamId } : undefined,
    });
    return response.data;
  }

  // 별칭 메서드들 (컴포넌트 호환성)
  async getDashboardSummary(teamId?: string): Promise<DashboardSummary> {
    return this.getSummary(teamId);
  }

  async getEquipmentSummary(teamId?: string): Promise<DashboardSummary> {
    return this.getSummary(teamId);
  }

  async getEquipmentList(): Promise<unknown[]> {
    const response = await apiClient.get(`${API_ENDPOINTS.EQUIPMENT.LIST}?limit=10`);
    return transformArrayResponse<unknown>(response);
  }

  async getCalibrationSchedule(teamId?: string): Promise<UpcomingCalibration[]> {
    return this.getUpcomingCalibrations(30, teamId);
  }

  async getEquipmentByTeam(teamId?: string): Promise<EquipmentByTeam[]> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.EQUIPMENT_BY_TEAM, {
      params: teamId ? { teamId } : undefined,
    });
    return transformArrayResponse<EquipmentByTeam>(response);
  }

  async getOverdueCalibrations(teamId?: string): Promise<OverdueCalibration[]> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.OVERDUE_CALIBRATIONS, {
      params: teamId ? { teamId } : undefined,
    });
    return transformArrayResponse<OverdueCalibration>(response);
  }

  async getUpcomingCalibrations(days: number, teamId?: string): Promise<UpcomingCalibration[]> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.UPCOMING_CALIBRATIONS, {
      params: { days, ...(teamId ? { teamId } : {}) },
    });
    return response.data;
  }

  /**
   * 반출 지연 목록 조회 (대여/교정/수리 포함)
   */
  async getOverdueCheckouts(teamId?: string): Promise<OverdueCheckout[]> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.OVERDUE_RENTALS, {
      params: teamId ? { teamId } : undefined,
    });
    return response.data;
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES);
    return response.data;
  }

  async getEquipmentStatusStats(teamId?: string): Promise<Record<string, number>> {
    const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.EQUIPMENT_STATUS_STATS, {
      params: teamId ? { teamId } : undefined,
    });
    return response.data;
  }

  /**
   * @deprecated Use approvalsApi.getPendingCounts() from approvals-api.ts instead.
   * This method calls a legacy endpoint with incomplete counting logic
   * (calibration/disposal/NC hardcoded to 0).
   */
  async getPendingApprovalCounts(role?: string): Promise<PendingApprovalCounts> {
    try {
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.PENDING_APPROVAL_COUNTS, {
        params: role ? { role } : undefined,
      });
      return response.data;
    } catch {
      // API 실패 시 기본값 반환
      return {
        equipment: 0,
        calibration: 0,
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
      const response = await apiClient.get(API_ENDPOINTS.DASHBOARD.RECENT_ACTIVITIES, {
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
