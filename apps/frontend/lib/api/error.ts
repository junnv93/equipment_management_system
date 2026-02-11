/**
 * API 에러 타입 정의 및 유틸리티
 *
 * ⚠️ IMPORTANT: Single Source of Truth
 * - ApiError 클래스는 equipment-errors.ts에서 정의
 * - 이 파일은 공통 유틸리티만 제공
 * - 두 개의 ApiError 클래스 충돌 방지
 *
 * Next.js 16 Best Practice:
 * - any 타입 사용 금지
 * - 타입 안전한 에러 처리
 */

// ✅ equipment-errors.ts의 ApiError를 re-export (단일 소스)
export {
  ApiError,
  EquipmentErrorCode,
  httpStatusToErrorCode,
  mapBackendErrorCode,
  ERROR_MESSAGES,
  isRetryableError,
  isAuthError,
  type ErrorInfo,
} from '../errors/equipment-errors';

export { isConflictError } from '../errors/equipment-errors';

import {
  ApiError,
  EquipmentErrorCode,
  httpStatusToErrorCode,
  mapBackendErrorCode,
} from '../errors/equipment-errors';

/**
 * API 에러 응답 인터페이스 (레거시 호환용)
 */
export interface ApiErrorResponse {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * unknown 에러를 ApiError로 변환 시도
 *
 * 다양한 에러 형식을 처리:
 * 1. 이미 ApiError 인스턴스인 경우
 * 2. Axios 에러 형식
 * 3. fetch API 에러 형식
 * 4. 일반 Error 객체
 *
 * @param error - 알 수 없는 에러 객체
 * @returns ApiError 인스턴스 또는 null
 */
export function toApiError(error: unknown): ApiError | null {
  // 1. 이미 ApiError인 경우
  if (error instanceof ApiError) {
    return error;
  }

  // 2. equipment-errors.ts의 ApiError 형식 처리 (name='ApiError', code 프로퍼티)
  if (
    typeof error === 'object' &&
    error !== null &&
    error instanceof Error &&
    error.name === 'ApiError' &&
    'code' in error
  ) {
    const equipmentApiError = error as {
      code: string;
      statusCode?: number;
      message: string;
      details?: unknown;
    };

    // statusCode 또는 code로부터 status 추론
    const status = equipmentApiError.statusCode ?? getStatusFromCode(equipmentApiError.code);

    return new ApiError(
      equipmentApiError.message || '알 수 없는 오류가 발생했습니다.',
      equipmentApiError.code as EquipmentErrorCode,
      status,
      equipmentApiError.details
    );
  }

  // 3. Axios 에러 형식 처리
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object'
  ) {
    const axiosError = error as {
      response?: {
        status?: number;
        data?: {
          code?: string;
          message?: string;
          details?: unknown;
        };
      };
    };

    if (axiosError.response?.status) {
      const status = axiosError.response.status;
      // Prefer backend error code (e.g., VERSION_CONFLICT) over HTTP status mapping
      const backendCode = axiosError.response.data?.code;
      const mappedCode = backendCode
        ? mapBackendErrorCode(backendCode)
        : EquipmentErrorCode.UNKNOWN_ERROR;
      const errorCode =
        mappedCode !== EquipmentErrorCode.UNKNOWN_ERROR
          ? mappedCode
          : httpStatusToErrorCode(status);

      return new ApiError(
        axiosError.response.data?.message || getDefaultMessageForStatus(status),
        errorCode,
        status,
        axiosError.response.data?.details
      );
    }
  }

  // 4. fetch API 에러 형식 처리 (status 프로퍼티)
  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    typeof (error as Record<string, unknown>).status === 'number'
  ) {
    const fetchError = error as {
      status: number;
      code?: string;
      message?: string;
    };

    const errorCode = fetchError.code
      ? (fetchError.code as EquipmentErrorCode)
      : httpStatusToErrorCode(fetchError.status);

    return new ApiError(
      fetchError.message || getDefaultMessageForStatus(fetchError.status),
      errorCode,
      fetchError.status
    );
  }

  // 5. 일반 Error 객체
  if (error instanceof Error) {
    return new ApiError(error.message, EquipmentErrorCode.UNKNOWN_ERROR);
  }

  return null;
}

/**
 * 에러 코드에서 HTTP 상태 코드 추론
 */
function getStatusFromCode(code: string): number {
  const codeToStatus: Record<string, number> = {
    NOT_FOUND: 404,
    EQUIPMENT_NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    SESSION_EXPIRED: 401,
    PERMISSION_DENIED: 403,
    FORBIDDEN: 403,
    VALIDATION_ERROR: 400,
    BAD_REQUEST: 400,
    REQUIRED_FIELD_MISSING: 400,
    INVALID_FORMAT: 400,
    INVALID_DATE: 400,
    DUPLICATE_ERROR: 409,
    DUPLICATE_MANAGEMENT_NUMBER: 409,
    DUPLICATE_SERIAL_NUMBER: 409,
    CONFLICT: 409,
    VERSION_CONFLICT: 409,
    SERVER_ERROR: 500,
    NETWORK_ERROR: 0,
    TIMEOUT_ERROR: 408,
    FILE_TOO_LARGE: 413,
    INVALID_FILE_TYPE: 415,
  };
  return codeToStatus[code] ?? 500;
}

/**
 * HTTP 상태 코드에 대한 기본 메시지
 */
function getDefaultMessageForStatus(status: number): string {
  const statusMessages: Record<number, string> = {
    400: '잘못된 요청입니다.',
    401: '인증이 필요합니다. 다시 로그인해주세요.',
    403: '이 작업을 수행할 권한이 없습니다.',
    404: '요청한 리소스를 찾을 수 없습니다.',
    409: '다른 사용자가 이 데이터를 수정했습니다. 최신 데이터를 확인해주세요.',
    413: '파일 크기가 너무 큽니다.',
    415: '지원하지 않는 파일 형식입니다.',
    500: '서버 내부 오류가 발생했습니다.',
    502: '서버와 연결할 수 없습니다.',
    503: '서버가 일시적으로 사용 불가능합니다.',
  };
  return statusMessages[status] || '알 수 없는 오류가 발생했습니다.';
}

/**
 * 에러가 API 에러인지 확인하는 타입 가드
 *
 * @param error - 알 수 없는 에러 객체
 * @returns error가 ApiError 형식인지 여부
 */
export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

/**
 * 에러에서 사용자 친화적인 메시지 추출
 *
 * @param error - 알 수 없는 에러 객체
 * @param defaultMessage - 기본 메시지
 * @returns 사용자에게 표시할 메시지
 */
export function getErrorMessage(error: unknown, defaultMessage = '오류가 발생했습니다.'): string {
  // ApiError인 경우 getUserMessage 사용
  if (error instanceof ApiError) {
    return error.getUserMessage();
  }

  // 변환 시도
  const apiError = toApiError(error);
  if (apiError) {
    return apiError.getUserMessage();
  }

  // 일반 Error
  if (error instanceof Error) {
    return error.message;
  }

  return defaultMessage;
}

/**
 * 404 에러인지 확인
 *
 * @param error - 알 수 없는 에러 객체
 * @returns 404 에러 여부
 */
export function isNotFoundError(error: unknown): boolean {
  // ApiError 인스턴스 체크
  if (error instanceof ApiError) {
    return (
      error.statusCode === 404 ||
      error.code === EquipmentErrorCode.NOT_FOUND ||
      error.code === EquipmentErrorCode.EQUIPMENT_NOT_FOUND
    );
  }

  // 변환 후 체크
  const apiError = toApiError(error);
  if (apiError) {
    return (
      apiError.statusCode === 404 ||
      apiError.code === EquipmentErrorCode.NOT_FOUND ||
      apiError.code === EquipmentErrorCode.EQUIPMENT_NOT_FOUND
    );
  }

  // 에러 객체에 직접 statusCode 또는 code가 있는 경우
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.statusCode === 404 || errorObj.status === 404) {
      return true;
    }
    if (errorObj.code === 'NOT_FOUND' || errorObj.code === 'EQUIPMENT_NOT_FOUND') {
      return true;
    }
  }

  return false;
}

/**
 * 401 에러인지 확인
 *
 * @param error - 알 수 없는 에러 객체
 * @returns 401 에러 여부
 */
export function isUnauthorizedError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.statusCode === 401 ||
      error.code === EquipmentErrorCode.UNAUTHORIZED ||
      error.code === EquipmentErrorCode.SESSION_EXPIRED
    );
  }

  const apiError = toApiError(error);
  if (apiError) {
    return (
      apiError.statusCode === 401 ||
      apiError.code === EquipmentErrorCode.UNAUTHORIZED ||
      apiError.code === EquipmentErrorCode.SESSION_EXPIRED
    );
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.statusCode === 401 || errorObj.status === 401) {
      return true;
    }
  }

  return false;
}

/**
 * 403 에러인지 확인
 *
 * @param error - 알 수 없는 에러 객체
 * @returns 403 에러 여부
 */
export function isForbiddenError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.statusCode === 403 || error.code === EquipmentErrorCode.PERMISSION_DENIED;
  }

  const apiError = toApiError(error);
  if (apiError) {
    return apiError.statusCode === 403 || apiError.code === EquipmentErrorCode.PERMISSION_DENIED;
  }

  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.statusCode === 403 || errorObj.status === 403) {
      return true;
    }
  }

  return false;
}
