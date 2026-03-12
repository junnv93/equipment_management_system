/**
 * 공통 API 타입 정의
 *
 * ✅ Single Source of Truth: 모든 API 클라이언트에서 공통으로 사용
 * ✅ 중복 제거: 각 API 파일에서 개별 정의하지 않음
 */

import type { FrontendPaginatedResponse } from '@equipment-management/schemas';

/**
 * 페이지네이션된 응답 타입
 * 프론트엔드에서 사용하는 표준 형식
 */
export type PaginatedResponse<T, TSummary = Record<string, number>> = FrontendPaginatedResponse<
  T,
  TSummary
>;
