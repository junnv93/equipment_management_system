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
  response: AxiosResponse<PaginatedListResponse<T> & { summary?: any }>
): FrontendPaginatedResponse<T> {
  const backendData = response.data;

  // 백엔드 응답 구조 확인
  if (backendData && 'items' in backendData && 'meta' in backendData) {
    const result: FrontendPaginatedResponse<T> = {
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

    // ✅ 성능 최적화: summary 필드가 있으면 보존
    if ('summary' in backendData && backendData.summary) {
      result.meta.summary = backendData.summary;
    }

    return result;
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

  // 배열이 직접 반환된 경우
  if (Array.isArray(backendData)) {
    return backendData;
  }

  // { data: [...] } 형태
  if (backendData && typeof backendData === 'object' && 'data' in backendData) {
    const wrapped = backendData as { data: T[] };
    return Array.isArray(wrapped.data) ? wrapped.data : [];
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
        return new ApiError('서버 응답 시간이 초과되었습니다.', EquipmentErrorCode.TIMEOUT_ERROR);
      }

      // 네트워크/연결 에러 (브라우저: ERR_NETWORK, Node.js: ECONNREFUSED 등)
      const networkErrorCodes = [
        'ERR_NETWORK', // Axios 브라우저 네트워크 에러
        'ECONNREFUSED', // Node.js: 연결 거부 (백엔드 다운)
        'ECONNRESET', // Node.js: 연결 리셋
        'ENOTFOUND', // Node.js: DNS 조회 실패
        'EHOSTUNREACH', // Node.js: 호스트 도달 불가
        'ENETUNREACH', // Node.js: 네트워크 도달 불가
        'EPIPE', // Node.js: 파이프 끊김
        'EAI_AGAIN', // Node.js: DNS 일시 실패
      ];

      if (code && networkErrorCodes.includes(code)) {
        return new ApiError(
          `백엔드 서버에 연결할 수 없습니다 (${code}). 서버가 실행 중인지 확인해주세요.`,
          EquipmentErrorCode.NETWORK_ERROR
        );
      }

      // 기타 응답 없는 에러 (코드가 없거나 알 수 없는 코드)
      return new ApiError(
        `서버 연결 오류가 발생했습니다${code ? ` (${code})` : ''}. 잠시 후 다시 시도해주세요.`,
        EquipmentErrorCode.NETWORK_ERROR
      );
    }

    // 타임아웃 에러 (응답이 있는 경우에도 코드로 확인)
    if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
      return new ApiError('서버 응답 시간이 초과되었습니다.', EquipmentErrorCode.TIMEOUT_ERROR);
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

        const message = backendError.message || '알 수 없는 오류가 발생했습니다.';
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
        const message = backendError.error.message || '알 수 없는 오류가 발생했습니다.';
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
          message = filteredMessages.join(', ') || '알 수 없는 오류가 발생했습니다.';
          details = filteredMessages.length > 0 ? filteredMessages : undefined;
        } else if (nestError.message && typeof nestError.message === 'string') {
          message = String(nestError.message);
        } else {
          message = nestError.error || '알 수 없는 오류가 발생했습니다.';
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
    if (error.message && (error.message.includes('Network') || error.message.includes('fetch'))) {
      return new ApiError(
        '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        EquipmentErrorCode.NETWORK_ERROR
      );
    }

    // 🔴 방어적 코드: error.message가 없을 수 있음
    return new ApiError(
      error.message || '알 수 없는 오류가 발생했습니다.',
      EquipmentErrorCode.UNKNOWN_ERROR
    );
  }

  // 알 수 없는 에러 - 개발 모드에서 디버깅 정보 제공
  if (process.env.NODE_ENV === 'development') {
    console.error('[createApiError] 알 수 없는 에러 구조:', error);
  }

  return new ApiError('예기치 않은 오류가 발생했습니다.', EquipmentErrorCode.UNKNOWN_ERROR);
}
