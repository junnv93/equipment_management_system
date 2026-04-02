import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformSingleResponse } from './utils/response-transformers';

// ============================================================================
// 응답 타입 (monitoring.controller.ts 반환 타입 기준)
// ============================================================================

export interface MonitoringMetrics {
  hostname: string;
  platform: NodeJS.Platform;
  arch: string;
  release: string;
  nodeVersion: string;
  nodeEnv: string | undefined;
  cpu: { usage: number; loadAvg: number[] };
  memory: { total: number; free: number; used: number; percentage: number };
  uptime: number;
  network: {
    requestsPerMinute: number;
    errorRate: number;
    avgResponseTime: number;
    isSimulated: boolean;
  };
  storage: {
    diskUsage: number;
    diskFree: number;
    diskTotal: number;
    isSimulated: boolean;
  };
}

export interface MonitoringStatus {
  status: string;
  timestamp: string;
  services: {
    database: {
      status: string;
      isSimulated: boolean;
      metrics: {
        connectionsCreated: number;
        connectionErrors: number;
        queriesExecuted: number;
        queriesFailed: number;
        avgQueryTime: number;
      };
    };
    system: {
      status: string;
      uptime: string;
      cpu: { usage: string; status: string };
      memory: { usage: string; status: string };
    };
    api: { status: string; totalRequests: number; errorRate: string };
    logging: {
      status: string;
      counts: { error: number; warn: number; info: number; debug: number; verbose: number };
    };
    cache: { status: string; hitRate: number };
  };
  lastChecked: string;
}

export interface MonitoringHttpStats {
  totalRequests: number;
  successRequests: number;
  errorRequests: number;
  errorRate: number;
  topEndpoints: { endpoint: string; count: number; avgResponseTime: number }[];
}

export interface MonitoringCacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  size: number;
  maxSize: number;
}

// ============================================================================
// API Client
// ============================================================================

class MonitoringApi {
  async getMetrics(): Promise<MonitoringMetrics> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.METRICS);
    return transformSingleResponse<MonitoringMetrics>(response);
  }

  async getStatus(): Promise<MonitoringStatus> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.STATUS);
    return transformSingleResponse<MonitoringStatus>(response);
  }

  async getHttpStats(): Promise<MonitoringHttpStats> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.HTTP_STATS);
    return transformSingleResponse<MonitoringHttpStats>(response);
  }

  async getCacheStats(): Promise<MonitoringCacheStats> {
    const response = await apiClient.get(API_ENDPOINTS.MONITORING.CACHE_STATS);
    return transformSingleResponse<MonitoringCacheStats>(response);
  }
}

export const monitoringApi = new MonitoringApi();
