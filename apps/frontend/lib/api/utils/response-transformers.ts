/**
 * API 응답 변환 유틸리티
 *
 * ✅ Single Source of Truth: 백엔드 응답 구조를 프론트엔드에서 사용하기 편한 형태로 변환
 * ✅ 중복 제거: 모든 API 클라이언트에서 공통으로 사용
 * ✅ 타입 안전성: TypeScript 타입으로 보장
 *
 * 아키텍처 계약:
 * - 래핑 해제({ success, data } → data)는 Axios 인터셉터가 SSOT로 담당
 * - transform 함수는 이미 해제된 데이터의 포맷 변환만 담당
 * - 3개 API 클라이언트(apiClient, serverApiClient, authenticatedClient) 모두
 *   unwrapResponseData 인터셉터를 공유
 */

import type {
  PaginatedListResponse,
  FrontendPaginatedResponse,
  SingleResourceResponse,
} from '@equipment-management/schemas';
import type { AxiosResponse } from 'axios';
import { DEFAULT_PAGE_SIZE } from '@equipment-management/shared-constants';
import {
  ApiError,
  EquipmentErrorCode,
  httpStatusToErrorCode,
  mapBackendErrorCode,
} from '../../errors/equipment-errors';
import { getDefaultMessageForStatus } from '../error';

/**
 * ResponseTransformInterceptor 래핑 해제 (SSOT)
 *
 * 백엔드가 { success: true, data: T, message, timestamp } 형태로 래핑하는 경우
 * data만 추출하여 response.data에 재할당합니다.
 *
 * 모든 Axios 클라이언트의 응답 인터셉터에서 이 함수를 사용해야 합니다:
 * - api-client.ts (클라이언트 사이드)
 * - server-api-client.ts (서버 사이드)
 * - authenticated-client-provider.tsx (세션 기반)
 */
export function unwrapResponseData<T>(response: AxiosResponse<T>): AxiosResponse<T> {
  const responseData: unknown = response.data;
  if (
    responseData &&
    typeof responseData === 'object' &&
    'success' in responseData &&
    (responseData as Record<string, unknown>).success === true &&
    'data' in responseData
  ) {
    response.data = (responseData as Record<string, unknown>).data as T;
  }
  return response;
}

/**
 * 백엔드 페이지네이션 응답을 프론트엔드 형식으로 변환
 *
 * 백엔드: { items: [], meta: { totalItems, itemCount, itemsPerPage, totalPages, currentPage } }
 * 프론트엔드: { data: [], meta: { pagination: { total, pageSize, currentPage, totalPages } } }
 *
 * @param response 백엔드 응답
 * @returns 프론트엔드 형식의 페이지네이션 응답
 */
export function transformPaginatedResponse<T, TSummary = Record<string, number>>(
  response: AxiosResponse<PaginatedListResponse<T> & { summary?: TSummary }>
): FrontendPaginatedResponse<T, TSummary> {
  // 래핑 해제는 인터셉터(unwrapResponseData)가 SSOT로 처리함
  // 이 함수는 포맷 변환만 담당: { items, meta } → { data, meta.pagination }
  const backendData = response.data as unknown;

  // 백엔드 표준 페이지네이션: { items: [], meta: { totalItems, ... } }
  if (
    backendData &&
    typeof backendData === 'object' &&
    'items' in backendData &&
    'meta' in backendData
  ) {
    const paginated = backendData as PaginatedListResponse<T> & { summary?: TSummary };
    const result: FrontendPaginatedResponse<T, TSummary> = {
      data: paginated.items || [],
      meta: {
        pagination: {
          total: paginated.meta.totalItems,
          pageSize: paginated.meta.itemsPerPage,
          currentPage: paginated.meta.currentPage,
          totalPages: paginated.meta.totalPages,
        },
      },
    };

    // summary 필드가 있으면 보존 (도메인별 TSummary 타입으로 전달)
    if (paginated.summary) {
      result.meta.summary = paginated.summary;
    }

    return result;
  }

  // 이미 프론트엔드 형태인 경우: { data: [], meta: { pagination } }
  if (
    backendData &&
    typeof backendData === 'object' &&
    'data' in backendData &&
    'meta' in backendData
  ) {
    return backendData as FrontendPaginatedResponse<T, TSummary>;
  }

  // 기본값 반환 (에러 방지)
  return {
    data: [],
    meta: {
      pagination: {
        total: 0,
        pageSize: DEFAULT_PAGE_SIZE,
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

  // ResponseTransformInterceptor 래핑 해제: { success, data } 형태만 언래핑
  // 'data' in만 검사하면 엔티티 자체에 data 프로퍼티가 있을 때 이중 언래핑 위험
  if (
    backendData &&
    typeof backendData === 'object' &&
    'success' in backendData &&
    'data' in backendData
  ) {
    return (backendData as { data: T }).data;
  }

  // 인터셉터가 이미 해제했거나 직접 객체를 반환하는 경우
  return backendData as T;
}

/**
 * 백엔드 배열 응답을 프론트엔드 형식으로 변환
 *
 * 백엔드 응답 형태:
 * - { data: [...] } (감싸진 형태)
 * - { items: [...] } (페이지네이션 없는 목록)
 * - [...] (직접 배열)
 *
 * @param response 백엔드 응답
 * @returns 배열 데이터
 */
export function transformArrayResponse<T>(
  response: AxiosResponse<T[] | { data: T[] } | { items: T[] }>
): T[] {
  const backendData = response.data;

  // ResponseTransformInterceptor 래핑 해제: { success, data } 형태만 언래핑
  // 'data' in만 검사하면 엔티티 자체에 data 프로퍼티가 있을 때 이중 언래핑 위험
  if (
    backendData &&
    typeof backendData === 'object' &&
    !Array.isArray(backendData) &&
    'success' in backendData &&
    'data' in backendData
  ) {
    const unwrapped = (backendData as { data: unknown }).data;
    if (Array.isArray(unwrapped)) {
      return unwrapped as T[];
    }
  }

  // 배열이 직접 반환된 경우
  if (Array.isArray(backendData)) {
    return backendData;
  }

  // { items: [...] } 형태 (페이지네이션 없는 목록)
  if (backendData && typeof backendData === 'object' && 'items' in backendData) {
    const wrapped = backendData as { items: T[] };
    return Array.isArray(wrapped.items) ? wrapped.items : [];
  }

  // 기본값: 빈 배열
  return [];
}

/**
 * 에러를 ApiError 객체로 변환
 *
 * @param error 원본 에러
 * @returns ApiError 인스턴스
 */
export function createApiError(error: unknown): ApiError {
  // 이미 ApiError인 경우
  if (error instanceof ApiError) {
    return error;
  }

  // Axios 에러 처리
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as {
      response?: { data?: unknown; status?: number };
      code?: string;
      message?: string;
    };

    const status = axiosError.response?.status;
    const errorData = axiosError.response?.data;

    // 응답 없는 에러 (네트워크/연결 레벨 실패)
    if (!axiosError.response) {
      const code = axiosError.code;

      // 타임아웃 에러
      if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
        return new ApiError('Request timed out.', EquipmentErrorCode.TIMEOUT_ERROR);
      }

      const networkErrorCodes = [
        'ERR_NETWORK',
        'ECONNREFUSED',
        'ECONNRESET',
        'ENOTFOUND',
        'EHOSTUNREACH',
        'ENETUNREACH',
        'EPIPE',
        'EAI_AGAIN',
      ];

      if (code && networkErrorCodes.includes(code)) {
        return new ApiError(
          `Cannot connect to backend server (${code}).`,
          EquipmentErrorCode.NETWORK_ERROR
        );
      }

      return new ApiError(
        `Server connection error${code ? ` (${code})` : ''}.`,
        EquipmentErrorCode.NETWORK_ERROR
      );
    }

    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new ApiError('Request timed out.', EquipmentErrorCode.TIMEOUT_ERROR);
    }

    if (errorData && typeof errorData === 'object') {
      // 🔴 백엔드 표준 에러 응답 구조 #1: { code, message, timestamp, details }
      // 예: { code: "UNAUTHORIZED", message: "인증에 실패했습니다.", ... }
      if ('code' in errorData && 'message' in errorData) {
        const backendError = errorData as {
          code?: string;
          message?: string;
          details?: unknown;
        };

        const message = backendError.message || 'An unknown error occurred.';
        const errorCode =
          mapBackendErrorCode(backendError.code) ||
          (status ? httpStatusToErrorCode(status) : EquipmentErrorCode.UNKNOWN_ERROR);

        return new ApiError(message, errorCode, status, backendError.details);
      }

      // 백엔드 표준 에러 응답 구조 #2: { error: { code, message, details }, meta: {...} }
      if ('error' in errorData) {
        const backendError = errorData as {
          error: { code?: string; message?: string; details?: unknown };
        };
        const message = backendError.error.message || 'An unknown error occurred.';
        const errorCode =
          mapBackendErrorCode(backendError.error.code) ||
          (status ? httpStatusToErrorCode(status) : EquipmentErrorCode.UNKNOWN_ERROR);

        return new ApiError(message, errorCode, status, backendError.error.details);
      }

      // NestJS ValidationPipe 및 Zod 검증 에러 구조
      // 1. NestJS: { message: string | string[], error?: string, statusCode?: number }
      // 2. Zod: { message: string, errors: Array<{path, message, code}> }
      if ('message' in errorData) {
        const nestError = errorData as {
          message: string | string[] | null | undefined;
          error?: string;
          statusCode?: number;
          errors?: Array<{ path: string; message: string; code: string }>;
        };

        // 방어적 코드: message가 null/undefined/empty일 수 있음
        let message: string;
        let details: unknown;

        if (Array.isArray(nestError.message) && nestError.message.length > 0) {
          const filteredMessages = nestError.message.filter(
            (m): m is string => typeof m === 'string' && m.trim().length > 0
          );
          message = filteredMessages.join(', ') || 'An unknown error occurred.';
          details = filteredMessages.length > 0 ? filteredMessages : undefined;
        } else if (nestError.message && typeof nestError.message === 'string') {
          message = String(nestError.message);
        } else {
          message = nestError.error || 'An unknown error occurred.';
        }

        // ✅ Zod 검증 에러의 상세 정보 전달
        if (nestError.errors && Array.isArray(nestError.errors)) {
          details = nestError.errors;
          // 첫 번째 에러 메시지를 주 메시지로 사용 (더 구체적)
          if (nestError.errors.length > 0 && nestError.errors[0].message) {
            message = nestError.errors[0].message;
          }
        }

        const errorCode = status
          ? httpStatusToErrorCode(status)
          : EquipmentErrorCode.VALIDATION_ERROR;

        return new ApiError(message, errorCode, status, details);
      }
    }

    // HTTP 상태 코드 기반 메시지
    // TODO(i18n): Phase 3에서 errors.json의 키(VALIDATION_ERROR, UNAUTHORIZED 등)로 전환
    // 현재는 순수 유틸리티 함수로 translation context 없음 — 호출자 레벨에서 처리 예정
    if (status) {
      const errorCode = httpStatusToErrorCode(status);

      return new ApiError(getDefaultMessageForStatus(status), errorCode, status);
    }
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    // 네트워크 관련 에러 메시지 패턴
    if (error.message && (error.message.includes('Network') || error.message.includes('fetch'))) {
      return new ApiError(
        'A network error occurred. Please check your internet connection.',
        EquipmentErrorCode.NETWORK_ERROR
      );
    }

    // 🔴 방어적 코드: error.message가 없을 수 있음
    return new ApiError(
      error.message || 'An unknown error occurred.',
      EquipmentErrorCode.UNKNOWN_ERROR
    );
  }

  // 알 수 없는 에러 - 개발 모드에서 디버깅 정보 제공
  if (process.env.NODE_ENV === 'development') {
    console.error('[createApiError] Unknown error structure:', error);
  }

  return new ApiError('An unexpected error occurred.', EquipmentErrorCode.UNKNOWN_ERROR);
}
