'use client';

/**
 * ============================================================================
 * 사용자 표시 설정 훅 (SSOT)
 * ============================================================================
 *
 * TanStack Query 기반으로 사용자의 표시 설정(정렬, 페이지 크기, 날짜 형식 등)을
 * 조회하고 캐싱합니다. Client Component에서 사용자 설정을 참조할 때 사용합니다.
 *
 * 캐시 전략: STATIC (30분) — 설정 변경 시 invalidateQueries로 즉시 갱신
 *
 * 사용처:
 * - hooks/use-date-formatter.ts — dateFormat 적용
 * - hooks/useEquipmentFilters.ts — pageSize 기본값
 * - 기타 설정 값을 참조하는 Client Component
 *
 * Server Component에서는 lib/api/preferences-server.ts를 사용하세요.
 * ============================================================================
 */

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/api-client';
import { queryKeys, QUERY_CONFIG } from '@/lib/api/query-config';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
} from '@equipment-management/schemas';

/**
 * 사용자 표시 설정 조회 훅
 *
 * ✅ STATIC 캐시 전략 (30분) — 설정은 자주 변경되지 않음
 * ✅ 기본값 병합 — 서버 응답에 누락된 필드 보장
 * ✅ DisplayPreferencesContent.tsx와 동일한 queryKey 공유 — 설정 저장 시 자동 갱신
 *
 * @returns DisplayPreferences — 항상 완전한 객체 반환 (로딩 중에도 기본값)
 */
export function useUserPreferences(): DisplayPreferences {
  const { data } = useQuery<DisplayPreferences>({
    queryKey: queryKeys.settings.preferences(),
    queryFn: async () => {
      const res = await apiClient.get<DisplayPreferences>(API_ENDPOINTS.USERS.PREFERENCES);
      return res.data;
    },
    ...QUERY_CONFIG.SETTINGS,
  });

  return { ...DEFAULT_DISPLAY_PREFERENCES, ...(data ?? {}) };
}
