/**
 * 장비 관리 시스템 에러 정의
 *
 * ⚠️ SSOT 관계:
 * - @equipment-management/schemas의 ErrorCode: 백엔드/API 레벨 에러 코드
 * - EquipmentErrorCode: 프론트엔드 UI 레벨 에러 코드 (더 세분화된 분류)
 *
 * 에러 코드, 메시지, 해결 방법을 정의합니다.
 */

// schemas ErrorCode를 re-export하여 프론트엔드에서도 사용 가능하게 함
export { ErrorCode } from '@equipment-management/schemas';

/**
 * 프론트엔드 에러 코드 정의
 * schemas의 ErrorCode보다 더 세분화된 UI 레벨 에러 분류
 */
export enum EquipmentErrorCode {
  // 검증 에러
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD_MISSING = 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_DATE = 'INVALID_DATE',

  // 중복 에러
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  DUPLICATE_MANAGEMENT_NUMBER = 'DUPLICATE_MANAGEMENT_NUMBER',
  DUPLICATE_SERIAL_NUMBER = 'DUPLICATE_SERIAL_NUMBER',

  // 동시성 에러 (CAS / Optimistic Locking)
  VERSION_CONFLICT = 'VERSION_CONFLICT',

  // 권한 에러
  UNAUTHORIZED = 'UNAUTHORIZED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SCOPE_ACCESS_DENIED = 'SCOPE_ACCESS_DENIED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // 리소스 에러
  NOT_FOUND = 'NOT_FOUND',
  EQUIPMENT_NOT_FOUND = 'EQUIPMENT_NOT_FOUND',

  // 서버/네트워크 에러
  SERVER_ERROR = 'SERVER_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',

  // 파일 에러
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',

  // 이력 저장 에러
  HISTORY_SAVE_FAILED = 'HISTORY_SAVE_FAILED',
  CALIBRATION_SAVE_FAILED = 'CALIBRATION_SAVE_FAILED',
  LOCATION_HISTORY_SAVE_FAILED = 'LOCATION_HISTORY_SAVE_FAILED',
  MAINTENANCE_HISTORY_SAVE_FAILED = 'MAINTENANCE_HISTORY_SAVE_FAILED',
  INCIDENT_HISTORY_SAVE_FAILED = 'INCIDENT_HISTORY_SAVE_FAILED',

  // 부적합 관련
  NC_REPAIR_RECORD_REQUIRED = 'NC_REPAIR_RECORD_REQUIRED',

  // 기타
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * 에러 정보 타입
 */
export interface ErrorInfo {
  title: string;
  message: string;
  solutions: string[];
  actionLabel?: string;
  actionHref?: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * i18n 번역 함수 타입
 *
 * next-intl의 useTranslations('errors') 반환 타입과 호환
 * - t('key') → 문자열 반환
 * - t.raw('key') → JSON 원시값 반환 (배열 등)
 */
type TranslationFunction = ((key: string, values?: Record<string, unknown>) => string) & {
  raw: (key: string) => unknown;
};

/**
 * 에러 코드별 상세 정보
 *
 * @deprecated Phase 3에서 i18n 메시지(messages/ko/errors.json, messages/en/errors.json)로 완전 전환 예정.
 * 새 코드에서는 getLocalizedErrorInfo(code, t)를 사용하세요.
 */
export const ERROR_MESSAGES: Record<EquipmentErrorCode, ErrorInfo> = {
  // 검증 에러
  [EquipmentErrorCode.VALIDATION_ERROR]: {
    title: '입력 값 오류',
    message: '입력 값이 올바르지 않습니다.',
    solutions: ['빨간색으로 표시된 필드를 확인하세요', '필수 항목을 모두 입력하세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.REQUIRED_FIELD_MISSING]: {
    title: '필수 항목 누락',
    message: '필수 입력 항목이 누락되었습니다.',
    solutions: ['* 표시가 있는 필수 항목을 모두 입력하세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.INVALID_FORMAT]: {
    title: '형식 오류',
    message: '입력 형식이 올바르지 않습니다.',
    solutions: [
      '관리번호: XXX-XYYYY 형식으로 입력하세요',
      '예: SUW-E0001 (수원), UIW-E0001 (의왕)',
    ],
    severity: 'error',
  },
  [EquipmentErrorCode.INVALID_DATE]: {
    title: '날짜 형식 오류',
    message: '유효하지 않은 날짜입니다.',
    solutions: ['날짜 선택기를 사용하여 올바른 날짜를 선택하세요'],
    severity: 'error',
  },

  // 중복 에러
  [EquipmentErrorCode.DUPLICATE_ERROR]: {
    title: '중복 오류',
    message: '이미 등록된 정보입니다.',
    solutions: ['다른 값을 사용하거나 기존 데이터를 확인하세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.DUPLICATE_MANAGEMENT_NUMBER]: {
    title: '관리번호 중복',
    message: '이미 등록된 관리번호입니다.',
    solutions: ['다른 관리번호를 사용하세요', '기존 장비를 확인하려면 장비 목록에서 검색하세요'],
    actionLabel: '장비 목록에서 검색',
    actionHref: '/equipment',
    severity: 'error',
  },
  [EquipmentErrorCode.DUPLICATE_SERIAL_NUMBER]: {
    title: '일련번호 중복',
    message: '이미 등록된 일련번호입니다.',
    solutions: ['다른 일련번호를 사용하세요', '기존 장비 확인을 권장합니다'],
    actionLabel: '장비 목록에서 검색',
    actionHref: '/equipment',
    severity: 'error',
  },
  [EquipmentErrorCode.VERSION_CONFLICT]: {
    title: '데이터 충돌',
    message: '다른 사용자가 이 데이터를 수정했습니다. 최신 데이터를 불러옵니다.',
    solutions: ['페이지가 자동으로 새로고침됩니다', '새로고침 후 다시 시도해주세요'],
    severity: 'warning',
  },

  // 권한 에러
  [EquipmentErrorCode.UNAUTHORIZED]: {
    title: '인증 필요',
    message: '로그인이 필요합니다.',
    solutions: ['다시 로그인하세요'],
    actionLabel: '로그인',
    actionHref: '/login',
    severity: 'error',
  },
  [EquipmentErrorCode.PERMISSION_DENIED]: {
    title: '권한 없음',
    message: '이 작업을 수행할 권한이 없습니다.',
    solutions: [
      '해당 사이트/팀에 대한 권한이 있는지 확인하세요',
      '권한이 필요한 경우 시스템 관리자에게 문의하세요',
    ],
    severity: 'error',
  },
  [EquipmentErrorCode.SCOPE_ACCESS_DENIED]: {
    title: '접근 범위 초과',
    message: '해당 사이트/팀의 리소스에 대한 접근 권한이 없습니다.',
    solutions: [
      '본인 소속 사이트/팀의 데이터만 수정할 수 있습니다.',
      '필요시 시스템 관리자에게 문의하세요.',
    ],
    severity: 'error',
  },
  [EquipmentErrorCode.SESSION_EXPIRED]: {
    title: '세션 만료',
    message: '로그인 세션이 만료되었습니다.',
    solutions: ['다시 로그인하세요'],
    actionLabel: '로그인',
    actionHref: '/login',
    severity: 'warning',
  },

  // 리소스 에러
  [EquipmentErrorCode.NOT_FOUND]: {
    title: '찾을 수 없음',
    message: '요청한 리소스를 찾을 수 없습니다.',
    solutions: ['올바른 정보인지 확인하세요', '이미 삭제되었을 수 있습니다'],
    severity: 'error',
  },
  [EquipmentErrorCode.EQUIPMENT_NOT_FOUND]: {
    title: '장비를 찾을 수 없음',
    message: '요청한 장비를 찾을 수 없습니다.',
    solutions: ['장비 ID가 올바른지 확인하세요', '장비가 삭제되었을 수 있습니다'],
    actionLabel: '장비 목록으로',
    actionHref: '/equipment',
    severity: 'error',
  },

  // 서버/네트워크 에러
  [EquipmentErrorCode.SERVER_ERROR]: {
    title: '서버 오류',
    message: '서버에서 오류가 발생했습니다.',
    solutions: ['잠시 후 다시 시도해주세요', '문제가 지속되면 시스템 관리자에게 문의하세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.NETWORK_ERROR]: {
    title: '네트워크 오류',
    message: '서버와 연결할 수 없습니다.',
    solutions: ['인터넷 연결 상태를 확인하세요', '잠시 후 다시 시도해주세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.TIMEOUT_ERROR]: {
    title: '요청 시간 초과',
    message: '서버 응답 시간이 초과되었습니다.',
    solutions: ['잠시 후 다시 시도해주세요'],
    severity: 'warning',
  },

  // 파일 에러
  [EquipmentErrorCode.FILE_TOO_LARGE]: {
    title: '파일 크기 초과',
    message: '업로드 파일 크기가 너무 큽니다.',
    solutions: ['파일 크기를 10MB 이하로 줄여주세요', 'PDF의 경우 압축하거나 분할해주세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.INVALID_FILE_TYPE]: {
    title: '지원하지 않는 파일 형식',
    message: '업로드할 수 없는 파일 형식입니다.',
    solutions: ['허용된 파일 형식: PDF, JPG, PNG, GIF', '다른 형식의 파일은 PDF로 변환해주세요'],
    severity: 'error',
  },
  [EquipmentErrorCode.FILE_UPLOAD_FAILED]: {
    title: '파일 업로드 실패',
    message: '파일 업로드 중 오류가 발생했습니다.',
    solutions: ['파일을 다시 선택하여 업로드해주세요', '파일 크기와 형식을 확인하세요'],
    severity: 'error',
  },

  // 이력 저장 에러
  [EquipmentErrorCode.HISTORY_SAVE_FAILED]: {
    title: '이력 저장 실패',
    message: '일부 이력 정보 저장에 실패했습니다.',
    solutions: [
      '장비는 등록되었지만 이력 저장에 문제가 있습니다',
      '장비 상세 페이지에서 이력을 다시 추가해주세요',
    ],
    severity: 'warning',
  },
  [EquipmentErrorCode.CALIBRATION_SAVE_FAILED]: {
    title: '교정 이력 저장 실패',
    message: '교정 이력 저장에 실패했습니다.',
    solutions: ['교정 관리 페이지에서 다시 등록해주세요'],
    actionLabel: '교정 관리로 이동',
    actionHref: '/calibration',
    severity: 'warning',
  },
  [EquipmentErrorCode.LOCATION_HISTORY_SAVE_FAILED]: {
    title: '위치 변동 이력 저장 실패',
    message: '위치 변동 이력 저장에 실패했습니다.',
    solutions: ['장비 상세 페이지에서 이력을 다시 추가해주세요'],
    severity: 'warning',
  },
  [EquipmentErrorCode.MAINTENANCE_HISTORY_SAVE_FAILED]: {
    title: '유지보수 내역 저장 실패',
    message: '유지보수 내역 저장에 실패했습니다.',
    solutions: ['장비 상세 페이지에서 이력을 다시 추가해주세요'],
    severity: 'warning',
  },
  [EquipmentErrorCode.INCIDENT_HISTORY_SAVE_FAILED]: {
    title: '손상/수리 내역 저장 실패',
    message: '손상/수리 내역 저장에 실패했습니다.',
    solutions: ['장비 상세 페이지에서 이력을 다시 추가해주세요'],
    severity: 'warning',
  },

  // 부적합 관련
  [EquipmentErrorCode.NC_REPAIR_RECORD_REQUIRED]: {
    title: '수리 기록 필요',
    message: '손상/오작동 유형의 부적합은 수리 기록이 등록되어야 합니다.',
    solutions: [
      '장비 상세 페이지에서 수리 이력을 먼저 등록해주세요',
      '수리 이력 등록 후 부적합에 연결한 뒤 다시 시도해주세요',
    ],
    severity: 'warning',
  },

  // 기타
  [EquipmentErrorCode.UNKNOWN_ERROR]: {
    title: '알 수 없는 오류',
    message: '예기치 않은 오류가 발생했습니다.',
    solutions: ['잠시 후 다시 시도해주세요', '문제가 지속되면 시스템 관리자에게 문의하세요'],
    severity: 'error',
  },
};

/**
 * 로케일화된 에러 정보 조회
 *
 * Phase 1: ERROR_MESSAGES 폴백 사용 (i18n 인프라 준비)
 * Phase 3: useTranslations('errors') 기반 완전 전환
 *
 * @overload t 없이 호출 — 기존 ERROR_MESSAGES 폴백 (deprecated 경로)
 * @overload t 포함 호출 — i18n 메시지 사용
 *
 * @example
 * // Phase 1 (기존 호환)
 * const info = getLocalizedErrorInfo(code);
 *
 * // Phase 3 (i18n)
 * const t = useTranslations('errors');
 * const info = getLocalizedErrorInfo(code, t);
 */
export function getLocalizedErrorInfo(code: EquipmentErrorCode): ErrorInfo;
export function getLocalizedErrorInfo(code: EquipmentErrorCode, t: TranslationFunction): ErrorInfo;
export function getLocalizedErrorInfo(
  code: EquipmentErrorCode,
  t?: TranslationFunction
): ErrorInfo {
  const fallback = ERROR_MESSAGES[code] || ERROR_MESSAGES[EquipmentErrorCode.UNKNOWN_ERROR];

  // i18n 모드: t 함수가 제공된 경우
  if (t) {
    let solutions: string[] = [];
    try {
      const rawSolutions = t.raw(`${code}.solutions`);
      solutions = Array.isArray(rawSolutions) ? (rawSolutions as string[]) : [];
    } catch {
      solutions = fallback.solutions;
    }

    let actionLabel: string | undefined;
    try {
      const raw = t.raw(`${code}.actionLabel`);
      actionLabel = typeof raw === 'string' ? raw : undefined;
    } catch {
      actionLabel = fallback.actionLabel;
    }

    return {
      title: t(`${code}.title`),
      message: t(`${code}.message`),
      solutions,
      actionLabel,
      actionHref: fallback.actionHref,
      severity: fallback.severity,
    };
  }
  // 폴백: 기존 ERROR_MESSAGES 사용
  return fallback;
}

/**
 * API 에러 클래스
 *
 * 상세 에러 정보를 포함한 커스텀 에러 클래스
 */
export class ApiError extends Error {
  public readonly code: EquipmentErrorCode;
  public readonly statusCode?: number;
  public readonly details?: unknown;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: EquipmentErrorCode = EquipmentErrorCode.UNKNOWN_ERROR,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.timestamp = new Date();
  }

  /**
   * 에러 정보 조회
   */
  getErrorInfo(): ErrorInfo {
    return ERROR_MESSAGES[this.code] || ERROR_MESSAGES[EquipmentErrorCode.UNKNOWN_ERROR];
  }

  /**
   * 사용자에게 표시할 메시지 조회
   */
  getUserMessage(): string {
    const info = this.getErrorInfo();
    return this.message || info.message;
  }
}

/**
 * HTTP 상태 코드를 에러 코드로 변환
 */
export function httpStatusToErrorCode(status: number): EquipmentErrorCode {
  switch (status) {
    case 400:
      return EquipmentErrorCode.VALIDATION_ERROR;
    case 401:
      return EquipmentErrorCode.UNAUTHORIZED;
    case 403:
      return EquipmentErrorCode.PERMISSION_DENIED;
    case 404:
      return EquipmentErrorCode.NOT_FOUND;
    case 408:
      return EquipmentErrorCode.TIMEOUT_ERROR;
    case 409:
      return EquipmentErrorCode.DUPLICATE_ERROR;
    case 413:
      return EquipmentErrorCode.FILE_TOO_LARGE;
    case 415:
      return EquipmentErrorCode.INVALID_FILE_TYPE;
    case 500:
    case 502:
    case 503:
      return EquipmentErrorCode.SERVER_ERROR;
    default:
      return EquipmentErrorCode.UNKNOWN_ERROR;
  }
}

/**
 * ErrorCode → HTTP Status 매핑 (getStatusFromCode의 SSOT)
 *
 * httpStatusToErrorCode()의 역매핑. error.ts에서 참조.
 */
export const ERROR_CODE_TO_HTTP_STATUS: Partial<Record<EquipmentErrorCode, number>> = {
  [EquipmentErrorCode.NOT_FOUND]: 404,
  [EquipmentErrorCode.EQUIPMENT_NOT_FOUND]: 404,
  [EquipmentErrorCode.UNAUTHORIZED]: 401,
  [EquipmentErrorCode.SESSION_EXPIRED]: 401,
  [EquipmentErrorCode.PERMISSION_DENIED]: 403,
  [EquipmentErrorCode.SCOPE_ACCESS_DENIED]: 403,
  [EquipmentErrorCode.VALIDATION_ERROR]: 400,
  [EquipmentErrorCode.REQUIRED_FIELD_MISSING]: 400,
  [EquipmentErrorCode.INVALID_FORMAT]: 400,
  [EquipmentErrorCode.INVALID_DATE]: 400,
  [EquipmentErrorCode.DUPLICATE_ERROR]: 409,
  [EquipmentErrorCode.DUPLICATE_MANAGEMENT_NUMBER]: 409,
  [EquipmentErrorCode.DUPLICATE_SERIAL_NUMBER]: 409,
  [EquipmentErrorCode.VERSION_CONFLICT]: 409,
  [EquipmentErrorCode.SERVER_ERROR]: 500,
  [EquipmentErrorCode.NETWORK_ERROR]: 0,
  [EquipmentErrorCode.TIMEOUT_ERROR]: 408,
  [EquipmentErrorCode.FILE_TOO_LARGE]: 413,
  [EquipmentErrorCode.INVALID_FILE_TYPE]: 415,
};

/**
 * 백엔드 에러 코드를 프론트엔드 에러 코드로 매핑
 */
export function mapBackendErrorCode(backendCode?: string): EquipmentErrorCode {
  if (!backendCode) return EquipmentErrorCode.UNKNOWN_ERROR;

  // 백엔드 에러 코드 매핑 (대소문자 무시)
  const normalizedCode = backendCode.toUpperCase();

  const mappings: Record<string, EquipmentErrorCode> = {
    // 중복 에러
    DUPLICATE_MANAGEMENT_NUMBER: EquipmentErrorCode.DUPLICATE_MANAGEMENT_NUMBER,
    DUPLICATE_SERIAL_NUMBER: EquipmentErrorCode.DUPLICATE_SERIAL_NUMBER,
    DUPLICATE_ERROR: EquipmentErrorCode.DUPLICATE_ERROR,
    CONFLICT: EquipmentErrorCode.DUPLICATE_ERROR,
    VERSION_CONFLICT: EquipmentErrorCode.VERSION_CONFLICT,

    // 검증 에러
    VALIDATION_ERROR: EquipmentErrorCode.VALIDATION_ERROR,
    BAD_REQUEST: EquipmentErrorCode.VALIDATION_ERROR,
    INVALID_INPUT: EquipmentErrorCode.VALIDATION_ERROR,

    // 권한 에러
    UNAUTHORIZED: EquipmentErrorCode.UNAUTHORIZED,
    FORBIDDEN: EquipmentErrorCode.PERMISSION_DENIED,
    PERMISSION_DENIED: EquipmentErrorCode.PERMISSION_DENIED,
    ACCESS_DENIED: EquipmentErrorCode.PERMISSION_DENIED,
    SCOPE_ACCESS_DENIED: EquipmentErrorCode.SCOPE_ACCESS_DENIED,

    // 리소스 에러
    NOT_FOUND: EquipmentErrorCode.NOT_FOUND,
    EQUIPMENT_NOT_FOUND: EquipmentErrorCode.EQUIPMENT_NOT_FOUND,

    // 파일 에러
    FILE_TOO_LARGE: EquipmentErrorCode.FILE_TOO_LARGE,
    PAYLOAD_TOO_LARGE: EquipmentErrorCode.FILE_TOO_LARGE,
    INVALID_FILE_TYPE: EquipmentErrorCode.INVALID_FILE_TYPE,
    UNSUPPORTED_MEDIA_TYPE: EquipmentErrorCode.INVALID_FILE_TYPE,

    // 서버 에러
    INTERNAL_SERVER_ERROR: EquipmentErrorCode.SERVER_ERROR,
    SERVER_ERROR: EquipmentErrorCode.SERVER_ERROR,

    // 부적합 에러
    NC_REPAIR_RECORD_REQUIRED: EquipmentErrorCode.NC_REPAIR_RECORD_REQUIRED,
  };

  return mappings[normalizedCode] || EquipmentErrorCode.UNKNOWN_ERROR;
}

/**
 * 부분 성공 결과 타입
 */
export interface PartialSuccessResult {
  success: boolean;
  equipmentUuid?: string;
  failedHistories: {
    type: 'location' | 'maintenance' | 'incident' | 'calibration';
    index: number;
    error: string;
  }[];
}

/**
 * 에러가 재시도 가능한지 확인
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const retryableCodes: EquipmentErrorCode[] = [
      EquipmentErrorCode.NETWORK_ERROR,
      EquipmentErrorCode.TIMEOUT_ERROR,
      EquipmentErrorCode.SERVER_ERROR,
    ];
    return retryableCodes.includes(error.code);
  }
  return false;
}

/**
 * 에러가 409 충돌(CAS / 중복) 관련인지 확인
 */
export function isConflictError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return (
      error.statusCode === 409 ||
      error.code === EquipmentErrorCode.VERSION_CONFLICT ||
      error.code === EquipmentErrorCode.DUPLICATE_ERROR
    );
  }
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    if (errorObj.statusCode === 409 || errorObj.status === 409) return true;
    if (errorObj.code === 'VERSION_CONFLICT' || errorObj.code === 'CONFLICT') return true;
  }
  return false;
}

/**
 * 에러가 인증 관련인지 확인
 */
export function isAuthError(error: unknown): boolean {
  if (error instanceof ApiError) {
    const authCodes: EquipmentErrorCode[] = [
      EquipmentErrorCode.UNAUTHORIZED,
      EquipmentErrorCode.SESSION_EXPIRED,
    ];
    return authCodes.includes(error.code);
  }
  return false;
}
