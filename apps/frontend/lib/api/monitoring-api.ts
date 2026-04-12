import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import type {
  SystemMetrics,
  SystemDiagnostics,
  HealthStatus,
  HttpStats,
  CacheStats,
} from '@equipment-management/schemas';
import { transformSingleResponse } from './utils/response-transformers';

// ============================================================================
// 응답 타입 별칭 — SSOT 는 @equipment-management/schemas
// 기존 호출처 호환성을 위해 MonitoringXxx 별칭 유지. 신규 코드는 SSOT 이름을 직접 사용 권장.
// ============================================================================

export type MonitoringMetrics = SystemMetrics;
export type MonitoringDiagnostics = SystemDiagnostics;
export type MonitoringStatus = HealthStatus;
export type MonitoringHttpStats = HttpStats;
export type MonitoringCacheStats = CacheStats;

// ============================================================================
// API Client
// ============================================================================

class MonitoringApi {
  async getMetrics(): Promise<SystemMetrics> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.METRICS);
    return transformSingleResponse<SystemMetrics>(response);
  }

  async getStatus(): Promise<HealthStatus> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.STATUS);
    return transformSingleResponse<HealthStatus>(response);
  }

  async getHttpStats(): Promise<HttpStats> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.HTTP_STATS);
    return transformSingleResponse<HttpStats>(response);
  }

  async getCacheStats(): Promise<CacheStats> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.CACHE_STATS);
    return transformSingleResponse<CacheStats>(response);
  }
}

export const monitoringApi = new MonitoringApi();
