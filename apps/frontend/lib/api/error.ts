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
  ERROR_CODE_TO_HTTP_STATUS,
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
      equipmentApiError.message || 'An unknown error occurred.',
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
 *
 * SSOT: equipment-errors.ts의 ERROR_CODE_TO_HTTP_STATUS 참조
 * 백엔드 code 문자열 → mapBackendErrorCode → EquipmentErrorCode → HTTP status
 */
function getStatusFromCode(code: string): number {
  const errorCode = mapBackendErrorCode(code);
  return ERROR_CODE_TO_HTTP_STATUS[errorCode] ?? 500;
}

/**
 * HTTP 상태 코드에 대한 기본 메시지
 *
 * SSOT: 이 함수가 유일한 정의. response-transformers.ts에서도 import하여 사용.
 *
 * i18n 지원: t 함수 전달 시 errors.json의 httpStatus 키 사용.
 * t 미전달 시 영어 폴백 (순수 유틸리티 함수 호환).
 *
 * @param status - HTTP 상태 코드
 * @param t - next-intl useTranslations('errors') 반환값 (선택)
 */
export function getDefaultMessageForStatus(status: number, t?: (key: string) => string): string {
  if (t) {
    try {
      return t(`httpStatus.${status}`);
    } catch {
      return t('httpStatus.unknown');
    }
  }

  const statusMessages: Record<number, string> = {
    400: 'Bad request.',
    401: 'Authentication required. Please log in again.',
    403: 'You do not have permission to perform this action.',
    404: 'The requested resource was not found.',
    409: 'Another user has modified this data. Please check the latest data.',
    413: 'File size is too large.',
    415: 'Unsupported file format.',
    500: 'An internal server error occurred.',
    502: 'Cannot connect to the server.',
    503: 'The server is temporarily unavailable.',
  };
  return statusMessages[status] || 'An unknown error occurred.';
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
export function getErrorMessage(error: unknown, defaultMessage = 'An error occurred.'): string {
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
 * 백엔드가 내려준 원본 에러 코드(`code` 필드)를 추출합니다.
 *
 * `toApiError`가 `mapBackendErrorCode`로 프론트엔드 EquipmentErrorCode에 매핑해 덮어쓰기 전에,
 * 원본 백엔드 코드(예: `FORM_NUMBER_ALREADY_EXISTS`)를 그대로 얻고 싶을 때 사용합니다.
 * 모듈별로 자신의 에러 코드 → i18n 키 매핑을 유지하기 위한 SSOT 진입점.
 */
export function getBackendErrorCode(error: unknown): string | undefined {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    typeof (error as Record<string, unknown>).response === 'object'
  ) {
    const axiosError = error as {
      response?: { data?: { code?: unknown } };
    };
    const code = axiosError.response?.data?.code;
    return typeof code === 'string' ? code : undefined;
  }
  // ApiError 인스턴스에서도 꺼내기
  if (error instanceof ApiError) return error.code;
  return undefined;
}

/**
 * 백엔드 에러 코드를 i18n 키로 번역하는 고차 유틸리티.
 *
 * 모듈별로 `{ [ErrorCode]: 'i18nKey' }` 매핑을 전달하면, 매칭되는 코드가 있을 때
 * 해당 번역을 반환하고 없으면 `getErrorMessage(error)` 또는 `fallbackKey` 번역으로 폴백합니다.
 *
 * 에러 처리 로직이 분산되지 않고, 각 모듈이 자기 에러 맥락만 선언하면 되도록 설계되었습니다.
 *
 * @example
 * ```ts
 * const msg = translateApiError(error, t, {
 *   codeMap: { FORM_NUMBER_ALREADY_EXISTS: 'uploadDialog.errorNumberExists' },
 *   fallbackKey: 'uploadDialog.error',
 * });
 * toast.error(msg);
 * ```
 */
export function translateApiError(
  error: unknown,
  t: (key: string) => string,
  options: {
    codeMap?: Readonly<Record<string, string>>;
    fallbackKey?: string;
  } = {}
): string {
  const { codeMap, fallbackKey } = options;
  const backendCode = getBackendErrorCode(error);
  if (backendCode && codeMap && codeMap[backendCode]) {
    return t(codeMap[backendCode]);
  }
  if (fallbackKey) {
    // t()가 키 없을 때 키 문자열을 반환하는 next-intl 기본값을 받아들입니다.
    const translated = t(fallbackKey);
    if (translated && translated !== fallbackKey) return translated;
  }
  return getErrorMessage(error);
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
