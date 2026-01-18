/**
 * API 응답 변환 유틸리티
 *
 * ✅ Single Source of Truth: 백엔드 응답 구조를 프론트엔드에서 사용하기 편한 형태로 변환
 * ✅ 중복 제거: 모든 API 클라이언트에서 공통으로 사용
 * ✅ 타입 안전성: TypeScript 타입으로 보장
 */

import type {
  PaginatedListResponse,
  FrontendPaginatedResponse,
  SingleResourceResponse,
} from '@equipment-management/schemas';
import { AxiosResponse } from 'axios';

/**
 * 백엔드 페이지네이션 응답을 프론트엔드 형식으로 변환
 *
 * 백엔드: { items: [], meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }
 * 프론트엔드: { data: [], meta: { pagination: { total, pageSize, currentPage, totalPages } } }
 *
 * @param response 백엔드 응답
 * @returns 프론트엔드 형식의 페이지네이션 응답
 */
export function transformPaginatedResponse<T>(
  response: AxiosResponse<PaginatedListResponse<T>>
): FrontendPaginatedResponse<T> {
  const backendData = response.data;

  // 백엔드 응답 구조 확인
  if (backendData && 'items' in backendData && 'meta' in backendData) {
    return {
      data: backendData.items || [],
      meta: {
        pagination: {
          total: backendData.meta.totalItems,
          pageSize: backendData.meta.itemsPerPage,
          currentPage: backendData.meta.currentPage,
          totalPages: backendData.meta.totalPages,
        },
      },
    };
  }

  // 레거시 호환성: 이미 변환된 형태인 경우
  if (backendData && 'data' in backendData && 'meta' in backendData) {
    return backendData as FrontendPaginatedResponse<T>;
  }

  // 기본값 반환 (에러 방지)
  return {
    data: [],
    meta: {
      pagination: {
        total: 0,
        pageSize: 20,
        currentPage: 1,
        totalPages: 0,
      },
    },
  };
}

/**
 * 백엔드 단일 리소스 응답을 프론트엔드 형식으로 변환
 *
 * 백엔드: 직접 객체 반환 또는 { data: {...} }
 * 프론트엔드: 직접 객체 반환
 *
 * @param response 백엔드 응답
 * @returns 프론트엔드 형식의 단일 리소스 응답
 */
export function transformSingleResponse<T>(
  response: AxiosResponse<SingleResourceResponse<T> | { data: T }>
): T {
  const backendData = response.data;

  // 백엔드가 { data: {...} } 형태로 감싸서 반환하는 경우
  if (backendData && typeof backendData === 'object' && 'data' in backendData) {
    return (backendData as { data: T }).data;
  }

  // 백엔드가 직접 객체를 반환하는 경우
  return backendData as T;
}

/**
 * 에러 응답 변환
 *
 * @param error Axios 에러
 * @returns 표준화된 에러 객체
 */
export function transformErrorResponse(error: unknown): {
  message: string;
  code?: string;
  details?: unknown;
} {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: unknown; status?: number } };

    if (axiosError.response?.data) {
      const errorData = axiosError.response.data;

      // 백엔드 표준 에러 응답 구조: { error: { code, message, details }, meta: {...} }
      if (errorData && typeof errorData === 'object' && 'error' in errorData) {
        const backendError = errorData as {
          error: { code?: string; message?: string; details?: unknown };
        };
        return {
          message: backendError.error.message || '알 수 없는 오류가 발생했습니다.',
          code: backendError.error.code,
          details: backendError.error.details,
        };
      }

      // 간단한 에러 메시지
      if (errorData && typeof errorData === 'object' && 'message' in errorData) {
        return {
          message: String((errorData as { message: unknown }).message),
        };
      }
    }

    // HTTP 상태 코드 기반 메시지
    const status = axiosError.response?.status;
    if (status === 404) {
      return { message: '요청한 리소스를 찾을 수 없습니다.' };
    }
    if (status === 401) {
      return { message: '인증이 필요합니다.' };
    }
    if (status === 403) {
      return { message: '권한이 없습니다.' };
    }
    if (status === 400) {
      return { message: '잘못된 요청입니다.' };
    }
  }

  // 기본 에러 메시지
  if (error instanceof Error) {
    return { message: error.message };
  }

  return { message: '알 수 없는 오류가 발생했습니다.' };
}
