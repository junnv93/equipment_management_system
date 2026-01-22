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
import {
  ApiError,
  EquipmentErrorCode,
  httpStatusToErrorCode,
  mapBackendErrorCode,
} from '../../errors/equipment-errors';

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
 * 에러 응답 변환 (레거시 호환용)
 *
 * @param error Axios 에러
 * @returns 표준화된 에러 객체
 * @deprecated createApiError를 사용하세요
 */
export function transformErrorResponse(error: unknown): {
  message: string;
  code?: string;
  details?: unknown;
} {
  const apiError = createApiError(error);
  return {
    message: apiError.message,
    code: apiError.code,
    details: apiError.details,
  };
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

    // 네트워크 에러 (응답 없음)
    if (!axiosError.response && axiosError.code === 'ERR_NETWORK') {
      return new ApiError(
        '서버와 연결할 수 없습니다. 인터넷 연결을 확인해주세요.',
        EquipmentErrorCode.NETWORK_ERROR
      );
    }

    // 타임아웃 에러
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new ApiError(
        '서버 응답 시간이 초과되었습니다.',
        EquipmentErrorCode.TIMEOUT_ERROR
      );
    }

    if (errorData && typeof errorData === 'object') {
      // 백엔드 표준 에러 응답 구조: { error: { code, message, details }, meta: {...} }
      if ('error' in errorData) {
        const backendError = errorData as {
          error: { code?: string; message?: string; details?: unknown };
        };
        const message = backendError.error.message || '알 수 없는 오류가 발생했습니다.';
        const errorCode = mapBackendErrorCode(backendError.error.code) ||
          (status ? httpStatusToErrorCode(status) : EquipmentErrorCode.UNKNOWN_ERROR);

        return new ApiError(
          message,
          errorCode,
          status,
          backendError.error.details
        );
      }

      // NestJS ValidationPipe 에러 구조: { message: string | string[], error?: string, statusCode?: number }
      if ('message' in errorData) {
        const nestError = errorData as {
          message: string | string[];
          error?: string;
          statusCode?: number;
        };
        const message = Array.isArray(nestError.message)
          ? nestError.message.join(', ')
          : String(nestError.message);
        const errorCode = status ? httpStatusToErrorCode(status) : EquipmentErrorCode.UNKNOWN_ERROR;

        return new ApiError(
          message,
          errorCode,
          status,
          Array.isArray(nestError.message) ? nestError.message : undefined
        );
      }
    }

    // HTTP 상태 코드 기반 메시지
    if (status) {
      const errorCode = httpStatusToErrorCode(status);
      const statusMessages: Record<number, string> = {
        400: '잘못된 요청입니다.',
        401: '인증이 필요합니다. 다시 로그인해주세요.',
        403: '이 작업을 수행할 권한이 없습니다.',
        404: '요청한 리소스를 찾을 수 없습니다.',
        409: '이미 존재하는 데이터입니다.',
        413: '파일 크기가 너무 큽니다.',
        415: '지원하지 않는 파일 형식입니다.',
        500: '서버 내부 오류가 발생했습니다.',
        502: '서버와 연결할 수 없습니다.',
        503: '서버가 일시적으로 사용 불가능합니다.',
      };

      return new ApiError(
        statusMessages[status] || '알 수 없는 오류가 발생했습니다.',
        errorCode,
        status
      );
    }
  }

  // 일반 Error 객체
  if (error instanceof Error) {
    // 네트워크 관련 에러 메시지 패턴
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return new ApiError(
        '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        EquipmentErrorCode.NETWORK_ERROR
      );
    }

    return new ApiError(
      error.message,
      EquipmentErrorCode.UNKNOWN_ERROR
    );
  }

  // 알 수 없는 에러
  return new ApiError(
    '예기치 않은 오류가 발생했습니다.',
    EquipmentErrorCode.UNKNOWN_ERROR
  );
}
