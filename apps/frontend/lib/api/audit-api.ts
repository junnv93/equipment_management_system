import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformPaginatedResponse, transformSingleResponse } from './utils/response-transformers';
// ✅ SSOT: 공유 타입은 @equipment-management/schemas에서 import
import type {
  AuditLogDetails,
  AuditLog,
  AuditLogFilter,
  EntityAuditLogsResponse,
} from '@equipment-management/schemas';
import type { PaginatedResponse } from './types';

// 하위 컴포넌트 re-export (audit-api를 통해 접근하는 파일들을 위해)
export type { AuditLogDetails, AuditLog, AuditLogFilter, EntityAuditLogsResponse };

/**
 * 감사 로그 API
 */
export const auditApi = {
  /**
   * 감사 로그 목록 조회
   */
  async getAuditLogs(filter: AuditLogFilter = {}): Promise<PaginatedResponse<AuditLog>> {
    const params = new URLSearchParams();

    if (filter.userId) params.append('userId', filter.userId);
    if (filter.entityType) params.append('entityType', filter.entityType);
    if (filter.entityId) params.append('entityId', filter.entityId);
    if (filter.action) params.append('action', filter.action);
    if (filter.startDate) params.append('startDate', String(filter.startDate));
    if (filter.endDate) params.append('endDate', String(filter.endDate));
    if (filter.page) params.append('page', filter.page.toString());
    if (filter.limit) params.append('limit', filter.limit.toString());

    const url = params.toString()
      ? `${API_ENDPOINTS.AUDIT_LOGS.LIST}?${params.toString()}`
      : API_ENDPOINTS.AUDIT_LOGS.LIST;
    const response = await apiClient.get(url);
    return transformPaginatedResponse<AuditLog>(response);
  },

  /**
   * 특정 엔티티의 감사 로그 조회
   */
  async getEntityAuditLogs(entityType: string, entityId: string): Promise<EntityAuditLogsResponse> {
    const response = await apiClient.get(API_ENDPOINTS.AUDIT_LOGS.BY_ENTITY(entityType, entityId));
    return transformSingleResponse<EntityAuditLogsResponse>(response);
  },

  /**
   * 특정 사용자의 감사 로그 조회
   */
  async getUserAuditLogs(userId: string, limit = 100): Promise<EntityAuditLogsResponse> {
    const response = await apiClient.get(
      `${API_ENDPOINTS.AUDIT_LOGS.BY_USER(userId)}?limit=${limit}`
    );
    return transformSingleResponse<EntityAuditLogsResponse>(response);
  },
};
