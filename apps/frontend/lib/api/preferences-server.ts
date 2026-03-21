/**
 * ============================================================================
 * Server-Side Display Preferences API
 * ============================================================================
 *
 * ⚠️ IMPORTANT: Server Component 전용
 *
 * 사용자 표시 설정(정렬, 페이지 크기, 날짜 형식 등)을 서버 사이드에서 조회합니다.
 * React.cache()로 동일 요청 내 중복 fetch를 방지합니다.
 *
 * 사용처:
 * - app/(dashboard)/equipment/page.tsx — 기본 정렬/페이지 크기 적용
 * - 기타 목록 페이지의 Server Component
 *
 * Client Component에서는 hooks/use-user-preferences.ts를 사용하세요.
 * ============================================================================
 */

import { cache } from 'react';
import { createServerApiClient } from './server-api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import {
  DEFAULT_DISPLAY_PREFERENCES,
  type DisplayPreferences,
} from '@equipment-management/schemas';

/**
 * 현재 사용자의 표시 설정을 서버 사이드에서 조회
 *
 * ✅ React.cache()로 동일 렌더 사이클 내 중복 요청 방지
 * ✅ 조회 실패 시 기본값 반환 (페이지 렌더링 차단 방지)
 * ✅ DEFAULT_DISPLAY_PREFERENCES와 병합하여 누락 필드 보장
 */
export const getDisplayPreferences = cache(async (): Promise<DisplayPreferences> => {
  try {
    const apiClient = await createServerApiClient();
    const res = await apiClient.get<DisplayPreferences>(API_ENDPOINTS.USERS.PREFERENCES);
    return { ...DEFAULT_DISPLAY_PREFERENCES, ...res.data };
  } catch {
    // 인증 실패나 네트워크 오류 시에도 페이지는 렌더링되어야 함
    return DEFAULT_DISPLAY_PREFERENCES;
  }
});
