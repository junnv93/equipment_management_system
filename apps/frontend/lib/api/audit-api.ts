import { apiClient } from './api-client';
import type { PaginatedResponse } from './types';

/**
 * 감사 로그 상세 정보 타입
 */
export interface AuditLogDetails {
  previousValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  requestId?: string;
  additionalInfo?: Record<string, unknown>;
}

/**
 * 감사 로그 타입
 */
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  details: AuditLogDetails | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * 감사 로그 필터 타입
 */
export interface AuditLogFilter {
  userId?: string;
  entityType?: string;
  entityId?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

/**
 * 감사 로그 조회 응답 타입
 */
export interface AuditLogsResponse extends PaginatedResponse<AuditLog> {}

/**
 * 엔티티별 감사 로그 응답 타입
 */
export interface EntityAuditLogsResponse {
  items: AuditLog[];
  formattedLogs: string[];
}

/**
 * 감사 로그 API
 */
export const auditApi = {
  /**
   * 감사 로그 목록 조회
   */
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<AuditLogsResponse> {
    const params = new URLSearchParams();

    if (filter.userId) params.append('userId', filter.userId);
    if (filter.entityType) params.append('entityType', filter.entityType);
    if (filter.entityId) params.append('entityId', filter.entityId);
    if (filter.action) params.append('action', filter.action);
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());

    const response = await apiClient.get(`/api/audit-logs?${params.toString()}`);
    return {
      data: response.data.items || [],
      meta: {
        pagination: {
          total: response.data.meta?.totalItems || 0,
          pageSize: response.data.meta?.itemsPerPage || 20,
          currentPage: response.data.meta?.currentPage || 1,
          totalPages: response.data.meta?.totalPages || 1,
        },
      },
    };
  },

  /**
   * 특정 엔티티의 감사 로그 조회
   */
  async getEntityAuditLogs(entityType: string, entityId: string): Promise<EntityAuditLogsResponse> {
    const response = await apiClient.get(`/api/audit-logs/entity/${entityType}/${entityId}`);
    return response.data;
  },

  /**
   * 특정 사용자의 감사 로그 조회
   */
  async getUserAuditLogs(userId: string, limit = 100): Promise<EntityAuditLogsResponse> {
    const response = await apiClient.get(`/api/audit-logs/user/${userId}?limit=${limit}`);
    return response.data;
  },
};
