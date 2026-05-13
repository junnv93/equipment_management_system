import { apiClient } from './api-client';
import { transformSingleResponse } from './utils/response-transformers';
import { API_ENDPOINTS } from '@equipment-management/shared-constants';

interface ServerTimeResponse {
  serverTime: string;
}

/**
 * 서버 현재 시각 조회 (SH-5 — clock skew 보정용).
 *
 * 반환: `serverTimeDeltaMs` — 서버와 클라이언트 시각 차이(ms).
 * 양수 = 서버가 클라이언트보다 앞, 음수 = 서버가 클라이언트보다 뒤.
 *
 * 사용 방법: `Date.now() + serverTimeDeltaMs` → skew-corrected 현재 시각.
 */
export async function fetchServerTimeDelta(): Promise<number> {
  const clientBefore = Date.now();
  const response = await apiClient.get(API_ENDPOINTS.MONITORING.SERVER_TIME);
  const clientAfter = Date.now();

  const { serverTime } = transformSingleResponse<ServerTimeResponse>(response);
  const serverMs = new Date(serverTime).getTime();

  // 네트워크 왕복 시간의 절반을 보정 (RFC 5905 참고)
  const roundTripHalf = Math.floor((clientAfter - clientBefore) / 2);
  return serverMs - (clientBefore + roundTripHalf);
}
