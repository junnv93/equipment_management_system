import { apiClient } from './api-client';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';
import { transformArrayResponse, transformSingleResponse } from './utils/response-transformers';

/**
 * 사용자 선택 Combobox/Select용 경량 타입
 *
 * 전체 User 엔티티 대신 Select/Combobox에 필요한 최소 필드만 포함합니다.
 */
export interface UserOption {
  id: string;
  name: string;
  department?: string;
}

/**
 * 사용자 API 클라이언트
 *
 * SSOT: transformArrayResponse를 사용하여 백엔드 paginated 응답에서
 * 안전하게 items 배열을 추출합니다.
 */
const usersApi = {
  /**
   * 사용자 목록 조회 (Select 드롭다운용)
   *
   * 백엔드 paginated 응답 { items, total, ... }에서 items 배열만 추출합니다.
   * transformArrayResponse가 다양한 응답 형식을 안전하게 처리합니다.
   */
  listForSelect: async <T = UserOption>(params?: Record<string, string>): Promise<T[]> => {
    const qs = new URLSearchParams(params);
    const url =
      params && qs.toString() ? `${API_ENDPOINTS.USERS.LIST}?${qs}` : API_ENDPOINTS.USERS.LIST;
    return apiClient.get(url).then((res) => transformArrayResponse<T>(res));
  },

  /** 사용자 검색 (Combobox 서버 사이드 검색용, pageSize=20) */
  search: async (params: { search?: string; site?: string }): Promise<UserOption[]> => {
    const qs = new URLSearchParams();
    if (params.search) qs.set('search', params.search);
    if (params.site) qs.set('site', params.site);
    qs.set('pageSize', '20');
    return apiClient
      .get(`${API_ENDPOINTS.USERS.LIST}?${qs.toString()}`)
      .then((res) => transformArrayResponse<UserOption>(res));
  },

  /** 사용자 단건 조회 (Combobox 초기값 해석용) */
  get: async (id: string): Promise<UserOption> => {
    return apiClient
      .get(API_ENDPOINTS.USERS.GET(id))
      .then((res) => transformSingleResponse<UserOption>(res));
  },
};

export default usersApi;
