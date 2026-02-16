/**
 * 감사 로그 Server-Side API 클라이언트
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용처:
 * - app/(dashboard)/admin/audit-logs/page.tsx (Server Component - 목록)
 *
 * 절대로 'use client' 컴포넌트에서 import하지 마세요!
 * 클라이언트에서는 audit-api.ts를 사용하세요.
 *
 * @see lib/api/audit-api.ts (Client-side API)
 */

import { createServerApiClient } from './server-api-client';
import { transformPaginatedResponse } from './utils/response-transformers';
import type { PaginatedResponse } from './types';
import type { AuditLog } from './audit-api';
import type { ApiAuditLogFilters } from '@/lib/utils/audit-log-filter-utils';

/**
 * 감사 로그 목록 조회 (Server Component용)
 *
 * @param query - 감사 로그 조회 쿼리 파라미터
 * @returns 페이지네이션된 감사 로그 목록
 */
export async function getAuditLogsList(
  query: ApiAuditLogFilters = {}
): Promise<PaginatedResponse<AuditLog>> {
  const apiClient = await createServerApiClient();
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.append(key, String(value));
    }
  });

  const url = `/api/audit-logs${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return transformPaginatedResponse<AuditLog>(response);
}
